import OpenAI from 'openai';

export function getOpenRouterClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://sundaydinnermemories.com',
      'X-Title': 'Sunday Dinner Memories',
    },
  });
}

// Model assignments - easy to swap later
export const MODELS = {
  // Vision model for recipe card scanning (needs multimodal)
  VISION: 'google/gemini-2.0-flash-001',
  // Text model for extraction, search, categorization
  TEXT: 'google/gemini-2.0-flash-001',
  // Chat model for conversational search
  CHAT: 'google/gemini-2.0-flash-001',
};
