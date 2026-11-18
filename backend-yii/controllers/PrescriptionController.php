<?php

declare(strict_types=1);

namespace app\controllers;

use Yii;
use app\services\PrescriptionService;
use yii\web\BadRequestHttpException;

class PrescriptionController extends BaseApiController
{
    private PrescriptionService $service;

    public function init()
    {
        parent::init();
        $this->service = new PrescriptionService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar resep berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail resep berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionByVisit(string $visitId): array
    {
        return [
            'success' => true,
            'message' => 'Resep kunjungan berhasil diambil.',
            'data' => $this->service->getByVisitId($visitId),
        ];
    }

    public function actionCreate(): array
    {
        $data = Yii::$app->request->getBodyParams();

        if (!is_array($data)) {
            throw new BadRequestHttpException(
                'Request body tidak valid.'
            );
        }

        $result = $this->service->create($data);

        Yii::$app->response->statusCode = 201;

        return [
            'success' => true,
            'message' => 'Resep berhasil dibuat.',
            'data' => $result,
        ];
    }

    public function actionDispense(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Obat berhasil diserahkan.',
            'data' => $this->service->dispense($id),
        ];
    }
}