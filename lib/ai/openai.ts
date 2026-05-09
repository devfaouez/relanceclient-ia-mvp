import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return client;
}

// Tarifs GPT-5.5 API : $5 input / $30 output par million tokens.
// Stockage approximatif en EUR/USD équivalent pour suivi interne.
const PRICE_INPUT_PER_MTOK = 5.0;
const PRICE_OUTPUT_PER_MTOK = 30.0;

export function computeCostEur(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICE_INPUT_PER_MTOK +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK
  );
}
