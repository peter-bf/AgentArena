import { promises as fs } from 'fs';
import path from 'path';
import { MatchResult, GlobalStats, GameStats, GameType } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readMatches(): Promise<MatchResult[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(MATCHES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeMatches(matches: MatchResult[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(MATCHES_FILE, JSON.stringify(matches, null, 2));
}

export async function saveMatch(match: MatchResult): Promise<void> {
  const matches = await readMatches();
  matches.push(match);
  await writeMatches(matches);
}

export async function getMatches(gameType?: GameType): Promise<MatchResult[]> {
  const matches = await readMatches();
  if (gameType) {
    return matches.filter(m => m.gameType === gameType);
  }
  return matches;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const matches = await readMatches();

  const computeStats = (type: GameType): GameStats => {
    const gameMatches = matches.filter(m => m.gameType === type);
    const draws = gameMatches.filter(m => m.winner === 'draw').length;
    const gptWins = gameMatches.filter(m => m.winnerModel === 'gpt').length;
    const deepseekWins = gameMatches.filter(m => m.winnerModel === 'deepseek').length;
    const geminiWins = gameMatches.filter(m => m.winnerModel === 'gemini').length;

    return {
      matchesPlayed: gameMatches.length,
      draws,
      winsByModel: {
        gpt: gptWins,
        deepseek: deepseekWins,
        gemini: geminiWins,
      },
    };
  };

  return {
    ttt: computeStats('ttt'),
    c4: computeStats('c4'),
  };
}

export async function getRecentMatches(limit: number = 10): Promise<MatchResult[]> {
  const matches = await readMatches();
  return matches.slice(-limit).reverse();
}
