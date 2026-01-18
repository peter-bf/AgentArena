'use client';

import { BSCell, ModelType, ShipPlacement, Player } from '@/types';
import { useEffect, useState } from 'react';
import { getPlayerStyles } from '@/lib/ui/providerStyles';

interface BattleshipBoardProps {
  boardA: BSCell[]; // Shots on Player A
  boardB: BSCell[]; // Shots on Player B
  lastMove: number | null;
  currentPlayer: 'A' | 'B' | null;
  isThinking: boolean;
  agentAModel: ModelType;
  agentBModel: ModelType;
  placementsA?: ShipPlacement[];
  placementsB?: ShipPlacement[];
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
  boardA,
  boardB,
  lastMove,
  currentPlayer,
  isThinking,
  agentAModel,
  agentBModel,
  placementsA = [],
  placementsB = [],
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

  // SIMPLE DISPLAY: Just show what's in the board
  const getCellDisplay = (cellState: BSCell, index: number, perspective: Player) => {
    const ownShip = getShipAtCell(index, perspective);

    if (cellState === 'miss') {
      return {
        symbol: '○',
        className: 'text-blue-400',
        bgClass: 'bg-blue-400/10',
      };
    } else if (cellState === 'hit') {
      return {
        symbol: '✕',
        className: 'text-white font-bold',
        bgClass: 'bg-red-500/70',
      };
    } else if (cellState === 'sunk') {
      return {
        symbol: '',
        className: '',
        bgClass: 'bg-red-600/90',
      };
    } else if (ownShip) {
      return {
        symbol: '',
        className: '',
        bgClass: 'bg-gray-400/15',
      };
    } else {
      return {
        symbol: '',
        className: '',
        bgClass: 'bg-secondary/40',
      };
    }
  };

  const BoardView = ({
    perspective,
    board,
    model,
    style,
  }: {
    perspective: Player;
    board: BSCell[];
    model: ModelType;
    style: any;
  }) => {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className={`text-sm font-semibold ${style.text} ${currentPlayer === perspective ? 'animate-pulse' : ''}`}>
          {MODEL_NAMES[model]}'s Board
        </div>

        {/* Column headers */}
        <div className="flex gap-1 mb-1">
          <div className="w-6" />
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
              <div className="w-6 text-xs text-muted-foreground font-mono flex items-center justify-center">
                {ROW_LABELS[row]}
              </div>
              {Array.from({ length: BOARD_SIZE }).map((_, col) => {
                const index = row * BOARD_SIZE + col;
                const cellState = board[index];
                const { symbol, className, bgClass } = getCellDisplay(cellState, index, perspective);
                const isLastMove = lastMove === index && lastMove !== null;

                return (
                  <div
                    key={index}
                    className={`
                      w-6 h-6 rounded flex items-center justify-center
                      text-sm font-bold transition-all duration-200
                      ${bgClass}
                      ${isLastMove ? 'ring-2 ring-yellow-400/80' : ''}
                      ${isLastMove ? 'animate-pulse' : ''}
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
      <div className="flex gap-12 justify-center flex-wrap">
        <BoardView perspective="A" board={boardA} model={agentAModel} style={agentAStyle} />
        <BoardView perspective="B" board={boardB} model={agentBModel} style={agentBStyle} />
      </div>

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

