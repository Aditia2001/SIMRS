<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%polyclinics}}`.
 */
class m261117_062255_create_polyclinics_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
{
    $this->execute("
        CREATE TABLE polyclinics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        )
    ");
}

    public function safeDown()
    {
        $this->dropTable('polyclinics');
    }
}