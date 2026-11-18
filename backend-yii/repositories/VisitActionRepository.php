<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\VisitAction;

class VisitActionRepository
{
    public function findAll(): array
    {
        return VisitAction::find()
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function findById(string $id): ?VisitAction
    {
        return VisitAction::findOne(['id' => $id]);
    }

    public function findByVisitId(string $visitId): array
    {
        return VisitAction::find()
            ->where(['visit_id' => $visitId])
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function save(VisitAction $item): bool
    {
        return $item->save(false);
    }
}