<?php

use yii\db\Migration;

class m261117_153914_add_code_to_medical_records extends Migration
{
    /**
     * {@inheritdoc}
     */

    public function safeUp()
    {
        $this->addColumn(
            'medical_records',
            'code',
            $this->string(30)->null()
        );

        $this->createIndex(
            'uq_medical_records_code',
            'medical_records',
            'code',
            true
        );
    }

    public function safeDown()
    {
        $this->dropIndex(
            'uq_medical_records_code',
            'medical_records'
        );

        $this->dropColumn(
            'medical_records',
            'code'
        );
    }


    /*
    // Use up()/down() to run migration code without a transaction.
    public function up()
    {

    }

    public function down()
    {
        echo "m261117_153914_add_code_to_medical_records cannot be reverted.\n";

        return false;
    }
    */
}