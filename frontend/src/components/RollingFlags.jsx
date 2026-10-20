import { useRef, useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useTranslation } from '../hooks/useTranslation';

export default function RollingFlags() {
  const { t } = useTranslation();
  const progressBarRef = useRef(null);
  const barFillRef = useRef(null);
  const arrowRef = useRef(null);
  const flagsContainerRef = useRef(null);
  const [containerRef, isVisible] = useScrollReveal({ threshold: 0.1 });
  const rafIdRef = useRef(null);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  const NATIONAL_TEAMS = [
    { name: t('header.nations.vietnam'), flag: 'VN' },
    { name: t('header.nations.argentina'), flag: 'AR' },
    { name: t('header.nations.france'), flag: 'FR' },
    { name: t('header.nations.brazil'), flag: 'BR' },
    { name: t('header.nations.germany'), flag: 'DE' },
    { name: t('header.nations.spain'), flag: 'ES' },
    { name: t('header.nations.southAfrica'), flag: 'ZAR' },
    { name: t('header.nations.portugal'), flag: 'PT' },
    { name: t('header.nations.japan'), flag: 'JP' },
    { name: t('header.nations.india'), flag: 'INR' },
    { name: t('header.nations.indonesia'), flag: 'IDR' },
    { name: t('header.nations.mexico'), flag: 'MXN' },
  ];

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const deviceMemory = navigator.deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    if (prefersReduced || deviceMemory <= 1 || hardwareConcurrency <= 2) {
      setShouldAnimate(false);
    }
  }, []);

  useEffect(() => {
    if (!isVisible && rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, [isVisible]);

  useEffect(() => {
    if (!shouldAnimate) return;
    const handleScroll = () => {
      if (!progressBarRef.current || !isVisible) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const totalDist = windowHeight + rect.height;
      const distTravelled = windowHeight - rect.top;

      let percentage = (distTravelled / totalDist) * 100;
      percentage = Math.min(Math.max(percentage, 5), 100);

      if (barFillRef.current) {
        barFillRef.current.style.transform = `scaleX(${percentage / 100})`;
      }

      if (arrowRef.current) {
        arrowRef.current.style.left = `${percentage}%`;
      }

      if (flagsContainerRef.current) {
        flagsContainerRef.current.style.left = `calc(${percentage}% + 5rem)`;
        flagsContainerRef.current.style.setProperty('--flag-rotation', `${percentage * 8}deg`);
      }
    };

    const onScroll = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      if (!isVisible) {
        return;
      }

      rafIdRef.current = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isVisible, shouldAnimate]);

  return (
    <div
      ref={(node) => {
        progressBarRef.current = node;
        containerRef.current = node;
      }}
      className="w-full h-20 md:h-32 relative overflow-hidden bg-white mb-0"
    >
      <div
        ref={barFillRef}
        className="h-full absolute top-0 left-0 bg-primary"
        style={{
          width: '100%',
          transformOrigin: 'left',
          transform: shouldAnimate ? 'scaleX(0.05)' : 'scaleX(1)',
          willChange: shouldAnimate ? 'transform' : 'auto'
        }}
      />

      <div
        ref={arrowRef}
        className="absolute top-0 h-20 w-20 md:h-32 md:w-32 flex items-center justify-center z-20 bg-accent rounded-full border-4 border-primary"
        style={{
          left: shouldAnimate ? '5%' : '100%',
          transform: 'translateX(-50%)'
        }}
      >
        <ChevronRight
          size={40}
          className="md:w-20 md:h-20 text-primary"
          strokeWidth={3}
        />
      </div>

      <div
        ref={flagsContainerRef}
        className="absolute top-0 h-full flex items-center z-10 gap-6"
        style={{
          left: shouldAnimate ? 'calc(5% + 5rem)' : 'calc(100% + 5rem)',
          willChange: shouldAnimate ? 'transform' : 'auto',
          '--flag-rotation': '0deg'
        }}
      >
        {NATIONAL_TEAMS.map((nation, index) => (
          <img
            key={index}
            src={`/flags/${nation.flag.toLowerCase()}.svg`}
            alt={nation.name}
            className={'h-20 w-20 md:h-32 md:w-32'}
            style={{ transform: 'rotate(var(--flag-rotation))' }}
          />
        ))}
      </div>
    </div>
  );
}
