import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from '../components/TopBar';
import { RunSpec } from '../components/RunSpec';
import { Pipeline } from '../components/Pipeline';
import { Stream } from '../components/Stream';
import { RightPanel } from '../components/RightPanel';
import { AGENT_NODES } from '../data/nodes';
import { DEMO_TASK } from '../data/timeline';

const PHASE_BY_TOOL = {
  read_file: 'plan',
  write_file: 'code',
  run_command: 'verify',
};

const PHASE_LABEL = {
  plan: 'Planner online',
  code: 'Coder online',
  verify: 'Verifier online',
  ship: 'Shipping',
};

const formatArgs = (args) => {
  if (!args) return '';
  if (args.file_path) return args.file_path;
  if (args.command) return args.command;
  return JSON.stringify(args);
};

export default function Agent() {
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [repo, setRepo] = useState(DEMO_TASK.repo);
  const [prompt, setPrompt] = useState(DEMO_TASK.prompt);
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const h = () => setVw(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const sidebarW = vw < 1100 ? 260 : vw < 1280 ? 290 : 320;

  const run = useCallback(async () => {
    abortRef.current?.abort();
    setEvents([]);
    setRunning(true);
    setDone(false);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const argsByStep = new Map();
    let phase = null;

    const push = (ev) => setEvents(prev => [...prev, ev]);

    const enterPhase = (next) => {
      if (next && next !== phase) {
        phase = next;
        push({ kind: 'phase', phase, text: PHASE_LABEL[phase] || phase });
      }
    };

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('no response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          let ev;
          try { ev = JSON.parse(payload); } catch { continue; }

          if (ev.type === 'user_prompt') {
            enterPhase('plan');
            push({ kind: 'log', level: 'info', text: ev.content, phase });
          } else if (ev.type === 'tool_call') {
            argsByStep.set(ev.step, ev.args);
            enterPhase(PHASE_BY_TOOL[ev.name]);
            push({ kind: 'log', level: 'info', text: `→ ${ev.name}(${formatArgs(ev.args)})`, phase });
          } else if (ev.type === 'tool_result') {
            const args = argsByStep.get(ev.step) ?? {};
            argsByStep.delete(ev.step);
            push({ kind: 'tool', name: ev.name, arg: formatArgs(args), out: String(ev.output ?? ''), phase });
          } else if (ev.type === 'done') {
            enterPhase('ship');
            push({ kind: 'log', level: 'ok', text: ev.text || 'done', phase });
          } else if (ev.type === 'error') {
            push({ kind: 'log', level: 'warn', text: `Error: ${ev.message}`, phase });
          }
        }
      }

      setRunning(false);
      setDone(true);
    } catch (err) {
      if (err.name === 'AbortError') {
        setRunning(false);
        return;
      }
      push({ kind: 'log', level: 'warn', text: `Stream failed: ${err.message}`, phase });
      setRunning(false);
      setDone(true);
    }
  }, [prompt]);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setEvents([]);
    setRunning(false);
    setDone(false);
  };

  useEffect(() => () => abortRef.current?.abort(), []);

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
