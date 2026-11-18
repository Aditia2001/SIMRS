<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%billings}}`.
 */
class m261117_070243_create_billings_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE billings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,

            visit_id UUID NOT NULL UNIQUE,

            total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
            paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
            remaining_amount NUMERIC(15,2)
                GENERATED ALWAYS AS (total_amount - paid_amount) STORED,

            status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_billings_visit
                FOREIGN KEY (visit_id)
                REFERENCES visits(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_billings_total
                CHECK (total_amount >= 0),

            CONSTRAINT chk_billings_paid
                CHECK (paid_amount >= 0 AND paid_amount <= total_amount),

            CONSTRAINT chk_billings_status
                CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID'))
        )
    ");
}

    public function safeDown()
    {
        $this->dropTable('billings');
    }
}