<?php

declare(strict_types=1);

namespace app\services;

use app\models\DoctorSchedule;
use app\models\MedicalStaff;
use app\models\Polyclinic;
use app\repositories\DoctorScheduleRepository;
use app\repositories\DocumentSequenceRepository;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class DoctorScheduleService
{
    private DoctorScheduleRepository $repository;
    private DocumentSequenceRepository $sequenceRepository;

    public function __construct()
    {
        $this->repository = new DoctorScheduleRepository();
        $this->sequenceRepository = new DocumentSequenceRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn(DoctorSchedule $schedule) => $schedule->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        return $this->findOrFail($id)->toArray();
    }

    public function create(array $data): array
    {
        $schedule = new DoctorSchedule();
        $schedule->setAttributes($data);

        $this->validateSchedule($schedule);

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $schedule->code =
                $this->sequenceRepository->generateCode('JDW');

            if (!$this->repository->save($schedule)) {
                $this->throwValidationErrors($schedule);
            }

            $transaction->commit();

            return $schedule->toArray();
        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }

    public function update(string $id, array $data): array
    {
        $schedule = $this->findOrFail($id);

        // Tidak mengizinkan perubahan kode otomatis.
        unset($data['id'], $data['key'], $data['code']);

        $schedule->setAttributes($data);

        $this->validateSchedule($schedule, $id);

        if (!$this->repository->save($schedule)) {
            $this->throwValidationErrors($schedule);
        }

        return $schedule->toArray();
    }

    private function validateSchedule(
        DoctorSchedule $schedule,
        ?string $excludeId = null
    ): void {
        if (!$schedule->validate()) {
            $this->throwValidationErrors($schedule);
        }

        $doctor = MedicalStaff::findOne([
            'id' => $schedule->doctor_id,
        ]);

        if ($doctor === null ||
            $doctor->staff_type !== 'DOCTOR' ||
            !$doctor->is_active) {
            throw new BadRequestHttpException(
                'Dokter tidak ditemukan atau tidak aktif.'
            );
        }

        $polyclinic = Polyclinic::findOne([
            'id' => $schedule->polyclinic_id,
        ]);

        if ($polyclinic === null || !$polyclinic->is_active) {
            throw new BadRequestHttpException(
                'Poliklinik tidak ditemukan atau tidak aktif.'
            );
        }

        if ($schedule->start_time >= $schedule->end_time) {
            throw new BadRequestHttpException(
                'Jam selesai harus lebih besar dari jam mulai.'
            );
        }

        // Jadwal nonaktif tidak perlu diperiksa bentroknya.
        if (!$schedule->is_active) {
            return;
        }

        $hasConflict = $this->repository->hasConflict(
            $schedule->doctor_id,
            (int) $schedule->day_of_week,
            $schedule->start_time,
            $schedule->end_time,
            $excludeId
        );

        if ($hasConflict) {
            throw new BadRequestHttpException(
                'Dokter sudah memiliki jadwal pada hari dan jam tersebut.'
            );
        }
    }

    private function findOrFail(string $id): DoctorSchedule
    {
        $schedule = $this->repository->findById($id);

        if ($schedule === null) {
            throw new NotFoundHttpException(
                'Jadwal dokter tidak ditemukan.'
            );
        }

        return $schedule;
    }

    private function throwValidationErrors(
        DoctorSchedule $schedule
    ): never {
        throw new BadRequestHttpException(
            json_encode(
                $schedule->getErrors(),
                JSON_UNESCAPED_UNICODE
            )
        );
    }
}