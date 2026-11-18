<?php

declare(strict_types=1);

namespace app\controllers;


use app\services\AuthService;
use Yii;
use yii\rest\Controller;
use yii\web\BadRequestHttpException;
use yii\web\Response;
use app\components\JwtAuth;

class AuthController extends Controller
{
    public $enableCsrfValidation = false;

    public function behaviors()
    {
        $behaviors = parent::behaviors();

        $behaviors['contentNegotiator']['formats'] = [
            'application/json' => Response::FORMAT_JSON,
        ];

        return $behaviors;
    }

    public function actionLogin(): array
    {
        $body = Yii::$app->request->getBodyParams();

        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($username === '' || $password === '') {
            throw new BadRequestHttpException(
                'Username dan password wajib diisi.'
            );
        }

        $authService = new AuthService();

        return [
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => $authService->login($username, $password),
        ];
    }

    public function actionMe(): array
    {
        $user = JwtAuth::authenticate();

        $authService = new AuthService();

        return [
            'success' => true,
            'message' => 'Profil pengguna berhasil diambil.',
            'data' => $authService->formatUser($user),
        ];
    }
}