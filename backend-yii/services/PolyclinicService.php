<?php

declare(strict_types=1);

namespace app\services;

use app\models\Polyclinic;
use app\repositories\PolyclinicRepository;
use app\repositories\DocumentSequenceRepository;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class PolyclinicService
{
    private PolyclinicRepository $repository;
    private DocumentSequenceRepository $sequenceRepository;

    public function __construct()
    {
        $this->repository = new PolyclinicRepository();
        $this->sequenceRepository = new DocumentSequenceRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn(Polyclinic $item) => $item->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        return $this->findOrFail($id)->toArray();
    }

    public function create(array $data): array
    {
        $polyclinic = new Polyclinic();
        $polyclinic->setAttributes($data);

        if (!$polyclinic->validate()) {
            throw new BadRequestHttpException(
                json_encode($polyclinic->getErrors())
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $polyclinic->code =
                $this->sequenceRepository->generateCode('POL');

            if (!$this->repository->save($polyclinic)) {
                throw new BadRequestHttpException(
                    json_encode($polyclinic->getErrors())
                );
            }

            $transaction->commit();

            return $polyclinic->toArray();

        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }

    public function update(string $id, array $data): array
    {
        $polyclinic = $this->findOrFail($id);

        $polyclinic->setAttributes($data);

        if (!$polyclinic->validate()) {
            throw new BadRequestHttpException(
                json_encode($polyclinic->getErrors())
            );
        }

        if (!$this->repository->save($polyclinic)) {
            throw new ServerErrorHttpException(
                'Gagal memperbarui data poliklinik.'
            );
        }

        return $polyclinic->toArray();
    }

    private function findOrFail(string $id): Polyclinic
    {
        $polyclinic = $this->repository->findById($id);

        if ($polyclinic === null) {
            throw new NotFoundHttpException(
                'Poliklinik tidak ditemukan.'
            );
        }

        return $polyclinic;
    }
}