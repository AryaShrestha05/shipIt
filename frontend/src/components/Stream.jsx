import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { EventPhase } from './events/EventPhase';
import { EventLog } from './events/EventLog';
import { EventTool } from './events/EventTool';
import { EventDiff } from './events/EventDiff';
import { EventTest } from './events/EventTest';
import { EventPR } from './events/EventPR';

const StreamingCaret = () => (
  <div style={{
    padding: '6px 22px', fontFamily: 'var(--mono)', fontSize: 12.5,
    color: 'var(--fg-3)', display: 'flex', gap: 8, alignItems: 'center',
  }}>
    <span style={{ color: 'var(--acc)' }}>▎</span>
    <span style={{
      display: 'inline-block', width: 7, height: 14,
      background: 'var(--acc)', animation: 'caret-blink 1s infinite',
    }}/>
    <span style={{ opacity: 0.6 }}>agent working…</span>
  </div>
);

const EmptyState = () => (
  <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--fg-2)' }}>
    <div style={{
      width: 52, height: 52, margin: '0 auto 18px',
      borderRadius: 14, background: 'var(--bg-1)', border: '1px solid var(--line-soft)',
      display: 'grid', placeItems: 'center', color: 'var(--acc)',
    }}>
      <Icon name="bolt" size={22}/>
    </div>
    <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--fg-0)', letterSpacing: '-0.01em' }}>
      Ready to ship.
    </div>
    <div style={{ fontSize: 13, marginTop: 6, maxWidth: 380, margin: '6px auto 0', lineHeight: 1.55 }}>
      Press <span style={{
        fontFamily: 'var(--mono)', color: 'var(--fg-0)', padding: '1px 6px',
        background: 'var(--bg-2)', borderRadius: 4, border: '1px solid var(--line-soft)', fontSize: 11,
      }}>Run agent</span> to watch the autonomous loop in action — plan, code, verify, debug, ship.
    </div>
  </div>
);

export const Stream = ({ events, running, hasStarted }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events.length]);

  return (
    <div ref={ref} style={{
      flex: 1, overflow: 'auto',
      background: 'var(--bg-0)', padding: '8px 0 20px',
    }}>
      {!hasStarted && <EmptyState />}
      {events.map((e, i) => {
        if (e.kind === 'phase') return <EventPhase key={i} text={e.text} phase={e.phase} />;
        if (e.kind === 'log')   return <EventLog key={i} level={e.level} text={e.text} />;
        if (e.kind === 'tool')  return <EventTool key={i} name={e.name} arg={e.arg} out={e.out} />;
        if (e.kind === 'diff')  return <EventDiff key={i} file={e.file} hunks={e.hunks} />;
        if (e.kind === 'test')  return <EventTest key={i} name={e.name} status={e.status} ms={e.ms} err={e.err} />;
        if (e.kind === 'pr')    return <EventPR key={i} {...e} />;
        return null;
      })}
      {running && <StreamingCaret />}
    </div>
  );
};
