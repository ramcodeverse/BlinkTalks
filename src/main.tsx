import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Dynamic API Routing Interceptor for headless deployments (e.g., Netlify)
const viteApiUrl = (import.meta.env.VITE_API_URL || "").trim();
if (viteApiUrl) {
  const cleanBase = viteApiUrl.endsWith("/") ? viteApiUrl.slice(0, -1) : viteApiUrl;
  const originalFetch = window.fetch;
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : "";
    if (url && url.startsWith("/api/")) {
      return originalFetch(`${cleanBase}${url}`, init);
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
