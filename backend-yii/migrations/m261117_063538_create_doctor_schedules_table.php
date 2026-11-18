<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%doctor_schedules}}`.
 */
class m261117_063538_create_doctor_schedules_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
{
    $this->execute("
        CREATE TABLE doctor_schedules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            doctor_id UUID NOT NULL,
            polyclinic_id UUID NOT NULL,
            day_of_week SMALLINT NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_doctor_schedules_doctor
                FOREIGN KEY (doctor_id)
                REFERENCES medical_staff(id)
                ON DELETE RESTRICT,

            CONSTRAINT fk_doctor_schedules_polyclinic
                FOREIGN KEY (polyclinic_id)
                REFERENCES polyclinics(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_doctor_schedules_day
                CHECK (day_of_week BETWEEN 1 AND 7),

            CONSTRAINT chk_doctor_schedules_time
                CHECK (start_time < end_time),

            CONSTRAINT uq_doctor_schedule
                UNIQUE (
                    doctor_id,
                    polyclinic_id,
                    day_of_week,
                    start_time
                )
        )
    ");

    $this->createIndex(
        'idx_doctor_schedules_polyclinic',
        'doctor_schedules',
        'polyclinic_id'
    );

    $this->createIndex(
        'idx_doctor_schedules_doctor',
        'doctor_schedules',
        'doctor_id'
    );
}

    public function safeDown()
    {
        $this->dropTable('doctor_schedules');
    }
}