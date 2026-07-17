import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function SopIndex({ sops, filters }) {
    const user = usePage().props.auth.user;
    const [deptFilter, setDeptFilter] = useState(filters.department || 'All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // AI Generating status
    const [isGeneratingSop, setIsGeneratingSop] = useState(false);

    // Create SOP Form
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        department: 'Development',
        instructions: ''
    });

    const submitCreateSop = (e) => {
        e.preventDefault();
        post(route('sop.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            }
        });
    };

    const handleFilterChange = (val) => {
        setDeptFilter(val);
        window.location.href = route('sop.index', { department: val });
    };

    const updateApprovalStatus = (sopId, status) => {
        axios.post(route('sop.approve', sopId), { approval_status: status })
             .then(() => window.location.reload());
    };

    // AI Generate SOP handler
    const triggerAiSop = () => {
        if (!data.title.trim()) {
            alert('Please enter an SOP Title first so the AI knows what to write!');
            return;
        }
        setIsGeneratingSop(true);
        axios.post(route('ai.sopGenerator'), {
            title: data.title,
            department: data.department
        })
        .then(res => {
            setData('instructions', res.data.result);
            setIsGeneratingSop(false);
        })
        .catch(() => {
            alert('Failed to connect to AI generator.');
            setIsGeneratingSop(false);
        });
    };

    const departments = ['All', 'Development', 'Graphic Design', 'Research', 'Back Office', 'HR', 'Accounts', 'Social Media', 'Marketing'];

    return (
        <AuthenticatedLayout>
            <Head title="SOP Procedures" />

            <div className="page-header">
                <div className="page-title-group">
                    <h1>Standard Operating Procedures (SOP)</h1>
                    <p>Formalize company workflows and quality benchmarks across all divisions.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <span>➕</span> Create SOP
                </button>
            </div>

            {/* Department Filter Card */}
            <div className="card-panel" style={{ padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Select Department:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {departments.map(d => (
                            <button
                                key={d}
                                onClick={() => handleFilterChange(d)}
                                className="btn btn-sm"
                                style={{ 
                                    backgroundColor: deptFilter === d ? 'var(--primary)' : 'var(--bg-tertiary)',
                                    color: deptFilter === d ? '#fff' : 'var(--text-secondary)',
                                    borderRadius: '20px',
                                    border: 'none',
                                    padding: '6px 14px'
                                }}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* SOP Cards Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {sops.map(sop => (
                    <div key={sop.id} className="card-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className="card-tag" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                                        {sop.department}
                                    </span>
                                    <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>v{sop.version}.0</span>
                                    {sop.approval_status !== 'Approved' && (
                                        <span className={`badge badge-${sop.approval_status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                                            {sop.approval_status} Review
                                        </span>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>
                                    {sop.title}
                                </h3>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                    Authored by <strong>{sop.author.name}</strong> • Approved by {sop.approver ? sop.approver.name : 'Pending review'}
                                </div>
                            </div>

                            {/* Approver controls */}
                            {in_array(user.role, ['Super Admin', 'Admin', 'Manager']) && sop.approval_status === 'Pending' && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                        className="btn btn-primary btn-sm" 
                                        style={{ backgroundColor: 'var(--success)' }}
                                        onClick={() => updateApprovalStatus(sop.id, 'Approved')}
                                    >
                                        Approve SOP
                                    </button>
                                    <button 
                                        className="btn btn-danger btn-sm"
                                        onClick={() => updateApprovalStatus(sop.id, 'Rejected')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SOP Step by step rendering */}
                        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Procedure Instructions:</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                {sop.instructions}
                            </p>
                        </div>
                    </div>
                ))}

                {sops.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-state-icon">📜</span>
                        <h3>No SOP procedures documented</h3>
                        <p>Formalize your workflows today by drafting a Standard Operating Procedure.</p>
                    </div>
                )}
            </div>

            {/* ==================================
               CREATE SOP MODAL (With AI Generator!)
               ================================== */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '650px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Standard Operating Procedure</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitCreateSop}>
                            <div className="form-group">
                                <label className="form-label">SOP Title</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    placeholder="e.g. Employee Leave Application Flow"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                />
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Department Scope</label>
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
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        style={{ width: '100%', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                        onClick={triggerAiSop}
                                        disabled={isGeneratingSop}
                                    >
                                        {isGeneratingSop ? '🤖 Scaffolding...' : '🤖 AI SOP Generator'}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Step-by-Step Instructions</label>
                                <textarea 
                                    className="form-control" 
                                    rows="6" 
                                    required
                                    placeholder="List the procedural steps clearly..."
                                    value={data.instructions}
                                    onChange={e => setData('instructions', e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={processing}>Save Procedure</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

// In_array helper
function in_array(needle, haystack) {
    return haystack.indexOf(needle) !== -1;
}
