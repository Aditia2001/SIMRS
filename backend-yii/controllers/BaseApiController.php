<?php

declare(strict_types=1);

namespace app\controllers;

use app\components\JwtAuth;
use app\components\RoleAccess;
use app\models\User;
use yii\rest\Controller;
use yii\web\Response;

abstract class BaseApiController extends Controller
{
    public $enableCsrfValidation = false;

    protected ?User $currentUser = null;

    protected array $allowedRoles = [];

    public function behaviors()
    {
        $behaviors = parent::behaviors();

        $behaviors['contentNegotiator']['formats'] = [
            'application/json' => Response::FORMAT_JSON,
        ];

        return $behaviors;
    }

    public function beforeAction($action)
    {
        if (!parent::beforeAction($action)) {
            return false;
        }

        $this->currentUser = JwtAuth::authenticate();

        RoleAccess::requireRole(
            $this->currentUser,
            $this->allowedRoles
        );

        return true;
    }

    protected function getCurrentUser(): User
    {
        return $this->currentUser;
    }
}