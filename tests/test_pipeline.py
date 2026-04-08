import json

from etl import pipeline


def test_pipeline_writes_status_file_and_returns_success(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(pipeline, "extract_stocks", lambda: {"SPY": {"price": 1}, "QQQ": {"price": 2}, "AAPL": {"price": 3}})
    monkeypatch.setattr(pipeline, "extract_metals", lambda: {"Gold": {"price": 4}, "Silver": {"price": 5}})
    monkeypatch.setattr(
        pipeline,
        "extract_pdfs",
        lambda: [
            {"title": "a", "text": "x", "source": "pdf"},
            {"title": "b", "text": "x", "source": "pdf"},
            {"title": "c", "text": "x", "source": "pdf"},
        ],
    )
    monkeypatch.setattr(
        pipeline,
        "extract_web",
        lambda: [
            {"title": "w1", "text": "x", "source": "web"},
            {"title": "w2", "text": "x", "source": "web"},
            {"title": "w3", "text": "x", "source": "web"},
        ],
    )
    monkeypatch.setattr(pipeline, "transform_stocks", lambda value: value)
    monkeypatch.setattr(pipeline, "transform_metals", lambda value: value)
    monkeypatch.setattr(pipeline, "transform_documents", lambda value: [{"chunk_id": "1"}])
    monkeypatch.setattr(pipeline, "load_bronze", lambda *args, **kwargs: None)
    monkeypatch.setattr(pipeline, "load_silver", lambda *args, **kwargs: None)
    monkeypatch.setattr(pipeline, "load_gold", lambda *args, **kwargs: None)

    written_status = {}
    monkeypatch.setattr(
        pipeline,
        "write_pipeline_status",
        lambda status, source_results: written_status.update(
            {"status": status, "source_results": source_results}
        ),
    )

    result = pipeline.run_pipeline()

    assert result == "SUCCESS"
    assert written_status["status"] == "SUCCESS"

    status_file = tmp_path / "pipeline_status.json"
    assert status_file.exists()
    payload = json.loads(status_file.read_text())
    assert payload["status"] == "SUCCESS"
    assert "alpha_vantage" in payload["sources"]


def test_pipeline_returns_partial_when_some_sources_fail(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(
        pipeline,
        "extract_stocks",
        lambda: {"SPY": {"price": 1}, "QQQ": None, "AAPL": {"price": 3}},
    )
    monkeypatch.setattr(pipeline, "extract_metals", lambda: {"Gold": {"price": 4}, "Silver": {"price": 5}})
    monkeypatch.setattr(
        pipeline,
        "extract_pdfs",
        lambda: [
            {"title": "a", "text": "x", "source": "pdf"},
            {"title": "b", "text": "x", "source": "pdf"},
        ],
    )
    monkeypatch.setattr(
        pipeline,
        "extract_web",
        lambda: [
            {"title": "w1", "text": "x", "source": "web"},
            {"title": "w2", "text": "x", "source": "web"},
            {"title": "w3", "text": "x", "source": "web"},
        ],
    )
    monkeypatch.setattr(pipeline, "transform_stocks", lambda value: value)
    monkeypatch.setattr(pipeline, "transform_metals", lambda value: value)
    monkeypatch.setattr(pipeline, "transform_documents", lambda value: [{"chunk_id": "1"}])
    monkeypatch.setattr(pipeline, "load_bronze", lambda *args, **kwargs: None)
    monkeypatch.setattr(pipeline, "load_silver", lambda *args, **kwargs: None)
    monkeypatch.setattr(pipeline, "load_gold", lambda *args, **kwargs: None)
    monkeypatch.setattr(pipeline, "write_pipeline_status", lambda *args, **kwargs: None)

    result = pipeline.run_pipeline()

    assert result == "PARTIAL"
    payload = json.loads((tmp_path / "pipeline_status.json").read_text())
    assert payload["status"] == "PARTIAL"


