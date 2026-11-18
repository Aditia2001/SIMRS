<?php

declare(strict_types=1);

namespace app\services;

use app\models\Visit;
use app\models\Patient;
use app\models\Polyclinic;
use app\models\MedicalStaff;
use app\models\DoctorSchedule;
use app\repositories\VisitRepository;
use app\repositories\DocumentSequenceRepository;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class VisitService
{
    private VisitRepository $repository;
    private DocumentSequenceRepository $sequenceRepository;

    public function __construct()
    {
        $this->repository = new VisitRepository();
        $this->sequenceRepository = new DocumentSequenceRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn(Visit $visit) => $visit->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        return $this->findOrFail($id)->toArray();
    }

    public function getByPatientId(string $patientId): array
    {
        return array_map(
            fn(Visit $visit) => $visit->toArray(),
            $this->repository->findByPatientId($patientId)
        );
    }

    public function create(array $data): array
    {
        $visit = new Visit();
        $visit->setAttributes($data);

        if (!$visit->validate()) {
            throw new BadRequestHttpException(
                json_encode($visit->getErrors())
            );
        }

        $patient = Patient::findOne([
            'id' => $visit->patient_id,
        ]);

        if ($patient === null) {
            throw new BadRequestHttpException(
                'Pasien tidak ditemukan.'
            );
        }

        $polyclinic = Polyclinic::findOne([
            'id' => $visit->polyclinic_id,
            'is_active' => true,
        ]);

        if ($polyclinic === null) {
            throw new BadRequestHttpException(
                'Poliklinik tidak ditemukan atau tidak aktif.'
            );
        }

        $doctor = MedicalStaff::findOne([
            'id' => $visit->doctor_id,
            'staff_type' => 'DOCTOR',
            'is_active' => true,
        ]);

        if ($doctor === null) {
            throw new BadRequestHttpException(
                'Dokter tidak ditemukan atau tidak aktif.'
            );
        }

        $visitDate = (string) $visit->visit_date;

        $timezone = new \DateTimeZone('Asia/Jakarta');

        $date = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $visitDate,
            $timezone
        );

        if ($date === false) {
            throw new BadRequestHttpException(
                'Tanggal kunjungan tidak valid.'
            );
        }

        $today = new \DateTimeImmutable('today', $timezone);

        if ($date < $today) {
            throw new BadRequestHttpException(
                'Tanggal kunjungan tidak boleh di masa lalu.'
            );
        }

        $dayOfWeek = (int) $date->format('N');

        $scheduleExists = DoctorSchedule::find()
            ->where([
                'doctor_id' => $visit->doctor_id,
                'polyclinic_id' => $visit->polyclinic_id,
                'day_of_week' => $dayOfWeek,
                'is_active' => true,
            ])
            ->exists();

        if (!$scheduleExists) {
            throw new BadRequestHttpException(
                'Dokter tidak memiliki jadwal aktif pada hari dan poliklinik tersebut.'
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            // Mengunci antrean per tanggal dan poliklinik.
            $lockKey = $visitDate . ':' . $visit->polyclinic_id;

            Yii::$app->db->createCommand(
                'SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))',
                [':lock_key' => $lockKey]
            )->queryScalar();

            $visit->queue_number =
                $this->repository->getNextQueueNumber(
                    $visitDate,
                    $visit->polyclinic_id
                );

            $visit->code =
                $this->sequenceRepository->generateCode('KJG');

            $visit->status = 'WAITING';

            if (!$this->repository->save($visit)) {
                throw new BadRequestHttpException(
                    json_encode($visit->getErrors())
                );
            }

            $transaction->commit();

            return $visit->toArray();
        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }


    public function updateStatus(string $id, array $data): array
    {
        $newStatus = $data['status'] ?? null;

        $allowedStatuses = [
            'WAITING',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
        ];

        if (!is_string($newStatus) ||
            !in_array($newStatus, $allowedStatuses, true)) {
            throw new BadRequestHttpException(
                'Status kunjungan tidak valid.'
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            // Kunci baris agar dua petugas tidak mengubah
            // status kunjungan bersamaan.
            $row = Yii::$app->db->createCommand(
                'SELECT id FROM visits WHERE id = :id FOR UPDATE',
                [':id' => $id]
            )->queryOne();

            if ($row === false) {
                throw new NotFoundHttpException(
                    'Kunjungan pasien tidak ditemukan.'
                );
            }

            $visit = $this->findOrFail($id);
            $currentStatus = $visit->status;

            $transitions = [
                'WAITING' => ['IN_PROGRESS', 'CANCELLED'],
                'IN_PROGRESS' => ['COMPLETED'],
                'COMPLETED' => [],
                'CANCELLED' => [],
            ];

            if (!in_array(
                $newStatus,
                $transitions[$currentStatus] ?? [],
                true
            )) {
                throw new BadRequestHttpException(
                    "Perubahan status dari {$currentStatus} "
                    . "ke {$newStatus} tidak diperbolehkan."
                );
            }

            $visit->status = $newStatus;

            if (!$visit->save(false, ['status'])) {
                throw new BadRequestHttpException(
                    'Gagal memperbarui status kunjungan.'
                );
            }

            $transaction->commit();

            return $visit->toArray();

        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }


    private function findOrFail(string $id): Visit
    {
        $visit = $this->repository->findById($id);

        if ($visit === null) {
            throw new NotFoundHttpException(
                'Kunjungan pasien tidak ditemukan.'
            );
        }

        return $visit;
    }
}