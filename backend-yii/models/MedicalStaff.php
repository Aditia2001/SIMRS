<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class MedicalStaff extends ActiveRecord
{
    public static function tableName(): string
    {
        return 'medical_staff';
    }

    public function rules(): array
    {
        return [
            [['full_name', 'staff_type'], 'required'],
            [['full_name', 'staff_type', 'specialization',
              'license_number', 'phone'], 'trim'],

            ['full_name', 'string', 'max' => 150],
            ['staff_type', 'in', 'range' => ['DOCTOR', 'NURSE', 'OTHER']],
            ['specialization', 'string', 'max' => 100],
            ['license_number', 'string', 'max' => 100],
            ['phone', 'string', 'max' => 20],

            ['is_active', 'boolean'],
            ['is_active', 'default', 'value' => true],
        ];
    }
}