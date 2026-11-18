<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%prescription_items}}`.
 */
class m261117_065413_create_prescription_items_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE prescription_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,

            prescription_id UUID NOT NULL,
            medicine_id UUID NOT NULL,

            dosage VARCHAR(100) NOT NULL,
            frequency VARCHAR(100) NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price NUMERIC(15,2) NOT NULL,

            subtotal NUMERIC(15,2)
                GENERATED ALWAYS AS (quantity * unit_price) STORED,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_prescription_items_prescription
                FOREIGN KEY (prescription_id)
                REFERENCES prescriptions(id)
                ON DELETE RESTRICT,

            CONSTRAINT fk_prescription_items_medicine
                FOREIGN KEY (medicine_id)
                REFERENCES medicines(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_prescription_items_quantity
                CHECK (quantity > 0),

            CONSTRAINT chk_prescription_items_price
                CHECK (unit_price >= 0)
        )
    ");

    $this->createIndex(
        'idx_prescription_items_prescription',
        'prescription_items',
        'prescription_id'
    );
}

    public function safeDown()
    {
        $this->dropTable('prescription_items');
    }
}