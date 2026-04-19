import { useRef, useState, useEffect, Fragment } from 'react';
import { Icon } from './Icon';
import { Tag } from './primitives/Tag';
import { AGENT_NODES } from '../data/nodes';

export const Pipeline = ({ currentPhase, completed, running }) => {
  const ref = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setCompact(w < 520);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      padding: '18px 20px 16px',
      borderBottom: '1px solid var(--line-soft)',
      background: 'var(--bg-0)', minWidth: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>Pipeline</div>
          <div style={{ fontSize: 14, color: 'var(--fg-1)', fontWeight: 500, marginTop: 2 }}>
            {running ? 'Autonomous loop active'
              : completed.length === AGENT_NODES.length ? 'Shipped' : 'Idle'}
          </div>
        </div>
        {running && (
          <Tag tone="accent">
            <span style={{
              width: 6, height: 6, borderRadius: 99, background: 'var(--acc)',
              animation: 'pulse-accent 1.4s infinite',
            }}/>
            streaming
          </Tag>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 0 }}>
        {AGENT_NODES.map((node, i) => {
          const isDone = completed.includes(node.id);
          const isActive = currentPhase === node.id;
          return (
            <Fragment key={node.id}>
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', gap: 8, position: 'relative',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'grid', placeItems: 'center',
                  background: isActive ? 'var(--acc-soft)' : isDone ? 'var(--bg-2)' : 'var(--bg-1)',
                  color: isActive ? 'var(--acc)' : isDone ? 'var(--fg-1)' : 'var(--fg-3)',
                  border: `1px solid ${isActive ? 'var(--acc-line)' : isDone ? 'var(--line)' : 'var(--line-soft)'}`,
                  position: 'relative',
                  boxShadow: isActive ? '0 0 24px var(--acc-soft)' : 'none',
                  transition: 'all 300ms',
                }}>
                  {isDone && !isActive ? <Icon name="check" size={17} /> : <Icon name={node.icon} size={16} />}
                  {isActive && (
                    <span style={{
                      position: 'absolute', inset: -2,
                      borderRadius: 12, border: '2px solid var(--acc)',
                      opacity: 0.5, animation: 'ring 1.6s infinite ease-out',
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
                <div style={{ minWidth: 0, width: '100%' }}>
                  <div style={{
                    fontSize: compact ? 11.5 : 12.5, fontWeight: 600,
                    color: isActive ? 'var(--fg-0)' : isDone ? 'var(--fg-1)' : 'var(--fg-3)',
                    letterSpacing: '-0.005em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{node.label}</div>
                  {!compact && (
                    <div style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 1, lineHeight: 1.3 }}>
                      {node.sub}
                    </div>
                  )}
                </div>
              </div>
              {i < AGENT_NODES.length - 1 && (
                <div style={{
                  width: '100%', maxWidth: 40, minWidth: 8, paddingTop: 17, flexShrink: 1,
                  display: 'flex', alignItems: 'center',
                }}>
                  <div style={{
                    flex: 1, height: 2, borderRadius: 2,
                    background: isDone || (isActive && i === AGENT_NODES.findIndex(n => n.id === currentPhase))
                      ? 'linear-gradient(90deg, var(--line) 0%, var(--acc-line) 100%)'
                      : 'var(--line-soft)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {isActive && i !== AGENT_NODES.length - 1 && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(90deg, transparent 0%, var(--acc) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer-bg 1.6s infinite',
                      }}/>
                    )}
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
