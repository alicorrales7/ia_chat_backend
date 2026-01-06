import { Router } from "express";
import { z } from "zod";
import { loadTenantKb } from "../services/kb.service";
import { generateAnswer } from "../services/answer.service";

export const chatRouter = Router();

const ChatBodySchema = z.object({
  tenantId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

chatRouter.post("/chat", async (req, res) => {
  const parsed = ChatBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid body",
      details: parsed.error.flatten(),
    });
  }

  const { tenantId, message } = parsed.data;

  const kb = await loadTenantKb(tenantId);

  if (!kb) {
    return res.status(404).json({
      error: "KB_NOT_FOUND",
      message: `No knowledge base found for tenantId="${tenantId}".`,
    });
  }

  const { answer } = await generateAnswer({ tenantId, kb, message });
  return res.json({ answer });
});
