import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import path from 'node:path';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/requireAuth.js';
import { SqliteSessionStore } from './services/sessionStore.js';

import { authRouter } from './routes/auth.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { widgetsRouter } from './routes/widgets.routes.js';
import { weatherRouter } from './routes/weather.routes.js';
import { stocksRouter } from './routes/stocks.routes.js';
import { linksRouter } from './routes/links.routes.js';
import { rssRouter } from './routes/rss.routes.js';
import { savesRouter } from './routes/saves.routes.js';
import { systemRouter } from './routes/system.routes.js';
import { todosRouter } from './routes/todos.routes.js';

// 'auto' is a value express-session's cookie.secure understands natively: it consults
// req.secure per-request (which reflects X-Forwarded-Proto once 'trust proxy' is set),
// so plain-HTTP LAN access still gets a cookie while HTTPS deployments get 'secure'.
function resolveCookieSecure() {
  if (config.cookieSecure === 'true') return true;
  if (config.cookieSecure === 'false') return false;
  return 'auto';
}

export function createApp({ sessionSecret }) {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          // 'unsafe-inline' on style only: several widgets set inline `style` (e.g.
          // percentage-width progress bars), which CSP treats the same as <style>
          // blocks. No inline <script> is used anywhere, so script-src stays strict.
          styleSrc: ["'self'", "'unsafe-inline'"],
          // https: (not just 'self') because Link widgets can point their icon at any
          // externally-hosted image URL the user enters.
          imgSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          // Helmet merges these directives on top of its own defaults (not a full
          // replacement), and one of those defaults is upgrade-insecure-requests. That
          // silently rewrote every fetch('/api/...') from http: to https: — fatal now
          // that the app is intentionally HTTP-only, since nothing listens on TLS.
          upgradeInsecureRequests: null,
        },
      },
      // Same reasoning: don't tell browsers to remember "always use HTTPS for this
      // host" when the app is deliberately serving plain HTTP.
      hsts: false,
      // Both of these are no-ops on a non-HTTPS, non-localhost origin (Chrome logs a
      // console warning and ignores them) — pure noise now that we're HTTP-only.
      crossOriginOpenerPolicy: false,
      originAgentCluster: false,
    })
  );
  app.use(express.json());
  app.use(
    session({
      store: new SqliteSessionStore(),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: resolveCookieSecure(),
      },
    })
  );

  app.use('/uploads', express.static(path.join(config.uploadsDir)));

  // Unauthenticated on purpose: used by the Dockerfile HEALTHCHECK and by
  // orchestrators/reverse proxies to probe liveness without credentials.
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter);
  app.use('/api/settings', requireAuth, settingsRouter);
  app.use('/api/widgets', requireAuth, widgetsRouter);
  app.use('/api/weather', requireAuth, weatherRouter);
  app.use('/api/stocks', requireAuth, stocksRouter);
  app.use('/api/links', requireAuth, linksRouter);
  app.use('/api/rss', requireAuth, rssRouter);
  app.use('/api/system', requireAuth, systemRouter);
  app.use('/api/todos', requireAuth, todosRouter);
  app.use('/api/saves', requireAuth, savesRouter);

  app.use(express.static(config.publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(config.publicDir, 'index.html'));
  });

  app.use(errorHandler);

  return app;
}
