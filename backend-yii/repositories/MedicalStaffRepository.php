<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\MedicalStaff;

class MedicalStaffRepository
{
    public function findAll(): array
    {
        return MedicalStaff::find()
            ->orderBy(['key' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?MedicalStaff
    {
        return MedicalStaff::findOne(['id' => $id]);
    }

    public function save(MedicalStaff $staff): bool
    {
        return $staff->save();
    }
}