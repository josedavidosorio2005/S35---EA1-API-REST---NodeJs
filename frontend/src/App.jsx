import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Footer  from './components/Footer';
import Home        from './pages/Home';
import Generos     from './pages/generos/Generos';
import Directores  from './pages/directores/Directores';
import Productoras from './pages/productoras/Productoras';
import Tipos       from './pages/tipos/Tipos';
import Media       from './pages/media/Media';

const pageTitles = {
  '/':            'Inicio',
  '/generos':     'Géneros',
  '/directores':  'Directores',
  '/productoras': 'Productoras',
  '/tipos':       'Tipos',
  '/media':       'Películas y Series',
};

function Topbar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'CineApp';
  return (
    <div className="topbar d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-2">
        <i className="bi bi-camera-reels text-primary"></i>
        <span className="fw-semibold text-dark">{title}</span>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2">
          <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.4rem', verticalAlign: 'middle' }}></i>
          API conectada
        </span>
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
          {new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}

function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/generos"    element={<Generos />} />
            <Route path="/directores" element={<Directores />} />
            <Route path="/productoras"element={<Productoras />} />
            <Route path="/tipos"      element={<Tipos />} />
            <Route path="/media"      element={<Media />} />
            <Route path="*"           element={
              <div className="text-center py-5">
                <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                <h3 className="mt-3">Página no encontrada</h3>
                <a href="/" className="btn btn-primary mt-3">Volver al inicio</a>
              </div>
            } />
          </Routes>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
