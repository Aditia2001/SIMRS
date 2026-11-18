<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%lab_requests}}`.
 */
class m261117_065415_create_lab_requests_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE lab_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,

            visit_id UUID NOT NULL,
            examination_name VARCHAR(150) NOT NULL,
            notes TEXT,
            tariff NUMERIC(15,2) NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_lab_requests_visit
                FOREIGN KEY (visit_id)
                REFERENCES visits(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_lab_requests_tariff
                CHECK (tariff >= 0),

            CONSTRAINT chk_lab_requests_status
                CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED'))
        )
    ");

    $this->createIndex(
        'idx_lab_requests_visit',
        'lab_requests',
        'visit_id'
    );
}

    public function safeDown()
    {
        $this->dropTable('lab_requests');
    }
}