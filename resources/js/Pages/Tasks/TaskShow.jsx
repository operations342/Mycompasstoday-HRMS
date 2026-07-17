import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';

export default function TaskShow({ task, employees }) {
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    
    // Status update form
    const statusForm = useForm({
        status: task.status
    });

    const handleStatusChange = (newStatus) => {
        statusForm.setData('status', newStatus);
        // Post directly
        axios.post(route('tasks.updateStatus', task.id), { status: newStatus })
             .then(() => {
                 window.location.reload();
             });
    };

    // Checklist form
    const checklistForm = useForm({
        item: ''
    });

    const submitChecklist = (e) => {
        e.preventDefault();
        if (!checklistForm.data.item.trim()) return;
        
        checklistForm.post(route('tasks.checklist.add', task.id), {
            onSuccess: () => checklistForm.reset()
        });
    };

    const toggleChecklist = (itemId) => {
        axios.post(route('tasks.checklist.toggle', itemId))
             .then(() => window.location.reload());
    };

    const deleteChecklist = (itemId) => {
        axios.delete(route('tasks.checklist.delete', itemId))
             .then(() => window.location.reload());
    };

    // Comment form
    const commentForm = useForm({
        comment: '',
        attachment: null
    });

    const submitComment = (e) => {
        e.preventDefault();
        commentForm.post(route('tasks.comment.add', task.id), {
            onSuccess: () => commentForm.reset(),
            forceFormData: true
        });
    };

    // Time tracking
    const toggleTimer = () => {
        axios.post(route('tasks.timer.toggle', task.id))
             .then(() => window.location.reload());
    };

    const formatTimeTracked = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    // AI Summary trigger
    const fetchAiSummary = () => {
        setIsGeneratingSummary(true);
        axios.post(route('ai.taskSummary'), {
            title: task.title,
            description: task.description
        })
        .then(res => {
            setAiSummary(res.data.result);
            setIsGeneratingSummary(false);
        })
        .catch(() => {
            setAiSummary('Failed to retrieve AI summary.');
            setIsGeneratingSummary(false);
        });
    };

    // Convert to Knowledge form
    const knowledgeForm = useForm({
        title: `Standard Operating Guideline: ${task.title}`,
        description: task.description || '',
        steps: task.checklists ? task.checklists.map(c => `- ${c.item}`).join('\n') : '',
        challenges_faced: '',
        solution: '',
        category: task.department === 'Graphic Design' ? 'Design' : 
                  (task.department === 'Social Media' || task.department === 'Marketing' ? 'Marketing' : 'Development'),
        attachments: []
    });

    const submitConvert = (e) => {
        e.preventDefault();
        knowledgeForm.post(route('tasks.convertKnowledge', task.id), {
            onSuccess: () => setShowConvertModal(false)
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Task Details: ${task.title}`} />

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <Link href={route('tasks.index')}>← Back to Task Board</Link>
            </div>

            <div className="page-header" style={{ marginBottom: '16px' }}>
                <div className="page-title-group">
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Task ID: #{task.id} | Department: {task.department}
                    </span>
                    <h1 style={{ marginTop: '4px' }}>{task.title}</h1>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Convert to Knowledge Button (Highlighting when Completed) */}
                    {task.status === 'Completed' ? (
                        <button 
                            className="btn btn-primary" 
                            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                            onClick={() => setShowConvertModal(true)}
                        >
                            🧠 Convert to Knowledge Base
                        </button>
                    ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', alignSelf: 'center', marginRight: '8px' }}>
                            *Complete task to convert to Knowledge Base article
                        </span>
                    )}

                    <button className="btn btn-secondary" onClick={fetchAiSummary}>
                        🤖 AI Summary
                    </button>
                </div>
            </div>

            {/* AI Summary result block if active */}
            {aiSummary && (
                <div className="card-panel" style={{ backgroundColor: 'var(--primary-light)', borderLeft: '4px solid var(--primary)', position: 'relative' }}>
                    <button 
                        style={{ position: 'absolute', top: '10px', right: '15px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }} 
                        onClick={() => setAiSummary('')}
                    >
                        ✕
                    </button>
                    <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                        {aiSummary}
                    </div>
                </div>
            )}

            {isGeneratingSummary && (
                <div className="card-panel" style={{ textAlign: 'center', padding: '16px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🤖 Generating AI Summary. Please wait...</span>
                </div>
            )}

            <div className="section-grid" style={{ gridTemplateColumns: '2fr 1.2fr' }}>
                
                {/* LEFT COLUMN: Description, Checklist, comments */}
                <div>
                    {/* Description Panel */}
                    <div className="card-panel">
                        <h3 className="panel-title" style={{ marginBottom: '12px' }}>Description</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {task.description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Checklist Panel */}
                    <div className="card-panel">
                        <h3 className="panel-title" style={{ marginBottom: '16px' }}>Subtasks Checklist</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {task.checklists && task.checklists.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={item.is_completed} 
                                            onChange={() => toggleChecklist(item.id)}
                                        />
                                        <span style={{ textDecoration: item.is_completed ? 'line-through' : 'none', color: item.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                            {item.item}
                                        </span>
                                    </label>
                                    <button 
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.9rem' }}
                                        onClick={() => deleteChecklist(item.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                            {(!task.checklists || task.checklists.length === 0) && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No subtask items created.</p>
                            )}
                        </div>

                        {/* Add Checklist Item form */}
                        <form onSubmit={submitChecklist} style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Add new checklist item..." 
                                value={checklistForm.data.item}
                                onChange={e => checklistForm.setData('item', e.target.value)}
                            />
                            <button type="submit" className="btn btn-secondary btn-sm" disabled={checklistForm.processing}>Add</button>
                        </form>
                    </div>

                    {/* Discussions & comments */}
                    <div className="card-panel">
                        <h3 className="panel-title" style={{ marginBottom: '16px' }}>Discussions</h3>
                        
                        {/* comments List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                            {task.comments && task.comments.map(c => (
                                <div key={c.id} style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="user-avatar" style={{ border: 'none', width: '24px', height: '24px', fontSize: '0.7rem' }}>
                                                {c.user.name.charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.user.name}</span>
                                            <span className="user-role-badge" style={{ fontSize: '0.65rem' }}>{c.user.role}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {new Date(c.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'pre-wrap' }}>
                                        {c.comment}
                                    </p>
                                    {c.attachment_path && (
                                        <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                                            📎 <a href={`/storage/${c.attachment_path}`} target="_blank" rel="noopener noreferrer">{c.attachment_path.split('/').pop()}</a>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(!task.comments || task.comments.length === 0) && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>No messages posted. Start the discussion!</p>
                            )}
                        </div>

                        {/* Submit comment Form */}
                        <form onSubmit={submitComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <textarea 
                                className="form-control" 
                                rows="2" 
                                placeholder="Type a comment, ask a question or upload file..." 
                                required
                                value={commentForm.data.comment}
                                onChange={e => commentForm.setData('comment', e.target.value)}
                            ></textarea>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <input 
                                    type="file" 
                                    onChange={e => commentForm.setData('attachment', e.target.files[0])}
                                    style={{ fontSize: '0.8rem' }}
                                />
                                <button type="submit" className="btn btn-primary btn-sm" disabled={commentForm.processing}>Post Comment</button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: Task Attributes, Assignees, Time logs */}
                <div>
                    {/* Status & Transitions panel */}
                    <div className="card-panel">
                        <h3 className="panel-title" style={{ marginBottom: '12px' }}>Task Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem' }}>Current Status:</span>
                                <span className={`badge badge-${task.status.toLowerCase().replace(' ', '')}`}>{task.status}</span>
                            </div>
                            
                            {/* Workflow state selector */}
                            <div style={{ marginTop: '8px' }}>
                                <span className="form-label" style={{ fontSize: '0.8rem' }}>Update Workflow State</span>
                                <select 
                                    className="form-control" 
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Review">Under Review</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Time Tracking panel */}
                    <div className="card-panel">
                        <h3 className="panel-title" style={{ marginBottom: '12px' }}>Time Tracking</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: task.is_time_tracking_active ? 'var(--success)' : 'var(--text-primary)' }}>
                                    ⏱️ {formatTimeTracked(task.time_tracked_seconds)}
                                </span>
                                {task.is_time_tracking_active && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>• Tracking...</span>
                                )}
                            </div>
                            
                            <button 
                                className={`btn ${task.is_time_tracking_active ? 'btn-danger' : 'btn-primary'}`}
                                onClick={toggleTimer}
                                style={{ marginTop: '8px' }}
                            >
                                {task.is_time_tracking_active ? 'Stop Timer' : 'Start Timer'}
                            </button>
                        </div>
                    </div>

                    {/* People Panel */}
                    <div className="card-panel">
                        <h3 className="panel-title" style={{ marginBottom: '12px' }}>Task Ownership</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Created By:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <div className="user-avatar" style={{ border: 'none', width: '24px', height: '24px', fontSize: '0.7rem' }}>
                                        {task.creator.name.charAt(0)}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{task.creator.name}</span>
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Assigned Employees:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                    {task.assignees.map(user => (
                                        <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="user-avatar" style={{ border: 'none', width: '24px', height: '24px', fontSize: '0.7rem' }}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <span style={{ fontSize: '0.85rem' }}>{user.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Activity panel */}
                    <div className="card-panel">
                        <h3 className="panel-title" style={{ marginBottom: '16px' }}>Activity History</h3>
                        <div className="timeline">
                            {task.histories && task.histories.map(h => (
                                <div key={h.id} className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <strong>{h.user.name}</strong> {h.action}
                                    </div>
                                    <div className="timeline-time">
                                        {new Date(h.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================================
               CONVERT TO KNOWLEDGE MODAL
               ================================== */}
            {showConvertModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '700px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Convert Task to Knowledge Base</h2>
                            <button className="modal-close" onClick={() => setShowConvertModal(false)}>×</button>
                        </div>
                        
                        <div style={{ backgroundColor: 'var(--info-light)', padding: '12px', borderLeft: '3px solid var(--info)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            <strong>💡 Most Important Goal</strong>: When you complete a task, you must document how it was done so future employees can easily learn the process. This creates a searchable article in the Confluence-style Knowledge Base.
                        </div>

                        <form onSubmit={submitConvert}>
                            <div className="form-group">
                                <label className="form-label">Article Title</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    value={knowledgeForm.data.title}
                                    onChange={e => knowledgeForm.setData('title', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Objective / Overview</label>
                                <textarea 
                                    className="form-control" 
                                    rows="2" 
                                    required
                                    placeholder="Explain what was accomplished and the purpose..."
                                    value={knowledgeForm.data.description}
                                    onChange={e => knowledgeForm.setData('description', e.target.value)}
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Steps Followed</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    required
                                    placeholder="List the step-by-step instructions that were followed..."
                                    value={knowledgeForm.data.steps}
                                    onChange={e => knowledgeForm.setData('steps', e.target.value)}
                                ></textarea>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Challenges Faced</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="2"
                                        placeholder="What complications did you encounter?"
                                        value={knowledgeForm.data.challenges_faced}
                                        onChange={e => knowledgeForm.setData('challenges_faced', e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Solutions Applied</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="2"
                                        placeholder="How did you solve the challenges?"
                                        value={knowledgeForm.data.solution}
                                        onChange={e => knowledgeForm.setData('solution', e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Knowledge Category</label>
                                <select 
                                    className="form-control"
                                    value={knowledgeForm.data.category}
                                    onChange={e => knowledgeForm.setData('category', e.target.value)}
                                >
                                    <option value="Development">Development</option>
                                    <option value="Design">Design</option>
                                    <option value="Research">Research</option>
                                    <option value="HR">HR</option>
                                    <option value="Accounts">Accounts</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Back Office">Back Office</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowConvertModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={knowledgeForm.processing}>Save Article Draft</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
