'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface NavbarAutoHideProps {
  children: React.ReactNode;
}

/**
 * NavbarAutoHide — Navbar floats ABOVE content as an overlay.
 * When hidden, content fills the full viewport.
 * When hovered, navbar slides down over the content.
 */
export default function NavbarAutoHide({ children }: NavbarAutoHideProps) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearHideTimer();
    setVisible(true);
  }, [clearHideTimer]);

  const handleMouseLeave = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 300);
  }, [clearHideTimer]);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  return (
    <>
      {/* Hover trigger zone — invisible strip at the very top, always present */}
      <div
        className="fixed left-0 right-0 top-0 z-[60] h-2"
        onMouseEnter={handleMouseEnter}
        aria-hidden="true"
      />

      {/* Navbar container — fixed overlay, does NOT occupy layout space */}
      <div
        className="fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ease-out"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </>
  );
}
