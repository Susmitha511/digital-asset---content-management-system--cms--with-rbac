import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { seedDatabaseIfEmpty } from './src/server/seed/seedData.js';
import authRoutes from './src/server/routes/authRoutes.js';
import userRoutes from './src/server/routes/userRoutes.js';
import assetRoutes from './src/server/routes/assetRoutes.js';
import contentRoutes from './src/server/routes/contentRoutes.js';
import categoryRoutes from './src/server/routes/categoryRoutes.js';
import accessShareRoutes from './src/server/routes/accessShareRoutes.js';
import roleRoutes from './src/server/routes/roleRoutes.js';
import analyticsAuditRoutes from './src/server/routes/analyticsAuditRoutes.js';
import notificationRoutes from './src/server/routes/notificationRoutes.js';
import settingsRoutes from './src/server/routes/settingsRoutes.js';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

async function bootstrapServer() {
  const app = express();

  // Helmet with configuration compatible with Vite dev & iFrame hosting
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled to prevent blocking Vite client scripts
      frameguard: false // Permitted for iFrame embedding in AI Studio
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );

  // Cookie parser & body parsers
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Seed sample demonstration data on startup
  await seedDatabaseIfEmpty();

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/assets', assetRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api', accessShareRoutes); // /api/access-requests and /api/shares
  app.use('/api/roles', roleRoutes);
  app.use('/api', analyticsAuditRoutes); // /api/dashboard-stats and /api/audit-logs
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      system: 'Digital Asset & Content Management System (CMS) with RBAC',
      timestamp: new Date().toISOString()
    });
  });

  // Centralized Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error handler:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'An internal server error occurred.'
    });
  });

  // Vite Middleware in dev or static serving in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Digital Asset & Content Management System (CMS)`);
    console.log(`🛡️  RBAC & Cyber Security Module Active`);
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

bootstrapServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
