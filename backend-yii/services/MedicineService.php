<?php

declare(strict_types=1);

namespace app\services;

use app\models\Medicine;
use app\repositories\MedicineRepository;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class MedicineService
{
    private MedicineRepository $repository;

    public function __construct()
    {
        $this->repository = new MedicineRepository();
    }

    public function getAll(?string $search = null): array
    {
        return array_map(
            fn($medicine) => $medicine->toArray(),
            $this->repository->findAll($search)
        );
    }

    public function getById(string $id): array
    {
        return $this->findMedicine($id)->toArray();
    }

    public function create(array $data): array
    {
        $medicine = new Medicine();

        $medicine->load($data, '');

        // Kode obat wajib dikirim dari request.
        // Contoh: OBT001
        if (!$this->repository->save($medicine)) {
            throw new BadRequestHttpException(
                json_encode($medicine->getErrors())
            );
        }

        return $medicine->toArray();
    }

    public function update(string $id, array $data): array
    {
        $medicine = $this->findMedicine($id);

        // Jangan izinkan stok diubah melalui update biasa.
        // Stok nantinya dikelola melalui proses farmasi.
        unset(
            $data['id'],
            $data['key'],
            $data['stock'],
            $data['created_at'],
            $data['updated_at']
        );

        $medicine->load($data, '');

        if (!$this->repository->save($medicine)) {
            throw new BadRequestHttpException(
                json_encode($medicine->getErrors())
            );
        }

        return $medicine->toArray();
    }

    public function delete(string $id): array
    {
        $medicine = $this->findMedicine($id);

        if (!$this->repository->delete($medicine)) {
            throw new BadRequestHttpException(
                'Gagal menonaktifkan obat.'
            );
        }

        return [
            'id' => $medicine->id,
            'is_active' => false,
        ];
    }

    private function findMedicine(string $id): Medicine
    {
        $medicine = $this->repository->findById($id);

        if ($medicine === null) {
            throw new NotFoundHttpException(
                'Data obat tidak ditemukan.'
            );
        }

        return $medicine;
    }
}