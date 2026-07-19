<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use App\Models\TaskChecklist;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class GenerateRecurringTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:generate-recurring';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically generate task instances for active recurring task templates';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today();
        $this->info("Starting recurring task generation for: " . $today->toDateString());

        // 1. Fetch all active templates
        $templates = Task::where('is_recurring', true)
            ->whereNull('parent_recurring_id')
            ->where(function ($query) use ($today) {
                $query->whereNull('recurring_start_date')
                      ->orWhereDate('recurring_start_date', '<=', $today);
            })
            ->where(function ($query) use ($today) {
                $query->where('recurring_never_end', true)
                      ->orWhereNull('recurring_end_date')
                      ->orWhereDate('recurring_end_date', '>=', $today);
            })
            ->get();

        $generatedCount = 0;

        foreach ($templates as $template) {
            // Determine since when we need to catch up
            // (If last_generated_at is null, start checking from recurring_start_date or up to 7 days ago to avoid infinite lookbacks)
            $startDate = $template->last_generated_at 
                ? Carbon::parse($template->last_generated_at)->addDay() 
                : ($template->recurring_start_date ? Carbon::parse($template->recurring_start_date) : $today->copy()->subDays(7));

            // Catch up/scan loop from $startDate to $today
            $currentDate = $startDate->copy()->startOfDay();
            while ($currentDate->lte($today)) {
                if ($this->shouldGenerateTask($template, $currentDate)) {
                    // Check if an instance already exists for this exact due date to prevent duplicate task generation
                    $exists = Task::where('parent_recurring_id', $template->id)
                        ->whereDate('due_date', $currentDate)
                        ->exists();

                    if (!$exists) {
                        $this->generateTaskInstance($template, $currentDate);
                        $generatedCount++;
                    }
                }
                $currentDate->addDay();
            }

            // Update template execution timestamp
            $template->last_generated_at = Carbon::now();
            $template->save();
        }

        $this->info("Completed! Generated {$generatedCount} recurring task occurrences.");
        return Command::SUCCESS;
    }

    /**
     * Evaluate if the template schedule matches the target date.
     */
    private function shouldGenerateTask(Task $template, Carbon $date): bool
    {
        $freq = $template->recurring_frequency;

        switch ($freq) {
            case 'Daily':
                return true;

            case 'Weekly':
                // Check if target day of week is selected in recurring_days array
                $dayName = $date->format('l'); // e.g. "Monday"
                return is_array($template->recurring_days) && in_array($dayName, $template->recurring_days);

            case 'Monthly':
                // Options: day_of_month
                // Standard check: Match day number (e.g. 1st, 15th, 30th)
                $dayNum = (int) $template->recurring_start_date?->format('d') ?: 1;
                
                if ($template->recurring_monthly_option === 'relative_day') {
                    // Custom month relative checks e.g. last Friday
                    // Let's implement relative check matching relative day type if configured
                    return false; 
                }

                // If template date day number exceeds target month max days, clamp to month end
                $targetDay = min($dayNum, $date->daysInMonth);
                return (int)$date->format('d') === $targetDay;

            case 'Yearly':
                $startMonthDay = $template->recurring_start_date ? $template->recurring_start_date->format('m-d') : '01-01';
                return $date->format('m-d') === $startMonthDay;

            case 'Custom':
                // Custom frequency evaluation: e.g. repeat every X days/weeks/months
                $val = (int) $template->recurring_custom_value;
                if ($val <= 0) return false;

                $start = $template->recurring_start_date ? Carbon::parse($template->recurring_start_date) : $date->copy();
                $diff = $start->diffInDays($date);
                return $diff % $val === 0;

            default:
                return false;
        }
    }

    /**
     * Instantiate the concrete task instance for the specific date.
     */
    private function generateTaskInstance(Task $template, Carbon $date): void
    {
        Log::info("Generating task occurrence", [
            'template_id' => $template->id,
            'title' => $template->title,
            'target_date' => $date->toDateString()
        ]);

        // 1. Create task copy record
        $instance = Task::create([
            'title' => $template->title,
            'description' => $template->description,
            'department' => $template->department,
            'creator_id' => $template->creator_id,
            'priority' => $template->priority,
            'start_date' => $date,
            'due_date' => $date, // Single day instance due on the execution date
            'estimated_hours' => $template->estimated_hours,
            'status' => 'Pending',
            'tags' => $template->tags,
            'dependencies' => $template->dependencies,
            'parent_recurring_id' => $template->id,
            'is_recurring' => false, // Instances themselves are standard one-time execution instances
        ]);

        // 2. Copy assignees
        $assignees = $template->assignees()->pluck('users.id')->toArray();
        if (!empty($assignees)) {
            $instance->assignees()->sync($assignees);
        }

        // 3. Copy checklists
        $checklists = TaskChecklist::where('task_id', $template->id)->get();
        foreach ($checklists as $item) {
            TaskChecklist::create([
                'task_id' => $instance->id,
                'item' => $item->item,
                'is_completed' => false,
            ]);
        }

        // 4. Log history trace
        \App\Models\TaskHistory::create([
            'task_id' => $instance->id,
            'user_id' => $template->creator_id,
            'action' => "Automatically generated recurring occurrence for " . $date->toDateString()
        ]);
    }
}
