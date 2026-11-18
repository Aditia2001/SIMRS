<?php

declare(strict_types=1);

namespace app\controllers;

use Yii;
use app\services\LabService;
use yii\web\BadRequestHttpException;

class LabController extends BaseApiController
{

    protected array $allowedRoles = [
        'ADMIN',
        'LABORATORY',
        'DOCTOR',
    ];

    private LabService $service;

    public function init()
    {
        parent::init();
        $this->service = new LabService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar pemeriksaan lab berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail pemeriksaan lab berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionByVisit(string $visitId): array
    {
        return [
            'success' => true,
            'message' => 'Riwayat pemeriksaan lab berhasil diambil.',
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

        $result = $this->service->createRequest($data);

        Yii::$app->response->statusCode = 201;

        return [
            'success' => true,
            'message' => 'Permintaan laboratorium berhasil dibuat.',
            'data' => $result,
        ];
    }

    public function actionCreateResult(string $id): array
    {
        $data = Yii::$app->request->getBodyParams();

        if (!is_array($data)) {
            throw new BadRequestHttpException(
                'Request body tidak valid.'
            );
        }

        $result = $this->service->createResult($id, $data);

        Yii::$app->response->statusCode = 201;

        return [
            'success' => true,
            'message' => 'Hasil laboratorium berhasil disimpan.',
            'data' => $result,
        ];
    }
}