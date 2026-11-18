<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\Polyclinic;

class PolyclinicRepository
{
    public function findAll(): array
    {
        return Polyclinic::find()
            ->orderBy(['key' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?Polyclinic
    {
        return Polyclinic::findOne(['id' => $id]);
    }

    public function save(Polyclinic $polyclinic): bool
    {
        return $polyclinic->save();
    }
}