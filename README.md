# InvestIQ 📈

> AI-powered investment Q&A platform — ask plain-English questions about investing and get intelligent, RAG-backed answers.

[![CI](https://github.com/ramyajeldy/InvestIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/ramyajeldy/InvestIQ/actions/workflows/ci.yml)

## Live Links

| | URL |
|---|---|
| 🖥️ Frontend | https://invest-iq-git-main-ramyajeldy-6775s-projects.vercel.app/ |
| ⚙️ Backend API | https://investiq-api.onrender.com |
| 📖 API Docs | https://investiq-api.onrender.com/docs |
| 📁 GitHub | https://github.com/ramyajeldy/InvestIQ |

## What It Does

InvestIQ answers investment questions using RAG (Retrieval-Augmented Generation). Users ask plain-English questions about stocks, ETFs, mutual funds, and market trends. The system classifies each question, retrieves relevant context from ChromaDB, and generates grounded answers using Gemini 2.5 Flash.

**Supported questions:**
- What is a mutual fund and how does it work?
- What is dollar cost averaging?
- What is the market outlook for 2026?
- How do I manage portfolio risk?

**Out of scope:** weather, sports, cooking, and anything unrelated to investing.

## Architecture
User
│
▼
React / Vite (Vercel)
│  POST /chat
▼
FastAPI (Render)
│
├─► Query Classifier ──► out_of_scope → polite refusal
│
└─► ChromaDB (RAG retrieval)
│
▼
Gemini 2.5 Flash
│
▼
Answer
ETL Pipeline (GitHub Actions, runs weekdays 2pm UTC):
Alpha Vantage API
└─► Bronze (raw JSON) ──► Silver (cleaned) ──► Gold (curated)
│
GCS Bucket (investiq-data-rj)
│
ChromaDB (embedded)
## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, deployed on Vercel |
| Backend | Python 3.11 + FastAPI, deployed on Render |
| Vector DB | ChromaDB (persistent, embedded) |
| LLM | Gemini 2.5 Flash via Google AI |
| ETL | GitHub Actions + GCP Cloud Storage |
| Testing | pytest (14 tests) + Playwright E2E |
| CI/CD | GitHub Actions (ci.yml) |

## Local Setup

### Backend
```bash
git clone https://github.com/ramyajeldy/InvestIQ.git
cd InvestIQ
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in: GEMINI_API_KEY, ALPHA_VANTAGE_API_KEY, GCP_BUCKET_NAME, GCP_PROJECT_ID
uvicorn api.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend — pytest (14 tests)
```bash
pytest tests/ -v
```
Covers: query classifier, responder, retriever, and ETL pipeline behaviors.

### E2E — Playwright
```bash
cd frontend
npx playwright install --with-deps chromium
npx playwright test
```
Covers: page load, chat interaction, API connectivity.

## CI/CD Pipeline

Every push to `main` triggers 3 jobs:

| Job | What it does |
|---|---|
| Backend Tests (pytest) | Runs all 14 tests with JUnit XML output |
| Frontend Build (Vite) | Confirms production build succeeds |
| Playwright E2E Tests | Runs browser tests against live Vercel URL |

## ETL Pipeline

Runs automatically on weekdays at 2pm UTC via `etl.yml`.

| Stage | Description |
|---|---|
| Bronze | Raw JSON from Alpha Vantage API |
| Silver | Cleaned and normalized market data |
| Gold | Curated files loaded into ChromaDB |

## Skills Used

| Skill | How it was used |
|---|---|
| `grill-me` | Pressure-tested the project idea before building |
| `write-a-prd` | Created PRD as a parent GitHub Issue |
| `prd-to-issues` | Broke PRD into actionable GitHub Issues |
| `tdd` | Built classifier tests using red-green-refactor loop |
| `improve-codebase-architecture` | Reviewed and improved api/ module structure |

## Project Structure
InvestIQ/
├── api/                  # FastAPI backend
│   ├── main.py           # App entrypoint and routes
│   ├── classifier.py     # Query routing logic
│   ├── responder.py      # Answer generation with Gemini
│   └── retriever.py      # ChromaDB retrieval
├── etl/                  # ETL pipeline
│   ├── pipeline.py       # Main pipeline orchestrator
│   ├── extractors/       # Data ingestion from APIs
│   ├── transformers/     # Cleaning and normalization
│   └── loaders/          # ChromaDB and GCS loading
├── frontend/             # React/Vite app
│   ├── src/
│   ├── tests/            # Playwright E2E tests
│   └── playwright.config.cjs
├── tests/                # pytest backend tests
│   ├── test_classifier.py
│   ├── test_responder.py
│   ├── test_retriever.py
│   └── test_pipeline.py
├── .github/
│   └── workflows/
│       ├── ci.yml        # Test + build pipeline
│       └── etl.yml       # Scheduled ETL pipeline
└── README.md
