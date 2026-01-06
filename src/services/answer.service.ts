import { detectLang, extractLinks, findRelevantBlocks } from "./rag.service";
import { askOpenAI } from "./openai.service";

function normalizeWhitespace(s: string): string {
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

function fallbackText(lang: "es" | "en", links: { book?: string; contact?: string }) {
  const book = links.book ?? "https://deepframemedia.com/book-demo";
  const contact = links.contact ?? "https://deepframemedia.com/contact";

  if (lang === "es") {
    return normalizeWhitespace(
      `Si quieres, podemos ayudarte mejor por una vía directa:

1) Agendar una llamada: ${book}
2) Contactarnos por el formulario: ${contact}

Nuestro equipo revisará tu solicitud y te responderá en menos de **48 horas hábiles**.`
    );
  }

  return normalizeWhitespace(
    `If you’d like, we can help you faster through a direct channel:

1) Book a consultation: ${book}
2) Contact us via the form: ${contact}

Our team will review your request and get back to you within **48 business hours**.`
  );
}

/**
 * Genera respuesta final usando:
 * - detección de idioma
 * - mini-RAG (bloques relevantes)
 * - OpenAI para redactar (y traducir si hace falta)
 *
 * Stateless: NO guarda historial.
 */
export async function generateAnswer(params: {
  tenantId: string;
  kb: string;
  message: string;
}): Promise<{ answer: string; lang: "es" | "en" }> {
  const { kb, message } = params;

  const lang = detectLang(message);
  const links = extractLinks(kb);

  // Encuentra contexto relevante (mini-RAG)
  const blocks = findRelevantBlocks(kb, message, 2);
  const relevantContext = blocks.map(b => `## ${b.title}\n${b.text}`).join("\n\n").trim();

  const fallback = fallbackText(lang, links);

  // System rules (esto manda)
  const system =
    `You are a helpful sales/qualification assistant for DeepFrame Media.\n` +
    `CRITICAL RULES:\n` +
    `- Reply in the SAME language as the user.\n` +
    `- Do NOT claim you remember past conversations. This chat is stateless.\n` +
    `- Use ONLY the provided CONTEXT for company facts (services, policies, process). If something is not in context, say you don't have that info.\n` +
    `- For PRICING: never give a fixed price unless context contains exact prices. Ask 2-3 short questions to understand needs.\n` +
    `- Keep responses concise and conversion-focused.\n` +
    `- Always end with a clear next step. If context is insufficient, use the provided FALLBACK links.\n`;

  const user =
    `USER_MESSAGE:\n${message}\n\n` +
    `CONTEXT (may be empty):\n${relevantContext || "[NO RELEVANT CONTEXT FOUND]"}\n\n` +
    `FALLBACK (must use if context is insufficient):\n${fallback}\n`;

  // Si no hay contexto relevante, no desperdicies tokens: usa fallback + 1 pregunta
  if (!relevantContext) {
    const quick =
      lang === "es"
        ? normalizeWhitespace(
            `Puedo ayudarte, pero necesito un poco más de información: ¿qué tipo de negocio tienes y qué estás buscando (website, e-commerce, automatización/IA)?\n\n${fallback}`
          )
        : normalizeWhitespace(
            `I can help, but I need a bit more information: what type of business is it and what are you looking for (website, e-commerce, automation/AI)?\n\n${fallback}`
          );

    return { lang, answer: quick };
  }

  const draft = await askOpenAI({ system, user });

  // Si OpenAI devolvió vacío por cualquier razón, fallback seguro
  const answer = draft ? draft : fallback;

  return { lang, answer };
}
