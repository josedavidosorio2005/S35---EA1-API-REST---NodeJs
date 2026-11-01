import express from 'express';
import { modules } from './modules.js';
import { createService } from './service.js';
import { ApiError, errorHandler } from './errors.js';

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
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
  app.get('/', (req, res) => res.json({ nombre: 'API de películas y series', version: '1.0.0', modulos: Object.keys(modules).map(name => `/api/${name}`) }));
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
  app.use((req, res, next) => next(new ApiError(404, 'Ruta no encontrada.')));
  app.use(errorHandler);
  return app;
}
