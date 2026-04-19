import { Icon } from '../Icon';
import { Tag } from '../primitives/Tag';
import { Btn } from '../primitives/Btn';

export const EventPR = ({ number, title, url, stats }) => (
  <div style={{
    margin: '12px 22px 22px',
    border: '1px solid var(--acc-line)', borderRadius: 12,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, var(--acc-soft) 0%, transparent 100%)',
    animation: 'slide-up 400ms ease both',
  }}>
    <div style={{ padding: '16px 18px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--acc)', color: 'oklch(0.16 0.02 165)',
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}><Icon name="pr" size={20}/></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <Tag tone="accent">PR #{number}</Tag>
          <Tag tone="ok"><Icon name="check" size={10}/>merged-ready</Tag>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-0)', letterSpacing: '-0.01em' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-2)', marginTop: 3 }}>
          {url}
        </div>
      </div>
      <Btn variant="primary" icon="arrow" size="md">Open on GitHub</Btn>
    </div>
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderTop: '1px solid var(--acc-line)',
      background: 'var(--bg-1)',
    }}>
      {[
        { k: 'files',    v: stats.files,     l: 'files touched' },
        { k: '+',        v: stats.additions, l: 'additions', tone: 'ok' },
        { k: '−',        v: stats.deletions, l: 'deletions', tone: 'err' },
        { k: 'retries',  v: stats.retries,   l: 'debug retries' },
        { k: 'duration', v: stats.duration,  l: 'total time' },
      ].map((s, i) => (
        <div key={i} style={{
          padding: '10px 14px',
          borderRight: i < 4 ? '1px solid var(--line-soft)' : 'none',
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600,
            color: s.tone === 'ok' ? 'var(--ok)' : s.tone === 'err' ? 'var(--err)' : 'var(--fg-0)',
            letterSpacing: '-0.01em',
          }}>{s.k === '+' ? '+' : s.k === '−' ? '−' : ''}{s.v}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{s.l}</div>
        </div>
      ))}
    </div>
  </div>
);
