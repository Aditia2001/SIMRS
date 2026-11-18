<?php

declare(strict_types=1);

namespace app\controllers;

use app\services\VisitService;
use Yii;
use yii\web\BadRequestHttpException;

class VisitController extends BaseApiController
{
  protected array $allowedRoles = [
        'ADMIN',
        'REGISTRATION',
        'DOCTOR',
    ];
    
    private VisitService $service;

    public function init(): void
    {
        parent::init();

        $this->service = new VisitService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar kunjungan berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail kunjungan berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionByPatient(string $patientId): array
    {
        return [
            'success' => true,
            'message' => 'Riwayat kunjungan pasien berhasil diambil.',
            'data' => $this->service->getByPatientId($patientId),
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
            'message' => 'Kunjungan pasien berhasil ditambahkan.',
            'data' => $result,
        ];
    }


    public function actionUpdateStatus(string $id): array
    {
        $data = Yii::$app->request->getBodyParams();

        if (!is_array($data)) {
            throw new BadRequestHttpException(
                'Format request body tidak valid.'
            );
        }

        return [
            'success' => true,
            'message' => 'Status antrean berhasil diperbarui.',
            'data' => $this->service->updateStatus($id, $data),
        ];
    }

}