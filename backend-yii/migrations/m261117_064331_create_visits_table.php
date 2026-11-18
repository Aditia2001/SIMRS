<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%visits}}`.
 */
class m261117_064331_create_visits_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE visits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,

            patient_id UUID NOT NULL,
            polyclinic_id UUID NOT NULL,
            doctor_id UUID NOT NULL,

            visit_date DATE NOT NULL,
            queue_number INTEGER NOT NULL,

            status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
            registration_fee NUMERIC(15,2) NOT NULL DEFAULT 0,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_visits_patient
                FOREIGN KEY (patient_id)
                REFERENCES patients(id)
                ON DELETE RESTRICT,

            CONSTRAINT fk_visits_polyclinic
                FOREIGN KEY (polyclinic_id)
                REFERENCES polyclinics(id)
                ON DELETE RESTRICT,

            CONSTRAINT fk_visits_doctor
                FOREIGN KEY (doctor_id)
                REFERENCES medical_staff(id)
                ON DELETE RESTRICT,

            CONSTRAINT uq_visits_queue
                UNIQUE (visit_date, polyclinic_id, queue_number),

            CONSTRAINT chk_visits_queue
                CHECK (queue_number > 0),

            CONSTRAINT chk_visits_fee
                CHECK (registration_fee >= 0),

            CONSTRAINT chk_visits_status
                CHECK (
                    status IN (
                        'WAITING',
                        'IN_PROGRESS',
                        'COMPLETED',
                        'CANCELLED'
                    )
                )
        )
    ");

    $this->createIndex(
        'idx_visits_patient_date',
        'visits',
        ['patient_id', 'visit_date']
    );

    $this->createIndex(
        'idx_visits_polyclinic_date',
        'visits',
        ['polyclinic_id', 'visit_date']
    );

    $this->execute("
        CREATE UNIQUE INDEX uq_visits_active_registration
        ON visits (patient_id, polyclinic_id, visit_date)
        WHERE status <> 'CANCELLED'
    ");
}

    public function safeDown()
    {
        $this->dropTable('visits');
    }
}