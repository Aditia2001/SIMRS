<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class Polyclinic extends ActiveRecord
{
    public static function tableName(): string
    {
        return 'polyclinics';
    }

    public function rules(): array
    {
        return [
            [['name'], 'required'],
            [['name', 'description'], 'trim'],
            ['name', 'string', 'max' => 100],
            ['description', 'string'],
            ['is_active', 'boolean'],
            ['is_active', 'default', 'value' => true],
        ];
    }
}