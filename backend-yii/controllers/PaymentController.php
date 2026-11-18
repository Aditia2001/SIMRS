<?php

declare(strict_types=1);

namespace app\controllers;

use Yii;
use app\services\PaymentService;
use yii\web\BadRequestHttpException;

class PaymentController extends BaseApiController
{

    protected array $allowedRoles = [
        'ADMIN',
        'CASHIER',
    ];
    
    private PaymentService $service;

    public function init()
    {
        parent::init();
        $this->service = new PaymentService();
    }

    public function actionIndex(): array
    {
        return [
            'success' => true,
            'message' => 'Daftar pembayaran berhasil diambil.',
            'data' => $this->service->getAll(),
        ];
    }

    public function actionView(string $id): array
    {
        return [
            'success' => true,
            'message' => 'Detail pembayaran berhasil diambil.',
            'data' => $this->service->getById($id),
        ];
    }

    public function actionByBilling(string $billingId): array
    {
        return [
            'success' => true,
            'message' => 'Riwayat pembayaran berhasil diambil.',
            'data' => $this->service->getByBillingId($billingId),
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
            'message' => 'Pembayaran berhasil diproses.',
            'data' => $result,
        ];
    }
}