<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%patients}}`.
 */
class m261117_062247_create_patients_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
{
    $this->execute("
        CREATE TABLE patients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,
            medical_record_number VARCHAR(30) NOT NULL UNIQUE,
            identity_number VARCHAR(30) UNIQUE,
            full_name VARCHAR(150) NOT NULL,
            gender VARCHAR(10) NOT NULL,
            birth_date DATE NOT NULL,
            phone VARCHAR(20),
            address TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT chk_patients_gender
                CHECK (gender IN ('MALE', 'FEMALE'))
        )
    ");

    $this->createIndex(
        'idx_patients_full_name',
        'patients',
        'full_name'
    );
}

    public function safeDown()
    {
        $this->dropTable('patients');
    }
}