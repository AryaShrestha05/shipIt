import { Icon } from '../Icon';

export const EventDiff = ({ file, hunks }) => (
  <div style={{
    margin: '4px 22px',
    border: '1px solid var(--line-soft)', borderRadius: 8,
    overflow: 'hidden', animation: 'slide-up 260ms ease both',
    background: 'var(--bg-1)',
  }}>
    <div style={{
      padding: '7px 11px',
      background: 'var(--bg-2)',
      borderBottom: '1px solid var(--line-soft)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <Icon name="file" size={12}/>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-1)' }}>{file}</span>
      <div style={{ flex: 1 }}/>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ok)' }}>
        +{hunks.filter(h => h.kind === 'add').length}
      </span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--err)' }}>
        −{hunks.filter(h => h.kind === 'del').length}
      </span>
    </div>
    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.55 }}>
      {hunks.map((h, i) => {
        const styles = {
          add: { bg: 'oklch(0.82 0.16 150 / 0.08)', fg: 'var(--ok)', prefix: '+' },
          del: { bg: 'oklch(0.72 0.18 25 / 0.08)',  fg: 'var(--err)', prefix: '−' },
          ctx: { bg: 'transparent', fg: 'var(--fg-2)', prefix: ' ' },
        }[h.kind];
        return (
          <div key={i} style={{
            display: 'flex', background: styles.bg, color: styles.fg,
            padding: '2px 0',
          }}>
            <span style={{ width: 26, textAlign: 'center', color: styles.fg, opacity: 0.7, flexShrink: 0 }}>
              {styles.prefix}
            </span>
            <span style={{ flex: 1, whiteSpace: 'pre', overflowX: 'auto' }}>{h.line}</span>
          </div>
        );
      })}
    </div>
  </div>
);
