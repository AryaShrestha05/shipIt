require('dotenv').config();
const express = require('express');
const cors = require('cors');

const runRouter = require('./routes/run');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', runRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Shipit backend running on port ${PORT}`));
