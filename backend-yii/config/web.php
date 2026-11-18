<?php

$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';

$config = [
    'id' => 'basic',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'container' => [
        'singletons' => [
            \yii\mail\MailerInterface::class => [
                'class' => \yii\symfonymailer\Mailer::class,
                // send all mails to a file by default.
                'useFileTransport' => true,
                'viewPath' => '@app/mail',
            ],
        ],
    ],
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm'   => '@vendor/npm-asset',
    ],
    'components' => [
        'request' => [
            // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
            'cookieValidationKey' => '95513NixOLZO74FnQkOgNoMxCEwX8z8-',
            'parsers' => [
                'application/json' => 'yii\web\JsonParser',
            ],
        ],
        'cache' => [
            'class' => \yii\caching\FileCache::class,
        ],
        'user' => [
            'identityClass' => \app\models\User::class,
            'enableAutoLogin' => true,
        ],
        'errorHandler' => [
            'errorAction' => 'site/error',
        ],
        'mailer' => \yii\mail\MailerInterface::class,
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => \yii\log\FileTarget::class,
                    'levels' => ['error', 'warning'],
                ],
            ],
        ],
        'db' => $db,
        /*
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'rules' => [
            ],
        ],
        */
        'response' => [
            'format' => \yii\web\Response::FORMAT_JSON,
            'on beforeSend' => function ($event) {
            $response = $event->sender;
            $request = Yii::$app->request;

            $origin = $request->headers->get('Origin');

            if ($origin === 'http://localhost:5173') {
                $response->headers->set(
                    'Access-Control-Allow-Origin',
                    $origin
                );

                $response->headers->set(
                    'Vary',
                    'Origin'
                );

                $response->headers->set(
                    'Access-Control-Allow-Methods',
                    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                );

                $response->headers->set(
                    'Access-Control-Allow-Headers',
                    'Authorization, Content-Type, Accept'
                );
            }

            if ($request->method === 'OPTIONS') {
                $response->statusCode = 204;
                $response->data = null;
                $response->content = '';
            }
        },
        ],

        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'rules' => [
                 'OPTIONS api/<path:.+>' => 'api/options',
                 
                'GET api/health' => 'api/health',

                'POST api/auth/login' => 'auth/login',
                'GET api/auth/me' => 'auth/me',

                'GET api/patients' => 'patient/index',
                'GET api/patients/<id:[0-9a-fA-F-]+>' => 'patient/view',
                'POST api/patients' => 'patient/create',
                'PUT api/patients/<id:[0-9a-fA-F-]+>' => 'patient/update',
                'GET api/patients-test' => 'patient/index',

                'GET api/polyclinics' => 'polyclinic/index',
                'GET api/polyclinics/<id:[0-9a-fA-F-]+>' => 'polyclinic/view',
                'POST api/polyclinics' => 'polyclinic/create',
                'PUT api/polyclinics/<id:[0-9a-fA-F-]+>' => 'polyclinic/update',

                'GET api/medical-staff' => 'medical-staff/index',
                'GET api/medical-staff/<id:[0-9a-fA-F-]+>' => 'medical-staff/view',
                'POST api/medical-staff' => 'medical-staff/create',
                'PUT api/medical-staff/<id:[0-9a-fA-F-]+>' => 'medical-staff/update',

                'GET api/doctor-schedules' => 'doctor-schedule/index',
                'GET api/doctor-schedules/<id:[0-9a-fA-F-]+>' =>
                    'doctor-schedule/view',
                'POST api/doctor-schedules' =>
                    'doctor-schedule/create',
                'PUT api/doctor-schedules/<id:[0-9a-fA-F-]+>' =>
                    'doctor-schedule/update',

                'GET api/visits' => 'visit/index',
                'GET api/visits/<id:[0-9a-fA-F-]+>' => 'visit/view',
                'GET api/patients/<patientId:[0-9a-fA-F-]+>/visits'
                    => 'visit/by-patient',
                'POST api/visits' => 'visit/create',

                'GET api/medical-records' =>
                    'medical-record/index',
                'GET api/medical-records/<id:[0-9a-fA-F-]+>' =>
                    'medical-record/view',
                'GET api/visits/<visitId:[0-9a-fA-F-]+>/medical-records' =>
                    'medical-record/by-visit',
                'POST api/medical-records' =>
                    'medical-record/create',
                'PUT api/medical-records/<id:[0-9a-fA-F-]+>' =>
                    'medical-record/update',

                'GET api/medical-actions' => 'medical-action/index',
                'GET api/medical-actions/<id:[0-9a-fA-F-]+>' => 'medical-action/view',
                'POST api/medical-actions' => 'medical-action/create',
                'PUT api/medical-actions/<id:[0-9a-fA-F-]+>' => 'medical-action/update',

                'GET api/visit-actions' =>
                    'visit-action/index',
                'GET api/visit-actions/<id:[0-9a-fA-F-]+>' =>
                    'visit-action/view',
                'GET api/visits/<visitId:[0-9a-fA-F-]+>/actions' =>
                    'visit-action/by-visit',
                'POST api/visit-actions' =>
                    'visit-action/create',
                'PATCH api/visits/<id:[0-9a-fA-F-]+>/status'
                    => 'visit/update-status',

                'GET api/billings' => 'billing/index',
                'GET api/billings/<id:[0-9a-fA-F-]+>' => 'billing/view',
                'GET api/visits/<visitId:[0-9a-fA-F-]+>/billing'
                    => 'billing/by-visit',
                'POST api/billings' => 'billing/create',
                'GET api/billings/<id:[0-9a-fA-F-]+>/invoice'
                    => 'billing/invoice',
                'GET api/billings/<id:[0-9a-fA-F-]+>/receipt'
                    => 'billing/receipt',


                'GET api/payments' => 'payment/index',
                'GET api/payments/<id:[0-9a-fA-F-]+>' => 'payment/view',
                'GET api/billings/<billingId:[0-9a-fA-F-]+>/payments'
                    => 'payment/by-billing',
                'POST api/payments' => 'payment/create',


                'GET api/medicines' => 'medicine/index',
                'GET api/medicines/<id:[0-9a-fA-F-]+>'
                    => 'medicine/view',
                'POST api/medicines' => 'medicine/create',
                'PUT api/medicines/<id:[0-9a-fA-F-]+>'
                    => 'medicine/update',
                'DELETE api/medicines/<id:[0-9a-fA-F-]+>'
                    => 'medicine/delete',


                'GET api/prescriptions' => 'prescription/index',
                'GET api/prescriptions/<id:[0-9a-fA-F-]+>'
                    => 'prescription/view',
                'GET api/visits/<visitId:[0-9a-fA-F-]+>/prescriptions'
                    => 'prescription/by-visit',
                'POST api/prescriptions' => 'prescription/create',
                'POST api/prescriptions/<id:[0-9a-fA-F-]+>/dispense'
                    => 'prescription/dispense',


                'GET api/lab-requests' => 'lab/index',
                'GET api/lab-requests/<id:[0-9a-fA-F-]+>'
                    => 'lab/view',
                'GET api/visits/<visitId:[0-9a-fA-F-]+>/lab-requests'
                    => 'lab/by-visit',
                'POST api/lab-requests' => 'lab/create',
                'POST api/lab-requests/<id:[0-9a-fA-F-]+>/results'
                    => 'lab/create-result',

            ],
        ],
    ],
    'params' => $params,
];

if (YII_ENV_DEV) {
    // configuration adjustments for 'dev' environment
    $config['bootstrap'][] = 'debug';
    $config['modules']['debug'] = [
        'class' => \yii\debug\Module::class,
        // uncomment the following to add your IP if you are not connecting from localhost.
        //'allowedIPs' => ['127.0.0.1', '::1'],
    ];

    $config['bootstrap'][] = 'gii';
    $config['modules']['gii'] = [
        'class' => \yii\gii\Module::class,
        // uncomment the following to add your IP if you are not connecting from localhost.
        //'allowedIPs' => ['127.0.0.1', '::1'],
    ];
}

return $config;