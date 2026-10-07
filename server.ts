import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRoutes from './src/server/routes/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  // Body parsers
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Uploads static directory
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const fs = await import('fs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Mount API router
  app.use('/api', apiRoutes);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (!isProd) {
    // Vite Dev Server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ghorer Shopping Server] running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Error]', err);
  process.exit(1);
});
