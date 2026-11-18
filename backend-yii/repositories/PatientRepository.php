<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\Patient;

class PatientRepository
{
    public function findAll(): array
    {
        return Patient::find()
            ->orderBy(['key' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?Patient
    {
        return Patient::findOne(['id' => $id]);
    }

    public function save(Patient $patient): bool
    {
        return $patient->save();
    }
}