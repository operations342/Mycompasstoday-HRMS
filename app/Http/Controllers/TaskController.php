<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Task;
use App\Models\User;
use App\Models\TaskChecklist;
use App\Models\TaskComment;
use App\Models\TaskHistory;
use App\Models\KnowledgeBaseArticle;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Task::with(['creator', 'assignees']);

        // Check if viewing recurring templates specifically (Admin/Manager only)
        if ($request->boolean('view_templates')) {
            if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
                return abort(403, 'Unauthorized action.');
            }
            $query->where('is_recurring', true)->whereNull('parent_recurring_id');
        } else {
            // Default view: exclude recurring template definitions (show only one-time tasks and generated occurrences)
            $query->where(function($q) {
                $q->where('is_recurring', false)
                  ->orWhereNotNull('parent_recurring_id');
            });
        }

        // Apply filters
        if ($request->has('department') && $request->department != 'All') {
            $query->where('department', $request->department);
        }
        if ($request->has('status') && $request->status != 'All') {
            $query->where('status', $request->status);
        }
        if ($request->has('priority') && $request->priority != 'All') {
            $query->where('priority', $request->priority);
        }
        if ($request->has('assignee_id') && $request->assignee_id != 'All') {
            $query->whereHas('assignees', function ($q) use ($request) {
                $q->where('users.id', $request->assignee_id);
            });
        }

        $tasks = $query->orderBy('due_date', 'asc')->get();
        $employees = User::select('id', 'name', 'role', 'department', 'avatar')->get();

        return Inertia::render('Tasks/TaskIndex', [
            'tasks' => $tasks,
            'employees' => $employees,
            'filters' => $request->only(['department', 'status', 'priority', 'assignee_id', 'view_templates'])
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department' => 'required|string',
            'priority' => 'required|string',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'estimated_hours' => 'nullable|numeric',
            'assignees' => 'required|array',
            'assignees.*' => 'exists:users,id',
            'dependencies' => 'nullable|array',
            'tags' => 'nullable|array',
            // Recurring fields
            'is_recurring' => 'nullable|boolean',
            'recurring_frequency' => 'nullable|string|in:Daily,Weekly,Monthly,Yearly,Custom',
            'recurring_custom_value' => 'nullable|integer|min:1',
            'recurring_days' => 'nullable|array',
            'recurring_days.*' => 'string',
            'recurring_monthly_option' => 'nullable|string',
            'recurring_start_date' => 'nullable|date',
            'recurring_end_date' => 'nullable|date',
            'recurring_never_end' => 'nullable|boolean',
        ]);

        $isRecurring = filter_var($validated['is_recurring'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Permissions restriction: Only Admins / Managers can create recurring task templates
        if ($isRecurring && !in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Only Admins and Managers can create recurring tasks.');
        }

        $task = Task::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'department' => $validated['department'],
            'creator_id' => Auth::id(),
            'priority' => $validated['priority'],
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'estimated_hours' => $validated['estimated_hours'] ?? null,
            'status' => 'Pending',
            'dependencies' => $validated['dependencies'] ?? [],
            'tags' => $validated['tags'] ?? [],
            // Recurring template fields
            'is_recurring' => $isRecurring,
            'recurring_frequency' => $validated['recurring_frequency'] ?? null,
            'recurring_custom_value' => $validated['recurring_custom_value'] ?? null,
            'recurring_days' => $validated['recurring_days'] ?? null,
            'recurring_monthly_option' => $validated['recurring_monthly_option'] ?? null,
            'recurring_start_date' => $validated['recurring_start_date'] ?? null,
            'recurring_end_date' => $validated['recurring_end_date'] ?? null,
            'recurring_never_end' => filter_var($validated['recurring_never_end'] ?? true, FILTER_VALIDATE_BOOLEAN),
        ]);

        // Sync multiple assignees
        $task->assignees()->sync($validated['assignees']);

        // Log history
        TaskHistory::create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'action' => $isRecurring ? 'Created a recurring task template' : 'Created the task and assigned to employees'
        ]);

        return redirect()->route('tasks.index')->with('success', $isRecurring ? 'Recurring task template created successfully.' : 'Task created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Task $task)
    {
        $task->load(['creator', 'assignees', 'checklists', 'comments.user', 'histories.user']);
        $employees = User::select('id', 'name', 'role', 'department', 'avatar')->get();

        return Inertia::render('Tasks/TaskShow', [
            'task' => $task,
            'employees' => $employees
        ]);
    }

    /**
     * Update the specified resource's status.
     */
    public function updateStatus(Request $request, Task $task)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Accepted,In Progress,Review,Completed,Cancelled'
        ]);

        $oldStatus = $task->status;
        $task->status = $validated['status'];
        $task->save();

        TaskHistory::create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'action' => "Changed status from '{$oldStatus}' to '{$validated['status']}'"
        ]);

        return back()->with('success', "Task status updated to {$validated['status']}.");
    }

    /**
     * Checklist Operations
     */
    public function addChecklistItem(Request $request, Task $task)
    {
        $validated = $request->validate([
            'item' => 'required|string|max:255'
        ]);

        $item = $task->checklists()->create([
            'item' => $validated['item'],
            'is_completed' => false
        ]);

        TaskHistory::create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'action' => "Added checklist item: '{$validated['item']}'"
        ]);

        return back();
    }

    public function toggleChecklistItem(Request $request, TaskChecklist $item)
    {
        $item->is_completed = !$item->is_completed;
        $item->save();

        $statusStr = $item->is_completed ? 'completed' : 'uncompleted';
        TaskHistory::create([
            'task_id' => $item->task_id,
            'user_id' => Auth::id(),
            'action' => "Marked checklist item '{$item->item}' as {$statusStr}"
        ]);

        return back();
    }

    public function deleteChecklistItem(TaskChecklist $item)
    {
        $taskId = $item->task_id;
        $itemName = $item->item;
        $item->delete();

        TaskHistory::create([
            'task_id' => $taskId,
            'user_id' => Auth::id(),
            'action' => "Deleted checklist item: '{$itemName}'"
        ]);

        return back();
    }

    /**
     * Add Task Comment
     */
    public function addComment(Request $request, Task $task)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
            'attachment' => 'nullable|file|max:10240' // 10MB
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            // Fake upload path for quick demo/local runtime
            $file = $request->file('attachment');
            $attachmentPath = $file->store('task_attachments', 'public');
        }

        $task->comments()->create([
            'user_id' => Auth::id(),
            'comment' => $validated['comment'],
            'attachment_path' => $attachmentPath
        ]);

        TaskHistory::create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'action' => 'Added a comment'
        ]);

        return back();
    }

    /**
     * Time Tracking toggling
     */
    public function toggleTimer(Request $request, Task $task)
    {
        if ($task->is_time_tracking_active) {
            // Stop the timer
            $start = Carbon::parse($task->time_tracker_start);
            $diffSeconds = Carbon::now()->diffInSeconds($start);
            $task->time_tracked_seconds += $diffSeconds;
            $task->is_time_tracking_active = false;
            $task->time_tracker_start = null;
            $task->save();

            TaskHistory::create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'action' => 'Stopped time tracking'
            ]);
        } else {
            // Start the timer
            $task->is_time_tracking_active = true;
            $task->time_tracker_start = Carbon::now();
            $task->save();

            TaskHistory::create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'action' => 'Started time tracking'
            ]);
        }

        return back();
    }

    /**
     * Convert Completed Task to Knowledge Base Article
     */
    public function convertToKnowledge(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'steps' => 'required|string',
            'challenges_faced' => 'nullable|string',
            'solution' => 'nullable|string',
            'category' => 'required|string|in:Development,Design,Research,HR,Accounts,Marketing,Back Office',
            'attachments' => 'nullable|array',
        ]);

        // Create the knowledge article
        $article = KnowledgeBaseArticle::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'steps' => $validated['steps'],
            'challenges_faced' => $validated['challenges_faced'] ?? null,
            'solution' => $validated['solution'] ?? null,
            'category' => $validated['category'],
            'attachment_paths' => $validated['attachments'] ?? [],
            'related_tasks' => [$task->id],
            'author_id' => Auth::id(),
            'approval_status' => 'Pending', // pending review
            'version' => 1
        ]);

        // Update task reference and history
        TaskHistory::create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'action' => "Converted task into Knowledge Base Draft: '{$article->title}'"
        ]);

        return redirect()->route('knowledge.index')->with('success', 'Task successfully converted to a draft Knowledge Base Article.');
    }

    /**
     * Update the task or its recurring series.
     */
    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department' => 'required|string',
            'priority' => 'required|string',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'estimated_hours' => 'nullable|numeric',
            'assignees' => 'required|array',
            'assignees.*' => 'exists:users,id',
            'dependencies' => 'nullable|array',
            'tags' => 'nullable|array',
            // Option to edit only this occurrence
            'edit_scope' => 'nullable|string|in:this_occurrence,all_occurrences',
        ]);

        // Permission check
        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $editScope = $validated['edit_scope'] ?? 'this_occurrence';

        if ($task->parent_recurring_id && $editScope === 'this_occurrence') {
            // "Edit only this occurrence" -> Detach task instance from the recurring series
            $task->parent_recurring_id = null;
        }

        $task->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'department' => $validated['department'],
            'priority' => $validated['priority'],
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'estimated_hours' => $validated['estimated_hours'] ?? null,
            'dependencies' => $validated['dependencies'] ?? [],
            'tags' => $validated['tags'] ?? [],
        ]);

        $task->assignees()->sync($validated['assignees']);

        TaskHistory::create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'action' => "Updated task details (Scope: {$editScope})"
        ]);

        return redirect()->route('tasks.index')->with('success', 'Task updated successfully.');
    }

    /**
     * Delete the task or its recurring series.
     */
    public function destroy(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        if (!in_array(Auth::user()->role, ['Super Admin', 'Admin', 'Manager'])) {
            return abort(403, 'Unauthorized action.');
        }

        $deleteScope = $request->input('delete_scope', 'this_occurrence');

        if ($task->is_recurring && $deleteScope === 'all_occurrences') {
            // Delete the parent template AND all generated occurrences
            Task::where('parent_recurring_id', $task->id)->delete();
        }

        $task->delete();

        return redirect()->route('tasks.index')->with('success', 'Task deleted successfully.');
    }
}
