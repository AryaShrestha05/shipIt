// While Ship runs: what it's doing right now, and the customer tests
// ticking from "waiting" to ✓ or ✗.
// props: log (lines from the server), checks (latest result of each test), fixRound

// The tests QA runs, in order (same as backend/src/qa/runQa.js).
const TESTS = [
  { id: 'links', label: 'every button and link goes somewhere' },
  { id: 'console', label: 'no errors when the page loads' },
  { id: 'phone', label: 'fits on a phone screen' },
  { id: 'images', label: 'all images load' },
  { id: 'sids', label: 'nothing editable went missing' },
];

export default function ShipProgress(props) {
  const latest = props.log.length ? props.log[props.log.length - 1] : 'starting';

  return (
    <div className="sp">
      <p className="ed-kicker">shipping{props.fixRound ? ' · fix round ' + props.fixRound : ''}</p>
      <p className="sp-now"><span className="sp-pulse" aria-hidden="true" />{latest}…</p>

      <ul className="sp-tests">
        {TESTS.map(function (test) {
          const result = props.checks.find(function (c) { return c.id === test.id; });
          let mark = 'waiting';
          if (result) mark = result.ok ? 'pass' : 'fail';
          return (
            <li key={test.id} className={'sp-test is-' + mark}>
              <span className="sp-mark" aria-hidden="true">{mark === 'pass' ? '✓' : mark === 'fail' ? '✗' : ''}</span>
              <span>
                {test.label}
                {result && !result.ok && result.detail ? <em className="sp-detail">{result.detail}</em> : null}
              </span>
            </li>
          );
        })}
      </ul>

      <ol className="sp-log">
        {props.log.map(function (line, i) {
          return <li key={i}>{line}</li>;
        })}
      </ol>
    </div>
  );
}
