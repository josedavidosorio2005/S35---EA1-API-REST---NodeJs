export default function Footer() {
  return (
    <footer className="py-3 px-4 mt-auto" style={{ background: '#fff', borderTop: '1px solid #e0e0e0' }}>
      <div className="text-center text-muted" style={{ fontSize: '0.8rem' }}>
        <i className="bi bi-camera-reels-fill me-1 text-primary"></i>
        <strong>CineApp</strong> &nbsp;·&nbsp; Evidencia de Aprendizaje 2 – Front End ReactJs
        &nbsp;·&nbsp; IU Digital de Antioquia &nbsp;·&nbsp; {new Date().getFullYear()}
      </div>
    </footer>
  );
}
