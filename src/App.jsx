import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Estadisticas from "./pages/Estadisticas";
import Participantes from "./pages/Participantes";
import Historico from "./pages/Historico";
import Reglamento from "./pages/Reglamento";
import Navbar from "./Navbar";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/participantes" element={<Participantes />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/reglamento" element={<Reglamento />} />
      </Routes>
    </>
  );
}
