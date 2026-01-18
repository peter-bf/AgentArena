import { AgentMode, GameType, Player, C4Cell, TTTCell } from '@/types';
import { getTTTBoardForPrompt } from '../games/tictactoe';
import { getC4BoardForPrompt } from '../games/connect4';

export function buildPrompt(
  gameType: GameType,
  board: (TTTCell | C4Cell)[],
  player: Player,
  mode: AgentMode
): string {
  const gamePrompt = gameType === 'ttt'
    ? getTTTBoardForPrompt(board as TTTCell[], player)
    : getC4BoardForPrompt(board as C4Cell[], player);

  const formatInstructions = getFormatInstructions(gameType, mode);

  return `${gamePrompt}

${formatInstructions}`;
}

function getFormatInstructions(gameType: GameType, mode: AgentMode): string {
  const moveExample = gameType === 'ttt' ? '5' : '3';

  if (mode === 'react') {
    return `Response Format (ReAct Agent):
You must respond with ONLY valid JSON, no other text.

{
  "move": ${moveExample},
  "reason": "Brief explanation of your move (1 sentence)"
}

- "move" must be a number (the index/column of your move)
- "reason" is a short explanation
- Do not include any text outside the JSON object`;
  } else {
    return `Response Format (Planner Agent):
You must respond with ONLY valid JSON, no other text.

{
  "move": ${moveExample},
  "reason": "Brief explanation of your move (1 sentence)",
  "plan": ["Step 1 of your strategy", "Step 2", "Step 3"]
}

- "move" must be a number (the index/column of your move)
- "reason" is a short explanation
- "plan" is an array of 2-4 brief strategic points
- Do not include any text outside the JSON object`;
  }
}

export function buildRetryPrompt(error: string): string {
  return `FORMAT ERROR: ${error}

You MUST respond with ONLY valid JSON. No explanation, no markdown, just the JSON object.
Try again:`;
}
