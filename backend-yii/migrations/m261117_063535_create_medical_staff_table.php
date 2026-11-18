<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%medical_staff}}`.
 */
class m261117_063535_create_medical_staff_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
{
    $this->execute("
        CREATE TABLE medical_staff (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,
            full_name VARCHAR(150) NOT NULL,
            staff_type VARCHAR(20) NOT NULL,
            specialization VARCHAR(100),
            license_number VARCHAR(100) UNIQUE,
            phone VARCHAR(20),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT chk_medical_staff_type
                CHECK (staff_type IN ('DOCTOR', 'NURSE', 'OTHER'))
        )
    ");

    $this->createIndex(
        'idx_medical_staff_type',
        'medical_staff',
        'staff_type'
    );
}

    public function safeDown()
    {
        $this->dropTable('medical_staff');
    }
}