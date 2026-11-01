# Evidencia de validación

Fecha: 1 de noviembre de 2026. Entorno: Node.js 24.22.1, npm 11.9.0, Express 5.3.0 y SQLite integrado.

## Instalación reproducible y pruebas

Se ejecutó `npm ci --no-audit --no-fund`, seguido de `npm test` y `npm run seed` desde la raíz del proyecto. Resultado de la suite:

```text
tests 36
pass 36
fail 0
cancelled 0
skipped 0
```

La suite usa HTTP real contra servidores locales efímeros y bases aisladas. Incluye creación, consulta, PUT, PATCH y DELETE de los cinco recursos, validación, unicidad, integridad, estados, persistencia y seed idempotente. Las pruebas no reemplazan una evaluación de carga o un despliegue de producción.

## Colección Postman ejecutada con Newman

Con el servidor iniciado mediante `npm start`, se ejecutó:

```bash
npm exec --yes --package=newman -- newman run postman/API_Peliculas.postman_collection.json
```

Newman es opcional y no forma parte de las dependencias de ejecución de la API. La misma colección puede ejecutarse desde Postman Collection Runner.

| Componente | Total | Fallos |
| --- | ---: | ---: |
| Iteraciones | 1 | 0 |
| Solicitudes HTTP | 30 | 0 |
| Scripts de prueba | 30 | 0 |
| Comprobaciones | 52 | 0 |

El recorrido verificó POST y PUT en los cinco módulos, listados paginados, consulta de media con sus cuatro relaciones, rechazo de duplicados, referencia inexistente, género inactivo, conservación histórica y borrado protegido. La limpieza eliminó únicamente los registros creados por esa ejecución.

GitHub Actions define la ejecución futura de `npm ci` y `npm test` en Node 24. La ejecución remota debe consultarse en la pestaña Actions; estos resultados corresponden a la validación local realizada.
