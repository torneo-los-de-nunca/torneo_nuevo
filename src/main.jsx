import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";   // 👈 EL ÚNICO CSS QUE SE IMPORTA

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
