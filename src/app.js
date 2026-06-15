import cors from "cors";
import express from "express";
import documentRoutes from "./routes/documents.js";
import matchRoutes from "./routes/match.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/documents", documentRoutes);
  app.use("/match", matchRoutes);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({
      error: err.message || "Internal server error"
    });
  });

  return app;
}
