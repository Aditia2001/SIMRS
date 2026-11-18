<?php

declare(strict_types=1);

namespace app\models;

use yii\db\ActiveRecord;

class VisitAction extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%visit_actions}}';
    }

    public function rules(): array
    {
        return [
            [['visit_id', 'medical_action_id'], 'required'],

            [['visit_id', 'medical_action_id'], 'string'],

            [['quantity'], 'integer', 'min' => 1],

            [['quantity'], 'default', 'value' => 1],

            [['unit_price'], 'number', 'min' => 0],

            // Subtotal dihitung otomatis oleh PostgreSQL
            [['subtotal'], 'safe'],

            [['id', 'key', 'created_at', 'updated_at'], 'safe'],
        ];
    }

    public function getVisit()
    {
        return $this->hasOne(Visit::class, ['id' => 'visit_id']);
    }

    public function getMedicalAction()
    {
        return $this->hasOne(MedicalAction::class, ['id' => 'medical_action_id']);
    }
}