<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%billing_items}}`.
 */
class m261117_070246_create_billing_items_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE billing_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,

            billing_id UUID NOT NULL,
            item_type VARCHAR(20) NOT NULL,
            reference_id UUID,

            description VARCHAR(200) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price NUMERIC(15,2) NOT NULL,

            subtotal NUMERIC(15,2)
                GENERATED ALWAYS AS (quantity * unit_price) STORED,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_billing_items_billing
                FOREIGN KEY (billing_id)
                REFERENCES billings(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_billing_items_type
                CHECK (
                    item_type IN (
                        'REGISTRATION',
                        'ACTION',
                        'LAB',
                        'MEDICINE'
                    )
                ),

            CONSTRAINT chk_billing_items_quantity
                CHECK (quantity > 0),

            CONSTRAINT chk_billing_items_price
                CHECK (unit_price >= 0)
        )
    ");

    $this->createIndex(
        'idx_billing_items_billing',
        'billing_items',
        'billing_id'
    );
}

    public function safeDown()
    {
        $this->dropTable('billing_items');
    }
}