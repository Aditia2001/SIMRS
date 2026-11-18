<?php

use yii\db\Migration;

class m261117_140159_add_code_to_doctor_schedules extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn(
            'doctor_schedules',
            'code',
            $this->string(30)->notNull()->unique()
        );
    }

    public function safeDown()
    {
        $this->dropColumn('doctor_schedules', 'code');
    }

    /*
    // Use up()/down() to run migration code without a transaction.
    public function up()
    {

    }

    public function down()
    {
        echo "m261117_140159_add_code_to_doctor_schedules cannot be reverted.\n";

        return false;
    }
    */
}