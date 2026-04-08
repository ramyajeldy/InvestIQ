import { useState } from "react";
import { Link } from "react-router-dom";

const learnCards = [
  {
    id: "spy",
    ticker: "SPY",
    title: "SPY",
    subtitle: "A broad-market ETF tied to the S&P 500",
    whatItIs:
      "SPY is an exchange-traded fund that tracks the S&P 500, which means one investment gives you exposure to 500 large U.S. companies across many industries.",
    analogy:
      "Think of SPY like a pizza with 500 slices, where each slice is a big company in the U.S. market.",
    whyPeopleInvest:
      "People often use SPY as a core long-term holding because it spreads risk across many companies and gives a simple way to follow the overall U.S. stock market.",
    facts: [
      { label: "Tracks", value: "S&P 500" },
      { label: "Companies", value: "500 large U.S. companies" },
      { label: "Risk", value: "Medium" },
      { label: "Beginner fit", value: "Often a strong starting point" },
    ],
    prompts: [
      "How does SPY compare to QQQ over 30 days?",
      "Give me an educational comparison of SPY vs Gold",
      "What questions are supported?",
    ],
  },
  {
    id: "qqq",
    ticker: "QQQ",
    title: "QQQ",
    subtitle: "A tech-heavy ETF tied to the Nasdaq-100",
    whatItIs:
      "QQQ is an ETF that tracks the Nasdaq-100, a group of large non-financial companies with a strong tilt toward technology and growth-oriented businesses.",
    analogy:
      "QQQ is like SPY, but the spicy tech version with more concentration in fast-growing companies.",
    whyPeopleInvest:
      "Investors often choose QQQ when they want more exposure to technology leaders and are comfortable with bigger swings than a broad-market fund might have.",
    facts: [
      { label: "Tracks", value: "Nasdaq-100" },
      { label: "Style", value: "Tech-heavy growth focus" },
      { label: "Risk", value: "Medium-high" },
      { label: "Best for", value: "Investors seeking growth exposure" },
    ],
    prompts: [
      "How does QQQ compare to SPY over 7 days?",
      "Give me an educational comparison of QQQ vs AAPL",
      "Is gold a good hedge against inflation?",
    ],
  },
  {
    id: "aapl",
    ticker: "AAPL",
    title: "AAPL",
    subtitle: "A single stock representing Apple Inc.",
    whatItIs:
      "AAPL is the stock of Apple Inc. Buying it means you are investing in one company rather than a basket of many companies.",
    analogy:
      "AAPL is like betting on one horse instead of owning a whole stable.",
    whyPeopleInvest:
      "Some investors buy AAPL because they believe in Apple's business strength, products, and long-term growth potential, but it comes with more company-specific risk than an ETF.",
    facts: [
      { label: "Type", value: "Single stock" },
      { label: "Company", value: "Apple Inc." },
      { label: "Risk", value: "Higher than broad ETFs" },
      { label: "Diversification", value: "Low on its own" },
    ],
    prompts: [
      "How does AAPL compare to SPY over year-to-date?",
      "Give me an educational comparison of AAPL vs QQQ",
      "What are low-risk investment options?",
    ],
  },
];

const comparisonRows = [
  {
    label: "Type",
    values: {
      SPY: "ETF",
      QQQ: "ETF",
      AAPL: "Single stock",
    },
  },
  {
    label: "Diversification",
    values: {
      SPY: "High",
      QQQ: "Medium",
      AAPL: "Low",
    },
  },
  {
    label: "Risk",
    values: {
      SPY: "Medium",
      QQQ: "Medium-high",
      AAPL: "Higher",
    },
  },
  {
    label: "Best for",
    values: {
      SPY: "Broad market beginners",
      QQQ: "Tech-focused growth seekers",
      AAPL: "Investors researching one company",
    },
  },
];

function LearnAccordionCard({ card, isOpen, onToggle }) {
  return (
    <article className={`learn-card ${isOpen ? "open" : ""}`}>
      <button
        type="button"
        className="learn-card-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div>
          <p className="eyebrow">{card.ticker}</p>
          <h2>{card.title}</h2>
          <p className="learn-card-subtitle">{card.subtitle}</p>
        </div>
        <span className="learn-card-icon" aria-hidden="true">
          {isOpen ? "-" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div className="learn-card-body">
          <div className="learn-copy-grid">
            <section className="learn-copy-block">
              <h3>What it is</h3>
              <p>{card.whatItIs}</p>
            </section>
            <section className="learn-copy-block">
              <h3>Simple analogy</h3>
              <p>{card.analogy}</p>
            </section>
            <section className="learn-copy-block">
              <h3>Why people invest</h3>
              <p>{card.whyPeopleInvest}</p>
            </section>
          </div>

          <section className="learn-facts">
            <h3>Key facts</h3>
            <div className="learn-facts-grid">
              {card.facts.map((fact) => (
                <div key={fact.label} className="learn-fact-tile">
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="learn-prompts">
            <h3>Suggested questions for Chat</h3>
            <div className="question-chip-row">
              {card.prompts.map((prompt) => (
                <Link
                  key={prompt}
                  to="/"
                  className="question-chip learn-question-link"
                >
                  {prompt}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}

function LearnPage() {
  const [openCard, setOpenCard] = useState("spy");

  return (
    <div className="page-content learn-layout">
      <section className="hero-panel learn-hero">
        <div className="page-heading learn-heading">
          <div>
            <p className="eyebrow">Learn</p>
            <h1>Learn the Basics</h1>
            <p className="hero-copy">
              Build confidence with simple explanations of the core assets you
              can explore in InvestIQ before you start asking deeper questions.
            </p>
          </div>
        </div>

        <div className="learn-intro-grid">
          <div className="insight-card learn-intro-card">
            <h2>What InvestIQ does</h2>
            <p>
              InvestIQ is an educational investment research assistant designed
              to help you compare a small set of supported assets, understand
              core concepts, and ask grounded questions about market context.
            </p>
          </div>
          <div className="insight-card learn-intro-card">
            <h2>How it works</h2>
            <p>
              The app combines retrieval-augmented generation (RAG) with Gemini
              to answer from curated documents and structured market data, so
              responses stay tied to known sources instead of unsupported
              guesses.
            </p>
          </div>
        </div>
      </section>

      <section className="learn-section">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Instruments</p>
            <h2>Understand SPY, QQQ, and AAPL</h2>
          </div>
        </div>

        <div className="learn-accordion">
          {learnCards.map((card) => (
            <LearnAccordionCard
              key={card.id}
              card={card}
              isOpen={openCard === card.id}
              onToggle={() =>
                setOpenCard((current) => (current === card.id ? "" : card.id))
              }
            />
          ))}
        </div>
      </section>

      <section className="chart-card learn-table-card">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Quick Compare</p>
            <h2>SPY vs QQQ vs AAPL</h2>
          </div>
        </div>

        <div className="learn-table-wrap">
          <table className="learn-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>SPY</th>
                <th>QQQ</th>
                <th>AAPL</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  <td>{row.values.SPY}</td>
                  <td>{row.values.QQQ}</td>
                  <td>{row.values.AAPL}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hero-panel learn-cta">
        <p className="eyebrow">Next Step</p>
        <h2>Ready to explore with real questions?</h2>
        <p className="hero-copy">
          Head over to the Chat tab and ask for a comparison, a beginner
          explanation, or a market outlook answer grounded in InvestIQ's
          supported sources.
        </p>
        <div className="question-chip-row">
          <Link to="/" className="question-chip learn-question-link">
            Go to Chat
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LearnPage;
