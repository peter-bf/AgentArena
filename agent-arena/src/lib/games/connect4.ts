import { GameState, Player, Move, C4Cell, Winner } from '@/types';

// Connect-4 board is 6 rows x 7 columns = 42 cells
// Stored in row-major order (row 0 is top, row 5 is bottom)
// Index = row * 7 + col

const ROWS = 6;
const COLS = 7;

export function initC4State(): GameState {
  return {
    gameType: 'c4',
    board: Array(42).fill(null) as C4Cell[],
    currentPlayer: 'A',
    moveHistory: [],
    winner: null,
    winLine: null,
    isTerminal: false,
  };
}

function getIndex(row: number, col: number): number {
  return row * COLS + col;
}

function getLowestEmptyRow(board: C4Cell[], col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[getIndex(row, col)] === null) {
      return row;
    }
  }
  return -1; // Column is full
}

export function getC4LegalMoves(board: C4Cell[]): Move[] {
  const moves: Move[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[getIndex(0, col)] === null) {
      moves.push(col);
    }
  }
  return moves;
}

export function applyC4Move(
  state: GameState,
  move: Move,
  player: Player
): { newState: GameState; valid: boolean; error?: string; dropRow?: number } {
  const board = state.board as C4Cell[];

  // Validate move
  if (move < 0 || move > 6 || !Number.isInteger(move)) {
    return { newState: state, valid: false, error: 'Column out of bounds (must be 0-6)' };
  }

  const row = getLowestEmptyRow(board, move);
  if (row === -1) {
    return { newState: state, valid: false, error: 'Column is full' };
  }

  // Apply move
  const newBoard = [...board] as C4Cell[];
  const index = getIndex(row, move);
  newBoard[index] = player === 'A' ? 'R' : 'Y';

  // Check for winner
  const { winner, winLine } = checkC4Winner(newBoard);

  // Check for draw
  const isDraw = winner === null && getC4LegalMoves(newBoard).length === 0;

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: player === 'A' ? 'B' : 'A',
    winner: winner ? (winner === 'R' ? 'A' : 'B') : (isDraw ? 'draw' : null),
    winLine,
    isTerminal: winner !== null || isDraw,
  };

  return { newState, valid: true, dropRow: row };
}

export function checkC4Winner(board: C4Cell[]): { winner: 'R' | 'Y' | null; winLine: number[] | null } {
  // Check horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const idx = getIndex(row, col);
      const line = [idx, idx + 1, idx + 2, idx + 3];
      const cells = line.map(i => board[i]);
      if (cells[0] && cells.every(c => c === cells[0])) {
        return { winner: cells[0], winLine: line };
      }
    }
  }

  // Check vertical
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col < COLS; col++) {
      const line = [
        getIndex(row, col),
        getIndex(row + 1, col),
        getIndex(row + 2, col),
        getIndex(row + 3, col),
      ];
      const cells = line.map(i => board[i]);
      if (cells[0] && cells.every(c => c === cells[0])) {
        return { winner: cells[0], winLine: line };
      }
    }
  }

  // Check diagonal (down-right)
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const line = [
        getIndex(row, col),
        getIndex(row + 1, col + 1),
        getIndex(row + 2, col + 2),
        getIndex(row + 3, col + 3),
      ];
      const cells = line.map(i => board[i]);
      if (cells[0] && cells.every(c => c === cells[0])) {
        return { winner: cells[0], winLine: line };
      }
    }
  }

  // Check diagonal (down-left)
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 3; col < COLS; col++) {
      const line = [
        getIndex(row, col),
        getIndex(row + 1, col - 1),
        getIndex(row + 2, col - 2),
        getIndex(row + 3, col - 3),
      ];
      const cells = line.map(i => board[i]);
      if (cells[0] && cells.every(c => c === cells[0])) {
        return { winner: cells[0], winLine: line };
      }
    }
  }

  return { winner: null, winLine: null };
}

export function formatC4Board(board: C4Cell[]): string {
  const rows: string[] = [];
  for (let row = 0; row < ROWS; row++) {
    const rowCells: string[] = [];
    for (let col = 0; col < COLS; col++) {
      const cell = board[getIndex(row, col)];
      rowCells.push(cell || '_');
    }
    rows.push(`[${rowCells.join(', ')}]`);
  }
  return rows.join('\n');
}

export function getC4BoardForPrompt(board: C4Cell[], player: Player): string {
  const color = player === 'A' ? 'Red (R)' : 'Yellow (Y)';
  const legalMoves = getC4LegalMoves(board);

  return `You are playing Connect-4 as ${color}.

Board has 6 rows (0=top, 5=bottom) and 7 columns (0-6).
Pieces drop to the lowest available row in the chosen column.

Current board (top to bottom):
${formatC4Board(board)}

Column indices: 0 1 2 3 4 5 6

Legal moves (columns with space): [${legalMoves.join(', ')}]

Rules:
- You must return ONLY a valid JSON response.
- The move must be one of the legal column numbers listed above.
- Get 4 in a row (horizontal, vertical, or diagonal) to win.
- Play optimally to win.`;
}
