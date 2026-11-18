<?php

namespace app\repositories;

use app\models\MedicalAction;

class MedicalActionRepository
{
    // Mengambil seluruh tindakan medis
    public function findAll(): array
    {
        return MedicalAction::find()
            ->orderBy(['key' => SORT_DESC])
            ->all();
    }

    // Mengambil tindakan berdasarkan UUID
    public function findById(string $id): ?MedicalAction
    {
        return MedicalAction::findOne(['id' => $id]);
    }

    // Mengambil tindakan berdasarkan kode
    public function findByCode(string $code): ?MedicalAction
    {
        return MedicalAction::findOne(['code' => $code]);
    }

    // Menyimpan data baru atau perubahan
    public function save(MedicalAction $action): bool
    {
        return $action->save(false);
    }

    // Memeriksa apakah tindakan masih aktif
    public function isActive(string $id): bool
    {
        return MedicalAction::find()
            ->where([
                'id' => $id,
                'is_active' => true,
            ])
            ->exists();
    }
}