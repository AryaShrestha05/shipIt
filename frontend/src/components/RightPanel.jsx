import { Tag } from './primitives/Tag';
import { Card, Empty, Stat, Row, ProgressBar } from './primitives/Card';
import { Icon } from './Icon';
import { AGENT_NODES } from '../data/nodes';

export const RightPanel = ({ width = 300, events, currentPhase, running, done }) => {
  const testResults = events.filter(e => e.kind === 'test');
  const passed = testResults.filter(t => t.status === 'pass').length;
  const failed = testResults.filter(t => t.status === 'fail').length;
  const retries = events.filter(e => e.kind === 'log' && /retry/i.test(e.text || '')).length;
  const filesTouched = [...new Set(
    events.filter(e => e.kind === 'tool' && e.name === 'write_file').map(e => e.arg)
  )];
  const diffEvents = events.filter(e => e.kind === 'diff');
  const totalAdd = diffEvents.reduce((s, d) => s + d.hunks.filter(h => h.kind === 'add').length, 0);
  const totalDel = diffEvents.reduce((s, d) => s + d.hunks.filter(h => h.kind === 'del').length, 0);

  return (
    <aside style={{
      width, borderLeft: '1px solid var(--line-soft)',
      background: 'var(--bg-0)', padding: 18,
      display: 'flex', flexDirection: 'column', gap: 14,
      flexShrink: 0, overflow: 'auto',
    }}>
      <div style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--fg-3)', fontWeight: 600,
      }}>Verification</div>

      <Card title="Tests" icon="verify" action={
        testResults.length > 0 && (
          <Tag tone={failed > 0 ? 'err' : 'ok'}>
            {failed > 0 ? `${failed} fail` : `${passed} pass`}
          </Tag>
        )
      }>
        {testResults.length === 0 ? (
          <Empty text="No tests run yet"/>
        ) : (
          <>
            <ProgressBar passed={passed} failed={failed} total={testResults.length}/>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: 'var(--mono)', fontSize: 12 }}>
              <Stat label="passed" value={passed} tone="ok"/>
              <Stat label="failed" value={failed} tone={failed > 0 ? 'err' : 'neutral'}/>
              <Stat label="retries" value={retries} tone="neutral"/>
            </div>
          </>
        )}
      </Card>

      <Card title="Files touched" icon="file" action={
        filesTouched.length > 0 && <Tag>{filesTouched.length}</Tag>
      }>
        {filesTouched.length === 0 ? (
          <Empty text="No files changed"/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filesTouched.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 7px', borderRadius: 5,
                background: 'var(--bg-1)', border: '1px solid var(--line-soft)',
                fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-1)',
              }}>
                <Icon name="file" size={11}/>
                <span style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Diff" icon="code">
        <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--mono)', fontSize: 12 }}>
          <Stat label="additions" value={`+${totalAdd}`} tone="ok"/>
          <Stat label="deletions" value={`−${totalDel}`} tone="err"/>
          <Stat label="files" value={diffEvents.length} tone="neutral"/>
        </div>
      </Card>

      <Card title="Agent state" icon="plan">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row k="phase" v={running
            ? (AGENT_NODES.find(n => n.id === currentPhase)?.label || '—')
            : done ? 'complete' : 'idle'}
            tone={running ? 'accent' : done ? 'ok' : 'neutral'}/>
          <Row k="model"   v="gemini-2.5-flash"/>
          <Row k="tools"   v="5 enabled"/>
          <Row k="sandbox" v="ephemeral"/>
        </div>
      </Card>

      <div style={{ flex: 1 }}/>

      <div style={{
        padding: 11, borderRadius: 8,
        background: 'var(--bg-1)', border: '1px dashed var(--line)',
        fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.55,
        fontFamily: 'var(--mono)',
      }}>
        Every action is auditable. Scroll the log for the full tool-call trace.
      </div>
    </aside>
  );
};
