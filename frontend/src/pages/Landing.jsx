import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import ThemePicker from '../editor/ThemePicker';
import './Landing.css';

// / — the landing page. Says what ShipIt does, shows the looks, and sends
// people to /try. Picking a look here carries it over (/try?theme=ripple).

// Fades a block up as it scrolls into view.
const rise = {
  initial: { opacity: 0, y: 40, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease: [0.32, 0.72, 0, 1] },
};

const STEPS = [
  { n: '01', title: 'Snap a photo', text: 'Your menu, your sign, your price list. ShipIt reads it and builds your site in about a minute.' },
  { n: '02', title: 'Click and say it', text: 'Click anything on your site and say what to change. Every note becomes a numbered pin.' },
  { n: '03', title: 'Ship once', text: 'One press makes every change, tests your site like a customer would, fixes what broke, and shows you the finished site.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="ld-page">
      <nav className="ld-nav">
        <Link to="/" className="ld-brand">shipit.</Link>
        <span className="ld-nav-links">
          <a href="#looks" className="ld-link">looks</a>
          <Link to="/blocks" className="ld-link">blocks</Link>
          <Link to="/try" className="ld-pill">Get started</Link>
        </span>
      </nav>

      <header className="ld-hero">
        <Motion.p className="ld-eyebrow" {...rise}>for every small business</Motion.p>
        <Motion.h1 className="ld-title" {...rise}>Point at it.<br />Say it.<br /><em>Ship once.</em></Motion.h1>
        <Motion.p className="ld-lede" {...rise}>
          A website for your bakery, salon, or repair shop from one photo. Then change anything by clicking and talking, no code and no back-and-forth.
        </Motion.p>
        <Motion.div className="ld-ctas" {...rise}>
          <Link to="/try" className="ld-cta">
            Start with a photo <span className="ld-cta-icon" aria-hidden="true">↗</span>
          </Link>
          <a href="#looks" className="ld-link">See the looks</a>
        </Motion.div>
      </header>

      {/* A real Ship, mid-run: it found a broken button on its own and is fixing it. */}
      <Motion.figure className="ld-shot" {...rise}>
        <div className="ld-shot-core">
          <img src="/demo-shipping.jpg" alt="ShipIt testing a bakery's site like a customer, finding a broken button and fixing it" />
        </div>
        <figcaption>A real run: three notes applied, a broken button caught and fixed, every test passed.</figcaption>
      </Motion.figure>

      <section className="ld-steps">
        {STEPS.map(function (step) {
          return (
            <Motion.div key={step.n} className="ld-step" {...rise}>
              <span className="ld-step-n">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Motion.div>
          );
        })}
      </section>

      <section className="ld-looks" id="looks">
        <Motion.div className="ld-section-head" {...rise}>
          <p className="ld-eyebrow">the looks</p>
          <h2>Pick how your business feels.</h2>
          <p className="ld-lede">Hand-made designs, not AI guesses. Pick one to start, and your site is built in it.</p>
        </Motion.div>
        <ThemePicker value="" onPick={function (id) { navigate('/try?theme=' + id); }} />
      </section>

      <Motion.section className="ld-band" {...rise}>
        <h2>Free to use. Bring your own AI key.</h2>
        <p>ShipIt runs on your Gemini, OpenAI or Claude key. It's encrypted on your device and never saved on our server.</p>
        <Link to="/try" className="ld-cta">
          Get started <span className="ld-cta-icon" aria-hidden="true">↗</span>
        </Link>
      </Motion.section>

      <footer className="ld-footer">
        <span>shipit.</span>
        <span>Made for the Marist Innovation Challenge 2026</span>
      </footer>
    </div>
  );
}
