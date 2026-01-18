'use client';

import { useEffect, useRef } from 'react';
import { AgentConfig, MoveRecord, GPTModel, DeepSeekModel, GeminiModel } from '@/types';
import { PROVIDER_LABELS, getPlayerStyles } from '@/lib/ui/providerStyles';
import confetti from 'canvas-confetti';
import { Trophy, DollarSign, Hash, Clock } from 'lucide-react';
import { calculateCost } from '@/lib/utils/pricing';

// Human-readable model names
const MODEL_LABELS: Record<GPTModel | DeepSeekModel | GeminiModel, string> = {
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4o': 'GPT-4o',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek Reasoner',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
};

interface AgentPanelProps {
  label: 'A' | 'B';
  config: AgentConfig;
  lastMove: MoveRecord | null;
  isActive: boolean;
  isP2: boolean;
  isWinner?: boolean;
  metrics?: {
    invalidJsonCount: number;
    illegalMoveCount: number;
    retryCount: number;
    totalInputTokens?: number;
    totalOutputTokens?: number;
    totalThinkingTimeMs?: number;
  };
}

export function AgentPanel({ label, config, lastMove, isActive, isP2, isWinner, metrics }: AgentPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hasTriggeredConfetti = useRef(false);

  const providerDisplay = PROVIDER_LABELS[config.model];
  const modelDisplay = MODEL_LABELS[config.modelVariant] || config.modelVariant;
  const styles = getPlayerStyles(config.model, isP2);

  // Trigger confetti when becoming a winner
  useEffect(() => {
    if (isWinner && !hasTriggeredConfetti.current && panelRef.current) {
      hasTriggeredConfetti.current = true;
      const rect = panelRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      // Fire confetti from the panel location
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ffffff'],
        scalar: 0.8,
        gravity: 1.2,
        decay: 0.94,
        ticks: 100,
      });
    }
    // Reset when no longer winner (new game started)
    if (!isWinner) {
      hasTriggeredConfetti.current = false;
    }
  }, [isWinner]);

  // Get winner-specific styles - darker background version
  const winnerBg = isWinner ? (
    config.model === 'gpt' ? 'bg-emerald-950/80 border-emerald-700/50' :
    config.model === 'deepseek' ? 'bg-sky-950/80 border-sky-700/50' :
    'bg-amber-950/80 border-amber-600/50'
  ) : '';

  return (
    <div
      ref={panelRef}
      className={`p-4 rounded-lg border ${styles.border} ${isActive ? styles.bg : isWinner ? winnerBg : 'bg-card'} transition-all duration-200 relative overflow-hidden`}
    >

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${styles.text}`}>
            {providerDisplay}
          </h3>
          {isActive && (
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
        {isWinner ? (
          <Trophy className={`w-4 h-4 ${styles.text}`} />
        ) : (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles.badge}`}>
            {label === 'A' ? 'P1' : 'P2'}
          </span>
        )}
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        {modelDisplay}
      </div>

      {lastMove && (
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Last move</span>
            <span className="font-mono text-sm">{lastMove.move}</span>
          </div>
          {lastMove.reason && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {lastMove.reason}
            </p>
          )}
        </div>
      )}

      {metrics && (metrics.totalInputTokens !== undefined || metrics.totalOutputTokens !== undefined || metrics.totalThinkingTimeMs !== undefined) && (
        <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
          {metrics.totalInputTokens !== undefined && metrics.totalOutputTokens !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Hash className="w-3 h-3" />
                <span>Tokens</span>
              </div>
              <span className="font-mono">
                {(metrics.totalInputTokens || 0) + (metrics.totalOutputTokens || 0)}
              </span>
            </div>
          )}
          {metrics.totalInputTokens !== undefined && metrics.totalOutputTokens !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                <span>Cost</span>
              </div>
              <span className="font-mono">
                ${calculateCost(config.modelVariant, metrics.totalInputTokens || 0, metrics.totalOutputTokens || 0).toFixed(6)}
              </span>
            </div>
          )}
          {metrics.totalThinkingTimeMs !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Time</span>
              </div>
              <span className="font-mono">
                {(metrics.totalThinkingTimeMs / 1000).toFixed(2)}s
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
