<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class LabResult extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%lab_results}}';
    }

    public function rules(): array
    {
        return [
            [['lab_request_id', 'result_value'], 'required'],
            [
                ['lab_request_id', 'result_value',
                 'unit', 'reference_range', 'notes'],
                'string',
            ],
        ];
    }

    public function getLabRequest()
    {
        return $this->hasOne(
            LabRequest::class,
            ['id' => 'lab_request_id']
        );
    }
}