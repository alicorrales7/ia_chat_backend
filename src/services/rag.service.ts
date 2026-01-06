type Block = { title: string; text: string };

const SPANISH_HINTS = [
  "hola", "precio", "cuánto", "cuanto", "servicio", "necesito", "quiero",
  "tienen", "hacen", "agenda", "cita", "contacto", "negocio", "tienda",
  "página", "pagina", "sitio", "web", "gracias"
];

export function detectLang(message: string): "es" | "en" {
  const m = message.toLowerCase();
  // Heurística simple: tildes o palabras comunes
  if (/[áéíóúñ¿¡]/.test(m)) return "es";
  const hits = SPANISH_HINTS.reduce((acc, w) => acc + (m.includes(w) ? 1 : 0), 0);
  return hits >= 2 ? "es" : "en";
}

export function parseMarkdownBlocks(md: string): Block[] {
  // Partimos por headings tipo "## ..."
  const lines = md.split("\n");
  const blocks: Block[] = [];

  let currentTitle = "General";
  let current: string[] = [];

  const push = () => {
    const text = current.join("\n").trim();
    if (text) blocks.push({ title: currentTitle, text });
    current = [];
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)\s*$/);
    if (h2) {
      push();
      currentTitle = h2[1].trim();
      continue;
    }
    // ignorar H1
    if (/^#\s+/.test(line)) continue;
    current.push(line);
  }

  push();
  return blocks;
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length >= 3);
}

function scoreBlock(blockText: string, tokens: string[]): number {
  const text = blockText.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (text.includes(t)) score += 2;
  }
  // Bonus si hay números o $ y el usuario pregunta de precio
  if (tokens.some(t => ["price","pricing","cost","cuanto","cuánto","precio","costo"].includes(t))) {
    if (/\$|\d/.test(text)) score += 2;
  }
  return score;
}

export function findRelevantBlocks(md: string, query: string, maxBlocks = 2): Block[] {
  const blocks = parseMarkdownBlocks(md);
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored = blocks
    .map((b) => ({ b, s: scoreBlock(b.text, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  return scored.slice(0, maxBlocks).map((x) => x.b);
}

export function extractLinks(md: string): { book?: string; contact?: string } {
  // Busca URLs en el md
  const urls = md.match(/https?:\/\/[^\s]+/g) ?? [];
  const book = urls.find(u => u.toLowerCase().includes("book")) || urls.find(u => u.toLowerCase().includes("schedule"));
  const contact = urls.find(u => u.toLowerCase().includes("contact"));
  return { book, contact };
}
