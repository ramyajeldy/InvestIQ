import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import MarkdownContent from "../components/MarkdownContent.jsx";
import QuestionChips from "../components/QuestionChips.jsx";
import { fetchSupportedQuestions, postChatQuestion } from "../services/api.js";

const initialMessage = {
  id: "welcome",
  role: "assistant",
  answer: "What questions are supported?",
  sources: [],
  route: "supported_list",
};

function ChatPage() {
  const [messages, setMessages] = useState([initialMessage]);
  const [question, setQuestion] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    async function loadSupportedQuestions() {
      try {
        const data = await fetchSupportedQuestions();
        setSuggestedQuestions(data.questions || []);
      } catch {
        setError("Unable to load supported questions right now.");
      }
    }

    loadSupportedQuestions();
  }, []);

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

  return (
    <section className="chat-layout">
      <div className="hero-panel">
        <p className="eyebrow">Educational AI assistant</p>
        <h1>Ask grounded investment questions with clear sources.</h1>
        <p className="hero-copy">
          InvestIQ compares a focused set of market assets and curated investment
          sources, then responds with educational answers backed by your running backend.
        </p>
        <QuestionChips questions={suggestedQuestions} onSelect={submitQuestion} />
      </div>

      <div className="chat-panel">
        <div className="chat-feed" ref={scrollRef}>
          {messages.map((message) => (
            <article
              key={message.id}
              className={`message-bubble ${message.role === "user" ? "user" : "assistant"}`}
            >
              <span className="message-role">
                {message.role === "user" ? "You" : "InvestIQ"}
              </span>

              <MarkdownContent content={message.answer} />

              {message.role === "assistant" && message.sources?.length ? (
                <div className="sources-box">
                  <strong>Sources used</strong>
                  <ul>
                    {message.sources.map((source) => (
                      <li key={`${message.id}-${source}`}>{source}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {message.role === "assistant" ? (
                <p className="disclaimer">
                  InvestIQ provides educational information only, not financial advice.
                </p>
              ) : null}
            </article>
          ))}

          {isLoading ? <LoadingSpinner label="InvestIQ is preparing a response..." /> : null}
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
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
