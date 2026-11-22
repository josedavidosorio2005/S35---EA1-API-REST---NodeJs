import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const INITIAL = { nombres: '', estado: 'Activo' };

export default function Directores() {
  const [directores, setDirectores] = useState([]);
  const [form, setForm]             = useState(INITIAL);
  const [editId, setEditId]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [show, setShow]             = useState(false);
  const [search, setSearch]         = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/directores');
      setDirectores(data);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar los directores', 'error');
    }
  };

  const openNew  = () => { setForm(INITIAL); setEditId(null); setShow(true); };
  const openEdit = (d)  => { setForm({ nombres: d.nombres, estado: d.estado }); setEditId(d.id); setShow(true); };
  const closeModal = ()  => { setShow(false); setForm(INITIAL); setEditId(null); };

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/directores/${editId}`, form);
        Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Director actualizado correctamente', timer: 1800, showConfirmButton: false });
      } else {
        await api.post('/directores', form);
        Swal.fire({ icon: 'success', title: 'Creado', text: 'Director creado correctamente', timer: 1800, showConfirmButton: false });
      }
      fetchData();
      closeModal();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombres) => {
    const result = await Swal.fire({
      title: '¿Eliminar director?',
      html: `Se eliminará a <strong>${nombres}</strong>. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#546e7a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/directores/${id}`);
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.error || 'No se pudo eliminar', 'error');
      }
    }
  };

  const filtered = directores.filter(d =>
    d.nombres.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: '#4a148c' }}>
            <i className="bi bi-person-video3 me-2"></i>Directores
          </h2>
          <small className="text-muted">{directores.length} registros totales</small>
        </div>
        <button className="btn btn-primary px-3" onClick={openNew}>
          <i className="bi bi-plus-circle me-1"></i> Nuevo Director
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
              placeholder="Buscar por nombre..."
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
                  <th>Nombres</th>
                  <th style={{ width: 110 }}>Estado</th>
                  <th style={{ width: 110 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                      {search ? 'Sin resultados para tu búsqueda' : 'No hay directores registrados'}
                    </td>
                  </tr>
                ) : filtered.map((d, i) => (
                  <tr key={d.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6a1b9a,#4a148c)', fontSize: '0.85rem', flexShrink: 0 }}
                        >
                          {d.nombres.charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-semibold">{d.nombres}</span>
                      </div>
                    </td>
                    <td>
                      <span className={d.estado === 'Activo' ? 'badge-activo' : 'badge-inactivo'}>
                        {d.estado}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" title="Editar" onClick={() => openEdit(d)}>
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" title="Eliminar" onClick={() => handleDelete(d.id, d.nombres)}>
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
              <div className="modal-header" style={{ background: 'linear-gradient(135deg,#6a1b9a,#4a148c)', color: '#fff', borderRadius: '14px 14px 0 0' }}>
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-person-plus-fill'} me-2`}></i>
                  {editId ? 'Editar Director' : 'Nuevo Director'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Nombres <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      className="form-control"
                      value={form.nombres}
                      onChange={handleChange}
                      placeholder="Nombre completo del director"
                      required
                    />
                  </div>
                  <div className="mb-1">
                    <label className="form-label fw-semibold">Estado</label>
                    <select name="estado" className="form-select" value={form.estado} onChange={handleChange}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
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
