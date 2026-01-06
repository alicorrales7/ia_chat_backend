import fs from "fs/promises";
import path from "path";

/**
 * Carga la base de conocimiento del tenant
 * kb/<tenantId>.md
 */
export async function loadTenantKb(tenantId: string): Promise<string> {
  const kbPath = path.join(process.cwd(), "kb", `${tenantId}.md`);

  try {
    const content = await fs.readFile(kbPath, "utf-8");
    return content;
  } catch (error) {
    return "";
  }
}
