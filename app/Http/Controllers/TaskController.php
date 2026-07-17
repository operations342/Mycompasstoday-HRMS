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
            'filters' => $request->only(['department', 'status', 'priority', 'assignee_id'])
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
        ]);

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
        ]);

        // Sync multiple assignees
        $task->assignees()->sync($validated['assignees']);

        // Log history
        TaskHistory::create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'action' => 'Created the task and assigned to employees'
        ]);

        return redirect()->route('tasks.index')->with('success', 'Task created successfully.');
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
}
