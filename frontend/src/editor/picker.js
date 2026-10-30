// The React Grab-style picker. It runs inside the website's own page (the
// iframe), because that's where the mouse events happen.
//
// Every editable part of a ShipIt site has a name tag, e.g.
//   <h1 data-sid="hero-title">Rosie's Bakery</h1>
// Hovering draws a box around the tagged part with its name; clicking picks it.

const COLOR = '#7c5cff'; // violet: doesn't clash with any site theme

// From whatever was clicked (maybe a <span> inside the title), walk up to the
// nearest element with a name tag. Returns null if there isn't one.
export function findSidElement(target) {
  let el = target;
  while (el && el.nodeType === 1 && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
    if (el.hasAttribute('data-sid')) return el;
    el = el.parentElement;
  }
  return null;
}

// "hero-title" -> "hero title"
function readableSid(sid) {
  return sid.replace(/-/g, ' ');
}

// The element's own words, tidied up and cut to 40 characters.
function shortLabel(el) {
  const words = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (!words) return readableSid(el.getAttribute('data-sid'));
  return words.length > 40 ? words.slice(0, 39) + '…' : words;
}

// Starts picking on `doc` (the iframe's document).
// options.onPick({ sid, rect, label }) is called on every click on a tagged part.
// Returns detach(), which stops picking and removes everything it added.
export function attachPicker(doc, options) {
  const style = doc.createElement('style');
  style.setAttribute('data-shipit-ui', '');
  style.textContent = '[data-sid] { cursor: pointer; }';
  doc.head.appendChild(style);

  // The hover box and its name tag. pointer-events: none lets clicks go through.
  const box = doc.createElement('div');
  box.setAttribute('data-shipit-ui', '');
  box.style.cssText =
    'position:fixed;z-index:2147483646;pointer-events:none;display:none;' +
    'border:2px solid ' + COLOR + ';border-radius:6px;background:rgba(124,92,255,0.08);' +
    'transition:all 120ms cubic-bezier(0.32,0.72,0,1);';
  const tag = doc.createElement('div');
  tag.style.cssText =
    'position:absolute;left:-2px;bottom:100%;margin-bottom:4px;padding:2px 8px;border-radius:999px;' +
    'background:' + COLOR + ';color:#fff;font:600 11px/1.6 system-ui,sans-serif;white-space:nowrap;';
  box.appendChild(tag);
  doc.body.appendChild(box);

  let hovered = null;

  function showBox(el) {
    hovered = el;
    if (!el) {
      box.style.display = 'none';
      return;
    }
    const rect = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = rect.left - 4 + 'px';
    box.style.top = rect.top - 4 + 'px';
    box.style.width = rect.width + 8 + 'px';
    box.style.height = rect.height + 8 + 'px';
    tag.textContent = readableSid(el.getAttribute('data-sid'));
  }

  function onMove(e) {
    const el = findSidElement(e.target);
    if (el !== hovered) showBox(el);
  }

  function onLeave() {
    showBox(null);
  }

  // The page scrolls under a still mouse, so keep the box on its element.
  function onScroll() {
    if (hovered) showBox(hovered);
  }

  // Capture phase: we see the click before the page does. Links don't
  // navigate and buttons don't fire — in the editor, a click means "pick".
  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = findSidElement(e.target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    options.onPick({
      sid: el.getAttribute('data-sid'),
      rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      label: shortLabel(el),
    });
  }

  doc.addEventListener('mousemove', onMove);
  doc.addEventListener('mouseleave', onLeave);
  doc.addEventListener('scroll', onScroll, true);
  doc.addEventListener('click', onClick, true);

  return function detach() {
    doc.removeEventListener('mousemove', onMove);
    doc.removeEventListener('mouseleave', onLeave);
    doc.removeEventListener('scroll', onScroll, true);
    doc.removeEventListener('click', onClick, true);
    style.remove();
    box.remove();
  };
}

// Draws a numbered dot on the top-left corner of each pinned part. The dots
// live inside the page, so they scroll along with it. Calling it again
// replaces the old dots.
export function drawPins(doc, pins) {
  let layer = doc.getElementById('shipit-pins');
  if (!layer) {
    layer = doc.createElement('div');
    layer.id = 'shipit-pins';
    layer.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483645;pointer-events:none;';
    doc.body.appendChild(layer);
  }
  layer.innerHTML = '';

  const win = doc.defaultView;
  pins.forEach(function (pin, i) {
    const el = doc.querySelector('[data-sid="' + pin.sid + '"]');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dot = doc.createElement('div');
    dot.className = 'shipit-pin';
    dot.textContent = String(i + 1);
    dot.style.cssText =
      'position:absolute;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:999px;' +
      'display:grid;place-items:center;background:' + COLOR + ';color:#fff;' +
      'font:700 12px/1 system-ui,sans-serif;box-shadow:0 0 0 3px #fff,0 6px 16px rgba(0,0,0,0.25);' +
      'left:' + (rect.left + win.scrollX) + 'px;top:' + (rect.top + win.scrollY) + 'px;';
    layer.appendChild(dot);
  });
}
