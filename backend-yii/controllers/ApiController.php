<?php

namespace app\controllers;

use yii\rest\Controller;
use yii\web\Response;
use Yii;

class ApiController extends Controller
{
    public function behaviors()
    {
        $behaviors = parent::behaviors();

        $behaviors['contentNegotiator']['formats'] = [
            'application/json' => Response::FORMAT_JSON,
        ];

        return $behaviors;
    }

    public function actionHealth()
    {
        return [
            'success' => true,
            'message' => 'SIMRS Yii2 API running successfully',
            'data' => [
                'service' => 'simrs-core',
                'status' => 'healthy',
            ],
        ];
    }

    public function actionOptions(): void
    {
        Yii::$app->response->statusCode = 204;
    }
}