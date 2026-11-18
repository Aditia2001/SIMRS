<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%payments}}`.
 */
class m261117_070248_create_payments_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,

            billing_id UUID NOT NULL,
            idempotency_key UUID NOT NULL UNIQUE,

            amount NUMERIC(15,2) NOT NULL,
            payment_method VARCHAR(20) NOT NULL,

            paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT fk_payments_billing
                FOREIGN KEY (billing_id)
                REFERENCES billings(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_payments_amount
                CHECK (amount > 0),

            CONSTRAINT chk_payments_method
                CHECK (payment_method IN ('CASH', 'NON_CASH'))
        )
    ");

    $this->createIndex(
        'idx_payments_billing',
        'payments',
        'billing_id'
    );
}

    public function safeDown()
    {
        $this->dropTable('payments');
    }
}