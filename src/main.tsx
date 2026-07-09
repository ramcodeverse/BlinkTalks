import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Dynamic API Routing Interceptor for headless deployments (e.g., Netlify)
const viteApiUrl = (import.meta.env.VITE_API_URL || "").trim();
if (viteApiUrl) {
  const cleanBase = viteApiUrl.endsWith("/") ? viteApiUrl.slice(0, -1) : viteApiUrl;
  const originalFetch = window.fetch;
  
  try {
    Object.defineProperty(window, 'fetch', {
      value: async (input: RequestInfo | URL, init?: RequestInit) => {
        let url = "";
        if (typeof input === "string") {
          url = input;
        } else if (input instanceof URL) {
          url = input.toString();
        } else if (input && typeof input === "object" && "url" in input) {
          url = (input as Request).url;
        }

        const currentOrigin = window.location.origin;
        const isRelativeApi = url.startsWith("/api/");
        const isAbsoluteApiOnCurrentOrigin = url.startsWith(`${currentOrigin}/api/`);

        if (isRelativeApi || isAbsoluteApiOnCurrentOrigin) {
          const apiPath = isRelativeApi ? url : url.slice(currentOrigin.length);
          const targetUrl = `${cleanBase}${apiPath}`;

          if (input instanceof Request) {
            // If input is a Request object, clone it with the new URL
            const newRequest = new Request(targetUrl, input);
            return originalFetch(newRequest, init);
          } else {
            return originalFetch(targetUrl, init);
          }
        }

        return originalFetch(input, init);
      },
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (err) {
    console.warn("Failed to intercept window.fetch using Object.defineProperty:", err);
    try {
      (window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        let url = "";
        if (typeof input === "string") {
          url = input;
        } else if (input instanceof URL) {
          url = input.toString();
        } else if (input && typeof input === "object" && "url" in input) {
          url = (input as Request).url;
        }

        const currentOrigin = window.location.origin;
        const isRelativeApi = url.startsWith("/api/");
        const isAbsoluteApiOnCurrentOrigin = url.startsWith(`${currentOrigin}/api/`);

        if (isRelativeApi || isAbsoluteApiOnCurrentOrigin) {
          const apiPath = isRelativeApi ? url : url.slice(currentOrigin.length);
          const targetUrl = `${cleanBase}${apiPath}`;

          if (input instanceof Request) {
            const newRequest = new Request(targetUrl, input);
            return originalFetch(newRequest, init);
          } else {
            return originalFetch(targetUrl, init);
          }
        }

        return originalFetch(input, init);
      };
    } catch (assignErr) {
      console.error("Could not override window.fetch on this platform:", assignErr);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
