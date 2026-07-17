import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

export default function SubscriptionIndex({ subscriptions, filters }) {
    // Search and Status filters state
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'All');

    // Modals visibility state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Selected subscription for details/edit/renewal/history
    const [selectedSubscription, setSelectedSubscription] = useState(null);

    // Add Form Formhook
    const addForm = useForm({
        name: '',
        plan: '',
        type: 'Yearly',
        amount: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        users_count: '',
        notes: '',
        status: 'Active'
    });

    // Edit Form Formhook
    const editForm = useForm({
        name: '',
        plan: '',
        type: '',
        amount: '',
        start_date: '',
        end_date: '',
        users_count: '',
        notes: '',
        status: ''
    });

    // Renew Form Formhook
    const renewForm = useForm({
        plan: '',
        type: 'Yearly',
        amount: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        users_count: '',
        notes: ''
    });

    // Handle search filter submissions
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            router.get(route('subscriptions.index'), {
                search: search,
                status: statusFilter
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    // Handle status tab changes
    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        router.get(route('subscriptions.index'), {
            search: search,
            status: status
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Auto-calculate end_date helper
    const calculateEndDate = (startDateStr, type) => {
        if (!startDateStr) return '';
        const startDate = new Date(startDateStr);
        if (isNaN(startDate.getTime())) return '';

        switch (type) {
            case 'Monthly':
                startDate.setMonth(startDate.getMonth() + 1);
                break;
            case 'Quarterly':
                startDate.setMonth(startDate.getMonth() + 3);
                break;
            case 'Half-Yearly':
                startDate.setMonth(startDate.getMonth() + 6);
                break;
            case 'Yearly':
                startDate.setFullYear(startDate.getFullYear() + 1);
                break;
            default:
                // For custom, do not autocalculate
                return '';
        }
        return startDate.toISOString().split('T')[0];
    };

    // Auto-calculate end_date on Add form changes
    useEffect(() => {
        if (addForm.type !== 'Custom') {
            const calculated = calculateEndDate(addForm.start_date, addForm.type);
            if (calculated) addForm.setData('end_date', calculated);
        }
    }, [addForm.start_date, addForm.type]);

    // Auto-calculate end_date on Edit form changes
    useEffect(() => {
        if (editForm.type !== 'Custom') {
            const calculated = calculateEndDate(editForm.start_date, editForm.type);
            if (calculated) editForm.setData('end_date', calculated);
        }
    }, [editForm.start_date, editForm.type]);

    // Auto-calculate end_date on Renew form changes
    useEffect(() => {
        if (renewForm.type !== 'Custom') {
            const calculated = calculateEndDate(renewForm.start_date, renewForm.type);
            if (calculated) renewForm.setData('end_date', calculated);
        }
    }, [renewForm.start_date, renewForm.type]);

    // Trigger edit modal
    const openEditModal = (sub) => {
        setSelectedSubscription(sub);
        editForm.setData({
            name: sub.name,
            plan: sub.plan,
            type: sub.type,
            amount: sub.amount,
            start_date: sub.start_date,
            end_date: sub.end_date,
            users_count: sub.users_count || '',
            notes: sub.notes || '',
            status: sub.status
        });
        setIsEditModalOpen(true);
    };

    // Trigger renewal modal
    const openRenewModal = (sub) => {
        setSelectedSubscription(sub);
        renewForm.setData({
            plan: sub.plan,
            type: sub.type,
            amount: sub.amount,
            start_date: new Date().toISOString().split('T')[0],
            end_date: calculateEndDate(new Date().toISOString().split('T')[0], sub.type),
            users_count: sub.users_count || '',
            notes: `Renewed from plan: ${sub.plan} (${sub.type})`
        });
        setIsRenewModalOpen(true);
    };

    // Submit actions
    const handleAddSubmit = (e) => {
        e.preventDefault();
        addForm.post(route('subscriptions.store'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                addForm.reset();
            }
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.patch(route('subscriptions.update', selectedSubscription.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
            }
        });
    };

    const handleRenewSubmit = (e) => {
        e.preventDefault();
        renewForm.post(route('subscriptions.renew', selectedSubscription.id), {
            onSuccess: () => {
                setIsRenewModalOpen(false);
            }
        });
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this subscription?")) {
            router.delete(route('subscriptions.destroy', id));
        }
    };

    // Export list to CSV helper
    const handleExportCSV = () => {
        const headers = ["Sr. No.", "Organization/School Name", "Subscription Plan", "Start Date", "End Date", "Duration", "Amount", "Status", "Days Left"];
        const rows = subscriptions.map((sub, index) => [
            index + 1,
            `"${sub.name.replace(/"/g, '""')}"`,
            sub.plan,
            sub.start_date,
            sub.end_date,
            sub.type,
            sub.amount,
            sub.status,
            sub.days_left
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Subscriptions_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Color coding helper based on days_left and status
    const getStatusColorDetails = (sub) => {
        if (sub.status === 'Cancelled') {
            return { color: 'var(--text-secondary)', badgeClass: 'badge-secondary', text: 'Cancelled', dot: '⚫' };
        }
        
        const days = sub.days_left;
        if (days <= 0) {
            return { color: '#ef4444', badgeClass: 'badge-danger', text: 'Expired', dot: '⚫' };
        } else if (days <= 2) {
            return { color: '#ef4444', badgeClass: 'badge-danger', text: 'Expiring Today/Tomorrow', dot: '🔴' };
        } else if (days <= 7) {
            return { color: '#f97316', badgeClass: 'badge-warning', text: 'Expiring in 7 Days', dot: '🟠' };
        } else if (days <= 30) {
            return { color: '#eab308', badgeClass: 'badge-warning', text: 'Expiring in 30 Days', dot: '🟡' };
        } else {
            return { color: '#10b981', badgeClass: 'badge-success', text: 'Active', dot: '🟢' };
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Subscription Management" />

            <div className="subscriptions-page-container">
                {/* Header group */}
                <div className="page-header">
                    <div className="page-title-group">
                        <h1>Subscription Management</h1>
                        <p>Track school renewals, status metrics, and license history.</p>
                    </div>
                    <div className="top-buttons" style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleExportCSV} className="btn btn-secondary">
                            📥 Export List (CSV)
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
                            ➕ Add Subscription
                        </button>
                    </div>
                </div>

                {/* Filter and Search Bar Row */}
                <div className="filters-search-row">
                    {/* Status Tabs */}
                    <div className="tabs-container">
                        {['All', 'Active', 'Expiring Soon', 'Expired', 'Cancelled'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleStatusFilterChange(tab)}
                                className={`tab-item ${statusFilter === tab ? 'active' : ''}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="search-box-wrapper">
                        <input
                            type="text"
                            placeholder="Search by school, plan, or date..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                            style={{ maxWidth: '300px' }}
                        />
                    </div>
                </div>

                {/* Subscription List Table */}
                <div className="card-panel" style={{ padding: '0px', overflowX: 'auto' }}>
                    <table className="mwms-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>Sr. No.</th>
                                <th>Organization / School Name</th>
                                <th>Subscription Plan</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Duration</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Days Left</th>
                                <th style={{ textAlign: 'right', width: '220px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.length > 0 ? (
                                subscriptions.map((sub, index) => {
                                    const { dot, badgeClass } = getStatusColorDetails(sub);
                                    return (
                                        <tr key={sub.id}>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{sub.name}</td>
                                            <td><span className="badge-tag">{sub.plan}</span></td>
                                            <td>{sub.start_date}</td>
                                            <td>{sub.end_date}</td>
                                            <td>{sub.type}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{parseFloat(sub.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`status-badge ${badgeClass}`}>
                                                    <span style={{ marginRight: '6px' }}>{dot}</span>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                                {sub.status === 'Cancelled' ? (
                                                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                                ) : sub.days_left <= 0 ? (
                                                    <span style={{ color: 'var(--danger)' }}>Expired ({Math.abs(sub.days_left)}d ago)</span>
                                                ) : (
                                                    <span>{sub.days_left} days</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button 
                                                        onClick={() => { setSelectedSubscription(sub); setIsViewModalOpen(true); }}
                                                        className="btn btn-secondary btn-sm"
                                                        title="View Details"
                                                    >
                                                        👁
                                                    </button>
                                                    <button 
                                                        onClick={() => openEditModal(sub)}
                                                        className="btn btn-secondary btn-sm"
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        onClick={() => openRenewModal(sub)}
                                                        className="btn btn-success btn-sm"
                                                        title="Renew"
                                                    >
                                                        🔄 Renew
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedSubscription(sub); setIsHistoryModalOpen(true); }}
                                                        className="btn btn-secondary btn-sm"
                                                        title="View History"
                                                    >
                                                        📄
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(sub.id)}
                                                        className="btn btn-danger btn-sm"
                                                        title="Delete"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                        No subscription records found.
                                    </td>
                                end</tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==========================================
                ADD SUBSCRIPTION MODAL
                ========================================== */}
            {isAddModalOpen && (
                <div className="mwms-modal-backdrop">
                    <div className="mwms-modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Add Subscription</h3>
                            <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Organization/School Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={addForm.data.name} 
                                        onChange={e => addForm.setData('name', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {addForm.errors.name && <div className="form-error">{addForm.errors.name}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Subscription Plan *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. Basic, Premium, Gold"
                                        value={addForm.data.plan} 
                                        onChange={e => addForm.setData('plan', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {addForm.errors.plan && <div className="form-error">{addForm.errors.plan}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Subscription Type *</label>
                                    <select 
                                        value={addForm.data.type} 
                                        onChange={e => addForm.setData('type', e.target.value)} 
                                        className="form-input"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Half-Yearly">Half-Yearly</option>
                                        <option value="Yearly">Yearly</option>
                                        <option value="Custom">Custom (Manual Dates)</option>
                                    </select>
                                    {addForm.errors.type && <div className="form-error">{addForm.errors.type}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Amount (INR) *</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required 
                                        value={addForm.data.amount} 
                                        onChange={e => addForm.setData('amount', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {addForm.errors.amount && <div className="form-error">{addForm.errors.amount}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Number of Users (Optional)</label>
                                    <input 
                                        type="number" 
                                        value={addForm.data.users_count} 
                                        onChange={e => addForm.setData('users_count', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {addForm.errors.users_count && <div className="form-error">{addForm.errors.users_count}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Start Date *</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={addForm.data.start_date} 
                                        onChange={e => addForm.setData('start_date', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {addForm.errors.start_date && <div className="form-error">{addForm.errors.start_date}</div>}
                                </div>

                                <div>
                                    <label className="form-label">End Date *</label>
                                    <input 
                                        type="date" 
                                        required 
                                        readOnly={addForm.data.type !== 'Custom'}
                                        style={{ backgroundColor: addForm.data.type !== 'Custom' ? 'var(--bg-secondary)' : 'inherit' }}
                                        value={addForm.data.end_date} 
                                        onChange={e => addForm.setData('end_date', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {addForm.errors.end_date && <div className="form-error">{addForm.errors.end_date}</div>}
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Status *</label>
                                    <select 
                                        value={addForm.data.status} 
                                        onChange={e => addForm.setData('status', e.target.value)} 
                                        className="form-input"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Expiring Soon">Expiring Soon</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                    {addForm.errors.status && <div className="form-error">{addForm.errors.status}</div>}
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Notes</label>
                                    <textarea 
                                        value={addForm.data.notes} 
                                        onChange={e => addForm.setData('notes', e.target.value)} 
                                        className="form-input" 
                                        rows="3"
                                    />
                                    {addForm.errors.notes && <div className="form-error">{addForm.errors.notes}</div>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={addForm.processing}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================
                EDIT SUBSCRIPTION MODAL
                ========================================== */}
            {isEditModalOpen && (
                <div className="mwms-modal-backdrop">
                    <div className="mwms-modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Edit Subscription</h3>
                            <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Organization/School Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={editForm.data.name} 
                                        onChange={e => editForm.setData('name', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {editForm.errors.name && <div className="form-error">{editForm.errors.name}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Subscription Plan *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={editForm.data.plan} 
                                        onChange={e => editForm.setData('plan', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {editForm.errors.plan && <div className="form-error">{editForm.errors.plan}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Subscription Type *</label>
                                    <select 
                                        value={editForm.data.type} 
                                        onChange={e => editForm.setData('type', e.target.value)} 
                                        className="form-input"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Half-Yearly">Half-Yearly</option>
                                        <option value="Yearly">Yearly</option>
                                        <option value="Custom">Custom (Manual Dates)</option>
                                    </select>
                                    {editForm.errors.type && <div className="form-error">{editForm.errors.type}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Amount (INR) *</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required 
                                        value={editForm.data.amount} 
                                        onChange={e => editForm.setData('amount', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {editForm.errors.amount && <div className="form-error">{editForm.errors.amount}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Number of Users (Optional)</label>
                                    <input 
                                        type="number" 
                                        value={editForm.data.users_count} 
                                        onChange={e => editForm.setData('users_count', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {editForm.errors.users_count && <div className="form-error">{editForm.errors.users_count}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Start Date *</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={editForm.data.start_date} 
                                        onChange={e => editForm.setData('start_date', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {editForm.errors.start_date && <div className="form-error">{editForm.errors.start_date}</div>}
                                </div>

                                <div>
                                    <label className="form-label">End Date *</label>
                                    <input 
                                        type="date" 
                                        required 
                                        readOnly={editForm.data.type !== 'Custom'}
                                        style={{ backgroundColor: editForm.data.type !== 'Custom' ? 'var(--bg-secondary)' : 'inherit' }}
                                        value={editForm.data.end_date} 
                                        onChange={e => editForm.setData('end_date', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {editForm.errors.end_date && <div className="form-error">{editForm.errors.end_date}</div>}
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Status *</label>
                                    <select 
                                        value={editForm.data.status} 
                                        onChange={e => editForm.setData('status', e.target.value)} 
                                        className="form-input"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Expiring Soon">Expiring Soon</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                    {editForm.errors.status && <div className="form-error">{editForm.errors.status}</div>}
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Notes</label>
                                    <textarea 
                                        value={editForm.data.notes} 
                                        onChange={e => editForm.setData('notes', e.target.value)} 
                                        className="form-input" 
                                        rows="3"
                                    />
                                    {editForm.errors.notes && <div className="form-error">{editForm.errors.notes}</div>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={editForm.processing}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================
                RENEW SUBSCRIPTION MODAL
                ========================================== */}
            {isRenewModalOpen && (
                <div className="mwms-modal-backdrop">
                    <div className="mwms-modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Renew Subscription: {selectedSubscription?.name}</h3>
                            <button className="close-btn" onClick={() => setIsRenewModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleRenewSubmit}>
                            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        Renewing this subscription will archive the current dates and details under the History tab and update this subscription with the new values.
                                    </p>
                                </div>

                                <div>
                                    <label className="form-label">Renewal Plan *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={renewForm.data.plan} 
                                        onChange={e => renewForm.setData('plan', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {renewForm.errors.plan && <div className="form-error">{renewForm.errors.plan}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Renewal Type *</label>
                                    <select 
                                        value={renewForm.data.type} 
                                        onChange={e => renewForm.setData('type', e.target.value)} 
                                        className="form-input"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Half-Yearly">Half-Yearly</option>
                                        <option value="Yearly">Yearly</option>
                                        <option value="Custom">Custom (Manual Dates)</option>
                                    </select>
                                    {renewForm.errors.type && <div className="form-error">{renewForm.errors.type}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Amount (INR) *</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required 
                                        value={renewForm.data.amount} 
                                        onChange={e => renewForm.setData('amount', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {renewForm.errors.amount && <div className="form-error">{renewForm.errors.amount}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Number of Users (Optional)</label>
                                    <input 
                                        type="number" 
                                        value={renewForm.data.users_count} 
                                        onChange={e => renewForm.setData('users_count', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {renewForm.errors.users_count && <div className="form-error">{renewForm.errors.users_count}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Start Date *</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={renewForm.data.start_date} 
                                        onChange={e => renewForm.setData('start_date', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {renewForm.errors.start_date && <div className="form-error">{renewForm.errors.start_date}</div>}
                                </div>

                                <div>
                                    <label className="form-label">End Date *</label>
                                    <input 
                                        type="date" 
                                        required 
                                        readOnly={renewForm.data.type !== 'Custom'}
                                        style={{ backgroundColor: renewForm.data.type !== 'Custom' ? 'var(--bg-secondary)' : 'inherit' }}
                                        value={renewForm.data.end_date} 
                                        onChange={e => renewForm.setData('end_date', e.target.value)} 
                                        className="form-input" 
                                    />
                                    {renewForm.errors.end_date && <div className="form-error">{renewForm.errors.end_date}</div>}
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Renewal Notes / Remarks</label>
                                    <textarea 
                                        value={renewForm.data.notes} 
                                        onChange={e => renewForm.setData('notes', e.target.value)} 
                                        className="form-input" 
                                        rows="3"
                                    />
                                    {renewForm.errors.notes && <div className="form-error">{renewForm.errors.notes}</div>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsRenewModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success" disabled={renewForm.processing}>🔄 Renew Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================
                VIEW DETAIL MODAL
                ========================================== */}
            {isViewModalOpen && selectedSubscription && (
                <div className="mwms-modal-backdrop">
                    <div className="mwms-modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Subscription Overview</h3>
                            <button className="close-btn" onClick={() => setIsViewModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                            <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{selectedSubscription.name}</h4>
                                <span className={`status-badge ${getStatusColorDetails(selectedSubscription).badgeClass}`} style={{ marginTop: '8px', display: 'inline-block' }}>
                                    {selectedSubscription.status}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 12px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Subscription Plan:</span>
                                <span>{selectedSubscription.plan}</span>

                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Subscription Type:</span>
                                <span>{selectedSubscription.type}</span>

                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Amount:</span>
                                <span style={{ fontWeight: 'bold' }}>₹{parseFloat(selectedSubscription.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>

                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>User License Count:</span>
                                <span>{selectedSubscription.users_count ? `${selectedSubscription.users_count} Users` : 'Unlimited'}</span>

                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Start Date:</span>
                                <span>{selectedSubscription.start_date}</span>

                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>End Date:</span>
                                <span>{selectedSubscription.end_date}</span>

                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Remaining Duration:</span>
                                <span>
                                    {selectedSubscription.status === 'Cancelled' ? (
                                        <span style={{ color: 'var(--text-secondary)' }}>Cancelled</span>
                                    ) : selectedSubscription.days_left <= 0 ? (
                                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Expired ({Math.abs(selectedSubscription.days_left)} days ago)</span>
                                    ) : (
                                        <span style={{ fontWeight: 600, color: getStatusColorDetails(selectedSubscription).color }}>{selectedSubscription.days_left} Days Left</span>
                                    )}
                                </span>

                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)', gridColumn: 'span 2', marginTop: '12px' }}>Notes / Remarks:</span>
                                <p style={{ gridColumn: 'span 2', margin: 0, padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', fontStyle: 'italic' }}>
                                    {selectedSubscription.notes || "No special notes recorded."}
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==========================================
                RENEWAL HISTORY MODAL
                ========================================== */}
            {isHistoryModalOpen && selectedSubscription && (
                <div className="mwms-modal-backdrop">
                    <div className="mwms-modal-content" style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h3>Renewal Audit History</h3>
                            <button className="close-btn" onClick={() => setIsHistoryModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, fontWeight: 600 }}>{selectedSubscription.name}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log of archived subscription cycles prior to renewal cycles.</p>
                            </div>

                            {selectedSubscription.renewals && selectedSubscription.renewals.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {selectedSubscription.renewals.map((r, i) => (
                                        <div key={r.id} style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                                                <span style={{ fontWeight: 600 }}>Cycle #{selectedSubscription.renewals.length - i}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Archived on: {new Date(r.created_at).toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 12px', fontSize: '0.85rem' }}>
                                                <span><strong>Plan:</strong> {r.plan}</span>
                                                <span><strong>Type:</strong> {r.type}</span>
                                                <span><strong>Amount:</strong> ₹{parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                <span><strong>Start Date:</strong> {r.start_date}</span>
                                                <span style={{ gridColumn: 'span 2' }}><strong>End Date:</strong> {r.end_date}</span>
                                                {r.notes && <p style={{ gridColumn: 'span 3', margin: '6px 0 0 0', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Note: {r.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    No historical renewals recorded for this subscription yet.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
