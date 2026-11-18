<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%medical_actions}}`.
 */
class m261117_064002_create_medical_actions_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE medical_actions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,
            name VARCHAR(150) NOT NULL,
            description TEXT,
            tariff NUMERIC(15,2) NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT chk_medical_actions_tariff
                CHECK (tariff >= 0)
        )
    ");
}

    public function safeDown()
    {
        $this->dropTable('medical_actions');
    }
}