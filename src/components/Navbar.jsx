import "./Navbar.css";

export default function Navbar({ pestañaActiva, cambiarPestaña }) {
  const tabs = [
    { id: "tabla", label: "TABLA" },
    { id: "estadisticas", label: "ESTADÍSTICAS" },
    { id: "descripcion", label: "DESCRIPCIÓN" },
  ];

  return (
    <div className="navbar-gamer">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={
            pestañaActiva === tab.id ? "nav-btn nav-activa" : "nav-btn"
          }
          onClick={() => cambiarPestaña(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
import { useAdmin } from "./context/AdminContext";

const { isAdmin, logout } = useAdmin();

{isAdmin && (
  <button onClick={logout}>
    Salir Admin
  </button>
)}
