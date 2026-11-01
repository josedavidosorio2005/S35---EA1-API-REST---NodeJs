# Diseño e implementación de una API REST para la gestión de películas y series

José David Osorio Gallego  
Integrantes adicionales: completar con los nombres reales antes de entregar  
Institución Universitaria Digital de Antioquia  
Ingeniería Web II  
S35 - EA1: API REST - NodeJs  
1 de noviembre de 2026

## Introducción

El caso de estudio plantea una plataforma institucional de entretenimiento cuyo contenido debe administrarse mediante cinco módulos: género, director, productora, tipo y media. Esta evidencia se concentra en la API REST y su base de datos, verificadas mediante un cliente HTTP. El sistema permite crear y actualizar los cinco recursos, así como consultarlos y eliminarlos respetando sus relaciones (Institución Universitaria Digital de Antioquia, s. f.).

Se implementó un backend en JavaScript con Node.js y Express. Express permite definir rutas y métodos HTTP para construir servicios web (OpenJS Foundation, s. f.). La persistencia se resolvió con SQLite a través del módulo nativo node:sqlite de Node.js, que permite ejecutar sentencias y consultas parametrizadas sobre una base de datos local (Node.js, s. f.). La elección facilita reproducir la actividad sin configurar un servidor SQL independiente.

## Objetivos

El objetivo general es desarrollar una API REST que administre películas y series de acuerdo con las condiciones del caso. Los objetivos específicos son diseñar las cinco tablas y sus relaciones; implementar creación, consulta, modificación y eliminación; validar campos y reglas de negocio; y demostrar el funcionamiento con una colección de Postman y pruebas automatizadas.

## Análisis y alcance

Una producción requiere un serial único, título, sinopsis, URL única, imagen de portada, año de estreno y referencias a un género, un director principal, una productora y un tipo. Los registros de género, director y productora tienen estado Activo o Inactivo. El tipo no tiene estado. La aplicación solo acepta nuevas asignaciones hacia los tres catálogos activos, como exige el caso.

Esta entrega implementa el backend administrativo. No incorpora un frontend, reproducción de video ni autenticación de usuarios, que no son requisitos de la evidencia API REST. Las URL de ejemplo son ficticias y prueban el almacenamiento de información; no demuestran disponibilidad ni licenciamiento de una película real. El caso institucional contempla que la universidad gestione las licencias de su contenido.

## Diseño de la base de datos

Se construyeron las tablas generos, directores, productoras, tipos y media. Cada tabla tiene una clave primaria entera y fechas de creación y actualización. La tabla media almacena las cuatro claves foráneas obligatorias. La relación desde cada catálogo hacia media es de uno a muchos: un género puede clasificar varias producciones, pero cada producción conserva un solo género principal. La misma cardinalidad se aplica al director, productora y tipo.

La separación evita repetir datos descriptivos de los catálogos dentro de cada producción. Serial y URL tienen restricciones UNIQUE. Se agregó unicidad a los nombres de género, productora y tipo para evitar duplicados; los directores pueden ser homónimos. Todas las relaciones usan ON DELETE RESTRICT, de modo que no se elimina un catálogo mientras existan producciones que lo utilicen.

Las fechas se generan en el servidor en formato ISO 8601 UTC. Los cuerpos de las solicitudes no pueden modificarlas. El esquema SQL utiliza tablas STRICT, restricciones NOT NULL y CHECK, índices sobre las claves foráneas y triggers para impedir nuevas asignaciones a catálogos inactivos. El archivo db/schema.sql contiene el diseño físico completo.

Se decidió conservar el histórico cuando se desactiva un catálogo que ya está relacionado. La media existente puede consultarse y modificar su título, pero para cambiar su género, director o productora debe escoger otro registro activo. Esta decisión mantiene la trazabilidad sin permitir nuevas asignaciones inválidas.

## Arquitectura e instalación

La solución es una aplicación monolítica organizada por responsabilidades. app.js configura rutas y middleware; modules.js define los campos de cada recurso; service.js realiza las operaciones; validation.js valida datos; errors.js unifica las respuestas de error; database.js prepara SQLite; y server.js inicia el servicio HTTP. La configuración declarativa comparte el CRUD sin perder las diferencias entre los cinco módulos.

La ejecución requiere Node.js 24 LTS, versión 24.13 o superior de la rama 24. Después de obtener el repositorio se ejecuta npm ci, npm run seed y npm start. El seed carga Acción, Aventura, Ciencia ficción, Drama y Terror, junto con los tipos Película y Serie. Se puede repetir sin duplicar datos ni borrar el trabajo existente. La ruta GET /api/health comprueba la respuesta de la API y la conexión a SQLite.

Los datos permanecen en data/peliculas.sqlite después de detener el servidor. El puerto predeterminado es 3000 y el servicio escucha en 127.0.0.1. La configuración opcional se documenta en .env.example. Las consultas síncronas de DatabaseSync son apropiadas para esta demostración local; el proyecto no incluye pruebas de carga ni presenta resultados de alta concurrencia.

## Convenciones de los servicios

Cada módulo ofrece POST para crear, GET para listar o consultar por identificador, PUT para reemplazar todos los campos editables, PATCH para modificar un subconjunto y DELETE para eliminar. Las rutas base son /api/generos, /api/directores, /api/productoras, /api/tipos y /api/media. Las escrituras requieren Content-Type: application/json.

POST devuelve 201 y la ubicación del recurso creado; GET, PUT y PATCH devuelven 200; DELETE devuelve 204 sin cuerpo. Se usa 400 para JSON, identificadores o filtros incorrectos; 404 para registros inexistentes; 409 para duplicados o eliminaciones bloqueadas; y 422 para datos inválidos o relaciones no permitidas. El contrato OpenAPI documenta todas las operaciones y los ejemplos.

Los listados admiten page, limit y q. El límite predeterminado es 20 y el máximo es 100. Los catálogos con estado pueden filtrarse por Activo o Inactivo; media permite filtrar por sus cuatro claves relacionadas. La respuesta contiene data y pagination. Una consulta individual devuelve data con el registro y sus fechas; media agrega los cuatro objetos relacionados.

## Servicio de género

POST /api/generos recibe nombre, estado y descripcion. Por ejemplo, se puede registrar un género con nombre Aventura, estado Activo y una descripción de historias de exploración. Cuando estado no se envía al crear, se asigna Activo. El nombre admite hasta 120 caracteres, es obligatorio y no puede duplicarse sin distinguir mayúsculas ASCII según la comparación NOCASE de SQLite.

PUT /api/generos/:id exige los tres campos y permite corregir nombre, estado y descripción. PATCH permite enviar únicamente el cambio requerido. GET /api/generos?estado=Activo lista los géneros seleccionables para nuevas producciones; GET /api/generos/:id consulta uno. DELETE elimina el género cuando no está utilizado por media; en caso contrario responde 409.

## Servicio de director

POST /api/directores recibe nombres y estado. El campo nombres admite hasta 180 caracteres y representa al director principal de la producción. No se exige unicidad en nombres, ya que dos personas pueden llamarse igual; cada una se distingue por su identificador.

PUT /api/directores/:id reemplaza nombres y estado; PATCH admite cambios parciales. GET permite listar, buscar por nombres o consultar un ID. DELETE responde 204 cuando se elimina y 409 si el director tiene producciones relacionadas. Las fechas de creación y actualización permiten distinguir cuándo se registró y modificó el dato.

## Servicio de productora

POST /api/productoras recibe nombre, estado, slogan y descripcion. El nombre es único y admite 120 caracteres; slogan admite 300 y descripcion hasta 2000. Los textos vacíos se rechazan. Se usa una productora ficticia para la demostración, sin atribuir películas reales a una empresa.

PUT /api/productoras/:id reemplaza sus cuatro campos y PATCH modifica los enviados. GET permite consultar una productora, buscar por nombre o filtrar por estado. DELETE se bloquea con 409 mientras existan producciones relacionadas. Al crear una media o cambiar su productora, la elegida debe estar activa.

## Servicio de tipo

POST /api/tipos recibe nombre y descripcion. Se cargan inicialmente Película y Serie, pero el módulo permite registrar nuevas categorías sin modificar el código. El nombre es obligatorio y único. No existe el campo estado porque no se solicita en el caso de estudio.

PUT /api/tipos/:id actualiza nombre y descripción; PATCH permite una modificación parcial. GET devuelve el listado o un tipo por ID. DELETE elimina únicamente tipos que no estén relacionados con media. La referencia desde media siempre debe apuntar a un tipo existente.

## Servicio de media

POST /api/media recibe serial, titulo, sinopsis, url, imagen_portada, anio_estreno, genero_id, director_id, productora_id y tipo_id. Serial admite hasta 80 caracteres, título 200 y sinopsis 5000. El año debe ser un número entero entre 1888 y 9999. Las URL deben usar HTTP o HTTPS sin credenciales y admiten hasta 2048 caracteres; la API las normaliza antes de revisar unicidad.

Para una prueba se utilizan un serial como MED-001, el título Viaje de prueba y las URL https://example.org/video.mp4 y https://example.org/portada.jpg. Los cuatro IDs se obtienen de catálogos previamente creados. La colección de Postman captura los IDs automáticamente, por lo que no depende de que la base esté vacía ni de identificadores fijos.

PUT /api/media/:id exige todos los campos editables. PATCH permite actualizar, por ejemplo, únicamente el título. GET /api/media/:id devuelve las relaciones completas y GET /api/media?genero_id=1&limit=10 permite filtrar y paginar. DELETE /api/media/:id elimina la producción y libera las referencias para una posterior eliminación de sus catálogos.

## Validación y pruebas

La API valida tipos, longitudes, campos permitidos, relaciones y estados. Se rechazan valores desconocidos para evitar que el cliente modifique fechas o identificadores internos. Las consultas SQL reciben parámetros para los valores. El tamaño del JSON se limita a 100 KB y los errores inesperados no exponen detalles internos en la respuesta.

Se ejecutaron 36 pruebas automatizadas con npm test sobre Node.js 24.22.1; las 36 finalizaron correctamente. Cada prueba HTTP utiliza un servidor local y una base aislada. Se verificaron CRUD de los cinco módulos, PUT completo y PATCH parcial, códigos HTTP, IDs inválidos, paginación, búsqueda, duplicados, relaciones inactivas, borrados protegidos, persistencia al reabrir SQLite e idempotencia del seed. Las pruebas no modifican la base del usuario.

La colección de Postman organiza solicitudes para crear y actualizar los cinco módulos, consultar media y comprobar errores esperados. Se ejecutó mediante Newman: las 30 solicitudes y sus 52 comprobaciones finalizaron sin fallos. Cada ejecución usa nombres y seriales propios y guarda los IDs devueltos por la API. Al final elimina sus registros de ejemplo en orden: primero media y luego los catálogos. GitHub Actions incluye la ejecución de npm ci y npm test para futuras revisiones del repositorio.

## Conclusiones

La solución implementa creación y actualización en los cinco módulos solicitados y agrega consulta, eliminación y modificación parcial. La base de datos conserva las producciones entre ejecuciones y evita duplicados de serial y URL. Las claves foráneas y las validaciones de estado mantienen relaciones consistentes sin perder la información histórica cuando un catálogo se desactiva.

La estructura del código, las pruebas y la colección de Postman permiten reproducir el funcionamiento y explicar cada servicio. Como trabajo posterior se propone integrar una interfaz de administración y, si el alcance institucional lo requiere, definir autenticación y pruebas de concurrencia. La entrega actual cumple el alcance técnico de la evidencia API REST; la conformación del equipo y el envío en Canvas deben completarse con la información real del grupo.

## Referencias

Institución Universitaria Digital de Antioquia. (s. f.). *Caso de estudio: películas* [Material de clase, Ingeniería Web II].

Node.js. (s. f.). *SQLite*. En *Node.js v24 documentation*. https://nodejs.org/docs/latest-v24.x/api/sqlite.html

OpenJS Foundation. (s. f.). *5.x API reference*. Express. https://expressjs.com/en/5x/api/

## Enlace al código fuente

https://github.com/josedavidosorio2005/S35---EA1-API-REST---NodeJs

El documento es la alternativa escrita contemplada en la consigna si el equipo no puede subir el video. Completar los integrantes reales en la portada antes de entregar.
