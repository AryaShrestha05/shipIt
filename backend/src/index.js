require('dotenv').config();
const express = require('express');
const cors = require('cors');

const runRouter = require('./routes/run');
const dev = require('./routes/dev');
const blocks = require('./routes/blocks');
const aiRoutes = require('./routes/ai');
const build = require('./routes/build');
const transcribe = require('./routes/transcribe');
const workspace = require('./workspace/workspace');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' })); // photos and voice clips arrive as text

// Every built site version, e.g. /preview/ab12cd34/v1/index.html
app.use('/preview', express.static(workspace.WORKSPACES_DIR));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', runRouter);
app.use('/api', dev.router);
app.use('/api', blocks.router);
app.use('/api', aiRoutes.createAiRouter());
app.use('/api', build.createBuildRouter());
app.use('/api', transcribe.createTranscribeRouter());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Shipit backend running on port ${PORT}`));
