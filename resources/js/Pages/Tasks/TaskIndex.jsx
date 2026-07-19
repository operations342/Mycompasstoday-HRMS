import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function TaskIndex({ tasks, employees, filters }) {
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list', 'calendar'
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filter states
    const [deptFilter, setDeptFilter] = useState(filters.department || 'All');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'All');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'All');
    const [assigneeFilter, setAssigneeFilter] = useState(filters.assignee_id || 'All');

    // Create Task Form State
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        department: 'Development',
        priority: 'Medium',
        start_date: '',
        due_date: '',
        estimated_hours: '',
        assignees: [],
        tags: '',
        dependencies: [],
        // Recurring variables
        is_recurring: false,
        recurring_frequency: 'Daily',
        recurring_custom_value: 1,
        recurring_days: [],
        recurring_monthly_option: 'day_of_month',
        recurring_start_date: new Date().toISOString().split('T')[0],
        recurring_end_date: '',
        recurring_never_end: true,
    });

    const submitCreateTask = (e) => {
        e.preventDefault();
        
        // Split tags by comma
        const tagsArr = data.tags ? data.tags.split(',').map(t => t.trim()) : [];
        
        post(route('tasks.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            }
        });
    };

    const handleFilterChange = (key, value) => {
        const queryParams = {
            department: key === 'department' ? value : deptFilter,
            status: key === 'status' ? value : statusFilter,
            priority: key === 'priority' ? value : priorityFilter,
            assignee_id: key === 'assignee_id' ? value : assigneeFilter
        };

        // Redirect with inertia search filters
        window.location.href = route('tasks.index', queryParams);
    };

    // Helper to calculate calendar days for the current month (July 2026 for demo purpose)
    const getCalendarDays = () => {
        const days = [];
        // Demo starts on Wednesday (July 1, 2026)
        for (let i = 1; i <= 31; i++) {
            days.push({
                dayNum: i,
                dateStr: `2026-07-${i < 10 ? '0' + i : i}`
            });
        }
        return days;
    };

    const calendarDays = getCalendarDays();

    // Group tasks by status for Kanban Board
    const statuses = ['Pending', 'Accepted', 'In Progress', 'Review', 'Completed', 'Cancelled'];

    return (
        <AuthenticatedLayout>
            <Head title="Task Board" />

            <div className="page-header">
                <div className="page-title-group">
                    <h1>Task Board</h1>
                    <p>Track deadlines, collaborate across teams, and manage workflows.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <span>➕</span> Create Task
                </button>
            </div>

            {/* Filter Row */}
            <div className="card-panel" style={{ padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    {/* View Templates / Tasks Selector (Admin only) */}
                    {['Super Admin', 'Admin', 'Manager'].includes(props.auth.user.role) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Task View Type</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                    className={`btn ${!filters.view_templates ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                    onClick={() => {
                                        window.location.href = route('tasks.index', { ...filters, view_templates: false });
                                    }}
                                >
                                    Standard Tasks
                                </button>
                                <button 
                                    className={`btn ${filters.view_templates ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                    onClick={() => {
                                        window.location.href = route('tasks.index', { ...filters, view_templates: true });
                                    }}
                                >
                                    🔄 Recurring Templates
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Department</span>
                        <select 
                            className="form-control" 
                            style={{ width: '160px', padding: '6px' }}
                            value={deptFilter}
                            onChange={(e) => { setDeptFilter(e.target.value); handleFilterChange('department', e.target.value); }}
                        >
                            <option value="All">All Departments</option>
                            <option value="Development">Development</option>
                            <option value="Graphic Design">Graphic Design</option>
                            <option value="Research">Research</option>
                            <option value="Back Office">Back Office</option>
                            <option value="HR">HR</option>
                            <option value="Accounts">Accounts</option>
                            <option value="Social Media">Social Media</option>
                            <option value="Marketing">Marketing</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Priority</span>
                        <select 
                            className="form-control" 
                            style={{ width: '140px', padding: '6px' }}
                            value={priorityFilter}
                            onChange={(e) => { setPriorityFilter(e.target.value); handleFilterChange('priority', e.target.value); }}
                        >
                            <option value="All">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Assignee</span>
                        <select 
                            className="form-control" 
                            style={{ width: '160px', padding: '6px' }}
                            value={assigneeFilter}
                            onChange={(e) => { setAssigneeFilter(e.target.value); handleFilterChange('assignee_id', e.target.value); }}
                        >
                            <option value="All">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flexGrow: 1 }}></div>

                    {/* View Switcher */}
                    <div className="view-switcher" style={{ margin: 0 }}>
                        <button 
                            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                            onClick={() => setViewMode('kanban')}
                        >
                            Kanban View
                        </button>
                        <button 
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            List View
                        </button>
                        <button 
                            className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                            onClick={() => setViewMode('calendar')}
                        >
                            Calendar
                        </button>
                    </div>
                </div>
            </div>

            {/* ==================================
               1. KANBAN BOARD VIEW
               ================================== */}
            {viewMode === 'kanban' && (
                <div className="kanban-board">
                    {statuses.map(status => {
                        const statusTasks = tasks.filter(t => t.status === status);
                        return (
                            <div key={status} className="kanban-column">
                                <div className="column-header">
                                    <span>{status}</span>
                                    <span className="column-count">{statusTasks.length}</span>
                                </div>
                                <div className="column-cards">
                                    {statusTasks.map(task => (
                                        <div key={task.id} className="kanban-card">
                                            <div className="card-tag-row">
                                                <span className="card-tag">{task.department}</span>
                                                <span className="card-tag" style={{ 
                                                    backgroundColor: task.priority === 'Critical' ? 'var(--danger-light)' : 
                                                                    task.priority === 'High' ? 'var(--warning-light)' : 'var(--bg-tertiary)',
                                                    color: task.priority === 'Critical' ? 'var(--danger)' : 
                                                           task.priority === 'High' ? 'var(--warning)' : 'var(--text-secondary)'
                                                }}>{task.priority}</span>
                                            </div>
                                            <h4>
                                                <Link href={route('tasks.show', task.id)}>
                                                    {(task.parent_recurring_id || task.is_recurring) && <span style={{ marginRight: '6px', title: 'Recurring task' }}>🔁</span>}
                                                    {task.title}
                                                </Link>
                                            </h4>
                                            <p>{task.description}</p>
                                            <div className="card-footer">
                                                <span>📅 {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                                                <div className="card-assignees">
                                                    {task.assignees.map(user => (
                                                        <div 
                                                            key={user.id} 
                                                            className="card-assignee-avatar" 
                                                            title={user.name}
                                                            style={{ backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold' }}
                                                        >
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {statusTasks.length === 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                                            Empty state
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================================
               2. LIST TABLE VIEW
               ================================== */}
            {viewMode === 'list' && (
                <div className="table-container">
                    <table className="table-view">
                        <thead>
                            <tr>
                                <th>Task Title</th>
                                <th>Department</th>
                                <th>Assignees</th>
                                <th>Priority</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Estimate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id}>
                                    <td>
                                        <Link href={route('tasks.show', task.id)} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {(task.parent_recurring_id || task.is_recurring) && <span style={{ marginRight: '6px' }}>🔁</span>}
                                            {task.title}
                                        </Link>
                                    </td>
                                    <td>{task.department}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {task.assignees.map(user => (
                                                <span 
                                                    key={user.id} 
                                                    style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}
                                                    title={user.name}
                                                >
                                                    {user.name.split(' ')[0]}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge`} style={{ 
                                            backgroundColor: task.priority === 'Critical' ? 'var(--danger-light)' : 'var(--bg-tertiary)',
                                            color: task.priority === 'Critical' ? 'var(--danger)' : 'var(--text-secondary)'
                                        }}>{task.priority}</span>
                                    </td>
                                    <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</td>
                                    <td>
                                        <span className={`badge badge-${task.status.toLowerCase().replace(' ', '')}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td>{task.estimated_hours ? `${task.estimated_hours} hrs` : '-'}</td>
                                </tr>
                            ))}
                            {tasks.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                                        No tasks match these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ==================================
               3. CALENDAR VIEW
               ================================== */}
            {viewMode === 'calendar' && (
                <div className="card-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 className="panel-title">July 2026</h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Demo Calendar Mode</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', padding: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                                {d}
                            </div>
                        ))}

                        {/* Filler for demo offset (July 1st 2026 is a Wednesday, so 3 empty cells) */}
                        <div style={{ height: '80px', backgroundColor: 'transparent' }}></div>
                        <div style={{ height: '80px', backgroundColor: 'transparent' }}></div>
                        <div style={{ height: '80px', backgroundColor: 'transparent' }}></div>

                        {calendarDays.map(cell => {
                            const cellTasks = tasks.filter(t => t.due_date && t.due_date.includes(cell.dateStr));
                            return (
                                <div key={cell.dayNum} style={{ minHeight: '80px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-tertiary)' }}>{cell.dayNum}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                        {cellTasks.map(task => (
                                            <Link 
                                                key={task.id} 
                                                href={route('tasks.show', task.id)}
                                                style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 500 }}
                                                title={task.title}
                                            >
                                                {task.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ==================================
               CREATE TASK MODAL
               ================================== */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Task</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitCreateTask}>
                            <div className="form-group">
                                <label className="form-label">Task Title</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                />
                                {errors.title && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.title}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                ></textarea>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select 
                                        className="form-control"
                                        value={data.department}
                                        onChange={e => setData('department', e.target.value)}
                                    >
                                        <option value="Development">Development</option>
                                        <option value="Graphic Design">Graphic Design</option>
                                        <option value="Research">Research</option>
                                        <option value="Back Office">Back Office</option>
                                        <option value="HR">HR</option>
                                        <option value="Accounts">Accounts</option>
                                        <option value="Social Media">Social Media</option>
                                        <option value="Marketing">Marketing</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select 
                                        className="form-control"
                                        value={data.priority}
                                        onChange={e => setData('priority', e.target.value)}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={data.start_date}
                                        onChange={e => setData('start_date', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={data.due_date}
                                        onChange={e => setData('due_date', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Estimated Hours</label>
                                    <input 
                                        type="number" 
                                        step="0.5" 
                                        className="form-control" 
                                        value={data.estimated_hours}
                                        onChange={e => setData('estimated_hours', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tags (comma-separated)</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="React, UI, API"
                                        value={data.tags}
                                        onChange={e => setData('tags', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Recurring Task Panel (Visible to Admins and Managers only) */}
                            {['Super Admin', 'Admin', 'Manager'].includes(props.auth.user.role) && (
                                <div style={{ margin: '16px 0', border: '1px dashed var(--border-color)', padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={data.is_recurring} 
                                            onChange={e => setData('is_recurring', e.target.checked)} 
                                        />
                                        🔁 Is Recurring Task Template
                                    </label>

                                    {data.is_recurring && (
                                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div className="form-row-2">
                                                <div className="form-group">
                                                    <label className="form-label">Recurrence Frequency</label>
                                                    <select 
                                                        className="form-control"
                                                        value={data.recurring_frequency}
                                                        onChange={e => setData('recurring_frequency', e.target.value)}
                                                    >
                                                        <option value="Daily">Daily</option>
                                                        <option value="Weekly">Weekly</option>
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="Yearly">Yearly</option>
                                                        <option value="Custom">Custom Interval</option>
                                                    </select>
                                                </div>

                                                {data.recurring_frequency === 'Custom' && (
                                                    <div className="form-group">
                                                        <label className="form-label">Repeat Every X Days</label>
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            className="form-control" 
                                                            value={data.recurring_custom_value} 
                                                            onChange={e => setData('recurring_custom_value', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {data.recurring_frequency === 'Weekly' && (
                                                <div className="form-group">
                                                    <label className="form-label">Select Repeat Days</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                            <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    value={day}
                                                                    checked={data.recurring_days.includes(day)}
                                                                    onChange={e => {
                                                                        const checked = e.target.checked;
                                                                        setData('recurring_days', checked 
                                                                            ? [...data.recurring_days, day]
                                                                            : data.recurring_days.filter(d => d !== day)
                                                                        );
                                                                    }}
                                                                />
                                                                {day.slice(0,3)}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {data.recurring_frequency === 'Monthly' && (
                                                <div className="form-group">
                                                    <label className="form-label">Monthly Repetition Style</label>
                                                    <select 
                                                        className="form-control"
                                                        value={data.recurring_monthly_option}
                                                        onChange={e => setData('recurring_monthly_option', e.target.value)}
                                                    >
                                                        <option value="day_of_month">Same day of the month (e.g. 1st, 15th)</option>
                                                        <option value="relative_day">Relative day (based on start date)</option>
                                                    </select>
                                                </div>
                                            )}

                                            <div className="form-row-2">
                                                <div className="form-group">
                                                    <label className="form-label">Recurrence Start Date</label>
                                                    <input 
                                                        type="date" 
                                                        className="form-control" 
                                                        value={data.recurring_start_date} 
                                                        onChange={e => setData('recurring_start_date', e.target.value)}
                                                    />
                                                </div>

                                                {!data.recurring_never_end && (
                                                    <div className="form-group">
                                                        <label className="form-label">Recurrence End Date</label>
                                                        <input 
                                                            type="date" 
                                                            className="form-control" 
                                                            value={data.recurring_end_date} 
                                                            onChange={e => setData('recurring_end_date', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="form-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={data.recurring_never_end} 
                                                        onChange={e => setData('recurring_never_end', e.target.checked)}
                                                    />
                                                    Never expire (repeat infinitely)
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Assign Multiple Employees</label>
                                <select 
                                    multiple 
                                    className="form-control" 
                                    style={{ height: '100px' }}
                                    value={data.assignees}
                                    onChange={e => {
                                        const values = Array.from(e.target.selectedOptions, option => option.value);
                                        setData('assignees', values);
                                    }}
                                >
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                                    ))}
                                </select>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Hold Ctrl (Cmd) to select multiple assignees.</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={processing}>Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
