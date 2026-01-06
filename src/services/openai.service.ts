import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined");
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function askOpenAI(params: {
  system: string;
  user: string;
}): Promise<string> {
  const { system, user } = params;

  const response = await getClient().chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}
