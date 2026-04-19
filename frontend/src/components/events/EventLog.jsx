export const EventLog = ({ level, text }) => {
  const tones = {
    info: { fg: 'var(--fg-1)', prefix: '·', prefixColor: 'var(--fg-3)' },
    ok:   { fg: 'var(--ok)',   prefix: '✓', prefixColor: 'var(--ok)' },
    warn: { fg: 'var(--warn)', prefix: '!', prefixColor: 'var(--warn)' },
    err:  { fg: 'var(--err)',  prefix: '✗', prefixColor: 'var(--err)' },
    plan: { fg: 'var(--fg-0)', prefix: '◇', prefixColor: 'var(--acc)' },
  }[level || 'info'];

  return (
    <div style={{
      padding: '3px 22px',
      fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.6,
      color: tones.fg, display: 'flex', gap: 10,
      animation: 'slide-up 200ms ease both',
      whiteSpace: 'pre-wrap',
    }}>
      <span style={{ color: tones.prefixColor, fontWeight: 600, flexShrink: 0, width: 10 }}>
        {tones.prefix}
      </span>
      <span style={{ flex: 1 }}>{text}</span>
    </div>
  );
};
