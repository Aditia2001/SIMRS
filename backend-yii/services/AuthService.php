<?php

declare(strict_types=1);

namespace app\services;

use app\models\User;
use app\repositories\UserRepository;
use Firebase\JWT\JWT;
use Yii;
use yii\web\UnauthorizedHttpException;

class AuthService
{
    public function __construct(
        private UserRepository $userRepository = new UserRepository()
    ) {
    }

    public function login(string $username, string $password): array
    {
        $user = $this->userRepository->findByUsername($username);

        if (
            !$user ||
            !Yii::$app->security->validatePassword(
                $password,
                $user->password_hash
            )
        ) {
            throw new UnauthorizedHttpException(
                'Username atau password salah.'
            );
        }

        return [
            'access_token' => $this->generateToken($user),
            'token_type' => 'Bearer',
            'expires_in' => (int) Yii::$app->params['jwtExpiration'],
            'user' => $this->formatUser($user),
        ];
    }

    public function generateToken(User $user): string
    {
        $secret = Yii::$app->params['jwtSecret'] ?? '';

        if ($secret === '') {
            throw new \RuntimeException(
                'JWT secret belum dikonfigurasi.'
            );
        }

        $now = time();
        $expiration = (int) Yii::$app->params['jwtExpiration'];

        $payload = [
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $expiration,
            'sub' => (string) $user->id,
            'role' => $user->role->code,
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    public function formatUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'username' => $user->username,
            'full_name' => $user->full_name,
            'role' => [
                'code' => $user->role->code,
                'name' => $user->role->name,
            ],
        ];
    }
}