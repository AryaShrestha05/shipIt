const express = require('express');
const fs = require('fs');
const path = require('path');
const fromRequest = require('../ai/fromRequest');
const extract = require('../vision/extract');
const compose = require('../site/compose');
const workspace = require('../workspace/workspace');
const recorder = require('../runs/recorder');
const sse = require('./sse');

// POST /api/build — photo in, website out.
//
// Body: { imageBase64, mimeType, sentence }
// Streams these events:
//   run        { runId }                — the new run's id
//   status     "reading your photo"
//   extracted  { business }             — what the AI read off the photo
//   status     "building your site"
//   built      { previewUrl, layout }   — the finished site (version 1)
//   error      { message }              — if anything went wrong
//
// deps.aiFromRequest and deps.extract are only swapped out in tests.
function createBuildRouter(deps) {
  if (!deps) deps = {};
  const aiFromRequest = deps.aiFromRequest || fromRequest.aiFromRequest;
  const extractBusiness = deps.extract || extract.extractBusiness;
  const router = express.Router();

  // async lets us use await inside: wait for slow work (the AI) without freezing the server.
  router.post('/build', async function (req, res) {
    // req.body is the JSON the browser sent (express.json in index.js turned it into an object).
    const body = req.body || {};
    if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
      // 400 means "your request is wrong". return stops here, so nothing below runs.
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Check the key before opening the stream, so "no key" is a plain 401.
    let ai;
    try {
      // Builds the AI from the key the browser sent (or the server's own key).
      ai = aiFromRequest(req);
    } catch (err) {
      return res.status(err instanceof fromRequest.NoKeyError ? 401 : 400).json({ error: err.message });
    }

    // From here on the response stays open and we send events one at a time.
    const stream = sse.openSse(res);
    const runId = workspace.createRun();
    const rec = recorder.createRecorder(runId, 'build');

    // Every event goes to the browser and into the recording.
    function send(event) {
      rec.record(event);
      stream.send(event);
    }

    try {
      send({ type: 'run', runId: runId });

      send({ type: 'status', message: 'reading your photo' });
      // await = wait here until the AI has read the photo (a few seconds).
      const business = await extractBusiness(ai, {
        imageBase64: body.imageBase64,
        mimeType: body.mimeType || 'image/jpeg',
        sentence: body.sentence || '',
      });
      send({ type: 'extracted', business: business });

      send({ type: 'status', message: 'building your site' });
      // Pick a theme and sections (the same business always gets the same choice).
      const layout = compose.pickLayout(business);
      const dir = workspace.versionDir(runId, 1);
      // Write index.html + the css/js files into workspaces/<runId>/v1/.
      compose.writeSite(dir, layout, business);
      fs.writeFileSync(path.join(dir, 'business.json'), JSON.stringify(business, null, 2), 'utf8');

      // Keep a copy of v1 next to the recording, so a replay still has the site.
      fs.cpSync(dir, path.join(rec.dir, 'v1'), { recursive: true });
      send({ type: 'built', previewUrl: workspace.previewUrl(runId, 1), layout: layout });
    } catch (err) {
      // Anything that failed above lands here: tell the browser instead of crashing.
      send({ type: 'error', message: err.message });
    } finally {
      // finally runs whether it worked or failed: save the recording, then close the stream.
      rec.save();
      res.end();
    }
  });

  return router;
}

module.exports = { createBuildRouter: createBuildRouter };
