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
        // 1. Tasks Table
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('department'); // Development, Graphic Design, etc.
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->string('priority')->default('Medium'); // Low, Medium, High, Critical
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->decimal('estimated_hours', 8, 2)->nullable();
            $table->string('status')->default('Pending'); // Pending, Accepted, In Progress, Review, Completed, Cancelled
            $table->text('tags')->nullable(); // JSON or text list of tags
            $table->text('recurring_settings')->nullable(); // JSON for recurrence
            $table->integer('time_tracked_seconds')->default(0);
            $table->boolean('is_time_tracking_active')->default(false);
            $table->timestamp('time_tracker_start')->nullable();
            $table->text('dependencies')->nullable(); // JSON list of parent task IDs
            $table->timestamps();
        });

        // 2. Task User (Pivot for multiple assignees)
        Schema::create('task_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // 3. Task Checklists
        Schema::create('task_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->string('item');
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });

        // 4. Task Comments
        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('comment');
            $table->string('attachment_path')->nullable();
            $table->timestamps();
        });

        // 5. Task History (Activity Timeline)
        Schema::create('task_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // e.g. "Changed status to In Progress"
            $table->timestamps();
        });

        // 6. Daily Work Logs
        Schema::create('daily_work_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('log_date');
            $table->text('today_work');
            $table->text('completed_tasks')->nullable();
            $table->text('pending_tasks')->nullable();
            $table->text('issues_faced')->nullable();
            $table->text('tomorrow_plan')->nullable();
            $table->decimal('working_hours', 4, 2)->default(8.00);
            $table->string('attachment_path')->nullable();
            $table->text('manager_remarks')->nullable();
            $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        // 7. Knowledge Base Articles
        Schema::create('knowledge_base_articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('steps')->nullable();
            $table->text('challenges_faced')->nullable();
            $table->text('solution')->nullable();
            $table->string('category'); // Development, HR, Design, etc.
            $table->text('attachment_paths')->nullable(); // JSON list
            $table->text('related_tasks')->nullable(); // JSON list
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->string('approval_status')->default('Pending'); // Pending, Approved, Rejected
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('version')->default(1);
            $table->timestamps();
        });

        // 8. SOPs (Standard Operating Procedures)
        Schema::create('sops', function (Blueprint $table) {
            $table->id();
            $table->string('department');
            $table->string('title');
            $table->text('instructions'); // step by step instructions
            $table->text('attachment_paths')->nullable(); // JSON images/videos
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->string('approval_status')->default('Pending'); // Pending, Approved
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('version')->default(1);
            $table->timestamps();
        });

        // 9. Documents
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('documents')->onDelete('cascade');
            $table->boolean('is_folder')->default(false);
            $table->string('name');
            $table->string('file_path')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->string('file_type')->nullable();
            $table->foreignId('uploader_id')->constrained('users')->onDelete('cascade');
            $table->text('allowed_roles')->nullable(); // JSON list of allowed roles. Null = all
            $table->timestamps();
        });

        // 10. Bugs
        Schema::create('bugs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority')->default('Medium'); // Low, Medium, High, Critical
            $table->string('severity')->default('Medium'); // Low, Medium, High, Blocker
            $table->string('environment')->default('Local'); // Local, Staging, Production
            $table->foreignId('developer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            $table->string('status')->default('Open'); // Open, In Progress, Resolved, Closed
            $table->string('attachment_path')->nullable();
            $table->text('expected_result')->nullable();
            $table->text('actual_result')->nullable();
            $table->text('resolution')->nullable();
            $table->timestamps();
        });

        // 11. Graphic Design Requests
        Schema::create('graphic_design_requests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('reference_images')->nullable(); // JSON list
            $table->string('priority')->default('Medium');
            $table->date('deadline');
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('designer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('approval_status')->default('Pending'); // Pending, Approved, Rejected
            $table->text('final_files')->nullable(); // JSON list
            $table->timestamps();
        });

        // 12. Research Records
        Schema::create('research_records', function (Blueprint $table) {
            $table->id();
            $table->string('topic');
            $table->foreignId('assigned_to')->constrained('users')->onDelete('cascade');
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            $table->date('deadline')->nullable();
            $table->text('sources')->nullable();
            $table->text('references')->nullable();
            $table->text('attachment_paths')->nullable(); // JSON list
            $table->text('findings')->nullable();
            $table->string('status')->default('Assigned'); // Assigned, In Progress, Under Review, Completed
            $table->timestamps();
        });

        // 13. Social Media Campaigns
        Schema::create('social_media_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('campaign_name');
            $table->string('platform'); // Facebook, Instagram, LinkedIn, YouTube
            $table->text('content')->nullable();
            $table->string('design_attachment_path')->nullable();
            $table->text('caption')->nullable();
            $table->timestamp('schedule_date')->nullable();
            $table->string('approval_status')->default('Pending'); // Pending, Approved, Rejected
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('analytics_clicks')->default(0);
            $table->integer('analytics_engagement')->default(0);
            $table->timestamps();
        });

        // 14. Expenses / Accounts
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // Expense, Invoice, Salary, Vendor Payment
            $table->string('title');
            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->string('category')->default('Office');
            $table->string('attachment_path')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('Pending'); // Pending, Approved, Paid, Rejected
            $table->timestamps();
        });

        // 15. HR Records (Leaves, Attendance, Reviews)
        Schema::create('hr_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_type'); // Leave Request, Attendance, Performance Review
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->string('status')->default('Pending'); // Pending, Approved, Rejected, Present, Absent, Late
            $table->text('details')->nullable(); // reason, review notes, etc.
            $table->integer('score')->nullable(); // 1-100 score for performance
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hr_records');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('social_media_campaigns');
        Schema::dropIfExists('research_records');
        Schema::dropIfExists('graphic_design_requests');
        Schema::dropIfExists('bugs');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('sops');
        Schema::dropIfExists('knowledge_base_articles');
        Schema::dropIfExists('daily_work_logs');
        Schema::dropIfExists('task_histories');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('task_checklists');
        Schema::dropIfExists('task_user');
        Schema::dropIfExists('tasks');
    }
};
