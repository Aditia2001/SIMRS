<?php

declare(strict_types=1);

namespace app\services;

use Yii;
use app\models\Visit;
use app\models\VisitAction;
use app\models\LabRequest;
use app\models\Prescription;
use app\models\PrescriptionItem;
use app\models\Medicine;
use app\models\Billing;
use app\models\BillingItem;
use app\repositories\BillingRepository;
use app\repositories\DocumentSequenceRepository;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class BillingService
{
    private BillingRepository $repository;

    public function __construct()
    {
        $this->repository = new BillingRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn($billing) => $billing->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        $billing = $this->repository->findById($id);

        if ($billing === null) {
            throw new NotFoundHttpException(
                'Tagihan tidak ditemukan.'
            );
        }

        return $this->formatBilling($billing);
    }

    public function getByVisitId(string $visitId): array
    {
        $billing = $this->repository->findByVisitId($visitId);

        if ($billing === null) {
            throw new NotFoundHttpException(
                'Tagihan kunjungan tidak ditemukan.'
            );
        }

        return $this->formatBilling($billing);
    }

    public function create(array $data): array
    {
        $visitId = $data['visit_id'] ?? null;

        if (!is_string($visitId) || trim($visitId) === '') {
            throw new BadRequestHttpException(
                'visit_id wajib diisi.'
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            // Kunci kunjungan agar billing untuk visit yang sama
            // tidak dibuat bersamaan.
            $row = Yii::$app->db->createCommand(
                'SELECT id FROM visits WHERE id = :id FOR UPDATE',
                [':id' => $visitId]
            )->queryOne();

            if ($row === false) {
                throw new NotFoundHttpException(
                    'Kunjungan pasien tidak ditemukan.'
                );
            }

            $visit = Visit::findOne(['id' => $visitId]);

            if ($this->repository->findByVisitId($visitId) !== null) {
                throw new BadRequestHttpException(
                    'Tagihan untuk kunjungan ini sudah dibuat.'
                );
            }

            // Kumpulkan semua rincian biaya.
            $items = [];

            // 1. Biaya pendaftaran
            if ((float) $visit->registration_fee > 0) {
                $items[] = [
                    'item_type' => 'REGISTRATION',
                    'reference_id' => $visit->id,
                    'description' => 'Biaya Pendaftaran',
                    'quantity' => 1,
                    'unit_price' => $visit->registration_fee,
                ];
            }

            // 2. Tindakan medis
            $visitActions = VisitAction::find()
                ->with('medicalAction')
                ->where(['visit_id' => $visitId])
                ->all();

            foreach ($visitActions as $action) {
                $items[] = [
                    'item_type' => 'ACTION',
                    'reference_id' => $action->id,
                    'description' => $action->medicalAction
                        ? $action->medicalAction->name
                        : 'Tindakan Medis',
                    'quantity' => (int) $action->quantity,
                    'unit_price' => $action->unit_price,
                ];
            }

            // 3. Pemeriksaan laboratorium
            $labRequests = LabRequest::find()
                ->where(['visit_id' => $visitId])
                ->andWhere(['<>', 'status', 'CANCELLED'])
                ->all();

            foreach ($labRequests as $lab) {
                $items[] = [
                    'item_type' => 'LAB',
                    'reference_id' => $lab->id,
                    'description' => $lab->examination_name,
                    'quantity' => 1,
                    'unit_price' => $lab->tariff,
                ];
            }

            // 4. Obat dari resep yang sudah diserahkan
            $prescriptions = Prescription::find()
                ->where([
                    'visit_id' => $visitId,
                    'status' => 'DISPENSED',
                ])
                ->all();

            foreach ($prescriptions as $prescription) {
                $prescriptionItems = PrescriptionItem::find()
                    ->where([
                        'prescription_id' => $prescription->id,
                    ])
                    ->all();

                foreach ($prescriptionItems as $prescriptionItem) {
                    $medicine = Medicine::findOne([
                        'id' => $prescriptionItem->medicine_id,
                    ]);

                    $items[] = [
                        'item_type' => 'MEDICINE',
                        'reference_id' => $prescriptionItem->id,
                        'description' => $medicine
                            ? $medicine->name
                            : 'Obat',
                        'quantity' => (int) $prescriptionItem->quantity,
                        'unit_price' => $prescriptionItem->unit_price,
                    ];
                }
            }

            if (empty($items)) {
                throw new BadRequestHttpException(
                    'Belum ada biaya untuk kunjungan ini.'
                );
            }

            // Buat header billing
            $sequence = new DocumentSequenceRepository();

            $billing = new Billing();
            $billing->visit_id = $visitId;
            $billing->code = $sequence->generateCode('BIL');
            $billing->total_amount = '0.00';
            $billing->paid_amount = '0.00';
            $billing->status = 'UNPAID';

            if (!$billing->validate()) {
                throw new BadRequestHttpException(
                    json_encode($billing->getErrors())
                );
            }

            if (!$this->repository->save($billing)) {
                throw new ServerErrorHttpException(
                    'Gagal menyimpan tagihan.'
                );
            }

            $totalAmount = '0.00';

            // Simpan semua item tagihan.
            foreach ($items as $dataItem) {
                $item = new BillingItem();
                $item->billing_id = $billing->id;
                $item->item_type = $dataItem['item_type'];
                $item->reference_id = $dataItem['reference_id'];
                $item->description = $dataItem['description'];
                $item->quantity = $dataItem['quantity'];
                $item->unit_price = $dataItem['unit_price'];

                // subtotal adalah generated column PostgreSQL.
                // Jangan diisi manual.

                if (!$item->validate()) {
                    throw new BadRequestHttpException(
                        json_encode($item->getErrors())
                    );
                }

                if (!$this->repository->saveItem($item)) {
                    throw new ServerErrorHttpException(
                        'Gagal menyimpan rincian tagihan.'
                    );
                }

                $subtotal = bcmul(
                    (string) $item->unit_price,
                    (string) $item->quantity,
                    2
                );

                $totalAmount = bcadd(
                    $totalAmount,
                    $subtotal,
                    2
                );
            }

            $billing->total_amount = $totalAmount;

            if (!$this->repository->save($billing)) {
                throw new ServerErrorHttpException(
                    'Gagal memperbarui total tagihan.'
                );
            }

            $transaction->commit();

            $billing->refresh();

            return $this->formatBilling($billing);

        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }


    public function getInvoice(string $billingId): array
    {
        $billing = $this->repository->findById($billingId);

        if ($billing === null) {
            throw new NotFoundHttpException(
                'Tagihan tidak ditemukan.'
            );
        }

        $invoice = $this->formatBilling($billing);

        $visit = Visit::findOne([
            'id' => $billing->visit_id,
        ]);

        $invoice['visit'] = $visit
            ? $visit->toArray()
            : null;

        $invoice['document_type'] = 'INVOICE';

        return $invoice;
    }

    public function getReceipt(string $billingId): array
    {
        $billing = $this->repository->findById($billingId);

        if ($billing === null) {
            throw new NotFoundHttpException(
                'Tagihan tidak ditemukan.'
            );
        }

        $payments = \app\models\Payment::find()
            ->where(['billing_id' => $billingId])
            ->orderBy(['paid_at' => SORT_ASC])
            ->all();

        if (empty($payments)) {
            throw new BadRequestHttpException(
                'Belum ada pembayaran untuk tagihan ini.'
            );
        }

        return [
            'document_type' => 'PAYMENT_RECEIPT',
            'billing' => $this->formatBilling($billing),
            'payments' => array_map(
                fn($payment) => $payment->toArray(),
                $payments
            ),
        ];
    }


    private function formatBilling(Billing $billing): array
    {
        $result = $billing->toArray();

        $result['items'] = array_map(
            fn($item) => $item->toArray(),
            $this->repository->findItemsByBillingId($billing->id)
        );

        return $result;
    }
}