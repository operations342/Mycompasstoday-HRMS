import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ children }) {
    const user = usePage().props.auth.user;
    
    // Theme Management state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('mwms-theme') || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mwms-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Mobile Sidebar toggle state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Dynamic classes based on current route
    const isCurrent = (name) => route().current(name);

    return (
        <div className="mwms-layout">
            {/* Sidebar Navigation */}
            <aside className={`mwms-sidebar ${isMobileMenuOpen ? 'show' : ''}`} style={{ display: 'flex' }}>
                <div className="sidebar-logo">
                    <div className="logo-icon">🧭</div>
                    <span className="logo-text">MyCompass MWMS</span>
                </div>

                <nav className="sidebar-nav">
                    <Link 
                        href={route('dashboard')} 
                        className={`sidebar-link ${isCurrent('dashboard') ? 'active' : ''}`}
                    >
                        <span>📊</span> Dashboard
                    </Link>

                    <Link 
                        href={route('tasks.index')} 
                        className={`sidebar-link ${route().current('tasks.*') ? 'active' : ''}`}
                    >
                        <span>📋</span> Task Board
                    </Link>

                    <Link 
                        href={route('logs.index')} 
                        className={`sidebar-link ${route().current('logs.*') ? 'active' : ''}`}
                    >
                        <span>✍️</span> Daily Work Logs
                    </Link>

                    <Link 
                        href={route('knowledge.index')} 
                        className={`sidebar-link ${route().current('knowledge.*') ? 'active' : ''}`}
                    >
                        <span>🧠</span> Knowledge Base
                    </Link>

                    <Link 
                        href={route('sop.index')} 
                        className={`sidebar-link ${route().current('sop.*') ? 'active' : ''}`}
                    >
                        <span>📜</span> SOP Procedures
                    </Link>

                    <Link 
                        href={route('bugs.index')} 
                        className={`sidebar-link ${route().current('bugs.*') ? 'active' : ''}`}
                    >
                        <span>🐛</span> Bug Tracker
                    </Link>

                    <Link 
                        href={route('documents.index')} 
                        className={`sidebar-link ${route().current('documents.*') ? 'active' : ''}`}
                    >
                        <span>📁</span> Document Vault
                    </Link>

                    <Link 
                        href={route('hr.index')} 
                        className={`sidebar-link ${route().current('hr.*') ? 'active' : ''}`}
                    >
                        <span>👥</span> HR Portal
                    </Link>

                    <Link 
                        href={route('accounts.index')} 
                        className={`sidebar-link ${route().current('accounts.*') ? 'active' : ''}`}
                    >
                        <span>💰</span> Accounts & Bills
                    </Link>
                </nav>

                {/* Sidebar User Profile Footer */}
                <div className="sidebar-user-section">
                    <div className="user-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="user-avatar" style={{ border: 'none' }} />
                        ) : (
                            user.name.charAt(0)
                        )}
                    </div>
                    <div className="user-info-text">
                        <Link href={route('profile.edit')} className="user-name" style={{ color: '#fff' }}>
                            {user.name}
                        </Link>
                        <span className="user-role-badge">{user.role}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Shell */}
            <div className="mwms-main">
                {/* Top Nav Bar */}
                <header className="mwms-top-nav">
                    {/* Burger menu for Mobile */}
                    <button 
                        className="action-btn mobile-menu-toggle" 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ display: 'none' }} /* Visible on mobile via CSS media queries */
                    >
                        ☰
                    </button>

                    {/* Global Search Bar */}
                    <div className="search-bar-container">
                        <span>🔍</span>
                        <input 
                            type="text" 
                            placeholder="Global search (tasks, SOPs, articles)..." 
                            className="search-input"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim() !== '') {
                                    // Redirect to knowledge search as standard index search
                                    window.location.href = route('knowledge.index', { search: e.target.value });
                                }
                            }}
                        />
                    </div>

                    {/* Actions and Utilities */}
                    <div className="top-actions">
                        {/* Light/Dark Toggle */}
                        <button className="action-btn" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>

                        {/* Notifications */}
                        <button className="action-btn" title="System Notifications">
                            🔔
                            <span className="btn-dot"></span>
                        </button>

                        {/* Logout Link */}
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button" 
                            className="btn btn-secondary btn-sm"
                            style={{ margin: 0 }}
                        >
                            Logout
                        </Link>
                    </div>
                </header>

                {/* Page Wrapper */}
                <main className="page-content">
                    {children}
                </main>
            </div>
            
            {/* Custom styling additions for sidebar mobile responsiveness */}
            <style>{`
                @media (max-width: 992px) {
                    .mobile-menu-toggle {
                        display: flex !important;
                    }
                    .mwms-sidebar {
                        position: fixed !important;
                        left: -260px;
                        transition: left 0.3s ease;
                    }
                    .mwms-sidebar.show {
                        left: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
