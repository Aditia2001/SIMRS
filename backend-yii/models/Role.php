<?php

namespace app\models;

use yii\db\ActiveRecord;

class Role extends ActiveRecord
{
    public static function tableName()
    {
        return 'roles';
    }

    public function getUsers()
    {
        return $this->hasMany(User::class, ['role_id' => 'id']);
    }
}