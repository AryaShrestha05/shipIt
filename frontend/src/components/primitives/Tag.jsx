export const Tag = ({ children, tone = 'neutral', mono = true, style }) => {
  const tones = {
    neutral: { bg: 'var(--bg-2)', fg: 'var(--fg-1)', bd: 'var(--line)' },
    accent:  { bg: 'var(--acc-soft)', fg: 'var(--acc)', bd: 'var(--acc-line)' },
    ok:      { bg: 'oklch(0.82 0.16 150 / 0.12)', fg: 'var(--ok)', bd: 'oklch(0.82 0.16 150 / 0.3)' },
    warn:    { bg: 'oklch(0.80 0.16 75 / 0.12)',  fg: 'var(--warn)', bd: 'oklch(0.80 0.16 75 / 0.3)' },
    err:     { bg: 'oklch(0.72 0.18 25 / 0.12)',  fg: 'var(--err)',  bd: 'oklch(0.72 0.18 25 / 0.3)' },
  }[tone];
  return (
    <span style={{
      fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
      fontSize: 11, fontWeight: 500,
      padding: '2px 7px', borderRadius: 999,
      background: tones.bg, color: tones.fg,
      border: `1px solid ${tones.bd}`,
      letterSpacing: mono ? '0.02em' : '0',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}</span>
  );
};
