import React, { useState, useEffect } from 'react';

interface NavbarProps {
    isDark: boolean;
    toggleTheme: () => void;
}

const SunIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.1" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
    </svg>
);

const MoonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" fillOpacity="0.1" />
    </svg>
);

const Navbar: React.FC<NavbarProps> = ({ isDark, toggleTheme }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header style={{
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 100,
            padding: scrolled ? '0.6rem 0' : '1rem 0',
            background: scrolled ? 'var(--surface-glass)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent',
            transition: 'var(--transition-base)',
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                {/* Logo */}
                <a href={import.meta.env.BASE_URL} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                }}>
                    {/* Logo icon */}
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-glow-blue)',
                        background: 'white', // Ensure PNG looks good if transparent
                    }}>
                        <img
                            src={`${import.meta.env.BASE_URL}StudySolo.png`}
                            alt="StudySolo Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                padding: '2px'
                            }}
                        />
                    </div>
                    <span style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                    }}>
                        Study<span className="text-gradient">Solo</span>
                    </span>
                </a>

                {/* Navigation Links */}
                <nav className="hide-mobile" style={{
                    display: 'flex',
                    gap: '0.25rem',
                    alignItems: 'center',
                }}>
                    {[
                        { label: '核心功能', href: '#features' },
                        { label: '工作流演示', href: '#workflow' },
                        { label: 'RAG 检索', href: '#rag' },
                        { label: '技术架构', href: '#architecture' },
                        { label: '价格方案', href: '#pricing' },
                    ].map(item => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="btn-ghost"
                            style={{
                                fontSize: '0.9rem',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-secondary)',
                                textDecoration: 'none',
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            color: isDark ? 'var(--brand-amber)' : 'var(--brand-purple)',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: isDark ? '0 0 20px rgba(245, 158, 11, 0.15)' : '0 0 20px rgba(139, 92, 246, 0.1)',
                        }}
                        className="theme-toggle-btn"
                        aria-label="切换主题"
                    >
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1)',
                            transform: isDark ? 'translateY(20px)' : 'translateY(-20px)',
                        }}>
                            <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <SunIcon />
                            </div>
                            <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MoonIcon />
                            </div>
                        </div>
                    </button>

                    <a
                        href="https://studyflow.1037solo.com"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                        style={{
                            padding: '0.6rem 1.25rem',
                            fontSize: '0.9rem',
                            borderRadius: 'var(--radius-lg)',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                        进入平台
                    </a>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
