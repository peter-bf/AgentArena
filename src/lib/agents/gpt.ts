import OpenAI from 'openai';
import { AgentResponse, GPTModel } from '@/types';

// Cached client for env-based API key
let envClient: OpenAI | null = null;

function getClient(apiKey?: string): OpenAI {
  // If a custom API key is provided, create a new client for it
  if (apiKey) {
    return new OpenAI({ apiKey });
  }

  // Use cached client for env-based key
  if (!envClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set. Please add it to your environment variables or enter it in LLM Settings.');
    }
    envClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return envClient;
}

export async function callGPT(
  prompt: string,
  modelVariant: GPTModel = 'gpt-4o-mini',
  retryPrompt?: string,
  apiKey?: string
): Promise<{ response: AgentResponse | null; rawResponse: string; error?: string; isApiError?: boolean; inputTokens?: number; outputTokens?: number }> {
  try {
    const openai = getClient(apiKey);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are an expert game-playing AI that plays to WIN. Always take winning moves when available. Always block opponent winning moves. Think strategically. Respond only with valid JSON as instructed - no markdown, no extra text.' },
      { role: 'user', content: prompt },
    ];

    if (retryPrompt) {
      messages.push({ role: 'assistant', content: 'I apologize for the error.' });
      messages.push({ role: 'user', content: retryPrompt });
    }

    const completion = await openai.chat.completions.create({
      model: modelVariant,
      messages,
      temperature: 0.3,
      max_tokens: 200,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const inputTokens = completion.usage?.prompt_tokens;
    const outputTokens = completion.usage?.completion_tokens;

    // Try to parse JSON from response
    const parsed = parseAgentResponse(rawResponse);

    if (parsed.error) {
      return { response: null, rawResponse, error: parsed.error, inputTokens, outputTokens };
    }

    return { response: parsed.response, rawResponse, inputTokens, outputTokens };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return { response: null, rawResponse: '', error: `API Error: ${error}`, isApiError: true };
  }
}

function parseAgentResponse(raw: string): { response: AgentResponse | null; error?: string } {
  try {
    // Try to extract JSON from the response
    let jsonStr = raw.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (typeof parsed.move !== 'number') {
      return { response: null, error: 'Missing or invalid "move" field (must be a number)' };
    }

    return {
      response: {
        move: parsed.move,
        reason: parsed.reason || undefined,
        plan: Array.isArray(parsed.plan) ? parsed.plan : undefined,
      }
    };
  } catch (e) {
    return { response: null, error: 'Invalid JSON format' };
  }
}
