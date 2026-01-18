'use client';

import { BSCell, ModelType } from '@/types';
import { useEffect, useState } from 'react';

interface BattleshipBoardProps {
  board: BSCell[];
  lastMove: number | null;
  currentPlayer: 'A' | 'B' | null;
  isThinking: boolean;
  agentAModel: ModelType;
  agentBModel: ModelType;
}

const BOARD_SIZE = 10;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function getRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

export function BattleshipBoard({
  board,
  lastMove,
  currentPlayer,
  isThinking,
  agentAModel,
  agentBModel,
}: BattleshipBoardProps) {
  const [animatingCell, setAnimatingCell] = useState<number | null>(null);

  useEffect(() => {
    if (lastMove !== null) {
      setAnimatingCell(lastMove);
      const timer = setTimeout(() => setAnimatingCell(null), 500);
      return () => clearTimeout(timer);
    }
  }, [lastMove]);

  const getCellDisplay = (cell: BSCell) => {
    switch (cell) {
      case 'miss':
        return { symbol: '○', className: 'text-blue-400' };
      case 'hit':
        return { symbol: '✕', className: 'text-red-500' };
      case 'sunk':
        return { symbol: '■', className: 'text-red-700' };
      default:
        return { symbol: '·', className: 'text-muted-foreground/30' };
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Column headers */}
      <div className="flex gap-1 mb-1">
        <div className="w-6" /> {/* Spacer for row labels */}
        {Array.from({ length: BOARD_SIZE }).map((_, col) => (
          <div key={col} className="w-8 text-center text-xs text-muted-foreground font-mono">
            {col + 1}
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="bg-secondary p-2 rounded-lg">
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <div key={row} className="flex gap-1 mb-1">
            {/* Row label */}
            <div className="w-6 text-xs text-muted-foreground font-mono flex items-center justify-center">
              {ROW_LABELS[row]}
            </div>
            {/* Cells */}
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              const index = row * BOARD_SIZE + col;
              const cell = board[index];
              const { symbol, className } = getCellDisplay(cell);
              const isLastMove = lastMove === index;
              const isAnimating = animatingCell === index;

              return (
                <div
                  key={index}
                  className={`
                    w-8 h-8 bg-card rounded flex items-center justify-center
                    text-lg font-bold transition-all duration-200
                    ${isLastMove ? 'ring-2 ring-white/50' : ''}
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

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground/30">·</span>
          <span>Unknown</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-400">○</span>
          <span>Miss</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-500">✕</span>
          <span>Hit</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-700">■</span>
          <span>Sunk</span>
        </div>
      </div>

      {isThinking && currentPlayer && (
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">Thinking...</span>
        </div>
      )}
    </div>
  );
}

