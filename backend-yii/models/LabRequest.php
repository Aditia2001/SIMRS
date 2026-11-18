<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class LabRequest extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%lab_requests}}';
    }

    public function rules(): array
    {
        return [
            [['code', 'visit_id', 'examination_name'], 'required'],
            [['code', 'visit_id', 'examination_name', 'notes'], 'string'],
            [['code'], 'unique'],
            [['tariff'], 'number', 'min' => 0],
            [['tariff'], 'default', 'value' => 0],
            [['status'], 'default', 'value' => 'PENDING'],
            [['status'], 'string'],
        ];
    }

    public function getVisit()
    {
        return $this->hasOne(Visit::class, ['id' => 'visit_id']);
    }

    public function getResults()
    {
        return $this->hasMany(
            LabResult::class,
            ['lab_request_id' => 'id']
        );
    }
}