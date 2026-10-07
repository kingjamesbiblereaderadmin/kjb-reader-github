import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop({ targetId }) {
  const [visible, setVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(80);

  useEffect(() => {
    const scroller = (targetId && document.getElementById(targetId)) || document.getElementById('kjb-scroll');
    const target = scroller || window;
    const getY = () => (scroller ? scroller.scrollTop : window.scrollY);
    const handleScroll = () => {
      setVisible(getY() > 300);
    };
    target.addEventListener('scroll', handleScroll, { passive: true });

    // Calculate footer height based on nav mode
    const updateFooterHeight = () => {
      try {
        // Measure the real bottom nav (includes safe-area padding) so the
        // button always sits fully inside the reading area, above the footer.
        const nav = document.querySelector('[data-kjb-bottom-nav]');
        const navHeight = nav ? nav.getBoundingClientRect().height : 0;
        setFooterHeight(Math.round(navHeight) + 12);
      } catch {
        setFooterHeight(80);
      }
    };

    updateFooterHeight();
    window.addEventListener('storage', updateFooterHeight);
    
    // Also check periodically in case localStorage changes
    const interval = setInterval(updateFooterHeight, 1000);

    return () => {
      target.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', updateFooterHeight);
      clearInterval(interval);
    };
  }, []);

  const scrollToTop = () => {
    const scroller = (targetId && document.getElementById(targetId)) || document.getElementById('kjb-scroll');
    if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed right-3 sm:right-5 lg:right-8 z-[55] p-1.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all duration-300 opacity-80 hover:opacity-100 backdrop-blur-sm"
      aria-label="Scroll to top"
      style={{ bottom: `${footerHeight}px` }}
    >
      <ChevronUp className="w-3.5 h-3.5" />
    </button>
  );
}