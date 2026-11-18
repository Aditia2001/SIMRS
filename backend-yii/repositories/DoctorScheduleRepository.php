<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\DoctorSchedule;

class DoctorScheduleRepository
{
    public function findAll(): array
    {
        return DoctorSchedule::find()
            ->orderBy([
                'day_of_week' => SORT_ASC,
                'start_time' => SORT_ASC,
            ])
            ->all();
    }

    public function findById(string $id): ?DoctorSchedule
    {
        return DoctorSchedule::findOne(['id' => $id]);
    }

    public function save(DoctorSchedule $schedule): bool
    {
        return $schedule->save();
    }

    public function hasConflict(
        string $doctorId,
        int $dayOfWeek,
        string $startTime,
        string $endTime,
        ?string $excludeId = null
    ): bool {
        $query = DoctorSchedule::find()
            ->where([
                'doctor_id' => $doctorId,
                'day_of_week' => $dayOfWeek,
                'is_active' => true,
            ])
            ->andWhere(['<', 'start_time', $endTime])
            ->andWhere(['>', 'end_time', $startTime]);

        if ($excludeId !== null) {
            $query->andWhere(['<>', 'id', $excludeId]);
        }

        return $query->exists();
    }
}