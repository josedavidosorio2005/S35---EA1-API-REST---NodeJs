import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/',           icon: 'bi-house-fill',      label: 'Inicio' },
  { to: '/generos',    icon: 'bi-tags-fill',        label: 'Géneros' },
  { to: '/directores', icon: 'bi-person-video3',    label: 'Directores' },
  { to: '/productoras',icon: 'bi-building',         label: 'Productoras' },
  { to: '/tipos',      icon: 'bi-collection-fill',  label: 'Tipos' },
  { to: '/media',      icon: 'bi-film',             label: 'Películas y Series' },
];

export default function Sidebar() {
  return (
    <div className="sidebar d-flex flex-column">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="mb-2">
          <i className="bi bi-camera-reels-fill" style={{ fontSize: '2rem', color: '#90caf9' }}></i>
        </div>
        <h4>CineApp</h4>
        <p>Gestión de Películas y Series</p>
      </div>

      {/* Nav */}
      <nav className="flex-grow-1 py-3">
        <ul className="nav flex-column px-1">
          {navItems.map(({ to, icon, label }) => (
            <li className="nav-item" key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${icon}`}></i>
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer del sidebar */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <small style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>
          IU Digital de Antioquia · EA2
        </small>
      </div>
    </div>
  );
}
