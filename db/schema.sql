PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS generos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(nombre)) BETWEEN 1 AND 120),
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK(estado IN ('Activo','Inactivo')),
  descripcion TEXT NOT NULL CHECK(length(trim(descripcion)) BETWEEN 1 AND 2000),
  fecha_creacion TEXT NOT NULL,
  fecha_actualizacion TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS directores (
  id INTEGER PRIMARY KEY,
  nombres TEXT NOT NULL CHECK(length(trim(nombres)) BETWEEN 1 AND 180),
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK(estado IN ('Activo','Inactivo')),
  fecha_creacion TEXT NOT NULL,
  fecha_actualizacion TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS productoras (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(nombre)) BETWEEN 1 AND 120),
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK(estado IN ('Activo','Inactivo')),
  slogan TEXT NOT NULL CHECK(length(trim(slogan)) BETWEEN 1 AND 300),
  descripcion TEXT NOT NULL CHECK(length(trim(descripcion)) BETWEEN 1 AND 2000),
  fecha_creacion TEXT NOT NULL,
  fecha_actualizacion TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS tipos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(nombre)) BETWEEN 1 AND 120),
  descripcion TEXT NOT NULL CHECK(length(trim(descripcion)) BETWEEN 1 AND 2000),
  fecha_creacion TEXT NOT NULL,
  fecha_actualizacion TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY,
  serial TEXT NOT NULL UNIQUE CHECK(length(trim(serial)) BETWEEN 1 AND 80),
  titulo TEXT NOT NULL CHECK(length(trim(titulo)) BETWEEN 1 AND 200),
  sinopsis TEXT NOT NULL CHECK(length(trim(sinopsis)) BETWEEN 1 AND 5000),
  url TEXT NOT NULL UNIQUE,
  imagen_portada TEXT NOT NULL,
  anio_estreno INTEGER NOT NULL CHECK(anio_estreno BETWEEN 1888 AND 9999),
  genero_id INTEGER NOT NULL REFERENCES generos(id) ON DELETE RESTRICT,
  director_id INTEGER NOT NULL REFERENCES directores(id) ON DELETE RESTRICT,
  productora_id INTEGER NOT NULL REFERENCES productoras(id) ON DELETE RESTRICT,
  tipo_id INTEGER NOT NULL REFERENCES tipos(id) ON DELETE RESTRICT,
  fecha_creacion TEXT NOT NULL,
  fecha_actualizacion TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS media_genero ON media(genero_id);
CREATE INDEX IF NOT EXISTS media_director ON media(director_id);
CREATE INDEX IF NOT EXISTS media_productora ON media(productora_id);
CREATE INDEX IF NOT EXISTS media_tipo ON media(tipo_id);

-- El histórico puede conservar catálogos desactivados. Toda nueva asignación
-- debe apuntar a un registro activo; las FK garantizan que el registro exista.
CREATE TRIGGER IF NOT EXISTS media_activos_insert BEFORE INSERT ON media
WHEN (SELECT estado FROM generos WHERE id=NEW.genero_id)='Inactivo'
  OR (SELECT estado FROM directores WHERE id=NEW.director_id)='Inactivo'
  OR (SELECT estado FROM productoras WHERE id=NEW.productora_id)='Inactivo'
BEGIN SELECT RAISE(ABORT, 'REFERENCIA_INACTIVA'); END;
CREATE TRIGGER IF NOT EXISTS media_activos_update BEFORE UPDATE ON media
WHEN (NEW.genero_id<>OLD.genero_id AND (SELECT estado FROM generos WHERE id=NEW.genero_id)='Inactivo')
  OR (NEW.director_id<>OLD.director_id AND (SELECT estado FROM directores WHERE id=NEW.director_id)='Inactivo')
  OR (NEW.productora_id<>OLD.productora_id AND (SELECT estado FROM productoras WHERE id=NEW.productora_id)='Inactivo')
BEGIN SELECT RAISE(ABORT, 'REFERENCIA_INACTIVA'); END;
