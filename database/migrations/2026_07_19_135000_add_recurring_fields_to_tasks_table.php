<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->index();
            $table->string('recurring_frequency')->nullable(); // Daily, Weekly, Monthly, Yearly, Custom
            $table->integer('recurring_custom_value')->nullable(); // Repeat every X days/weeks/months
            $table->text('recurring_days')->nullable(); // JSON list of weekly days e.g. ["Monday", "Wednesday"]
            $table->string('recurring_monthly_option')->nullable(); // day_of_month, relative_day
            $table->date('recurring_start_date')->nullable();
            $table->date('recurring_end_date')->nullable();
            $table->boolean('recurring_never_end')->default(true);
            $table->foreignId('parent_recurring_id')->nullable()->index()->constrained('tasks')->onDelete('cascade');
            $table->timestamp('last_generated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['parent_recurring_id']);
            $table->dropColumn([
                'is_recurring',
                'recurring_frequency',
                'recurring_custom_value',
                'recurring_days',
                'recurring_monthly_option',
                'recurring_start_date',
                'recurring_end_date',
                'recurring_never_end',
                'parent_recurring_id',
                'last_generated_at'
            ]);
        });
    }
};
