<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role', 'department', 'phone', 'avatar', 'designation_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Role helpers
    public function isSuperAdmin(): bool
    {
        return $this->role === 'Super Admin';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['Super Admin', 'Admin']);
    }

    public function isManager(): bool
    {
        return in_array($this->role, ['Super Admin', 'Admin', 'Manager']);
    }

    public function isTeamLead(): bool
    {
        return in_array($this->role, ['Super Admin', 'Admin', 'Manager', 'Team Lead']);
    }

    public function isEmployee(): bool
    {
        return $this->role === 'Employee';
    }

    public function isReadOnly(): bool
    {
        return $this->role === 'Read Only User';
    }

    // Relationships
    public function dailyWorkLogs()
    {
        return $this->hasMany(DailyWorkLog::class);
    }

    public function createdTasks()
    {
        return $this->hasMany(Task::class, 'creator_id');
    }

    public function assignedTasks()
    {
        return $this->belongsToMany(Task::class, 'task_user');
    }

    public function comments()
    {
        return $this->hasMany(TaskComment::class);
    }

    public function bugReports()
    {
        return $this->hasMany(Bug::class, 'reporter_id');
    }

    public function assignedBugs()
    {
        return $this->hasMany(Bug::class, 'developer_id');
    }

    public function knowledgeArticles()
    {
        return $this->hasMany(KnowledgeBaseArticle::class, 'author_id');
    }

    public function sops()
    {
        return $this->hasMany(Sop::class, 'author_id');
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }
}
