import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { useAdmin } from "./context/AdminContext";

export default function Navbar() {
  const { isAdmin, logout } = useAdmin();

  return (
    <>
      {/* NAV PARA ESCRITORIO */}
      <nav className="navbar-desktop">
        <NavLink to="/" className="nav-item">Tabla</NavLink>
        <NavLink to="/estadisticas" className="nav-item">Estadísticas</NavLink>
        <NavLink to="/participantes" className="nav-item">Participantes</NavLink>
        <NavLink to="/historico" className="nav-item">Histórico</NavLink>
        <NavLink to="/reglamento" className="nav-item">Reglamento</NavLink>

        {isAdmin && (
          <button
            onClick={logout}
            className="nav-item"
            style={{ background: "#444", color: "white" }}
          >
            Salir Admin
          </button>
        )}
      </nav>

      {/* NAV PARA CELULAR */}
      <nav className="navbar-mobile">
        <NavLink to="/" className="nav-item">Tabla</NavLink>
        <NavLink to="/estadisticas" className="nav-item">Stats</NavLink>
        <NavLink to="/participantes" className="nav-item">Jugadores</NavLink>
        <NavLink to="/historico" className="nav-item">Histórico</NavLink>
        <NavLink to="/reglamento" className="nav-item">Reglas</NavLink>

        {isAdmin && (
          <button
            onClick={logout}
            className="nav-item"
            style={{ background: "#444", color: "white" }}
          >
            Salir
          </button>
        )}
      </nav>
    </>
  );
}
