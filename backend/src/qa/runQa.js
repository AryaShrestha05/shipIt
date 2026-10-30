const path = require('path');
const playwright = require('playwright');

// Opens a site in a real (hidden) Chrome and checks it the way a customer
// would find problems. Each check has a plain-English label for the stage.
//
//   runQa({ url, expectedSids, shotsDir })
//     → { checks: [{ id, label, ok, detail }], shots: { desktop, phone } }
//
// expectedSids: the name tags the site had before a change. If an edit
// removed one, the click-to-edit feature would break for that part.

const LABELS = {
  links: 'every button and link goes somewhere',
  console: 'no errors when the page loads',
  phone: 'fits on a phone screen',
  images: 'all images load',
  sids: 'nothing editable went missing',
};

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

function check(id, problems) {
  return { id: id, label: LABELS[id], ok: problems.length === 0, detail: problems.join('; ') };
}

// Runs inside the page: every link that points to a spot on the same page
// ("#visit") must have that spot; empty links go nowhere.
function findDeadLinks() {
  const dead = [];
  document.querySelectorAll('a').forEach(function (a) {
    const href = a.getAttribute('href');
    const name = (a.textContent || '').replace(/\s+/g, ' ').trim() || a.getAttribute('data-sid') || 'a link';
    if (href === null || href === '' || href === '#') {
      dead.push('"' + name + '" has no destination');
    } else if (href.startsWith('#') && !document.getElementById(href.slice(1))) {
      dead.push('"' + name + '" points to ' + href + ', which does not exist');
    }
  });
  return dead;
}

function findBrokenImages() {
  const broken = [];
  document.querySelectorAll('img').forEach(function (img) {
    if (!img.complete || img.naturalWidth === 0) broken.push(img.getAttribute('src') || 'an image');
  });
  return broken;
}

function findMissingSids(sids) {
  return sids.filter(function (sid) { return !document.querySelector('[data-sid="' + sid + '"]'); });
}

async function openPage(browser, url, viewport) {
  // reducedMotion: the sites' scroll animations are skipped, so everything
  // is visible right away (otherwise parts are hidden until scrolled to).
  const context = await browser.newContext({ viewport: viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  // Collect JavaScript errors the page throws while loading.
  page.on('pageerror', function (err) { errors.push(err.message); });
  page.on('console', function (msg) {
    // A file that failed to load is reported by its own check (images),
    // so it isn't counted twice here.
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) errors.push(msg.text());
  });
  await page.goto(url, { waitUntil: 'load', timeout: 20000 });
  return { page: page, errors: errors };
}

async function runQa(options) {
  const expectedSids = options.expectedSids || [];
  // Start a hidden Chrome. One browser is reused for both sizes.
  const browser = await playwright.chromium.launch();
  try {
    const desktop = await openPage(browser, options.url, DESKTOP);
    // evaluate runs findDeadLinks INSIDE the page, then hands its result back to us.
    const deadLinks = await desktop.page.evaluate(findDeadLinks);
    const brokenImages = await desktop.page.evaluate(findBrokenImages);
    const missingSids = await desktop.page.evaluate(findMissingSids, expectedSids);
    const desktopShot = path.join(options.shotsDir, 'desktop.png');
    await desktop.page.screenshot({ path: desktopShot });

    const phone = await openPage(browser, options.url, PHONE);
    // How wide the page really is; wider than the phone means sideways scrolling.
    const pageWidth = await phone.page.evaluate(function () { return document.documentElement.scrollWidth; });
    const phoneShot = path.join(options.shotsDir, 'phone.png');
    await phone.page.screenshot({ path: phoneShot });

    const tooWide = pageWidth > PHONE.width ? ['the page is ' + pageWidth + 'px wide on a ' + PHONE.width + 'px phone'] : [];
    const missing = missingSids.map(function (sid) { return sid + ' is gone'; });

    return {
      checks: [
        check('links', deadLinks),
        check('console', desktop.errors),
        check('phone', tooWide),
        check('images', brokenImages.map(function (src) { return src + ' did not load'; })),
        check('sids', missing),
      ],
      shots: { desktop: desktopShot, phone: phoneShot },
    };
  } finally {
    // Always close Chrome, even if a check crashed (this is inside finally).
    await browser.close();
  }
}

module.exports = { runQa: runQa, LABELS: LABELS };
