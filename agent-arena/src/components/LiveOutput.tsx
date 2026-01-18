'use client';

import { AgentConfig, GPTModel, DeepSeekModel, GeminiModel } from '@/types';
import { PROVIDER_STYLES } from '@/lib/ui/providerStyles';

// Human-readable model names
const MODEL_LABELS: Record<GPTModel | DeepSeekModel | GeminiModel, string> = {
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4o': 'GPT-4o',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek Reasoner',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
};

export interface LiveMove {
  player: 'A' | 'B';
  move: number;
  reason?: string;
  modelVariant: GPTModel | DeepSeekModel | GeminiModel;
  timestamp: number;
}

interface LiveOutputProps {
  moves: LiveMove[];
  agentA: AgentConfig;
  agentB: AgentConfig;
  isRunning: boolean;
  currentThinking: 'A' | 'B' | null;
  gameType: 'ttt' | 'c4';
}

export function LiveOutput({ moves, agentA, agentB, isRunning, currentThinking, gameType }: LiveOutputProps) {
  const formatMove = (move: number) => {
    if (gameType === 'ttt') {
      const row = Math.floor(move / 3);
      const col = move % 3;
      return `[${row},${col}]`;
    }
    return `col ${move}`;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
          Live Output
        </h3>
        {isRunning && (
          <span className="text-xs text-slate-400">
            {moves.length} move{moves.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {moves.length === 0 && !isRunning && (
          <p className="text-sm text-slate-500 italic">No moves yet. Click "Run Single Match" to start.</p>
        )}

        {moves.map((move, index) => {
          const isAgentA = move.player === 'A';
          const config = isAgentA ? agentA : agentB;
          const styles = PROVIDER_STYLES[config.model];
          const modelLabel = MODEL_LABELS[move.modelVariant] || move.modelVariant;
          const playerSymbol = gameType === 'ttt'
            ? (isAgentA ? 'X' : 'O')
            : (isAgentA ? 'P1' : 'P2');

          return (
            <div
              key={index}
              className={`p-2 rounded text-sm animate-fade-in ${styles.bg} border-l-2 ${styles.border}`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${styles.text}`}>
                  {modelLabel} ({playerSymbol})
                </span>
                <span className="text-slate-400 font-mono">
                  -&gt; {formatMove(move.move)}
                </span>
              </div>
              {move.reason && (
                <p className="text-xs text-slate-400 mt-1 italic truncate">
                  "{move.reason}"
                </p>
              )}
            </div>
          );
        })}

        {isRunning && currentThinking && (
          <div className={`p-2 rounded text-sm ${
            PROVIDER_STYLES[currentThinking === 'A' ? agentA.model : agentB.model].bg
          } border-l-2 ${
            PROVIDER_STYLES[currentThinking === 'A' ? agentA.model : agentB.model].border
          }`}>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${
                PROVIDER_STYLES[currentThinking === 'A' ? agentA.model : agentB.model].text
              }`}>
                {MODEL_LABELS[currentThinking === 'A' ? agentA.modelVariant : agentB.modelVariant]}
              </span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
