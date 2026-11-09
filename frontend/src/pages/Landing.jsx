import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useColorMode } from '../lib/colorMode';
import SiteNav from '../components/SiteNav';
import './Landing.css';

gsap.registerPlugin(ScrollTrigger);

// / — the landing page. Two sheets of paper:
//   1. the hero, which stays put like a page lying on a desk
//   2. a sheet that slides up over it as you scroll: three steps + Get started
// The scroll effect is the same idea as Legacy-Landing's paper stack, made with GSAP.

const STEPS = [
  { n: '01', title: 'Show what you\'ve got', text: 'A photo of your menu, flyer, sign or business card, plus a sentence about you. Your site is ready in about a minute.' },
  { n: '02', title: 'Dump your thoughts', text: 'Click anything on your site and say what you want, in your own words. Every thought becomes a numbered note.' },
  { n: '03', title: 'Let the AI do the work', text: 'One press makes every change, tests your site like a visitor would, fixes what broke, and shows you the result.' },
];

export default function Landing() {
  const colorMode = useColorMode(); // light or dark, shared by every page
  const pageRef = useRef(null);

  // All the motion lives here. gsap.context collects every animation so
  // leaving the page undoes them in one go (ctx.revert()).
  useEffect(function () {
    // Smooth scrolling, driven by GSAP's clock so ScrollTrigger stays in sync.
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    function tick(time) { lenis.raf(time * 1000); }
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // "How it works" (#how) glides down instead of jumping.
    function onAnchorClick(event) {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
    }
    document.addEventListener('click', onAnchorClick);


    const ctx = gsap.context(function () {
      const media = gsap.matchMedia();

      media.add('(prefers-reduced-motion: no-preference)', function () {
        // The paper effect: while the sheet rises, the hero sinks back a little
        // and darkens, as if it's now underneath.
        const cover = { trigger: '.ld-sheet', start: 'top bottom', end: 'top top', scrub: true };
        gsap.to('.ld-hero-inner', { scale: 0.94, y: -40, ease: 'none', scrollTrigger: cover });
        // The photo zooms in a touch instead, so its edges never show.
        gsap.to('.ld-hero-photo', { scale: 1.08, ease: 'none', scrollTrigger: cover });
        gsap.to('.ld-hero-dim', { opacity: 1, ease: 'none', scrollTrigger: cover });

        // Steps fade up one by one as the sheet arrives.
        gsap.from('.ld-step > *', {
          y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.05,
          scrollTrigger: { trigger: '.ld-steps', start: 'top 85%' },
        });
      });
    }, pageRef);

    return function () {
      ctx.revert();
      gsap.ticker.remove(tick);
      document.removeEventListener('click', onAnchorClick);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="ld-page" data-mode={colorMode.mode} ref={pageRef}>
      {/* Sheet 1: the hero. Sticky, so the next sheet slides over it. */}
      <section className="ld-hero">
        <div className="ld-hero-photo" aria-hidden="true" />
        <SiteNav colorMode={colorMode} overlay />
        <div className="ld-hero-inner">

          <div className="ld-hero-body">
            <p className="ld-eyebrow ld-fade">an online presence for everyone</p>
            <h1 className="ld-title">
              <span className="ld-line"><span><em>closing the gap between ai and humans.</em></span></span>
            </h1>
            <p className="ld-lede ld-fade">
              Everyone deserves to be found online, no code and no designer needed. Dump your thoughts, and let the AI do the work.
            </p>
            <div className="ld-ctas ld-fade">
              <Link to="/try" className="ld-btn">Dump your thoughts <span aria-hidden="true">↗</span></Link>
              <a href="#how" className="ld-btn ld-btn-ghost">How it works</a>
            </div>
          </div>
        </div>
        <div className="ld-hero-dim" aria-hidden="true" />
      </section>

      {/* Sheet 2: rises over the hero like a new page of paper. */}
      <section className="ld-sheet" id="how">
        <div className="ld-sheet-body">
          <p className="ld-eyebrow">how it works</p>
          <h2 className="ld-h2">From your thoughts to a tested website, in three steps.</h2>

          <div className="ld-steps">
            {/* Vercel-style "+" marks on the grid's outer corners. */}
            <i className="ld-plus ld-plus-tl" aria-hidden="true" />
            <i className="ld-plus ld-plus-br" aria-hidden="true" />
            {STEPS.map(function (step) {
              return (
                <div key={step.n} className="ld-step">
                  <span className="ld-step-n">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>

          <div className="ld-end">
            <Link to="/try" className="ld-btn ld-btn-big">Let the AI do the work <span aria-hidden="true">↗</span></Link>
            <p className="ld-small">Free for everyone. Bring your own Gemini, OpenAI or Claude key. It stays encrypted on your device.</p>
          </div>
        </div>
        <footer className="ld-footer">
          <span>shipit.</span>
          <span>Marist Innovation Challenge 2026</span>
        </footer>
      </section>
    </div>
  );
}
