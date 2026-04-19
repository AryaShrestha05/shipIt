import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Scene from '../components/landing/Scene';
import { Icon } from '../components/Icon';
import { Btn } from '../components/primitives/Btn';
import { Tag } from '../components/primitives/Tag';
import { Reveal } from '../components/Reveal';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

const PHASES = [
  { icon: 'plan',   title: 'Plan',    desc: 'Decomposes the prompt into file-level edits grounded in the repo it just read.' },
  { icon: 'code',   title: 'Code',    desc: 'Tool-calls read_file and write_file — every mutation is a typed, auditable action.' },
  { icon: 'verify', title: 'Verify',  desc: 'Runs your test suite in a sandbox. Captures stdout, stderr, and exit codes as evidence.' },
  { icon: 'critic', title: 'Debug',   desc: 'Feeds real failure output back to the model. Fixes root causes, not symptoms.' },
  { icon: 'ship',   title: 'Ship',    desc: 'Commits, pushes a branch, opens a Pull Request with a human-readable summary.' },
];

const METRICS = [
  { v: '5', l: 'autonomous phases' },
  { v: '0', l: 'manual steps' },
  { v: '∞', l: 'retries with evidence' },
  { v: '1', l: 'pull request, merged-ready' },
];

function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
      padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'linear-gradient(180deg, rgba(24,24,28,0.85) 0%, transparent 100%)',
      backdropFilter: 'blur(8px)',
    }}>
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
        color: 'var(--fg-0)', fontWeight: 700, letterSpacing: '-0.02em', fontSize: 17,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: 'var(--acc)',
          display: 'grid', placeItems: 'center', color: 'oklch(0.16 0.02 165)',
        }}>
          <Icon name="bolt" size={15}/>
        </div>
        ShipIt
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Btn as="a" href="#how" variant="ghost" size="sm">How it works</Btn>
        <Btn as="a" href="#phases" variant="ghost" size="sm">Phases</Btn>
        <Btn as={Link} to="/agent" variant="primary" size="sm" icon="arrow">Launch agent</Btn>
      </div>
    </nav>
  );
}

function Hero() {
  const titleRef = useRef(null);
  const sceneRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.opacity = '0';
      titleRef.current.style.transform = 'translateY(12px)';
      requestAnimationFrame(() => {
        titleRef.current.style.transition = 'opacity 900ms ease, transform 900ms ease';
        titleRef.current.style.opacity = '1';
        titleRef.current.style.transform = 'translateY(0)';
      });
    }
  }, []);

  // Parallax: scene drifts slower, text fades out as you scroll past the hero.
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const progress = Math.min(1, scrollY / vh); // 0 at top, 1 after one viewport
  const sceneTranslate = scrollY * 0.3;        // scene moves slower than content
  const textOpacity = Math.max(0, 1 - progress * 1.4);
  const textTranslate = scrollY * 0.25;

  return (
    <section style={{
      position: 'relative', height: '100vh', width: '100%',
      overflow: 'hidden', background: 'transparent',
    }}>
      <div ref={sceneRef} style={{
        position: 'absolute', inset: 0,
        transform: `translate3d(0, ${sceneTranslate}px, 0)`,
        willChange: 'transform',
      }}>
        <Scene />
      </div>

      {/* Vignette — fade galaxy corners to pure black for legibility */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.85) 100%)',
      }}/>

      {/* Hero content */}
      <div ref={titleRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px',
        transform: `translate3d(0, ${-textTranslate}px, 0)`,
        opacity: textOpacity,
        willChange: 'transform, opacity',
      }}>
        <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <Tag tone="accent">
            <Icon name="spark" size={10}/> autonomous coding agent
          </Tag>

          <h1 style={{
            fontSize: 'clamp(44px, 7vw, 88px)', fontWeight: 800,
            letterSpacing: '-0.04em', lineHeight: 0.98,
            color: 'var(--fg-0)', margin: 0, maxWidth: 960,
          }}>
            From prompt to <span style={{
              background: 'linear-gradient(120deg, var(--acc) 0%, oklch(0.88 0.14 180) 50%, var(--acc) 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'gradient-drift 6s ease infinite',
            }}>pull request</span>, autonomously.
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 1.5vw, 18px)', color: 'var(--fg-2)',
            maxWidth: 620, margin: 0, lineHeight: 1.6,
          }}>
            ShipIt reads your repo, writes the code, runs the tests, debugs its own failures, and ships a PR.
            Every action is a typed tool call — fully auditable, end to end.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 8, pointerEvents: 'auto' }}>
            <Btn as={Link} to="/agent" variant="primary" size="lg" icon="play">
              Launch the agent
            </Btn>
            <Btn as="a" href="#how" variant="secondary" size="lg">
              How it works
            </Btn>
          </div>

          <div style={{
            fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-3)',
            marginTop: 18, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 4, background: 'var(--acc)',
              boxShadow: '0 0 12px var(--acc)',
              animation: 'pulse-accent 2s ease infinite',
            }}/>
            sandboxed · evidence-first · reproducible
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        animation: 'float-slow 2.6s ease infinite',
        pointerEvents: 'none',
      }}>
        scroll ↓
      </div>
    </section>
  );
}

function Metrics() {
  return (
    <section style={{
      padding: '48px 32px', borderTop: '1px solid var(--line-soft)',
      borderBottom: '1px solid var(--line-soft)',
      background: 'rgba(8, 8, 12, 0.35)', backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32,
      }}>
        {METRICS.map((m, i) => (
          <Reveal key={i} delay={i * 0.08} y={16}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 44, fontWeight: 700,
                letterSpacing: '-0.04em',
                background: 'linear-gradient(180deg, var(--fg-0) 0%, var(--fg-2) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{m.v}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 6, letterSpacing: '0.05em' }}>
                {m.l}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" style={{ padding: '120px 32px', background: 'transparent' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Tag tone="neutral" style={{ marginBottom: 16 }}>
              <Icon name="sliders" size={10}/> the loop
            </Tag>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700,
              letterSpacing: '-0.03em', color: 'var(--fg-0)', margin: '14px 0 14px',
            }}>
              An agent that earns its commits.
            </h2>
            <p style={{
              fontSize: 16, color: 'var(--fg-2)', maxWidth: 620, margin: '0 auto', lineHeight: 1.6,
            }}>
              Not a text generator pretending to code. A deterministic loop where every step leaves a trace —
              file reads, writes, test runs, and retries, all as first-class events.
            </p>
          </div>
        </Reveal>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          alignItems: 'stretch',
        }}>
          {/* Left: code-like terminal */}
          <Reveal delay={0.1} y={32}>
          <div style={{
            border: '1px solid var(--line-soft)', borderRadius: 14,
            background: 'var(--bg-1)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--line-soft)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-2)',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: 'oklch(0.70 0.17 25)' }}/>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: 'oklch(0.82 0.16 80)' }}/>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: 'oklch(0.78 0.15 145)' }}/>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)', marginLeft: 8 }}>
                shipit / agent loop
              </div>
            </div>
            <pre style={{
              margin: 0, padding: 18, flex: 1,
              fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--fg-1)',
              lineHeight: 1.65, overflow: 'auto',
            }}>
{`> shipit run --repo user/app --prompt "fix flaky login test"

[plan]  read repo → 4 files touched
[code]  write_file  src/auth/login.js
[code]  write_file  tests/login.test.js
[verify] run_command  npm test
[result] ✗ 1 failed: "token refresh timing"
[debug] feeding stderr → model
[code]  write_file  src/auth/login.js  (retry 1)
[verify] run_command  npm test
[result] ✓ 14 passed
[ship]  git push origin shipit/fix-flaky-login
[ship]  PR #142 opened — merged-ready`}
            </pre>
          </div>
          </Reveal>

          {/* Right: bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: 'bolt',   t: 'Tool-first, not text-first',
                d: 'Every mutation is a typed function call. No string-munging prose pretending to be code.' },
              { icon: 'verify', t: 'Evidence-first debugging',
                d: 'Failing tests feed their real stderr back to the model. Fixes become causal, not cosmetic.' },
              { icon: 'file',   t: 'Sandboxed by default',
                d: 'Commands run in an ephemeral working tree. Your main branch is never touched until the PR opens.' },
              { icon: 'pr',     t: 'A PR you can actually review',
                d: 'Clean commit, human-readable summary, diff stats, retries log. Ready for human judgment.' },
            ].map((f, i) => (
              <Reveal key={i} delay={0.15 + i * 0.08} y={20}>
                <div style={{
                  padding: 18, borderRadius: 12,
                  border: '1px solid var(--line-soft)', background: 'var(--bg-1)',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'var(--acc-soft)', border: '1px solid var(--acc-line)',
                    color: 'var(--acc)', display: 'grid', placeItems: 'center',
                  }}>
                    <Icon name={f.icon} size={16}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', marginBottom: 4 }}>
                      {f.t}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55 }}>
                      {f.d}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Phases() {
  return (
    <section id="phases" style={{
      padding: '120px 32px',
      background: 'rgba(8, 8, 12, 0.35)', backdropFilter: 'blur(2px)',
      borderTop: '1px solid var(--line-soft)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Tag tone="accent" style={{ marginBottom: 16 }}>
              <Icon name="chevron" size={10}/> five phases
            </Tag>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700,
              letterSpacing: '-0.03em', color: 'var(--fg-0)', margin: '14px 0 14px',
            }}>
              Plan → Code → Verify → Debug → Ship.
            </h2>
            <p style={{
              fontSize: 16, color: 'var(--fg-2)', maxWidth: 620, margin: '0 auto', lineHeight: 1.6,
            }}>
              Each phase emits structured events. Watch the loop run live — or pipe it into CI.
            </p>
          </div>
        </Reveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {PHASES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08} y={24}>
            <div style={{
              padding: 22, borderRadius: 14,
              background: 'var(--bg-0)', border: '1px solid var(--line-soft)',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 200ms ease, border-color 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--acc-line)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--line-soft)';
            }}
            >
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                marginBottom: 14, letterSpacing: '0.1em',
              }}>
                0{i + 1}
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                background: 'var(--acc-soft)', border: '1px solid var(--acc-line)',
                color: 'var(--acc)', display: 'grid', placeItems: 'center',
              }}>
                <Icon name={p.icon} size={18}/>
              </div>
              <div style={{
                fontSize: 16, fontWeight: 600, color: 'var(--fg-0)',
                marginBottom: 6, letterSpacing: '-0.01em',
              }}>
                {p.title}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.55 }}>
                {p.desc}
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{
      padding: '120px 32px', background: 'transparent',
      borderTop: '1px solid var(--line-soft)',
    }}>
      <Reveal y={30}>
      <div style={{
        maxWidth: 900, margin: '0 auto',
        padding: '64px 40px', borderRadius: 20,
        background: 'linear-gradient(180deg, #0a0a0f 0%, #050507 100%)',
        border: '1px solid var(--acc-line)',
        boxShadow:
          '0 40px 80px -30px oklch(0.85 0.17 165 / 0.25), ' +
          '0 0 0 1px rgba(0,0,0,0.6), ' +
          'inset 0 1px 0 rgba(255,255,255,0.04)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* corner accent wash inside the card */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% -10%, var(--acc-soft) 0%, transparent 60%)',
        }}/>
        {/* subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(var(--acc) 1px, transparent 1px), linear-gradient(90deg, var(--acc) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}/>

        <h2 style={{
          fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 700,
          letterSpacing: '-0.03em', color: 'var(--fg-0)',
          margin: '0 0 12px', position: 'relative',
        }}>
          Stop dispatching. Start shipping.
        </h2>
        <p style={{
          fontSize: 16, color: 'var(--fg-2)', maxWidth: 540,
          margin: '0 auto 28px', lineHeight: 1.6, position: 'relative',
        }}>
          Point ShipIt at a repo, describe the task, and get back a merge-ready PR — backed by real tests.
        </p>
        <div style={{ position: 'relative', display: 'inline-flex', gap: 10 }}>
          <Btn as={Link} to="/agent" variant="primary" size="lg" icon="arrow">
            Launch the agent
          </Btn>
        </div>
      </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: '32px', borderTop: '1px solid var(--line-soft)',
      background: 'rgba(8, 8, 12, 0.4)', backdropFilter: 'blur(2px)', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      fontSize: 12, color: 'var(--fg-3)', fontFamily: 'var(--mono)',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--acc)' }}/>
        shipit · built at marist hackathon
      </div>
      <div>gemini-2.5-flash · react · three.js</div>
    </footer>
  );
}

export default function Landing() {
  useSmoothScroll();
  return (
    <div style={{ color: 'var(--fg-0)' }}>
      <Nav />
      <Hero />
      <Metrics />
      <HowItWorks />
      <Phases />
      <CTA />
      <Footer />
    </div>
  );
}
