<?php

declare(strict_types=1);

namespace app\controllers;

use app\services\MedicalStaffService;
use Yii;
use yii\web\Response;

class MedicalStaffController extends BaseApiController
{
    private MedicalStaffService $service;

    public function init(): void
    {
        parent::init();

        $this->service = new MedicalStaffService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar tenaga medis berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail tenaga medis berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionCreate(): array
    {
        $data = Yii::$app->request->getBodyParams();

        $result = $this->service->create($data);

        Yii::$app->response->statusCode = 201;

        return [
            'success' => true,
            'message' => 'Tenaga medis berhasil ditambahkan.',
            'data' => $result,
        ];
    }

    public function actionUpdate(string $id): array
    {
        $data = Yii::$app->request->getBodyParams();

        return [
            'success' => true,
            'message' => 'Tenaga medis berhasil diperbarui.',
            'data' => $this->service->update($id, $data),
        ];
    }
}