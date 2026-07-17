import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard(props) {
    const { isAdminView, metrics, allUsers } = props;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            
            {isAdminView ? (
                /* ==================================
                   ADMIN / MANAGER DASHBOARD VIEW
                   ================================== */
                <div className="admin-dashboard-container">
                    <div className="page-header">
                        <div className="page-title-group">
                            <h1>MyCompass Executive Hub</h1>
                            <p>Overview of organizational tasks, department bandwidth, and employee logs.</p>
                        </div>
                        <div className="top-buttons" style={{ display: 'flex', gap: '10px' }}>
                            <Link href={route('tasks.create')} className="btn btn-primary">
                                <span>➕</span> Create Task
                            </Link>
                            <Link href={route('knowledge.index')} className="btn btn-secondary">
                                <span>🧠</span> Knowledge Base
                            </Link>
                        </div>
                    </div>

                    {/* Metric Cards Row */}
                    <div className="dashboard-grid">
                        <div className="metrics-card" style={{ '--card-accent': '#3b82f6' }}>
                            <span className="metrics-label">Total Employees</span>
                            <span className="metrics-value">{metrics.totalEmployees}</span>
                            <span className="metrics-subtext">Across 8 departments</span>
                        </div>

                        <div className="metrics-card" style={{ '--card-accent': '#6366f1' }}>
                            <span className="metrics-label">Total Tasks</span>
                            <span className="metrics-value">{metrics.totalTasks}</span>
                            <span className="metrics-subtext">Active projects database</span>
                        </div>

                        <div className="metrics-card" style={{ '--card-accent': '#10b981' }}>
                            <span className="metrics-label">Completed Tasks</span>
                            <span className="metrics-value">{metrics.completed}</span>
                            <span className="metrics-subtext">Archived & documented</span>
                        </div>

                        <div className="metrics-card" style={{ '--card-accent': '#ef4444' }}>
                            <span className="metrics-label">Overdue Tasks</span>
                            <span className="metrics-value">{metrics.overdue}</span>
                            <span className="metrics-subtext" style={{ color: 'var(--danger)' }}>🚨 Actions required</span>
                        </div>
                    </div>

                    {/* Secondary Metrics (Pending, In Progress, Review) */}
                    <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '32px' }}>
                        <div className="metrics-card" style={{ padding: '16px', '--card-accent': '#f59e0b' }}>
                            <span className="metrics-label" style={{ fontSize: '0.75rem' }}>Pending Intake</span>
                            <span className="metrics-value" style={{ fontSize: '1.5rem', margin: '6px 0' }}>{metrics.pending}</span>
                        </div>
                        <div className="metrics-card" style={{ padding: '16px', '--card-accent': '#06b6d4' }}>
                            <span className="metrics-label" style={{ fontSize: '0.75rem' }}>In Progress</span>
                            <span className="metrics-value" style={{ fontSize: '1.5rem', margin: '6px 0' }}>{metrics.inProgress}</span>
                        </div>
                        <div className="metrics-card" style={{ padding: '16px', '--card-accent': '#a855f7' }}>
                            <span className="metrics-label" style={{ fontSize: '0.75rem' }}>Under Review</span>
                            <span className="metrics-value" style={{ fontSize: '1.5rem', margin: '6px 0' }}>{metrics.underReview}</span>
                        </div>
                        <div className="metrics-card" style={{ padding: '16px', '--card-accent': '#10b981' }}>
                            <span className="metrics-label" style={{ fontSize: '0.75rem' }}>Today's Due</span>
                            <span className="metrics-value" style={{ fontSize: '1.5rem', margin: '6px 0' }}>{metrics.todaysTasks}</span>
                        </div>
                    </div>

                    {/* Grid Section for charts / lists */}
                    <div className="section-grid">
                        {/* Left Side: Department Performance & Log Feeds */}
                        <div className="grid-left-side">
                            {/* Department Performance Panel */}
                            <div className="card-panel">
                                <div className="panel-header">
                                    <h3 className="panel-title">Bandwidth & Department Metrics</h3>
                                </div>
                                <div className="dept-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {props.departmentPerformance.length > 0 ? (
                                        props.departmentPerformance.map((dept, index) => (
                                            <div key={index} className="dept-item">
                                                <div style={{ display: 'flex', justifyContent: 'between', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                                                    <span style={{ fontWeight: 600 }}>{dept.department}</span>
                                                    <span style={{ color: 'var(--text-secondary)' }}>{dept.completed}/{dept.total} Tasks Completed ({dept.rate}%)</span>
                                                </div>
                                                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${dept.rate}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No task records loaded yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Daily logs from Employees */}
                            <div className="card-panel">
                                <div className="panel-header">
                                    <h3 className="panel-title">Recent Employee Daily Work Logs</h3>
                                    <Link href={route('logs.index')} className="btn btn-secondary btn-sm">Review All</Link>
                                </div>
                                <div className="logs-feed" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {props.recentDailyLogs.length > 0 ? (
                                        props.recentDailyLogs.map((log) => (
                                            <div key={log.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                                <div className="user-avatar" style={{ border: 'none', backgroundColor: '#e2e8f0', width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                                    {log.user.name.charAt(0)}
                                                </div>
                                                <div style={{ flexGrow: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user.name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                            {new Date(log.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ({log.working_hours} hrs)
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{log.today_work}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No work logs submitted today.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Employee Productivity & Activity Feed */}
                        <div className="grid-right-side">
                            {/* Employee Productivity List */}
                            <div className="card-panel">
                                <div className="panel-header">
                                    <h3 className="panel-title">Productivity Leaders</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {props.employeeProductivity.map((emp) => (
                                        <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="user-avatar" style={{ border: 'none', width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{emp.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{emp.department}</div>
                                                </div>
                                            </div>
                                            <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
                                                {emp.completed_tasks} done
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent comments / Activity logs */}
                            <div className="card-panel">
                                <div className="panel-header">
                                    <h3 className="panel-title">Recent Work Discussion</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {props.recentActivity.length > 0 ? (
                                        props.recentActivity.map((act) => (
                                            <div key={act.id} style={{ fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                                                    <span style={{ fontWeight: 600 }}>{act.user}</span>
                                                    <span>{act.time}</span>
                                                </div>
                                                <div style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>
                                                    on <Link href={route('tasks.show', act.task_id)} style={{ fontWeight: 500 }}>{act.task_title}</Link>
                                                </div>
                                                <p style={{ fontStyle: 'italic', marginTop: '4px', backgroundColor: 'var(--bg-primary)', padding: '6px', borderRadius: '4px' }}>
                                                    "{act.content}"
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No recent comments posted.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ==================================
                   EMPLOYEE DASHBOARD VIEW
                   ================================== */
                <div className="employee-dashboard-container">
                    <div className="page-header">
                        <div className="page-title-group">
                            <h1>Welcome Back!</h1>
                            <p>Here is an overview of your assignments and daily reports.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link href={route('logs.index')} className="btn btn-primary">
                                ✍️ Submit Work Log
                            </Link>
                            <form action={route('hr.clock')} method="POST" style={{ display: 'inline' }}>
                                <button type="submit" className="btn btn-secondary">
                                    ⏱️ Clock In / Out
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Employee Metrics Cards */}
                    <div className="dashboard-grid">
                        <div className="metrics-card" style={{ '--card-accent': '#f59e0b' }}>
                            <span className="metrics-label">Assigned Tasks</span>
                            <span className="metrics-value">{metrics.pending}</span>
                            <span className="metrics-subtext">Currently active</span>
                        </div>

                        <div className="metrics-card" style={{ '--card-accent': '#10b981' }}>
                            <span className="metrics-label">Tasks Completed</span>
                            <span className="metrics-value">{metrics.completed}</span>
                            <span className="metrics-subtext">Overall history</span>
                        </div>

                        <div className="metrics-card" style={{ '--card-accent': '#ef4444' }}>
                            <span className="metrics-label">Due Today</span>
                            <span className="metrics-value">{metrics.dueToday}</span>
                            <span className="metrics-subtext">Requires immediate focus</span>
                        </div>

                        <div className="metrics-card" style={{ '--card-accent': '#6366f1' }}>
                            <span className="metrics-label">Productivity Performance</span>
                            <span className="metrics-value">{props.personalPerformance}%</span>
                            <span className="metrics-subtext">Completion rate</span>
                        </div>
                    </div>

                    <div className="section-grid">
                        {/* Left Side: Tasks Due / Upcoming Deadlines */}
                        <div className="grid-left-side">
                            <div className="card-panel">
                                <div className="panel-header">
                                    <h3 className="panel-title">My Tasks Due / Upcoming Deadlines</h3>
                                    <Link href={route('tasks.index')} className="btn btn-secondary btn-sm">View Board</Link>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {props.upcomingDeadlines.length > 0 ? (
                                        props.upcomingDeadlines.map((task) => (
                                            <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                                <div>
                                                    <Link href={route('tasks.show', task.id)} style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                        {task.title}
                                                    </Link>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                                                        <span className={`badge badge-${task.status.toLowerCase().replace(' ', '')}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                            {task.status}
                                                        </span>
                                                        <span className="card-tag" style={{ fontSize: '0.65rem' }}>{task.priority} Priority</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Due: {new Date(task.due_date).toLocaleDateString()}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Est: {task.estimated_hours} hrs</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state" style={{ padding: '24px' }}>
                                            <span className="empty-state-icon">🎉</span>
                                            <h3>All caught up!</h3>
                                            <p>No upcoming task deadlines found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Personal Work logs history */}
                            <div className="card-panel">
                                <div className="panel-header">
                                    <h3 className="panel-title">My Recent Daily Logs</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {props.personalWorkLogs.length > 0 ? (
                                        props.personalWorkLogs.map((log) => (
                                            <div key={log.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <span>{new Date(log.log_date).toLocaleDateString()}</span>
                                                    <span style={{ color: 'var(--primary)' }}>{log.working_hours} hours logged</span>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{log.today_work}</p>
                                                {log.manager_remarks && (
                                                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--warning-light)', borderLeft: '3px solid var(--warning)', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                        <strong>Remarks:</strong> {log.manager_remarks}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No work logs found. Submit your first log to review progress.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Announcements & Recent activity */}
                        <div className="grid-right-side">
                            {/* Announcements panel */}
                            <div className="card-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
                                <div className="panel-header">
                                    <h3 className="panel-title" style={{ color: 'var(--primary)' }}>📢 Announcements</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {props.announcements.map((ann) => (
                                        <div key={ann.id} style={{ fontSize: '0.8rem', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{ann.title}</div>
                                            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{ann.content}</p>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '6px', textAlign: 'right' }}>
                                                By {ann.author} on {ann.date}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Discussion feed relating to their assignments */}
                            <div className="card-panel">
                                <div className="panel-header">
                                    <h3 className="panel-title">Task Discussions</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {props.recentComments.length > 0 ? (
                                        props.recentComments.map((comment) => (
                                            <div key={comment.id} style={{ fontSize: '0.8rem', padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                                                    <span style={{ fontWeight: 600 }}>{comment.user.name}</span>
                                                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p style={{ marginTop: '4px', color: 'var(--text-primary)' }}>{comment.comment}</p>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                    on <Link href={route('tasks.show', comment.task.id)} style={{ fontWeight: 500 }}>{comment.task.title}</Link>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No discussion logs found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
