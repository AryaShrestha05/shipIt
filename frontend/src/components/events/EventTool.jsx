import { useState } from 'react';
import { Icon } from '../Icon';
import { Tag } from '../primitives/Tag';

export const EventTool = ({ name, arg, out }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      margin: '4px 22px', padding: '8px 11px',
      background: 'var(--bg-1)', border: '1px solid var(--line-soft)',
      borderRadius: 8, animation: 'slide-up 200ms ease both',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        background: 'none', border: 'none', cursor: 'pointer', color: 'inherit',
        padding: 0, textAlign: 'left',
      }}>
        <span style={{
          display: 'inline-flex',
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform 140ms',
        }}>
          <Icon name="chevron" size={11}/>
        </span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11.5,
          color: 'var(--acc)', fontWeight: 500,
        }}>{name}</span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11.5,
          color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>{arg}</span>
        <Tag tone="ok"><Icon name="check" size={10}/>ok</Tag>
      </button>
      {open && (
        <pre style={{
          margin: '8px 0 0', padding: '9px 11px',
          background: 'var(--bg-0)', border: '1px solid var(--line-soft)',
          borderRadius: 6,
          fontFamily: 'var(--mono)', fontSize: 11.5,
          color: 'var(--fg-1)', whiteSpace: 'pre-wrap',
          maxHeight: 180, overflow: 'auto',
        }}>{out}</pre>
      )}
    </div>
  );
};
