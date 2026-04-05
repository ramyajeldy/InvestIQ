# InvestIQ PRD

## Overview and Goal

InvestIQ is an AI-powered investment research assistant for beginner-to-intermediate retail investors who want educational market context, grounded comparisons, and simple explanations without receiving personal financial advice.

The goal of v1 is to deliver a reliable, citation-first experience across three surfaces:

- A chatbot that answers only the supported question set
- A dashboard that shows the latest processed data for the five supported live assets
- A compare view that visualizes normalized performance across supported live assets

V1 must prioritize trust, scope discipline, and graceful failure over breadth. The product succeeds when it answers supported questions with grounded evidence, shows clear source provenance, and refuses unsupported or weak-evidence requests safely.

## Problem Statement

Beginner investors often struggle to compare common investment options because financial information is fragmented across market data feeds, long-form reports, and basic educational resources. They may want to understand how gold compares to major equities, what mutual funds are, or what a market outlook report says, but they do not need a full professional analytics terminal. They need a focused assistant that translates curated data and documents into simple, cited, educational answers.

## Solution

InvestIQ combines daily processed market data, curated PDFs, and selected educational web sources into a narrow, trustworthy research assistant. The system routes user questions into market-data, document, or mixed flows; retrieves only the relevant evidence; and produces a structured educational response with inline source citations, a source list, freshness indicators, and an explicit non-advice disclaimer.

## Supported Use Cases

- View the latest processed price snapshot for `SPY`, `QQQ`, `AAPL`, `Gold`, and `Silver`
- View percentage change for supported assets over `7 days`, `30 days`, or `year-to-date`
- Compare two supported live assets over a supported time window
- Ask what questions the assistant supports
- Ask for low-risk investment options using grounded educational sources
- Ask what a mutual fund is and how it works
- Ask for the market outlook for 2026 using the BlackRock outlook as the primary source
- Ask whether gold is a good hedge against inflation using retrieved sources and cautious synthesis
- Ask for an educational comparison of one supported asset versus another

## Supported Questions

The supported question contract is fixed for v1 and must be treated as a backend constant reused by prompts, UI messaging, and tests.

1. What questions are supported?
2. How does `[asset]` compare to `[asset]` over `[time period]`?
3. What are low-risk investment options?
4. What is a mutual fund and how does it work?
5. What is the market outlook for 2026?
6. Is gold a good hedge against inflation?
7. Give me an educational comparison of `[asset]` vs `[asset]`

Supported live assets:

- `SPY`
- `QQQ`
- `AAPL`
- `Gold`
- `Silver`

Supported time windows:

- `7 days`
- `30 days`
- `year-to-date`

## User Stories

1. As a beginner investor, I want to see which questions InvestIQ supports, so that I stay within the tool's reliable scope.
2. As a beginner investor, I want to compare `SPY` and `QQQ` over `7 days`, so that I can understand short-term relative performance.
3. As a beginner investor, I want to compare `AAPL` and `Gold` over `30 days`, so that I can see how a stock and a commodity have moved over the same period.
4. As a beginner investor, I want to compare supported assets over `year-to-date`, so that I can understand broader recent movement.
5. As a user, I want the dashboard to show the latest processed price for each supported live asset, so that I can quickly scan current market context.
6. As a user, I want each dashboard card to show percentage change for the selected window, so that I can compare asset movement at a glance.
7. As a user, I want every market-data surface to show a `Last updated` timestamp, so that I know how fresh the information is.
8. As a user, I want stale data to be clearly marked, so that I do not mistake delayed data for live data.
9. As a user, I want the compare view to show normalized percentage-change lines, so that assets with different price units can be compared fairly.
10. As a user, I want compare summaries to use simple winner/loser language, so that the result is easy to understand.
11. As a user, I want unsupported assets excluded from live comparisons, so that the UI stays consistent with the data contract.
12. As a user, I want mutual fund questions answered as educational content rather than live-price charts, so that the product does not pretend unsupported parity.
13. As a user, I want to ask what low-risk investment options are, so that I can get a cautious educational overview grounded in current sources.
14. As a user, I want to ask what a mutual fund is and how it works, so that I can learn basic investing concepts from cited material.
15. As a user, I want to ask about the 2026 market outlook, so that I can understand the major themes from the curated outlook document.
16. As a user, I want to ask whether gold is a good hedge against inflation, so that I can see a grounded educational synthesis with cited evidence.
17. As a user, I want each answer to include inline citations, so that I can tell where claims came from.
18. As a user, I want each answer to include a `Sources used` section, so that I can inspect the evidence behind the response.
19. As a user, I want the assistant to tell me when it lacks enough evidence, so that I do not receive speculative answers.
20. As a user, I want unsupported questions to receive a safe fallback message with the supported question list, so that I can rephrase effectively.
21. As a user, I want the assistant to avoid personal recommendations, so that the experience stays educational rather than advisory.
22. As a user, I want every investment-related answer to end with the required disclaimer, so that the product boundary is explicit.
23. As a maintainer, I want daily ETL runs to validate every source before marking success, so that stale or partial outputs do not silently propagate.
24. As a maintainer, I want `pipeline_status.json` written after every ETL run, so that backend health and data availability can be debugged quickly.
25. As a maintainer, I want Chroma artifacts precomputed and stored in GCP bucket, so that Cloud Run can load a ready vector store at startup.
26. As a maintainer, I want the backend to expose readiness and health states, so that partial failures are observable and debuggable.
27. As a maintainer, I want market-data-only queries to keep working even if document retrieval fails, so that a vector-store failure does not take down the entire product.
28. As a maintainer, I want query routing to be deterministic first, so that supported phrasing is debuggable and testable in a short timeline.
29. As a maintainer, I want chunk metadata to be consistent across PDFs and web sources, so that citations and debugging remain reliable.
30. As a demo presenter, I want one golden-path experience to work end-to-end, so that the product story remains strong even if lower-priority features are rough.

## Architecture

### System Architecture

- `React + Vite frontend` deployed on Vercel
- `FastAPI backend` deployed on Google Cloud Run
- `Gemini 2.5 Flash` used only through the backend orchestration layer
- `GitHub Actions ETL` for scheduled extraction, transformation, validation, and artifact publishing
- `GCP bucket` used for Bronze, Silver, Gold, vector artifacts, and pipeline status outputs
- `Chroma` loaded in-memory on Cloud Run startup from artifacts stored in GCP bucket

### Data Sources

- Alpha Vantage API for `SPY`, `QQQ`, and `AAPL`
- Yahoo Finance API for `Gold` and `Silver`
- PDF sources:
  - `BlackRock Outlook 2026`
  - `Gold Demand Trends 2024`
  - `Vanguard Mutual Funds`
- Web sources:
  - `investor.gov/stocks`
  - `Wikipedia Gold`
  - `Wikipedia Mutual Fund`

### Data Pipeline

- Bronze layer stores raw extracted source data
- Silver layer stores cleaned and standardized intermediate data
- Gold layer stores final structured asset data used for dashboard and comparison answers
- ETL also parses PDFs and scraped content into chunks with metadata and writes Chroma-ready artifacts
- ETL writes `pipeline_status.json` after every run with `run_date`, overall status, per-source status, and record counts
- ETL marks the run successful only if all market-data and document-source validations pass

### Backend Flow

1. Receive chat request from frontend
2. Run deterministic rules-first query classifier
3. Route the query to `market-data`, `document`, or `mixed`
4. Fetch Gold-layer data and/or retrieve document chunks from Chroma
5. Build a constrained prompt with evidence and supported-question boundaries
6. Call Gemini 2.5 Flash
7. Return a structured response contract to the frontend

### Response Contract

The chat API returns:

- `answer`
- `query_type`
- `sources_used`
- `market_data_timestamp` when applicable
- `stale_data_warning` when applicable
- `disclaimer`

Each `sources_used` item includes:

- `source_name`
- `source_type`
- `display_label`
- `date` for market data or `url_or_file_name` for documents

### Retrieval and Citation Rules

- Each chunk stores `source_name`, `source_type`, `document_title`, `section_heading` when available, `published_or_scraped_date`, `url_or_file_name`, and `chunk_id`
- Mixed questions retrieve top relevant document chunks first, then add the latest market snapshot if the query depends on timing or performance
- Final answers may use at most `3 document sources` plus `1 market-data snapshot`
- Key claims should include lightweight inline citations
- Every response ends with a `Sources used` section
- Every investment-related response ends with: `InvestIQ provides educational information only, not financial advice.`

## Implementation Decisions

- V1 will support exactly five live assets and exactly three time windows, with no additions unless ETL, prompts, UI, tests, and compare logic are updated together.
- The product will not answer with personalized recommendations. Advice-adjacent questions will be converted into educational comparisons and contextual summaries.
- Query classification will be deterministic and rules-first in the backend, with optional LLM fallback only when no rule matches confidently.
- Unsupported or low-confidence queries will not be guessed. The assistant will show a short unsupported-query message and the fixed supported-question list.
- Asset comparisons will be based on percentage change over the selected window using each asset's latest available daily close in that window. Raw price levels will not be compared across asset classes.
- Dashboard cards will show current price, percentage change for the selected window, and `Last updated`.
- Compare view will show side-by-side percentage change and normalized daily line charts for live-data assets only.
- Mutual fund handling is educational only in v1. Mutual funds will not appear as live-data chart entities.
- Market-data freshness will be explicit. The frontend and chat responses will display the latest successfully processed timestamp.
- If the newest market snapshot is older than 48 hours, the product will continue serving it with a stale-data warning rather than pretending freshness.
- The backend orchestration layer is the single path to Gemini. The frontend will never call the LLM, Chroma, or GCP bucket directly.
- Cloud Run startup will load vector artifacts from GCP bucket and track a readiness flag before serving retrieval-backed chat responses.
- If Chroma is unavailable, market-data-only queries may still succeed while document and mixed queries return a temporary unavailable message.
- The supported question list will be hardcoded once and reused in backend logic, prompt fallback text, chatbot welcome content, and tests.

## Failure and Degraded-Mode Behavior

- If Cloud Run starts before Chroma is ready, retrieval-backed requests return: `Knowledge base is warming up, please try again in a moment`
- If Chroma fails to load entirely, `document` and `mixed` queries return a temporary unavailable response, while `market-data` queries continue if Gold-layer data is available
- If market data is older than 48 hours, the dashboard shows a stale-data warning and chat answers prepend a caution note
- If ETL fails, GitHub Actions fails loudly and `pipeline_status.json` records `FAILED`
- If retrieval returns weak or insufficient evidence, the assistant says: `I don't have enough information in my current sources to answer that reliably.`
- If classification is uncertain or a question is unsupported, the assistant responds with the supported-question list and invites the user to rephrase
- If a specific external source fails validation during ETL, the overall pipeline run is marked failed and should not be treated as fully fresh

## Golden-Path Demo

1. User opens InvestIQ and lands on the dashboard
2. Dashboard shows the five supported live assets with current price, selected-window percentage change, and `Last updated`
3. User asks a supported chat question such as `How does Gold compare to SPY over 30 days?`
4. Backend classifies the query, retrieves the correct data, and returns a structured cited response
5. Chat answer includes inline citations, a `Sources used` section, and the non-advice disclaimer
6. User opens Compare view and sees normalized comparison lines and side-by-side percentage changes for supported live assets over a supported window

## Acceptance Checklist

- The system answers all seven supported question types using the correct route and evidence type
- The assistant never provides personal financial advice or unsupported recommendations
- Every investment-related answer includes the exact disclaimer text
- Every grounded answer includes inline source citations and a `Sources used` section
- Dashboard shows exactly five live assets: `SPY`, `QQQ`, `AAPL`, `Gold`, and `Silver`
- Dashboard cards show current price, percentage change, and `Last updated`
- Compare view supports only the five live assets and only `7 days`, `30 days`, and `year-to-date`
- Compare view uses normalized percentage-change charts rather than raw-price overlays
- Mutual fund content is available only as educational RAG-backed content, not live comparison data
- Backend returns the structured response contract consistently
- ETL validates all configured sources and writes `pipeline_status.json` on every run
- Stale-data behavior triggers correctly when the latest snapshot is older than 48 hours
- Warm-up and vector-store failure states degrade gracefully without crashing the service
- Unsupported or low-confidence questions return the supported-question fallback instead of speculative answers
- The golden-path demo works end to end on deployed infrastructure

## Testing Decisions

- Good tests should validate observable behavior and contracts rather than internal implementation details.
- The query classifier should be tested with supported phrasing, unsupported phrasing, and ambiguous phrasing to verify deterministic routing and safe fallback behavior.
- The response formatter should be tested for disclaimer inclusion, `Sources used` rendering, inline citation handling, and stale-data warnings.
- The market-data service should be tested for fixed asset coverage, supported window calculations, and percentage-change normalization logic.
- The ETL pipeline should be tested for per-source validation, failure propagation, and `pipeline_status.json` generation.
- Retrieval integration should be tested for metadata completeness, maximum source-count behavior, and low-evidence fallback.
- Backend health behavior should be tested for independent readiness states: `api_up`, `market_data_ready`, `vector_store_ready`, and `llm_config_ready`.
- Frontend tests should focus on rendering the five dashboard cards, supported chart windows, unsupported-query states, stale-data warnings, and chat source lists.

## Non-Goals

- Real financial advice
- User authentication
- Real-time streaming prices
- Sharpe ratio, volatility, drawdown, beta, or alpha
- Multi-user features
- Arbitrary live assets beyond `SPY`, `QQQ`, `AAPL`, `Gold`, and `Silver`
- Arbitrary time ranges beyond `7 days`, `30 days`, and `year-to-date`
- Direct frontend access to LLM, Chroma, or GCP bucket

## Known Risks

1. Cold start risk: Cloud Run plus Chroma warm-up may delay the first retrieval-backed response by 10 to 30 seconds.
2. Data-source fragility: Yahoo Finance, Alpha Vantage, PDF parsing, and scraping can fail independently and break freshness.
3. Classification brittleness: Narrow supported phrasing may cause users to hit unsupported fallbacks more often than expected.
4. RAG citation quality: Trust depends on clean chunking, metadata quality, and disciplined citation rendering.
5. Scope pressure: Building chat, dashboard, and compare view within 24 working hours may force aggressive prioritization.

## Further Notes

- The primary audience is beginner-to-intermediate retail investors, not professional analysts.
- The product should prefer clarity and trust over feature breadth.
- If schedule pressure increases, the first cuts should be: mutual-fund educational comparison panel, LLM fallback for uncertain classification, then `year-to-date` support.
