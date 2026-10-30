const express = require('express');
const fs = require('fs');
const path = require('path');
const compose = require('../site/compose');
const workspace = require('../workspace/workspace');
const sample = require('../site/sample');

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

// POST /api/dev/run?sample=salon — Feature 4: start a run and build its v1
router.post('/dev/run', function (req, res) {
  const business = sampleFor(req);
  const runId = workspace.createRun();
  compose.writeSite(workspace.versionDir(runId, 1), compose.pickLayout(business), business);
  res.json({ runId: runId, version: 1, previewUrl: workspace.previewUrl(runId, 1) });
});

// POST /api/dev/run/ab12cd34/next — copy the latest version to a new one and
// tag its title "(vN)", so we can see that older versions stay untouched.
router.post('/dev/run/:runId/next', function (req, res) {
  const runId = req.params.runId;
  if (!workspace.runExists(runId)) return res.status(404).json({ error: 'Unknown run' });

  const from = workspace.latestVersion(runId);
  const to = from + 1;
  const dir = workspace.copyVersion(runId, from, to);
  const file = path.join(dir, 'index.html');
  const html = fs.readFileSync(file, 'utf8').replace('</h1>', ' (v' + to + ')</h1>');
  fs.writeFileSync(file, html, 'utf8');
  res.json({ runId: runId, version: to, previewUrl: workspace.previewUrl(runId, to) });
});

module.exports = { router: router };
