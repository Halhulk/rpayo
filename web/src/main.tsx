import React from "react";
import ReactDOM from "react-dom/client";
import { HomePage } from "./pages/HomePage";
import { HostPage } from "./pages/HostPage";
import { PayPage } from "./pages/PayPage";
import "./styles.css";

function App() {
  const path = window.location.pathname;

  if (path.startsWith("/host/")) {
    const sessionId = path.split("/host/")[1];
    return <HostPage sessionId={sessionId} />;
  }

  if (path.startsWith("/pay/")) {
    const parts = path.split("/");
    const sessionId = parts[2];
    const participantId = parts[3];
    return <PayPage sessionId={sessionId} participantId={participantId} />;
  }

  return <HomePage />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
