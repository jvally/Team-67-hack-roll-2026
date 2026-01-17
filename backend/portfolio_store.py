import os
import requests

API_URL = os.getenv("SHEETS_API_URL", "")
API_TOKEN = os.getenv("SHEETS_API_TOKEN", "")


def _ensure_config():
    if not API_URL:
        raise RuntimeError("SHEETS_API_URL is not set")


def _post(payload: dict):
    _ensure_config()
    if API_TOKEN:
        payload["token"] = API_TOKEN
    resp = requests.post(API_URL, json=payload, timeout=15)
    resp.raise_for_status()
    return resp.json()


def _get(params: dict):
    _ensure_config()
    if API_TOKEN:
        params["token"] = API_TOKEN
    resp = requests.get(API_URL, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def init_user(user_id: str, username: str):
    return _post({"action": "user/init", "user_id": user_id, "username": username})


def get_portfolio(user_id: str):
    return _get({"action": "portfolio", "user_id": user_id})


def trade(user_id: str, ticker: str, side: str, qty: float, price: float):
    return _post({
        "action": "trade",
        "user_id": user_id,
        "ticker": ticker,
        "side": side,
        "qty": qty,
        "price": price
    })


def leaderboard(limit: int = 10):
    return _get({"action": "leaderboard", "limit": limit})
