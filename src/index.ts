import dotenv from "dotenv";
dotenv.config(); // 👈 TIENE que ser lo primero

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { chatRouter } from "./routes/chat.route";

const app = express();

// middlewares
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: true }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/v1", chatRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
