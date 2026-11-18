<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class Medicine extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%medicines}}';
    }

    public function rules(): array
    {
        return [
            [['code', 'name', 'unit'], 'required'],
            [['code', 'name', 'unit'], 'string', 'max' => 255],
            [['code'], 'unique'],
            [['price'], 'number', 'min' => 0],
            [['stock'], 'integer', 'min' => 0],
            [['price', 'stock'], 'default', 'value' => 0],
            [['is_active'], 'boolean'],
            [['is_active'], 'default', 'value' => true],
        ];
    }
}