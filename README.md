![](/.github/banner.png)

![alt text](/.github/image.png)

# 🏆 1st Place @ uOttawaHack 8 

Built for **uOttaHack 8 - IT: Agentic Compare Challenge**

## Features

- **Three Games**: Tic-Tac-Toe, Connect-4, and Battleship
- **Three LLM Providers**: OpenAI GPT, DeepSeek, and Google Gemini with multiple model variants
- **Streaming Gameplay**: Real-time server-sent events for live match updates
- **Real-time Animations**: Piece drops, mark fade-ins, winning line highlights, confetti celebrations
- **Match Replay**: Step through moves or auto-play at 500ms intervals
- **Global Leaderboard**: Track wins by model across all matches
- **Robust Validation**: Server-side move validation with retry logic
- **Advanced Metrics**: Token usage tracking, move duration, error rates per agent
- **Configurable Models**: Select specific model variants (gpt-4o, deepseek-reasoner, gemini-2.0-flash, etc.)

## Architecture Overview

```
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── api/
│   │   │   ├── play/route.ts        # POST - Run a match (synchronous)
│   │   │   ├── play-stream/route.ts # POST - Stream match updates (SSE)
│   │   │   └── stats/route.ts       # GET - Fetch global stats
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Main UI
│   │   └── globals.css
│   ├── components/                  # React components
│   │   ├── TicTacToeBoard.tsx
│   │   ├── Connect4Board.tsx
│   │   ├── BattleshipBoard.tsx      # Battleship game board
│   │   ├── AgentPanel.tsx
│   │   ├── MatchResultCard.tsx
│   │   ├── GlobalStats.tsx
│   │   ├── GameControls.tsx
│   │   ├── ReplayControls.tsx
│   │   ├── LiveOutput.tsx           # Real-time move stream
│   │   └── LLMSettings.tsx          # Model variant selection
│   ├── lib/
│   │   ├── games/                   # Game engines
│   │   │   ├── tictactoe.ts
│   │   │   ├── connect4.ts
│   │   │   └── battleship.ts        # Battleship logic
│   │   ├── agents/                  # LLM adapters
│   │   │   ├── gpt.ts               # OpenAI integration
│   │   │   ├── deepseek.ts          # DeepSeek integration
│   │   │   ├── gemini.ts            # Google Gemini integration
│   │   │   ├── prompts.ts
│   │   │   └── index.ts
│   │   ├── simulation.ts            # Match runner
│   │   ├── db.ts                    # File-based JSON storage
│   │   ├── ui/
│   │   │   └── providerStyles.ts    # Theme colors per model
│   │   └── utils/
│   │       └── pricing.ts           # Token cost calculations
│   └── types/
│       └── index.ts                 # TypeScript types
├── data/
│   └── matches.json                 # Match history (auto-created)
└── package.json
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
# OpenAI API Key (required for GPT models)
OPENAI_API_KEY=sk-your-openai-api-key-here

# DeepSeek API Key and Base URL (required for DeepSeek models)
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Google Gemini API Key (required for Gemini models)
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Match Flow

1. User selects game type (Tic-Tac-Toe, Connect-4, or Battleship)
2. Choose AI models for Agent A and Agent B (GPT, DeepSeek, or Gemini variants)
3. Click "Run Single Match" to start streaming gameplay
4. Server streams real-time updates via Server-Sent Events (SSE)
5. Each agent receives the current board state and must return a valid move
6. Invalid JSON or illegal moves trigger retries (up to 5 attempts)
7. Results are stored and leaderboard updates automatically
8. Match replay available with step-through or auto-play controls

### Supported Models

**OpenAI (GPT):**
- gpt-4o-mini (default)
- gpt-4o
- gpt-4-turbo
- gpt-3.5-turbo

**DeepSeek:**
- deepseek-chat (default)
- deepseek-reasoner

**Google Gemini:**
- gemini-2.0-flash (default)
- gemini-2.0-flash-lite
- gemini-1.5-flash
- gemini-1.5-pro

### Agent Prompting

Agents receive a structured prompt with:
- Current board state (visual representation)
- List of legal moves
- Winning/blocking move hints (for Tic-Tac-Toe and Connect-4)
- Game-specific strategic advice
- Instructions to return JSON with `move` and `reason`

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

### POST /api/play-stream

Stream real-time match updates via Server-Sent Events (SSE). This is the primary endpoint used by the UI.

**Request:**
```json
{
  "gameType": "ttt",  // or "c4" or "bs"
  "agentA": { "model": "gpt", "variant": "gpt-4o-mini" },
  "agentB": { "model": "gemini", "variant": "gemini-2.0-flash" }
}
```

**Response Stream Events:**
- `thinking`: Agent is processing next move
- `move`: Move completed with board state and reasoning
- `complete`: Match finished with final results
- `error`: Error occurred during match
- `forfeit`: Agent forfeited after max retries

### POST /api/play

Run a single match synchronously (no streaming).

**Request:**
```json
{
  "gameType": "ttt",  // "ttt", "c4", or "bs"
  "agentA": { "model": "gpt", "variant": "gpt-4o-mini" },
  "agentB": { "model": "deepseek", "variant": "deepseek-chat" }
}
```

**Response:**
```json
{
  "id": "uuid",
  "winner": "A",  // "A", "B", or "draw"
  "winnerModel": "gpt",
  "moves": [...],
  "finalBoard": [...],
  "metrics": {
    "totalMoves": 9,
    "durationMs": 5432,
    "agentA": {
      "invalidJsonCount": 0,
      "illegalMoveCount": 1,
      "retryCount": 1,
      "inputTokens": 245,
      "outputTokens": 52
    },
    "agentB": { /* same structure */ }
  }
}
```

### GET /api/stats

Fetch global leaderboard statistics.

**Response:**
```json
{
  "stats": {
    "ttt": { "matchesPlayed": 10, "draws": 2, "winsByModel": { "gpt": 5, "deepseek": 2, "gemini": 1 } },
    "c4": { "matchesPlayed": 5, "draws": 0, "winsByModel": { "gpt": 3, "deepseek": 2 } },
    "bs": { "matchesPlayed": 3, "draws": 0, "winsByModel": { "gemini": 2, "gpt": 1 } }
  },
  "recentMatches": [...]
}
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **LLM APIs**: OpenAI, DeepSeek, Google Gemini
- **Database**: File-based JSON
- **Animations**: canvas-confetti

## Judge Pitch

**Agent Arena** transforms the abstract concept of "agentic AI comparison" into a fun, visual, and educational experience. By framing the comparison as a head-to-head game match, users can immediately understand the differences between models and agent strategies.

Key differentiators:
- **Engaging UX**: Animated game boards with piece drops, winning highlights, and confetti celebrations
- **Meaningful Metrics**: Track not just wins, but also token usage, error rates, and retries per model
- **Fair Comparison**: Same prompts, same game state, different brains - see how GPT, DeepSeek, and Gemini reason differently
- **Robust Design**: Server-side validation ensures no cheating; retry logic handles LLM quirks
- **Multiple Complexities**: From simple Tic-Tac-Toe to strategic Battleship - test agents across varying difficulty levels

The leaderboard provides a persistent record of AI capabilities, making Agent Arena not just a demo, but a benchmarking tool for agentic AI performance.

## License

MIT
