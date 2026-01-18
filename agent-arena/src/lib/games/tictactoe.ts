import { GameState, Player, Move, TTTCell, Winner } from '@/types';

// TTT board is a flat array of 9 cells (indices 0-8)
// Index mapping:
// 0 1 2
// 3 4 5
// 6 7 8

const WIN_LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // columns
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
];

export function initTTTState(): GameState {
  return {
    gameType: 'ttt',
    board: Array(9).fill(null) as TTTCell[],
    currentPlayer: 'A',
    moveHistory: [],
    winner: null,
    winLine: null,
    isTerminal: false,
  };
}

export function getTTTLegalMoves(board: TTTCell[]): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

export function applyTTTMove(
  state: GameState,
  move: Move,
  player: Player
): { newState: GameState; valid: boolean; error?: string } {
  const board = state.board as TTTCell[];

  // Validate move
  if (move < 0 || move > 8 || !Number.isInteger(move)) {
    return { newState: state, valid: false, error: 'Move out of bounds (must be 0-8)' };
  }

  if (board[move] !== null) {
    return { newState: state, valid: false, error: 'Cell already occupied' };
  }

  // Apply move
  const newBoard = [...board] as TTTCell[];
  newBoard[move] = player === 'A' ? 'X' : 'O';

  // Check for winner
  const { winner, winLine } = checkTTTWinner(newBoard);

  // Check for draw
  const isDraw = winner === null && newBoard.every(cell => cell !== null);

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: player === 'A' ? 'B' : 'A',
    winner: winner ? (winner === 'X' ? 'A' : 'B') : (isDraw ? 'draw' : null),
    winLine,
    isTerminal: winner !== null || isDraw,
  };

  return { newState, valid: true };
}

export function checkTTTWinner(board: TTTCell[]): { winner: 'X' | 'O' | null; winLine: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winLine: line };
    }
  }
  return { winner: null, winLine: null };
}

export function formatTTTBoard(board: TTTCell[]): string {
  const display = board.map(cell => cell || '_');
  return `[${display.slice(0, 3).join(', ')},
 ${display.slice(3, 6).join(', ')},
 ${display.slice(6, 9).join(', ')}]`;
}

export function getTTTBoardForPrompt(board: TTTCell[], player: Player): string {
  const mark = player === 'A' ? 'X' : 'O';
  const legalMoves = getTTTLegalMoves(board);

  return `You are playing Tic-Tac-Toe as ${mark}.

Board is a 3x3 grid in row-major order:

Index mapping:
0 1 2
3 4 5
6 7 8

Current board:
${formatTTTBoard(board)}

Legal moves: [${legalMoves.join(', ')}]

Rules:
- You must return ONLY a valid JSON response.
- The move must be one of the legal moves listed above.
- Play optimally to win.`;
}
