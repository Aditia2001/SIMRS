<?php

declare(strict_types=1);

namespace app\services;

use Yii;
use app\models\Visit;
use app\models\Medicine;
use app\models\Prescription;
use app\models\PrescriptionItem;
use app\repositories\PrescriptionRepository;
use app\repositories\DocumentSequenceRepository;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class PrescriptionService
{
    private PrescriptionRepository $repository;

    public function __construct()
    {
        $this->repository = new PrescriptionRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn($p) => $p->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        $prescription = $this->repository->findById($id);

        if ($prescription === null) {
            throw new NotFoundHttpException('Resep tidak ditemukan.');
        }

        return $this->formatPrescription($prescription);
    }

    public function getByVisitId(string $visitId): array
    {
        return array_map(
            fn($p) => $this->formatPrescription($p),
            $this->repository->findByVisitId($visitId)
        );
    }

    public function create(array $data): array
    {
        $visitId = $data['visit_id'] ?? null;
        $items = $data['items'] ?? null;

        if (!is_string($visitId) || $visitId === '') {
            throw new BadRequestHttpException('visit_id wajib diisi.');
        }

        if (!Visit::find()->where(['id' => $visitId])->exists()) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan.');
        }

        if (!is_array($items) || count($items) === 0) {
            throw new BadRequestHttpException(
                'Resep harus memiliki minimal satu obat.'
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $sequence = new DocumentSequenceRepository();

            $prescription = new Prescription();
            $prescription->code = $sequence->generateCode('RSP');
            $prescription->visit_id = $visitId;
            $prescription->status = 'PENDING';

            if (!$prescription->validate()) {
                throw new BadRequestHttpException(
                    json_encode($prescription->getErrors())
                );
            }

            if (!$this->repository->save($prescription)) {
                throw new ServerErrorHttpException(
                    'Gagal menyimpan resep.'
                );
            }

            foreach ($items as $dataItem) {
                if (!is_array($dataItem)) {
                    throw new BadRequestHttpException(
                        'Format item resep tidak valid.'
                    );
                }

                $medicineId = $dataItem['medicine_id'] ?? null;
                $quantity = $dataItem['quantity'] ?? null;

                if (
                    !is_string($medicineId) ||
                    !filter_var(
                        $quantity,
                        FILTER_VALIDATE_INT,
                        ['options' => ['min_range' => 1]]
                    )
                ) {
                    throw new BadRequestHttpException(
                        'medicine_id dan quantity harus valid.'
                    );
                }

                $medicine = Medicine::findOne(['id' => $medicineId]);

                if ($medicine === null || !$medicine->is_active) {
                    throw new BadRequestHttpException(
                        'Obat tidak ditemukan atau tidak aktif.'
                    );
                }

                if ((int) $medicine->stock < (int) $quantity) {
                    throw new BadRequestHttpException(
                        'Stok obat ' . $medicine->name . ' tidak mencukupi.'
                    );
                }

                $item = new PrescriptionItem();
                $item->prescription_id = $prescription->id;
                $item->medicine_id = $medicineId;
                $item->dosage = $dataItem['dosage'] ?? '';
                $item->frequency = $dataItem['frequency'] ?? '';
                $item->quantity = (int) $quantity;
                $item->unit_price = $medicine->price;

                // subtotal dihitung otomatis oleh PostgreSQL.

                if (!$item->validate()) {
                    throw new BadRequestHttpException(
                        json_encode($item->getErrors())
                    );
                }

                if (!$this->repository->saveItem($item)) {
                    throw new ServerErrorHttpException(
                        'Gagal menyimpan detail resep.'
                    );
                }
            }

            $transaction->commit();

            return $this->getById($prescription->id);

        } catch (\Throwable $e) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $e;
        }
    }

    public function dispense(string $id): array
    {
        $db = Yii::$app->db;
        $transaction = $db->beginTransaction();

        try {
            $row = $db->createCommand(
                'SELECT id FROM prescriptions WHERE id = :id FOR UPDATE',
                [':id' => $id]
            )->queryOne();

            if ($row === false) {
                throw new NotFoundHttpException(
                    'Resep tidak ditemukan.'
                );
            }

            $prescription = $this->repository->findById($id);

            if ($prescription->status !== 'PENDING') {
                throw new BadRequestHttpException(
                    'Resep sudah diproses atau tidak dapat diserahkan.'
                );
            }

            $items = $this->repository->findItems($id);

            if (empty($items)) {
                throw new BadRequestHttpException(
                    'Resep tidak memiliki item.'
                );
            }

            // Gabungkan kebutuhan obat yang sama.
            $required = [];

            foreach ($items as $item) {
                $medicineId = $item->medicine_id;

                $required[$medicineId] =
                    ($required[$medicineId] ?? 0)
                    + (int) $item->quantity;
            }

            // Urutkan agar penguncian konsisten.
            ksort($required);

            foreach ($required as $medicineId => $quantity) {
                // Atomic update: stok tidak boleh minus.
                $affected = $db->createCommand(
                    'UPDATE medicines
                     SET stock = stock - :quantity,
                         updated_at = NOW()
                     WHERE id = :id
                       AND is_active = TRUE
                       AND stock >= :quantity',
                    [
                        ':quantity' => $quantity,
                        ':id' => $medicineId,
                    ]
                )->execute();

                if ($affected !== 1) {
                    throw new BadRequestHttpException(
                        'Stok obat tidak mencukupi atau obat tidak aktif.'
                    );
                }
            }

            $prescription->status = 'DISPENSED';
            $prescription->dispensed_at = date('Y-m-d H:i:sP');

            if (!$prescription->save(
                false,
                ['status', 'dispensed_at']
            )) {
                throw new ServerErrorHttpException(
                    'Gagal menyelesaikan penyerahan obat.'
                );
            }

            $transaction->commit();

            return $this->getById($id);

        } catch (\Throwable $e) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $e;
        }
    }

    private function formatPrescription(
        Prescription $prescription
    ): array {
        $result = $prescription->toArray();

        $result['items'] = array_map(
            fn($item) => $item->toArray(),
            $this->repository->findItems($prescription->id)
        );

        return $result;
    }
}