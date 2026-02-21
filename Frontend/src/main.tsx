
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  (function () {
    try {
      const t = localStorage.getItem('campuskart_theme');
      if (t === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (_) {}
  })();

  createRoot(document.getElementById("root")!).render(<App />);
  