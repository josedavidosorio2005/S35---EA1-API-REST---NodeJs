import axios from 'axios';

// La URL de la API se configura en Render al compilar el frontend.
// En desarrollo local, /api se dirige al backend mediante el proxy de Vite.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const modulos = new Set(['generos', 'directores', 'productoras', 'tipos', 'media']);
const camposRelacion = ['genero_id', 'director_id', 'productora_id', 'tipo_id'];

function transformarMedia(registro) {
  if (!registro || typeof registro !== 'object') return registro;
  const nombre = (valor, propiedad = 'nombre') =>
    valor && typeof valor === 'object' ? valor[propiedad] : (valor || '');
  return {
    ...registro,
    portada: registro.imagen_portada || '',
    genero: nombre(registro.genero),
    director: nombre(registro.director, 'nombres'),
    productora: nombre(registro.productora),
    tipo: nombre(registro.tipo),
  };
}

function prepararFormulario(recurso, entrada) {
  const data = { ...entrada };
  if (recurso === 'media') {
    data.imagen_portada = data.portada?.trim() ||
      'https://placehold.co/600x900/png?text=CineApp';
    delete data.portada;
    data.sinopsis = data.sinopsis?.trim() || 'Sin sinopsis disponible.';
    for (const campo of [...camposRelacion, 'anio_estreno']) {
      if (data[campo] !== undefined && data[campo] !== '') data[campo] = Number(data[campo]);
    }
  }
  if (['generos', 'productoras', 'tipos'].includes(recurso)) {
    data.descripcion = data.descripcion?.trim() || 'Sin descripcion.';
  }
  if (recurso === 'productoras') {
    data.slogan = data.slogan?.trim() || 'Sin eslogan.';
  }
  return data;
}

api.interceptors.request.use((config) => {
  const metodo = (config.method || 'get').toLowerCase();
  const rutasActivas = {
    '/generos/activos': '/generos',
    '/directores/activos': '/directores',
    '/productoras/activas': '/productoras',
  };
  if (rutasActivas[config.url]) {
    config.url = rutasActivas[config.url];
    config.params = { ...config.params, estado: 'Activo' };
  }
  const filtroTipo = config.url?.match(/^\/media\/filtro\/tipo\/(\d+)$/);
  if (filtroTipo) {
    config.url = '/media';
    config.params = { ...config.params, tipo_id: Number(filtroTipo[1]) };
  }
  const recurso = config.url?.split('?')[0]?.split('/')[1];
  if (metodo === 'get' && modulos.has(recurso) && config.url?.split('?')[0] === `/${recurso}`) {
    config.params = { limit: 100, ...config.params };
  }
  if (['post', 'put', 'patch'].includes(metodo) && modulos.has(recurso) && config.data) {
    config.data = prepararFormulario(recurso, config.data);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data')) {
      if (Array.isArray(payload.data)) {
        response.data = payload.data.map((item) => response.config.url?.startsWith('/media')
          ? transformarMedia(item)
          : item);
      } else {
        response.data = response.config.url?.startsWith('/media')
          ? transformarMedia(payload.data)
          : payload.data;
      }
    }
    return response;
  },
  (error) => {
    const detalle = error.response?.data?.error;
    if (detalle && typeof detalle === 'object') {
      error.response.data.error = [detalle.mensaje, ...(detalle.detalles || [])].filter(Boolean).join(' ');
    }
    return Promise.reject(error);
  },
);

export default api;
