import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function KnowledgeIndex({ articles, filters }) {
    const user = usePage().props.auth.user;
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'All');
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeArticleId, setActiveArticleId] = useState(null);

    // Create article form
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        steps: '',
        challenges_faced: '',
        solution: '',
        category: 'Development'
    });

    const submitCreateArticle = (e) => {
        e.preventDefault();
        post(route('knowledge.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            }
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        window.location.href = route('knowledge.index', { search: searchQuery, category: categoryFilter });
    };

    const handleCategoryClick = (cat) => {
        setCategoryFilter(cat);
        window.location.href = route('knowledge.index', { search: searchQuery, category: cat });
    };

    const updateApprovalStatus = (articleId, status) => {
        axios.post(route('knowledge.approve', articleId), { approval_status: status })
             .then(() => window.location.reload());
    };

    const categories = ['All', 'Development', 'Design', 'Research', 'HR', 'Accounts', 'Marketing', 'Back Office'];

    return (
        <AuthenticatedLayout>
            <Head title="Knowledge Base" />

            <div className="page-header">
                <div className="page-title-group">
                    <h1>Company Knowledge Base</h1>
                    <p>Search, reference, and build institutional knowledge for the next generation of team members.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <span>➕</span> Write Article
                </button>
            </div>

            {/* Powerful Search Bar Card */}
            <div className="card-panel" style={{ padding: '20px', marginBottom: '24px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search title, steps, challenges, solutions, or author..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ fontSize: '0.95rem', padding: '12px' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>Search</button>
                </form>
            </div>

            <div className="section-grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
                
                {/* Left side: Categories Panel */}
                <div>
                    <div className="card-panel" style={{ padding: '16px' }}>
                        <h3 className="panel-title" style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Categories</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`sidebar-link`}
                                    style={{ 
                                        border: 'none', 
                                        background: categoryFilter === cat ? 'var(--primary-light)' : 'none',
                                        color: categoryFilter === cat ? 'var(--primary)' : 'var(--text-secondary)',
                                        textAlign: 'left',
                                        width: '100%',
                                        fontWeight: categoryFilter === cat ? 600 : 500
                                    }}
                                >
                                    {cat === 'All' ? '🌐 All Articles' : 
                                     cat === 'Development' ? '💻 Development' : 
                                     cat === 'Design' ? '🎨 Design' : 
                                     cat === 'Research' ? '🔬 Research' : 
                                     cat === 'HR' ? '👥 HR Operations' : 
                                     cat === 'Accounts' ? '💰 Accounts' : 
                                     cat === 'Marketing' ? '📢 Marketing' : '🏢 Back Office'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right side: Articles List */}
                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {articles.map(article => {
                            const isOpen = activeArticleId === article.id;
                            return (
                                <div key={article.id} className="card-panel" style={{ margin: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span className="card-tag">{article.category}</span>
                                                <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>v{article.version}.0</span>
                                                {article.approval_status !== 'Approved' && (
                                                    <span className={`badge badge-${article.approval_status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                                                        {article.approval_status} Review
                                                    </span>
                                                )}
                                            </div>
                                            <h2 
                                                style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
                                                onClick={() => setActiveArticleId(isOpen ? null : article.id)}
                                            >
                                                {article.title} {isOpen ? '▲' : '▼'}
                                            </h2>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                Written by <strong>{article.author.name}</strong> • Updated {new Date(article.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Admin Action options for approval */}
                                        {in_array(user.role, ['Super Admin', 'Admin', 'Manager']) && article.approval_status === 'Pending' && (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button 
                                                    className="btn btn-primary btn-sm" 
                                                    style={{ backgroundColor: 'var(--success)' }}
                                                    onClick={() => updateApprovalStatus(article.id, 'Approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => updateApprovalStatus(article.id, 'Rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded Article detail */}
                                    {isOpen ? (
                                        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                            <div style={{ marginBottom: '16px' }}>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Overview / Objective</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                                    {article.description}
                                                </p>
                                            </div>

                                            <div style={{ marginBottom: '16px' }}>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Step-by-Step Instructions</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.6', backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                                                    {article.steps}
                                                </p>
                                            </div>

                                            {article.challenges_faced && (
                                                <div className="form-row-2" style={{ marginBottom: '16px' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--danger)' }}>Complications / Challenges</h4>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                                            {article.challenges_faced}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)' }}>Resolution / Solutions</h4>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                                            {article.solution}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {article.description}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        {articles.length === 0 && (
                            <div className="empty-state">
                                <span className="empty-state-icon">📚</span>
                                <h3>No documentation found</h3>
                                <p>Write an article or convert completed tasks to populate the knowledge directory.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ==================================
               WRITE ARTICLE MODAL (Manual creation)
               ================================== */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Write Knowledge Article</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitCreateArticle}>
                            <div className="form-group">
                                <label className="form-label">Article Title</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select 
                                    className="form-control"
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
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

                            <div className="form-group">
                                <label className="form-label">Objective / Summary</label>
                                <textarea 
                                    className="form-control" 
                                    rows="2" 
                                    required
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Steps Instructions</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    required
                                    placeholder="Detail step 1, step 2, step 3..."
                                    value={data.steps}
                                    onChange={e => setData('steps', e.target.value)}
                                ></textarea>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Challenges (Optional)</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="2" 
                                        value={data.challenges_faced}
                                        onChange={e => setData('challenges_faced', e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Solution Applied (Optional)</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="2" 
                                        value={data.solution}
                                        onChange={e => setData('solution', e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={processing}>Save Article</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

// In_array helper for JSX
function in_array(needle, haystack) {
    return haystack.indexOf(needle) !== -1;
}
