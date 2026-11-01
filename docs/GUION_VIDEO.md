# Guion de demostración: 4 minutos y 30 segundos

Antes de grabar: ejecutar `npm ci`, `npm run seed`, `npm test` y `npm start`; importar la colección. Mostrar terminal y Postman con texto legible. Los ejemplos usan URLs ficticias. La presentación identifica únicamente al autor real del trabajo.

## 0:00-0:25 | Presentación

“Soy José David Osorio Gallego y presento de manera individual la API REST de películas y series para la evidencia S35 - EA1. La aplicación incluye los módulos de género, director, productora, tipo y media, desarrollados con Node.js, Express y SQLite.”

## 0:25-0:55 | Diseño

Mostrar `docs/DISENO.md` y `db/schema.sql`.

“La base contiene cinco tablas. Media referencia un género, un director principal, una productora y un tipo. El serial y la URL de la producción son únicos. Las fechas de creación y actualización se generan automáticamente. Los catálogos relacionados no se pueden borrar mientras estén en uso.”

## 0:55-1:20 | Puesta en marcha

Mostrar terminal y la solicitud de salud.

“La instalación utiliza npm ci. El comando seed carga los cinco géneros y los tipos película y serie sin duplicarlos. Con npm start iniciamos el servicio local. La ruta de salud confirma que la API y SQLite responden.”

## 1:20-2:30 | Creación y actualización de los cinco módulos

Ejecutar las carpetas de creación y actualización en orden. Mostrar cada POST 201 y cada PUT 200, con los campos modificados. La colección captura automáticamente los IDs.

“Primero creo género, director, productora y tipo. Después registro media con esos cuatro IDs. Ahora actualizo cada módulo con PUT: nombre del género, nombres del director, slogan de productora, descripción del tipo y título de la producción. Esta parte demuestra creación y actualización en los cinco módulos que evalúa la rúbrica.”

## 2:30-3:30 | Consulta y reglas

Mostrar GET de media con relaciones, listado filtrado y las solicitudes negativas.

“La consulta devuelve los datos de la producción y sus catálogos relacionados. Los listados tienen filtros y paginación. Un serial o una URL repetidos producen 409. Si intento crear media con un género inactivo, responde 422. Eliminar una productora utilizada devuelve 409 para proteger la integridad.”

## 3:30-4:05 | Eliminación y pruebas

Ejecutar limpieza: primero media y después sus catálogos. Mostrar 204. Mostrar `npm test`.

“Elimino la media y después los catálogos que ya no están relacionados. DELETE responde 204 sin cuerpo. Las 36 pruebas automatizadas comprueban el CRUD de los cinco módulos, las validaciones, la persistencia y la carga inicial. Todas pasaron en la ejecución realizada.”

## 4:05-4:30 | Cierre

Mostrar el repositorio.

“El repositorio incluye el código, esquema SQL, instrucciones, colección de Postman y contrato OpenAPI. La entrega cubre el backend solicitado. Como mejora futura se puede integrar una interfaz de administración. Gracias.”

Subir la grabación real a Google Drive. Comprobar que el docente puede abrir el enlace y copiarlo en la entrega de Canvas. Si se utiliza la alternativa escrita prevista por la consigna, entregar el informe con la portada individual.
