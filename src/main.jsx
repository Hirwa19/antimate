import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AppSettingsProvider } from "./context/AppSettingsContext.jsx";

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js"
          );

        console.log(
          "✅ Service Worker registered:",
          registration.scope
        );
      } catch (error) {
        console.error(
          "❌ Service Worker registration failed:",
          error
        );
      }
    }
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <AppSettingsProvider>
      <App />
    </AppSettingsProvider>
  </React.StrictMode>
);