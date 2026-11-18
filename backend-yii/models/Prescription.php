<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class Prescription extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%prescriptions}}';
    }

    public function rules(): array
    {
        return [
            [['code', 'visit_id'], 'required'],
            [['code', 'visit_id'], 'string'],
            [['code'], 'unique'],
            [['status'], 'default', 'value' => 'PENDING'],
            [
                ['status'],
                'in',
                'range' => ['PENDING', 'DISPENSED'],
            ],
        ];
    }

    public function getVisit()
    {
        return $this->hasOne(
            Visit::class,
            ['id' => 'visit_id']
        );
    }

    public function getItems()
    {
        return $this->hasMany(
            PrescriptionItem::class,
            ['prescription_id' => 'id']
        );
    }
}