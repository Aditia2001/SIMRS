<?php

declare(strict_types=1);

namespace app\controllers;

use app\services\PatientService;
use Yii;

class PatientController extends BaseApiController
{
    protected array $allowedRoles = [
        'ADMIN',
        'REGISTRATION',
        'DOCTOR',
    ];

    private PatientService $patientService;

    public function init(): void
    {
        parent::init();
        $this->patientService = new PatientService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar pasien berhasil diambil.',
            'data' => $this->patientService->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail pasien berhasil diambil.',
            'data' => $this->patientService->getById($id),
        ];
    }

    public function actionCreate(): array
    {
        $data = Yii::$app->request->getBodyParams();

        $result = $this->patientService->create($data);

        Yii::$app->response->statusCode = 201;

        return [
            'success' => true,
            'message' => 'Pasien berhasil ditambahkan.',
            'data' => $result,
        ];
    }

    public function actionUpdate(string $id): array
    {
        $data = Yii::$app->request->getBodyParams();

        return [
            'success' => true,
            'message' => 'Pasien berhasil diperbarui.',
            'data' => $this->patientService->update($id, $data),
        ];
    }
}