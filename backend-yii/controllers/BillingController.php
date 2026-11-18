<?php

declare(strict_types=1);

namespace app\controllers;

use Yii;
use app\services\BillingService;
use yii\web\BadRequestHttpException;

class BillingController extends BaseApiController
{

        protected array $allowedRoles = [
        'ADMIN',
        'CASHIER',
    ];

    private BillingService $service;

    public function init()
    {
        parent::init();
        $this->service = new BillingService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar tagihan berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail tagihan berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionByVisit(string $visitId): array
    {
        return [
            'success' => true,
            'message' => 'Tagihan kunjungan berhasil diambil.',
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
            'message' => 'Tagihan berhasil dibuat.',
            'data' => $result,
        ];
    }

    public function actionInvoice(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Invoice berhasil diambil.',
            'data' => $this->service->getInvoice($id),
        ];
    }

    public function actionReceipt(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diambil.',
            'data' => $this->service->getReceipt($id),
        ];
    }
}