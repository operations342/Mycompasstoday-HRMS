<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\KnowledgeBaseController;
use App\Http\Controllers\DailyWorkLogController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\BugTrackerController;
use App\Http\Controllers\HRModuleController;
use App\Http\Controllers\AccountsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\ProfileController;

// Welcome Page redirecting to Login
Route::get('/', function () {
    return redirect()->route('login');
});

// Temporary Route to seed the live Admin user
Route::get('/setup-admin', function () {
    $password = Hash::make('password');
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
        $designations[$rName] = \App\Models\Designation::firstOrCreate(['name' => $rName]);
    }

    // Force seed superadmin@mycompass.com
    \App\Models\User::updateOrCreate(
        ['email' => 'superadmin@mycompass.com'],
        [
            'name' => 'Jay Rathod',
            'password' => $password,
            'role' => 'Super Admin',
            'department' => 'HR',
            'phone' => '8530557587',
            'designation_id' => $designations['Operation manager']->id,
        ]
    );

    // Force seed jaymycompass@gmail.com (Your personal email)
    $admin = \App\Models\User::updateOrCreate(
        ['email' => 'jaymycompass@gmail.com'],
        [
            'name' => 'Jay Rathod (Admin)',
            'password' => $password,
            'role' => 'Super Admin',
            'department' => 'HR',
            'phone' => '8530557587',
            'designation_id' => $designations['Operation manager']->id,
        ]
    );

    return "Admin accounts successfully verified/created for: " . $admin->email;
});

// Temporary Route to test Auth::attempt directly on live database
Route::get('/test-login', function () {
    $credentials = ['email' => 'jaymycompass@gmail.com', 'password' => 'password'];
    $success = \Illuminate\Support\Facades\Auth::attempt($credentials);
    
    $userExists = \App\Models\User::where('email', 'jaymycompass@gmail.com')->exists();
    $userHash = $userExists ? \App\Models\User::where('email', 'jaymycompass@gmail.com')->first()->password : null;
    $passwordMatch = $userHash ? Hash::check('password', $userHash) : false;

    return response()->json([
        'success' => $success,
        'user_exists' => $userExists,
        'password_match_check' => $passwordMatch,
        'user_details' => $userExists ? \App\Models\User::where('email', 'jaymycompass@gmail.com')->first(['id', 'email', 'name', 'role']) : null
    ]);
});

Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Tasks Management
    Route::resource('tasks', TaskController::class);
    Route::post('tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.updateStatus');
    Route::post('tasks/{task}/checklist', [TaskController::class, 'addChecklistItem'])->name('tasks.checklist.add');
    Route::post('checklists/{item}/toggle', [TaskController::class, 'toggleChecklistItem'])->name('tasks.checklist.toggle');
    Route::delete('checklists/{item}', [TaskController::class, 'deleteChecklistItem'])->name('tasks.checklist.delete');
    Route::post('tasks/{task}/comments', [TaskController::class, 'addComment'])->name('tasks.comment.add');
    Route::post('tasks/{task}/timer', [TaskController::class, 'toggleTimer'])->name('tasks.timer.toggle');
    Route::post('tasks/{task}/convert-knowledge', [TaskController::class, 'convertToKnowledge'])->name('tasks.convertKnowledge');

    // Knowledge Base
    Route::get('knowledge', [KnowledgeBaseController::class, 'index'])->name('knowledge.index');
    Route::post('knowledge', [KnowledgeBaseController::class, 'storeArticle'])->name('knowledge.store');
    Route::post('knowledge/{article}/approve', [KnowledgeBaseController::class, 'approveArticle'])->name('knowledge.approve');

    // SOPs (Standard Operating Procedures)
    Route::get('sops', [KnowledgeBaseController::class, 'sopIndex'])->name('sop.index');
    Route::post('sops', [KnowledgeBaseController::class, 'storeSop'])->name('sop.store');
    Route::post('sops/{sop}/approve', [KnowledgeBaseController::class, 'approveSop'])->name('sop.approve');

    // Daily Work Logs
    Route::get('logs', [DailyWorkLogController::class, 'index'])->name('logs.index');
    Route::post('logs', [DailyWorkLogController::class, 'store'])->name('logs.store');
    Route::post('logs/{log}/remarks', [DailyWorkLogController::class, 'addRemarks'])->name('logs.remarks');

    // Document Management
    Route::get('documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::delete('documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

    // Bug Tracker
    Route::get('bugs', [BugTrackerController::class, 'index'])->name('bugs.index');
    Route::post('bugs', [BugTrackerController::class, 'store'])->name('bugs.store');
    Route::patch('bugs/{bug}', [BugTrackerController::class, 'update'])->name('bugs.update');

    // HR Module
    Route::get('hr', [HRModuleController::class, 'index'])->name('hr.index');
    Route::post('hr/leave', [HRModuleController::class, 'submitLeave'])->name('hr.leave');
    Route::post('hr/leave/{record}/approve', [HRModuleController::class, 'approveLeave'])->name('hr.leave.approve');
    Route::post('hr/review', [HRModuleController::class, 'submitReview'])->name('hr.review');
    Route::post('hr/clock', [HRModuleController::class, 'clockInOut'])->name('hr.clock');
    Route::post('hr/users', [HRModuleController::class, 'storeUser'])->name('hr.users.store');
    Route::patch('hr/users/{user}', [HRModuleController::class, 'updateUser'])->name('hr.users.update');
    Route::delete('hr/users/{id}', [HRModuleController::class, 'destroyUser'])->name('hr.users.destroy');
    Route::post('hr/designations', [HRModuleController::class, 'storeDesignation'])->name('hr.designations.store');
    Route::patch('hr/designations/{designation}', [HRModuleController::class, 'updateDesignation'])->name('hr.designations.update');
    Route::delete('hr/designations/{designation}', [HRModuleController::class, 'destroyDesignation'])->name('hr.designations.destroy');

    // Accounts
    Route::get('accounts', [AccountsController::class, 'index'])->name('accounts.index');
    Route::post('accounts', [AccountsController::class, 'store'])->name('accounts.store');
    Route::post('accounts/{expense}/approve', [AccountsController::class, 'approve'])->name('accounts.approve');

    // Subscriptions
    Route::get('subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::post('subscriptions', [SubscriptionController::class, 'store'])->name('subscriptions.store');
    Route::patch('subscriptions/{subscription}', [SubscriptionController::class, 'update'])->name('subscriptions.update');
    Route::delete('subscriptions/{id}', [SubscriptionController::class, 'destroy'])->name('subscriptions.destroy');
    Route::post('subscriptions/{subscription}/renew', [SubscriptionController::class, 'renew'])->name('subscriptions.renew');

    // AI Helper endpoints
    Route::post('ai/task-summary', [AIController::class, 'taskSummary'])->name('ai.taskSummary');
    Route::post('ai/sop-generator', [AIController::class, 'sopGenerator'])->name('ai.sopGenerator');
    Route::post('ai/bug-description', [AIController::class, 'bugDescription'])->name('ai.bugDescription');
    Route::post('ai/daily-report', [AIController::class, 'dailyReport'])->name('ai.dailyReport');

    // Profile Management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
