<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use Grav\Common\Uri;
use RocketTheme\Toolbox\Event\Event;
use Grav\Common\Page\Page;
use Grav\Plugin\AksoBridge\MarkdownExt;

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

    // allow access to protected property
    public function getGrav() {
        return $this->grav;
    }

    // called at the beginning at some point
    public function onPluginsInitialized() {
        require_once __DIR__ . '/vendor/autoload.php';
        require_once __DIR__ . '/aksobridged/php/vendor/autoload.php';
        require_once __DIR__ . '/aksobridged/php/src/AksoBridge.php';

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

    private function openAppBridge() {
        $grav = $this->grav;
        $apiKey = $grav['config']->get('plugins.akso-bridge.api_key');
        $apiSecret = $grav['config']->get('plugins.akso-bridge.api_secret');

        $this->bridge = new \AksoBridge(__DIR__ . '/aksobridged/aksobridge');
        $this->bridge->openApp($this->apiHost, $apiKey, $apiSecret);
    }

    private function closeAppBridge() {
        $this->bridge->close();
    }

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

        $aksoUserState = $this->bridge->open($this->apiHost, $ip, $cookies);
        if ($aksoUserState['auth']) {
            $this->aksoUser = $aksoUserState;
        }

        $this->updateAksoState();

        $this->updateFormattedName();

        $this->bridge->close();

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
            return;
        }

        if ($this->bridge === null) {
            // there is no bridge on this page; skip
            return;
        }

        $twig = $this->grav['twig'];
        $state = $this->pageState;
        $post = !empty($_POST) ? $_POST : [];

        $templateId = $this->grav['page']->template();
        if ($templateId === 'akso_congress_instance') {
            $head = $this->grav['page']->header();
            $congressId = null;
            $instanceId = null;
            if (isset($head->congress) && isset($head->instance)) {
                $congressId = intval($head->congress, 10);
                $instanceId = intval($head->instance, 10);
            }
            if ($congressId == null || $instanceId == null) {
                $twig->twig_vars['akso_congress_error'] = 'Kongresa okazigo ne ekzistas';
            }
            $this->handleCongressVariables($congressId, $instanceId);
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

    private function handleCongressVariables($congressId, $instanceId) {
        $this->openAppBridge();

        $res = $this->bridge->get('/congresses/' . $congressId . '/instances/' . $instanceId, array( 
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

        do {
            if (!$res['k']) {
                $twig->twig_vars['akso_congess_error'] = '[internal error while fetching congress: ' . $res['b'] . ']';
                break;
            }

            $twig->twig_vars['akso_congress'] = $res['b'];
        } while (false);

        $this->closeAppBridge();
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
        $markdownExt->onOutputGenerated($event);
    }

}
