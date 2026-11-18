<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class Patient extends ActiveRecord
{
    public static function tableName(): string
    {
        return 'patients';
    }

    public function rules(): array
    {
        return [
            [['full_name', 'gender', 'birth_date'], 'required'],
            [['full_name', 'gender', 'birth_date'], 'trim', 'skipOnArray' => true],
            [['full_name', 'identity_number', 'phone', 'address'], 'string'],
            ['gender', 'in', 'range' => ['MALE', 'FEMALE']],
            ['birth_date', 'date', 'format' => 'php:Y-m-d'],
            ['birth_date', 'compare', 'compareValue' => date('Y-m-d'), 'operator' => '<='],
            ['identity_number', 'unique'],
        ];
    }
}