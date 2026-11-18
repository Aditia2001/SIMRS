<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\Medicine;

class MedicineRepository
{
    public function findAll(
        ?string $search = null
    ): array {
        $query = Medicine::find();

        if ($search !== null && $search !== '') {
            $query->andWhere([
                'or',
                ['ilike', 'name', $search],
                ['ilike', 'code', $search],
            ]);
        }

        return $query->orderBy(['name' => SORT_ASC])->all();
    }

    public function findById(string $id): ?Medicine
    {
        return Medicine::findOne(['id' => $id]);
    }

    public function save(Medicine $medicine): bool
    {
        return $medicine->save();
    }

    public function delete(Medicine $medicine): bool
    {
        // Soft delete agar referensi resep tetap terjaga.
        $medicine->is_active = false;

        return $medicine->save(false, ['is_active']);
    }
}