<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class Payment extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%payments}}';
    }

    public function rules(): array
    {
        return [
            [
                ['billing_id', 'code', 'idempotency_key',
                 'amount', 'payment_method'],
                'required',
            ],

            [['billing_id', 'code', 'idempotency_key'], 'string'],

            [['amount'], 'number', 'min' => 0.01],

            [
                ['payment_method'],
                'in',
                'range' => ['CASH', 'NON_CASH'],
            ],

            [['code'], 'unique'],
            [['idempotency_key'], 'unique'],
        ];
    }

    public function getBilling()
    {
        return $this->hasOne(
            Billing::class,
            ['id' => 'billing_id']
        );
    }
}