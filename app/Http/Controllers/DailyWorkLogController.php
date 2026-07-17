<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\DailyWorkLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class DailyWorkLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Managers and Admins see all employee logs. Employees see only their own.
        if (in_array($user->role, ['Super Admin', 'Admin', 'Manager', 'Team Lead'])) {
            $logs = DailyWorkLog::with(['user', 'manager'])
                ->orderBy('log_date', 'desc')
                ->get();
        } else {
            $logs = DailyWorkLog::with(['user', 'manager'])
                ->where('user_id', $user->id)
                ->orderBy('log_date', 'desc')
                ->get();
        }

        $managers = User::whereIn('role', ['Super Admin', 'Admin', 'Manager', 'Team Lead'])
            ->select('id', 'name')
            ->get();

        return Inertia::render('WorkLogs/WorkLogIndex', [
            'logs' => $logs,
            'managers' => $managers
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'log_date' => 'required|date',
            'today_work' => 'required|string',
            'completed_tasks' => 'nullable|string',
            'pending_tasks' => 'nullable|string',
            'issues_faced' => 'nullable|string',
            'tomorrow_plan' => 'nullable|string',
            'working_hours' => 'required|numeric|min:0.5|max:24',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        DailyWorkLog::create([
            'user_id' => Auth::id(),
            'log_date' => $validated['log_date'],
            'today_work' => $validated['today_work'],
            'completed_tasks' => $validated['completed_tasks'] ?? null,
            'pending_tasks' => $validated['pending_tasks'] ?? null,
            'issues_faced' => $validated['issues_faced'] ?? null,
            'tomorrow_plan' => $validated['tomorrow_plan'] ?? null,
            'working_hours' => $validated['working_hours'],
            'manager_id' => $validated['manager_id'] ?? null,
        ]);

        return redirect()->route('logs.index')->with('success', 'Daily work log submitted successfully.');
    }

    public function addRemarks(Request $request, DailyWorkLog $log)
    {
        $validated = $request->validate([
            'manager_remarks' => 'required|string'
        ]);

        $log->manager_remarks = $validated['manager_remarks'];
        $log->manager_id = Auth::id();
        $log->save();

        return back()->with('success', 'Remarks added successfully.');
    }
}
