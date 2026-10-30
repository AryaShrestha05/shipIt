import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import VoiceButton from './VoiceButton';

// The notes in the side rail: one numbered card per pin, with a box to type
// what should change. The numbers match the dots drawn on the site.
//
// props.pins, props.focusId (the pin whose box should get the cursor),
// props.onChange(id, text), props.onRemove(id)
export default function PinList(props) {
  if (props.pins.length === 0) {
    return <p className="ed-empty">Click anything on your site and say what to change. Leave as many notes as you like.</p>;
  }
  return (
    <ol className="ed-pins">
      <AnimatePresence initial={false}>
        {/* One card per pin. i starts at 0, so the number shown is i + 1. */}
        {props.pins.map(function (pin, i) {
          return (
            <Motion.li
              key={pin.id}
              className="ed-pin"
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="ed-pin-top">
                <span className="ed-pin-num">{i + 1}</span>
                <span className="ed-pin-label">{pin.label}</span>
                <button className="ed-pin-remove" title="Remove note" onClick={function () { props.onRemove(pin.id); }}>×</button>
              </div>
              <PinText pin={pin} focused={pin.id === props.focusId} onChange={props.onChange} />
            </Motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}

function PinText(props) {
  const ref = useRef(null);
  const [heardNothing, setHeardNothing] = useState(false);

  // Put the cursor in this box when it's the new (or re-clicked) pin.
  useEffect(function () {
    if (props.focused && ref.current) ref.current.focus();
  }, [props.focused]);

  // Spoken words are added to whatever is already typed.
  function addSpoken(text) {
    setHeardNothing(false);
    const before = props.pin.text.trim();
    props.onChange(props.pin.id, before ? before + ' ' + text : text);
  }

  // Voice didn't work (mic blocked, no audio, Claude key): fall back to typing.
  function voiceFailed() {
    setHeardNothing(true);
    if (ref.current) ref.current.focus();
  }

  return (
    <div>
      <div className="ed-pin-input">
        <textarea
          ref={ref}
          className="ed-pin-text"
          rows={2}
          value={props.pin.text}
          placeholder="Hold the mic and talk, or type: e.g. make this bigger"
          onChange={function (e) { props.onChange(props.pin.id, e.target.value); }}
        />
        <VoiceButton onText={addSpoken} onFail={voiceFailed} />
      </div>
      {heardNothing ? <p className="ed-pin-hint">Couldn't hear that — type it instead.</p> : null}
    </div>
  );
}
