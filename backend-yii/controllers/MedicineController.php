<?php

declare(strict_types=1);

namespace app\controllers;

use Yii;
use app\services\MedicineService;
use yii\web\BadRequestHttpException;

class MedicineController extends BaseApiController
{

    protected array $allowedRoles = [
        'ADMIN',
        'PHARMACY',
        'DOCTOR',
    ];

    private MedicineService $service;

    public function init()
    {
        parent::init();
        $this->service = new MedicineService();
    }

    public function actionIndex(): array
    {
        $search = Yii::$app->request->get('search');

        return [
            'success' => true,
            'message' => 'Daftar obat berhasil diambil.',
            'data' => $this->service->getAll(
                is_string($search) ? $search : null
            ),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail obat berhasil diambil.',
            'data' => $this->service->getById($id),
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
            'message' => 'Obat berhasil ditambahkan.',
            'data' => $result,
        ];
    }

    public function actionUpdate(string $id): array
    {
        $data = Yii::$app->request->getBodyParams();

        if (!is_array($data)) {
            throw new BadRequestHttpException(
                'Request body tidak valid.'
            );
        }

        return [
            'success' => true,
            'message' => 'Data obat berhasil diperbarui.',
            'data' => $this->service->update($id, $data),
        ];
    }

    public function actionDelete(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Obat berhasil dinonaktifkan.',
            'data' => $this->service->delete($id),
        ];
    }
}