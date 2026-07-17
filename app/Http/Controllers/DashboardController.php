<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Task;
use App\Models\DailyWorkLog;
use App\Models\TaskComment;
use App\Models\Bug;
use App\Models\KnowledgeBaseArticle;
use App\Models\Sop;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Admin-level roles see the Admin Dashboard
        if (in_array($user->role, ['Super Admin', 'Admin', 'Manager', 'Team Lead'])) {
            return $this->adminDashboard($user);
        }

        // Standard Employees and Read Only Users see the Employee Dashboard
        return $this->employeeDashboard($user);
    }

    protected function adminDashboard($user)
    {
        $today = Carbon::today();

        // 1. Core counters
        $totalEmployees = User::count();
        $totalTasks = Task::count();
        
        $todaysTasksCount = Task::whereDate('due_date', $today)->count();
        $pendingCount = Task::where('status', 'Pending')->count();
        $inProgressCount = Task::where('status', 'In Progress')->count();
        $reviewCount = Task::where('status', 'Review')->count();
        $completedCount = Task::where('status', 'Completed')->count();
        $overdueCount = Task::where('status', '!=', 'Completed')
            ->whereDate('due_date', '<', $today)
            ->count();

        // 2. Department Performance
        // Group tasks by department and calculate completed vs total
        $deptStats = Task::select('department', 
            DB::raw('count(*) as total'),
            DB::raw('sum(case when status = "Completed" then 1 else 0 end) as completed')
        )
        ->groupBy('department')
        ->get()
        ->map(function ($item) {
            $completionRate = $item->total > 0 ? round(($item->completed / $item->total) * 100) : 0;
            return [
                'department' => $item->department,
                'total' => $item->total,
                'completed' => $item->completed,
                'rate' => $completionRate
            ];
        });

        // 3. Employee Productivity
        // Count of tasks completed by each user
        $employeeProductivity = User::select('users.id', 'users.name', 'users.department', 'users.avatar',
            DB::raw('count(task_user.task_id) as total_tasks'),
            DB::raw('sum(case when tasks.status = "Completed" then 1 else 0 end) as completed_tasks')
        )
        ->leftJoin('task_user', 'users.id', '=', 'task_user.user_id')
        ->leftJoin('tasks', 'task_user.task_id', '=', 'tasks.id')
        ->groupBy('users.id', 'users.name', 'users.department', 'users.avatar')
        ->orderBy('completed_tasks', 'desc')
        ->limit(5)
        ->get();

        // 4. Recent Activity
        // Pull latest comments and task log history
        $recentComments = TaskComment::with(['user', 'task'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'type' => 'comment',
                    'user' => $comment->user->name,
                    'avatar' => $comment->user->avatar,
                    'task_title' => $comment->task->title,
                    'task_id' => $comment->task->id,
                    'content' => $comment->comment,
                    'time' => $comment->created_at->diffForHumans()
                ];
            });

        $recentDailyLogs = DailyWorkLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // All users list for filters/assignments
        $allUsers = User::select('id', 'name', 'role', 'department', 'avatar')->get();

        return Inertia::render('Dashboard', [
            'isAdminView' => true,
            'metrics' => [
                'totalEmployees' => $totalEmployees,
                'totalTasks' => $totalTasks,
                'todaysTasks' => $todaysTasksCount,
                'pending' => $pendingCount,
                'inProgress' => $inProgressCount,
                'underReview' => $reviewCount,
                'completed' => $completedCount,
                'overdue' => $overdueCount
            ],
            'departmentPerformance' => $deptStats,
            'employeeProductivity' => $employeeProductivity,
            'recentActivity' => $recentComments,
            'recentDailyLogs' => $recentDailyLogs,
            'allUsers' => $allUsers,
        ]);
    }

    protected function employeeDashboard($user)
    {
        $today = Carbon::today();

        // 1. Employee's assigned tasks
        $assignedTasksQuery = Task::whereHas('assignees', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        });

        $pendingTasks = (clone $assignedTasksQuery)->whereIn('status', ['Pending', 'Accepted', 'In Progress'])->get();
        $completedTasks = (clone $assignedTasksQuery)->where('status', 'Completed')->get();
        $dueTodayTasks = (clone $assignedTasksQuery)->whereDate('due_date', $today)->where('status', '!=', 'Completed')->get();
        
        $upcomingDeadlines = (clone $assignedTasksQuery)
            ->whereDate('due_date', '>', $today)
            ->where('status', '!=', 'Completed')
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get();

        // 2. Recent Comments on their assigned tasks
        $assignedTaskIds = (clone $assignedTasksQuery)->pluck('id');
        $recentComments = TaskComment::with(['user', 'task'])
            ->whereIn('task_id', $assignedTaskIds)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // 3. Announcements (Mock or system entries from Super Admin)
        $announcements = [
            [
                'id' => 1,
                'title' => 'Summer Camp Course Launch Q3',
                'content' => 'The summer coding bootcamps are launching on July 25th. All course materials and marketing banners must be approved by the end of this week.',
                'author' => 'Sarah Connor (Super Admin)',
                'date' => 'July 12, 2026'
            ],
            [
                'id' => 2,
                'title' => 'Weekly Knowledge Base Contribution Goal',
                'content' => 'Reminder: Every completed task has a "Convert to Knowledge Base" button. Team Leads should ensure employees document their work to help future hires.',
                'author' => 'Michael Scott (Admin)',
                'date' => 'July 10, 2026'
            ]
        ];

        // 4. Personal Performance
        $totalAssigned = $assignedTasksQuery->count();
        $totalCompleted = $completedTasks->count();
        $personalPerformanceRate = $totalAssigned > 0 ? round(($totalCompleted / $totalAssigned) * 100) : 100;

        // 5. Personal Work Logs (last 5 entries)
        $personalWorkLogs = DailyWorkLog::where('user_id', $user->id)
            ->orderBy('log_date', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'isAdminView' => false,
            'metrics' => [
                'pending' => $pendingTasks->count(),
                'completed' => $completedTasks->count(),
                'dueToday' => $dueTodayTasks->count()
            ],
            'pendingTasks' => $pendingTasks,
            'completedTasks' => $completedTasks,
            'dueTodayTasks' => $dueTodayTasks,
            'upcomingDeadlines' => $upcomingDeadlines,
            'recentComments' => $recentComments,
            'announcements' => $announcements,
            'personalPerformance' => $personalPerformanceRate,
            'personalWorkLogs' => $personalWorkLogs
        ]);
    }
}
