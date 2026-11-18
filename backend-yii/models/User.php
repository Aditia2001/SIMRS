<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;
use yii\web\IdentityInterface;

class User extends ActiveRecord implements IdentityInterface
{
    public static function tableName(): string
    {
        return 'users';
    }

    public function getRole()
    {
        return $this->hasOne(Role::class, ['id' => 'role_id']);
    }

    public static function findByUsername(string $username): ?static
    {
        return static::find()
            ->where(['username' => $username, 'is_active' => true])
            ->one();
    }

    public static function findIdentity($id): ?static
    {
        return static::findOne([
            'id' => $id,
            'is_active' => true,
        ]);
    }

    public static function findIdentityByAccessToken(
        $token,
        $type = null
    ): ?static {
        return null;
    }

    public function getId(): string
    {
        return (string) $this->getPrimaryKey();
    }

    public function getAuthKey(): ?string
    {
        return null;
    }

    public function validateAuthKey($authKey): bool
    {
        return false;
    }
}