import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const INITIAL = { nombre: '', estado: 'Activo', slogan: '', descripcion: '' };

export default function Productoras() {
  const [productoras, setProductoras] = useState([]);
  const [form, setForm]               = useState(INITIAL);
  const [editId, setEditId]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [show, setShow]               = useState(false);
  const [search, setSearch]           = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/productoras');
      setProductoras(data);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar las productoras', 'error');
    }
  };

  const openNew  = () => { setForm(INITIAL); setEditId(null); setShow(true); };
  const openEdit = (p)  => {
    setForm({ nombre: p.nombre, estado: p.estado, slogan: p.slogan || '', descripcion: p.descripcion || '' });
    setEditId(p.id);
    setShow(true);
  };
  const closeModal = () => { setShow(false); setForm(INITIAL); setEditId(null); };

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/productoras/${editId}`, form);
        Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Productora actualizada correctamente', timer: 1800, showConfirmButton: false });
      } else {
        await api.post('/productoras', form);
        Swal.fire({ icon: 'success', title: 'Creada', text: 'Productora creada correctamente', timer: 1800, showConfirmButton: false });
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
      title: '¿Eliminar productora?',
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
        await api.delete(`/productoras/${id}`);
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.error || 'No se pudo eliminar', 'error');
      }
    }
  };

  const filtered = productoras.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.slogan || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: '#004d40' }}>
            <i className="bi bi-building me-2"></i>Productoras
          </h2>
          <small className="text-muted">{productoras.length} registros totales</small>
        </div>
        <button className="btn btn-primary px-3" onClick={openNew}>
          <i className="bi bi-plus-circle me-1"></i> Nueva Productora
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
              placeholder="Buscar por nombre o slogan..."
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
                  <th>Slogan</th>
                  <th style={{ width: 110 }}>Estado</th>
                  <th>Descripción</th>
                  <th style={{ width: 110 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                      {search ? 'Sin resultados para tu búsqueda' : 'No hay productoras registradas'}
                    </td>
                  </tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="fw-semibold">{p.nombre}</td>
                    <td className="text-muted fst-italic">{p.slogan || <span className="opacity-50">—</span>}</td>
                    <td>
                      <span className={p.estado === 'Activo' ? 'badge-activo' : 'badge-inactivo'}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="text-muted" style={{ maxWidth: 200 }}>
                      <span title={p.descripcion}>
                        {p.descripcion ? (p.descripcion.length > 60 ? p.descripcion.substring(0, 60) + '…' : p.descripcion) : <span className="opacity-50">—</span>}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" title="Editar" onClick={() => openEdit(p)}>
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" title="Eliminar" onClick={() => handleDelete(p.id, p.nombre)}>
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
              <div className="modal-header" style={{ background: 'linear-gradient(135deg,#00695c,#004d40)', color: '#fff', borderRadius: '14px 14px 0 0' }}>
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-building-add'} me-2`}></i>
                  {editId ? 'Editar Productora' : 'Nueva Productora'}
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
                      placeholder="Nombre de la productora"
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
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Slogan</label>
                    <input
                      type="text"
                      name="slogan"
                      className="form-control"
                      value={form.slogan}
                      onChange={handleChange}
                      placeholder="Slogan de la productora (opcional)"
                    />
                  </div>
                  <div className="mb-1">
                    <label className="form-label fw-semibold">Descripción</label>
                    <textarea
                      name="descripcion"
                      className="form-control"
                      rows={3}
                      value={form.descripcion}
                      onChange={handleChange}
                      placeholder="Descripción opcional..."
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
