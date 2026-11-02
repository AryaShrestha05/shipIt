// After Ship: "here's what I changed and what I tested", in plain English.
// props: result (the 'shipped' event), onContinue, onViewSite

export default function ShipResult(props) {
  const summary = props.result.summary;
  const passed = summary.tests.filter(function (t) { return t.ok; }).length;
  const allPassed = passed === summary.tests.length;

  return (
    <div className="sr">
      <p className="ed-kicker">shipped · v{props.result.version}</p>
      <h2 className="sr-title">{allPassed ? 'Done. Everything works.' : 'Done, with one thing to check.'}</h2>

      <p className="sr-head">What I changed</p>
      <ul className="sr-list">
        {summary.changes.map(function (line, i) {
          return <li key={i}>{line}</li>;
        })}
      </ul>

      <p className="sr-head">What I tested · {passed} of {summary.tests.length} passed</p>
      <ul className="sr-list sr-tests">
        {summary.tests.map(function (test) {
          return (
            <li key={test.id} className={test.ok ? 'is-pass' : 'is-fail'}>
              <span aria-hidden="true">{test.ok ? '✓' : '✗'}</span> {test.label}
              {test.ok ? null : <em className="sp-detail">{test.detail}</em>}
            </li>
          );
        })}
      </ul>

      <div className="sr-actions">
        <button className="ed-btn ed-btn-primary" onClick={props.onContinue}>Keep editing</button>
        <button className="ed-btn" onClick={props.onViewSite}>Open the site ↗</button>
      </div>
    </div>
  );
}
