<?php

declare(strict_types=1);

namespace app\services;

use app\models\MedicalStaff;
use app\repositories\MedicalStaffRepository;
use app\repositories\DocumentSequenceRepository;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class MedicalStaffService
{
    private MedicalStaffRepository $repository;
    private DocumentSequenceRepository $sequenceRepository;

    public function __construct()
    {
        $this->repository = new MedicalStaffRepository();
        $this->sequenceRepository = new DocumentSequenceRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn(MedicalStaff $staff) => $staff->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        return $this->findOrFail($id)->toArray();
    }

    public function create(array $data): array
    {
        $staff = new MedicalStaff();

        $staff->setAttributes($data);

        if (!$staff->validate()) {
            throw new BadRequestHttpException(
                json_encode($staff->getErrors())
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            // Generate code: MED1120260001
            $staff->code = $this->sequenceRepository
                ->generateCode('MED');

            if (!$this->repository->save($staff)) {
                throw new BadRequestHttpException(
                    json_encode($staff->getErrors())
                );
            }

            $transaction->commit();

            return $staff->toArray();

        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }

    public function update(string $id, array $data): array
    {
        $staff = $this->findOrFail($id);

        $allowedFields = [
            'full_name',
            'staff_type',
            'specialization',
            'license_number',
            'phone',
            'is_active',
        ];

        $staff->setAttributes(
            array_intersect_key(
                $data,
                array_flip($allowedFields)
            )
        );

        if (!$staff->validate()) {
            throw new BadRequestHttpException(
                json_encode($staff->getErrors())
            );
        }

        if (!$this->repository->save($staff)) {
            throw new ServerErrorHttpException(
                'Gagal memperbarui data tenaga medis.'
            );
        }

        return $staff->toArray();
    }

    private function findOrFail(string $id): MedicalStaff
    {
        $staff = $this->repository->findById($id);

        if ($staff === null) {
            throw new NotFoundHttpException(
                'Tenaga medis tidak ditemukan.'
            );
        }

        return $staff;
    }
}