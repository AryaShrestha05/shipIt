// Reads backend/.env into process.env (e.g. process.env.GEMINI_API_KEY). Runs first so every file can see it.
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const dev = require('./routes/dev');
const blocks = require('./routes/blocks');
const aiRoutes = require('./routes/ai');
const build = require('./routes/build');
const transcribe = require('./routes/transcribe');
const shipRoutes = require('./routes/ship');
const workspace = require('./workspace/workspace');

// app is the server. Each app.use(...) below adds a step that runs on every request.
const app = express();
// Lets the frontend (on a different port, 5173) call this server.
app.use(cors());
app.use(express.json({ limit: '15mb' })); // photos and voice clips arrive as text

// Every built site version, e.g. /preview/ab12cd34/v1/index.html
app.use('/preview', express.static(workspace.WORKSPACES_DIR));

// Visit /health to check the server is alive.
app.get('/health', (req, res) => res.json({ status: 'ok' }));
// Plug in each route file under /api: '/build' inside build.js becomes POST /api/build.
app.use('/api', dev.router);
app.use('/api', blocks.router);
app.use('/api', aiRoutes.createAiRouter());
app.use('/api', build.createBuildRouter());
app.use('/api', transcribe.createTranscribeRouter());
app.use('/api', shipRoutes.createShipRouter());

// The port from .env, or 3001 if it isn't set (|| means "or, if empty").
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Shipit backend running on port ${PORT}`));
