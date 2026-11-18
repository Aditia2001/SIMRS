<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class MedicalRecord extends ActiveRecord
{
    public static function tableName(): string
    {
        return 'medical_records';
    }

    public function rules(): array
    {
        return [
            [['visit_id', 'chief_complaint'], 'required'],

            [['visit_id'], 'string'],

            [['chief_complaint', 'anamnesis',
              'physical_examination', 'primary_diagnosis',
              'secondary_diagnosis'], 'string'],

            [['blood_pressure'], 'string', 'max' => 20],

            [['heart_rate', 'respiratory_rate',
              'oxygen_saturation'], 'integer'],

            [['temperature', 'weight', 'height'], 'number'],

            [['visit_id'], 'exist',
                'targetClass' => Visit::class,
                'targetAttribute' => ['visit_id' => 'id'],
            ],
        ];
    }
}