import { Icon } from './Icon';
import { Btn } from './primitives/Btn';

const Picker = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 500 }}>{label}</label>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 11px', background: 'var(--bg-1)', border: '1px solid var(--line-soft)',
      borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12,
      color: 'var(--fg-1)', cursor: 'pointer',
    }}>
      {value}
      <Icon name="chevron" size={12}/>
    </div>
  </div>
);

export const RunSpec = ({
  width = 300, repo, prompt, onRun, onReset, running, done,
  onChangePrompt, onChangeRepo,
}) => (
  <aside style={{
    width, borderRight: '1px solid var(--line-soft)',
    background: 'var(--bg-0)', padding: 18,
    display: 'flex', flexDirection: 'column', gap: 14,
    flexShrink: 0, overflow: 'auto',
  }}>
    <div>
      <div style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--fg-3)', fontWeight: 600, marginBottom: 6,
      }}>New run</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.015em' }}>
        Describe a task.<br/>
        <span style={{ color: 'var(--fg-2)' }}>Shipit handles the rest.</span>
      </h2>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="git" size={12}/> Repository
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 11px',
        background: 'var(--bg-1)', border: '1px solid var(--line-soft)',
        borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12.5,
      }}>
        <span style={{ color: 'var(--fg-3)' }}>github.com/</span>
        <input
          value={repo}
          onChange={(e) => onChangeRepo(e.target.value)}
          disabled={running}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--fg-0)', fontFamily: 'var(--mono)', fontSize: 12.5,
            minWidth: 0,
          }}
        />
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="spark" size={12}/> Task
      </label>
      <textarea
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        disabled={running}
        rows={4}
        placeholder="e.g. Add email validation to the signup form…"
        style={{
          background: 'var(--bg-1)', border: '1px solid var(--line-soft)',
          borderRadius: 8, padding: '10px 12px',
          color: 'var(--fg-0)', fontFamily: 'var(--sans)', fontSize: 13,
          resize: 'none', outline: 'none', lineHeight: 1.5,
        }}
      />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <Picker label="Base branch" value="main" />
      <Picker label="Max retries" value="3" />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 500 }}>Velocity tier</label>
      <div style={{
        display: 'flex', gap: 4, padding: 3, background: 'var(--bg-1)',
        border: '1px solid var(--line-soft)', borderRadius: 8,
      }}>
        {[
          { id: 'draft', label: 'Draft', sub: 'no tests' },
          { id: 'ship',  label: 'Ship',  sub: 'full loop', active: true },
          { id: 'strict',label: 'Strict',sub: 'CI + review' },
        ].map(t => (
          <button key={t.id} style={{
            flex: 1, background: t.active ? 'var(--bg-3)' : 'transparent',
            border: t.active ? '1px solid var(--line)' : '1px solid transparent',
            borderRadius: 6, padding: '6px 4px',
            color: t.active ? 'var(--fg-0)' : 'var(--fg-2)',
            cursor: 'pointer', fontFamily: 'var(--sans)',
            display: 'flex', flexDirection: 'column', gap: 1,
            boxShadow: t.active ? '0 1px 0 var(--line)' : 'none',
          }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{t.label}</span>
            <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>{t.sub}</span>
          </button>
        ))}
      </div>
    </div>

    <div style={{ flex: 1 }} />

    <div style={{ display: 'flex', gap: 8 }}>
      {!running && !done && (
        <Btn variant="primary" size="lg" icon="play" onClick={onRun} style={{ flex: 1, justifyContent: 'center' }}>
          Run agent
        </Btn>
      )}
      {running && (
        <Btn variant="solid" size="lg" icon="pause" disabled style={{ flex: 1, justifyContent: 'center' }}>
          Running…
        </Btn>
      )}
      {done && (
        <Btn variant="solid" size="lg" icon="reset" onClick={onReset} style={{ flex: 1, justifyContent: 'center' }}>
          Run again
        </Btn>
      )}
    </div>

    <div style={{
      marginTop: 4, padding: 10, borderRadius: 8,
      background: 'var(--bg-1)', border: '1px solid var(--line-soft)',
      fontSize: 11.5, color: 'var(--fg-2)', lineHeight: 1.55,
    }}>
      <div style={{ color: 'var(--fg-1)', fontWeight: 500, marginBottom: 3 }}>Evidence-first loop</div>
      When tests fail, shipit feeds the exact stack trace back to the coder.
      It patches the bug it saw — not one it imagined.
    </div>
  </aside>
);
