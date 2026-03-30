import { useEffect, useState } from 'react';
import './index.css';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WorkflowDemo from './components/WorkflowDemo';
import Features from './components/Features';
import Architecture from './components/Architecture';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

/* Apply scroll-reveal to all .reveal elements */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* Add Google Fonts for Space Grotesk */
function useFonts() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);
}

export default function App() {
  const [loading, setLoading] = useState(true);
  useScrollReveal();
  useFonts();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const scrollToPricing = () =>
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });

  const openGitHub = () =>
    window.open('https://github.com/AIMFllys/StudySolo', '_blank');

  return (
    <>
      {/* Page Loader */}
      <div className={`page-loader${!loading ? ' loaded' : ''}`}>
        <div className="loader-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 24,
              height: 24,
              border: '1px solid rgba(0,255,136,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={`${import.meta.env.BASE_URL}StudySolo.png`} alt="Logo" style={{ width: 14, height: 14, objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-green)', fontWeight: 700 }}>
              STUDYSOLO
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 16 }}>
            INITIALIZING DAG ENGINE...
          </div>
          <div className="loader-bar">
            <div className="loader-bar-fill" />
          </div>
        </div>
      </div>

      {/* App */}
      <div style={{ background: 'var(--bg-void)', minHeight: '100vh' }}>
        <Navbar />
        <main>
          <Hero onStart={scrollToPricing} onGuide={openGitHub} />
          <WorkflowDemo />
          <Features />
          <Architecture />
          <Pricing />
        </main>
        <Footer />
      </div>
    </>
  );
}
