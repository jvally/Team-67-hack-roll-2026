"""
StonkGaze FastAPI Backend
The most unhinged financial advisor API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from ai_logic import analyze_webpage_content, SAMPLE_WEBPAGE_TEXT
from finance import get_ticker_data, validate_ticker


app = FastAPI(
    title="StonkGaze API",
    description="The most unhinged financial advisor in your browser. No cap.",
    version="1.0.0"
)

# Enable CORS for the Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class AnalysisRequest(BaseModel):
    webpage_text: str
    url: Optional[str] = None


class AnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[dict] = None
    market_data: Optional[dict] = None
    error: Optional[str] = None


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "vibing",
        "message": "StonkGaze API is running fr fr 🚀",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "ai_engine": "ready",
        "market_connector": "ready"
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_content(request: AnalysisRequest):
    """
    Main endpoint: Analyze webpage content and return stock recommendation.
    
    Takes webpage text, generates AI analysis, and fetches real market data.
    """
    if not request.webpage_text or len(request.webpage_text.strip()) < 50:
        raise HTTPException(
            status_code=400, 
            detail="Webpage text too short. Need at least 50 characters of content, no cap."
        )
    
    # Step 1: Get AI analysis
    ai_result = analyze_webpage_content(request.webpage_text)
    
    if not ai_result["success"]:
        return AnalysisResponse(
            success=False,
            error=ai_result.get("error", "AI analysis failed")
        )
    
    analysis_data = ai_result["data"]
    ticker = analysis_data.get("ticker", "")
    asset_type = analysis_data.get("asset_type", "stock")
    
    # Step 2: Fetch real market data for the ticker
    market_result = get_ticker_data(ticker, asset_type)
    
    if not market_result["success"]:
        # Still return the analysis, just without market data
        return AnalysisResponse(
            success=True,
            analysis=analysis_data,
            market_data=None,
            error=f"Warning: Could not fetch market data - {market_result.get('error')}"
        )
    
    return AnalysisResponse(
        success=True,
        analysis=analysis_data,
        market_data=market_result["data"]
    )


@app.get("/analyze/demo")
async def demo_analysis():
    """
    Demo endpoint with hardcoded sample input.
    Perfect for testing without the Chrome extension.
    """
    # Use hardcoded sample text
    ai_result = analyze_webpage_content(SAMPLE_WEBPAGE_TEXT)
    
    if not ai_result["success"]:
        return {
            "success": False,
            "error": ai_result.get("error"),
            "sample_input": SAMPLE_WEBPAGE_TEXT[:200] + "..."
        }
    
    analysis_data = ai_result["data"]
    ticker = analysis_data.get("ticker", "")
    asset_type = analysis_data.get("asset_type", "stock")
    
    # Fetch market data
    market_result = get_ticker_data(ticker, asset_type)
    
    return {
        "success": True,
        "sample_input_preview": SAMPLE_WEBPAGE_TEXT[:200] + "...",
        "analysis": analysis_data,
        "market_data": market_result.get("data") if market_result["success"] else None
    }


@app.get("/ticker/{ticker}")
async def get_ticker_info(ticker: str, asset_type: str = "stock"):
    """
    Get market data for a specific ticker.
    
    Args:
        ticker: Stock or crypto symbol (e.g., AAPL, BTC)
        asset_type: Either 'stock' or 'crypto'
    """
    result = get_ticker_data(ticker.upper(), asset_type)
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
