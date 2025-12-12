import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <>
      {/* NAV PARA ESCRITORIO */}
      <nav className="navbar-desktop">
        <NavLink to="/" className="nav-item">Tabla</NavLink>
        <NavLink to="/estadisticas" className="nav-item">Estadísticas</NavLink>
        <NavLink to="/participantes" className="nav-item">Participantes</NavLink>
        <NavLink to="/historico" className="nav-item">Histórico</NavLink>
        <NavLink to="/reglamento" className="nav-item">Reglamento</NavLink>
      </nav>

      {/* NAV PARA CELULAR */}
      <nav className="navbar-mobile">
        <NavLink to="/" className="nav-item">Tabla</NavLink>
        <NavLink to="/estadisticas" className="nav-item">Stats</NavLink>
        <NavLink to="/participantes" className="nav-item">Jugadores</NavLink>
        <NavLink to="/historico" className="nav-item">Histórico</NavLink>
        <NavLink to="/reglamento" className="nav-item">Reglas</NavLink>
      </nav>
    </>
  );
}
