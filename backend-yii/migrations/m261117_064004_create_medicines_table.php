<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%medicines}}`.
 */
class m261117_064004_create_medicines_table extends Migration
{
    /**
     * {@inheritdoc}
     */
public function safeUp()
{
    $this->execute("
        CREATE TABLE medicines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,
            name VARCHAR(150) NOT NULL,
            unit VARCHAR(30) NOT NULL,
            price NUMERIC(15,2) NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT chk_medicines_price
                CHECK (price >= 0),

            CONSTRAINT chk_medicines_stock
                CHECK (stock >= 0)
        )
    ");

    $this->createIndex(
        'idx_medicines_name',
        'medicines',
        'name'
    );
}

    public function safeDown()
    {
        $this->dropTable('medicines');
    }
}