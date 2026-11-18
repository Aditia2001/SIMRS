<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%document_sequences}}`.
 */
class m261117_055137_create_document_sequences_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
     {
        $this->execute("
            CREATE TABLE document_sequences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
                prefix VARCHAR(10) NOT NULL,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                last_number BIGINT NOT NULL DEFAULT 0,

                CONSTRAINT uq_document_sequence
                    UNIQUE (prefix, year, month),

                CONSTRAINT chk_sequence_month
                    CHECK (month BETWEEN 1 AND 12),

                CONSTRAINT chk_sequence_number
                    CHECK (last_number >= 0)
            )
        ");
    }


    /**
     * {@inheritdoc}
     */
     public function safeDown()
    {
        $this->dropTable('document_sequences');
    }
}