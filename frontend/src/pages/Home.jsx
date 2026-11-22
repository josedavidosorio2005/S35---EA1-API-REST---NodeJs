import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const modules = [
  { label: 'Géneros',              to: '/generos',     endpoint: '/generos',     icon: 'bi-tags-fill',       gradient: 'linear-gradient(135deg,#1565c0,#0d47a1)' },
  { label: 'Directores',           to: '/directores',  endpoint: '/directores',  icon: 'bi-person-video3',   gradient: 'linear-gradient(135deg,#6a1b9a,#4a148c)' },
  { label: 'Productoras',          to: '/productoras', endpoint: '/productoras', icon: 'bi-building',        gradient: 'linear-gradient(135deg,#00695c,#004d40)' },
  { label: 'Tipos',                to: '/tipos',       endpoint: '/tipos',       icon: 'bi-collection-fill', gradient: 'linear-gradient(135deg,#e65100,#bf360c)' },
  { label: 'Películas y Series',   to: '/media',       endpoint: '/media',       icon: 'bi-film',            gradient: 'linear-gradient(135deg,#c62828,#b71c1c)' },
];

export default function Home() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    modules.forEach(async ({ endpoint, label }) => {
      try {
        const { data } = await api.get(endpoint);
        setCounts(prev => ({ ...prev, [label]: Array.isArray(data) ? data.length : 0 }));
      } catch {
        setCounts(prev => ({ ...prev, [label]: '—' }));
      }
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <div
        className="rounded-3 p-4 mb-4 text-white d-flex align-items-center gap-4"
        style={{ background: 'linear-gradient(135deg,#0d47a1,#1a237e)', minHeight: 140 }}
      >
        <i className="bi bi-camera-reels-fill" style={{ fontSize: '4rem', opacity: 0.9 }}></i>
        <div>
          <h2 className="fw-bold mb-1">Bienvenido a CineApp</h2>
          <p className="mb-0 opacity-75">
            Gestión completa de películas y series · Evidencia de Aprendizaje 2 – ReactJs
          </p>
        </div>
      </div>

      {/* Stats */}
      <h5 className="fw-semibold text-muted mb-3 text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: 1 }}>
        Resumen del sistema
      </h5>
      <div className="row g-3 mb-4">
        {modules.map(({ label, to, icon, gradient }) => (
          <div className="col-sm-6 col-xl-4" key={label}>
            <Link to={to} className="text-decoration-none">
              <div className="stat-card" style={{ background: gradient }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="mb-1 opacity-75" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{label}</p>
                    <h3 className="fw-bold mb-0">
                      {counts[label] !== undefined ? counts[label] : (
                        <span className="spinner-border spinner-border-sm opacity-75"></span>
                      )}
                    </h3>
                    <small className="opacity-60">registros</small>
                  </div>
                  <i className={`bi ${icon} icon-bg`}></i>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <h5 className="fw-semibold text-muted mb-3 text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: 1 }}>
        Acceso rápido
      </h5>
      <div className="row g-3">
        {modules.map(({ label, to, icon }) => (
          <div className="col-sm-6 col-lg-4" key={label}>
            <Link to={to} className="text-decoration-none">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 12, transition: 'transform .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div className="card-body d-flex align-items-center gap-3 p-3">
                  <div className="rounded-3 p-2 bg-primary bg-opacity-10">
                    <i className={`bi ${icon} text-primary fs-4`}></i>
                  </div>
                  <div>
                    <p className="mb-0 fw-semibold text-dark">{label}</p>
                    <small className="text-muted">Ver y gestionar</small>
                  </div>
                  <i className="bi bi-chevron-right ms-auto text-muted"></i>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
