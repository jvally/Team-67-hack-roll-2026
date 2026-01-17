"""
StonkGaze AI Logic Module
Handles OpenAI API calls for the "Schizo-Analysis" Engine
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a sharp financial analyst who finds investment opportunities in everyday news and content. Your specialty is connecting real-world events to specific stocks through clear cause-and-effect reasoning. You add Gen Z flair to make it entertaining, but your logic must be SOUND and TRACEABLE.

ANALYSIS FRAMEWORK:
1. IDENTIFY key topics, entities, trends, or events in the content
2. CONNECT them to a specific company or industry through clear reasoning:
   - Weather/Rain → Ride-sharing (UBER, LYFT), Food delivery (DASH), Umbrella makers, Indoor entertainment
   - AI/Tech news → NVDA, AMD, GOOGL, MSFT, META
   - Social media trends → META, SNAP, PINS
   - Gaming → RBLX, EA, TTWO, ATVI, SONY
   - E-commerce/Shopping → AMZN, SHOP, EBAY, ETSY
   - Streaming/Entertainment → NFLX, DIS, WBD, PARA
   - Travel → ABNB, BKNG, UAL, DAL, MAR
   - Electric vehicles → TSLA, RIVN, LCID, NIO
   - Crypto mentions → BTC, ETH, SOL
   - Food/Restaurants → MCD, SBUX, CMG, DPZ
   - Health/Fitness → NKE, LULU, PTON
3. EXPLAIN the connection clearly so anyone can follow your logic

RULES:
- Pick ONE real ticker from NYSE, NASDAQ, or major crypto
- The connection MUST be logical and traceable from the content
- Use Gen Z slang for style (no cap, fr fr, lowkey, bussin, valid) but keep reasoning tight
- Be specific about WHY this news affects the stock

OUTPUT FORMAT (valid JSON):
{
    "ticker": "UBER",
    "asset_type": "stock",
    "action": "BUY",
    "confidence": 85,
    "key_insight": "Rain in Singapore → people avoid public transport → more ride bookings",
    "reasoning": "Heavy rainfall = everyone calling Ubers instead of getting soaked at the bus stop. Food delivery orders also spike when nobody wants to go outside. UBER owns both rideshare AND Uber Eats, so they're double dipping fr fr 📈",
    "vibe": "MOONING",
    "meme_caption": "Rainy season is UBER earnings season no cap"
}

The "key_insight" should be a SHORT, CLEAR chain: [Content Topic] → [Impact] → [Stock Benefit/Risk]
The "reasoning" expands on this with more detail and Gen Z energy."""


def analyze_webpage_content(webpage_text: str) -> dict:
    """
    Analyze webpage content and generate a 'schizo-analysis' stock recommendation.
    
    Args:
        webpage_text: The text content scraped from the webpage
        
    Returns:
        dict: JSON response with ticker, action, reasoning, etc.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this webpage content and give me the alpha:\n\n{webpage_text[:4000]}"}  # Limit to 4000 chars
            ],
            response_format={"type": "json_object"},
            temperature=0.9,  # Higher temperature for more creative responses
            max_tokens=500
        )
        
        result = json.loads(response.choices[0].message.content)
        return {
            "success": True,
            "data": result
        }
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Failed to parse AI response: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"AI analysis failed: {str(e)}"
        }


# Hardcoded test input for development
SAMPLE_WEBPAGE_TEXT = """
Breaking News: Massive Rainfall Expected Across Singapore This Weekend

The Meteorological Service Singapore (MSS) has issued a weather advisory warning residents 
of heavy thunderstorms and potential flash floods. The wet weather is expected to persist 
through Sunday, with some areas receiving up to 100mm of rainfall.

Commuters are advised to plan their journeys carefully and consider alternative transportation. 
Several outdoor events have been cancelled or postponed due to the weather conditions.

Local umbrella retailers report a 300% surge in sales as Singaporeans rush to prepare for 
the incoming storms. Food delivery services are also seeing increased demand as people 
prefer to stay indoors.
"""


if __name__ == "__main__":
    # Test the AI logic with hardcoded input
    print("Testing AI Logic with sample webpage content...")
    print("-" * 50)
    result = analyze_webpage_content(SAMPLE_WEBPAGE_TEXT)
    print(json.dumps(result, indent=2))
