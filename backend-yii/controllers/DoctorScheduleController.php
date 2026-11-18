<?php

declare(strict_types=1);

namespace app\controllers;

use app\services\DoctorScheduleService;
use Yii;
use yii\web\BadRequestHttpException;

class DoctorScheduleController extends BaseApiController
{
    private DoctorScheduleService $service;

    public function init(): void
    {
        parent::init();

        $this->service = new DoctorScheduleService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar jadwal dokter berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail jadwal dokter berhasil diambil.',
            'data' => $this->service->getById($id),
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
            'message' => 'Jadwal dokter berhasil ditambahkan.',
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
            'message' => 'Jadwal dokter berhasil diperbarui.',
            'data' => $this->service->update($id, $data),
        ];
    }
}