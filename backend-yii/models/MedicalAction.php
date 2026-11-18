<?php

namespace app\models;

use yii\db\ActiveRecord;

class MedicalAction extends ActiveRecord
{
    public static function tableName()
    {
        return 'medical_actions';
    }

    public function rules()
    {
        return [
            [['name', 'tariff'], 'required'],

            [['name', 'description'], 'trim'],

            [['name', 'code'], 'string', 'max' => 255],

            [['description'], 'string'],

            [['tariff'], 'number', 'min' => 0],

            [['is_active'], 'boolean'],

            [['is_active'], 'default', 'value' => true],

            [['code'], 'unique'],
        ];
    }

    public function fields()
    {
        return [
            'id',
            'key',
            'code',
            'name',
            'description',
            'tariff',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }
}