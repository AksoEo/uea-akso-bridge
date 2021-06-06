<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Utils;

// Handles payment pages
// TODO: actually integrate or just delete
class Payment {
    protected $plugin = null;
    protected $app = null;
    public function __construct($plugin, $app) {
        $this->plugin = $plugin;
        $this->app = $app;
    }

    private $cachedExchangeRates = null;
    private function convertCurrency($fromCur, $toCur, $value) {
        if ($fromCur == $toCur) return $value;
        if (!$this->cachedExchangeRates) {
            $res = $this->app->bridge->get('/aksopay/exchange_rates', array(
                'base' => $fromCur,
            ), 60);
            if ($res['k']) $this->cachedExchangeRates = $res['b'];
        }
        if (!$this->cachedExchangeRates) return null;
        $rates = $this->cachedExchangeRates;
        $multipliers = $this->app->bridge->currencies();
        $fromCurFloat = $value / $multipliers[$fromCur];
        $toCurFloat = $this->app->bridge->convertCurrency($rates, $fromCur, $toCur, $fromCurFloat)['v'];
        return round($toCurFloat * $multipliers[$toCur]);
    }

    private function formatCurrency($value, $currency) {
        $res = $this->app->bridge->evalScript([array(
            'value' => array('t' => 'n', 'v' => $value),
            'currency' => array('t' => 's', 'v' => $currency),
        )], array(), array(
            't' => 'c',
            'f' => 'currency_fmt',
            'a' => ['currency', 'value'],
        ));
        if ($res['s']) {
            return $res['v'] . '';
        }
        return null;
    }

    // Returns entry payment info with following fields:
    // - outstanding_payment: bool
    // - remaining_amount: number
    // - price: number
    // - amount_paid: number
    // - has_paid_minimum: bool
    // - min_upfront: number
    // - edit_target: path that goes back to the registration page
    // - codeholder_id: (int) codeholder id
    // - customer: array('name' => .., 'email' => ..)
    // - purpose_title: string
    // - purpose_description: string
    // - purpose_type: string (trigger type)
    // - purpose_data_id: string
    public $entryPaymentInfo = null;

    // current payment method id
    public $paymentMethod = null;
    // current payment currency
    public $paymentCurrency = null;

    function runPayment() {
        $paymentInfo = $this->entryPaymentInfo;
        if (!$paymentInfo) {
            return array('is_payment' => true, 'payment' => [], 'edit_target' => '/');
        };
        $editTarget = $paymentInfo['edit_target'];

        if (!$paymentInfo['outstanding_payment']) {
            return array(
                'is_payment' => true,
                'payment' => $paymentInfo,
                'edit_target' => $editTarget
            );
        }

        if ($this->paymentMethod) {
            $res = $this->app->bridge->get('/aksopay/payment_orgs/' . $this->paymentOrg . '/methods/' . $this->paymentMethod, array(
                'fields' => ['id', 'type', 'stripeMethods', 'name', 'description', 'currencies',
                    'feePercent', 'feeFixed.val', 'feeFixed.cur', 'internal'],
            ), 60);

            $currency = $this->paymentCurrency;

            if ($res['k'] && !in_array($currency, $res['b']['currencies'])) {
                $currency = null;
            }

            if ($res['k'] && $currency !== null) {
                $method = $res['b'];
                if ($method['internal']) throw new \Exception('Cannot use internal method');

                $currencies = $this->app->bridge->currencies();
                $multiplier = $currencies[$currency];

                $min = 0;
                if ($paymentInfo['has_paid_minimum']) {
                    // TODO: some sort of minimum?
                    $min = 1;
                } else {
                    $minA = $paymentInfo['price'] - $paymentInfo['amount_paid'];
                    $minB = $paymentInfo['min_upfront'] - $paymentInfo['amount_paid'];
                    $min = min($minA, $minB);
                }
                $min = $this->convertCurrency($this->currency, $currency, $min) / $multiplier;
                $max = $this->convertCurrency($this->currency, $currency, $paymentInfo['remaining_amount']) / $multiplier;
                $step = 1 / $multiplier;
                $value = $max;

                $isSubmission = $_SERVER['REQUEST_METHOD'] === 'POST';
                $error = null;
                $redirectTarget = null;
                $returnTarget = null;

                while ($isSubmission) { // (not an actual loop; used only for early return)
                    $post = !empty($_POST) ? $_POST : [];

                    $nonceValid = false;
                    if (isset($post['nonce']) && isset($_SESSION[self::NONCES])) {
                        $nonce = $post['nonce'];
                        $nonceIndex = array_search($nonce, $_SESSION[self::NONCES]);
                        if ($nonceIndex !== false) {
                            $nonceValid = true;
                            unset($_SESSION[self::NONCES][$nonceIndex]);
                        }
                    }

                    $value = $post['amount'];
                    $notes = $post['notes'];
                    if (gettype($value) !== 'string' || gettype($notes) !== 'string' || gettype($currency) !== 'string') {
                        $error = $this->locale['registration_form']['payment_err_bad_request'];
                        break;
                    }
                    $value = floatval($value);
                    if ($value < $min || $value > $max) {
                        $error = $this->plugin->locale['registration_form']['payment_err_bad_request'];
                        break;
                    }
                    $value = floor($value * $multiplier);
                    if (!in_array($currency, $method['currencies'])) {
                        $error = $this->plugin->locale['registration_form']['payment_err_bad_request'];
                        $value = $value / $multiplier;
                        break;
                    }

                    if (!$nonceValid) {
                        $error = $this->plugin->locale['registration_form']['err_nonce_invalid'];
                        $value = $value / $multiplier;
                        break;
                    }

                    $triggerAmount = $this->convertCurrency($currency, $this->currency, $value);

                    $codeholderId = null;
                    if ($paymentInfo['codeholder_id']) {
                        $codeholderId = $paymentInfo['codeholder_id'];
                    }

                    $res = $this->app->bridge->post('/aksopay/payment_intents', array(
                        'codeholderId' => $codeholderId,
                        'customer' => $paymentInfo['customer'],
                        'paymentOrgId' => $this->paymentOrg,
                        'paymentMethodId' => $this->paymentMethod,
                        'currency' => $currency,
                        'customerNotes' => empty($notes) ? null : $notes,
                        'purposes' => [array(
                            'type' => 'trigger',
                            'title' => $paymentInfo['purpose_title'],
                            'description' => $paymentInfo['purpose_description'],
                            'amount' => $value,
                            'triggerAmount' => array(
                                'currency' => $this->currency,
                                'amount' => $triggerAmount
                            ),
                            'triggers' => $paymentInfo['purpose_type'],
                            'dataId' => $paymentInfo['purpose_data_id'],
                        )],
                    ), array(), []);

                    if ($res['k']) {
                        $paymentId = $res['h']['x-identifier'];

                        $returnTarget = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") .
                            "://$_SERVER[HTTP_HOST]" . $editTarget;

                        $paymentsHost = $this->plugin->getGrav()['config']->get('plugins.akso-bridge.payments_host');
                        $redirectTarget = $paymentsHost . '/i/' . $paymentId . '?return=' . urlencode($returnTarget);
                    } else {
                        // TODO: handle error
                    }

                    break;
                }

                // TODO
                $backTarget = $this->plugin->getGrav()['uri']->path() . '?' .
                    self::DATAID . '=' . urlencode($this->dataId) . '&' .
                    self::PAYMENT . '=true';

                $feeFixedRendered = null;
                if ($method['feeFixed']) {
                    $feeFixedRendered = $this->formatCurrency($method['feeFixed']['val'], $currency);
                }

                $approxConversionRate = $this->convertCurrency($currency, $this->currency, 1000000);

                $nonce = base64_encode(random_bytes(32));
                if (!isset($_SESSION[self::NONCES])) $_SESSION[self::NONCES] = [];
                $_SESSION[self::NONCES][] = $nonce;

                return array(
                    'is_payment' => true,
                    'is_payment_method' => true,
                    'form_nonce' => $nonce,
                    'payment' => $paymentInfo,
                    'payment_success_redirect' => $redirectTarget,
                    'payment_success_return' => $returnTarget,
                    'payment_error' => $error,
                    'payment_method' => $method,
                    'payment_currency' => $currency,
                    'payment_currency_mult' => $multiplier,
                    'payment_price_currency' => $this->currency,
                    'payment_price_approx_rate' => $approxConversionRate,
                    'payment_amount_min' => $min,
                    'payment_amount_max' => $max,
                    'payment_amount_step' => $step,
                    'payment_amount_value' => $value,
                    'payment_customer_name' => $paymentInfo['customer']['name'],
                    'payment_customer_email' => $paymentInfo['customer']['email'],
                    'payment_back_target' => $backTarget,
                    'fee_fixed_rendered' => $feeFixedRendered,
                    // this text script will calculate fees live and show them to the user
                    'payment_form_script' => base64_encode(json_encode([
                        'text_pre' => ['t' => 's', 'v' => '**' . $this->plugin->locale['registration_form']['payment_fees'] . '**: '],

                        'currency' => ['t' => 's', 'v' => $currency],
                        'fee_fixed_val' => ['t' => 'n', 'v' => $method['feeFixed'] !== null ? $method['feeFixed']['val'] : 0],
                        'fee_fixed_cur' => ['t' => 's', 'v' => $method['feeFixed'] !== null ? $method['feeFixed']['cur'] : ''],
                        'fee_fixed' => ['t' => 'c', 'f' => 'currency_fmt', 'a' => ['fee_fixed_cur', 'fee_fixed_val']],

                        'fee_pc_val' => ['t' => 'n', 'v' => $method['feePercent'] !== null ? $method['feePercent'] : 0],

                        '0' => ['t' => 'n', 'v' => 0],
                        'has_fixed_fee' => ['t' => 'c', 'f' => '>', 'a' => ['fee_fixed_val', '0']],
                        'has_pc_fee' => ['t' => 'c', 'f' => '>', 'a' => ['fee_pc_val', '0']],
                        'has_both_fees' => ['t' => 'c', 'f' => 'and', 'a' => ['has_fixed_fee', 'has_pc_fee']],
                        'has_any_fee' => ['t' => 'c', 'f' => 'or', 'a' => ['has_fixed_fee', 'has_pc_fee']],

                        'text_fee_fixed' => ['t' => 'c', 'f' => 'id', 'a' => ['fee_fixed']],

                        'text_fee_join' => ['t' => 's', 'v' => ' % ('],
                        'text_fee_after' => ['t' => 's', 'v' => ')'],
                        'text_fee_pc' => ['t' => 'c', 'f' => '++', 'a' => ['fee_pc_val', 'text_fee_join']],
                        'fee_pc_real_val' => ['t' => 'c', 'f' => '*', 'a' => ['fee_pc_val', '@amount']],
                        'text_fee_val' => ['t' => 'c', 'f' => 'currency_fmt', 'a' => ['currency', 'fee_pc_real_val']],
                        'text_fee_calc' => ['t' => 'c', 'f' => '++', 'a' => ['text_fee_val', 'text_fee_after']],
                        'text_fee_percent' => ['t' => 'c', 'f' => '++', 'a' => ['text_fee_pc', 'text_fee_calc']],

                        'join' => ['t' => 's', 'v' => ' + '],
                        'text_both_fees1' => ['t' => 'c', 'f' => '++', 'a' => ['text_fee_fixed', 'join']],
                        'text_both_fees' => ['t' => 'c', 'f' => '++', 'a' => ['text_both_fees1', 'text_fee_percent']],

                        'text_fee' => ['t' => 'w', 'm' => [
                            ['c' => 'has_both_fees', 'v' => 'text_both_fees'],
                            ['c' => 'has_fixed_fee', 'v' => 'text_fee_fixed'],
                            ['c' => null, 'v' => 'text_fee_percent'],
                        ]],
                        'fees_text2' => ['t' => 'c', 'f' => '++', 'a' => ['text_pre', 'text_fee']],
                        'empty_string' => ['t' => 's', 'v' => ''],
                        'fees_text' => ['t' => 'w', 'm' => [
                            ['c' => 'has_any_fee', 'v' => 'fees_text2'],
                            ['c' => null, 'v' => 'empty_string'],
                        ]],
                    ])),
                );
            }
        }

        // TODO: move locale stuff

        {
            $methodTarget = $this->plugin->getGrav()['uri']->path();

            $autoPaymentMethods = [];
            $otherPaymentMethods = [];

            if ($this->paymentOrg) {
                $res = $this->app->bridge->get('/aksopay/payment_orgs/' . $this->paymentOrg . '/methods', array(
                    'fields' => ['id', 'type', 'stripeMethods', 'name', 'description', 'currencies',
                        'feePercent', 'feeFixed.val', 'feeFixed.cur', 'isRecommended'],
                    'filter' => array('internal' => false),
                    'limit' => 100,
                    'order' => [['name', 'asc']],
                ), 60);
                if ($res['k']) {
                    // put recommended methods first
                    foreach ($res['b'] as $method) {
                        if ($method['isRecommended']) {
                            if ($method['type'] === 'stripe') $autoPaymentMethods[] = $method;
                            else $otherPaymentMethods[] = $method;
                        }
                    }
                    foreach ($res['b'] as $method) {
                        if (!$method['isRecommended']) {
                            if ($method['type'] === 'stripe') $autoPaymentMethods[] = $method;
                            else $otherPaymentMethods[] = $method;
                        }
                    }
                }
            }

            return array(
                'is_payment' => true,
                'payment' => $paymentInfo,
                'payment_methods' => array(
                    'auto' => $autoPaymentMethods,
                    'other' => $otherPaymentMethods,
                ),
                'edit_target' => $editTarget,
                // TODO
                'data_id' => $this->dataId,
                'method_target' => $methodTarget,
            );
        }
    }
}
