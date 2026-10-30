import { useState } from 'react';

// Step 1: pick or drop a photo, add one optional sentence, press Build.
// props.onBuild({ file, sentence }) is called when the user presses Build.
export default function PhotoDrop(props) {
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [sentence, setSentence] = useState('');
  const [dragging, setDragging] = useState(false);

  function choose(newFile) {
    if (!newFile || !newFile.type.startsWith('image/')) return;
    setFile(newFile);
    setPreviewSrc(URL.createObjectURL(newFile)); // a temporary link to show the photo
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    choose(e.dataTransfer.files[0]);
  }

  return (
    <div className="ed-photo">
      <p className="ed-kicker">step one</p>
      <h1 className="ed-headline">Show us your business.</h1>
      <p className="ed-lede">A menu, a sign, a storefront. We'll read it and build your website in about a minute.</p>

      <label
        className={'ed-shell ed-drop' + (dragging ? ' is-dragging' : '') + (previewSrc ? ' has-photo' : '')}
        onDragOver={function (e) { e.preventDefault(); setDragging(true); }}
        onDragLeave={function () { setDragging(false); }}
        onDrop={onDrop}
      >
        <input type="file" accept="image/*" hidden onChange={function (e) { choose(e.target.files[0]); }} />
        <span className="ed-core ed-drop-core">
          {previewSrc ? (
            <img src={previewSrc} alt="Your photo" className="ed-drop-img" />
          ) : (
            <span className="ed-drop-empty">
              <span className="ed-drop-icon">＋</span>
              <span>Drop a photo here, or click to choose</span>
            </span>
          )}
        </span>
      </label>

      <input
        className="ed-input"
        value={sentence}
        placeholder="One line about it (optional) — e.g. family bakery since 1987"
        onChange={function (e) { setSentence(e.target.value); }}
      />

      {props.error ? <p className="ed-error">{props.error}</p> : null}

      <button className="ed-btn ed-btn-primary" disabled={!file} onClick={function () { props.onBuild({ file: file, sentence: sentence }); }}>
        Build my site <span className="ed-btn-icon">→</span>
      </button>
    </div>
  );
}
