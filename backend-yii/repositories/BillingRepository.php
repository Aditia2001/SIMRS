<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\Billing;
use app\models\BillingItem;

class BillingRepository
{
    public function findAll(): array
    {
        return Billing::find()
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?Billing
    {
        return Billing::findOne(['id' => $id]);
    }

    public function findByVisitId(string $visitId): ?Billing
    {
        return Billing::findOne(['visit_id' => $visitId]);
    }

    public function save(Billing $billing): bool
    {
        return $billing->save(false);
    }

    public function saveItem(BillingItem $item): bool
    {
        return $item->save(false);
    }

    public function findItemsByBillingId(string $billingId): array
    {
        return BillingItem::find()
            ->where(['billing_id' => $billingId])
            ->orderBy(['key' => SORT_ASC])
            ->all();
    }
}