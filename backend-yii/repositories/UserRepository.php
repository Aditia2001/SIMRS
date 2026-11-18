<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\User;

class UserRepository
{
    public function findByUsername(string $username): ?User
    {
        return User::find()
            ->with('role')
            ->where([
                'username' => $username,
                'is_active' => true,
            ])
            ->one();
    }

    public function findById(string $id): ?User
    {
        return User::find()
            ->with('role')
            ->where([
                'id' => $id,
                'is_active' => true,
            ])
            ->one();
    }
}