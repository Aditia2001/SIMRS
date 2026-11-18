<?php

declare(strict_types=1);

namespace app\repositories;

use app\models\LabRequest;
use app\models\LabResult;

class LabRepository
{
    public function findAllRequests(): array
    {
        return LabRequest::find()
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function findRequestById(string $id): ?LabRequest
    {
        return LabRequest::findOne(['id' => $id]);
    }

    public function findRequestsByVisitId(string $visitId): array
    {
        return LabRequest::find()
            ->where(['visit_id' => $visitId])
            ->orderBy(['created_at' => SORT_DESC])
            ->all();
    }

    public function findResults(string $requestId): array
    {
        return LabResult::find()
            ->where(['lab_request_id' => $requestId])
            ->orderBy(['key' => SORT_ASC])
            ->all();
    }

    public function saveRequest(LabRequest $request): bool
    {
        return $request->save(false);
    }

    public function saveResult(LabResult $result): bool
    {
        return $result->save(false);
    }
}