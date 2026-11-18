<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class DoctorSchedule extends ActiveRecord
{
    public static function tableName(): string
    {
        return 'doctor_schedules';
    }

    public function rules(): array
    {
        return [
            [
                [
                    'doctor_id',
                    'polyclinic_id',
                    'day_of_week',
                    'start_time',
                    'end_time'
                ],
                'required'
            ],

            [
                ['doctor_id', 'polyclinic_id'],
                'string',
                'max' => 36
            ],

            [
                'day_of_week',
                'integer',
                'min' => 1,
                'max' => 7
            ],

            [
                ['start_time', 'end_time'],
                'time',
                'format' => 'php:H:i'
            ],

            [
                'is_active',
                'boolean'
            ],

            [
                'is_active',
                'default',
                'value' => true
            ],

            [
                'doctor_id',
                'exist',
                'targetClass' => MedicalStaff::class,
                'targetAttribute' => ['doctor_id' => 'id']
            ],

            [
                'polyclinic_id',
                'exist',
                'targetClass' => Polyclinic::class,
                'targetAttribute' => ['polyclinic_id' => 'id']
            ]
        ];
    }
}