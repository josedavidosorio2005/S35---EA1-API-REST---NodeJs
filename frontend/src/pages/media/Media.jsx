import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const INITIAL = {
  serial: '', titulo: '', sinopsis: '', url: '', portada: '',
  anio_estreno: '', genero_id: '', director_id: '', productora_id: '', tipo_id: '',
};

export default function Media() {
  const [media, setMedia]           = useState([]);
  const [form, setForm]             = useState(INITIAL);
  const [editId, setEditId]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [show, setShow]             = useState(false);
  const [search, setSearch]         = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Opciones para selects
  const [generos, setGeneros]       = useState([]);
  const [directores, setDirectores] = useState([]);
  const [productoras, setProductoras] = useState([]);
  const [tipos, setTipos]           = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const { data } = filterTipo
        ? await api.get(`/media/filtro/tipo/${filterTipo}`)
        : await api.get('/media');
      setMedia(data);
    } catch {
      Swal.fire('Error', 'No se pudo cargar el catálogo de media', 'error');
    }
  }, [filterTipo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Carga las opciones de selects al abrir el modal
  const loadSelects = async () => {
    try {
      const [gRes, dRes, pRes, tRes] = await Promise.all([
        api.get('/generos/activos'),
        api.get('/directores/activos'),
        api.get('/productoras/activas'),
        api.get('/tipos'),
      ]);
      setGeneros(gRes.data);
      setDirectores(dRes.data);
      setProductoras(pRes.data);
      setTipos(tRes.data);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar las opciones del formulario', 'error');
    }
  };

  const openNew = async () => {
    await loadSelects();
    setForm(INITIAL);
    setEditId(null);
    setShow(true);
  };

  const openEdit = async (m) => {
    await loadSelects();
    setForm({
      serial:        m.serial,
      titulo:        m.titulo,
      sinopsis:      m.sinopsis       || '',
      url:           m.url,
      portada:       m.portada        || '',
      anio_estreno:  m.anio_estreno   || '',
      genero_id:     String(m.genero_id),
      director_id:   String(m.director_id),
      productora_id: String(m.productora_id),
      tipo_id:       String(m.tipo_id),
    });
    setEditId(m.id);
    setShow(true);
  };

  const closeModal = () => { setShow(false); setForm(INITIAL); setEditId(null); };

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/media/${editId}`, form);
        Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Media actualizada correctamente', timer: 1800, showConfirmButton: false });
      } else {
        await api.post('/media', form);
        Swal.fire({ icon: 'success', title: 'Creado', text: 'Media creada correctamente', timer: 1800, showConfirmButton: false });
      }
      fetchData();
      closeModal();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, titulo) => {
    const result = await Swal.fire({
      title: '¿Eliminar media?',
      html: `Se eliminará <strong>${titulo}</strong>. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#546e7a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/media/${id}`);
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.error || 'No se pudo eliminar', 'error');
      }
    }
  };

  const handleDetail = (m) => {
    Swal.fire({
      title: m.titulo,
      html: `
        <div class="text-start">
          ${m.portada ? `<img src="${m.portada}" alt="portada" class="img-fluid rounded mb-3" style="max-height:200px;object-fit:cover;width:100%">` : ''}
          <p class="mb-1"><strong>Serial:</strong> ${m.serial}</p>
          <p class="mb-1"><strong>Tipo:</strong> ${m.tipo || '—'}</p>
          <p class="mb-1"><strong>Género:</strong> ${m.genero || '—'}</p>
          <p class="mb-1"><strong>Director:</strong> ${m.director || '—'}</p>
          <p class="mb-1"><strong>Productora:</strong> ${m.productora || '—'}</p>
          <p class="mb-1"><strong>Año estreno:</strong> ${m.anio_estreno || '—'}</p>
          <p class="mb-1"><strong>URL:</strong> <a href="${m.url}" target="_blank" rel="noopener noreferrer">${m.url}</a></p>
          ${m.sinopsis ? `<p class="mb-0 mt-2"><strong>Sinopsis:</strong> ${m.sinopsis}</p>` : ''}
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 500,
    });
  };

  const filtered = media.filter(m =>
    m.titulo.toLowerCase().includes(search.toLowerCase()) ||
    m.serial.toLowerCase().includes(search.toLowerCase()) ||
    (m.genero || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.director || '').toLowerCase().includes(search.toLowerCase())
  );

  const currentYear = new Date().getFullYear();

  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: '#b71c1c' }}>
            <i className="bi bi-film me-2"></i>Películas y Series
          </h2>
          <small className="text-muted">{media.length} registros</small>
        </div>
        <button className="btn btn-primary px-3" onClick={openNew}>
          <i className="bi bi-plus-circle me-1"></i> Nueva Película/Serie
        </button>
      </div>

      {/* Filtros */}
      <div className="row g-2 mb-3">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body py-2 px-3">
              <div className="input-group">
                <span className="input-group-text border-0 bg-transparent">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 shadow-none"
                  placeholder="Buscar por título, serial, género o director..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="btn btn-link text-muted" onClick={() => setSearch('')}>
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body py-2 px-3">
              <div className="input-group">
                <span className="input-group-text border-0 bg-transparent">
                  <i className="bi bi-funnel text-muted"></i>
                </span>
                <select
                  className="form-select border-0 shadow-none"
                  value={filterTipo}
                  onChange={e => setFilterTipo(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  {[...new Set(media.map(m => m.tipo).filter(Boolean))].map(t => (
                    <option key={t} value={media.find(m => m.tipo === t)?.tipo_id}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="table-dark">
                  <th style={{ width: 50 }}>#</th>
                  <th style={{ width: 70 }}>Portada</th>
                  <th>Título</th>
                  <th>Serial</th>
                  <th>Tipo</th>
                  <th>Género</th>
                  <th>Director</th>
                  <th style={{ width: 80 }}>Año</th>
                  <th style={{ width: 120 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                      {search ? 'Sin resultados para tu búsqueda' : 'No hay películas o series registradas'}
                    </td>
                  </tr>
                ) : filtered.map((m, i) => (
                  <tr key={m.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      {m.portada
                        ? <img src={m.portada} alt={m.titulo} className="rounded" style={{ width: 45, height: 60, objectFit: 'cover' }} />
                        : <div className="rounded bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center" style={{ width: 45, height: 60 }}>
                            <i className="bi bi-film text-muted"></i>
                          </div>
                      }
                    </td>
                    <td>
                      <span className="fw-semibold d-block">{m.titulo}</span>
                      {m.productora && <small className="text-muted">{m.productora}</small>}
                    </td>
                    <td className="text-muted font-monospace">{m.serial}</td>
                    <td>
                      <span className="badge bg-warning text-dark">{m.tipo || '—'}</span>
                    </td>
                    <td className="text-muted">{m.genero || '—'}</td>
                    <td className="text-muted">{m.director || '—'}</td>
                    <td className="text-muted">{m.anio_estreno || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-info me-1" title="Ver detalle" onClick={() => handleDetail(m)}>
                        <i className="bi bi-eye-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-primary me-1" title="Editar" onClick={() => openEdit(m)}>
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" title="Eliminar" onClick={() => handleDelete(m.id, m.titulo)}>
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 14 }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg,#c62828,#b71c1c)', color: '#fff', borderRadius: '14px 14px 0 0' }}>
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-film'} me-2`}></i>
                  {editId ? 'Editar Película / Serie' : 'Nueva Película / Serie'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Serial */}
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Serial <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="serial"
                        className="form-control"
                        value={form.serial}
                        onChange={handleChange}
                        placeholder="Ej. MOV-001"
                        required
                      />
                    </div>
                    {/* Título */}
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">
                        Título <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="titulo"
                        className="form-control"
                        value={form.titulo}
                        onChange={handleChange}
                        placeholder="Título de la película o serie"
                        required
                      />
                    </div>
                    {/* URL */}
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">
                        URL <span className="text-danger">*</span>
                      </label>
                      <input
                        type="url"
                        name="url"
                        className="form-control"
                        value={form.url}
                        onChange={handleChange}
                        placeholder="https://ejemplo.com/pelicula"
                        required
                      />
                    </div>
                    {/* Año */}
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Año de estreno</label>
                      <input
                        type="number"
                        name="anio_estreno"
                        className="form-control"
                        value={form.anio_estreno}
                        onChange={handleChange}
                        min={1888}
                        max={currentYear + 2}
                        placeholder={String(currentYear)}
                      />
                    </div>
                    {/* Portada */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">URL de portada</label>
                      <input
                        type="url"
                        name="portada"
                        className="form-control"
                        value={form.portada}
                        onChange={handleChange}
                        placeholder="https://ejemplo.com/portada.jpg (opcional)"
                      />
                    </div>
                    {/* Tipo */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Tipo <span className="text-danger">*</span>
                      </label>
                      <select name="tipo_id" className="form-select" value={form.tipo_id} onChange={handleChange} required>
                        <option value="">Selecciona un tipo…</option>
                        {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
                    {/* Género */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Género <span className="text-danger">*</span>
                      </label>
                      <select name="genero_id" className="form-select" value={form.genero_id} onChange={handleChange} required>
                        <option value="">Selecciona un género…</option>
                        {generos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                      </select>
                    </div>
                    {/* Director */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Director <span className="text-danger">*</span>
                      </label>
                      <select name="director_id" className="form-select" value={form.director_id} onChange={handleChange} required>
                        <option value="">Selecciona un director…</option>
                        {directores.map(d => <option key={d.id} value={d.id}>{d.nombres}</option>)}
                      </select>
                    </div>
                    {/* Productora */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Productora <span className="text-danger">*</span>
                      </label>
                      <select name="productora_id" className="form-select" value={form.productora_id} onChange={handleChange} required>
                        <option value="">Selecciona una productora…</option>
                        {productoras.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    {/* Sinopsis */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">Sinopsis</label>
                      <textarea
                        name="sinopsis"
                        className="form-control"
                        rows={3}
                        value={form.sinopsis}
                        onChange={handleChange}
                        placeholder="Descripción de la película o serie (opcional)..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-danger px-4" disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-1"></span>Guardando...</>
                      : <><i className={`bi ${editId ? 'bi-save' : 'bi-plus-circle'} me-1`}></i>{editId ? 'Actualizar' : 'Guardar'}</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
