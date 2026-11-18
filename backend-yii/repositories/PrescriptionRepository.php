<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\Prescription;
use app\models\PrescriptionItem;

class PrescriptionRepository
{
    public function findAll(): array
    {
        return Prescription::find()
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?Prescription
    {
        return Prescription::findOne(['id' => $id]);
    }

    public function findByVisitId(string $visitId): array
    {
        return Prescription::find()
            ->where(['visit_id' => $visitId])
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function findItems(string $prescriptionId): array
    {
        return PrescriptionItem::find()
            ->where(['prescription_id' => $prescriptionId])
            ->orderBy(['key' => SORT_ASC])
            ->all();
    }

    public function save(Prescription $prescription): bool
    {
        return $prescription->save(false);
    }

    public function saveItem(PrescriptionItem $item): bool
    {
        return $item->save(false);
    }
}