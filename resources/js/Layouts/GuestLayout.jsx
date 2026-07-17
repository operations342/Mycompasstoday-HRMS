import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="auth-container">
            <div className="auth-logo" style={{ textAlign: 'center' }}>
                <Link href="/">
                    <div style={{ fontSize: '3rem' }}>🧭</div>
                    <div style={{ 
                        fontFamily: 'Outfit, sans-serif', 
                        fontWeight: 'bold', 
                        fontSize: '1.4rem', 
                        marginTop: '8px', 
                        color: 'var(--text-primary)',
                        letterSpacing: '0.5px'
                    }}>
                        MyCompass MWMS
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>EdTech Work Management System</span>
                </Link>
            </div>

            <div className="auth-card">
                {children}
            </div>
        </div>
    );
}
