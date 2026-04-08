import json
import os

from api.config import GCP_BUCKET_NAME
from api.startup import get_gcp_client


def load_market_snapshot() -> dict:
    gold_path = "data/gold/market_snapshot.json"

    if os.path.exists(gold_path):
        with open(gold_path, "r") as file_handle:
            return json.load(file_handle)

    client = get_gcp_client()
    bucket = client.bucket(GCP_BUCKET_NAME)
    blob = bucket.blob("gold/market_snapshot.json")
    return json.loads(blob.download_as_text())


def filter_snapshot_assets(snapshot: dict, assets: list | None = None) -> dict:
    all_assets = snapshot.get("assets", {})

    if not assets:
        return snapshot

    filtered_assets = {name: data for name, data in all_assets.items() if name in assets}
    return {
        "assets": filtered_assets,
        "updated_at": snapshot.get("updated_at"),
    }


def resolve_window_change(asset: dict, window: str) -> object:
    if window == "7d":
        return asset.get("change_7d") or asset.get("change_percent", 0)
    if window == "30d":
        return asset.get("change_30d") or asset.get("change_percent", 0)
    if window == "ytd":
        return asset.get("change_ytd") or asset.get("change_percent", 0)
    return asset.get("change_7d") or asset.get("change_percent", 0)


def build_market_snapshot_response(snapshot: dict, window: str) -> dict:
    assets = snapshot.get("assets", {})
    result = {}

    for name, asset in assets.items():
        if asset is None:
            continue

        result[name] = {
            "symbol": asset.get("symbol", name),
            "name": name,
            "price": asset.get("price"),
            "change": resolve_window_change(asset, window),
            "change_7d": asset.get("change_7d"),
            "change_30d": asset.get("change_30d"),
            "change_ytd": asset.get("change_ytd"),
            "history": asset.get("history", {}),
            "latest_trading_day": asset.get("latest_trading_day") or asset.get("transformed_at"),
            "asset_type": asset.get("asset_type"),
            "updated_at": snapshot.get("updated_at"),
        }

    return {
        "assets": result,
        "window": window,
        "updated_at": snapshot.get("updated_at"),
    }
