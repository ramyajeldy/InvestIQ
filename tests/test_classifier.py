from api import classifier


def test_supported_list_routes_correctly():
    result = classifier.classify_question("What questions are supported?")

    assert result["route"] == "supported_list"
    assert result["assets"] == []
    assert result["window"] is None


def test_market_data_question_detects_assets_and_window():
    result = classifier.classify_question("SPY vs Gold over 7 days")

    assert result["route"] == "mixed"
    assert result["assets"] == ["SPY", "Gold"]
    assert result["window"] == "7 days"


def test_document_question_routes_correctly():
    result = classifier.classify_question("What is a mutual fund and how does it work?")

    assert result["route"] == "document"
    assert result["assets"] == []
    assert result["window"] is None


def test_portfolio_diversification_question_routes_correctly(monkeypatch):
    monkeypatch.setattr(
        classifier,
        "llm_fallback_classify",
        lambda question: {
            "route": "unsupported",
            "confidence": "llm",
            "assets": [],
            "window": None,
        },
    )

    result = classifier.classify_question("What is portfolio diversification and why does it matter?")

    assert result["route"] == "document"
    assert result["assets"] == []
    assert result["window"] is None


def test_market_data_only_question_routes_correctly():
    result = classifier.classify_question("Show AAPL performance for 30 days")

    assert result["route"] == "market_data"
    assert result["assets"] == ["AAPL"]
    assert result["window"] == "30 days"


def test_year_to_date_window_is_detected():
    result = classifier.classify_question("Compare QQQ and Silver year-to-date")

    assert result["window"] == "year-to-date"
    assert result["assets"] == ["QQQ", "Silver"]


def test_unsupported_question_uses_llm_fallback(monkeypatch):
    called = {}

    def fake_fallback(question):
      called["question"] = question
      return {
          "route": "unsupported",
          "confidence": "llm",
          "assets": [],
          "window": None,
      }

    monkeypatch.setattr(classifier, "llm_fallback_classify", fake_fallback)

    result = classifier.classify_question("What is the weather in Toronto today?")

    assert called["question"] == "What is the weather in Toronto today?"
    assert result["route"] == "unsupported"
    assert result["confidence"] == "llm"


def test_long_term_spy_investment_question_is_not_unsupported(monkeypatch):
    monkeypatch.setattr(
        classifier,
        "llm_fallback_classify",
        lambda question: {
            "route": "unsupported",
            "confidence": "llm",
            "assets": [],
            "window": None,
        },
    )

    result = classifier.classify_question("Is SPY a good long-term investment?")

    assert result["route"] != "unsupported"


def test_dollar_cost_averaging_routes_to_document(monkeypatch):
    monkeypatch.setattr(
        classifier,
        "llm_fallback_classify",
        lambda question: {
            "route": "unsupported",
            "confidence": "llm",
            "assets": [],
            "window": None,
        },
    )

    result = classifier.classify_question("What is dollar cost averaging?")

    assert result["route"] == "document"


def test_should_i_invest_in_qqq_is_not_unsupported(monkeypatch):
    monkeypatch.setattr(
        classifier,
        "llm_fallback_classify",
        lambda question: {
            "route": "unsupported",
            "confidence": "llm",
            "assets": [],
            "window": None,
        },
    )

    result = classifier.classify_question("Should I invest in QQQ?")

    assert result["route"] != "unsupported"


def test_compound_interest_routes_to_document(monkeypatch):
    monkeypatch.setattr(
        classifier,
        "llm_fallback_classify",
        lambda question: {
            "route": "unsupported",
            "confidence": "llm",
            "assets": [],
            "window": None,
        },
    )

    result = classifier.classify_question("What is compound interest?")

    assert result["route"] == "document"


def test_weather_question_stays_unsupported(monkeypatch):
    monkeypatch.setattr(
        classifier,
        "llm_fallback_classify",
        lambda question: {
            "route": "unsupported",
            "confidence": "llm",
            "assets": [],
            "window": None,
        },
    )

    result = classifier.classify_question("What is the weather today?")

    assert result["route"] == "unsupported"
