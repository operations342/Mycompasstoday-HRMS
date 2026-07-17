import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';

export default function BugIndex({ bugs, developers }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isGeneratingBug, setIsGeneratingBug] = useState(false);

    // Create Bug Form
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        priority: 'Medium',
        severity: 'Medium',
        environment: 'Staging',
        developer_id: '',
        expected_result: '',
        actual_result: '',
    });

    const submitCreateBug = (e) => {
        e.preventDefault();
        post(route('bugs.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            }
        });
    };

    // AI Description generator
    const triggerAiBug = () => {
        if (!data.title.trim()) {
            alert('Please enter a Bug Title first!');
            return;
        }
        setIsGeneratingBug(true);
        axios.post(route('ai.bugDescription'), { title: data.title })
            .then(res => {
                setData('description', res.data.result);
                setIsGeneratingBug(false);
            })
            .catch(() => {
                alert('Failed to connect to AI generator.');
                setIsGeneratingBug(false);
            });
    };

    // Handle ticket update (Developer / Status)
    const updateTicket = (bugId, developerId, status, resolution = null) => {
        axios.patch(route('bugs.update', bugId), {
            developer_id: developerId,
            status: status,
            resolution: resolution
        })
        .then(() => window.location.reload());
    };

    return (
        <AuthenticatedLayout>
            <Head title="Bug Tracker" />

            <div className="page-header">
                <div className="page-title-group">
                    <h1>MWMS Bug Tracker</h1>
                    <p>Track site issues, environment details, and developers assigned to resolve software flaws.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <span>🐛</span> Report Bug
                </button>
            </div>

            <div className="table-container">
                <table className="table-view">
                    <thead>
                        <tr>
                            <th>Bug Details</th>
                            <th>Priority / Severity</th>
                            <th>Environment</th>
                            <th>Assigned Developer</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bugs.map(bug => (
                            <tr key={bug.id}>
                                <td style={{ maxWidth: '300px' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bug.title}</div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {bug.description.substring(0, 100)}...
                                    </p>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                        Reported by {bug.reporter.name}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
                                            P: {bug.priority}
                                        </span>
                                        <span className="badge" style={{ 
                                            backgroundColor: bug.severity === 'Blocker' ? 'var(--danger-light)' : 'var(--bg-tertiary)',
                                            color: bug.severity === 'Blocker' ? 'var(--danger)' : 'var(--text-secondary)',
                                            fontSize: '0.65rem'
                                        }}>
                                            S: {bug.severity}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>💻 {bug.environment}</span>
                                </td>
                                <td>
                                    <select 
                                        className="form-control" 
                                        style={{ padding: '4px', fontSize: '0.8rem', width: '150px' }}
                                        value={bug.developer_id || ''}
                                        onChange={(e) => updateTicket(bug.id, e.target.value, bug.status)}
                                    >
                                        <option value="">Unassigned</option>
                                        {developers.map(dev => (
                                            <option key={dev.id} value={dev.id}>{dev.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <span className={`badge badge-${bug.status.toLowerCase().replace(' ', '')}`}>
                                        {bug.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {bug.status !== 'Closed' && (
                                            <select 
                                                className="form-control"
                                                style={{ padding: '2px', fontSize: '0.75rem', width: '100px' }}
                                                value={bug.status}
                                                onChange={(e) => updateTicket(bug.id, bug.developer_id, e.target.value)}
                                            >
                                                <option value="Open">Open</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        )}
                                        {bug.status === 'Resolved' && (
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    const res = prompt('Enter resolution notes:');
                                                    if (res) updateTicket(bug.id, bug.developer_id, 'Closed', res);
                                                }}
                                            >
                                                Close Ticket
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {bugs.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                                    No bugs reported. System healthy!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ==================================
               REPORT BUG MODAL
               ================================== */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Report Bug Ticket</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitCreateBug}>
                            <div className="form-group">
                                <label className="form-label">Bug Title</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    placeholder="e.g. 419 Page expired on log submit"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                />
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Environment</label>
                                    <select 
                                        className="form-control"
                                        value={data.environment}
                                        onChange={e => setData('environment', e.target.value)}
                                    >
                                        <option value="Local">Local</option>
                                        <option value="Staging">Staging</option>
                                        <option value="Production">Production</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        style={{ width: '100%', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                        onClick={triggerAiBug}
                                        disabled={isGeneratingBug}
                                    >
                                        {isGeneratingBug ? 'Generating...' : '🤖 AI Bug Description'}
                                    </button>
                                </div>
                            </div>

                            <div className="form-row-2">
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
                                <div className="form-group">
                                    <label className="form-label">Severity</label>
                                    <select 
                                        className="form-control"
                                        value={data.severity}
                                        onChange={e => setData('severity', e.target.value)}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Blocker">Blocker</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bug Description & Repro Steps</label>
                                <textarea 
                                    className="form-control" 
                                    rows="5" 
                                    required
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                ></textarea>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Expected Result</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={data.expected_result}
                                        onChange={e => setData('expected_result', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Actual Result</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={data.actual_result}
                                        onChange={e => setData('actual_result', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={processing}>File Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
