const express = require('express');
const compose = require('../templates/compose');
const sample = require('../templates/sample');

// Helper routes for the /dev test page only. They let us look at each
// feature on its own before the real editor exists.
const router = express.Router();

function sampleFor(req) {
  if (req.query.sample === 'salon') return sample.SAMPLE_SALON;
  return sample.SAMPLE_BUSINESS;
}

// GET /api/dev/sections — every theme and section variant we have
router.get('/dev/sections', function (req, res) {
  res.json({ themes: Object.keys(compose.THEMES), sections: compose.SECTION_IDS });
});

// GET /api/dev/layout?sample=salon — the layout ShipIt would pick on its own
router.get('/dev/layout', function (req, res) {
  res.json(compose.pickLayout(sampleFor(req)));
});

// GET /api/dev/site/noir/index.html?sample=salon&sections=hero-giant,items-list
// A composed site. Without ?sections it uses the automatic layout's sections.
router.get('/dev/site/:theme/index.html', function (req, res) {
  const business = sampleFor(req);
  let sections = compose.pickLayout(business).sections;
  if (req.query.sections) sections = String(req.query.sections).split(',');

  const html = compose.composeSite({ theme: req.params.theme, sections: sections }, business);
  res.type('html').send(html);
});

// GET /api/dev/site/noir/theme.css (also base.css, effects.js)
router.get('/dev/site/:theme/:file', function (req, res) {
  const files = compose.siteFiles(req.params.theme);
  for (const file of files) {
    if (file.to === req.params.file) return res.sendFile(file.from);
  }
  res.status(404).send('Not found');
});

module.exports = { router: router };
