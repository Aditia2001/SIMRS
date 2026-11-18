<?php

declare(strict_types=1);

namespace app\services;

use app\models\Patient;
use app\repositories\PatientRepository;
use app\repositories\DocumentSequenceRepository;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class PatientService
{
    private PatientRepository $repository;
    private DocumentSequenceRepository $sequenceRepository;

    public function __construct()
    {
        $this->repository = new PatientRepository();
        $this->sequenceRepository = new DocumentSequenceRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn(Patient $patient) => $patient->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        return $this->findOrFail($id)->toArray();
    }

    public function create(array $data): array
    {
        $patient = new Patient();

        $patient->setAttributes($data);

        if (!$patient->validate()) {
            throw new BadRequestHttpException(
                json_encode($patient->getErrors())
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $code = $this->sequenceRepository->generateCode('PSN');

            $patient->code = $code;
            $patient->medical_record_number = $code;

            if (!$this->repository->save($patient)) {
                throw new BadRequestHttpException(
                    json_encode($patient->getErrors())
                );
            }

            $transaction->commit();

            return $patient->toArray();
        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }

    public function update(string $id, array $data): array
    {
        $patient = $this->findOrFail($id);

        $patient->setAttributes($data);

        if (!$patient->validate()) {
            throw new BadRequestHttpException(
                json_encode($patient->getErrors())
            );
        }

        if (!$this->repository->save($patient)) {
            throw new ServerErrorHttpException(
                'Gagal memperbarui data pasien.'
            );
        }

        return $patient->toArray();
    }

    private function findOrFail(string $id): Patient
    {
        $patient = $this->repository->findById($id);

        if ($patient === null) {
            throw new NotFoundHttpException(
                'Pasien tidak ditemukan.'
            );
        }

        return $patient;
    }
}