import { openDatabase } from '../src/database.js';

const db = openDatabase();
try {
  db.exec('BEGIN');
  const now = new Date().toISOString();
  const genero = db.prepare('INSERT INTO generos (nombre,estado,descripcion,fecha_creacion,fecha_actualizacion) VALUES (?,\'Activo\',?,?,?) ON CONFLICT(nombre) DO NOTHING');
  for (const name of ['Acción', 'Aventura', 'Ciencia ficción', 'Drama', 'Terror']) genero.run(name, `Producciones del género ${name.toLowerCase()}.`, now, now);
  const tipo = db.prepare('INSERT INTO tipos (nombre,descripcion,fecha_creacion,fecha_actualizacion) VALUES (?,?,?,?) ON CONFLICT(nombre) DO NOTHING');
  tipo.run('Película', 'Producción audiovisual de largometraje.', now, now);
  tipo.run('Serie', 'Producción organizada por episodios.', now, now);
  db.exec('COMMIT');
  console.log('Catálogos iniciales preparados (sin duplicar registros ni borrar datos).');
} catch (error) { db.exec('ROLLBACK'); throw error; }
finally { db.close(); }
