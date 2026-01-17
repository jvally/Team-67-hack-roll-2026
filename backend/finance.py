"""
StonkGaze Finance Module
Handles market data fetching via yfinance
"""

import yfinance as yf
from datetime import datetime, timedelta
from typing import Optional


def get_ticker_data(ticker: str, asset_type: str = "stock") -> dict:
    """
    Fetch real-time and historical price data for a ticker.
    
    Args:
        ticker: Stock or crypto ticker symbol (e.g., "AAPL", "BTC-USD")
        asset_type: Either "stock" or "crypto"
        
    Returns:
        dict: Price data including current price, 24h change, and historical data
    """
    try:
        # For crypto, ensure proper format
        if asset_type == "crypto" and not ticker.endswith("-USD"):
            ticker = f"{ticker}-USD"
        
        stock = yf.Ticker(ticker)
        
        # Get current price info
        info = stock.info
        current_price = info.get("regularMarketPrice") or info.get("currentPrice", 0)
        previous_close = info.get("regularMarketPreviousClose") or info.get("previousClose", 0)
        
        # Calculate 24h change
        if previous_close and previous_close > 0:
            change_24h = ((current_price - previous_close) / previous_close) * 100
        else:
            change_24h = 0
        
        # Get 7-day historical data for the chart
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        history = stock.history(start=start_date, end=end_date)
        
        # Convert to list of price points
        price_history = []
        for index, row in history.iterrows():
            price_history.append({
                "timestamp": index.isoformat(),
                "price": round(row["Close"], 2)
            })
        
        return {
            "success": True,
            "data": {
                "ticker": ticker,
                "name": info.get("shortName", ticker),
                "current_price": round(current_price, 2),
                "previous_close": round(previous_close, 2),
                "change_24h_percent": round(change_24h, 2),
                "market_cap": info.get("marketCap"),
                "volume": info.get("volume"),
                "price_history": price_history,
                "currency": info.get("currency", "USD")
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to fetch data for {ticker}: {str(e)}"
        }


def validate_ticker(ticker: str) -> bool:
    """
    Check if a ticker symbol is valid and has data available.
    
    Args:
        ticker: The ticker symbol to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        return info.get("regularMarketPrice") is not None or info.get("currentPrice") is not None
    except:
        return False


if __name__ == "__main__":
    # Test the finance module
    import json
    
    print("Testing Finance Module...")
    print("-" * 50)
    
    # Test stock
    print("\n📈 Testing AAPL:")
    result = get_ticker_data("AAPL", "stock")
    print(json.dumps(result, indent=2, default=str))
    
    # Test crypto
    print("\n₿ Testing BTC:")
    result = get_ticker_data("BTC", "crypto")
    print(json.dumps(result, indent=2, default=str))
