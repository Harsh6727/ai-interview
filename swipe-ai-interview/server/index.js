import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { registerExtractRoutes } from './routes/extract.js';
import { registerTestGenerateRoutes } from './routes/test-generate.js';
import { registerTestEvaluateRoutes } from './routes/test-evaluate.js';
import { registerTestSummaryRoutes } from './routes/test-summary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isDevelopment = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (isDevelopment) {
  app.use(cors({ origin: true }));
}

registerExtractRoutes(app);
registerTestGenerateRoutes(app);
registerTestEvaluateRoutes(app);
registerTestSummaryRoutes(app);

if (!isDevelopment) {
  const distPath = path.resolve(__dirname, '../dist');
  const indexHtml = path.join(distPath, 'index.html');

  if (fs.existsSync(distPath) && fs.existsSync(indexHtml)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(indexHtml);
    });
  }
}

app.listen(port, () => {
  console.log(`[server] listening at http://localhost:${port}`);
});
