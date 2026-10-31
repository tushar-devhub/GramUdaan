import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatParams {
  message: string;
  history?: ChatMessage[];
  context?: string;
}

interface ChatResult {
  text: string | null;
  error?: string | null;
}

const SYSTEM_PROMPT = `You are GramUdaan — an AI-driven business advisory and financial structuring assistant for rural micro-entrepreneurs in India.

PERSONALITY:
- Friendly, respectful, patient, practical, encouraging, honest
- Like a knowledgeable business advisor sitting beside the entrepreneur
- Not corporate, not robotic, not overly technical

LANGUAGE:
- Respond naturally in conversational Hindi or Hinglish.
- Use familiar English business terms when clearer: Loan, EMI, Market, Competition, Profit, Investment, Risk, Supplier, Business
- Keep sentences short, clear, and simple.`;

export async function sendAdvisorChatMessage({
  message,
  history = [],
  context = "",
}: ChatParams): Promise<ChatResult> {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);

  if (!apiKey) {
    return { text: null, error: "missing_api_key" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let systemInstruction = SYSTEM_PROMPT;
    if (context && context.trim()) {
      systemInstruction += `\n\nCURRENT GRAMUDAAN CONTEXT:\n${context.trim()}`;
    }

    const recentHistory = history.slice(-8);
    const contents: any[] = [];

    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    const replyText = response.text?.trim();
    if (!replyText) {
      return { text: null, error: "empty_response" };
    }

    return { text: replyText, error: null };
  } catch (err: any) {
    console.warn("[aiAdvisorService] Gemini API call notice:", err?.message || err);
    return { text: null, error: err?.message || "gemini_error" };
  }
}
