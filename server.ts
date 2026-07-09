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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

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
