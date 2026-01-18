# Agent Arena - Agentic Compare

A hackathon-ready web app that pits LLM agents against each other in classic games, comparing their performance with meaningful metrics.

Built for **uOttaHack 7 - IT: Agentic Compare Challenge**

## Features

- **Two Games**: Tic-Tac-Toe and Connect-4
- **Two LLM Models**: GPT-4o-mini vs DeepSeek
- **Two Agent Modes**: ReAct (reason + act) vs Planner (plan + act)
- **Real-time Animations**: Piece drops, mark fade-ins, winning line highlights
- **Match Replay**: Step through moves or auto-play at 500ms intervals
- **Global Leaderboard**: Track wins by model across all matches
- **Robust Validation**: Server-side move validation with retry logic

## Architecture Overview

```
agent-arena/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── play/route.ts   # POST - Run a match
│   │   │   └── stats/route.ts  # GET - Fetch global stats
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Main UI
│   │   └── globals.css
│   ├── components/             # React components
│   │   ├── TicTacToeBoard.tsx
│   │   ├── Connect4Board.tsx
│   │   ├── AgentPanel.tsx
│   │   ├── MatchResultCard.tsx
│   │   ├── GlobalStats.tsx
│   │   ├── GameControls.tsx
│   │   └── ReplayControls.tsx
│   ├── lib/
│   │   ├── games/              # Game engines
│   │   │   ├── tictactoe.ts
│   │   │   └── connect4.ts
│   │   ├── agents/             # LLM adapters
│   │   │   ├── gpt.ts
│   │   │   ├── deepseek.ts
│   │   │   ├── prompts.ts
│   │   │   └── index.ts
│   │   ├── simulation.ts       # Match runner
│   │   └── db.ts               # File-based JSON storage
│   └── types/
│       └── index.ts            # TypeScript types
├── data/
│   └── matches.json            # Match history (auto-created)
└── package.json
```

## Quick Start

### 1. Install Dependencies

```bash
cd agent-arena
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# DeepSeek API Key and Base URL (required)
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Match Flow

1. User selects game type, models, and agent modes
2. Click "Run Single Match" to start
3. Server alternates turns between agents until game ends
4. Each agent receives the current board state and must return a valid move
5. Invalid JSON or illegal moves trigger retries (up to 5 attempts)
6. Results are stored and leaderboard updates

### Agent Prompting

Agents receive a simple prompt with:
- Current board state (visual representation)
- List of legal moves
- Instructions to return JSON with `move` and `reason`
- Planner mode adds a `plan` array requirement

Example prompt for Tic-Tac-Toe:
```
You are playing Tic-Tac-Toe as X.

Board is a 3x3 grid in row-major order:

Index mapping:
0 1 2
3 4 5
6 7 8

Current board:
[X, O, _,
 _, X, _,
 O, _, _]

Legal moves: [2, 3, 5, 7, 8]
```

### Validation & Retry Logic

- **Invalid JSON**: If the agent returns malformed JSON, retry with error message
- **Illegal Move**: If the move is not in legal moves list, retry with error message
- **Max Retries**: After 5 failed attempts, the agent forfeits and opponent wins

## API Endpoints

### POST /api/play

Run a single match between two agents.

**Request:**
```json
{
  "gameType": "ttt",
  "agentA": { "model": "gpt", "mode": "react" },
  "agentB": { "model": "deepseek", "mode": "planner" }
}
```

**Response:**
```json
{
  "id": "uuid",
  "winner": "A",
  "winnerModel": "gpt",
  "moves": [...],
  "metrics": {
    "totalMoves": 9,
    "durationMs": 5432,
    "agentA": { "invalidJsonCount": 0, "illegalMoveCount": 1, "retryCount": 1 },
    "agentB": { "invalidJsonCount": 0, "illegalMoveCount": 0, "retryCount": 0 }
  }
}
```

### GET /api/stats

Fetch global leaderboard statistics.

**Response:**
```json
{
  "stats": {
    "ttt": { "matchesPlayed": 10, "draws": 2, "winsByModel": { "gpt": 5, "deepseek": 3 } },
    "c4": { "matchesPlayed": 5, "draws": 0, "winsByModel": { "gpt": 3, "deepseek": 2 } }
  },
  "recentMatches": [...]
}
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **LLM APIs**: OpenAI, DeepSeek (OpenAI-compatible)
- **Database**: File-based JSON

## Judge Pitch

**Agent Arena** transforms the abstract concept of "agentic AI comparison" into a fun, visual, and educational experience. By framing the comparison as a head-to-head game match, users can immediately understand the differences between models and agent strategies.

Key differentiators:
- **Engaging UX**: Animated game boards with piece drops and winning highlights
- **Meaningful Metrics**: Track not just wins, but also error rates and retries per model
- **Fair Comparison**: Same prompts, same game state, different brains - see how GPT and DeepSeek reason differently
- **Robust Design**: Server-side validation ensures no cheating; retry logic handles LLM quirks
- **Extensible**: Easy to add new games (Rock-Paper-Scissors?) or models (Claude, Gemini?)

The leaderboard provides a persistent record of AI capabilities, making Agent Arena not just a demo, but a benchmarking tool for agentic AI performance.

## License

MIT
