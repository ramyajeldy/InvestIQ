import { useEffect, useRef, useState } from "react";
import {
  FiCpu,
  FiLink2,
  FiMessageSquare,
  FiUser,
} from "react-icons/fi";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import MarkdownContent from "../components/MarkdownContent.jsx";
import QuestionChips from "../components/QuestionChips.jsx";
import { postChatQuestion } from "../services/api.js";

const initialMessage = {
  id: "welcome",
  role: "assistant",
  answer: "What questions are supported?",
  sources: [],
  route: "supported_list",
};

const sampleQuestions = [
  "What is the market outlook for 2026?",
  "Is SPY a good long-term investment?",
  "What is dollar cost averaging?",
  "How does QQQ compare to SPY?",
  "What is a mutual fund and how does it work?",
  "Is gold a good hedge against inflation?",
  "What are low-risk investment options for beginners?",
  "How does compound interest work?",
];

const loadingTips = [
  {
    label: "Quick tip",
    copy: "ETFs like SPY spread your money across many companies, which can reduce single-company risk for beginners.",
  },
  {
    label: "Pattern to notice",
    copy: "Gold often gets attention when investors feel cautious, while growth assets tend to lead when confidence is stronger.",
  },
  {
    label: "Beginner lens",
    copy: "Percentage change usually tells a clearer story than raw price when you compare different kinds of assets.",
  },
  {
    label: "Habit builder",
    copy: "Dollar-cost averaging means investing on a schedule, so you build consistency instead of trying to time every move.",
  },
  {
    label: "Compare smarter",
    copy: "A single stock like AAPL can move faster than an ETF, but it also carries more company-specific risk.",
  },
];

function getSourceUrl(source) {
  const normalized = source.toLowerCase();

  if (normalized.includes("blackrock")) {
    return "https://www.blackrock.com/us/individual/insights/blackrock-investment-institute/outlook";
  }

  if (normalized.includes("gold demand")) {
    return "https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2024";
  }

  if (normalized.includes("vanguard")) {
    return "https://investor.vanguard.com/investor-resources-education/mutual-funds";
  }

  if (normalized.includes("mutual fund")) {
    return "https://en.wikipedia.org/wiki/Mutual_fund";
  }

  if (normalized.includes("gold as an investment") || normalized.includes("gold")) {
    return "https://en.wikipedia.org/wiki/Gold_as_an_investment";
  }

  if (normalized.includes("stocks") || normalized.includes("investor.gov")) {
    return "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks";
  }

  if (normalized.includes("alpha vantage") || normalized.includes("market data")) {
    return "https://www.alphavantage.co";
  }

  return null;
}

function buildConversationTurns(messages) {
  const turns = [];

  messages.forEach((message) => {
    if (message.role === "user") {
      turns.push({
        id: `${message.id}-turn`,
        userMessage: message,
        assistantMessage: null,
      });
      return;
    }

    const lastTurn = turns[turns.length - 1];

    if (lastTurn && lastTurn.userMessage && !lastTurn.assistantMessage) {
      lastTurn.assistantMessage = message;
      return;
    }

    turns.push({
      id: `${message.id}-turn`,
      userMessage: null,
      assistantMessage: message,
    });
  });

  return turns;
}

function ChatPage() {
  const [messages, setMessages] = useState([initialMessage]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const conversationTurns = buildConversationTurns(messages);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setActiveTipIndex(0);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveTipIndex((current) => (current + 1) % loadingTips.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  async function submitQuestion(nextQuestion) {
    const trimmed = nextQuestion.trim();

    if (!trimmed || isLoading) {
      return;
    }

    setError("");
    setQuestion("");
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: "user", answer: trimmed, sources: [] },
    ]);
    setIsLoading(true);

    let response;

    try {
      response = await postChatQuestion(trimmed);
    } catch {
      setError("The assistant could not respond right now. Please try again.");
      setIsLoading(false);
      return;
    }

    const hasAnswer = typeof response?.answer === "string";
    const assistantAnswer = hasAnswer
      ? response.route === "warming_up"
        ? "The knowledge base is warming up. Give it a moment and try again."
        : response.answer
      : "The assistant returned an empty response.";

    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        answer: assistantAnswer,
        sources: Array.isArray(response?.sources) ? response.sources : [],
        route: response?.route || "unknown",
      },
    ]);
    setIsLoading(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitQuestion(question);
  }

  function handleQuestionChipSelect(selectedQuestion) {
    submitQuestion(selectedQuestion);
  }

  const activeLoadingTip = loadingTips[activeTipIndex];

  return (
    <section className="chat-layout">
      <div className="hero-panel chat-sidebar">
        <p className="eyebrow">Educational AI assistant</p>
        <h1 className="icon-heading">
          <span className="title-icon" aria-hidden="true">
            <FiMessageSquare />
          </span>
          <span>Ask grounded investment questions with clear sources.</span>
        </h1>
        <p className="hero-copy">
          InvestIQ compares a focused set of market assets and curated investment
          sources, then responds with educational answers backed by your running backend.
        </p>
        <QuestionChips questions={sampleQuestions} onSelect={handleQuestionChipSelect} />
        <p className="chat-sidebar-disclaimer">
          {"\u{1F4CB}"} For educational purposes only. Not financial advice.
        </p>
      </div>

      <div className="chat-panel">
        <div className="chat-feed" ref={scrollRef}>
          {conversationTurns.map((turn) => (
            <div key={turn.id}>
              {turn.userMessage ? (
                <article className="message-bubble user">
                  <span className="message-role icon-label">
                    <FiUser aria-hidden="true" />
                    <span>You</span>
                  </span>
                  <MarkdownContent content={turn.userMessage.answer} />
                </article>
              ) : null}

              {turn.assistantMessage ? (
                <article className="message-bubble assistant answer-bubble">
                  <span className="message-role icon-label">
                    <FiCpu aria-hidden="true" />
                    <span>InvestIQ</span>
                  </span>
                  <MarkdownContent content={turn.assistantMessage.answer} />

                  {turn.assistantMessage.sources?.length ? (
                    <div className="sources-box">
                      <strong className="icon-subtitle">
                        <FiLink2 aria-hidden="true" />
                        <span>Sources used</span>
                      </strong>
                      <ul>
                        {turn.assistantMessage.sources.map((source) => (
                          <li key={`${turn.assistantMessage.id}-${source}`}>
                            {getSourceUrl(source) ? (
                              <a href={getSourceUrl(source)} target="_blank" rel="noreferrer">
                                {source}
                              </a>
                            ) : (
                              source
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <p className="disclaimer">
                    InvestIQ provides educational information only, not financial advice.
                  </p>
                </article>
              ) : null}
            </div>
          ))}

          {isLoading ? (
            <div className="loading-row" aria-live="polite">
              <LoadingSpinner label="InvestIQ is preparing a response..." />
              <div className="loading-tip-card">
                <p className="loading-tip-label">{activeLoadingTip.label}</p>
                <p className="loading-tip-copy">{activeLoadingTip.copy}</p>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a supported investment question..."
            aria-label="Chat question input"
          />
          <button type="submit" disabled={isLoading || !question.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

export default ChatPage;
