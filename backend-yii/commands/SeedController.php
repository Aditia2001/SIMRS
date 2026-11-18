<?php

declare(strict_types=1);

namespace app\commands;

use Yii;
use yii\console\Controller;

class SeedController extends Controller
{
    /**
     * Membuat akun administrator.
     * Password diambil dari SIMRS_ADMIN_PASSWORD.
     *
     * php yii seed/admin
     */
    public function actionAdmin(): int
    {
        $username = 'admin';

        $password = getenv('SIMRS_ADMIN_PASSWORD')
            ?: ($_ENV['SIMRS_ADMIN_PASSWORD'] ?? '');

        if ($password === '') {
            $this->stderr(
                "SIMRS_ADMIN_PASSWORD belum diatur di .env\n"
            );

            return self::EXIT_CODE_ERROR;
        }

        $roleId = Yii::$app->db->createCommand(
            'SELECT id FROM roles WHERE code = :code',
            [':code' => 'ADMIN']
        )->queryScalar();

        if (!$roleId) {
            $this->stderr("Role ADMIN tidak ditemukan.\n");

            return self::EXIT_CODE_ERROR;
        }

        $existing = Yii::$app->db->createCommand(
            'SELECT id FROM users WHERE username = :username',
            [':username' => $username]
        )->queryScalar();

        if ($existing) {
            $this->stdout("Akun admin sudah tersedia.\n");

            return self::EXIT_CODE_NORMAL;
        }

        $hash = Yii::$app->security
            ->generatePasswordHash($password);

        Yii::$app->db->createCommand()->insert('users', [
            'role_id' => $roleId,
            'username' => $username,
            'password_hash' => $hash,
            'full_name' => 'SIMRS Administrator',
            'is_active' => true,
        ])->execute();

        $this->stdout("Akun admin berhasil dibuat.\n");

        return self::EXIT_CODE_NORMAL;
    }

    /**
     * Membuat akun petugas untuk pengujian RBAC.
     *
     * php yii seed/users
     */
    public function actionUsers(): int
    {
        $accounts = [
            [
                'role' => 'REGISTRATION',
                'username' => 'registration',
                'full_name' => 'Petugas Pendaftaran',
            ],
            [
                'role' => 'DOCTOR',
                'username' => 'doctor',
                'full_name' => 'Dokter SIMRS',
            ],
            [
                'role' => 'PHARMACY',
                'username' => 'pharmacy',
                'full_name' => 'Petugas Farmasi',
            ],
            [
                'role' => 'LABORATORY',
                'username' => 'laboratory',
                'full_name' => 'Petugas Laboratorium',
            ],
            [
                'role' => 'CASHIER',
                'username' => 'cashier',
                'full_name' => 'Kasir SIMRS',
            ],
        ];

        $password = getenv('SIMRS_STAFF_PASSWORD')
            ?: ($_ENV['SIMRS_STAFF_PASSWORD'] ?? '');

        if ($password === '') {
            $this->stderr(
                "SIMRS_STAFF_PASSWORD belum diatur di .env\n"
            );

            return self::EXIT_CODE_ERROR;
        }

        $db = Yii::$app->db;
        $created = 0;
        $skipped = 0;

        foreach ($accounts as $account) {
            $roleId = $db->createCommand(
                'SELECT id FROM roles WHERE code = :code',
                [':code' => $account['role']]
            )->queryScalar();

            if (!$roleId) {
                $this->stderr(
                    "Role {$account['role']} tidak ditemukan.\n"
                );

                return self::EXIT_CODE_ERROR;
            }

            $existing = $db->createCommand(
                'SELECT id FROM users WHERE username = :username',
                [':username' => $account['username']]
            )->queryScalar();

            if ($existing) {
                $this->stdout(
                    "SKIP: {$account['username']} sudah tersedia.\n"
                );

                $skipped++;
                continue;
            }

            $hash = Yii::$app->security
                ->generatePasswordHash($password);

            $db->createCommand()->insert('users', [
                'role_id' => $roleId,
                'username' => $account['username'],
                'password_hash' => $hash,
                'full_name' => $account['full_name'],
                'is_active' => true,
            ])->execute();

            $this->stdout(
                "BERHASIL: {$account['username']} ({$account['role']})\n"
            );

            $created++;
        }

        $this->stdout("\nSeed pengguna selesai.\n");
        $this->stdout("Dibuat: {$created}\n");
        $this->stdout("Dilewati: {$skipped}\n");

        return self::EXIT_CODE_NORMAL;
    }
}