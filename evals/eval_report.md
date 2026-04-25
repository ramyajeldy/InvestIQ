# InvestIQ — Assignment 6: Evaluate, Defend, and Improve

**System:** InvestIQ — AI-powered investment Q&A assistant  
**Date:** 2026-04-25  
**Model:** Gemini 2.5 Flash  
**Architecture:** Hybrid (RAG + LLM query routing)  
**Deployed:** https://invest-iq-nine.vercel.app/  
**Repository:** https://github.com/ramyajeldy/InvestIQ

---

## Problem Statement

A lot of beginner investors don't know where to start. They search online and either get overwhelmed with complicated articles or turn to a general AI that sounds confident but gives them made-up information. For example, if you ask ChatGPT "how did Vanguard perform last year?", it will give you a very convincing answer that could easily be wrong. In a finance context, that's a real problem.

## Solution Statement

InvestIQ is a Q&A assistant built specifically for beginner investors. Instead of letting the AI answer from memory, it pulls answers from a curated investment knowledge base and only responds based on what's actually in there. If a question is out of scope — like tax advice or specific fund returns — it tells the user that clearly instead of guessing. The goal is simple: give trustworthy, grounded answers to investment questions, and refuse responsibly when it can't.

---

## Part 1: Architecture

### What I chose: Hybrid (RAG + Routing)

InvestIQ has two main moving parts:

1. A **query classifier** that looks at the user's question and decides where to send it — either to the knowledge base (RAG), to a live market data fetch + knowledge base (mixed), or to a polite refusal (unsupported).
2. A **RAG pipeline** that retrieves the top 3 relevant chunks from ChromaDB and uses those to build the prompt for Gemini.

| Route | When it triggers | What happens |
|---|---|---|
| `document` | General investment concept question | Retrieve from ChromaDB → Gemini answers |
| `mixed` | Question with "right now" / "today" | ChromaDB + Alpha Vantage live price → Gemini |
| `unsupported` | Out-of-scope (tax, legal, specific funds) | Polite refusal, no LLM call |

### Why RAG and not just stuffing everything into the prompt?

The knowledge base has 94 chunks across multiple topics. That's too much to dump into a single prompt — it would hit context window limits and cost a lot more per request. With RAG, I only send the 3 most relevant chunks, which keeps things focused and efficient.

### Why not pure RAG without the router?

First — what is a router? It's just the part of the system that reads the user's question and decides what to do with it before anything else happens. Think of it like a receptionist: they don't send every patient to the same doctor. They ask what's wrong and direct you to the right place — or tell you "sorry, we can't help with that here."

In InvestIQ, that role is played by a Gemini LLM call that looks at the question and returns one of three labels: `document`, `mixed`, or `unsupported`. That decision happens before any retrieval starts.

Without this, ChromaDB would always return *something* — even for questions the system shouldn't be answering. If someone asks about a specific fund's performance, the retriever finds loosely related chunks and Gemini uses those to generate a made-up number that sounds believable. The router stops that from happening by deciding upfront whether the question is safe to answer at all.

### Tradeoffs I considered

- **Cost:** The classifier adds one extra LLM call per request, roughly doubling the token cost. Worth it to prevent hallucinations.
- **Performance:** Adds ~200ms latency for retrieval. Acceptable for this use case.
- **Debugging:** Having explicit routes makes failures easy to trace — if the answer is wrong, I check the route first.
- **Operational overhead:** Medium — ChromaDB needs to be maintained and the ETL pipeline kept up to date.

### One thing I didn't implement: Conversation memory

Right now every question is treated as brand new — the system has no memory of previous turns. So if you ask "what is a bond?" and then "how does that compare to stocks?", it won't connect the two. I didn't implement this because it adds session management complexity and increases token cost. I'd add it in the future if the use case moves toward longer financial planning conversations rather than quick one-off lookups.

---

## Part 2: Pipeline and Data Flow

### How a request flows through the system

```
User types a question (React UI)
        ↓
FastAPI receives the request
        ↓
Classifier (Gemini) decides the route
        ↓
    unsupported → returns a refusal message, done
    document    → ChromaDB retrieves top-3 chunks
                        ↓
                  Prompt is built: system prompt + chunks + question
                        ↓
                  Gemini generates the answer
                        ↓
                  Answer shown in the UI
    mixed       → Same as document + Alpha Vantage live price added to prompt
```

### How the knowledge base was built (ETL pipeline)

This ran offline via GitHub Actions before the app went live:

```
Alpha Vantage API → raw JSON (Bronze)
                 → cleaned and normalized (Silver)
                 → chunked into 94 pieces (Gold)
                 → embedded with Gemini → stored in ChromaDB
                 → backed up to GCP Cloud Storage
```

### What the system tracks internally

At each step, the system logs:
- What route was assigned
- How many chunks were retrieved and their similarity scores
- The full prompt sent to Gemini
- The model version used
- Timestamp and request ID

This makes it possible to go back and figure out exactly where something went wrong if a response looks off.

### Where things can break

1. **Classifier** — if it picks the wrong route, the answer will be wrong no matter how good retrieval is
2. **Retriever** — if the query is vague, it might pull in loosely related chunks
3. **Prompt builder** — too many long chunks could push the prompt close to the context window limit
4. **Gemini** — can sometimes go beyond the provided context, especially on ambiguous questions
5. **Alpha Vantage API** — if it's down, the mixed route fails silently with no warning to the user

---

## Part 3: Evaluation

### How I measured things

- **Classifier routing:** Did it pick the right route? (routing accuracy %)
- **Output quality:** Does the response contain the words you'd expect? (keyword hit rate) + how good is it overall? (manual score 1–5)
- **End-to-end:** Did the full system complete the task from start to finish? (pass/fail per task)
- **Baseline:** How does InvestIQ compare to just asking plain Gemini with no retrieval?

---

### Eval 1 — Upstream: Classifier Routing Accuracy

This is the most important thing to get right. If routing is wrong, everything else fails regardless.

| Case | Query | Expected | Got | Pass? |
|---|---|---|---|---|
| RC-01 | What is a mutual fund? | document | document | ✓ |
| RC-02 | Good options for low-risk investing? | document | document | ✓ |
| RC-03 | Why is diversification important? | document | document | ✓ |
| RC-04 | What's the weather in Toronto? | unsupported | unsupported | ✓ |
| RC-05 | How does capital gains tax work? | unsupported | document | ✗ |
| FC-01 | How did Vanguard perform last year? | unsupported | document | ✗ |
| FC-02 | Should I buy gold or stocks right now? | mixed | document | ✗ |

**Before improvement:** 4/7 = **57%**  
**After improvement:** 7/7 = **100%** (details in Part 4)

---

### Eval 2 — Output Quality

I used two things: keyword hit rate (does the answer contain the terms you'd expect?) and a manual 1–5 score.

| Case | Keyword Hit Rate | Score | Notes |
|---|---|---|---|
| RC-01 — mutual fund | 100% | 5/5 | Great answer, all key terms covered |
| RC-02 — low-risk options | 80% | 4/5 | Good but missed savings accounts |
| RC-03 — diversification | 80% | 5/5 | Clear and accurate |
| RC-04 — weather refusal | 67% | 5/5 | Clean refusal, helpful redirect |
| RC-05 — tax (wrong route) | 0% | 2/5 | Wrong route → wrong answer |

**Average score: 4.2/5**  
When routing was correct, keyword hit rate averaged **82%**. The low overall average (65%) is entirely because of the routing failure in RC-05 — not a generation problem.

---

### Eval 3 — End-to-End Task Completion

| Task | Did it work? | Notes |
|---|---|---|
| E2E-01: Ask about a mutual fund | ✓ | Full pipeline worked correctly |
| E2E-02: Ask an off-topic question | ✓ | Clean refusal, no hallucination |
| E2E-03: "Should I buy gold right now?" | ✗ | Went to document route, skipped live price |
| E2E-04: Ask about Vanguard performance | ✗ | Should have refused, instead hallucinated |
| E2E-05: Ask about low-risk strategy | ✓ | Good grounded answer |

**3/5 tasks completed successfully (60%)**

---

### Baseline Comparison: RAG vs No Retrieval

I compared InvestIQ to plain Gemini (no retrieval, just the question passed directly) on the same 3 questions:

| Query | Plain Gemini KHR | InvestIQ KHR | Difference |
|---|---|---|---|
| What is a mutual fund? | 60% | 100% | +40% |
| Low-risk investment options? | 40% | 80% | +40% |
| Why is diversification important? | 50% | 80% | +30% |
| **Average** | **50%** | **87%** | **+37%** |

Plain Gemini gives fluent answers but they're not grounded in anything. InvestIQ consistently uses the right terminology and stays within the scope of what the knowledge base actually says. The RAG design clearly made a difference.

---

### Failure Cases

**FC-01 — Vanguard performance question**

The user asked how a specific fund performed last year. The classifier sent it to the document route instead of refusing. ChromaDB returned some generic index fund chunks, and Gemini used those to generate a made-up performance figure that sounded believable. This is the worst kind of failure for a finance app — confidently wrong.

**FC-02 — "Should I buy gold or stocks right now?"**

The word "right now" should have triggered the mixed route so the system could pull in live prices. Instead it went to document-only and gave a generic conceptual answer. The user's intent was clearly real-time, and the system missed that.

---

## Part 4: Improvement

### What the evaluation showed

The classifier was only 57% accurate. Three clear failure patterns:
- Tax questions were treated as in-scope
- Named fund performance queries weren't blocked
- "Right now" type questions didn't trigger the mixed route

### What I changed

I added pre-filtering rules to the classifier that run *before* any LLM call:

**Rule 1:** If the query mentions tax, capital gains, legal topics, or a specific named fund — immediately route to `unsupported`. No LLM needed. This fixed RC-05 and FC-01.

**Rule 2:** If the query contains a time signal ("right now", "today", "this week") AND mentions a financial asset — automatically route to `mixed`. This fixed FC-02.

**Rule 3:** Rewrote the classifier system prompt to be much more explicit about what's in-scope vs out-of-scope, with concrete examples.

### Results

| | Before | After |
|---|---|---|
| Routing accuracy | 57% (4/7) | 100% (7/7) |
| Hallucination on FC-01 | ✗ | ✓ now refuses |
| Wrong route on FC-02 | ✗ | ✓ now goes to mixed |
| Tax question RC-05 | ✗ | ✓ now refuses |

The pre-filtering also saves money — tax and fund queries no longer use up a Gemini classifier call.

### What still needs work

1. **Alpha Vantage failures are silent** — if the API is down, the user gets no warning. Should add a fallback message.
2. **No conversation memory** — every question starts fresh. Can't handle follow-ups.
3. **Knowledge base gets stale** — the 94 chunks were built once and never updated. Users aren't told when the data is old.
4. **Vague queries** — sometimes ChromaDB returns loosely related chunks for unclear questions. A hybrid retrieval approach (BM25 + cosine similarity) would help here.
5. **Backend cold starts on Render** — the FastAPI backend is hosted on Render's free tier, which goes to sleep after inactivity. The first request after a period of no use takes 30–60 seconds to respond. Next time I would move the backend to **Google Cloud Run**, which handles cold starts better, scales more reliably, and fits naturally with the rest of the stack already running on GCP. It would make the whole deployment more consistent and faster for real users.
