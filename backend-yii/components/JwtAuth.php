<?php

declare(strict_types=1);

namespace app\components;

use app\models\User;
use app\repositories\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Yii;
use yii\web\UnauthorizedHttpException;

class JwtAuth
{
    public static function authenticate(): User
    {
        $authorization = Yii::$app->request
            ->headers->get('Authorization', '');

        if (!preg_match('/^Bearer\s+(\S+)$/i', $authorization, $matches)) {
            throw new UnauthorizedHttpException(
                'Bearer token wajib disertakan.'
            );
        }

        $secret = Yii::$app->params['jwtSecret'] ?? '';

        if ($secret === '') {
            throw new \RuntimeException(
                'JWT secret belum dikonfigurasi.'
            );
        }

        try {
            $decoded = JWT::decode(
                $matches[1],
                new Key($secret, 'HS256')
            );
        } catch (\Firebase\JWT\ExpiredException $exception) {
            throw new UnauthorizedHttpException(
                'Token sudah kedaluwarsa.'
            );
        } catch (\Exception $exception) {
            throw new UnauthorizedHttpException(
                'Token tidak valid.'
            );
        }

        $userId = (string) ($decoded->sub ?? '');

        if ($userId === '') {
            throw new UnauthorizedHttpException(
                'Token tidak memiliki identitas pengguna.'
            );
        }

        $repository = new UserRepository();
        $user = $repository->findById($userId);

        if ($user === null) {
            throw new UnauthorizedHttpException(
                'Pengguna tidak ditemukan atau tidak aktif.'
            );
        }

        return $user;
    }
}