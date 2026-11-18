<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\Payment;

class PaymentRepository
{
    public function findAll(): array
    {
        return Payment::find()
            ->orderBy(['paid_at' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?Payment
    {
        return Payment::findOne(['id' => $id]);
    }

    public function findByBillingId(string $billingId): array
    {
        return Payment::find()
            ->where(['billing_id' => $billingId])
            ->orderBy(['paid_at' => SORT_DESC])
            ->all();
    }

    public function findByIdempotencyKey(string $key): ?Payment
    {
        return Payment::findOne([
            'idempotency_key' => $key,
        ]);
    }

    public function save(Payment $payment): bool
    {
        return $payment->save(false);
    }
}