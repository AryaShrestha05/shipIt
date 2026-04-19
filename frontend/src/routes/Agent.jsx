import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from '../components/TopBar';
import { RunSpec } from '../components/RunSpec';
import { Pipeline } from '../components/Pipeline';
import { Stream } from '../components/Stream';
import { RightPanel } from '../components/RightPanel';
import { AGENT_NODES } from '../data/nodes';
import { DEMO_TASK, TIMELINE } from '../data/timeline';

export default function Agent() {
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [repo, setRepo] = useState(DEMO_TASK.repo);
  const [prompt, setPrompt] = useState(DEMO_TASK.prompt);
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    const h = () => setVw(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const sidebarW = vw < 1100 ? 260 : vw < 1280 ? 290 : 320;

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const run = useCallback(() => {
    clearTimers();
    setEvents([]);
    setRunning(true);
    setDone(false);

    TIMELINE.forEach(ev => {
      const t = setTimeout(() => setEvents(prev => [...prev, ev]), ev.t);
      timersRef.current.push(t);
    });

    const finalT = setTimeout(() => {
      setRunning(false);
      setDone(true);
    }, TIMELINE[TIMELINE.length - 1].t + 500);
    timersRef.current.push(finalT);
  }, []);

  const reset = () => {
    clearTimers();
    setEvents([]);
    setRunning(false);
    setDone(false);
  };

  useEffect(() => () => clearTimers(), []);

  const currentPhase = useMemo(() => {
    if (!running && !done) return null;
    return [...events].reverse().find(e => e.phase)?.phase || null;
  }, [events, running, done]);

  const completed = useMemo(() => {
    if (done) return AGENT_NODES.map(n => n.id);
    const order = AGENT_NODES.map(n => n.id);
    const lastIdx = order.findIndex(id => id === currentPhase);
    return order.slice(0, Math.max(0, lastIdx));
  }, [done, currentPhase]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <RunSpec
          width={sidebarW}
          repo={repo} prompt={prompt}
          onChangeRepo={setRepo} onChangePrompt={setPrompt}
          onRun={run} onReset={reset}
          running={running} done={done}
        />
        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'var(--bg-0)', minWidth: 0, overflow: 'hidden',
        }}>
          <Pipeline currentPhase={currentPhase} completed={completed} running={running} />
          <Stream events={events} running={running} hasStarted={events.length > 0} />
        </main>
        <RightPanel
          width={sidebarW}
          events={events}
          currentPhase={currentPhase}
          running={running}
          done={done}
        />
      </div>
    </div>
  );
}
