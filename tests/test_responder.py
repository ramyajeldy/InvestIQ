from api import config, responder


def test_supported_list_returns_all_supported_questions():
    result = responder.respond("What questions are supported?", "supported_list", [], {})

    assert result["route"] == "supported_list"
    for question in config.SUPPORTED_QUESTIONS:
        assert question in result["answer"]


def test_unsupported_route_returns_supported_question_list():
    result = responder.respond("Tell me about crypto", "unsupported", [], {})

    assert "That's outside what I currently support." in result["answer"]
    for question in config.SUPPORTED_QUESTIONS:
        assert question in result["answer"]


def test_empty_context_returns_not_enough_information_with_disclaimer():
    result = responder.respond("How does SPY compare to Gold?", "mixed", [], {})

    assert "I don't have enough information in my current sources to answer that reliably." in result["answer"]
    assert config.DISCLAIMER in result["answer"]
    assert result["sources"] == []


def test_investment_response_appends_disclaimer(monkeypatch):
    monkeypatch.setattr(responder, "call_gemini", lambda prompt: "Grounded answer")

    chunks = [
        {
            "text": "Market outlook text",
            "metadata": {"title": "BlackRock Investment Outlook 2026", "source": "pdf"},
        }
    ]

    result = responder.respond("What is the market outlook for 2026?", "document", chunks, {})

    assert result["answer"].startswith("Grounded answer")
    assert result["answer"].endswith(config.DISCLAIMER)
    assert result["sources"] == ["BlackRock Investment Outlook 2026"]

