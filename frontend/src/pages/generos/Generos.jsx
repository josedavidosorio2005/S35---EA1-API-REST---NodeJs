import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const INITIAL = { nombre: '', estado: 'Activo', descripcion: '' };

export default function Generos() {
  const [generos, setGeneros] = useState([]);
  const [form, setForm]       = useState(INITIAL);
  const [editId, setEditId]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow]       = useState(false);
  const [search, setSearch]   = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/generos');
      setGeneros(data);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar los géneros', 'error');
    }
  };

  const openNew  = () => { setForm(INITIAL); setEditId(null); setShow(true); };
  const openEdit = (g)  => { setForm({ nombre: g.nombre, estado: g.estado, descripcion: g.descripcion || '' }); setEditId(g.id); setShow(true); };
  const closeModal = ()  => { setShow(false); setForm(INITIAL); setEditId(null); };

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/generos/${editId}`, form);
        Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Género actualizado correctamente', timer: 1800, showConfirmButton: false });
      } else {
        await api.post('/generos', form);
        Swal.fire({ icon: 'success', title: 'Creado', text: 'Género creado correctamente', timer: 1800, showConfirmButton: false });
      }
      fetchData();
      closeModal();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar género?',
      html: `Se eliminará <strong>${nombre}</strong>. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#546e7a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/generos/${id}`);
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.error || 'No se pudo eliminar', 'error');
      }
    }
  };

  const filtered = generos.filter(g =>
    g.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (g.descripcion || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: '#0d47a1' }}>
            <i className="bi bi-tags-fill me-2"></i>Géneros
          </h2>
          <small className="text-muted">{generos.length} registros totales</small>
        </div>
        <button className="btn btn-primary px-3" onClick={openNew}>
          <i className="bi bi-plus-circle me-1"></i> Nuevo Género
        </button>
      </div>

      {/* Buscador */}
      <div className="card mb-3">
        <div className="card-body py-2 px-3">
          <div className="input-group">
            <span className="input-group-text border-0 bg-transparent">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 shadow-none"
              placeholder="Buscar por nombre o descripción..."
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

      {/* Tabla */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="table-dark">
                  <th style={{ width: 50 }}>#</th>
                  <th>Nombre</th>
                  <th style={{ width: 110 }}>Estado</th>
                  <th>Descripción</th>
                  <th style={{ width: 110 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                      {search ? 'Sin resultados para tu búsqueda' : 'No hay géneros registrados'}
                    </td>
                  </tr>
                ) : filtered.map((g, i) => (
                  <tr key={g.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="fw-semibold">{g.nombre}</td>
                    <td>
                      <span className={g.estado === 'Activo' ? 'badge-activo' : 'badge-inactivo'}>
                        {g.estado}
                      </span>
                    </td>
                    <td className="text-muted">{g.descripcion || <span className="text-muted opacity-50">—</span>}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        title="Editar"
                        onClick={() => openEdit(g)}
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Eliminar"
                        onClick={() => handleDelete(g.id, g.nombre)}
                      >
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
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 14 }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg,#1565c0,#0d47a1)', color: '#fff', borderRadius: '14px 14px 0 0' }}>
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle-fill'} me-2`}></i>
                  {editId ? 'Editar Género' : 'Nuevo Género'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Nombre <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-control"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Ej. Acción, Drama, Terror..."
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Estado</label>
                    <select name="estado" className="form-select" value={form.estado} onChange={handleChange}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div className="mb-1">
                    <label className="form-label fw-semibold">Descripción</label>
                    <textarea
                      name="descripcion"
                      className="form-control"
                      rows={3}
                      value={form.descripcion}
                      onChange={handleChange}
                      placeholder="Descripción opcional del género..."
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={loading}>
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
