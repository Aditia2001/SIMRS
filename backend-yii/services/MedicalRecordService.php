<?php

declare(strict_types=1);

namespace app\services;

use app\models\MedicalRecord;
use app\repositories\MedicalRecordRepository;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;
use app\repositories\DocumentSequenceRepository;  
use yii\web\ConflictHttpException;

class MedicalRecordService
{
    private MedicalRecordRepository $repository;

    public function __construct()
    {
        $this->repository = new MedicalRecordRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn(MedicalRecord $record) => $record->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        return $this->findOrFail($id)->toArray();
    }

    public function getByVisitId(string $visitId): array
    {
        return array_map(
            fn(MedicalRecord $record) => $record->toArray(),
            $this->repository->findByVisitId($visitId)
        );
    }

    public function create(array $data): array
    {
        $record = new MedicalRecord();
        $record->setAttributes($data);


        if (!$record->validate()) {
            throw new BadRequestHttpException(
                json_encode($record->getErrors())
            );
        }


        $existingRecord = MedicalRecord::find()
            ->where(['visit_id' => $record->visit_id])
            ->exists();

        if ($existingRecord) {
            throw new ConflictHttpException(
                'Rekam medis untuk kunjungan ini sudah tersedia. Gunakan fitur update.'
            );
        }

      
        $transaction = Yii::$app->db->beginTransaction();

        try {
        
            $sequenceRepository = new DocumentSequenceRepository();

            $record->code = $sequenceRepository->generateCode('RKM');

        
            if (!$this->repository->save($record)) {
                throw new ServerErrorHttpException(
                    'Gagal menyimpan rekam medis.'
                );
            }

            $transaction->commit();

            return $record->toArray();

        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }

    public function update(string $id, array $data): array
    {
        $record = $this->findOrFail($id);

        $record->setAttributes($data);

        if (!$record->validate()) {
            throw new BadRequestHttpException(
                json_encode($record->getErrors())
            );
        }

        if (!$this->repository->save($record)) {
            throw new ServerErrorHttpException(
                'Gagal memperbarui rekam medis.'
            );
        }

        return $record->toArray();
    }

    private function findOrFail(string $id): MedicalRecord
    {
        $record = $this->repository->findById($id);

        if ($record === null) {
            throw new NotFoundHttpException(
                'Rekam medis tidak ditemukan.'
            );
        }

        return $record;
    }
}