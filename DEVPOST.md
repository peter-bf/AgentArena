# Agent Arena

## Inspiration

As large language models become more capable, teams increasingly adopt *agentic AI* systems—LLMs wrapped in planning loops, tool usage, and decision logic. However, comparing these systems in a meaningful way is surprisingly difficult. Most benchmarks focus on static prompts or subjective outputs, not on **how agents behave over time under constraints**.

We were inspired by the idea that **simple games** can act as controlled, repeatable environments for evaluating intelligence, robustness, and decision-making. Games like Tic-Tac-Toe, Connect-4, and Battleship have clear rules, objective outcomes, and measurable mistakes, making them ideal sandboxes to compare agentic AI systems side-by-side.

Our goal was to build a platform that makes these differences *visible*.

---

## What it does

**Agent Arena** is a web-based agentic AI comparison platform where multiple LLM-powered agents compete against each other in rule-based games.

Users can:
- Select a game (Tic-Tac-Toe, Connect-4, or Battleship)
- Choose which AI models compete (GPT, Gemini, DeepSeek) with specific model variants
- Run a single match between agents with real-time streaming updates
- View animated gameplay, reasoning traces, and outcomes
- Replay matches with step-through or auto-play controls
- Contribute results to a **global leaderboard** that aggregates wins per game and per model

Each match is executed in a fully controlled environment where:
- Agents receive the same game state and legal actions
- Outputs are strictly validated with JSON schema enforcement
- Invalid or illegal actions trigger retries with error feedback
- Repeated failures result in automatic forfeiture
- Results are stored and aggregated for comparison
- Token usage and performance metrics are tracked

The result is a **visual, metric-driven benchmark** for agentic behavior.

---

## How we built it

We built Agent Arena as a full-stack web application with a strong emphasis on determinism, safety, and clarity.

### Architecture
- **Frontend:** Next.js 14 (App Router) with TypeScript and Tailwind CSS
- **Backend:** Next.js API routes handling simulation and model calls
  - `/api/play-stream` - Real-time Server-Sent Events (SSE) for live match updates
  - `/api/play` - Synchronous match execution
  - `/api/stats` - Global leaderboard statistics
- **Storage:** File-based JSON database to persist match results and global statistics
- **Game Engines:** Custom rule engines for each game (Tic-Tac-Toe, Connect-4, Battleship), enforcing legality and win conditions
- **LLM Integration:** Unified adapter layer supporting OpenAI, DeepSeek, and Google Gemini APIs

### Agent Design
Each AI model is wrapped in an **agent loop**, rather than being used as a simple chatbot:
- Agents receive the current game state and legal moves
- Strategic hints provided (winning moves, blocking opportunities)
- They must return a structured action in strict JSON format: `{"move": number, "reason": "string"}`
- All actions are validated server-side
- If an agent produces malformed output or illegal moves, the system retries with explicit error messages
- After 5 failed attempts, the agent forfeits and the opponent wins

### Game Complexity Levels
Each game exposes different strengths and weaknesses in agentic behavior:
- **Tic-Tac-Toe:** Simple, requires blocking and winning detection
- **Connect-4:** Column-based strategy with gravity mechanics
- **Battleship:** Hidden information, memory, and hunt/target strategies

---

## Challenges we ran into

- **Stability of LLM outputs:**
  LLMs occasionally produce invalid formats or illegal actions. We had to design strict JSON schemas, retry logic with error feedback, and forfeiture rules to keep matches deterministic.

- **Balancing simplicity and insight:**
  We wanted games that were easy to implement but still revealed meaningful differences between agents. Choosing the right level of complexity was critical.

- **Real-time streaming architecture:**
  Implementing Server-Sent Events (SSE) for live match updates while maintaining state consistency required careful coordination between frontend and backend.

- **Multi-provider API integration:**
  Each LLM provider (OpenAI, DeepSeek, Gemini) has different API formats, token counting methods, and response structures. Creating a unified adapter layer was challenging.

- **Battleship complexity:**
  Implementing hidden ship placements, separate board states per player, and deterministic seeded randomness required careful state management.

---

## Accomplishments that we're proud of

- Building a **fully deterministic agentic evaluation environment** with reproducible results
- Creating a system where AI failures (illegal moves, missed wins, invalid JSON) are **measurable and visible**
- Supporting multiple models (GPT-4o, Gemini 2.0, DeepSeek) with configurable variants in a unified comparison framework
- Implementing animated replays with step-through controls and confetti celebrations
- Real-time streaming gameplay with Server-Sent Events for engaging user experience
- Building a live global statistics dashboard within a short hackathon timeframe
- Designing a project that is both **technically rigorous** and **easy to understand**
- Comprehensive metrics tracking including token usage, retry counts, and error rates

---

## What we learned

- Agent architecture matters just as much as the underlying model—the prompting strategy and retry logic significantly impact performance
- Simple environments can reveal deep behavioral differences between models
- LLM robustness (format adherence, legality, consistency) is a critical metric often overlooked in benchmarks
- Visualization dramatically improves understanding of agent behavior and decision-making processes
- Evaluating AI systems benefits from **constraints**, not just open-ended prompts
- Streaming architecture provides better user engagement than synchronous batch processing
- Token usage varies dramatically between models and can be a key differentiator beyond just win rates

---

## What's next for Agent Arena

Future improvements could include:

### More Games & Environments
- Additional strategy games (Chess, Checkers, Go)
- Cooperative games requiring multi-agent coordination
- Puzzle-solving tasks (Sudoku, logic puzzles)
- Resource optimization challenges
- Real-world scenarios (scheduling, routing)

### Enhanced Agent Capabilities
- Tool-augmented agents with calculators, search, code execution
- Multi-agent cooperation and negotiation
- Memory systems for learning from past matches
- Custom agent architectures beyond simple prompting

### Advanced Analytics
- Automated scoring functions for move quality (not just wins/losses)
- Cost efficiency comparisons (performance per dollar spent)
- Latency and response time benchmarking
- Statistical significance testing across model versions
- Head-to-head matchup analysis (which models beat which)

### Platform Features
- Batch match execution for larger datasets
- Exportable reports for teams evaluating models in production
- Custom game/environment uploads
- API access for automated testing
- Tournament brackets with elimination rounds
- ELO rating system across all models

Agent Arena is a step toward **transparent, practical evaluation of agentic AI systems**, and we're excited to keep expanding it as a benchmarking tool for the AI community.
