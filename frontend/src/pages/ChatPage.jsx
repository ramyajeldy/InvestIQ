import { useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const conversationTurns = buildConversationTurns(messages);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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

  return (
    <section className="chat-layout">
      <div className="hero-panel chat-sidebar">
        <p className="eyebrow">Educational AI assistant</p>
        <h1>Ask grounded investment questions with clear sources.</h1>
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
                  <span className="message-role">You</span>
                  <MarkdownContent content={turn.userMessage.answer} />
                </article>
              ) : null}

              {turn.assistantMessage ? (
                <article className="message-bubble assistant answer-bubble">
                  <span className="message-role">InvestIQ</span>
                  <MarkdownContent content={turn.assistantMessage.answer} />

                  {turn.assistantMessage.sources?.length ? (
                    <div className="sources-box">
                      <strong>Sources used</strong>
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

          {isLoading ? <LoadingSpinner label="InvestIQ is preparing a response..." /> : null}
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
