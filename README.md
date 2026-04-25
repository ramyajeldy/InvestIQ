# 📈 InvestIQ

> An AI-powered investment Q&A assistant for beginner investors — built with RAG, Gemini, and ChromaDB.

[![CI](https://github.com/ramyajeldy/InvestIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/ramyajeldy/InvestIQ/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen)](https://invest-iq-nine.vercel.app/)
[![API Docs](https://img.shields.io/badge/API%20Docs-Render-blue)](https://investiq-api.onrender.com/docs)

---

## 🔗 Live Links

| | URL |
|---|---|
| 🖥️ Frontend | https://invest-iq-nine.vercel.app/ |
| ⚙️ Backend API | https://investiq-api.onrender.com |
| 📖 API Docs | https://investiq-api.onrender.com/docs |
| 💻 GitHub | https://github.com/ramyajeldy/InvestIQ |

---

## 🧩 Problem Statement

A lot of beginner investors don't know where to start. They search online and either get overwhelmed with complicated articles, or they turn to a general AI that sounds confident but gives them made-up information.

For example, if you ask a general AI "how did Vanguard perform last year?", it will give you a very convincing answer — that could easily be wrong. In a finance context, that's a real problem.

---

## ✅ Solution

InvestIQ is a Q&A assistant built specifically for beginner investors. Instead of letting the AI answer from memory, it pulls answers from a curated investment knowledge base and only responds based on what's actually in there.

For real-time questions like "should I buy gold today?", it also fetches live market data. And if a question is out of scope — like tax advice or specific fund returns — it tells the user clearly instead of guessing.

**The goal: give trustworthy, grounded answers to investment questions, and refuse responsibly when it can't.**

---

## 🏗️ Architecture

InvestIQ uses a **Hybrid architecture** — combining Retrieval-Augmented Generation (RAG) with an LLM-powered query router.

### How it works

Every user question goes through a **router** first. Think of the router like a receptionist — it reads the question and decides where to send it before anything else happens:

```
User Question
      │
      ▼
┌─────────────────────┐
│   Query Router      │  ← Gemini LLM decides the route
│  (Classifier)       │
└─────────────────────┘
      │
      ├──── document ──────► ChromaDB (top-3 chunks)
      │                           │
      │                           ▼
      │                     Prompt Builder
      │                           │
      │                           ▼
      │                     Gemini 2.5 Flash
      │                           │
      │                           ▼
      │                     Answer shown in UI
      │
      ├──── mixed ─────────► ChromaDB (top-3 chunks)
      │                     + Alpha Vantage (live price)
      │                           │
      │                           ▼
      │                     Prompt Builder
      │                           │
      │                           ▼
      │                     Gemini 2.5 Flash
      │                           │
      │                           ▼
      │                     Answer shown in UI
      │
      └──── unsupported ──► Polite refusal message
                            (no retrieval, no LLM call)
```

### The three routes explained

| Route | When it's used | What happens |
|---|---|---|
| `document` | General investment concept question | Retrieves from ChromaDB, Gemini answers from context |
| `mixed` | Question with "right now" / "today" | ChromaDB + live market price → Gemini answers |
| `unsupported` | Tax, legal, specific fund data, off-topic | Returns a clean refusal, nothing else |

### Why RAG and not just one big prompt?

The knowledge base has 94 chunks across multiple investment topics. That's too much to put into a single prompt — it would hit context window limits and cost a lot more per request. With RAG, only the 3 most relevant chunks are sent, keeping things focused and efficient.

### Why have a router at all?

Without it, ChromaDB would always return *something* — even for questions it shouldn't answer. For example, asking about a specific fund's past performance would pull in loosely related chunks, and Gemini would generate a made-up number that sounds believable. The router prevents this by deciding upfront whether a question is safe to answer.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Python FastAPI |
| LLM | Gemini 2.5 Flash |
| Vector Database | ChromaDB |
| Embeddings | Gemini Embeddings |
| Market Data | Alpha Vantage API |
| ETL Pipeline | GitHub Actions |
| Cloud Storage | GCP Cloud Storage |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Testing | pytest + Playwright |

---

## 🔄 Data Pipeline (ETL)

The knowledge base was built offline before the app went live. It runs automatically via GitHub Actions.

```
Alpha Vantage API
      │
      ▼
Bronze Layer — raw JSON data (5 assets, daily prices)
      │
      ▼
Silver Layer — cleaned and normalized records
      │
      ▼
Gold Layer — curated content, chunked into 94 pieces
      │
      ▼
Gemini Embeddings — each chunk converted to a vector
      │
      ▼
ChromaDB — stored locally for retrieval
      │
      ▼
GCP Cloud Storage — backed up for persistence
```

Each layer builds on the previous one. This approach makes it easy to re-run just one stage if something breaks, without redoing the whole pipeline.

---

## 🗄️ ChromaDB — Vector Database

ChromaDB is what makes the RAG part of InvestIQ work. Here's what it does:

- Stores **94 chunks** of curated investment knowledge
- Each chunk is converted into a **vector (embedding)** using Gemini Embeddings
- When a user asks a question, the question is also converted to a vector
- ChromaDB finds the **top 3 chunks** whose vectors are most similar to the question
- Those chunks are passed to Gemini as context for the answer

### Why ChromaDB?

It's lightweight, runs locally without needing a separate database server, and integrates easily with Python. For a project of this scale (94 chunks), it's the right tool — no operational overhead of a hosted vector DB like Pinecone.

### Confidence Gate

If ChromaDB returns fewer than 2 chunks, or the similarity scores are too low, the system refuses to answer rather than generating a response from weak context. This prevents low-quality answers when retrieval doesn't find anything relevant.

---

## 📊 Evaluation (Assignment 6)

### What was evaluated

Three things were measured:

1. **Classifier routing accuracy** — does the router pick the right route?
2. **Output quality** — are the answers actually good? (keyword hit rate + manual score)
3. **End-to-end task completion** — does the full system work from start to finish?

---

### Eval 1 — Classifier Routing Accuracy

The router is the most critical part. If it sends a question to the wrong place, the answer will be wrong no matter what.

| Case | Query | Expected | Got | Pass? |
|---|---|---|---|---|
| RC-01 | What is a mutual fund? | document | document | ✓ |
| RC-02 | Good options for low-risk investing? | document | document | ✓ |
| RC-03 | Why is diversification important? | document | document | ✓ |
| RC-04 | What's the weather in Toronto? | unsupported | unsupported | ✓ |
| RC-05 | How does capital gains tax work? | unsupported | document | ✗ |
| FC-01 | How did Vanguard perform last year? | unsupported | document | ✗ |
| FC-02 | Should I buy gold or stocks right now? | mixed | document | ✗ |

**Before improvement:** 4/7 = 57%  
**After improvement:** 7/7 = 100%

---

### Eval 2 — Output Quality

**Keyword Hit Rate (KHR):** For each question, there's a list of words you'd expect in a good answer. KHR measures how many of those words actually appeared.

**Manual Score:** A 1–5 rating based on whether the answer is correct, grounded, and useful.

| Case | KHR | Score | Notes |
|---|---|---|---|
| RC-01 — What is a mutual fund? | 100% | 5/5 | All key terms present |
| RC-02 — Low-risk investment options? | 80% | 4/5 | Missed savings accounts |
| RC-03 — Why diversify? | 80% | 5/5 | Clear and accurate |
| RC-04 — Weather refusal | 67% | 5/5 | Clean refusal with redirect |
| RC-05 — Tax question (wrong route) | 0% | 2/5 | Wrong route → wrong answer |

**Average manual score: 4.2/5**  
When routing was correct, KHR averaged **82%**. The overall lower average (65%) is entirely due to the routing failure in RC-05.

---

### Eval 3 — End-to-End Task Completion

| Task | Pass? | Notes |
|---|---|---|
| Ask about a mutual fund → get a grounded answer | ✓ | Full pipeline worked correctly |
| Ask an off-topic question → get a clean refusal | ✓ | No hallucination triggered |
| "Should I buy gold right now?" → mixed route | ✗ | Went to document, skipped live price |
| Ask about Vanguard performance → should refuse | ✗ | Hallucinated a performance figure |
| Ask for a low-risk strategy → good answer | ✓ | Grounded in retrieved content |

**3/5 tasks completed = 60%**

---

### Baseline Comparison: RAG vs Plain Gemini

Same 3 questions asked to plain Gemini (no retrieval) vs InvestIQ:

| Query | Plain Gemini KHR | InvestIQ KHR | Difference |
|---|---|---|---|
| What is a mutual fund? | 60% | 100% | +40% |
| Low-risk investment options? | 40% | 80% | +40% |
| Why is diversification important? | 50% | 80% | +30% |
| **Average** | **50%** | **87%** | **+37%** |

Plain Gemini gives fluent but generic answers. InvestIQ consistently uses the right terminology and stays grounded in the knowledge base.

---

### Failure Cases

**FC-01 — Specific fund performance hallucination**

The user asked how Vanguard performed last year. The router sent it to `document` instead of `unsupported`. ChromaDB returned loosely related chunks, and Gemini generated a confident but completely made-up performance figure. This is the worst type of failure for a finance app.

**FC-02 — Temporal signal missed**

The user asked "should I buy gold or stocks right now?". The word "right now" should have triggered the `mixed` route to also fetch live prices. Instead it went to `document` only and gave a generic conceptual answer — missing what the user actually wanted.

---

## 🔧 Improvement (Based on Evaluation)

The evaluation showed classifier routing accuracy was only 57%. Three clear failure patterns were identified and fixed:

### What changed

**Rule 1 — Explicit block list (runs before any LLM call)**  
Queries mentioning tax, capital gains, legal topics, or specific named funds are immediately routed to `unsupported`. No Gemini call needed. Fixed RC-05 and FC-01.

**Rule 2 — Temporal signal detection**  
If a query contains words like "right now", "today", or "this week" AND mentions a financial asset, it automatically goes to `mixed`. Fixed FC-02.

**Rule 3 — Improved classifier prompt**  
Rewrote the system prompt with clear examples of what's in-scope vs out-of-scope, so the LLM has less room for ambiguity.

### Results

| Metric | Before | After |
|---|---|---|
| Routing accuracy | 57% (4/7) | 100% (7/7) |
| FC-01 hallucination | ✗ | ✓ now refuses correctly |
| FC-02 wrong route | ✗ | ✓ now routes to mixed |
| RC-05 tax question | ✗ | ✓ now refuses correctly |

---

## 🧪 Tests

### Backend — pytest

```bash
pytest tests/ -v
```

Covers: classifier routing, retriever, responder, pipeline integration (14+ tests)

### Evaluation Suite

```bash
# Run all 3 evaluations
python eval/run_eval.py

# Run baseline vs RAG comparison
python eval/baseline_comparison.py

# Validate improved classifier
python eval/classifier_improved.py
```

### End-to-End — Playwright

```bash
cd frontend && npx playwright test
```

---

## 📁 Project Structure

```
InvestIQ/
├── api/
│   ├── main.py               # FastAPI app entry point
│   ├── classifier.py         # Query router (improved v2)
│   ├── retriever.py          # ChromaDB retrieval logic
│   ├── responder.py          # Prompt builder + Gemini call
│   └── config.py             # Model name, env vars
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   └── components/       # UI components
│   └── package.json
├── etl/
│   ├── bronze.py             # Raw data fetch
│   ├── silver.py             # Cleaning + normalization
│   └── gold.py               # Chunking + embedding + ChromaDB
├── eval/
│   ├── evaluation_cases.json # 5 representative + 2 failure cases
│   ├── run_eval.py           # Full evaluation runner
│   ├── baseline_comparison.py # RAG vs no-RAG comparison
│   ├── classifier_improved.py # Improved classifier with pre-filters
│   └── eval_report.md        # Full written evaluation report
├── tests/
│   └── test_*.py             # pytest test files
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI + ETL pipeline
└── README.md
```

---

## 🚀 Local Setup

### Backend

```bash
git clone https://github.com/ramyajeldy/InvestIQ.git
cd InvestIQ
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Add your API keys
cd api && uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

```
GEMINI_API_KEY=your_key_here
ALPHA_VANTAGE_KEY=your_key_here
GCP_BUCKET_NAME=your_bucket_here
```

---

## ⚠️ Known Limitations

1. **Backend cold starts** — hosted on Render's free tier, which sleeps after inactivity. First request after idle can take 30–60 seconds. Next iteration would move to **Google Cloud Run** for faster response times and better scaling, since the rest of the stack already runs on GCP.
2. **No conversation memory** — every question is treated as brand new. Follow-up questions aren't understood as continuations.
3. **Stale knowledge base** — the 94 chunks were built once. There's no alert when the data gets outdated.
4. **Alpha Vantage dependency** — if this API goes down, the `mixed` route fails silently with no user-facing message.

---

## 📋 Assignment 6 Checklist

### Continuity
- [x] Extended Assignment 5 project
- [x] Deployed on Vercel (live)
- [x] Repository is public

### Architecture
- [x] Classified as Hybrid (RAG + LLM routing)
- [x] Justified architecture choice with tradeoffs
- [x] Explained main alternative rejected (pure RAG)
- [x] Explained capability not implemented (conversation memory)
- [x] Discussed cost, overhead, and performance

### Pipeline / Data Flow
- [x] Pipeline diagram in README
- [x] ETL stages documented
- [x] Internal debugging artifacts described

### Evaluation
- [x] Output quality evaluated (KHR + manual score)
- [x] End-to-end task success evaluated
- [x] Upstream component evaluated (classifier routing)
- [x] 5 representative cases in evaluation_cases.json
- [x] 2 failure cases in evaluation_cases.json
- [x] Baseline comparison (RAG vs plain Gemini)
- [x] Retrieval evaluation (chunk count, similarity threshold)
- [x] Routing evaluation (accuracy per case)
- [x] Metrics justified

### Improvement
- [x] Improvement based on evidence (57% → 100% routing accuracy)
- [x] Before/after results documented
- [x] Remaining weaknesses identified

### Submission
- [x] Vercel URL submitted
- [x] Public GitHub repository URL submitted
