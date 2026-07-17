import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function AccountsArea({ expenses, summary }) {
    const user = usePage().props.auth.user;
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create record form
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'Expense',
        title: '',
        amount: '',
        date: new Date().toISOString().substring(0, 10),
        category: 'Office Infrastructure',
        notes: '',
    });

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('accounts.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            }
        });
    };

    const updateStatus = (expenseId, status) => {
        axios.post(route('accounts.approve', expenseId), { status: status })
             .then(() => window.location.reload());
    };

    const isAdmin = ['Super Admin', 'Admin'].includes(user.role);

    return (
        <AuthenticatedLayout>
            <Head title="Accounts Ledger" />

            <div className="page-header">
                <div className="page-title-group">
                    <h1>Accounts Ledger & Expenses</h1>
                    <p>Track operating costs, invoices, payroll salaries, and vendor payments.</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <span>💰</span> Log Transaction
                    </button>
                )}
            </div>

            {/* Ledger summary dashboard cards */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '32px' }}>
                <div className="metrics-card" style={{ '--card-accent': '#6366f1' }}>
                    <span className="metrics-label">Total AWS/Hosting Cost</span>
                    <span className="metrics-value">${summary.totalExpense}</span>
                    <span className="metrics-subtext">Operating expenses</span>
                </div>
                <div className="metrics-card" style={{ '--card-accent': '#f59e0b' }}>
                    <span className="metrics-label">Total Invoices</span>
                    <span className="metrics-value">${summary.totalInvoice}</span>
                    <span className="metrics-subtext">Pending contractor receipts</span>
                </div>
                <div className="metrics-card" style={{ '--card-accent': '#10b981' }}>
                    <span className="metrics-label">Total Payroll Salary</span>
                    <span className="metrics-value">${summary.totalSalary}</span>
                    <span className="metrics-subtext">Monthly staff expenditures</span>
                </div>
                <div className="metrics-card" style={{ '--card-accent': '#ef4444' }}>
                    <span className="metrics-label">Vendor Payments</span>
                    <span className="metrics-value">${summary.totalPayments}</span>
                    <span className="metrics-subtext">Vendor liabilities paid</span>
                </div>
            </div>

            {/* Transactions Ledger table */}
            <div className="table-container">
                <table className="table-view">
                    <thead>
                        <tr>
                            <th>Transaction</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                                    <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {item.type}
                                    </span>
                                </td>
                                <td>{item.category}</td>
                                <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    ${parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td>{new Date(item.date).toLocaleDateString()}</td>
                                <td>
                                    <span className={`badge badge-${item.status.toLowerCase().replace(' ', '')}`}>
                                        {item.status}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td>
                                        {item.status === 'Pending' ? (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button 
                                                    className="btn btn-primary btn-sm" 
                                                    style={{ backgroundColor: 'var(--success)' }}
                                                    onClick={() => updateStatus(item.id, 'Approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => updateStatus(item.id, 'Paid')}
                                                >
                                                    Paid
                                                </button>
                                            </div>
                                        ) : item.status === 'Approved' ? (
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => updateStatus(item.id, 'Paid')}
                                            >
                                                Mark Paid
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Settled</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ==================================
               LOG TRANSACTION MODAL
               ================================== */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Log Financial Transaction</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitCreate}>
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Ledger Type</label>
                                    <select 
                                        className="form-control"
                                        value={data.type}
                                        onChange={e => setData('type', e.target.value)}
                                    >
                                        <option value="Expense">Expense</option>
                                        <option value="Invoice">Invoice</option>
                                        <option value="Salary">Salary</option>
                                        <option value="Vendor Payment">Vendor Payment</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        required 
                                        placeholder="e.g. AWS Cloud, Office Supplies"
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Transaction Title / Description</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    placeholder="e.g. Monthly cloud hosting invoice"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                />
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Amount ($ USD)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        className="form-control" 
                                        required
                                        placeholder="0.00"
                                        value={data.amount}
                                        onChange={e => setData('amount', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Billing Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        required
                                        value={data.date}
                                        onChange={e => setData('date', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3"
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={processing}>Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
