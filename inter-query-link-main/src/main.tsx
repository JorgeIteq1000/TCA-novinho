// src/main.tsx
// (Arquivo completo com a correção)

import React from "react"; // Adicione este import
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- MUDANÇA: Remover o <React.StrictMode> ---
// O StrictMode estava causando um re-render duplo que
// quebrava a biblioteca de tabela em alguns computadores.

createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>  <-- REMOVA ESTA LINHA
  <App />
  // </React.StrictMode> <-- E REMOVA ESTA LINHA
);