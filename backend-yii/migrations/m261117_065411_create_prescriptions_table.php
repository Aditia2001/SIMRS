<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%prescriptions}}`.
 */
class m261117_065411_create_prescriptions_table extends Migration
{
    /**
     * {@inheritdoc}
     */
   public function safeUp()
{
    $this->execute("
        CREATE TABLE prescriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,

            visit_id UUID NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            dispensed_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_prescriptions_visit
                FOREIGN KEY (visit_id)
                REFERENCES visits(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_prescriptions_status
                CHECK (status IN ('PENDING', 'DISPENSED', 'CANCELLED'))
        )
    ");

    $this->createIndex(
        'idx_prescriptions_visit',
        'prescriptions',
        'visit_id'
    );
}

    public function safeDown()
    {
        $this->dropTable('prescriptions');
    }
}