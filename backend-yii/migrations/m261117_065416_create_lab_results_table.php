<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%lab_results}}`.
 */
class m261117_065416_create_lab_results_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE lab_results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,

            lab_request_id UUID NOT NULL UNIQUE,
            result_value TEXT NOT NULL,
            unit VARCHAR(50),
            reference_range VARCHAR(100),
            notes TEXT,
            examined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_lab_results_request
                FOREIGN KEY (lab_request_id)
                REFERENCES lab_requests(id)
                ON DELETE RESTRICT
        )
    ");
}

    public function safeDown()
    {
        $this->dropTable('lab_results');
    }
}