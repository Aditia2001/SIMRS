<?php

namespace app\services;

use Yii;
use app\models\MedicalAction;
use app\repositories\MedicalActionRepository;
use app\repositories\DocumentSequenceRepository;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class MedicalActionService
{
    private MedicalActionRepository $repository;

    public function __construct()
    {
        $this->repository = new MedicalActionRepository();
    }

    // GET seluruh tindakan medis
    public function getAll(): array
    {
        return array_map(
            fn($action) => $action->toArray(),
            $this->repository->findAll()
        );
    }

    // GET tindakan berdasarkan UUID
    public function getById(string $id): array
    {
        $action = $this->repository->findById($id);

        if ($action === null) {
            throw new NotFoundHttpException(
                'Tindakan medis tidak ditemukan.'
            );
        }

        return $action->toArray();
    }

    // POST membuat tindakan medis
    public function create(array $data): array
    {
        $action = new MedicalAction();

        $action->setAttributes(
            array_intersect_key(
                $data,
                array_flip([
                    'name',
                    'description',
                    'tariff',
                    'is_active',
                ])
            )
        );

        if (!$action->validate()) {
            throw new BadRequestHttpException(
                json_encode($action->getErrors())
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $sequenceRepository = new DocumentSequenceRepository();

            // Kode contoh: TND1120260001
            $action->code = $sequenceRepository->generateCode('TND');

            if (!$this->repository->save($action)) {
                throw new ServerErrorHttpException(
                    'Gagal menyimpan tindakan medis.'
                );
            }

            $transaction->commit();

            return $action->toArray();

        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }

    // PUT memperbarui tindakan medis
    public function update(string $id, array $data): array
    {
        $action = $this->repository->findById($id);

        if ($action === null) {
            throw new NotFoundHttpException(
                'Tindakan medis tidak ditemukan.'
            );
        }

        // Hanya field berikut yang boleh diubah
        $allowedFields = [
            'name',
            'description',
            'tariff',
            'is_active',
        ];

        $action->setAttributes(
            array_intersect_key(
                $data,
                array_flip($allowedFields)
            )
        );

        if (!$action->validate()) {
            throw new BadRequestHttpException(
                json_encode($action->getErrors())
            );
        }

        $action->updated_at = date('Y-m-d H:i:sP');

        if (!$this->repository->save($action)) {
            throw new ServerErrorHttpException(
                'Gagal memperbarui tindakan medis.'
            );
        }

        return $action->toArray();
    }
}