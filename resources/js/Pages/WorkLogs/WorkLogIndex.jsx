import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function WorkLogIndex({ logs, managers }) {
    const user = usePage().props.auth.user;
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [isOptimizingReport, setIsOptimizingReport] = useState(false);

    // Submission Form State
    const { data, setData, post, processing, errors, reset } = useForm({
        log_date: new Date().toISOString().substring(0, 10),
        working_hours: 8.0,
        today_work: '',
        completed_tasks: '',
        pending_tasks: '',
        issues_faced: '',
        tomorrow_plan: '',
        manager_id: managers.length > 0 ? managers[0].id : '',
    });

    const submitLog = (e) => {
        e.preventDefault();
        post(route('logs.store'), {
            onSuccess: () => {
                setShowSubmitForm(false);
                reset();
            }
        });
    };

    // AI Daily Report Generator
    const triggerAiReport = () => {
        if (!data.today_work.trim()) {
            alert("Please type a quick outline of what you did in 'Today's Work' so the AI can format it!");
            return;
        }
        setIsOptimizingReport(true);
        axios.post(route('ai.dailyReport'), { work_done: data.today_work })
            .then(res => {
                setData('today_work', res.data.result);
                setIsOptimizingReport(false);
            })
            .catch(() => {
                alert('Failed to connect to AI Optimizer.');
                setIsOptimizingReport(false);
            });
    };

    // Manager remarks form
    const [remarksInput, setRemarksInput] = useState({});
    const submitRemarks = (logId) => {
        const text = remarksInput[logId];
        if (!text || !text.trim()) return;

        axios.post(route('logs.remarks', logId), { manager_remarks: text })
             .then(() => window.location.reload());
    };

    const isManager = ['Super Admin', 'Admin', 'Manager', 'Team Lead'].includes(user.role);

    return (
        <AuthenticatedLayout>
            <Head title="Daily Work Logs" />

            <div className="page-header">
                <div className="page-title-group">
                    <h1>Daily Work Logs</h1>
                    <p>Every employee must record daily work summaries, hours, and obstacles faced to maintain alignment.</p>
                </div>
                {!isManager && (
                    <button className="btn btn-primary" onClick={() => setShowSubmitForm(!showSubmitForm)}>
                        {showSubmitForm ? 'Hide Form' : '➕ Log Today\'s Work'}
                    </button>
                )}
            </div>

            {/* ==================================
               SUBMIT LOG FORM (For employees)
               ================================== */}
            {(showSubmitForm || isManager === false) && !isManager && (
                <div className="card-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div className="panel-header">
                        <h3 className="panel-title">Submit Daily Work Record</h3>
                        <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={triggerAiReport}
                            disabled={isOptimizingReport}
                        >
                            {isOptimizingReport ? 'Optimizing...' : '🤖 AI Report Generator'}
                        </button>
                    </div>

                    <form onSubmit={submitLog}>
                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    required
                                    value={data.log_date}
                                    onChange={e => setData('log_date', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Working Hours logged</label>
                                <input 
                                    type="number" 
                                    step="0.25" 
                                    className="form-control" 
                                    required
                                    min="0.5" 
                                    max="24"
                                    value={data.working_hours}
                                    onChange={e => setData('working_hours', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Today's Work Summary</label>
                            <textarea 
                                className="form-control" 
                                rows="3" 
                                required
                                placeholder="Explain what tasks you worked on and what was completed..."
                                value={data.today_work}
                                onChange={e => setData('today_work', e.target.value)}
                            ></textarea>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                Tip: Write a brief note, then click the **AI Report Generator** button above to structure it instantly!
                            </span>
                        </div>

                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">Completed Tasks (IDs / Titles)</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={data.completed_tasks}
                                    onChange={e => setData('completed_tasks', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Pending / Unfinished Tasks</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={data.pending_tasks}
                                    onChange={e => setData('pending_tasks', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">Issues / Blockers Faced</label>
                                <textarea 
                                    className="form-control" 
                                    rows="2"
                                    value={data.issues_faced}
                                    onChange={e => setData('issues_faced', e.target.value)}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tomorrow's Plan</label>
                                <textarea 
                                    className="form-control" 
                                    rows="2"
                                    value={data.tomorrow_plan}
                                    onChange={e => setData('tomorrow_plan', e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Assign Report Reviewer</label>
                            <select 
                                className="form-control"
                                value={data.manager_id}
                                onChange={e => setData('manager_id', e.target.value)}
                            >
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={processing}>Submit Record</button>
                    </form>
                </div>
            )}

            {/* ==================================
               WORK LOGS LISTING
               ================================== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {logs.map(log => (
                    <div key={log.id} className="card-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="user-avatar" style={{ border: 'none', width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                    {log.user.name.charAt(0)}
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.user.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '6px' }}>({log.user.department})</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                    📅 {new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                                    ⏱️ {log.working_hours} hours logged
                                </div>
                            </div>
                        </div>

                        <div className="form-row-2">
                            <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Today's Work Summary:</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                    {log.today_work}
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {log.completed_tasks && (
                                    <div style={{ fontSize: '0.8rem' }}>
                                        <strong>✅ Completed:</strong> {log.completed_tasks}
                                    </div>
                                )}
                                {log.pending_tasks && (
                                    <div style={{ fontSize: '0.8rem' }}>
                                        <strong>⏳ Pending:</strong> {log.pending_tasks}
                                    </div>
                                )}
                                {log.issues_faced && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                                        <strong>⚠️ Issues Faced:</strong> {log.issues_faced}
                                    </div>
                                )}
                                {log.tomorrow_plan && (
                                    <div style={{ fontSize: '0.8rem' }}>
                                        <strong>📅 Tomorrow's Plan:</strong> {log.tomorrow_plan}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manager Remarks Display / Input */}
                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {log.manager_remarks ? (
                                <div style={{ backgroundColor: 'var(--warning-light)', borderLeft: '3px solid var(--warning)', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    <strong>Manager Remarks ({log.manager?.name}):</strong> {log.manager_remarks}
                                </div>
                            ) : (
                                isManager && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Write manager evaluation/remarks..." 
                                            className="form-control" 
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                            value={remarksInput[log.id] || ''}
                                            onChange={(e) => setRemarksInput({ ...remarksInput, [log.id]: e.target.value })}
                                        />
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => submitRemarks(log.id)}
                                        >
                                            Save Remarks
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-state-icon">✍️</span>
                        <h3>No logs submitted yet</h3>
                        <p>Submit your first daily log to record your work hours and project details.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
