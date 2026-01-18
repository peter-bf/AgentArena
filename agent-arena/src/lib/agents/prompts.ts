import { GameType, Player, C4Cell, TTTCell, BSCell, GameState } from '@/types';
import { getTTTBoardForPrompt } from '../games/tictactoe';
import { getC4BoardForPrompt } from '../games/connect4';
import { getBSBoardForPrompt, getBSLegalMoves } from '../games/battleship';

export function buildPrompt(
  gameType: GameType,
  board: (TTTCell | C4Cell | BSCell)[],
  player: Player,
  state?: GameState,
  legalMoves?: number[]
): string {
  let gamePrompt: string;
  
  if (gameType === 'ttt') {
    gamePrompt = getTTTBoardForPrompt(board as TTTCell[], player);
  } else if (gameType === 'c4') {
    gamePrompt = getC4BoardForPrompt(board as C4Cell[], player);
  } else if (gameType === 'bs') {
    // For battleship, we need state and legalMoves
    if (!state || !legalMoves) {
      throw new Error('Battleship requires state and legalMoves');
    }
    gamePrompt = getBSBoardForPrompt(state, player, legalMoves);
  } else {
    throw new Error(`Unknown game type: ${gameType}`);
  }

  const formatInstructions = getFormatInstructions(gameType);

  return `${gamePrompt}

${formatInstructions}`;
}

function getFormatInstructions(gameType: GameType): string {
  let moveExample: string;
  let decisionProtocol: string;
  
  if (gameType === 'ttt') {
    moveExample = '4';
    decisionProtocol = `=== DECISION PROTOCOL (FOLLOW IN ORDER) ===
1) Immediate win: If any legal move wins now, play it.
2) Immediate block: If the opponent has any immediate winning move next turn, block it.
3) Tactical safety: For each legal move, check the opponent's best reply and avoid moves that allow an immediate loss.
4) Advantage: Prefer moves that create multiple threats, increase future winning lines, and control key positions.
5) Tie-breaker: If multiple moves are similar, choose the safest move that limits opponent threats.`;
  } else if (gameType === 'c4') {
    moveExample = '3';
    decisionProtocol = `=== DECISION PROTOCOL (FOLLOW IN ORDER) ===
1) Immediate win: If any legal move wins now, play it.
2) Immediate block: If the opponent has any immediate winning move next turn, block it.
3) Tactical safety: For each legal move, check the opponent's best reply and avoid moves that allow an immediate loss.
4) Advantage: Prefer moves that create multiple threats, increase future winning lines, and control key positions.
5) Tie-breaker: If multiple moves are similar, choose the safest move that limits opponent threats.`;
  } else {
    // Battleship
    moveExample = '42';
    decisionProtocol = `=== DECISION PROTOCOL (FOLLOW IN ORDER) ===
1) Finish ships: If you have hits, target adjacent cells to sink the ship.
2) Hunt mode: Use systematic scanning patterns to find ships efficiently.
3) Target mode: Once a ship is hit, focus on sinking it before hunting new ones.
4) Avoid repeats: Never fire at cells you've already shot.
5) Strategy: Balance between finishing damaged ships and exploring new areas.`;
  }

  return `${decisionProtocol}

Think through the steps privately. Do NOT output your analysis.

=== RESPONSE FORMAT ===
Return ONLY a single JSON object:
{"move": ${moveExample}, "reason": "short reason"}

RULES:
- "move" must be an integer from the legal moves list
- "reason" must be 1 short sentence
- No markdown, no code blocks, no extra text`;
}

export function buildRetryPrompt(error: string): string {
  return `ERROR: ${error}

CRITICAL: You MUST respond with ONLY a valid JSON object.
- No markdown code blocks
- No explanatory text before or after
- Just the raw JSON: {"move": NUMBER, "reason": "short text"}

Try again with a VALID move from the legal moves list:`;
}
