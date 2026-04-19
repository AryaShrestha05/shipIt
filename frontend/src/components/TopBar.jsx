import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { Btn } from './primitives/Btn';

export const TopBar = ({ onTweaks }) => (
  <header style={{
    height: 52, borderBottom: '1px solid var(--line-soft)',
    display: 'flex', alignItems: 'center', padding: '0 18px',
    background: 'var(--bg-0)', gap: 16, flexShrink: 0,
  }}>
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: 'var(--acc)', color: 'oklch(0.16 0.02 165)',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 0 18px var(--acc-soft)',
      }}>
        <Icon name="bolt" size={15} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>
        shipit
        <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>/agent</span>
      </div>
    </Link>

    <div style={{
      fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-3)',
      padding: '3px 8px', borderRadius: 5, border: '1px solid var(--line-soft)',
    }}>v0.1 · early</div>

    <div style={{ flex: 1 }} />

    <nav style={{ display: 'flex', gap: 4 }}>
      {['Runs', 'Repos', 'Settings', 'Docs'].map((n, i) => (
        <button key={n} style={{
          background: 'none', border: 'none',
          color: i === 0 ? 'var(--fg-0)' : 'var(--fg-2)',
          fontSize: 13, padding: '6px 12px', borderRadius: 6,
          cursor: 'pointer', fontFamily: 'var(--sans)',
        }}>{n}</button>
      ))}
    </nav>

    <div style={{ width: 1, height: 22, background: 'var(--line-soft)' }} />

    <Btn icon="sliders" size="sm" onClick={onTweaks}>Tweaks</Btn>

    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--bg-3), var(--bg-2))',
      border: '1px solid var(--line)',
      display: 'grid', placeItems: 'center',
      fontSize: 11, fontWeight: 600, color: 'var(--fg-1)', fontFamily: 'var(--mono)',
    }}>AS</div>
  </header>
);
