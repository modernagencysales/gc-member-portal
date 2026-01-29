import React, { useState, useEffect } from 'react';
import CTAButton from './CTAButton';

// ============================================
// Types
// ============================================

interface StickyCTAProps {
  text: string;
  calEmbedRef: React.RefObject<HTMLDivElement>;
  isVisible?: boolean;
  onCTAClick?: () => void;
}

// ============================================
// StickyCTA Component
// ============================================

const StickyCTA: React.FC<StickyCTAProps> = ({
  text,
  calEmbedRef,
  isVisible = true,
  onCTAClick,
}) => {
  const [isCalEmbedVisible, setIsCalEmbedVisible] = useState(false);

  useEffect(() => {
    const calEmbedElement = calEmbedRef.current;

    if (!calEmbedElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsCalEmbedVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    observer.observe(calEmbedElement);

    return () => {
      observer.disconnect();
    };
  }, [calEmbedRef]);

  const handleCTAClick = () => {
    if (onCTAClick) {
      onCTAClick();
      return;
    }

    const calEmbedElement = calEmbedRef.current;
    if (calEmbedElement) {
      calEmbedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const shouldHide = !isVisible || isCalEmbedVisible;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm
        border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-none
        transform transition-all duration-300 ease-in-out
        ${shouldHide ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
      `}
      aria-hidden={shouldHide}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Urgency text — hidden on mobile to keep it compact */}
          <div className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Limited spots available this month
            </span>
          </div>

          <CTAButton text={text} onClick={handleCTAClick} icon="calendar" variant="primary" />
        </div>
      </div>
    </div>
  );
};

export default StickyCTA;
