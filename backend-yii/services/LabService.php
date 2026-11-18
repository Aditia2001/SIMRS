<?php

declare(strict_types=1);

namespace app\services;

use Yii;
use app\models\Visit;
use app\models\LabRequest;
use app\models\LabResult;
use app\repositories\LabRepository;
use app\repositories\DocumentSequenceRepository;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class LabService
{
    private LabRepository $repository;

    public function __construct()
    {
        $this->repository = new LabRepository();
    }

    public function getAll(): array
    {
        return array_map(
            fn($r) => $this->formatRequest($r),
            $this->repository->findAllRequests()
        );
    }

    public function getById(string $id): array
    {
        $request = $this->repository->findRequestById($id);

        if ($request === null) {
            throw new NotFoundHttpException(
                'Permintaan laboratorium tidak ditemukan.'
            );
        }

        return $this->formatRequest($request);
    }

    public function getByVisitId(string $visitId): array
    {
        return array_map(
            fn($r) => $this->formatRequest($r),
            $this->repository->findRequestsByVisitId($visitId)
        );
    }

    public function createRequest(array $data): array
    {
        $visitId = $data['visit_id'] ?? null;
        $name = trim((string) ($data['examination_name'] ?? ''));

        if (!is_string($visitId) || trim($visitId) === '') {
            throw new BadRequestHttpException(
                'visit_id wajib diisi.'
            );
        }

        if ($name === '') {
            throw new BadRequestHttpException(
                'examination_name wajib diisi.'
            );
        }

        if (!Visit::find()->where(['id' => $visitId])->exists()) {
            throw new NotFoundHttpException(
                'Kunjungan tidak ditemukan.'
            );
        }

        $tariff = $data['tariff'] ?? 0;

        if (!is_numeric($tariff) || (float) $tariff < 0) {
            throw new BadRequestHttpException(
                'Tarif pemeriksaan tidak valid.'
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $sequence = new DocumentSequenceRepository();

            $request = new LabRequest();
            $request->code = $sequence->generateCode('LAB');
            $request->visit_id = $visitId;
            $request->examination_name = $name;
            $request->notes = $data['notes'] ?? null;
            $request->tariff = $tariff;
            $request->status = 'PENDING';

            if (!$request->validate()) {
                throw new BadRequestHttpException(
                    json_encode($request->getErrors())
                );
            }

            if (!$this->repository->saveRequest($request)) {
                throw new ServerErrorHttpException(
                    'Gagal menyimpan permintaan lab.'
                );
            }

            $transaction->commit();

            return $this->getById($request->id);
        } catch (\Throwable $e) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $e;
        }
    }

    public function createResult(
        string $requestId,
        array $data
    ): array {
        $value = trim((string) ($data['result_value'] ?? ''));

        if ($value === '') {
            throw new BadRequestHttpException(
                'result_value wajib diisi.'
            );
        }

        $db = Yii::$app->db;
        $transaction = $db->beginTransaction();

        try {
            $row = $db->createCommand(
                'SELECT id FROM lab_requests
                 WHERE id = :id FOR UPDATE',
                [':id' => $requestId]
            )->queryOne();

            if ($row === false) {
                throw new NotFoundHttpException(
                    'Permintaan laboratorium tidak ditemukan.'
                );
            }

            $request = $this->repository
                ->findRequestById($requestId);

            if ($request->status !== 'PENDING') {
                throw new BadRequestHttpException(
                    'Permintaan laboratorium sudah diproses.'
                );
            }

            $result = new LabResult();
            $result->lab_request_id = $requestId;
            $result->result_value = $value;
            $result->unit = $data['unit'] ?? null;
            $result->reference_range =
                $data['reference_range'] ?? null;
            $result->notes = $data['notes'] ?? null;

            if (!$result->validate()) {
                throw new BadRequestHttpException(
                    json_encode($result->getErrors())
                );
            }

            if (!$this->repository->saveResult($result)) {
                throw new ServerErrorHttpException(
                    'Gagal menyimpan hasil laboratorium.'
                );
            }

            $request->status = 'COMPLETED';

            if (!$request->save(false, ['status'])) {
                throw new ServerErrorHttpException(
                    'Gagal memperbarui status pemeriksaan.'
                );
            }

            $transaction->commit();

            return $this->getById($requestId);
        } catch (\Throwable $e) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $e;
        }
    }

    private function formatRequest(LabRequest $request): array
    {
        $data = $request->toArray();

        $data['results'] = array_map(
            fn($result) => $result->toArray(),
            $this->repository->findResults($request->id)
        );

        return $data;
    }
}