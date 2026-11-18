<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%roles}}`.
 */
class m261117_061833_create_roles_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
{
    $this->execute("
        CREATE TABLE roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            \"key\" BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
            code VARCHAR(30) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        )
    ");

    $this->batchInsert(
        'roles',
        ['code', 'name'],
        [
            ['ADMIN', 'Administrator'],
            ['REGISTRATION', 'Petugas Pendaftaran'],
            ['DOCTOR', 'Dokter'],
            ['PHARMACY', 'Petugas Farmasi'],
            ['LABORATORY', 'Petugas Laboratorium'],
            ['CASHIER', 'Kasir'],
        ]
    );
}


    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropTable('roles');
    }
}