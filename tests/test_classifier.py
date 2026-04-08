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

