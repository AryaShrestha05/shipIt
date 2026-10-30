const express = require('express');
const fs = require('fs');
const path = require('path');
const fill = require('../templates/fill');
const sample = require('../templates/sample');

// Helper routes for the /dev test page only. They let us look at each
// feature on its own before the real editor exists.
const router = express.Router();

// GET /api/dev/template/hearth/index.html — the template filled with Rosie's Bakery
router.get('/dev/template/:id/index.html', function (req, res) {
  const id = req.params.id;
  if (!fill.TEMPLATE_IDS.includes(id)) return res.status(404).send('Unknown template');

  const file = path.join(fill.TEMPLATES_DIR, id, 'index.html');
  const html = fill.fillTemplate(fs.readFileSync(file, 'utf8'), sample.SAMPLE_BUSINESS);
  res.type('html').send(html);
});

// GET /api/dev/template/hearth/styles.css — the template's stylesheet as-is
router.get('/dev/template/:id/styles.css', function (req, res) {
  const id = req.params.id;
  if (!fill.TEMPLATE_IDS.includes(id)) return res.status(404).send('Unknown template');

  res.sendFile(path.join(fill.TEMPLATES_DIR, id, 'styles.css'));
});

module.exports = { router: router };
