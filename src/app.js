import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import express from 'express';
import { modules } from './modules.js';
import { createService } from './service.js';
import { ApiError, errorHandler } from './errors.js';

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  // El frontend React es otro servicio de Render: habilitar solo su origen
  // exacto mediante FRONTEND_ORIGIN (permite varios, separados por comas).
  const origenes = new Set((process.env.FRONTEND_ORIGIN || '')
    .split(',').map(origen => origen.trim()).filter(Boolean));
  app.use((req, res, next) => {
    const origen = req.get('Origin');
    if (origen && origenes.has(origen)) {
      res.set('Access-Control-Allow-Origin', origen);
      res.vary('Origin');
      res.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });
  app.set('query parser', 'simple');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
      return next(new ApiError(415, 'Usa Content-Type: application/json.'));
    }
    next();
  });
  app.use(express.json({ limit: '100kb', strict: false }));
  // Vite crea frontend/dist durante el despliegue. En desarrollo
  // la API sigue funcionando sin compilar React.
  const frontendDist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
  const frontendIndex = join(frontendDist, 'index.html');
  if (existsSync(frontendIndex)) app.use(express.static(frontendDist));

  app.get('/', (req, res) => {
    if (existsSync(frontendIndex)) return res.sendFile(frontendIndex);
    res.json({ nombre: 'API de películas y series', version: '1.0.0', modulos: Object.keys(modules).map(name => `/api/${name}`) });
  });
  app.get('/api/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ estado: 'ok', base_datos: 'SQLite' });
  });
  for (const [table, definition] of Object.entries(modules)) {
    const service = createService(db, table, definition);
    const router = express.Router();
    router.get('/', (req, res) => res.json(service.list(req.query)));
    router.get('/:id', (req, res) => res.json({ data: service.get(req.params.id) }));
    router.post('/', (req, res) => {
      const record = service.create(req.body);
      res.location(`/api/${table}/${record.id}`).status(201).json({ data: record });
    });
    router.put('/:id', (req, res) => res.json({ data: service.update(req.params.id, req.body, false) }));
    router.patch('/:id', (req, res) => res.json({ data: service.update(req.params.id, req.body, true) }));
    router.delete('/:id', (req, res) => { service.remove(req.params.id); res.status(204).end(); });
    router.all(['/', '/:id'], (req, res) => res.set('Allow', req.params.id ? 'GET, HEAD, PUT, PATCH, DELETE' : 'GET, HEAD, POST').status(405).json({ error: { mensaje: 'Método no permitido.' } }));
    app.use(`/api/${table}`, router);
  }
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path === '/api' || !existsSync(frontendIndex)) return next();
    res.sendFile(frontendIndex, err => { if (err) next(err); });
  });
  app.use((req, res, next) => next(new ApiError(404, 'Ruta no encontrada.')));
  app.use(errorHandler);
  return app;
}
