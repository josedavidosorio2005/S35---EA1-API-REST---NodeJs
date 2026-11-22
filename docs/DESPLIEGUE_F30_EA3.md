# F30 EA3 | Despliegue completo de CineApp en Render

Este repositorio ya contiene el backend y el frontend corregido. La rama `feat/f30-ea3-render-2026` incluye un único Web Service Node.js: el frontend React (Vite) se compila en `frontend/dist` y Express lo sirve desde la misma URL que la API.

## Despliegue con un Blueprint

1. Abrir Render > **New > Blueprint**.
2. Seleccionar este repositorio de GitHub (o conectar GitHub si Render lo solicita).
3. Usar la rama **feat/f30-ea3-render-2026**.
4. Render encontrará el archivo `render.yaml`; revisar el servicio `cineapp-ea3-jose`, tipo Web Service, plan Free.
5. Presionar Apply/Deploy; no seleccionar ningún plan de pago.
6. Abrir la dirección HTTPS asignada por Render. Verificar la pantalla de CineApp y `/api/health`.

**Si Render muestra New Static Site, salir de esa pantalla**: la aplicación es un Web Service Node.js, no una web puramente estática.

### Configuración manual (New > Web Service)
- Repositorio: `https://github.com/josedavidosorio2005/S35---EA1-API-REST---NodeJs`.
- Rama: `feat/f30-ea3-render-2026`.
- Root Directory: vacío.
- Build Command: `npm ci && npm run build`.
- Start Command: `npm start`.
- Entorno: `NODE_VERSION=24.22.1`, `HOST=0.0.0.0`, `NODE_ENV=production`.
- Plan: Free, si está disponible.

### Rutas para verificar
- `https://TU-DOMINIO.onrender.com/`: interfaz CineApp.
- `https://TU-DOMINIO.onrender.com/api/health`: `{"estado":"ok","base_datos":"SQLite"}`.
- `https://TU-DOMINIO.onrender.com/generos`, `/directores`, `/productoras`, `/tipos` y `/media`: cinco módulos.
- `https://TU-DOMINIO.onrender.com/api/generos`: API REST.

## Evidencias para evaluación
Capturar Render en estado Live, enlaces de GitHub, `/api/health`, la creación **y actualización** de un registro en cada uno de los cinco módulos. Cargar catálogo de Género, Director, Productora y Tipo antes de probar Películas y Series. Grabar video de 3 a 5 minutos, publicarlo en YouTube y añadir tanto el enlace de YouTube como el de Google Drive al documento si la consigna lo requiere.

El documento final debe incluir portada, introducción, explicación paso a paso del despliegue con capturas **reales**, enlaces del código, video y conclusión.

**Limitación importante**: Render Free utiliza almacenamiento efímero. SQLite puede perder los registros al reiniciar o redesplegar el servicio. Para preservar datos se requiere almacenamiento persistente o una base de datos externa. Este sistema académico no tiene autenticación: no usar datos sensibles ni personales en un despliegue público.

## Verificación local
Con Node 24.22.1:
```bash
npm ci
npm test
npm run build
npm start
```
Abrir `http://localhost:3000/` y `http://localhost:3000/api/health`.
