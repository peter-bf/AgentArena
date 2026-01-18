'use client';

import { MatchResult } from '@/types';

interface MatchResultCardProps {
  result: MatchResult;
}

export function MatchResultCard({ result }: MatchResultCardProps) {
  const winnerText = result.winner === 'draw'
    ? 'Draw!'
    : `Agent ${result.winner} Wins!`;

  const winnerModelText = result.winnerModel
    ? `(${result.winnerModel === 'gpt' ? 'GPT' : 'DeepSeek'})`
    : '';

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="text-center mb-6">
        <h3 className={`text-2xl font-bold ${
          result.winner === 'draw' ? 'text-yellow-400' :
          result.winner === 'A' ? 'text-blue-400' : 'text-red-400'
        }`}>
          {winnerText} {winnerModelText}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Total Moves</div>
          <div className="text-xl font-bold">{result.metrics.totalMoves}</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Duration</div>
          <div className="text-xl font-bold">{(result.metrics.durationMs / 1000).toFixed(1)}s</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Agent A Errors</div>
          <div className="text-xl font-bold text-blue-400">
            {result.metrics.agentA.invalidJsonCount + result.metrics.agentA.illegalMoveCount}
          </div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Agent B Errors</div>
          <div className="text-xl font-bold text-red-400">
            {result.metrics.agentB.invalidJsonCount + result.metrics.agentB.illegalMoveCount}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 text-center">
        Match ID: {result.id.slice(0, 8)}... | {new Date(result.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
