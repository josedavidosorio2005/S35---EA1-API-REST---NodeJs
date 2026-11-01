// Definiciones explícitas de los cinco módulos. Solo estas tablas y campos
// pueden formar parte del SQL; los valores siempre se envían como parámetros.
const text = (max) => ({ type: 'text', max });
const state = { type: 'state', default: 'Activo' };
export const modules = {
  generos: { fields: { nombre: text(120), estado: state, descripcion: text(2000) } },
  directores: { fields: { nombres: text(180), estado: state } },
  productoras: { fields: { nombre: text(120), estado: state, slogan: text(300), descripcion: text(2000) } },
  tipos: { fields: { nombre: text(120), descripcion: text(2000) } },
  media: { fields: {
    serial: text(80), titulo: text(200), sinopsis: text(5000),
    url: { type: 'url', max: 2048 }, imagen_portada: { type: 'url', max: 2048 },
    anio_estreno: { type: 'integer', min: 1888, max: 9999 },
    genero_id: { type: 'reference', table: 'generos', active: true },
    director_id: { type: 'reference', table: 'directores', active: true },
    productora_id: { type: 'reference', table: 'productoras', active: true },
    tipo_id: { type: 'reference', table: 'tipos' }
  } }
};
