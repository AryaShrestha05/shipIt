import { AnimatePresence, motion as Motion } from 'framer-motion';

// Step 2: the live list of what ShipIt is doing while it builds.
// props.lines: ['reading your photo', 'building your site', ...]
// props.business: what the AI read off the photo, once it's known
export default function BuildStatus(props) {
  const lines = props.lines;
  return (
    <div className="ed-building">
      <p className="ed-kicker">building</p>
      <h1 className="ed-headline">{props.business ? props.business.name : 'Reading your photo…'}</h1>
      <ul className="ed-status">
        <AnimatePresence initial={false}>
          {lines.map(function (line, i) {
            // Every line except the last is finished; the last one is still running.
            const done = i < lines.length - 1;
            return (
              <Motion.li
                key={line}
                className={'ed-status-line' + (done ? ' is-done' : '')}
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              >
                <span className="ed-status-dot">{done ? '✓' : ''}</span>
                {line}
              </Motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {props.business ? (
        <p className="ed-found">
          Found {props.business.items.length} items{props.business.hours ? ' · ' + props.business.hours : ''}
        </p>
      ) : null}
    </div>
  );
}
