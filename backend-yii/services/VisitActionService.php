<?php

declare(strict_types=1);

namespace app\services;

use Yii;
use app\models\Visit;
use app\models\MedicalAction;
use app\models\VisitAction;
use app\repositories\VisitActionRepository;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class VisitActionService
{
    private VisitActionRepository $repository;

    public function __construct()
    {
        $this->repository = new VisitActionRepository();
    }

    // GET semua tindakan kunjungan
    public function getAll(): array
    {
        return array_map(
            fn($item) => $item->toArray(),
            $this->repository->findAll()
        );
    }

    // GET berdasarkan ID
    public function getById(string $id): array
    {
        $item = $this->repository->findById($id);

        if ($item === null) {
            throw new NotFoundHttpException(
                'Tindakan kunjungan tidak ditemukan.'
            );
        }

        return $item->toArray();
    }

    // GET tindakan berdasarkan kunjungan
    public function getByVisitId(string $visitId): array
    {
        if (!Visit::find()->where(['id' => $visitId])->exists()) {
            throw new NotFoundHttpException(
                'Kunjungan pasien tidak ditemukan.'
            );
        }

        return array_map(
            fn($item) => $item->toArray(),
            $this->repository->findByVisitId($visitId)
        );
    }

    // POST mencatat tindakan pada kunjungan
    public function create(array $data): array
    {
        $visitId = $data['visit_id'] ?? null;
        $medicalActionId = $data['medical_action_id'] ?? null;
        $quantity = $data['quantity'] ?? 1;

        if (empty($visitId) || empty($medicalActionId)) {
            throw new BadRequestHttpException(
                'visit_id dan medical_action_id wajib diisi.'
            );
        }

        if (
            filter_var(
                $quantity,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 1]]
            ) === false
        ) {
            throw new BadRequestHttpException(
                'Quantity harus berupa bilangan bulat minimal 1.'
            );
        }

        if (!Visit::find()->where(['id' => $visitId])->exists()) {
            throw new NotFoundHttpException(
                'Kunjungan pasien tidak ditemukan.'
            );
        }

        $medicalAction = MedicalAction::findOne([
            'id' => $medicalActionId,
        ]);

        if ($medicalAction === null) {
            throw new NotFoundHttpException(
                'Tindakan medis tidak ditemukan.'
            );
        }

        if (!$medicalAction->is_active) {
            throw new BadRequestHttpException(
                'Tindakan medis sudah tidak aktif.'
            );
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $item = new VisitAction();

            $item->visit_id = $visitId;
            $item->medical_action_id = $medicalActionId;
            $item->quantity = (int) $quantity;

            // Harga diambil dari master tindakan medis
            $item->unit_price = $medicalAction->tariff;

            // subtotal tidak diisi karena generated column PostgreSQL

            if (!$item->validate()) {
                throw new BadRequestHttpException(
                    json_encode($item->getErrors())
                );
            }

            if (!$this->repository->save($item)) {
                throw new ServerErrorHttpException(
                    'Gagal menyimpan tindakan kunjungan.'
                );
            }

            // Ambil nilai subtotal yang dihitung PostgreSQL
            $item->refresh();

            $transaction->commit();

            return $item->toArray();

        } catch (\Throwable $exception) {
            if ($transaction->isActive) {
                $transaction->rollBack();
            }

            throw $exception;
        }
    }
}