<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class Visit extends ActiveRecord
{
    public static function tableName(): string
    {
        return 'visits';
    }

    public function rules(): array
    {
        return [
            [
                [
                    'patient_id',
                    'polyclinic_id',
                    'doctor_id',
                    'visit_date',
                ],
                'required',
            ],

            [
                [
                    'patient_id',
                    'polyclinic_id',
                    'doctor_id',
                ],
                'string',
                'max' => 36,
            ],

            [
                'visit_date',
                'date',
                'format' => 'php:Y-m-d',
            ],

            [
                'queue_number',
                'integer',
                'min' => 1,
            ],

            [
                'registration_fee',
                'number',
                'min' => 0,
            ],

            [
                'status',
                'in',
                'range' => [
                    'WAITING',
                    'IN_PROGRESS',
                    'COMPLETED',
                    'CANCELLED',
                ],
            ],

            [
                'status',
                'default',
                'value' => 'WAITING',
            ],

            [
                'registration_fee',
                'default',
                'value' => 0,
            ],
        ];
    }
}