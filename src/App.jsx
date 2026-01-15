import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Estadisticas from "./pages/Estadisticas.jsx";
import Participantes from "./pages/Participantes.jsx";
import Historico from "./pages/Historico.jsx";
import Reglamento from "./pages/Reglamento.jsx";

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
