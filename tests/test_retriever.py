import json

from api import retriever


def test_retrieve_market_data_returns_all_supported_assets_from_local_snapshot(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    gold_dir = tmp_path / "data" / "gold"
    gold_dir.mkdir(parents=True)
    snapshot = {
        "assets": {
            "SPY": {"price": 100, "asset_type": "stock"},
            "QQQ": {"price": 200, "asset_type": "stock"},
            "AAPL": {"price": 300, "asset_type": "stock"},
            "Gold": {"price": 400, "asset_type": "metal"},
            "Silver": {"price": 500, "asset_type": "metal"},
        },
        "updated_at": "2026-04-07T00:00:00Z",
    }
    (gold_dir / "market_snapshot.json").write_text(json.dumps(snapshot))

    result = retriever.retrieve_market_data()

    assert sorted(result["assets"].keys()) == ["AAPL", "Gold", "QQQ", "SPY", "Silver"]


def test_retrieve_market_data_assets_include_required_fields(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    gold_dir = tmp_path / "data" / "gold"
    gold_dir.mkdir(parents=True)
    snapshot = {
        "assets": {
            "SPY": {"price": 100, "asset_type": "stock"},
            "QQQ": {"price": 200, "asset_type": "stock"},
            "AAPL": {"price": 300, "asset_type": "stock"},
            "Gold": {"price": 400, "asset_type": "metal"},
            "Silver": {"price": 500, "asset_type": "metal"},
        },
        "updated_at": "2026-04-07T00:00:00Z",
    }
    (gold_dir / "market_snapshot.json").write_text(json.dumps(snapshot))

    result = retriever.retrieve_market_data()

    for asset in result["assets"].values():
        assert "price" in asset
        assert "asset_type" in asset

    assert result["assets"]["Gold"]["asset_type"] == "metal"
    assert result["assets"]["Silver"]["asset_type"] == "metal"
    assert result["assets"]["SPY"]["asset_type"] == "stock"
    assert result["assets"]["QQQ"]["asset_type"] == "stock"
    assert result["assets"]["AAPL"]["asset_type"] == "stock"
