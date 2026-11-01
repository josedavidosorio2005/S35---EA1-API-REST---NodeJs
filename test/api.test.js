import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/database.js';

const samples = {
  generos: { nombre: 'Aventura', estado: 'Activo', descripcion: 'Historias de exploración.' },
  directores: { nombres: 'Ana Ejemplo', estado: 'Activo' },
  productoras: { nombre: 'Estudio Académico', estado: 'Activo', slogan: 'Historias para aprender', descripcion: 'Productora ficticia.' },
  tipos: { nombre: 'Película', descripcion: 'Producción de largometraje.' },
  media: { serial: 'MED-001', titulo: 'Viaje de prueba', sinopsis: 'Una aventura ficticia.', url: 'https://example.org/video.mp4',
    imagen_portada: 'https://example.org/portada.jpg', anio_estreno: 2026, genero_id: 1, director_id: 1, productora_id: 1, tipo_id: 1 }
};

async function fixture(t, path = ':memory:') {
  const db = openDatabase(path);
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(() => { db.close(); resolve(); })));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(path, method = 'GET', body, headers = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const text = await response.text();
    return { status: response.status, headers: response.headers, body: text ? JSON.parse(text) : null };
  }
  async function catalogs() {
    for (const name of ['generos', 'directores', 'productoras', 'tipos']) {
      assert.equal((await request(`/api/${name}`, 'POST', samples[name])).status, 201);
    }
  }
  return { db, request, catalogs, base };
}

for (const module of Object.keys(samples)) {
  test(`${module}: ciclo POST, GET, PUT, PATCH y DELETE`, async t => {
    const { request, catalogs } = await fixture(t);
    if (module === 'media') await catalogs();
    const path = `/api/${module}`;
    const created = await request(path, 'POST', samples[module]);
    assert.equal(created.status, 201);
    assert.equal(created.headers.get('location'), `${path}/1`);
    const original = created.body.data;
    assert.equal(original.id, 1);
    assert.ok(!Number.isNaN(Date.parse(original.fecha_creacion)));
    assert.equal((await request(`${path}/1`)).body.data.id, 1);
    const field = module === 'directores' ? 'nombres' : module === 'media' ? 'titulo' : 'nombre';
    const replacement = { ...samples[module], [field]: 'Valor actualizado' };
    const updated = await request(`${path}/1`, 'PUT', replacement);
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data[field], replacement[field]);
    assert.equal(updated.body.data.fecha_creacion, original.fecha_creacion);
    assert.ok(updated.body.data.fecha_actualizacion >= original.fecha_actualizacion);
    const patched = await request(`${path}/1`, 'PATCH', { [field]: 'Último valor' });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.data[field], 'Último valor');
    const list = await request(path);
    assert.equal(list.body.pagination.total, 1);
    assert.equal(list.body.data[0][field], 'Último valor');
    if (module === 'media') {
      assert.equal(list.body.data[0].genero.nombre, 'Aventura');
      assert.equal(list.body.data[0].tipo.nombre, 'Película');
    }
    const deleted = await request(`${path}/1`, 'DELETE');
    assert.equal(deleted.status, 204);
    assert.equal(deleted.body, null);
    assert.equal((await request(`${path}/1`)).status, 404);
  });
  test(`${module}: rechaza campos omitidos y desconocidos`, async t => {
    const { request, catalogs } = await fixture(t);
    if (module === 'media') await catalogs();
    assert.equal((await request(`/api/${module}`, 'POST', {})).status, 422);
    assert.equal((await request(`/api/${module}`, 'POST', { ...samples[module], intruso: true })).status, 422);
    assert.equal((await request(`/api/${module}`, 'POST', { ...samples[module], fecha_creacion: '2000' })).status, 422);
  });
  test(`${module}: PUT exige representación completa y PATCH exige cambios`, async t => {
    const { request, catalogs } = await fixture(t);
    if (module === 'media') await catalogs();
    await request(`/api/${module}`, 'POST', samples[module]);
    assert.equal((await request(`/api/${module}/1`, 'PUT', {})).status, 422);
    assert.equal((await request(`/api/${module}/1`, 'PATCH', {})).status, 422);
    assert.equal((await request(`/api/${module}/999`, 'PATCH', {})).status, 404);
  });
  test(`${module}: ID y paginación inválidos`, async t => {
    const { request } = await fixture(t);
    for (const id of ['abc', '0', '-1', '1.1', '9007199254740992']) {
      assert.equal((await request(`/api/${module}/${id}`)).status, 400);
    }
    for (const query of ['limit=101', 'page=0', 'limit=x', 'page=1&page=2', 'foo=bar']) {
      assert.equal((await request(`/api/${module}?${query}`)).status, 400);
    }
  });
}

test('media: serial y URL únicos al crear y actualizar', async t => {
  const { request, catalogs } = await fixture(t); await catalogs();
  await request('/api/media', 'POST', samples.media);
  assert.equal((await request('/api/media', 'POST', { ...samples.media, url: 'https://example.org/otro.mp4' })).status, 409);
  assert.equal((await request('/api/media', 'POST', { ...samples.media, serial: 'MED-002' })).status, 409);
  assert.equal((await request('/api/media', 'POST', { ...samples.media, serial: 'MED-002', url: 'https://example.org/otro.mp4' })).status, 201);
  assert.equal((await request('/api/media/2', 'PATCH', { serial: 'MED-001' })).status, 409);
  assert.equal((await request('/api/media/2', 'PATCH', { url: samples.media.url })).status, 409);
  assert.equal((await request('/api/media/2')).body.data.serial, 'MED-002');
});

for (const [catalog, field] of [['generos', 'genero_id'], ['directores', 'director_id'], ['productoras', 'productora_id']]) {
  test(`media: ${catalog} inactivos no se pueden asignar`, async t => {
    const { request, catalogs } = await fixture(t); await catalogs();
    await request(`/api/${catalog}/1`, 'PATCH', { estado: 'Inactivo' });
    assert.equal((await request('/api/media', 'POST', samples.media)).status, 422);
    await request(`/api/${catalog}/1`, 'PATCH', { estado: 'Activo' });
    await request('/api/media', 'POST', samples.media);
    const other = await request(`/api/${catalog}`, 'POST', { ...samples[catalog], nombre: catalog === 'directores' ? undefined : 'Otro', estado: 'Inactivo' });
    assert.equal(other.status, 201);
    assert.equal((await request('/api/media/1', 'PATCH', { [field]: other.body.data.id })).status, 422);
    await request(`/api/${catalog}/1`, 'PATCH', { estado: 'Inactivo' });
    assert.equal((await request('/api/media/1', 'PATCH', { titulo: 'Histórico conservado' })).status, 200);
    const dbRef = (await request('/api/media/1')).body.data[field];
    assert.equal(dbRef, 1);
  });
}

for (const catalog of ['generos', 'directores', 'productoras', 'tipos']) {
  test(`${catalog}: eliminación protegida si está referenciado`, async t => {
    const { request, catalogs } = await fixture(t); await catalogs();
    await request('/api/media', 'POST', samples.media);
    assert.equal((await request(`/api/${catalog}/1`, 'DELETE')).status, 409);
    assert.equal((await request(`/api/${catalog}/1`)).status, 200);
    await request('/api/media/1', 'DELETE');
    assert.equal((await request(`/api/${catalog}/1`, 'DELETE')).status, 204);
  });
}

test('media: rechaza referencias inexistentes y tipos incorrectos', async t => {
  const { request, catalogs } = await fixture(t); await catalogs();
  for (const field of ['genero_id', 'director_id', 'productora_id', 'tipo_id']) {
    for (const value of [999, '1', null, 0, 1.5]) {
      assert.equal((await request('/api/media', 'POST', { ...samples.media, [field]: value })).status, 422);
    }
  }
});

test('media: valida año, textos y URL; normaliza URL antes de comprobar unicidad', async t => {
  const { request, catalogs } = await fixture(t); await catalogs();
  for (const patch of [{ anio_estreno: '2026' }, { anio_estreno: 1000 }, { anio_estreno: 10000 },
    { titulo: ' ' }, { titulo: 'x'.repeat(201) }, { url: 'javascript:alert(1)' },
    { imagen_portada: 'ftp://example.org/x' }, { url: 'https://usuario:clave@example.org/' }]) {
    assert.equal((await request('/api/media', 'POST', { ...samples.media, ...patch })).status, 422);
  }
  await request('/api/media', 'POST', { ...samples.media, url: 'https://example.org' });
  assert.equal((await request('/api/media', 'POST', { ...samples.media, serial: 'MED-002', url: 'https://example.org/' })).status, 409);
});

test('catálogos: estado por defecto, filtro y nombres únicos sin distinguir mayúsculas', async t => {
  const { request } = await fixture(t);
  const { estado, ...body } = samples.generos;
  const result = await request('/api/generos', 'POST', body);
  assert.equal(result.body.data.estado, 'Activo');
  assert.equal((await request('/api/generos', 'POST', { ...body, nombre: 'aventura' })).status, 409);
  assert.equal((await request('/api/generos', 'POST', { ...body, nombre: 'Otro', estado: 'activo' })).status, 422);
  assert.equal((await request('/api/generos?estado=Inactivo')).body.pagination.total, 0);
  assert.equal((await request('/api/generos?estado=otro')).status, 400);
});

test('listados: búsqueda literal, filtros relacionales y paginación', async t => {
  const { request, catalogs } = await fixture(t); await catalogs();
  await request('/api/media', 'POST', samples.media);
  await request('/api/media', 'POST', { ...samples.media, serial: 'MED-002', url: 'https://example.org/2', titulo: 'Otra historia' });
  const page = await request('/api/media?limit=1&page=2');
  assert.deepEqual(page.body.pagination, { page: 2, limit: 1, total: 2, pages: 2 });
  assert.equal(page.body.data[0].serial, 'MED-002');
  assert.equal((await request('/api/media?q=Viaje&tipo_id=1')).body.pagination.total, 1);
  assert.equal((await request('/api/media?genero_id=999')).body.pagination.total, 0);
  assert.equal((await request('/api/media?q=%25')).body.pagination.total, 0);
  assert.equal((await request('/api/media?q=%27%20OR%201%3D1--')).body.pagination.total, 0);
});

test('HTTP: salud, rutas inexistentes, JSON inválido y Content-Type', async t => {
  const { request, base } = await fixture(t);
  assert.equal((await request('/api/health')).body.estado, 'ok');
  assert.equal((await request('/')).body.modulos.length, 5);
  assert.equal((await request('/inexistente')).status, 404);
  assert.equal((await request('/api/generos', 'POST', {}, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await request('/api/generos', 'POST', [])).status, 400);
  assert.equal((await request('/api/generos', 'POST', null)).status, 400);
  assert.equal((await fetch(`${base}/api/generos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await request('/api/generos/1', 'POST', samples.generos)).status, 405);
  assert.equal((await request('/api/generos')).headers.get('x-powered-by'), null);
  assert.equal((await request('/api/generos', 'POST', { descripcion: 'x'.repeat(110000) })).status, 413);
});

test('SQLite: persistencia después de cerrar y volver a abrir la base', () => {
  const dir = mkdtempSync(join(tmpdir(), 'api-persist-'));
  try {
    const path = join(dir, 'test.sqlite');
    let db = openDatabase(path);
    db.prepare('INSERT INTO tipos(nombre,descripcion,fecha_creacion,fecha_actualizacion) VALUES (?,?,?,?)').run('Serie', 'Episodios', '2026-01-01', '2026-01-01');
    db.close(); db = openDatabase(path);
    assert.equal(db.prepare('SELECT nombre FROM tipos').get().nombre, 'Serie');
    db.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('seed: catálogos exigidos e idempotencia', () => {
  const dir = mkdtempSync(join(tmpdir(), 'api-seed-'));
  try {
    const path = join(dir, 'test.sqlite');
    for (let i = 0; i < 2; i++) execFileSync(process.execPath, ['db/seed.js'], { env: { ...process.env, DB_PATH: path } });
    const db = openDatabase(path);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM generos').get().n, 5);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tipos').get().n, 2);
    db.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('SQLite: triggers y claves foráneas protegen escrituras directas', async t => {
  const { request, catalogs, db } = await fixture(t); await catalogs();
  await request('/api/generos/1', 'PATCH', { estado: 'Inactivo' });
  const insert = db.prepare('INSERT INTO media(serial,titulo,sinopsis,url,imagen_portada,anio_estreno,genero_id,director_id,productora_id,tipo_id,fecha_creacion,fecha_actualizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  const values = ['S', 'T', 'Sinopsis', 'https://example.org/', 'https://example.org/p.jpg', 2026, 1, 1, 1, 1, '2026', '2026'];
  assert.throws(() => insert.run(...values), /REFERENCIA_INACTIVA/);
  values[6] = 999;
  assert.throws(() => insert.run(...values), /FOREIGN KEY/);
});
