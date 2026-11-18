<?php

declare(strict_types=1);

namespace app\controllers;

use app\services\MedicalActionService;
use Yii;
use yii\web\BadRequestHttpException;

class MedicalActionController extends BaseApiController
{

    protected array $allowedRoles = [
            'ADMIN',
            'DOCTOR',
        ];

    private MedicalActionService $service;

    public function init()
    {
        parent::init();
        $this->service = new MedicalActionService();
    }

    // GET /api/medical-actions
    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar tindakan medis berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    // GET /api/medical-actions/{id}
    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail tindakan medis berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    // POST /api/medical-actions
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
            'message' => 'Tindakan medis berhasil ditambahkan.',
            'data' => $result,
        ];
    }

    // PUT /api/medical-actions/{id}
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
            'message' => 'Tindakan medis berhasil diperbarui.',
            'data' => $this->service->update($id, $data),
        ];
    }
}