import dotenv from "dotenv";
dotenv.config(); // IMPORTANTE: primero

import express from "express";
import cors from "cors";
import helmet from "helmet";

import { chatRouter } from "./routes/chat.route";

const app = express();

/**
 * CORS (para navegador)
 * - Agrega aquí los dominios que pueden llamar al backend desde frontend.
 * - Incluye también el dominio de "preview" de Duda si están probando ahí.
 */
const allowedOrigins = [
  "https://deepframemedia.com",
  "https://www.deepframemedia.com",
  // Ejemplos (descomenta/ajusta si tu dev usa preview):
  // "https://your-site.preview.duda.co",
  // "https://your-site.editorx.io",
];

app.use(helmet());
app.use(express.json());

// CORS correcto para apps web (con whitelist)
app.use(
  cors({
    origin: (origin, cb) => {
      // Permite requests sin Origin (curl, server-to-server)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight
app.options("*", cors());

// Servir archivos estáticos si tienes /public (ej: widget.js)
app.use(express.static("public"));

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ia-chat-backend" });
});

// API
app.use("/v1", chatRouter);

// Railway inyecta PORT
const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
