<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\Visit;

class VisitRepository
{
    public function findAll(): array
    {
        return Visit::find()
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?Visit
    {
        return Visit::findOne(['id' => $id]);
    }

    public function findByPatientId(string $patientId): array
    {
        return Visit::find()
            ->where(['patient_id' => $patientId])
            ->orderBy(['visit_date' => SORT_DESC])
            ->all();
    }

    public function findByDateAndPolyclinic(
        string $visitDate,
        string $polyclinicId
    ): array {
        return Visit::find()
            ->where([
                'visit_date' => $visitDate,
                'polyclinic_id' => $polyclinicId,
            ])
            ->orderBy(['queue_number' => SORT_ASC])
            ->all();
    }

    public function getNextQueueNumber(
        string $visitDate,
        string $polyclinicId
    ): int {
        $maxQueue = Visit::find()
            ->where([
                'visit_date' => $visitDate,
                'polyclinic_id' => $polyclinicId,
            ])
            ->max('queue_number');

        return ((int) $maxQueue) + 1;
    }

    public function save(Visit $visit): bool
    {
        return $visit->save(false);
    }
}