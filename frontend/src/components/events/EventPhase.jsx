import { Icon } from '../Icon';
import { AGENT_NODES } from '../../data/nodes';

export const EventPhase = ({ text, phase }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 22px 8px',
    animation: 'slide-up 240ms ease both',
  }}>
    <div style={{ flex: 1, height: 1, background: 'var(--line-soft)' }}/>
    <div style={{
      fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--acc)', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '3px 9px', borderRadius: 99,
      background: 'var(--acc-soft)', border: '1px solid var(--acc-line)',
    }}>
      <Icon name={AGENT_NODES.find(n => n.id === phase)?.icon || 'dot'} size={11}/>
      {text}
    </div>
    <div style={{ flex: 1, height: 1, background: 'var(--line-soft)' }}/>
  </div>
);
