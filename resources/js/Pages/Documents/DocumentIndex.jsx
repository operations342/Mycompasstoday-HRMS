import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function DocumentIndex({ documents, currentFolderId, breadcrumbs }) {
    const user = usePage().props.auth.user;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [modalMode, setModalMode] = useState('folder'); // 'folder', 'file'

    // Form
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        is_folder: true,
        parent_id: currentFolderId || '',
        file: null,
        allowed_roles: []
    });

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('documents.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset({ ...data, name: '', file: null, allowed_roles: [] });
            },
            forceFormData: true
        });
    };

    const deleteItem = (docId) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        axios.delete(route('documents.destroy', docId))
             .then(() => window.location.reload());
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const rolesList = ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Employee', 'Read Only User'];

    return (
        <AuthenticatedLayout>
            <Head title="Document vault" />

            <div className="page-header">
                <div className="page-title-group">
                    <h1>Document Management</h1>
                    <p>Secure file storage with folder hierarchy and role-based access control.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => { setModalMode('folder'); setData('is_folder', true); setShowCreateModal(true); }}
                    >
                        📁 Create Folder
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => { setModalMode('file'); setData('is_folder', false); setShowCreateModal(true); }}
                    >
                        📤 Upload File
                    </button>
                </div>
            </div>

            {/* Breadcrumbs Row */}
            <div className="card-panel" style={{ padding: '12px 20px', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    🧭 <Link href={route('documents.index')}>Root</Link>
                    {breadcrumbs.map(crumb => (
                        <span key={crumb.id}>
                            {' / '}
                            <Link href={route('documents.index', { parent_id: crumb.id })}>
                                {crumb.name}
                            </Link>
                        </span>
                    ))}
                </span>
            </div>

            {/* Documents Explorer Grid */}
            <div className="card-panel">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                    
                    {/* Back folder if in subfolder */}
                    {currentFolderId && (
                        <div 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: '16px', 
                                border: '1px dashed var(--border-color)', 
                                borderRadius: '10px',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                // Find parent of parent if any
                                const parentCrumb = breadcrumbs[breadcrumbs.length - 2];
                                window.location.href = route('documents.index', parentCrumb ? { parent_id: parentCrumb.id } : {});
                            }}
                        >
                            <span style={{ fontSize: '2.5rem' }}>🔙</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '8px' }}>Go Back</span>
                        </div>
                    )}

                    {/* Folders & Files */}
                    {documents.map(doc => (
                        <div 
                            key={doc.id}
                            className="metrics-card"
                            style={{ 
                                padding: '16px', 
                                alignItems: 'center', 
                                textAlign: 'center', 
                                position: 'relative',
                                '--card-accent': doc.is_folder ? 'var(--primary)' : 'var(--success)'
                            }}
                        >
                            {/* Delete button option */}
                            {(doc.uploader_id === user.id || ['Super Admin', 'Admin'].includes(user.role)) && (
                                <button
                                    onClick={() => deleteItem(doc.id)}
                                    style={{ 
                                        position: 'absolute', 
                                        top: '6px', 
                                        right: '6px', 
                                        border: 'none', 
                                        background: 'none', 
                                        cursor: 'pointer',
                                        color: 'var(--danger)',
                                        fontSize: '0.85rem'
                                    }}
                                    title="Delete Item"
                                >
                                    ✕
                                </button>
                            )}

                            {doc.is_folder ? (
                                <Link 
                                    href={route('documents.index', { parent_id: doc.id })}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-primary)' }}
                                >
                                    <span style={{ fontSize: '3rem' }}>📁</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '6px', wordBreak: 'break-all' }}>
                                        {doc.name}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Folder</span>
                                </Link>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '3rem' }}>
                                        {doc.file_type === 'pdf' ? '📕' : 
                                         doc.file_type === 'xlsx' || doc.file_type === 'xls' ? '📊' : 
                                         doc.file_type === 'zip' ? '📦' : '📄'}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '6px', wordBreak: 'break-all' }}>
                                        {doc.name}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                        {formatBytes(doc.file_size)} • {doc.file_type.toUpperCase()}
                                    </span>
                                    
                                    {/* Mock download */}
                                    <a 
                                        href={`/storage/${doc.file_path}`} 
                                        download 
                                        className="btn btn-secondary btn-sm"
                                        style={{ marginTop: '8px', fontSize: '0.7rem', padding: '4px 8px' }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}

                    {documents.length === 0 && !currentFolderId && (
                        <div style={{ gridColumn: '1 / -1', padding: '48px' }}>
                            <div className="empty-state">
                                <span className="empty-state-icon">📁</span>
                                <h3>Document vault is empty</h3>
                                <p>Create a directory or upload training manuals to get started.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================================
               CREATE FOLDER / UPLOAD FILE MODAL
               ================================== */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {modalMode === 'folder' ? 'Create Directory Folder' : 'Upload Document File'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitCreate}>
                            
                            {modalMode === 'folder' ? (
                                <div className="form-group">
                                    <label className="form-label">Folder Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        required 
                                        placeholder="e.g. Marketing Briefs"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Select File to Upload</label>
                                        <input 
                                            type="file" 
                                            className="form-control"
                                            required
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                setData(prev => ({
                                                    ...prev,
                                                    file: file,
                                                    name: file.name
                                                }));
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Custom Display Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            required 
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Role Based Access Toggles */}
                            <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                                <label className="form-label">Restrict Access (Optional)</label>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                                    If left unselected, all employees can access this folder/file.
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {rolesList.map(r => (
                                        <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                            <input 
                                                type="checkbox"
                                                checked={data.allowed_roles.includes(r)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked 
                                                        ? [...data.allowed_roles, r]
                                                        : data.allowed_roles.filter(role => role !== r);
                                                    setData('allowed_roles', updated);
                                                }}
                                            />
                                            {r}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={processing}>Save Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
