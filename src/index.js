import React from "react";
import ReactDOM from "react-dom/client";
import { ClientContextProvider } from "./context/ClientContext";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ClientContextProvider>
      <App />
    </ClientContextProvider>
  </React.StrictMode>
);
