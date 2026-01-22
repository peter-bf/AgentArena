import { GameType, Player, C4Cell, TTTCell, BSCell, GameState } from '@/types';
import { getTTTBoardForPrompt } from '../games/tictactoe';
import { getC4BoardForPrompt } from '../games/connect4';
import { getBSBoardForPrompt } from '../games/battleship';

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
  let moveType: string;

  if (gameType === 'ttt') {
    moveExample = '4';
    moveType = 'an integer';
    decisionProtocol = `=== DECISION PROTOCOL (FOLLOW IN ORDER) ===
1) Immediate win: If any legal move wins now, play it.
2) Immediate block: If the opponent has any immediate winning move next turn, block it.
3) Tactical safety: For each legal move, check the opponent's best reply and avoid moves that allow an immediate loss.
4) Advantage: Prefer moves that create multiple threats, increase future winning lines, and control key positions.
5) Tie-breaker: If multiple moves are similar, choose the safest move that limits opponent threats.`;
  } else if (gameType === 'c4') {
    moveExample = '3';
    moveType = 'an integer';
    decisionProtocol = `=== DECISION PROTOCOL (FOLLOW IN ORDER) ===
1) Immediate win: If any legal move wins now, play it.
2) Immediate block: If the opponent has any immediate winning move next turn, block it.
3) Tactical safety: For each legal move, check the opponent's best reply and avoid moves that allow an immediate loss.
4) Advantage: Prefer moves that create multiple threats, increase future winning lines, and control key positions.
5) Tie-breaker: If multiple moves are similar, choose the safest move that limits opponent threats.`;
  } else {
    // Battleship
    moveExample = '42';
    moveType = 'an integer';
    decisionProtocol = `=== DECISION PROTOCOL (FOLLOW IN ORDER) ===
1) PRIORITY TARGET: If you have any HITS (✕) on the board, you MUST focus on that ship.
   - Find all your current hits
   - Try orthogonal neighbors (up/down/left/right only, NO diagonals)
   - If a ship is partially sunk, continue in the same direction
   - NEVER abandon a hit to hunt elsewhere until the ship is COMPLETELY SUNK

2) SHIP ORIENTATION: Once you hit a ship:
   - Try one orthogonal direction (e.g., up/down)
   - If that hits again, continue that direction
   - If that misses, try perpendicular (left/right)
   - This finds the ship's orientation and sinks it efficiently

3) HUNT MODE (only if NO hits exist):
   - Use checkerboard/parity pattern to find ships systematically
   - Example: Attack cells like (0,0), (0,2), (0,4), (1,1), (1,3), etc.
   - This covers the board efficiently without wasting shots

4) AVOID REPEATS: NEVER fire at a cell you've already targeted.

5) PERSISTENCE: Keep attacking until all opponent ships are sunk.
   NEVER give up or declare stalemate.`;
  }

  return `${decisionProtocol}

Think through the steps privately. Do NOT output your analysis.

=== RESPONSE FORMAT ===
Return ONLY a single JSON object:
{"move": ${moveExample}, "reason": "short reason"}

RULES:
- "move" must be ${moveType}
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
