import { Icon } from '../Icon';
import { Tag } from './Tag';

export const Card = (props) => (
  <div style={{
    background: 'var(--bg-1)', border: '1px solid var(--line-soft)',
    borderRadius: 10, padding: 12,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ color: 'var(--fg-2)' }}><Icon name={props.icon} size={13}/></div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-0)' }}>{props.title}</div>
      <div style={{ flex: 1 }}/>
      {props.action}
    </div>
    {props.children}
  </div>
);

export const Empty = (props) => (
  <div style={{ fontSize: 11.5, color: 'var(--fg-3)', fontFamily: 'var(--mono)', padding: '4px 0' }}>{props.text}</div>
);

export const Stat = (props) => {
  const color = { ok: 'var(--ok)', err: 'var(--err)', neutral: 'var(--fg-0)' }[props.tone] || 'var(--fg-0)';
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: color, letterSpacing: '-0.01em', fontFamily: 'var(--mono)' }}>{props.value}</div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{props.label}</div>
    </div>
  );
};

export const Row = (props) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 11.5, gap: 8 }}>
    <span style={{ color: 'var(--fg-3)', flexShrink: 0 }}>{props.k}</span>
    {props.tone === 'accent' ? <Tag tone="accent">{props.v}</Tag>
     : props.tone === 'ok' ? <Tag tone="ok">{props.v}</Tag>
     : <span style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.v}</span>}
  </div>
);

export const ProgressBar = (props) => {
  const p = (props.passed / props.total) * 100;
  const f = (props.failed / props.total) * 100;
  return (
    <div style={{
      height: 6, background: 'var(--bg-2)', borderRadius: 99,
      overflow: 'hidden', display: 'flex',
    }}>
      <div style={{ width: `${p}%`, background: 'var(--ok)' }}/>
      <div style={{ width: `${f}%`, background: 'var(--err)' }}/>
    </div>
  );
};
