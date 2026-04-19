import { useState } from 'react';
import { Icon } from '../Icon';
import { Tag } from '../primitives/Tag';

export const EventTest = ({ name, status, ms, err }) => {
  const [open, setOpen] = useState(status === 'fail');
  const tone = status === 'pass' ? 'ok' : 'err';
  return (
    <div style={{ margin: '3px 22px', animation: 'slide-up 200ms ease both' }}>
      <button onClick={() => err && setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        background: status === 'fail' ? 'oklch(0.72 0.18 25 / 0.06)' : 'transparent',
        border: `1px solid ${status === 'fail' ? 'oklch(0.72 0.18 25 / 0.25)' : 'var(--line-soft)'}`,
        borderRadius: 6, padding: '6px 11px',
        cursor: err ? 'pointer' : 'default',
        color: 'inherit', textAlign: 'left',
      }}>
        <Tag tone={tone}>
          {status === 'pass' ? <Icon name="check" size={10}/> : <Icon name="x" size={10}/>}
          {status}
        </Tag>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-1)', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)' }}>{ms}ms</span>
      </button>
      {open && err && (
        <pre style={{
          margin: '4px 0 0', padding: '9px 11px',
          background: 'oklch(0.72 0.18 25 / 0.06)',
          border: '1px solid oklch(0.72 0.18 25 / 0.25)',
          borderRadius: 6,
          fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--err)',
          whiteSpace: 'pre-wrap',
        }}>{err}</pre>
      )}
    </div>
  );
};
