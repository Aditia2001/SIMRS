<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%medical_records}}`.
 */
class m261117_064707_create_medical_records_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE medical_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,

            visit_id UUID NOT NULL UNIQUE,

            chief_complaint TEXT NOT NULL,
            anamnesis TEXT,
            blood_pressure VARCHAR(20),
            heart_rate INTEGER,
            respiratory_rate INTEGER,
            temperature NUMERIC(4,1),
            oxygen_saturation INTEGER,
            weight NUMERIC(5,2),
            height NUMERIC(5,2),

            physical_examination TEXT,
            primary_diagnosis TEXT,
            secondary_diagnosis TEXT,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_medical_records_visit
                FOREIGN KEY (visit_id)
                REFERENCES visits(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_medical_records_heart_rate
                CHECK (heart_rate > 0),

            CONSTRAINT chk_medical_records_respiratory_rate
                CHECK (respiratory_rate > 0),

            CONSTRAINT chk_medical_records_oxygen
                CHECK (oxygen_saturation BETWEEN 0 AND 100),

            CONSTRAINT chk_medical_records_weight
                CHECK (weight > 0),

            CONSTRAINT chk_medical_records_height
                CHECK (height > 0)
        )
    ");
}

    public function safeDown()
    {
        $this->dropTable('medical_records');
    }
}