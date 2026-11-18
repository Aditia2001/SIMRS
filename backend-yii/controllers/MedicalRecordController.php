<?php

declare(strict_types=1);

namespace app\controllers;

use app\services\MedicalRecordService;
use Yii;
use yii\web\BadRequestHttpException;

class MedicalRecordController extends BaseApiController
{
    private MedicalRecordService $service;

    protected array $allowedRoles = [
        'ADMIN',
        'DOCTOR',
    ];

    public function init()
    {
        parent::init();
        $this->service = new MedicalRecordService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Data rekam medis berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail rekam medis berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionByVisit(string $visitId): array
    {
        return [
            'success' => true,
            'message' => 'Rekam medis kunjungan berhasil diambil.',
            'data' => $this->service->getByVisitId($visitId),
        ];
    }

    public function actionCreate(): array
    {
        $data = Yii::$app->request->getBodyParams();

        if (!is_array($data)) {
            throw new BadRequestHttpException(
                'Format request body tidak valid.'
            );
        }

        $result = $this->service->create($data);

        Yii::$app->response->statusCode = 201;

        return [
            'success' => true,
            'message' => 'Rekam medis berhasil ditambahkan.',
            'data' => $result,
        ];
    }

    public function actionUpdate(string $id): array
    {
        $data = Yii::$app->request->getBodyParams();

        if (!is_array($data)) {
            throw new BadRequestHttpException(
                'Format request body tidak valid.'
            );
        }

        return [
            'success' => true,
            'message' => 'Rekam medis berhasil diperbarui.',
            'data' => $this->service->update($id, $data),
        ];
    }
}