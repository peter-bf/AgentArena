import { ModelType, AgentResponse, GameType, Player, TTTCell, C4Cell, GPTModel, DeepSeekModel, GeminiModel } from '@/types';
import { callGPT } from './gpt';
import { callDeepSeek } from './deepseek';
import { callGemini } from './gemini';
import { buildPrompt, buildRetryPrompt } from './prompts';

export interface AgentCallResult {
  response: AgentResponse | null;
  invalidJsonCount: number;
  illegalMoveCount: number;
  retryCount: number;
  forfeit: boolean;
  forfeitReason?: string;
  inputTokens?: number;
  outputTokens?: number;
}

const MAX_RETRIES = 5; // Max total retries per turn

export async function callAgent(
  model: ModelType,
  modelVariant: GPTModel | DeepSeekModel | GeminiModel,
  gameType: GameType,
  board: (TTTCell | C4Cell)[],
  player: Player,
  legalMoves: number[]
): Promise<AgentCallResult> {
  const result: AgentCallResult = {
    response: null,
    invalidJsonCount: 0,
    illegalMoveCount: 0,
    retryCount: 0,
    forfeit: false,
  };

  const prompt = buildPrompt(gameType, board, player);

  let lastError = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const retryPrompt = attempt > 0 ? buildRetryPrompt(lastError) : undefined;

    if (attempt > 0) {
      result.retryCount++;
    }

    const agentResponse = model === 'gpt'
      ? await callGPT(prompt, modelVariant as GPTModel, retryPrompt)
      : model === 'deepseek'
      ? await callDeepSeek(prompt, modelVariant as DeepSeekModel, retryPrompt)
      : await callGemini(prompt, modelVariant as GeminiModel, retryPrompt);

    const { response, error, inputTokens, outputTokens } = agentResponse;

    // Track tokens (accumulate across retries)
    if (inputTokens !== undefined) {
      result.inputTokens = (result.inputTokens || 0) + inputTokens;
    }
    if (outputTokens !== undefined) {
      result.outputTokens = (result.outputTokens || 0) + outputTokens;
    }

    if (error || !response) {
      // Invalid JSON or API error
      result.invalidJsonCount++;
      lastError = error || 'Failed to parse response';
      continue;
    }

    // Check if move is legal
    if (!legalMoves.includes(response.move)) {
      result.illegalMoveCount++;
      lastError = `Illegal move: ${response.move}. Legal moves are: [${legalMoves.join(', ')}]`;
      continue;
    }

    // Success!
    result.response = response;
    return result;
  }

  // All retries exhausted
  result.forfeit = true;
  result.forfeitReason = `Agent failed after ${MAX_RETRIES + 1} attempts. Last error: ${lastError}`;
  return result;
}
