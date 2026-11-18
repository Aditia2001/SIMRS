<?php

declare(strict_types=1);

namespace app\repositories;

use Yii;

class DocumentSequenceRepository
{
    public function generateCode(string $prefix): string
    {
        $year = (int) date('Y');
        $month = (int) date('m');

        $sql = <<<SQL
            INSERT INTO document_sequences
                (prefix, year, month, last_number)
            VALUES
                (:prefix, :year, :month, 1)
            ON CONFLICT (prefix, year, month)
            DO UPDATE SET
                last_number = document_sequences.last_number + 1
            RETURNING last_number
        SQL;

        $number = Yii::$app->db->createCommand($sql, [
            ':prefix' => $prefix,
            ':year' => $year,
            ':month' => $month,
        ])->queryScalar();

        return sprintf(
            '%s%02d%04d%04d',
            $prefix,
            $month,
            $year,
            $number
        );
    }
}