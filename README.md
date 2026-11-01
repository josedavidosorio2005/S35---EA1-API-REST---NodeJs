# S35 - EA1: API REST con Node.js

API de administración de películas y series basada en el caso de estudio de la IU Digital de Antioquia. Incluye **Género, Director, Productora, Tipo y Media**, almacenamiento SQLite y una colección ejecutable de Postman.

**Estudiante:** José David Osorio Gallego. **Presentación individual.**

## Ejecutar en Windows, Linux o macOS

Requisito: **Node.js 24 LTS, versión 24.13 o superior dentro de la rama 24**, y npm. Verificar con `node --version`. No requiere instalar un servidor SQL.

```bash
git clone https://github.com/josedavidosorio2005/S35---EA1-API-REST---NodeJs.git
cd S35---EA1-API-REST---NodeJs
npm ci
npm run seed
npm start
```

Abrir <http://127.0.0.1:3000/api/health>. Debe responder `{"estado":"ok","base_datos":"SQLite"}`. Detener con **Ctrl+C**. Los datos permanecen en `data/peliculas.sqlite`.

`npm run seed` carga Acción, Aventura, Ciencia ficción, Drama, Terror, Película y Serie. Puede repetirse: no borra datos ni duplica nombres. La API también crea su esquema automáticamente aunque no se ejecute el seed.

Configuración opcional: copiar `.env.example` a `.env` y ejecutar `node --env-file=.env src/server.js`. El inicio normal usa puerto 3000, interfaz local y `./data/peliculas.sqlite`.

## Probar con Postman

1. Importar `postman/API_Peliculas.postman_collection.json`.
2. La variable `base_url` ya contiene `http://127.0.0.1:3000`.
3. Ejecutar **toda la colección en orden con Collection Runner**, una iteración. Iniciar por `01 - Salud e inicio de ejecución`.
4. Las solicitudes capturan los IDs devueltos; funcionan con una base vacía o con el seed cargado. El identificador de ejecución evita duplicar nombres, seriales y URL.
5. Se crean y actualizan los cinco módulos, se consultan, se comprueban errores esperados y finalmente se eliminan los datos que creó la colección. La limpieza se ejecuta al final; para conservar los ejemplos, detenerse antes de la carpeta de limpieza.

Las URL de video y portada usan `example.org`: son datos ficticios para probar el CRUD, no contienen películas reproducibles. La API almacena y valida las URL; no descarga ni transmite video.

## Servicios

Prefijo: `/api`. Los cinco recursos son `/generos`, `/directores`, `/productoras`, `/tipos` y `/media`.

| Método | Ruta relativa a cada recurso | Resultado |
| --- | --- | --- |
| POST | `/` | Crear, 201 y cabecera Location |
| GET | `/` | Listar, 200, `data` y `pagination` |
| GET | `/:id` | Consultar por ID, 200 |
| PUT | `/:id` | Reemplazar todos los campos editables, 200 |
| PATCH | `/:id` | Actualizar únicamente los campos enviados, 200 |
| DELETE | `/:id` | Eliminar, 204 sin cuerpo |

**POST, PUT y PATCH** requieren `Content-Type: application/json`. Las respuestas individuales tienen forma `{"data":{...}}`. Los errores usan `{"error":{"mensaje":"...","detalles":["..."]}}`; `detalles` se incluye en validaciones.

### Campos por módulo

| Módulo | Campos editables |
| --- | --- |
| Género | `nombre`, `estado`, `descripcion` |
| Director | `nombres`, `estado` |
| Productora | `nombre`, `estado`, `slogan`, `descripcion` |
| Tipo | `nombre`, `descripcion` |
| Media | `serial`, `titulo`, `sinopsis`, `url`, `imagen_portada`, `anio_estreno`, `genero_id`, `director_id`, `productora_id`, `tipo_id` |

Todos los registros incluyen `id`, `fecha_creacion` y `fecha_actualizacion`, generados por el servidor en UTC. No se aceptan en los cuerpos. `estado` admite `Activo` o `Inactivo`; por defecto es `Activo` al crear. PUT exige todos los campos editables, incluido el estado donde corresponda; PATCH admite un subconjunto no vacío.

Los textos son obligatorios y se recortan. Los límites están en `src/modules.js`: nombres 120, nombres de director 180, slogan 300, descripciones 2000, serial 80, título 200, sinopsis 5000 y URL 2048 caracteres. IDs relacionados y año deben ser números enteros JSON; año entre 1888 y 9999. Las URL admiten HTTP y HTTPS sin credenciales y se normalizan antes de comprobar su unicidad.

### Ejemplo de creación de media

Primero crear o consultar catálogos y reemplazar los IDs por los reales:

```json
{
  "serial": "MED-001",
  "titulo": "Viaje de prueba",
  "sinopsis": "Una aventura ficticia utilizada para probar la API.",
  "url": "https://example.org/video.mp4",
  "imagen_portada": "https://example.org/portada.jpg",
  "anio_estreno": 2026,
  "genero_id": 1,
  "director_id": 1,
  "productora_id": 1,
  "tipo_id": 1
}
```

GET de media devuelve también los objetos `genero`, `director`, `productora` y `tipo`, además de sus IDs.

### Filtros y códigos de respuesta

`GET /api/media?page=1&limit=10&q=Viaje&genero_id=1&tipo_id=1`. Todos los listados admiten `page`, `limit` y `q`; límite predeterminado 20, máximo 100. Los catálogos con estado admiten `estado=Activo`. Media admite los cuatro IDs relacionados. `q` busca una subcadena literal en título, nombre o nombres. La búsqueda depende de las reglas de mayúsculas y acentos de SQLite; no implementa búsqueda fonética.

| Código | Significado |
| --- | --- |
| 400 | ID, filtro o JSON inválido |
| 404 | Registro o ruta inexistente |
| 405 | Método no admitido en una ruta reconocida |
| 409 | Valor único repetido o eliminación de catálogo relacionado |
| 413 | Cuerpo mayor que 100 KB |
| 415 | Falta Content-Type JSON en escritura |
| 422 | Campos inválidos, relación inexistente o nueva asignación inactiva |
| 500 | Error inesperado, sin exponer detalles internos |

## Reglas de negocio y base de datos

Cada media tiene exactamente un género, director principal, productora y tipo. Claves foráneas obligatorias impiden referencias inexistentes; `ON DELETE RESTRICT` protege los catálogos usados. Serial y URL son únicos. Se agrega unicidad al nombre de género, productora y tipo para evitar catálogos duplicados; no se impone a los nombres de directores, pues pueden existir homónimos.

Al crear una media o cambiar una relación, género, director y productora deben estar activos. Desactivar un catálogo no elimina su histórico: una media existente conserva la relación y permite editar otros campos. Los triggers SQL y la capa de servicio aplican esta decisión. Tipo no tiene estado porque el caso no lo exige.

El backend es una aplicación monolítica organizada en rutas, servicio, validaciones y acceso SQL. Se usa Express para HTTP y `node:sqlite` para persistencia. `DatabaseSync` realiza consultas síncronas: resulta suficiente para esta demostración local; no se presenta como solución de alta concurrencia. La actividad evalúa el backend con un cliente REST. El frontend, registro de usuarios, autenticación y reproducción de video quedan fuera de esta evidencia, según su alcance.

## Pruebas y documentos

```bash
npm test
```

La suite levanta un servidor HTTP real por prueba, usa bases aisladas y comprueba CRUD, reglas de negocio, errores, persistencia y carga inicial. No modifica la base local. GitHub Actions ejecuta la misma suite con Node 24 tras cada push o pull request.

Validación realizada el 1 de noviembre de 2026 con Node 24.22.1: **36/36 pruebas automatizadas**, y ejecución real de la colección mediante Newman: **30 solicitudes y 52 comprobaciones aprobadas, cero fallos**. El resumen reproducible está en [docs/VALIDACION.md](docs/VALIDACION.md).

- [Diseño y diccionario de datos](docs/DISENO.md).
- [Informe académico editable](docs/INFORME.md).
- [Guion de video de aproximadamente 4 minutos](docs/GUION_VIDEO.md).
- [Revisión de entrega](docs/ENTREGA.md).
- [Contrato OpenAPI 3.0](docs/openapi.json).
- [Colección de Postman](postman/API_Peliculas.postman_collection.json).
- Esquema SQL: `db/schema.sql`.

## Referencias técnicas

OpenJS Foundation. (s. f.). *Express 5.x API reference*. https://expressjs.com/en/5x/api/

Node.js. (s. f.). *SQLite, documentación de Node.js 24*. https://nodejs.org/docs/latest-v24.x/api/sqlite.html

Institución Universitaria Digital de Antioquia. (s. f.). *Caso de estudio: películas* [Material de clase proporcionado para S35 - EA1].
