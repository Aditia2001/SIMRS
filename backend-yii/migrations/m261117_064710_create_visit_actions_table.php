<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%visit_actions}}`.
 */
class m261117_064710_create_visit_actions_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE visit_actions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,

            visit_id UUID NOT NULL,
            medical_action_id UUID NOT NULL,

            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price NUMERIC(15,2) NOT NULL,
            subtotal NUMERIC(15,2)
                GENERATED ALWAYS AS (quantity * unit_price) STORED,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_visit_actions_visit
                FOREIGN KEY (visit_id)
                REFERENCES visits(id)
                ON DELETE RESTRICT,

            CONSTRAINT fk_visit_actions_medical_action
                FOREIGN KEY (medical_action_id)
                REFERENCES medical_actions(id)
                ON DELETE RESTRICT,

            CONSTRAINT chk_visit_actions_quantity
                CHECK (quantity > 0),

            CONSTRAINT chk_visit_actions_price
                CHECK (unit_price >= 0)
        )
    ");

    $this->createIndex(
        'idx_visit_actions_visit',
        'visit_actions',
        'visit_id'
    );

    $this->createIndex(
        'idx_visit_actions_medical_action',
        'visit_actions',
        'medical_action_id'
    );
}

    public function safeDown()
    {
        $this->dropTable('visit_actions');
    }
}