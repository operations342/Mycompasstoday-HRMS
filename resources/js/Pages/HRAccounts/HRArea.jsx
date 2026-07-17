import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import axios from 'axios';

export default function HRArea({ directory, designations = [], leaves, reviews, attendance }) {
    const user = usePage().props.auth.user;
    const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'leaves', 'attendance', 'reviews'
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Add/Edit Employee Modal State
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [employeeModalMode, setEmployeeModalMode] = useState('add'); // 'add', 'edit'
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Manage Roles Modal State
    const [showManageRolesModal, setShowManageRolesModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    // Apply Leave Form
    const leaveForm = useForm({
        date_from: '',
        date_to: '',
        details: '',
    });

    const submitLeave = (e) => {
        e.preventDefault();
        leaveForm.post(route('hr.leave'), {
            onSuccess: () => {
                setShowLeaveModal(false);
                leaveForm.reset();
            }
        });
    };

    // Review Form
    const reviewForm = useForm({
        user_id: directory.length > 0 ? directory[0].id : '',
        score: 85,
        details: '',
    });

    const submitReview = (e) => {
        e.preventDefault();
        reviewForm.post(route('hr.review'), {
            onSuccess: () => {
                setShowReviewModal(false);
                reviewForm.reset();
            }
        });
    };

    // Add/Edit Employee Form
    const employeeForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'Employee',
        department: 'Development',
        phone: '',
        designation_id: '',
    });

    const openAddEmployee = () => {
        employeeForm.reset();
        employeeForm.clearErrors();
        setEmployeeModalMode('add');
        setSelectedEmployee(null);
        setShowEmployeeModal(true);
    };

    const openEditEmployee = (emp) => {
        employeeForm.clearErrors();
        setSelectedEmployee(emp);
        setEmployeeModalMode('edit');
        employeeForm.setData({
            name: emp.name,
            email: emp.email,
            password: '', // Blank unless changing
            role: emp.role,
            department: emp.department,
            phone: emp.phone || '',
            designation_id: emp.designation_id || '',
        });
        setShowEmployeeModal(true);
    };

    const submitEmployee = (e) => {
        e.preventDefault();
        if (employeeModalMode === 'add') {
            employeeForm.post(route('hr.users.store'), {
                onSuccess: () => {
                    setShowEmployeeModal(false);
                    employeeForm.reset();
                }
            });
        } else {
            employeeForm.patch(route('hr.users.update', selectedEmployee.id), {
                onSuccess: () => {
                    setShowEmployeeModal(false);
                    employeeForm.reset();
                }
            });
        }
    };

    const removeEmployee = (empId) => {
        if (confirm('Are you sure you want to remove this employee? This will permanently delete their account.')) {
            router.delete(route('hr.users.destroy', empId), {
                onError: (errors) => {
                    alert(errors.error || 'Failed to remove employee.');
                }
            });
        }
    };

    const approveLeave = (recordId, status) => {
        router.post(route('hr.leave.approve', recordId), { status: status });
    };

    const clockInOut = () => {
        router.post(route('hr.clock'));
    };

    const isAdmin = ['Super Admin', 'Admin', 'Manager'].includes(user.role);
    const isSuperOrAdmin = ['Super Admin', 'Admin'].includes(user.role);

    return (
        <AuthenticatedLayout>
            <Head title="HR Portal" />

            <div className="page-header">
                <div className="page-title-group">
                    <h1>HR Module & Employee Hub</h1>
                    <p>Manage leave applications, clock daily attendance, write reviews, and view the employee directory.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={clockInOut}>
                        ⏱️ Clock In / Out
                    </button>
                    {activeTab === 'directory' && isAdmin && (
                        <button className="btn btn-primary" onClick={openAddEmployee}>
                            ➕ Add Employee
                        </button>
                    )}
                    {activeTab === 'leaves' && !isAdmin && (
                        <button className="btn btn-primary" onClick={() => setShowLeaveModal(true)}>
                            🏖️ Apply for Leave
                        </button>
                    )}
                    {activeTab === 'reviews' && isAdmin && (
                        <button className="btn btn-primary" onClick={() => setShowReviewModal(true)}>
                            📝 Write Review
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Switched Header */}
            <div className="view-switcher" style={{ marginBottom: '24px' }}>
                <button 
                    className={`view-btn ${activeTab === 'directory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('directory')}
                >
                    Employee Directory
                </button>
                <button 
                    className={`view-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leaves')}
                >
                    Leave Requests
                </button>
                <button 
                    className={`view-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attendance')}
                >
                    My Attendance Logs
                </button>
                <button 
                    className={`view-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Performance Reviews
                </button>
            </div>

            {/* ==================================
               1. DIRECTORY SUBVIEW
               ================================== */}
            {activeTab === 'directory' && (
                <div className="table-container">
                    <table className="table-view">
                        <thead>
                            <tr>
                                <th>Name / Designation</th>
                                <th>Department</th>
                                <th>Email</th>
                                <th>Phone Number</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {directory.map(emp => (
                                <tr key={emp.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="user-avatar" style={{ border: 'none', width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <span>{emp.designation?.name || 'No System Role'}</span>
                                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>({emp.role})</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{emp.department}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.phone || '-'}</td>
                                    {isAdmin && (
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                    onClick={() => openEditEmployee(emp)}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                {isSuperOrAdmin && emp.id !== user.id && (
                                                    <button 
                                                        className="btn btn-danger btn-sm"
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: 'var(--danger)' }}
                                                        onClick={() => removeEmployee(emp.id)}
                                                    >
                                                        🗑️ Remove
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ==================================
               2. LEAVE REQUESTS SUBVIEW
               ================================== */}
            {activeTab === 'leaves' && (
                <div className="table-container">
                    <table className="table-view">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date Range</th>
                                <th>Reason</th>
                                <th>Status</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map(req => (
                                <tr key={req.id}>
                                    <td><strong>{req.user.name}</strong></td>
                                    <td>
                                        {new Date(req.date_from).toLocaleDateString()} to {new Date(req.date_to).toLocaleDateString()}
                                    </td>
                                    <td style={{ maxWidth: '250px', wordBreak: 'break-word' }}>{req.details}</td>
                                    <td>
                                        <span className={`badge badge-${req.status.toLowerCase().replace(' ', '')}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            {req.status === 'Pending' ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        className="btn btn-primary btn-sm" 
                                                        style={{ backgroundColor: 'var(--success)' }}
                                                        onClick={() => approveLeave(req.id, 'Approved')}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => approveLeave(req.id, 'Rejected')}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Handled</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {leaves.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '32px' }}>
                                        No leave requests submitted.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ==================================
               3. ATTENDANCE SUBVIEW
               ================================== */}
            {activeTab === 'attendance' && (
                <div className="card-panel">
                    <h3 className="panel-title" style={{ marginBottom: '16px' }}>Recent Clock logs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {attendance.map(log => (
                            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <div>
                                    <strong>📅 {new Date(log.date_from).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{log.details}</p>
                                </div>
                                <span className="badge badge-completed" style={{ alignSelf: 'center' }}>{log.status}</span>
                            </div>
                        ))}
                        {attendance.length === 0 && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px' }}>No clock logs recorded. Use the Clock button above to log attendance.</p>
                        )}
                    </div>
                </div>
            )}

            {/* ==================================
               4. PERFORMANCE REVIEWS SUBVIEW
               ================================== */}
            {activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reviews.map(rev => (
                        <div key={rev.id} className="card-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                                <div>
                                    <strong>Review for {rev.user.name}</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                                        Evaluated by {rev.reviewer?.name || 'Manager'}
                                    </span>
                                </div>
                                <span className="badge badge-completed" style={{ fontSize: '0.85rem' }}>
                                    Score: {rev.score} / 100
                                </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                {rev.details}
                            </p>
                        </div>
                    ))}
                    {reviews.length === 0 && (
                        <div className="empty-state">
                            <span className="empty-state-icon">📝</span>
                            <h3>No reviews documented</h3>
                            <p>Managers can submit reviews evaluating employees' progress checklist velocity.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ==================================
               ADD / EDIT EMPLOYEE MODAL
               ================================== */}
            {showEmployeeModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {employeeModalMode === 'add' ? 'Add New Employee' : 'Edit Employee Details'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowEmployeeModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitEmployee}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input 
                                    type="text"
                                    className="form-control"
                                    required
                                    value={employeeForm.data.name}
                                    onChange={e => employeeForm.setData('name', e.target.value)}
                                />
                                {employeeForm.errors.name && <span className="text-red-600">{employeeForm.errors.name}</span>}
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input 
                                        type="email"
                                        className="form-control"
                                        required
                                        value={employeeForm.data.email}
                                        onChange={e => employeeForm.setData('email', e.target.value)}
                                    />
                                    {employeeForm.errors.email && <span className="text-red-600">{employeeForm.errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input 
                                        type="text"
                                        className="form-control"
                                        value={employeeForm.data.phone}
                                        onChange={e => employeeForm.setData('phone', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label className="form-label" style={{ marginBottom: 0 }}>System Role (Designation)</label>
                                        {isAdmin && (
                                            <button 
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                onClick={() => setShowManageRolesModal(true)}
                                            >
                                                ⚙️ Manage Roles
                                            </button>
                                        )}
                                    </div>
                                    <select 
                                        className="form-control"
                                        value={employeeForm.data.designation_id}
                                        onChange={e => employeeForm.setData('designation_id', e.target.value)}
                                    >
                                        <option value="">Select System Role</option>
                                        {designations.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                    {employeeForm.errors.designation_id && <span className="text-red-600">{employeeForm.errors.designation_id}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select 
                                        className="form-control"
                                        value={employeeForm.data.department}
                                        onChange={e => employeeForm.setData('department', e.target.value)}
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
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Access Permissions (Access Level)</label>
                                    <select 
                                        className="form-control"
                                        value={employeeForm.data.role}
                                        onChange={e => employeeForm.setData('role', e.target.value)}
                                    >
                                        <option value="Super Admin">Super Admin</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Team Lead">Team Lead</option>
                                        <option value="Employee">Employee</option>
                                        <option value="Read Only User">Read Only User</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        {employeeModalMode === 'add' ? 'Account Password' : 'Change Password (leave blank)'}
                                    </label>
                                    <input 
                                        type="password"
                                        className="form-control"
                                        required={employeeModalMode === 'add'}
                                        placeholder={employeeModalMode === 'edit' ? '••••••••' : ''}
                                        value={employeeForm.data.password}
                                        onChange={e => employeeForm.setData('password', e.target.value)}
                                    />
                                    {employeeForm.errors.password && <span className="text-red-600">{employeeForm.errors.password}</span>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEmployeeModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={employeeForm.processing}>
                                    {employeeModalMode === 'add' ? 'Save Employee' : 'Update Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================================
               MANAGE SYSTEM ROLES MODAL
               ================================== */}
            {showManageRolesModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Manage System Roles</h2>
                            <button className="modal-close" onClick={() => setShowManageRolesModal(false)}>×</button>
                        </div>
                        <div style={{ padding: '10px 0' }}>
                            {/* Create Role Form */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <input 
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Senior Developer"
                                    value={newRoleName}
                                    onChange={e => setNewRoleName(e.target.value)}
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        if (!newRoleName.trim()) return;
                                        router.post(route('hr.designations.store'), { name: newRoleName }, {
                                            onSuccess: () => {
                                                setNewRoleName('');
                                            },
                                            onError: (err) => {
                                                alert(err.name || 'Failed to add role.');
                                            }
                                        });
                                    }}
                                >
                                    Add
                                </button>
                            </div>

                            {/* List of Roles */}
                            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}>
                                {designations.map(role => (
                                    <div key={role.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', borderBottom: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{role.name}</span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button 
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                onClick={() => {
                                                    const newName = prompt('Enter new role name:', role.name);
                                                    if (newName && newName.trim() && newName !== role.name) {
                                                        router.patch(route('hr.designations.update', role.id), { name: newName });
                                                    }
                                                }}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button 
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                style={{ padding: '2px 6px', fontSize: '0.7rem', backgroundColor: 'var(--danger)' }}
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to delete "${role.name}"? Users currently assigned to this role will be set to unassigned.`)) {
                                                        router.delete(route('hr.designations.destroy', role.id));
                                                    }
                                                }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {designations.length === 0 && (
                                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No custom roles defined.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================
               APPLY LEAVE MODAL
               ================================== */}
            {showLeaveModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Apply for Leave</h2>
                            <button className="modal-close" onClick={() => setShowLeaveModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitLeave}>
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Date From</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        required 
                                        value={leaveForm.data.date_from}
                                        onChange={e => leaveForm.setData('date_from', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date To</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        required 
                                        value={leaveForm.data.date_to}
                                        onChange={e => leaveForm.setData('date_to', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Reason / Detail description</label>
                                <textarea 
                                    className="form-control" 
                                    rows="4" 
                                    required
                                    value={leaveForm.data.details}
                                    onChange={e => leaveForm.setData('details', e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={leaveForm.processing}>Submit Application</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================================
               WRITE REVIEW MODAL
               ================================== */}
            {showReviewModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Write Performance Appraisal</h2>
                            <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitReview}>
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Select Employee</label>
                                    <select 
                                        className="form-control"
                                        value={reviewForm.data.user_id}
                                        onChange={e => reviewForm.setData('user_id', e.target.value)}
                                    >
                                        {directory.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Score (1-100)</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        required
                                        min="1" 
                                        max="100"
                                        value={reviewForm.data.score}
                                        onChange={e => reviewForm.setData('score', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Evaluation Details / Notes</label>
                                <textarea 
                                    className="form-control" 
                                    rows="5" 
                                    required
                                    placeholder="Provide detailed feedback on key achievements..."
                                    value={reviewForm.data.details}
                                    onChange={e => reviewForm.setData('details', e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={reviewForm.processing}>Save Review</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
