const express = require('express');
const fs = require('fs');
const path = require('path');
const fill = require('../templates/fill');
const sample = require('../templates/sample');

// Helper routes for the /dev test page only. They let us look at each
// feature on its own before the real editor exists.
const router = express.Router();

// GET /api/dev/template/hearth/index.html — the template filled with Rosie's Bakery
// GET /api/dev/template/hearth/index.html?sample=salon — filled with Studio Nova
router.get('/dev/template/:id/index.html', function (req, res) {
  const id = req.params.id;
  if (!fill.TEMPLATE_IDS.includes(id)) return res.status(404).send('Unknown template');

  let business = sample.SAMPLE_BUSINESS;
  if (req.query.sample === 'salon') business = sample.SAMPLE_SALON;

  const file = path.join(fill.TEMPLATES_DIR, id, 'index.html');
  const html = fill.fillTemplate(fs.readFileSync(file, 'utf8'), business);
  res.type('html').send(html);
});

// GET /api/dev/template/hearth/styles.css — the template's stylesheet as-is
router.get('/dev/template/:id/styles.css', function (req, res) {
  const id = req.params.id;
  if (!fill.TEMPLATE_IDS.includes(id)) return res.status(404).send('Unknown template');

  res.sendFile(path.join(fill.TEMPLATES_DIR, id, 'styles.css'));
});

module.exports = { router: router };
