<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Task;
use App\Models\TaskChecklist;
use App\Models\TaskComment;
use App\Models\TaskHistory;
use App\Models\DailyWorkLog;
use App\Models\KnowledgeBaseArticle;
use App\Models\Sop;
use App\Models\Document;
use App\Models\Bug;
use App\Models\GraphicDesignRequest;
use App\Models\ResearchRecord;
use App\Models\SocialMediaCampaign;
use App\Models\Expense;
use App\Models\HRRecord;
use App\Models\Designation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = Hash::make('password');

        // Create Designations
        $rolesList = [
            'Senior Developer',
            'Operation manager',
            'Social media Manager',
            'Backend Operator',
            'Backend Head',
            'Researcher',
            'Content Creator',
            'Accountant'
        ];

        $designations = [];
        foreach ($rolesList as $rName) {
            $designations[$rName] = Designation::firstOrCreate(['name' => $rName]);
        }

        // Create main role users
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@mycompass.com'],
            [
                'name' => 'Sarah Connor (Super Admin)',
                'password' => $password,
                'role' => 'Super Admin',
                'department' => 'HR',
                'phone' => '+1 (555) 019-2834',
                'designation_id' => $designations['Operation manager']->id,
            ]
        );

        $admin = User::firstOrCreate(
            ['email' => 'admin@mycompass.com'],
            [
                'name' => 'Michael Scott (Admin)',
                'password' => $password,
                'role' => 'Admin',
                'department' => 'Back Office',
                'phone' => '+1 (555) 018-9988',
                'designation_id' => $designations['Backend Head']->id,
            ]
        );

        $manager = User::firstOrCreate(
            ['email' => 'manager@mycompass.com'],
            [
                'name' => 'Robert California (Manager)',
                'password' => $password,
                'role' => 'Manager',
                'department' => 'Development',
                'phone' => '+1 (555) 017-4837',
                'designation_id' => $designations['Operation manager']->id,
            ]
        );

        $teamLead = User::firstOrCreate(
            ['email' => 'teamlead@mycompass.com'],
            [
                'name' => 'Jim Halpert (Team Lead)',
                'password' => $password,
                'role' => 'Team Lead',
                'department' => 'Development',
                'phone' => '+1 (555) 014-9284',
                'designation_id' => $designations['Senior Developer']->id,
            ]
        );

        $employee = User::firstOrCreate(
            ['email' => 'employee@mycompass.com'],
            [
                'name' => 'Pam Beesly (Employee)',
                'password' => $password,
                'role' => 'Employee',
                'department' => 'Graphic Design',
                'phone' => '+1 (555) 013-4859',
                'designation_id' => $designations['Content Creator']->id,
            ]
        );

        $readonly = User::firstOrCreate(
            ['email' => 'readonly@mycompass.com'],
            [
                'name' => 'Creed Bratton (Read Only)',
                'password' => $password,
                'role' => 'Read Only User',
                'department' => 'Research',
                'phone' => '+1 (555) 012-0000',
                'designation_id' => $designations['Researcher']->id,
            ]
        );

        // Additional employees for departments
        $devUser = User::firstOrCreate(
            ['email' => 'developer@mycompass.com'],
            [
                'name' => 'Dwight Schrute (Developer)',
                'password' => $password,
                'role' => 'Employee',
                'department' => 'Development',
                'phone' => '+1 (555) 011-2233',
                'designation_id' => $designations['Senior Developer']->id,
            ]
        );

        $designerUser = User::firstOrCreate(
            ['email' => 'designer@mycompass.com'],
            [
                'name' => 'Ryan Howard (Designer)',
                'password' => $password,
                'role' => 'Employee',
                'department' => 'Graphic Design',
                'phone' => '+1 (555) 011-3344',
                'designation_id' => $designations['Content Creator']->id,
            ]
        );

        $researchUser = User::firstOrCreate(
            ['email' => 'researcher@mycompass.com'],
            [
                'name' => 'Toby Flenderson (Researcher)',
                'password' => $password,
                'role' => 'Employee',
                'department' => 'Research',
                'phone' => '+1 (555) 011-4455',
                'designation_id' => $designations['Researcher']->id,
            ]
        );

        $marketingUser = User::firstOrCreate(
            ['email' => 'marketing@mycompass.com'],
            [
                'name' => 'Kelly Kapoor (Social Media Manager)',
                'password' => $password,
                'role' => 'Employee',
                'department' => 'Marketing',
                'phone' => '+1 (555) 011-5566',
                'designation_id' => $designations['Social media Manager']->id,
            ]
        );

        $accountsUser = User::firstOrCreate(
            ['email' => 'accounts@mycompass.com'],
            [
                'name' => 'Oscar Martinez (Accountant)',
                'password' => $password,
                'role' => 'Employee',
                'department' => 'Accounts',
                'phone' => '+1 (555) 011-6677',
                'designation_id' => $designations['Accountant']->id,
            ]
        );

        // --- SEED TASKS ---
        $task1 = Task::create([
            'title' => 'Build Student Dashboard UI',
            'description' => 'Create a modern student analytics dashboard for the EdTech mobile app, focusing on progress logs, courses enrolled, and interactive reports.',
            'department' => 'Development',
            'creator_id' => $manager->id,
            'priority' => 'High',
            'start_date' => Carbon::now()->subDays(3),
            'due_date' => Carbon::now()->addDays(4),
            'estimated_hours' => 24.5,
            'status' => 'In Progress',
            'tags' => ['React', 'Dashboard', 'UI/UX'],
            'recurring_settings' => null,
            'time_tracked_seconds' => 18000, // 5 hours
            'is_time_tracking_active' => false,
            'dependencies' => null,
        ]);
        $task1->assignees()->attach([$devUser->id, $teamLead->id]);

        TaskChecklist::create(['task_id' => $task1->id, 'item' => 'Design dashboard mockup', 'is_completed' => true]);
        TaskChecklist::create(['task_id' => $task1->id, 'item' => 'Implement responsive sidebar layout', 'is_completed' => true]);
        TaskChecklist::create(['task_id' => $task1->id, 'item' => 'Integrate chart libraries', 'is_completed' => false]);
        TaskChecklist::create(['task_id' => $task1->id, 'item' => 'Connect to backend student API', 'is_completed' => false]);

        TaskComment::create([
            'task_id' => $task1->id,
            'user_id' => $teamLead->id,
            'comment' => 'Hey Dwight, make sure the charts render correctly on mobile viewports.',
        ]);
        TaskComment::create([
            'task_id' => $task1->id,
            'user_id' => $devUser->id,
            'comment' => 'Will do Jim! Working on the CSS breakpoints now.',
        ]);

        TaskHistory::create(['task_id' => $task1->id, 'user_id' => $manager->id, 'action' => 'Created the task']);
        TaskHistory::create(['task_id' => $task1->id, 'user_id' => $teamLead->id, 'action' => 'Accepted task and set status to In Progress']);

        $task2 = Task::create([
            'title' => 'Launch Social Media Marketing Banner Pack',
            'description' => 'Generate promotional banners for the summer course catalog campaign. Must cover Instagram, Facebook, and LinkedIn specs.',
            'department' => 'Graphic Design',
            'creator_id' => $superAdmin->id,
            'priority' => 'Critical',
            'start_date' => Carbon::now()->subDays(1),
            'due_date' => Carbon::now()->addDays(1),
            'estimated_hours' => 8.0,
            'status' => 'Review',
            'tags' => ['Marketing', 'Banners', 'Figma'],
            'recurring_settings' => null,
            'time_tracked_seconds' => 28800, // 8 hours
            'dependencies' => null,
        ]);
        $task2->assignees()->attach([$employee->id, $designerUser->id]);

        TaskChecklist::create(['task_id' => $task2->id, 'item' => 'Create Figma templates', 'is_completed' => true]);
        TaskChecklist::create(['task_id' => $task2->id, 'item' => 'Export PNG high-res outputs', 'is_completed' => true]);
        TaskChecklist::create(['task_id' => $task2->id, 'item' => 'Upload final zip package', 'is_completed' => true]);

        TaskComment::create([
            'task_id' => $task2->id,
            'user_id' => $employee->id,
            'comment' => 'Banners uploaded for approval. Please review, Sarah.',
            'attachment_path' => 'banners_pack_summer_2026.zip',
        ]);

        $task3 = Task::create([
            'title' => 'Conduct EdTech Market Analysis Q2',
            'description' => 'Research competitor price strategies and report on growth factors in K-12 learning systems.',
            'department' => 'Research',
            'creator_id' => $manager->id,
            'priority' => 'Medium',
            'start_date' => Carbon::now()->subDays(5),
            'due_date' => Carbon::now()->subDays(1),
            'estimated_hours' => 16.00,
            'status' => 'Completed',
            'tags' => ['Competitor Analysis', 'Report'],
            'recurring_settings' => null,
            'time_tracked_seconds' => 57600, // 16 hours
        ]);
        $task3->assignees()->attach([$researchUser->id]);

        // Since task 3 is completed, create a corresponding Knowledge Article
        KnowledgeBaseArticle::create([
            'title' => 'Competitor Pricing Models & Strategy (Q2 2026)',
            'description' => 'A comprehensive review of standard subscription tiers, student retention methods, and school onboarding fees observed in 5 top EdTech platforms.',
            'steps' => "1. Collected public pricing matrices.\n2. Scheduled interviews with system leads.\n3. Compiled financial benchmarks into Excel worksheets.",
            'challenges_faced' => 'Several pricing sheets were gated behind demo forms.',
            'solution' => 'We requested corporate demos using staging email handles to get standard quote layouts.',
            'category' => 'Research',
            'attachment_paths' => ['competitor_metrics_v2.xlsx'],
            'related_tasks' => [$task3->id],
            'author_id' => $researchUser->id,
            'approval_status' => 'Approved',
            'approved_by' => $superAdmin->id,
            'version' => 1,
        ]);

        // Overdue task
        $task4 = Task::create([
            'title' => 'Reconcile Q1 Tax Returns',
            'description' => 'Complete reconciliation of payroll, contractor payments, and sales receipts for fiscal audit submission.',
            'department' => 'Accounts',
            'creator_id' => $admin->id,
            'priority' => 'High',
            'start_date' => Carbon::now()->subDays(10),
            'due_date' => Carbon::now()->subDays(3),
            'estimated_hours' => 12.0,
            'status' => 'Pending',
            'tags' => ['Taxes', 'Audit'],
            'time_tracked_seconds' => 0,
        ]);
        $task4->assignees()->attach([$accountsUser->id]);

        // --- SEED DAILY WORK LOGS ---
        DailyWorkLog::create([
            'user_id' => $devUser->id,
            'log_date' => Carbon::now(),
            'today_work' => 'Worked on the responsive CSS files for the student dashboard. Compiled and validated the dashboard layout against screen breakpoints.',
            'completed_tasks' => 'Designed dashboard mockup & HTML grid structure',
            'pending_tasks' => 'Chart rendering & data integration',
            'issues_faced' => 'NPM resolving issues on Vite 8, resolved using peer flags.',
            'tomorrow_plan' => 'Integrate chart library widgets and populate API mock data.',
            'working_hours' => 8.5,
            'manager_remarks' => 'Great progress Dwight. Let me know if you need assistance with API structures.',
            'manager_id' => $teamLead->id,
        ]);

        DailyWorkLog::create([
            'user_id' => $employee->id,
            'log_date' => Carbon::now(),
            'today_work' => 'Finished designing all templates for the summer course catalog. Packaged banner files in zip and submitted for review.',
            'completed_tasks' => 'Completed summer promotion graphics',
            'pending_tasks' => 'Waiting for feedback from Super Admin',
            'issues_faced' => 'Figma layout engine crashed once, but no data was lost.',
            'tomorrow_plan' => 'Begin layout for physical brochures if approved.',
            'working_hours' => 7.0,
            'manager_remarks' => null,
            'manager_id' => null,
        ]);

        // --- SEED SOPS ---
        Sop::create([
            'department' => 'Development',
            'title' => 'Git Branching & Release Pipeline Standard',
            'instructions' => "1. Branch out from 'develop' using format 'feature/task-id-short-name'.\n2. Commit with descriptive messages containing the issue key.\n3. Create PR targeting 'develop' and assign at least 1 peer for code review.\n4. Merge occurs only after CI build compiles and passes linting.\n5. Production releases are merged into 'main' via tagged releases.",
            'attachment_paths' => null,
            'author_id' => $teamLead->id,
            'approval_status' => 'Approved',
            'approved_by' => $superAdmin->id,
        ]);

        Sop::create([
            'department' => 'Graphic Design',
            'title' => 'Brand Asset & Vector Standards SOP',
            'instructions' => "1. Always use RGB HSL color values matching the core brand book.\n2. Fonts must rely on Outfit or Inter Google Fonts.\n3. Vector structures must be exported as SVGs with text layers outlined.\n4. Save files in the Shared Google Drive with matching folder syntax.",
            'attachment_paths' => null,
            'author_id' => $designerUser->id,
            'approval_status' => 'Pending',
        ]);

        // --- SEED DOCUMENTS ---
        $rootFolder = Document::create([
            'is_folder' => true,
            'name' => 'Company Operations',
            'uploader_id' => $admin->id,
            'allowed_roles' => null,
        ]);

        Document::create([
            'parent_id' => $rootFolder->id,
            'is_folder' => false,
            'name' => 'Onboarding_Manual_2026.pdf',
            'file_path' => 'documents/onboarding.pdf',
            'file_size' => 1524332,
            'file_type' => 'pdf',
            'uploader_id' => $admin->id,
            'allowed_roles' => null,
        ]);

        $financeFolder = Document::create([
            'is_folder' => true,
            'name' => 'Finance & Salary Records',
            'uploader_id' => $superAdmin->id,
            'allowed_roles' => ['Super Admin', 'Admin', 'Manager'],
        ]);

        Document::create([
            'parent_id' => $financeFolder->id,
            'is_folder' => false,
            'name' => 'Q1_Financials_MWMS.xlsx',
            'file_path' => 'documents/q1_financials.xlsx',
            'file_size' => 458923,
            'file_type' => 'xlsx',
            'uploader_id' => $superAdmin->id,
            'allowed_roles' => ['Super Admin', 'Admin'],
        ]);

        // --- SEED BUGS ---
        Bug::create([
            'title' => 'Authentication token expiry crash',
            'description' => 'When a user session expires and they click save, the API returns a 419 token mismatch, which triggers a white screen crash instead of redirecting to login.',
            'priority' => 'High',
            'severity' => 'Blocker',
            'environment' => 'Production',
            'developer_id' => $devUser->id,
            'reporter_id' => $teamLead->id,
            'status' => 'In Progress',
            'expected_result' => 'The app should show a session expired modal or redirect cleanly back to the login page.',
            'actual_result' => 'A React uncaught runtime error (white screen) is displayed.',
        ]);

        Bug::create([
            'title' => 'Profile image crop ratio mismatch',
            'description' => 'Profile photos uploaded with rectangular dimensions appear skewed on the header dashboard component.',
            'priority' => 'Low',
            'severity' => 'Low',
            'environment' => 'Local',
            'developer_id' => null,
            'reporter_id' => $employee->id,
            'status' => 'Open',
            'expected_result' => 'Images should be cropped to 1:1 square or wrapped with object-fit: cover.',
            'actual_result' => 'Images are stretched horizontally.',
        ]);

        // --- SEED GRAPHIC DESIGN REQUESTS ---
        GraphicDesignRequest::create([
            'title' => 'YouTube Thumbnail Design for Math Classes',
            'description' => 'Create a catchy, bright 1920x1080 thumbnail targeting high school students for the Calculus series. Must look highly engaging.',
            'priority' => 'Medium',
            'deadline' => Carbon::now()->addDays(5),
            'requester_id' => $marketingUser->id,
            'designer_id' => $designerUser->id,
            'approval_status' => 'Pending',
        ]);

        // --- SEED RESEARCH RECORDS ---
        ResearchRecord::create([
            'topic' => 'AI Tutor Integration Best Practices',
            'assigned_to' => $researchUser->id,
            'reporter_id' => $teamLead->id,
            'deadline' => Carbon::now()->addDays(12),
            'sources' => 'IEEE Learning Systems Journal, OpenAI Education Case Studies',
            'references' => 'Khan Academy AI tutor results 2025',
            'findings' => null,
            'status' => 'In Progress',
        ]);

        // --- SEED SOCIAL MEDIA CAMPAIGNS ---
        SocialMediaCampaign::create([
            'campaign_name' => 'Early Bird Summer Coding Course Launch',
            'platform' => 'Instagram',
            'content' => 'Offer 20% discount on PyKids and ReactJS beginner coding bootcamps starting July 25th.',
            'caption' => '🚨 Code the future! Get 20% off our early bird summer bootcamps. Link in bio! 💻✨ #Coding #EdTech #CodingForKids',
            'schedule_date' => Carbon::now()->addDays(2),
            'approval_status' => 'Pending',
        ]);

        // --- SEED EXPENSES ---
        Expense::create([
            'type' => 'Expense',
            'title' => 'Vite Server Hosting (AWS)',
            'amount' => 450.00,
            'date' => Carbon::now()->subDays(4),
            'category' => 'Infrastructure',
            'status' => 'Approved',
        ]);

        Expense::create([
            'type' => 'Invoice',
            'title' => 'Contractor Video Editor Invoice',
            'amount' => 1200.00,
            'date' => Carbon::now()->subDays(2),
            'category' => 'Marketing Assets',
            'status' => 'Pending',
        ]);

        Expense::create([
            'type' => 'Salary',
            'title' => 'Employee Payroll June',
            'amount' => 38000.00,
            'date' => Carbon::now()->subMonth(),
            'category' => 'Payroll',
            'status' => 'Paid',
        ]);

        // --- SEED HR RECORDS ---
        HRRecord::create([
            'record_type' => 'Leave Request',
            'user_id' => $devUser->id,
            'date_from' => Carbon::now()->addDays(10),
            'date_to' => Carbon::now()->addDays(12),
            'status' => 'Pending',
            'details' => 'Family wedding. Need to travel out of state.',
        ]);

        HRRecord::create([
            'record_type' => 'Attendance',
            'user_id' => $employee->id,
            'date_from' => Carbon::now(),
            'date_to' => Carbon::now(),
            'status' => 'Present',
            'details' => 'Checked in at 09:02 AM. Checked out at 05:05 PM.',
        ]);

        HRRecord::create([
            'record_type' => 'Performance Review',
            'user_id' => $devUser->id,
            'status' => 'Approved',
            'details' => 'Dwight is performing exceptionally well on code delivery. His speed is high, although he could improve cooperation on multi-assigned design tasks.',
            'score' => 91,
            'reviewer_id' => $manager->id,
        ]);
    }
}
