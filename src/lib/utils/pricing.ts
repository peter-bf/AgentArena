import { GPTModel, DeepSeekModel, GeminiModel } from '@/types';

// Pricing per 1M tokens (as of 2024)
// OpenAI: https://openai.com/api/pricing/
// DeepSeek: https://www.deepseek.com/pricing
// Gemini: https://ai.google.dev/pricing

const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI GPT models (per 1M tokens)
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  
  // DeepSeek models (per 1M tokens)
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
  
  // Gemini models (per 1M tokens)
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash-lite': { input: 0.0375, output: 0.15 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
};

export function calculateCost(
  modelVariant: GPTModel | DeepSeekModel | GeminiModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[modelVariant];
  if (!pricing) return 0;
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

