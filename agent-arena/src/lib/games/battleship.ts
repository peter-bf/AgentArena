import { GameState, Player, Move, BSCell, ShipPlacement, BSMoveOutcome } from '@/types';

// Battleship board is 10x10 = 100 cells
// Index = row * 10 + col
// Row 0-9 corresponds to A-J
// Col 0-9 corresponds to 1-10

const BOARD_SIZE = 10;
const TOTAL_CELLS = 100;

// Fleet configuration
const FLEET = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];

const TOTAL_SHIP_CELLS = FLEET.reduce((sum, ship) => sum + ship.size, 0); // 17

// Simple seeded PRNG (mulberry32)
class SeededRNG {
  private state: number;

  constructor(seed: string | number) {
    const hash = typeof seed === 'string' 
      ? seed.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
      : seed;
    this.state = hash >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

function getIndex(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

function getRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getShipCells(
  startRow: number,
  startCol: number,
  size: number,
  horizontal: boolean
): number[] {
  const cells: number[] = [];
  for (let i = 0; i < size; i++) {
    const row = horizontal ? startRow : startRow + i;
    const col = horizontal ? startCol + i : startCol;
    if (!isValidPosition(row, col)) {
      return []; // Invalid placement
    }
    cells.push(getIndex(row, col));
  }
  return cells;
}

function canPlaceShip(
  cells: number[],
  occupied: Set<number>
): boolean {
  if (cells.length === 0) return false;
  return cells.every(cell => !occupied.has(cell));
}

function generatePlacements(seed: string | number): ShipPlacement[] {
  const rng = new SeededRNG(seed);
  const placements: ShipPlacement[] = [];
  const occupied = new Set<number>();
  const maxAttempts = 1000;

  for (const ship of FLEET) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const horizontal = rng.nextInt(2) === 0;
      const startRow = rng.nextInt(BOARD_SIZE);
      const startCol = rng.nextInt(BOARD_SIZE);

      const cells = getShipCells(startRow, startCol, ship.size, horizontal);
      if (canPlaceShip(cells, occupied)) {
        placements.push({ name: ship.name, size: ship.size, cells });
        cells.forEach(cell => occupied.add(cell));
        placed = true;
      }
    }

    if (!placed) {
      throw new Error(`Failed to place ${ship.name} after ${maxAttempts} attempts`);
    }
  }

  // Verify total cells
  const totalCells = placements.reduce((sum, p) => sum + p.cells.length, 0);
  if (totalCells !== TOTAL_SHIP_CELLS) {
    throw new Error(`Invalid placement: expected ${TOTAL_SHIP_CELLS} cells, got ${totalCells}`);
  }

  return placements;
}

export function initBSState(seed: string | number = Date.now()): GameState {
  const placementsA = generatePlacements(`${seed}-A`);
  const placementsB = generatePlacements(`${seed}-B`);

  // Initialize ship health
  const shipHealthA: Record<string, number> = {};
  const shipHealthB: Record<string, number> = {};
  FLEET.forEach(ship => {
    shipHealthA[ship.name] = ship.size;
    shipHealthB[ship.name] = ship.size;
  });

  return {
    gameType: 'bs',
    board: Array(TOTAL_CELLS).fill('unknown') as BSCell[],
    currentPlayer: 'A',
    moveHistory: [],
    winner: null,
    winLine: null,
    isTerminal: false,
    placementsA,
    placementsB,
    firedA: new Set<number>(),
    firedB: new Set<number>(),
    shipHealthA,
    shipHealthB,
  };
}

export function getBSLegalMoves(state: GameState, player: Player): Move[] {
  const fired = player === 'A' ? state.firedA! : state.firedB!;
  const moves: Move[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (!fired.has(i)) {
      moves.push(i);
    }
  }
  return moves;
}

function findShipAtCell(placements: ShipPlacement[], cell: number): ShipPlacement | null {
  for (const ship of placements) {
    if (ship.cells.includes(cell)) {
      return ship;
    }
  }
  return null;
}

function markShipAsSunk(
  board: BSCell[],
  ship: ShipPlacement
): void {
  ship.cells.forEach(cell => {
    board[cell] = 'sunk';
  });
}

export function applyBSMove(
  state: GameState,
  move: Move,
  player: Player
): { newState: GameState; valid: boolean; error?: string; outcome?: BSMoveOutcome } {
  // Validate move
  if (move < 0 || move >= TOTAL_CELLS || !Number.isInteger(move)) {
    return { newState: state, valid: false, error: `Move out of bounds (must be 0-${TOTAL_CELLS - 1})` };
  }

  const fired = player === 'A' ? state.firedA! : state.firedB!;
  if (fired.has(move)) {
    return { newState: state, valid: false, error: 'Cell already fired at' };
  }

  // Get opponent's placements and health
  const opponentPlacements = player === 'A' ? state.placementsB! : state.placementsA!;
  const opponentHealth = player === 'A' ? state.shipHealthB! : state.shipHealthA!;

  // Check if hit
  const hitShip = findShipAtCell(opponentPlacements, move);
  const isHit = hitShip !== null;

  // Create new state
  const newBoard = [...state.board] as BSCell[];
  const newFiredA = new Set(state.firedA!);
  const newFiredB = new Set(state.firedB!);
  const newShipHealthA = { ...state.shipHealthA! };
  const newShipHealthB = { ...state.shipHealthB! };

  let outcome: BSMoveOutcome;
  let sunkShipName: string | undefined;

  if (isHit && hitShip) {
    // Hit
    newBoard[move] = 'hit';
    opponentHealth[hitShip.name]--;
    
    if (opponentHealth[hitShip.name] === 0) {
      // Ship sunk
      markShipAsSunk(newBoard, hitShip);
      sunkShipName = hitShip.name;
      outcome = { outcome: 'sunk', sunkShipName };
    } else {
      outcome = { outcome: 'hit' };
    }
  } else {
    // Miss
    newBoard[move] = 'miss';
    outcome = { outcome: 'miss' };
  }

  // Update fired set
  if (player === 'A') {
    newFiredA.add(move);
  } else {
    newFiredB.add(move);
  }

  // Check win condition
  const totalOpponentHealth = Object.values(opponentHealth).reduce((sum, health) => sum + health, 0);
  const isWin = totalOpponentHealth === 0;

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: player === 'A' ? 'B' : 'A',
    winner: isWin ? player : null,
    isTerminal: isWin,
    firedA: newFiredA,
    firedB: newFiredB,
    shipHealthA: newShipHealthA,
    shipHealthB: newShipHealthB,
  };

  return { newState, valid: true, outcome };
}

function getSunkShips(state: GameState, player: Player): string[] {
  const opponentHealth = player === 'A' ? state.shipHealthB! : state.shipHealthA!;
  return FLEET.filter(ship => opponentHealth[ship.name] === 0).map(ship => ship.name);
}

function getRemainingShips(state: GameState, player: Player): string[] {
  const opponentHealth = player === 'A' ? state.shipHealthB! : state.shipHealthA!;
  return FLEET.filter(ship => opponentHealth[ship.name] > 0).map(ship => ship.name);
}

export function getBSBoardForPrompt(
  state: GameState,
  player: Player,
  legalMoves: number[]
): string {
  const board = state.board as BSCell[];
  const sunkShips = getSunkShips(state, player);
  const remainingShips = getRemainingShips(state, player);

  // Build grid display
  const rows: string[] = [];
  rows.push('    1  2  3  4  5  6  7  8  9 10');
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowLabel = String.fromCharCode(65 + row); // A-J
    const cells: string[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      const idx = getIndex(row, col);
      const cell = board[idx];
      let symbol = '.';
      if (cell === 'miss') symbol = 'o';
      else if (cell === 'hit') symbol = 'X';
      else if (cell === 'sunk') symbol = 'S';
      cells.push(` ${symbol}`);
    }
    rows.push(`${rowLabel}  ${cells.join(' ')}`);
  }

  const gridDisplay = rows.join('\n');

  // Build move mapping info
  const moveMapping = `Move encoding: index = row * 10 + col
- Row 0-9 = A-J
- Col 0-9 = 1-10
- Example: A1 = 0, A10 = 9, B1 = 10, J10 = 99`;

  // Build status info
  let statusInfo = '';
  if (sunkShips.length > 0) {
    statusInfo += `\nShips sunk: ${sunkShips.join(', ')}`;
  }
  if (remainingShips.length > 0) {
    const sizes = remainingShips.map(name => {
      const ship = FLEET.find(s => s.name === name);
      return ship ? `${name}(${ship.size})` : name;
    });
    statusInfo += `\nRemaining opponent ships: ${sizes.join(', ')}`;
  }

  return `You are playing Battleship. You are Player ${player}.

GOAL: Sink all 5 opponent ships (17 total hits) to WIN.

Board legend:
- '.' = unknown (not fired at)
- 'o' = miss
- 'X' = hit (ship not yet confirmed sunk)
- 'S' = sunk (entire ship destroyed)

${moveMapping}

Current board (your knowledge of opponent's grid):
${gridDisplay}

Available moves: [${legalMoves.join(', ')}]${statusInfo}

STRATEGY PRIORITY:
1. FINISH SHIPS: If you have hits, target adjacent cells to sink the ship
2. HUNT MODE: Use systematic scanning (parity patterns) to find ships efficiently
3. TARGET MODE: Once a ship is hit, focus on sinking it before hunting new ones
4. AVOID REPEATS: Never fire at cells you've already shot

Think carefully and choose the BEST move to win.`;
}

