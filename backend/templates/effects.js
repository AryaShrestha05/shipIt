// Motion for ShipIt sites. Written from scratch in plain JavaScript (the ideas
// are inspired by React Bits). Every effect is optional: without this file,
// or with "reduce motion" turned on, the page is complete and still.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Runs `onEnter` once, the first time an element scrolls into view.
  const watcher = new IntersectionObserver(function (entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      watcher.unobserve(entry.target);
      entry.target.onEnter();
    }
  }, { threshold: 0.15 });

  function whenVisible(element, onEnter) {
    element.onEnter = onEnter;
    watcher.observe(element);
  }

  // 1. Split letters: each letter of [data-split] rises in, one after another.
  // Letters are grouped per word so a line never breaks inside a word.
  document.querySelectorAll('[data-split]').forEach(function (element) {
    const text = element.textContent.trim();
    element.textContent = '';
    element.setAttribute('aria-label', text);
    const letters = [];
    const words = text.split(/\s+/);
    for (let w = 0; w < words.length; w++) {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'split-word';
      wordSpan.setAttribute('aria-hidden', 'true');
      for (const letter of words[w]) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = letter;
        span.style.transitionDelay = (letters.length * 35) + 'ms';
        wordSpan.appendChild(span);
        letters.push(span);
      }
      element.appendChild(wordSpan);
      if (w < words.length - 1) element.appendChild(document.createTextNode(' '));
    }
    whenVisible(element, function () {
      letters.forEach(function (span) { span.classList.add('is-in'); });
    });
  });

  // 2. Blur words: each word of [data-blur] comes into focus in turn.
  document.querySelectorAll('[data-blur]').forEach(function (element) {
    const words = element.textContent.trim().split(/\s+/);
    element.textContent = '';
    const spans = words.map(function (word, i) {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      span.style.transitionDelay = (i * 60) + 'ms';
      element.appendChild(span);
      element.appendChild(document.createTextNode(' '));
      return span;
    });
    whenVisible(element, function () {
      spans.forEach(function (span) { span.classList.add('is-in'); });
    });
  });

  // 3. Reveal: sections fade up as they scroll in.
  document.querySelectorAll('[data-reveal]').forEach(function (element) {
    element.classList.add('will-reveal');
    whenVisible(element, function () { element.classList.add('is-in'); });
  });

  // 4. Marquee: copy the row once so the loop has no gap.
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  // The rest follow the mouse, so skip them on touch screens.
  if (!window.matchMedia('(hover: hover)').matches) return;

  // 5. Spotlight: a soft glow follows the cursor inside cards.
  document.querySelectorAll('.spotlight').forEach(function (card) {
    card.addEventListener('pointermove', function (event) {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', (event.clientX - box.left) + 'px');
      card.style.setProperty('--my', (event.clientY - box.top) + 'px');
    });
  });

  // 6. Tilt: cards lean toward the cursor in 3D.
  document.querySelectorAll('.tilt').forEach(function (card) {
    const resting = getComputedStyle(card).transform;
    card.addEventListener('pointermove', function (event) {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.transform = 'perspective(800px) rotateX(' + (-y * 8) + 'deg) rotateY(' + (x * 10) + 'deg) scale(1.02)';
    });
    card.addEventListener('pointerleave', function () {
      card.style.transform = resting === 'none' ? '' : resting;
    });
  });

  // 7. Magnetic buttons: drift slightly toward the cursor.
  document.querySelectorAll('.magnetic').forEach(function (button) {
    button.addEventListener('pointermove', function (event) {
      const box = button.getBoundingClientRect();
      const x = event.clientX - box.left - box.width / 2;
      const y = event.clientY - box.top - box.height / 2;
      button.style.transform = 'translate(' + (x * 0.18) + 'px, ' + (y * 0.25) + 'px)';
    });
    button.addEventListener('pointerleave', function () {
      button.style.transform = '';
    });
  });
})();
