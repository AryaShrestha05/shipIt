const express = require('express');
const compose = require('../site/compose');
const catalog = require('../site/catalog');
const sample = require('../site/sample');

// Routes for the /blocks gallery page.
const router = express.Router();

// GET /api/blocks — every theme and section with its name, description and tier
router.get('/blocks', function (req, res) {
  res.json(catalog.CATALOG);
});

// GET /api/blocks/preview/noir/index.html?section=items-tilt
// One block on its own (plus the shared nav and footer), filled with the sample bakery.
router.get('/blocks/preview/:theme/index.html', function (req, res) {
  const section = String(req.query.section || '');
  if (!compose.SECTION_IDS.includes(section)) return res.status(404).send('Unknown block');

  const html = compose.composeSite({ theme: req.params.theme, sections: [section] }, sample.SAMPLE_BUSINESS);
  // Previews are small and often off-screen, where scroll-reveal never fires,
  // so show every block in its finished state. Hover effects still work.
  const finished = '<style>.will-reveal,.char,.word{opacity:1!important;transform:none!important;filter:none!important}</style>';
  res.type('html').send(html.replace('</head>', finished + '</head>'));
});

// GET /api/blocks/preview/noir/theme.css (also base.css, effects.js)
router.get('/blocks/preview/:theme/:file', function (req, res) {
  for (const file of compose.siteFiles(req.params.theme)) {
    if (file.to === req.params.file) return res.sendFile(file.from);
  }
  res.status(404).send('Not found');
});

module.exports = { router: router };
