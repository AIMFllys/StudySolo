import { useState, useEffect, useRef } from 'react';
import './index.css';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import WorkflowDemo from './components/WorkflowDemo';
import RAGSection from './components/RAGSection';
import Architecture from './components/Architecture';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

function App() {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Page load animation
  useEffect(() => {
    const handleLoad = () => {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsLoading(false), 300);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openGuide = () => {
    window.open('https://docs.1037solo.com', '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Page Loading Screen */}
      <div
        ref={loaderRef}
        className={`page-loader ${!isLoading ? 'loaded' : ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {/* Animated logo spinner */}
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: 'var(--brand-blue)',
              borderRightColor: 'var(--brand-purple)',
              animation: 'rotate 1s linear infinite',
            }} />
            <div style={{
              position: 'absolute',
              inset: '6px',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderBottomColor: 'var(--brand-cyan)',
              borderLeftColor: 'var(--brand-emerald)',
              animation: 'rotate 1.5s linear infinite reverse',
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: '50%',
            }}>
              <img
                src={`${import.meta.env.BASE_URL}StudySolo.png`}
                alt="Logo"
                style={{ width: '70%', height: '70%', objectFit: 'contain' }}
              />
            </div>
          </div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            animation: 'breathe 2s ease-in-out infinite',
          }}>
            StudySolo
          </span>
        </div>
      </div>

      <Navbar isDark={isDark} toggleTheme={toggleTheme} />

      <main>
        <Hero onStart={scrollToPricing} onGuide={openGuide} />
        <HowItWorks />
        <Features />
        <WorkflowDemo />
        <RAGSection />
        <Architecture />
        <div id="pricing">
          <Pricing />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;

