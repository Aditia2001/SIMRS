<?php

declare(strict_types=1);

namespace app\controllers;

use Yii;
use app\services\VisitActionService;
use yii\web\BadRequestHttpException;

class VisitActionController extends BaseApiController
{
    private VisitActionService $service;

    public function init()
    {
        parent::init();
        $this->service = new VisitActionService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar tindakan kunjungan berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail tindakan kunjungan berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionByVisit(string $visitId): array
    {
        return [
            'success' => true,
            'message' => 'Tindakan berdasarkan kunjungan berhasil diambil.',
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
            'message' => 'Tindakan kunjungan berhasil ditambahkan.',
            'data' => $result,
        ];
    }
}