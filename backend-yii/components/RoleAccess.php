<?php

declare(strict_types=1);

namespace app\components;

use app\models\User;
use yii\web\ForbiddenHttpException;

class RoleAccess
{
    public static function requireRole(
        User $user,
        array $allowedRoles
    ): void {
        $roleCode = $user->role?->code;

        if (
            $roleCode !== 'ADMIN' &&
            !in_array($roleCode, $allowedRoles, true)
        ) {
            throw new ForbiddenHttpException(
                'Anda tidak memiliki akses ke fitur ini.'
            );
        }
    }
}