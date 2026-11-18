<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class PrescriptionItem extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%prescription_items}}';
    }

    public function rules(): array
    {
        return [
            [
                [
                    'prescription_id',
                    'medicine_id',
                    'dosage',
                    'frequency',
                    'quantity',
                    'unit_price',
                ],
                'required',
            ],

            [
                [
                    'prescription_id',
                    'medicine_id',
                    'dosage',
                    'frequency',
                ],
                'string',
            ],

            [['quantity'], 'integer', 'min' => 1],
            [['unit_price'], 'number', 'min' => 0],
        ];
    }

    public function getPrescription()
    {
        return $this->hasOne(
            Prescription::class,
            ['id' => 'prescription_id']
        );
    }

    public function getMedicine()
    {
        return $this->hasOne(
            Medicine::class,
            ['id' => 'medicine_id']
        );
    }
}