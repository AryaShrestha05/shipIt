import { useEffect, useRef, useState } from 'react';

// The first thing on /try: an AI-chat-style box. The owner writes about
// their business and attaches a photo (menu, sign, storefront), then sends.
//
// props.onSend({ file, sentence })  → called when they press send (or Enter)
// props.initial                     → { file, sentence } to show again (after an error)
// props.error                       → a message to show above the box
// props.look / props.onChangeLook   → the look picked already, if any

const IDEAS = [
  'A family bakery with fresh sourdough every morning',
  'A barbershop that takes walk-ins',
  'A plant shop with weekend workshops',
];

export default function Composer(props) {
  const initial = props.initial;
  // photo: { file, url } — the attached file and a temporary link to show it.
  const [photo, setPhoto] = useState(function () {
    return initial && initial.file ? { file: initial.file, url: URL.createObjectURL(initial.file) } : null;
  });
  const [sentence, setSentence] = useState(initial ? initial.sentence : '');
  const [dragging, setDragging] = useState(false);
  const [needPhoto, setNeedPhoto] = useState(false); // tried to send without a photo
  const textRef = useRef(null);
  const fileRef = useRef(null);
  const file = photo ? photo.file : null;

  function setPhotoFile(newFile) {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(newFile ? { file: newFile, url: URL.createObjectURL(newFile) } : null);
  }

  // The box grows with what's typed, up to a limit (then it scrolls).
  useEffect(function () {
    const box = textRef.current;
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = Math.min(box.scrollHeight, 220) + 'px';
  }, [sentence]);

  function attach(newFile) {
    if (!newFile || !newFile.type.startsWith('image/')) return;
    setPhotoFile(newFile);
    setNeedPhoto(false);
  }

  function send() {
    if (!file) {
      setNeedPhoto(true);
      return;
    }
    props.onSend({ file: file, sentence: sentence.trim() });
  }

  function onKeyDown(e) {
    // Enter sends; Shift+Enter makes a new line, like other AI chats.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Pasting a screenshot or photo attaches it.
  function onPaste(e) {
    const items = e.clipboardData ? e.clipboardData.files : null;
    if (items && items.length) {
      e.preventDefault();
      attach(items[0]);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    attach(e.dataTransfer.files[0]);
  }

  return (
    <div className="cp">
      <h1 className="ed-headline cp-title">What Will You Build?</h1>
      <p className="ed-lede cp-lede">Add a photo and a few words.</p>

      {props.error ? <p className="ed-error">{props.error}</p> : null}

      <div
        className={'cp-box' + (dragging ? ' is-dragging' : '')}
        onDragOver={function (e) { e.preventDefault(); setDragging(true); }}
        onDragLeave={function () { setDragging(false); }}
        onDrop={onDrop}
        onClick={function () { if (textRef.current) textRef.current.focus(); }}
      >
        {photo ? (
          <div className="cp-attached">
            <img src={photo.url} alt="Your photo" />
            <button
              className="cp-remove"
              title="Remove photo"
              onClick={function (e) { e.stopPropagation(); setPhotoFile(null); }}
            >×</button>
          </div>
        ) : null}

        <textarea
          ref={textRef}
          className="cp-text"
          rows={2}
          value={sentence}
          autoFocus
          placeholder="What's your business? What do you sell, when are you open, what should it feel like?"
          onChange={function (e) { setSentence(e.target.value); }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />

        <div className="cp-bar">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={function (e) { attach(e.target.files[0]); e.target.value = ''; }}
          />
          <button
            className={'cp-attach' + (needPhoto ? ' is-needed' : '')}
            onClick={function (e) { e.stopPropagation(); fileRef.current.click(); }}
          >
            <span aria-hidden="true">＋</span> {file ? 'Change photo' : 'Add photo'}
          </button>
          {props.look ? (
            <span className="cp-look">
              Look: <strong>{props.look}</strong>
              <button className="cp-look-change" onClick={function (e) { e.stopPropagation(); props.onChangeLook(); }}>change</button>
            </span>
          ) : null}
          <span className="cp-spacer" />
          <button
            className="cp-send"
            aria-label="Send"
            disabled={!file && !sentence.trim()}
            onClick={function (e) { e.stopPropagation(); send(); }}
          >↑</button>
        </div>
      </div>

      <p className={'cp-hint' + (needPhoto ? ' is-needed' : '')}>
        {needPhoto ? 'Add a photo first: your menu, sign or storefront.' : 'Drop or paste a photo here · Enter to send · Shift+Enter for a new line'}
      </p>

      {!sentence ? (
        <div className="cp-ideas">
          {IDEAS.map(function (idea) {
            return (
              <button key={idea} className="cp-idea" onClick={function () { setSentence(idea); if (textRef.current) textRef.current.focus(); }}>
                {idea}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
