<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class BillingItem extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%billing_items}}';
    }

    public function rules(): array
    {
        return [
            [
                ['billing_id', 'item_type', 'description', 'unit_price'],
                'required',
            ],

            [
                ['id', 'billing_id', 'item_type', 'reference_id', 'description'],
                'string',
            ],

            [
                ['item_type'],
                'in',
                'range' => [
                    'REGISTRATION',
                    'ACTION',
                    'LAB',
                    'MEDICINE',
                ],
            ],

            [['quantity'], 'integer', 'min' => 1],

            [['quantity'], 'default', 'value' => 1],

            [['unit_price'], 'number', 'min' => 0],

            [['key', 'subtotal', 'created_at', 'updated_at'], 'safe'],
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