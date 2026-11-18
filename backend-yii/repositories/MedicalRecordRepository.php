<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\MedicalRecord;

class MedicalRecordRepository
{
    public function findAll(): array
    {
        return MedicalRecord::find()
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?MedicalRecord
    {
        return MedicalRecord::findOne(['id' => $id]);
    }

    public function findByVisitId(string $visitId): array
    {
        return MedicalRecord::find()
            ->where(['visit_id' => $visitId])
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function save(MedicalRecord $medicalRecord): bool
    {
        return $medicalRecord->save(false);
    }
}