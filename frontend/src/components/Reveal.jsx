import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Scroll-triggered reveal. Starts hidden (opacity 0, translated), animates
// into place once >15% of the element is visible. Uses IntersectionObserver
// (lighter than ScrollTrigger and plays nicely with Lenis).
export function Reveal({
  children,
  delay = 0,
  y = 24,
  duration = 0.9,
  ease = 'power3.out',
  once = true,
  style,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gsap.to(el, { opacity: 1, y: 0, duration, ease, delay });
          if (once) io.unobserve(el);
        } else if (!once) {
          gsap.to(el, { opacity: 0, y, duration: 0.4, ease: 'power2.out' });
        }
      });
    }, { threshold: 0.15 });

    io.observe(el);
    return () => io.disconnect();
  }, [delay, y, duration, ease, once]);

  return <div ref={ref} style={{ willChange: 'transform, opacity', ...style }}>{children}</div>;
}
