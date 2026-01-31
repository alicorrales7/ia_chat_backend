import dotenv from "dotenv";
dotenv.config(); // primero siempre

import express from "express";
import cors from "cors";
import helmet from "helmet";

import { chatRouter } from "./routes/chat.route";

const app = express();

/**
 * CORS whitelist:
 * Agrega aquí los dominios finales y los previews/staging si los usan.
 */
const allowedOrigins = [
  "https://deepframemedia.com",
  "https://www.deepframemedia.com",
  // si usan preview en Duda, agrega aquí el dominio exacto:
  // "https://xxxxx.preview.duda.co",
];

app.use(helmet());
app.use(express.json());

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

/**
 * PRE-FLIGHT FIX:
 * En algunos setups, app.options("*") crashea por path-to-regexp.
 * Usamos regex para permitir todos los OPTIONS sin romper el server.
 */
app.options(/.*/, cors());

// Servir estáticos si tienes /public (ej: widget.js si lo haces después)
app.use(express.static("public"));

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ia-chat-backend" });
});

// API
app.use("/v1", chatRouter);

// Railway PORT
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
