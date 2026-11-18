<?php

declare(strict_types=1);

namespace app\services;

use Yii;
use app\models\Billing;
use app\models\Payment;
use app\repositories\PaymentRepository;
use app\repositories\DocumentSequenceRepository;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class PaymentService
{
    private PaymentRepository $repository;

    public function __construct()
    {
        $this->repository = new PaymentRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn($payment) => $payment->toArray(),
            $this->repository->findAll()
        );
    }

    public function getById(string $id): array
    {
        $payment = $this->repository->findById($id);

        if ($payment === null) {
            throw new NotFoundHttpException(
                'Pembayaran tidak ditemukan.'
            );
        }

        return $payment->toArray();
    }

    public function getByBillingId(string $billingId): array
    {
        if (!Billing::find()->where(['id' => $billingId])->exists()) {
            throw new NotFoundHttpException(
                'Tagihan tidak ditemukan.'
            );
        }

        return array_map(
            fn($payment) => $payment->toArray(),
            $this->repository->findByBillingId($billingId)
        );
    }

    public function create(array $data): array
    {
        $billingId = $data['billing_id'] ?? null;
        $idempotencyKey = $data['idempotency_key'] ?? null;
        $method = $data['payment_method'] ?? null;
        $amount = $data['amount'] ?? null;

        if (!is_string($billingId) || trim($billingId) === '') {
            throw new BadRequestHttpException(
                'billing_id wajib diisi.'
            );
        }

        if (
            !is_string($idempotencyKey) ||
            !preg_match(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
                $idempotencyKey
            )
        ) {
            throw new BadRequestHttpException(
                'idempotency_key harus berupa UUID.'
            );
        }

        if (!in_array($method, ['CASH', 'NON_CASH'], true)) {
            throw new BadRequestHttpException(
                'payment_method harus CASH atau NON_CASH.'
            );
        }

        if (
            !is_scalar($amount) ||
            !is_numeric($amount) ||
            !preg_match('/^\d+(\.\d{1,2})?$/', (string) $amount)
        ) {
            throw new BadRequestHttpException(
                'amount harus berupa nominal positif maksimal 2 desimal.'
            );
        }

        if (!extension_loaded('bcmath')) {
            throw new ServerErrorHttpException(
                'PHP extension BCMath belum aktif.'
            );
        }

        $amount = bcadd((string) $amount, '0', 2);

        if (bccomp($amount, '0.00', 2) <= 0) {
            throw new BadRequestHttpException(
                'Nominal pembayaran harus lebih dari 0.'
            );
        }

        $db = Yii::$app->db;
        $transaction = $db->beginTransaction();

        try {
            // Kunci baris billing sampai transaksi selesai.
            $billingRow = $db->createCommand(
                'SELECT id FROM billings WHERE id = :id FOR UPDATE',
                [':id' => $billingId]
            )->queryOne();

            if ($billingRow === false) {
                throw new NotFoundHttpException(
                    'Tagihan tidak ditemukan.'
                );
            }

            // Cek request pembayaran yang pernah diproses.
            $existing = $this->repository
                ->findByIdempotencyKey($idempotencyKey);

            if ($existing !== null) {
                if (
                    $existing->billing_id !== $billingId ||
                    bccomp((string) $existing->amount, $amount, 2) !== 0 ||
                    $existing->payment_method !== $method
                ) {
                    throw new BadRequestHttpException(
                        'Idempotency key sudah digunakan untuk transaksi berbeda.'
                    );
                }

                $result = $existing->toArray();
                $transaction->commit();

                return $result;
            }

            $billing = Billing::findOne(['id' => $billingId]);

            $remaining = bcsub(
                (string) $billing->total_amount,
                (string) $billing->paid_amount,
                2
            );

            if (bccomp($remaining, '0.00', 2) <= 0) {
                throw new BadRequestHttpException(
                    'Tagihan sudah lunas.'
                );
            }

            if (bccomp($amount, $remaining, 2) > 0) {
                throw new BadRequestHttpException(
                    'Nominal pembayaran melebihi sisa tagihan.'
                );
            }

            $sequence = new DocumentSequenceRepository();

            $payment = new Payment();
            $payment->billing_id = $billingId;
            $payment->code = $sequence->generateCode('PAY');
            $payment->idempotency_key = $idempotencyKey;
            $payment->amount = $amount;
            $payment->payment_method = $method;

            if (!$payment->validate()) {
                throw new BadRequestHttpException(
                    json_encode($payment->getErrors())
                );
            }

            if (!$this->repository->save($payment)) {
                throw new ServerErrorHttpException(
                    'Gagal menyimpan pembayaran.'
                );
            }

            $newPaidAmount = bcadd(
                (string) $billing->paid_amount,
                $amount,
                2
            );

            $billing->paid_amount = $newPaidAmount;

            if (
                bccomp(
                    $newPaidAmount,
                    (string) $billing->total_amount,
                    2
                ) === 0
            ) {
                $billing->status = 'PAID';
            } else {
                $billing->status = 'PARTIAL';
            }


            if (!$billing->save(false, ['paid_amount', 'status'])) {
                throw new ServerErrorHttpException(
                    'Gagal memperbarui status tagihan.'
                );
            }

            $result = $payment->toArray();

            $transaction->commit();

            return $result;

        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }
}