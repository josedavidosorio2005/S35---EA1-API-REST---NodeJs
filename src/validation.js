import { ApiError } from './errors.js';

export function positiveId(value, field = 'id') {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw new ApiError(400, `${field} debe ser un entero positivo.`);
  }
  return Number(value);
}

export function validateBody(body, fields, db, { partial = false, existing = null } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Envía un objeto JSON.');
  const errors = [];
  const result = {};
  for (const key of Object.keys(body)) {
    if (!Object.hasOwn(fields, key)) errors.push(`${key}: campo no permitido.`);
  }
  for (const [key, rule] of Object.entries(fields)) {
    let value = body[key];
    if (value === undefined && partial) continue;
    if (value === undefined && !existing && rule.default !== undefined) value = rule.default;
    if (value === undefined || value === null) { errors.push(`${key}: es obligatorio.`); continue; }
    if (['text', 'url', 'state'].includes(rule.type)) {
      if (typeof value !== 'string' || !value.trim() || value.trim().length > (rule.max || 20)) {
        errors.push(`${key}: texto obligatorio, máximo ${rule.max || 20} caracteres.`); continue;
      }
      value = value.trim();
      if (rule.type === 'state' && !['Activo', 'Inactivo'].includes(value)) errors.push(`${key}: usa Activo o Inactivo.`);
      if (rule.type === 'url') {
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
          value = url.href;
        } catch { errors.push(`${key}: debe ser una URL HTTP o HTTPS sin credenciales.`); }
      }
    }
    if (rule.type === 'integer' && (!Number.isSafeInteger(value) || value < rule.min || value > rule.max)) {
      errors.push(`${key}: entero entre ${rule.min} y ${rule.max}.`);
    }
    if (rule.type === 'reference') {
      if (!Number.isSafeInteger(value) || value < 1) { errors.push(`${key}: usa un ID entero positivo.`); continue; }
      const record = db.prepare(`SELECT * FROM ${rule.table} WHERE id=?`).get(value);
      if (!record) errors.push(`${key}: no existe el registro relacionado.`);
      else if (rule.active && record.estado !== 'Activo' && (!existing || existing[key] !== value)) {
        errors.push(`${key}: solo se pueden asignar registros activos.`);
      }
    }
    result[key] = value;
  }
  if (partial && !Object.keys(body).length) errors.push('Envía al menos un campo para actualizar.');
  if (errors.length) throw new ApiError(422, 'Datos no válidos.', errors);
  return result;
}
