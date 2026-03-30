import { useEffect, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 100,
        backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        padding: '16px 32px',
      }}
    >
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
      }}>

        {/* Logo / Home Button style from Image 1 */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-surface)',
            padding: '10px 20px',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{
            width: 24,
            height: 24,
            background: '#eff6ff', /* Light blue */
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-blue)'
          }}>
            {/* Using an inline SVG for the pen/logo for the pure blue look */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            StudySolo
          </span>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Features', href: '#features' },
            { label: 'Architecture', href: '#arch' },
            { label: 'Pricing', href: '#pricing' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="label label-red" style={{ gap: 6, padding: '6px 12px' }}>
            <span style={{ 
              width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)',
              boxShadow: '0 0 0 2px rgba(239,68,68,0.2)'
            }} />
            LIVE
          </span>
          <a
            href="https://studyflow.1037solo.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            打开工作流 ↗
          </a>
        </div>
      </div>
    </nav>
  );
}
