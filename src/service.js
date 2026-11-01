import { ApiError } from './errors.js';
import { positiveId, validateBody } from './validation.js';

export function createService(db, table, definition) {
  function get(id) {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(positiveId(id));
    if (!row) throw new ApiError(404, 'Registro no encontrado.');
    if (table === 'media') {
      row.genero = db.prepare('SELECT * FROM generos WHERE id=?').get(row.genero_id);
      row.director = db.prepare('SELECT * FROM directores WHERE id=?').get(row.director_id);
      row.productora = db.prepare('SELECT * FROM productoras WHERE id=?').get(row.productora_id);
      row.tipo = db.prepare('SELECT * FROM tipos WHERE id=?').get(row.tipo_id);
    }
    return row;
  }
  return {
    get,
    list(query) {
      const allowed = new Set(['page', 'limit', 'q', ...(definition.fields.estado ? ['estado'] : []),
        ...(table === 'media' ? ['genero_id', 'director_id', 'productora_id', 'tipo_id'] : [])]);
      for (const key of Object.keys(query)) if (!allowed.has(key)) throw new ApiError(400, `Filtro no permitido: ${key}.`);
      const page = positiveId(query.page ?? 1, 'page');
      const limit = positiveId(query.limit ?? 20, 'limit');
      if (limit > 100 || !Number.isSafeInteger((page - 1) * limit)) throw new ApiError(400, 'Paginación fuera de rango; limit máximo 100.');
      const conditions = [], values = [];
      if (query.estado !== undefined) {
        if (!['Activo', 'Inactivo'].includes(query.estado)) throw new ApiError(400, 'Estado no válido.');
        conditions.push('estado=?'); values.push(query.estado);
      }
      if (query.q !== undefined) {
        if (typeof query.q !== 'string' || query.q.length > 200) throw new ApiError(400, 'q debe ser texto de máximo 200 caracteres.');
        const column = table === 'media' ? 'titulo' : table === 'directores' ? 'nombres' : 'nombre';
        conditions.push(`${column} LIKE ? ESCAPE '\\'`);
        values.push(`%${query.q.replace(/[\\%_]/g, '\\$&')}%`);
      }
      for (const field of ['genero_id', 'director_id', 'productora_id', 'tipo_id']) {
        if (query[field] !== undefined) { conditions.push(`${field}=?`); values.push(positiveId(query[field], field)); }
      }
      const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
      const { total } = db.prepare(`SELECT COUNT(*) AS total FROM ${table}${where}`).get(...values);
      const rows = db.prepare(`SELECT id FROM ${table}${where} ORDER BY id LIMIT ? OFFSET ?`).all(...values, limit, (page - 1) * limit);
      return { data: rows.map(({ id }) => get(id)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    },
    create(body) {
      const data = validateBody(body, definition.fields, db);
      const now = new Date().toISOString();
      data.fecha_creacion = now; data.fecha_actualizacion = now;
      const keys = Object.keys(data);
      const { lastInsertRowid } = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(data));
      return get(Number(lastInsertRowid));
    },
    update(id, body, partial) {
      const existing = get(id);
      const data = validateBody(body, definition.fields, db, { partial, existing });
      data.fecha_actualizacion = new Date().toISOString();
      db.prepare(`UPDATE ${table} SET ${Object.keys(data).map(key => `${key}=?`).join(',')} WHERE id=?`).run(...Object.values(data), existing.id);
      return get(existing.id);
    },
    remove(id) {
      const existing = get(id);
      db.prepare(`DELETE FROM ${table} WHERE id=?`).run(existing.id);
    }
  };
}
