<?php

declare(strict_types=1);

namespace app\controllers;

use app\services\PolyclinicService;
use Yii;

class PolyclinicController extends BaseApiController
{
    protected array $allowedRoles = ['REGISTRATION'];

    private PolyclinicService $service;

    public function init(): void
    {
        parent::init();
        $this->service = new PolyclinicService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar poliklinik berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail poliklinik berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionCreate(): array
    {
        $result = $this->service->create(
            Yii::$app->request->getBodyParams()
        );

        Yii::$app->response->statusCode = 201;

        return [
            'success' => true,
            'message' => 'Poliklinik berhasil ditambahkan.',
            'data' => $result,
        ];
    }

    public function actionUpdate(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Poliklinik berhasil diperbarui.',
            'data' => $this->service->update(
                $id,
                Yii::$app->request->getBodyParams()
            ),
        ];
    }
}