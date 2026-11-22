# F30 EA3 - Despliegue en Render (IU Digital)

## Repositorios y ramas de la entrega

- Backend: https://github.com/josedavidosorio2005/S35---EA1-API-REST---NodeJs
- Frontend: https://github.com/josedavidosorio2005/EA1-API-REST---NodeJs (subcarpeta `EA2 Front End - ReactJs`)
- Seleccionar en ambos la rama `feat/f30-ea3-render-2026`. Los cambios de despliegue están en esa rama; no en `main`.

## 1. Backend: Web Service

En Render, usar **New > Web Service > Public Git Repository** y pegar la URL del backend, o seleccionarlo desde Git Provider.

| Campo | Valor |
| --- | --- |
| Nombre | `cineapp-api-ea3` (o uno disponible) |
| Branch | `feat/f30-ea3-render-2026` |
| Runtime | Node |
| Root Directory | vacío (raíz del repositorio) |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| HOST | `0.0.0.0` |
| FRONTEND_ORIGIN | Añadir luego la URL exacta del frontend, sin barra final |

El servicio requiere Node.js 24 dentro de la rama LTS 24, según `package.json`.
Si se crea una variable de entorno `HOST`, debe valer `0.0.0.0`.
Render proporciona `PORT` automáticamente. No hace falta fijarlo.

Verificar la URL HTTPS asignada por Render en `/api/health`.
Debe responder `{"estado":"ok","base_datos":"SQLite"}`.

**Persistencia importante:** SQLite guarda los datos en `./data/peliculas.sqlite`. En servicios gratuitos con sistema de archivos efímero pueden desaparecer después de reinicios o redeploys. Para conservar datos de forma duradera se necesita un disco persistente en una instancia compatible u otra solución de base de datos persistente. Evita alojar información real o sensible: la API de este ejercicio no cuenta con autenticación.

## 2. Frontend: Static Site

Crear **New > Static Site** y seleccionar el repositorio `EA1-API-REST---NodeJs`.

| Campo | Valor |
| --- | --- |
| Nombre | `cineapp-ea3` (o uno disponible) |
| Branch | `feat/f30-ea3-render-2026` |
| Root Directory | `EA2 Front End - ReactJs` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Environment Variable | `VITE_API_URL=https://URL-DEL-BACKEND.onrender.com/api` |

Sustituir `URL-DEL-BACKEND.onrender.com` por el dominio real de Render; este valor se incrusta durante `npm run build`.

En **Redirects/Rewrites**, agregar una regla de tipo Rewrite de `/*` a `/index.html` (para React Router).

## 3. Autorizar frontend

Cuando Render entregue la URL final del Static Site, en el Web Service (backend), abrir **Environment** y configurar:
```text
FRONTEND_ORIGIN=https://URL-DEL-FRONTEND.onrender.com
```
Usar el origen HTTPS exacto, sin barra final. Guardar y esperar el redeploy del servicio.

## 4. Validación para la rúbrica

Desde la URL pública del frontend:
1. Crear y actualizar un Género.
2. Crear y actualizar un Director.
3. Crear y actualizar una Productora.
4. Crear y actualizar un Tipo.
5. Crear y actualizar una Película o Serie asociada a los catálogos anteriores.
6. Recargar la página y comprobar que las modificaciones siguen visibles.
7. Comprobar que `/api/health` responde y que no hay errores de red o CORS en la consola.

Registrar capturas de cada operación, del historial de deploys de Render, de los dos servicios y de GitHub. Grabar un vídeo de 3 a 5 minutos y añadir su URL a la entrega, además del enlace del código fuente.

**Nota:** esta guía prepara la configuración, pero no acredita que el despliegue ya esté realizado. Solo registrar como completado lo efectivamente verificado en las URL públicas.
