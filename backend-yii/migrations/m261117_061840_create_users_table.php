<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%users}}`.
 */
class m261117_061840_create_users_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
{
    $this->execute("
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            role_id UUID NOT NULL,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(150) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ,

            CONSTRAINT fk_users_role
                FOREIGN KEY (role_id)
                REFERENCES roles(id)
                ON DELETE RESTRICT
        )
    ");

    $this->createIndex(
        'idx_users_role_id',
        'users',
        'role_id'
    );
}

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropTable('users');
    }
}