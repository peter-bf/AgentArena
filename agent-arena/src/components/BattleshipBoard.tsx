'use client';

import { BSCell, ModelType, ShipPlacement, Player } from '@/types';
import { useEffect, useState } from 'react';
import { getPlayerStyles } from '@/lib/ui/providerStyles';

interface BattleshipBoardProps {
  board: BSCell[];
  lastMove: number | null;
  currentPlayer: 'A' | 'B' | null;
  isThinking: boolean;
  agentAModel: ModelType;
  agentBModel: ModelType;
  placementsA?: ShipPlacement[];
  placementsB?: ShipPlacement[];
  moveOwnership?: (Player | null)[];
}

const BOARD_SIZE = 10;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const TOTAL_CELLS = 100;

function getRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

const MODEL_NAMES: Record<string, string> = {
  gpt: 'OpenAI',
  deepseek: 'DeepSeek',
  gemini: 'Gemini',
};

export function BattleshipBoard({
  board,
  lastMove,
  currentPlayer,
  isThinking,
  agentAModel,
  agentBModel,
  placementsA = [],
  placementsB = [],
  moveOwnership = [],
}: BattleshipBoardProps) {
  const [animatingCell, setAnimatingCell] = useState<number | null>(null);

  useEffect(() => {
    if (lastMove !== null) {
      setAnimatingCell(lastMove);
      const timer = setTimeout(() => setAnimatingCell(null), 500);
      return () => clearTimeout(timer);
    }
  }, [lastMove]);

  const agentAStyle = getPlayerStyles(agentAModel, false);
  const agentBStyle = getPlayerStyles(agentBModel, agentAModel === agentBModel);

  // Get ship at cell for a specific player
  const getShipAtCell = (index: number, player: Player): ShipPlacement | null => {
    const placements = player === 'A' ? placementsA : placementsB;
    return placements.find(ship => ship.cells.includes(index)) || null;
  };

  // Check if a ship is fully sunk
  const isShipSunk = (ship: ShipPlacement): boolean => {
    return ship.cells.every(cellIndex => board[cellIndex] === 'sunk');
  };

  // Build separate board states for each player perspective
  // Player A's perspective: A's ships + B's shots on A
  // Player B's perspective: B's ships + A's shots on B
  const getBoardForPerspective = (perspective: Player): BSCell[] => {
    const perspectiveBoard: BSCell[] = Array(TOTAL_CELLS).fill('unknown');
    const ownPlacements = perspective === 'A' ? placementsA : placementsB;
    const opponentShotOwner = perspective === 'A' ? 'B' : 'A';

    // For each cell
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const cellOwner = moveOwnership[i];
      
      // If opponent shot here, show the result of that shot
      if (cellOwner === opponentShotOwner) {
        perspectiveBoard[i] = board[i]; // 'hit', 'miss', or 'sunk'
      } else if (cellOwner === perspective) {
        // If this player shot here (on opponent's board), don't show it on own board
        perspectiveBoard[i] = 'unknown';
      } else {
        // Check if own ship is here
        const ownShip = getShipAtCell(i, perspective);
        if (ownShip) {
          // Show ship location but as 'unknown' (hidden until shot by opponent)
          perspectiveBoard[i] = 'unknown';
        }
      }
    }

    return perspectiveBoard;
  };

  const getCellDisplay = (
    cell: BSCell,
    index: number,
    perspective: Player
  ) => {
    const ownShip = getShipAtCell(index, perspective);
    const opponentShotOwner = perspective === 'A' ? 'B' : 'A';
    const shotByOpponent = moveOwnership[index] === opponentShotOwner;
    
    // Get cell from perspective board
    const perspectiveBoard = getBoardForPerspective(perspective);
    const perspectiveCell = perspectiveBoard[index];

    let moveColorClass = '';
    if (moveOwnership[index] === 'A') {
      moveColorClass = agentAStyle.text;
    } else if (moveOwnership[index] === 'B') {
      moveColorClass = agentBStyle.text;
    }

    // If opponent shot here
    if (shotByOpponent) {
      switch (perspectiveCell) {
        case 'miss':
          return { 
            symbol: '○', 
            className: moveColorClass || 'text-blue-400',
            bgClass: 'bg-card',
          };
        case 'hit':
          return { 
            symbol: '✕', 
            className: 'text-white font-bold',
            bgClass: 'bg-red-500/70',
          };
        case 'sunk':
          return { 
            symbol: '',
            className: '',
            bgClass: 'bg-red-600/90',
          };
        default:
          return { symbol: '', className: '', bgClass: 'bg-card' };
      }
    }

    // If own ship is here (not shot by opponent) - make very light
    if (ownShip) {
      return { 
        symbol: '', 
        className: '',
        bgClass: 'bg-gray-400/15',
      };
    }

    // Empty cell
    return { 
      symbol: '', 
      className: '',
      bgClass: 'bg-secondary/40',
    };
  };

  const BoardView = ({ perspective, model, style }: { perspective: Player; model: ModelType; style: any }) => {
    // Only show highlights on opponent's board where they just shot
    const opponentPlayer = perspective === 'A' ? 'B' : 'A';
    const isOpponentJustPlayed = currentPlayer === opponentPlayer || (currentPlayer === perspective && lastMove === null);
    
    // Highlight should only show on the RECEIVING end (the board being attacked)
    const shouldShowHighlight = moveOwnership[lastMove ?? -1] === opponentPlayer && perspective !== moveOwnership[lastMove ?? -1];
    
    const perspectiveBoard = getBoardForPerspective(perspective);
    
    return (
      <div className="flex flex-col items-center gap-3">
        <div className={`text-sm font-semibold ${style.text} ${currentPlayer === perspective ? 'animate-pulse' : ''}`}>
          {MODEL_NAMES[model]}'s Board
        </div>

        {/* Column headers */}
        <div className="flex gap-1 mb-1">
          <div className="w-6" /> {/* Spacer for row labels */}
          {Array.from({ length: BOARD_SIZE }).map((_, col) => (
            <div key={col} className="w-6 text-center text-xs text-muted-foreground font-mono">
              {col + 1}
            </div>
          ))}
        </div>

        {/* Board */}
        <div className="bg-secondary/50 p-2 rounded-lg border border-border/50">
          {Array.from({ length: BOARD_SIZE }).map((_, row) => (
            <div key={row} className="flex gap-1 mb-1">
              {/* Row label */}
              <div className="w-6 text-xs text-muted-foreground font-mono flex items-center justify-center">
                {ROW_LABELS[row]}
              </div>
              {/* Cells */}
              {Array.from({ length: BOARD_SIZE }).map((_, col) => {
                const index = row * BOARD_SIZE + col;
                const { symbol, className, bgClass } = getCellDisplay(board[index], index, perspective);
                
                // Only highlight this cell if:
                // 1. It's the last move location
                // 2. We're viewing the board that was attacked (not the attacker's own board)
                // 3. The move that happened was an opponent's move (not current player's move)
                const isLastMove = shouldShowHighlight && lastMove === index && lastMove !== null;
                const isAnimating = isLastMove && animatingCell === index;

                return (
                  <div
                    key={index}
                    className={`
                      w-6 h-6 rounded flex items-center justify-center
                      text-sm font-bold transition-all duration-200
                      ${bgClass}
                      ${isLastMove ? 'ring-2 ring-yellow-400/80' : ''}
                      ${isAnimating ? 'animate-pulse' : ''}
                    `}
                  >
                    <span className={className}>{symbol}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Two boards side by side - each showing their own perspective */}
      <div className="flex gap-12 justify-center flex-wrap">
        <BoardView perspective="A" model={agentAModel} style={agentAStyle} />
        <BoardView perspective="B" model={agentBModel} style={agentBStyle} />
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs text-muted-foreground mt-2 flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-secondary/40" />
          <span>Empty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-400/15" />
          <span>Your Ship</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-bold">○</span>
          <span>Miss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/70 flex items-center justify-center">
            <span className="text-white text-xs font-bold">✕</span>
          </div>
          <span>Hit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600/90" />
          <span>Sunk Ship</span>
        </div>
      </div>

      {isThinking && currentPlayer && (
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">
            {currentPlayer === 'A' ? MODEL_NAMES[agentAModel] : MODEL_NAMES[agentBModel]} is thinking...
          </span>
        </div>
      )}
    </div>
  );
}

