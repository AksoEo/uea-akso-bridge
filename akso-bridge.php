<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use Grav\Common\Uri;
use RocketTheme\Toolbox\Event\Event;
use Grav\Common\Page\Page;
use Grav\Common\Helpers\Excerpts;
use Grav\Plugin\AksoBridge\MarkdownExt;
use Grav\Plugin\AksoBridge\AppBridge;
use Grav\Plugin\AksoBridge\CongressRegistrationForm;

// TODO: pass host to bridge as Host header

/**
 * Class AksoBridgePlugin
 * @package Grav\Plugin
 */
class AksoBridgePlugin extends Plugin {
    public static function getSubscribedEvents() {
        return [
            'onPluginsInitialized' => ['onPluginsInitialized', 0],
            'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0],
            'onTwigSiteVariables' => ['onTwigSiteVariables', 0],
            'onMarkdownInitialized' => ['onMarkdownInitialized', 0],
            'onPageContentProcessed' => ['onPageContentProcessed', 0],
            'onOutputGenerated' => ['onOutputGenerated', 0],
        ];
    }

    const CONGRESS_REGISTRATION_PATH = 'alighilo';
    const CONGRESS_REGISTRATION_DATAID = 'dataId';
    const CONGRESS_REGISTRATION_CANCEL = 'cancel';
    const CONGRESS_REGISTRATION_VALIDATE = 'validate';
    const CONGRESS_REGISTRATION_REALLY_CANCEL = 'really_cancel';

    // allow access to protected property
    public function getGrav() {
        return $this->grav;
    }

    public $locale;

    // called at the beginning at some point
    public function onPluginsInitialized() {
        require_once __DIR__ . '/vendor/autoload.php';
        require_once __DIR__ . '/aksobridged/php/vendor/autoload.php';
        require_once __DIR__ . '/aksobridged/php/src/AksoBridge.php';

        $this->locale = parse_ini_file(dirname(__FILE__) . '/locale.ini', true);

        // get request uri
        $uri = $this->grav['uri'];
        $this->path = $uri->path();

        // get config variables
        $this->loginPath = $this->grav['config']->get('plugins.akso-bridge.login_path');
        $this->logoutPath = $this->grav['config']->get('plugins.akso-bridge.logout_path');
        $this->apiHost = $this->grav['config']->get('plugins.akso-bridge.api_host');

        // Don't proceed if we are in the admin plugin
        if ($this->isAdmin()) {
            $this->enable([
                'onGetPageBlueprints' => ['onGetPageBlueprints', 0],
                'onGetPageTemplates' => ['onGetPageTemplates', 0],
                'onPagesInitialized' => ['onAdminPageInitialized', 0],
            ]);
            return;
        }

        // run AKSO bridge
        $this->runUserBridge();

        if ($this->path === $this->loginPath) {
            // path matches; add the login page
            $this->enable([
                'onPagesInitialized' => ['addLoginPage', 0],
            ]);
            return;
        }

        $this->enable([
            'onPagesInitialized' => ['addPages', 0],
        ]);
    }

    // add blueprints and page templates (admin page)
    public function onGetPageBlueprints(Event $event) {
        $types = $event->types;
        $types->scanBlueprints('plugin://' . $this->name . '/blueprints');
    }
    public function onGetPageTemplates(Event $event) {
        $types = $event->types;
        $types->scanTemplates('plugin://' . $this->name . '/public_templates');
    }

    // akso bridge connection
    private $bridge = null;
    // if set, will contain info on the akso user
    // an array with keys 'id', 'uea'
    public $aksoUser = null;
    private $aksoUserFormattedName = null;

    // will redirect after closing the bridge and setting cookies if not null
    private $redirectStatus = null;
    private $redirectTarget = null;

    // page state for twig variables; see impl for details
    private $pageState = null;

    private function runUserBridge() {
        $this->bridge = new \AksoBridge(__DIR__ . '/aksobridged/aksobridge');

        // basic default state so stuff doesn’t error
        $this->pageState = array('state' => '');

        $ip = Uri::ip();
        if ($ip === 'UNKNOWN') {
            // i don't know why this happens
            // so if it does just fall back to the $_SERVER value
            $ip = $_SERVER['REMOTE_ADDR'];
        }

        $cookies = $_COOKIE;

        // php renames cookies with a . in the name
        // so we need to fix that before passing cookies to the api
        if (isset($cookies['akso_session_sig'])) {
            $cookies['akso_session.sig'] = $cookies['akso_session_sig'];
            unset($cookies['akso_session_sig']);
        }

        $isLogin = $this->path === $this->loginPath && $_SERVER['REQUEST_METHOD'] === 'POST';
        if (isset($cookies['akso_session']) || $isLogin) {
            // run akso user bridge if this is the login page or if there's a session cookie

            $aksoUserState = $this->bridge->open($this->apiHost, $ip, $cookies);
            if ($aksoUserState['auth']) {
                $this->aksoUser = $aksoUserState;
            }

            $this->updateAksoState();

            $this->updateFormattedName();

            $this->bridge->close();
        }

        foreach ($this->bridge->setCookies as $cookie) {
            header('Set-Cookie: ' . $cookie, FALSE);
        }

        if ($this->redirectTarget !== null) {
            $this->grav->redirectLangSafe($this->redirectTarget, $this->redirectStatus);
        }
    }

    // updates AKSO state, handling the current page/action etc
    private function updateAksoState() {
        if ($this->aksoUser !== null && $this->aksoUser['totp']) {
            // user is logged in and needs to still use totp
            if ($this->path !== $this->loginPath && $this->path !== $this->logoutPath) {
                // redirect to login path if the user isn’t already there
                $this->redirectTarget = $this->loginPath;
                $this->redirectStatus = 303;
                return;
            }
        }

        if ($this->path === $this->loginPath && $_SERVER['REQUEST_METHOD'] === 'POST') {
            // user login
            $post = !empty($_POST) ? $_POST : [];
            // TODO: use a form nonce

            $rpath = '/';
            if (isset($post['return'])) {
                // if return is a valid-ish path, set it as the return path
                if (strpos($post['return'], '/') == 0) $rpath = $post['return'];
            }

            if (isset($post['termsofservice']) || (isset($post['email']) && $post['email'] !== '')) {
                // these inputs were invisible and shouldn't've been triggered
                // so this was probably a spam bot
                $this->pageState = array(
                    'state' => 'login-error',
                    'isBad' => true,
                    'isEmail' => false,
                    'username' => 'roboto',
                    'noPassword' => false,
                );
                return;
            }

            if ($this->aksoUser !== null && $this->aksoUser['totp'] && isset($post['totp'])) {
                $remember = isset($post['remember']);
                $result = $this->bridge->totp($post['totp'], $remember);

                if ($result['s']) {
                    $this->redirectTarget = $rpath;
                    $this->redirectStatus = 303;
                } else {
                    $this->pageState = array(
                        'state' => 'totp-error',
                        'bad' => $result['bad'],
                        'nosx' => $result['nosx'],
                    );
                }
            } else {
                if (!isset($post['username']) || !isset($post['password'])) {
                    die(401);
                }

                $result = $this->bridge->login($post['username'], $post['password']);

                if ($result['s']) {
                    $this->aksoUser = $result;

                    if (!$result['totp']) {
                        // redirect to return page unless user still needs to use totp
                        $this->redirectTarget = $rpath;
                        $this->redirectStatus = 303;
                    }
                } else {
                    $this->pageState = array(
                        'state' => 'login-error',
                        'isEmail' => strpos($post['username'], '@') !== false,
                        'username' => $post['username'],
                        'noPassword' => $result['nopw']
                    );
                }
            }
        } else if ($this->path === $this->logoutPath) {
            $result = $this->bridge->logout();
            if ($result['s']) {
                $this->aksoUser = null;
                $this->redirectTarget = $this->getReferrerPath();
                $this->redirectStatus = 303;
            }
        }
    }

    private function updateFormattedName() {
        if ($this->aksoUser) {
            $res = $this->bridge->get('codeholders/self', array(
                'fields' => [
                    'firstName',
                    'lastName',
                    'firstNameLegal',
                    'lastNameLegal',
                    'honorific',
                    'fullName',
                    'fullNameLocal',
                    'nameAbbrev'
                ]
            ));
            if ($res['k']) {
                $data = $res['b'];
                $isOrg = isset($data['fullName']);
                if ($isOrg) {
                    $this->aksoUserFormattedName = $data['fullName'];
                    if (isset($data['nameAbbrev']) && strlen($data['fullName']) > 16) {
                        $this->aksoUserFormattedName = $data['nameAbbrev'];
                    }
                } else {
                    $this->aksoUserFormattedName = '';
                    if (isset($data['honorific'])) {
                        $this->aksoUserFormattedName .= $data['honorific'] . ' ';
                    }
                    if (isset($data['firstName'])) {
                        $this->aksoUserFormattedName .= $data['firstName'] . ' ';
                    } else {
                        $this->aksoUserFormattedName .= $data['firstNameLegal'] . ' ';
                    }
                    if (isset($data['lastName'])) {
                        $this->aksoUserFormattedName .= $data['lastName'];
                    } else if (isset($data['lastNameLegal'])) {
                        $this->aksoUserFormattedName .= $data['lastNameLegal'];
                    }
                }
            } else {
                $this->aksoUserFormattedName = $this->aksoUser['uea'];
            }
        }
    }

    // add various pages to grav
    // i’m not sure why these work the way they do
    public function addPages() {
        $pages = $this->grav['pages'];
        $currentPath = $this->grav['uri']->path();

        foreach ($pages->all() as $page) {
            if ($page->template() === 'akso_congress_instance') {
                // you can't add more than 1 page with the same SplFileInfo, otherwise *weird*
                // *things* will happen.
                // so we'll only add the registration page if we're currently *on* that page
                $regPath = $page->route() . '/' . self::CONGRESS_REGISTRATION_PATH;
                if (substr($currentPath, 0, strlen($regPath)) !== $regPath) continue;

                $regPage = new Page();
                $regPage->init(new \SplFileInfo(__DIR__ . '/pages/akso_congress_registration.md'));
                $regPage->slug(basename($regPath));
                $regPageHeader = $regPage->header();
                // copy congress instance id from the congress page into the sign-up page
                $regPageHeader->congress_instance = $page->header()->congress_instance;
                $pages->addPage($regPage, $regPath);
                break;
            }
        }
    }

    public function addLoginPage() {
        $pages = $this->grav['pages'];
        $page = $pages->dispatch($this->loginPath);

        if (!$page) {
            // login page has not been defined yet, add it
            $page = new Page();
            $page->init(new \SplFileInfo(__DIR__ . '/pages/akso_login.md'));
            $page->slug(basename($this->loginPath));
            $pages->addPage($page, $this->loginPath);
        }
    }

    // adds twig templates because grav
    public function onTwigTemplatePaths() {
        $twig = $this->grav['twig'];
        $twig->twig_paths[] = __DIR__ . '/templates';
        $twig->twig_paths[] = __DIR__ . '/public_templates';
    }

    private function getReferrerPath() {
        if (!isset($_SERVER['HTTP_REFERER'])) return '/';
        $ref = $_SERVER['HTTP_REFERER'];
        $refp = parse_url($ref);
        $rpath = '/';
        if ($refp != false && isset($refp['path'])) {
            $rpath = $refp['path'];
            if (isset($refp['query'])) $rpath .= '?' . $refp['query'];
            if (isset($refp['anchor'])) $rpath .= '#' + $refp['anchor'];
        }
        return $rpath;
    }

    // sets twig variables for rendering
    public function onTwigSiteVariables() {
        if ($this->isAdmin()) {
            // add admin js
            $this->grav['assets']->add('plugin://akso-bridge/css/akso-bridge-admin.css');
            $this->grav['assets']->add('plugin://akso-bridge/js/akso-bridge-admin.js');
            return;
        }

        if ($this->bridge === null) {
            // there is no bridge on this page; skip
            return;
        }

        $twig = $this->grav['twig'];
        $state = $this->pageState;
        $post = !empty($_POST) ? $_POST : [];

        $twig->twig_vars['akso_locale'] = $this->locale;

        $templateId = $this->grav['page']->template();
        if ($templateId === 'akso_congress_instance' || $templateId === 'akso_congress_registration') {
            $head = $this->grav['page']->header();
            $congressId = null;
            $instanceId = null;
            if (isset($head->congress_instance)) {
                $parts = explode("/", $head->congress_instance, 2);
                $congressId = intval($parts[0], 10);
                $instanceId = intval($parts[1], 10);
            }
            if ($congressId == null || $instanceId == null) {
                $twig->twig_vars['akso_congress_error'] = 'Kongresa okazigo ne ekzistas';
            }

            $isRegistration = $templateId === 'akso_congress_registration';
            $this->handleCongressVariables($congressId, $instanceId, $isRegistration);
        }

        if ($this->grav['uri']->path() === $this->loginPath) {
            // add login css
            $this->grav['assets']->add('plugin://akso-bridge/css/login.css');

            // set return path
            $rpath = '/';
            if (isset($post['return'])) {
                // keep return path if it already exists
                $rpath = $post['return'];
            } else {
                $rpath = $this->getReferrerPath();
            }
            $twig->twig_vars['akso_login_return_path'] = $rpath;
        }

        $twig->twig_vars['akso_auth'] = $this->aksoUser !== null;
        if ($this->aksoUser !== null) {
            $twig->twig_vars['akso_user_fmt_name'] = $this->aksoUserFormattedName;
            $twig->twig_vars['akso_uea_code'] = $this->aksoUser['uea'];

            if ($this->aksoUser['totp']) {
                // user still needs to log in with totp
                $twig->twig_vars['akso_login_totp'] = true;
            }
        }

        if ($state['state'] === 'login-error') {
            $twig->twig_vars['akso_login_username'] = $state['username'];
            if (isset($state['isBad'])) {
                $twig->twig_vars['akso_login_error'] = 'loginbad';
            } else if ($state['noPassword']) {
                $twig->twig_vars['akso_login_error'] = 'nopw';
            } else if ($state['isEmail']) {
                $twig->twig_vars['akso_login_error'] = 'authemail';
            } else {
                $twig->twig_vars['akso_login_error'] = 'authuea';
            }
        } else if ($state['state'] === 'totp-error') {
            if ($state['nosx']) {
                $twig->twig_vars['akso_login_error'] = 'totpnosx';
            } else if ($state['bad']) {
                $twig->twig_vars['akso_login_error'] = 'totpbad';
            } else {
                $twig->twig_vars['akso_login_error'] = 'totpauth';
            }
        }
    }

    private function handleCongressVariables($congressId, $instanceId, $isRegistration) {
        $app = new AppBridge($this->grav);
        $app->open();
        $head = $this->grav['page']->header();

        $res = $app->bridge->get('/congresses/' . $congressId . '/instances/' . $instanceId, array(
            'fields' => [
                'name',
                'humanId',
                'dateFrom',
                'dateTo',
                'locationName',
                'locationAddress',
                'tz',
            ],
        ), 60);
        $twig = $this->grav['twig'];

        $firstEventRes = $app->bridge->get('/congresses/' . $congressId . '/instances/' . $instanceId . '/programs', array(
            'order' => ['timeFrom.asc'],
            'fields' => [
                'timeFrom',
            ],
            'offset' => 0,
            'limit' => 1,
        ), 60);

        do {
            if (!$res['k']) {
                $twig->twig_vars['akso_congress_error'] = '[internal error while fetching congress: ' . $res['b'] . ']';
                break;
            }

            $twig->twig_vars['akso_congress_registration_link'] = $this->grav['page']->route() . '/alighilo';

            $congressStartTime = null;
            if ($firstEventRes['k'] && sizeof($firstEventRes['b']) > 0) {
                // use the start time of the first event if available
                $firstEvent = $firstEventRes['b'][0];
                $congressStartTime = \DateTime::createFromFormat("U", $firstEvent['timeFrom']);
            } else {
                // otherwise just use noon in local time
                $timeZone = isset($res['b']['tz']) ? new \DateTimeZone($res['b']['tz']) : new \DateTimeZone('+00:00');
                $dateStr = $res['b']['dateFrom'] . ' 12:00:00';
                $congressStartTime = \DateTime::createFromFormat("Y-m-d H:i:s", $dateStr, $timeZone);
            }

            $twig->twig_vars['akso_congress_start_time'] = $congressStartTime->getTimestamp();
            $twig->twig_vars['akso_congress_id'] = $congressId;
            $twig->twig_vars['akso_congress'] = $res['b'];

            if (isset($head->header_url)) {
                $processed = Excerpts::processLinkExcerpt(array(
                    'element' => array(
                        'attributes' => array(
                            'href' => htmlspecialchars(urlencode($head->header_url)),
                        ),
                    ),
                ), $this->grav["page"], 'image');
                $imageUrl = $processed['element']['attributes']['href'];
                $twig->twig_vars['akso_congress_header_url'] = $imageUrl;
            }
            if (isset($head->logo_url)) {
                $processed = Excerpts::processLinkExcerpt(array(
                    'element' => array(
                        'attributes' => array(
                            'href' => htmlspecialchars(urlencode($head->logo_url)),
                        ),
                    ),
                ), $this->grav["page"], 'image');
                $imageUrl = $processed['element']['attributes']['href'];
                $twig->twig_vars['akso_congress_logo_url'] = $imageUrl;
            }
        } while (false);

        $regFormFields = ['allowUse', 'allowGuests'];
        if ($isRegistration) {
            $regFormFields []= 'editable';
            $regFormFields []= 'cancellable';
            $regFormFields []= 'price.currency';
            $regFormFields []= 'price.var';
            $regFormFields []= 'price.minUpfront';
            $regFormFields []= 'form';
        }
        $formRes = $app->bridge->get('/congresses/' . $congressId . '/instances/' . $instanceId . '/registration_form', array(
            'fields' => $regFormFields
        ), 60);
        if ($formRes['k']) {
            // registration form exists
            $twig->twig_vars['akso_congress_registration_enabled'] = true;
            $twig->twig_vars['akso_congress_registration_allowed'] = $formRes['b']['allowUse'];
            $twig->twig_vars['akso_congress_registration_guest_not_allowed'] = !$formRes['b']['allowGuests'] && !$this->aksoUser;

            if ($isRegistration && !$formRes['b']['allowGuests'] && !$this->aksoUser) {
                // user needs to log in to use this!
                $this->grav->redirectLangSafe($this->loginPath, 303);
            }

            if ($isRegistration) {
                $this->grav['assets']->add('plugin://akso-bridge/css/registration-form.css');
                $this->grav['assets']->add('plugin://akso-bridge/js/registration-form.js');
                $dataId = null;
                $validateOnly = false;
                $isCancellation = false;
                $isActualCancellation = false;
                if (isset($_GET[self::CONGRESS_REGISTRATION_VALIDATE])) {
                    $validateOnly = (bool) $_GET[self::CONGRESS_REGISTRATION_VALIDATE];
                }
                if (isset($_GET[self::CONGRESS_REGISTRATION_DATAID])) {
                    $dataId = $_GET[self::CONGRESS_REGISTRATION_DATAID];
                }
                if (isset($_GET[self::CONGRESS_REGISTRATION_CANCEL])) {
                    $isCancellation = (bool) $_GET[self::CONGRESS_REGISTRATION_CANCEL];
                }
                if (isset($_GET[self::CONGRESS_REGISTRATION_REALLY_CANCEL])) {
                    $isActualCancellation = (bool) $_GET[self::CONGRESS_REGISTRATION_REALLY_CANCEL];
                    $isCancellation = $isCancellation || $isActualCancellation;
                }

                $isEditable = $formRes['b']['editable'];
                $isCancelable = $formRes['b']['cancellable'];

                $canceledTime = null;
                $userData = null;
                $userDataError = null;

                if ($dataId) {
                    $fields = ['cancelledTime'];
                    foreach ($formRes['b']['form'] as $formItem) {
                        if ($formItem['el'] === 'input') $fields[] = 'data.' . $formItem['name'];
                    }
                    $res = $app->bridge->get('/congresses/' . $congressId . '/instances/' . $instanceId . '/participants/' . $dataId, array(
                        'fields' => $fields,
                    ));
                    // TODO: fetch other fields too, do something with them...?
                    if ($res['k']) {
                        $userData = $res['b']['data'];
                        $canceledTime = $res['b']['cancelledTime'];

                        if ($canceledTime) {
                            $isCancellation = false;
                            $isActualCancellation = false;
                        }
                    } else {
                        $userDataError = $res;
                    }
                }

                if ($userDataError) {
                    $twig->twig_vars['akso_congress_registration_form'] = "";
                    if ($userDataError['sc'] === 404) {
                        // not found
                        $twig->twig_vars['akso_congress_registration_not_found'] = true;
                    } else {
                        $twig->twig_vars['akso_congress_registration_generic_error'] = true;
                    }
                } else {
                    $currency = null;
                    if ($formRes['b']['price']) {
                        $currency = $formRes['b']['price']['currency'];
                    }
                    $form = new CongressRegistrationForm(
                        $this,
                        $app,
                        $formRes['b']['form'],
                        $congressId,
                        $instanceId,
                        $currency
                    );

                    if ($userData) {
                        $form->setUserData($dataId, $userData);
                    }

                    $isSubmission = !$isCancellation && ($_SERVER['REQUEST_METHOD'] === 'POST');
                    $isConfirmation = false;

                    if (!$canceledTime) {
                        if ($isActualCancellation) {
                            $canceledTime = $form->cancel();
                        } else if ($isSubmission) {
                            $post = !empty($_POST) ? $_POST : [];
                            if ($validateOnly) {
                                $form->validate($post);
                            } else {
                                $form->trySubmit($post);
                            }
                        }
                    }

                    if ($form->confirmDataId !== null) {
                        $dataId = $form->confirmDataId;
                        $isConfirmation = true;
                    }
                    //
                    // FIXME: better way of building urls?
                    $backLink = explode('/', $this->grav['uri']->path());
                    array_pop($backLink);
                    $backLink = implode('/', $backLink);
                    $twig->twig_vars['akso_congress_registration_back_link'] = $backLink;

                    if ($canceledTime) {
                        $twig->twig_vars['akso_congress_registration_canceled'] = true;
                        if ($form->cancelSucceeded) {
                            $twig->twig_vars['akso_congress_registration_cancel_success'] = true;
                        }
                    } else if ($isActualCancellation && $form->cancelSucceeded) {
                    } else if ($isCancellation && $dataId !== null) {
                        if ($isActualCancellation && !$form->cancelSucceeded) {
                            $twig->twig_vars['akso_congress_registration_cancel_error'] = true;
                        }

                        $twig->twig_vars['akso_congress_registration_confirm_cancel'] = true;
                        $twig->twig_vars['akso_congress_registration_cancel_back'] = $this->grav['uri']->path() . '?' .
                            self::CONGRESS_REGISTRATION_DATAID . '=' . $dataId;
                        $twig->twig_vars['akso_congress_registration_rly_cancel'] = $this->grav['uri']->path() . '?' .
                            self::CONGRESS_REGISTRATION_DATAID . '=' . $dataId . '&' .
                            self::CONGRESS_REGISTRATION_REALLY_CANCEL . '=true';
                    } else if ($isConfirmation) {
                        $twig->twig_vars['akso_congress_registration_confirmation'] = true;
                        $twig->twig_vars['akso_congress_registration_edit_link'] = $this->grav['uri']->path() . '?' .
                            self::CONGRESS_REGISTRATION_DATAID . '=' . $dataId;
                    } else {
                        $submitQuery = '';
                        if ($dataId !== null) {
                            $twig->twig_vars['akso_congress_registration_dataId'] = $dataId;
                            $twig->twig_vars['akso_congress_registration_editable'] = $isEditable;
                            $twig->twig_vars['akso_congress_registration_cancelable'] = $isCancelable;

                            $cancelTarget = $this->grav['uri']->path() . '?' .
                                self::CONGRESS_REGISTRATION_DATAID . '=' . $dataId . '&' .
                                self::CONGRESS_REGISTRATION_CANCEL . '=true';
                            $twig->twig_vars['akso_congress_registration_cancel_target'] = $cancelTarget;

                            $submitQuery = self::CONGRESS_REGISTRATION_DATAID . '=' . $dataId;
                        }

                        $validateQuery = self::CONGRESS_REGISTRATION_VALIDATE . '=true&' . $submitQuery;
                        $twig->twig_vars['akso_congress_registration_validate'] = $this->grav['uri']->path() . '?' . $validateQuery;
                        $twig->twig_vars['akso_congress_registration_submit'] = $this->grav['uri']->path() . '?' . $submitQuery;
                        $twig->twig_vars['akso_congress_registration_form'] = $form->render();
                    }
                }
            }
        } else {
            // no registration form
            $twig->twig_vars['akso_congress_registration_enabled'] = false;
        }

        $app->close();
    }

    /**
     * Admin page endpoint at /admin/akso_bridge, for various JS stuff.
     */
    public function onAdminPageInitialized() {
        $auth = $this->grav["user"]->authorize('admin.login');
        $uri = $this->grav["uri"];
        $path = $uri->path();
        if ($auth && $path === "/admin/akso_bridge") {
            header('Content-Type: application/json;charset=utf-8');
            $task = $uri->query('task');
            $app = new AppBridge($this->grav);
            $app->open();

            if ($task === "list_congresses") {
                $offset = $uri->query('offset');
                $limit = $uri->query('limit');

                $res = $app->bridge->get('/congresses', array(
                    'offset' => $offset,
                    'limit' => $limit,
                    'fields' => ['id', 'name', 'org'],
                    'order' => ['name.asc'],
                ));
                if ($res['k']) {
                    echo json_encode(array('result' => $res['b']));
                } else {
                    echo json_encode(array('error' => $res['b']));
                }
            } else if ($task === "list_congress_instances") {
                $congress = $uri->query('congress');
                $offset = $uri->query('offset');
                $limit = $uri->query('limit');

                $res = $app->bridge->get('/congresses/' . $congress . '/instances', array(
                    'offset' => $offset,
                    'limit' => $limit,
                    'fields' => ['id', 'name', 'humanId'],
                    'order' => ['humanId.desc'],
                ));
                if ($res['k']) {
                    echo json_encode(array('result' => $res['b']));
                } else {
                    echo json_encode(array('error' => $res['b']));
                }
            } else if ($task === "name_congress_instance") {
                $congress = $uri->query('congress');
                $instance = $uri->query('instance');
                $offset = $uri->query('offset');
                $limit = $uri->query('limit');

                $res = $app->bridge->get('/congresses/' . $congress, array('fields' => ['name']));
                if (!$res['k']) {
                    echo json_encode(array('error' => $res['b']));
                } else {
                    $congressName = $res['b']['name'];
                    $res = $app->bridge->get('/congresses/' . $congress . '/instances/' . $instance, array('fields' => ['name']));
                    if (!$res['k']) {
                        echo json_encode(array('error' => $res['b']));
                    } else {
                        $instanceName = $res['b']['name'];
                        echo json_encode(array('result' => array(
                            'congress' => $congressName,
                            'instance' => $instanceName,
                        )));
                    }
                }
            }

            $app->close();
            die();
        }
    }

    // loads MarkdownExt (see classes/MarkdownExt.php)
    private function loadMarkdownExt() {
        if (!isset($this->markdownExt)) {
            $this->markdownExt = new MarkdownExt($this);
        }
        return $this->markdownExt;
    }

    public function onMarkdownInitialized(Event $event) {
        if ($this->isAdmin()) return;
        $markdownExt = $this->loadMarkdownExt();
        $markdownExt->onMarkdownInitialized($event);
    }
    public function onPageContentProcessed(Event $event) {
        if ($this->isAdmin()) return;
        $markdownExt = $this->loadMarkdownExt();
        $markdownExt->onPageContentProcessed($event);
    }
    public function onOutputGenerated(Event $event) {
        if ($this->isAdmin()) return;
        $markdownExt = $this->loadMarkdownExt();
        $nonces = $markdownExt->onOutputGenerated($event);

        $scriptNonces = '';
        foreach ($nonces['scripts'] as $sn) {
            $scriptNonces .= " 'nonce-" . $sn . "'";
        }
        $styleNonces = '';
        foreach ($nonces['styles'] as $sn) {
            $styleNonces .= " 'nonce-" . $sn . "'";
        }

        $csp = [
            "default-src 'self'",
            "img-src 'self' " . $this->apiHost,
            "script-src 'self' " . $scriptNonces,
            "style-src 'self' 'unsafe-inline' " . $styleNonces,
        ];
        header('Content-Security-Policy: ' . implode($csp, ';'), FALSE);
    }

}
