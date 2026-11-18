<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class Billing extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%billings}}';
    }

    public function rules(): array
    {
        return [
            [['visit_id', 'code'], 'required'],

            [['id', 'visit_id', 'code', 'status'], 'string'],

            [['total_amount', 'paid_amount'], 'number', 'min' => 0],

            [['total_amount', 'paid_amount'], 'default', 'value' => 0],

            [['status'], 'default', 'value' => 'UNPAID'],

            [
                ['status'],
                'in',
                'range' => ['UNPAID', 'PARTIAL', 'PAID'],
            ],

            [['code'], 'unique'],
            [['visit_id'], 'unique'],

            [['key', 'remaining_amount', 'created_at', 'updated_at'], 'safe'],
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
            BillingItem::class,
            ['billing_id' => 'id']
        );
    }

    public function getPayments()
    {
        return $this->hasMany(
            Payment::class,
            ['billing_id' => 'id']
        );
    }
}