import { useRef, useState } from 'react';

// Two screenshots on top of each other with a handle to drag between them:
// left of the handle is "before", right is "after".
// props: before, after (image URLs)
export default function BeforeAfter(props) {
  const [split, setSplit] = useState(50); // where the handle is, in % from the left
  const boxRef = useRef(null);
  const draggingRef = useRef(false);

  // Pointer position → handle position, kept between 0% and 100%.
  function moveTo(clientX) {
    const box = boxRef.current.getBoundingClientRect();
    const percent = ((clientX - box.left) / box.width) * 100;
    setSplit(Math.max(0, Math.min(100, percent)));
  }

  return (
    <div
      ref={boxRef}
      className="ba"
      onPointerDown={function (e) { draggingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); moveTo(e.clientX); }}
      onPointerMove={function (e) { if (draggingRef.current) moveTo(e.clientX); }}
      onPointerUp={function () { draggingRef.current = false; }}
    >
      <img className="ba-img" src={props.after} alt="Your site after the changes" draggable="false" />
      {/* "before" sits on top, cut off at the handle */}
      <img
        className="ba-img ba-before"
        src={props.before}
        alt="Your site before the changes"
        draggable="false"
        style={{ clipPath: 'inset(0 ' + (100 - split) + '% 0 0)' }}
      />
      <span className="ba-tag ba-tag-before">before</span>
      <span className="ba-tag ba-tag-after">after</span>
      <div className="ba-handle" style={{ left: split + '%' }}>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(split)}
          aria-label="Compare before and after"
          onChange={function (e) { setSplit(Number(e.target.value)); }}
        />
        <span className="ba-knob" aria-hidden="true">↔</span>
      </div>
    </div>
  );
}
