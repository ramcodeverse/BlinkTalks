import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load Environment Variables
dotenv.config();

import { seedDatabase } from "./server/seed.ts";
import apiRoutes from "./server/routes.ts";
import { setupWebSocketServer } from "./server/websocket.ts";

const _filename = typeof __filename !== "undefined" ? __filename : (import.meta && import.meta.url ? fileURLToPath(import.meta.url) : "");
const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(_filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // Custom CORS middleware for headless frontend compatibility (e.g., Netlify)
  app.use((req, res, next) => {
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Run Developer DB Seed
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Failed to run seed script on boot:", err);
  }

  // API Routes MUST be declared before Vite middlewares
  app.use(apiRoutes);

  // Healthy probe endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  const httpServer = http.createServer(app);

  // Bind WebSocket handler to Server
  setupWebSocketServer(httpServer);

  // Integrate Vite dev server for client-side loading or serve built assets in production
  if (process.env.NODE_ENV !== "production") {
    console.log("⚙️ Starting in DEVELOPMENT mode. Mounting Vite Dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting in PRODUCTION mode. Serving static assets from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Fallback any routing to client SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("🔴 Fatal error during server startup:", error);
  process.exit(1);
});
