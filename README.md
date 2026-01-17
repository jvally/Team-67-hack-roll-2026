# 📈 StonkGaze

**The most unhinged financial advisor in your browser. No cap.**

A Chrome Extension that finds "investment alpha" in any webpage you visit by using AI to connect real-world content to stock/crypto recommendations.

---

## 🎯 What Does It Do?

When you browse any webpage (news, tweets, blogs), StonkGaze:
1. **Scrapes the text** from the page
2. **Sends it to an AI backend** (GPT-4o)
3. **Returns a stock/crypto recommendation** with clear reasoning

**Example:** Visit a weather article about rain → Get a recommendation for $UBER (people need rides when it rains!)

---

## 🏗️ Project Structure

```
hacknroll67/
├── backend/           # Python FastAPI server
│   ├── main.py        # API endpoints
│   ├── ai_logic.py    # OpenAI integration
│   ├── finance.py     # yfinance market data
│   ├── requirements.txt
│   └── .env           # API keys (create this!)
├── extension/         # Chrome Extension (React + Vite)
│   ├── src/
│   │   ├── sidepanel/ # Side Panel UI
│   │   ├── content/   # Page scraping
│   │   └── background/# API calls
│   ├── dist/          # Built extension (load this in Chrome)
│   └── manifest.json
└── frontend/          # Simple test UI (optional)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- OpenAI API Key

---

## 1️⃣ Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file with your OpenAI key
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# Start the server
python3 -m uvicorn main:app --reload
```

✅ Server runs at **http://localhost:8000**

**Test it:** Open http://localhost:8000/analyze/demo in your browser

---

## 2️⃣ Extension Setup

```bash
# Navigate to extension
cd extension

# Install dependencies
npm install

# Build the extension
npm run build

# Copy manifest to dist
cp manifest.json dist/
```

### Load in Chrome:
1. Open **chrome://extensions**
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked**
4. Select the `extension/dist` folder

---

## 3️⃣ Using the Extension

1. Make sure the **backend is running** (http://localhost:8000)
2. Navigate to any webpage
3. **Click the StonkGaze extension icon** → Open side panel
4. Watch the AI analyze the page and recommend a stock!

**Buttons:**
- **Vibe Check** - Re-analyze current page
- **Demo** - Test with sample data (no page needed)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/analyze/demo` | Demo with sample input |
| POST | `/analyze` | Analyze custom text |
| GET | `/ticker/{symbol}` | Get market data |

### POST /analyze Example:
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"webpage_text": "Breaking: Heavy rain expected in Singapore this weekend"}'
```

### Response:
```json
{
  "success": true,
  "analysis": {
    "ticker": "UBER",
    "action": "BUY",
    "confidence": 85,
    "key_insight": "Rain → people avoid public transport → more ride bookings",
    "reasoning": "Heavy rainfall means everyone calling Ubers instead of getting soaked at the bus stop fr fr 🚀",
    "vibe": "MOONING",
    "meme_caption": "Rainy season is UBER earnings season no cap"
  },
  "market_data": {
    "ticker": "UBER",
    "current_price": 45.23,
    "change_24h_percent": 2.5
  }
}
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.10+, FastAPI, Uvicorn |
| AI | OpenAI GPT-4o-mini |
| Market Data | yfinance |
| Extension | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Extension API | Manifest V3, Side Panel API |

---

## ⚠️ Troubleshooting

### "Extension doesn't show anything"
- Make sure the backend is running at http://localhost:8000
- Rebuild the extension: `npm run build && cp manifest.json dist/`
- Reload the extension in chrome://extensions

### "API error" in extension
- Check that `.env` has your OpenAI API key
- Verify backend is running: http://localhost:8000/

### "uvicorn: command not found"
```bash
python3 -m uvicorn main:app --reload
```

### "npm: permission denied"
```bash
chmod +x node_modules/.bin/*
npm run build
```

---

## 🔐 Environment Variables

Create `backend/.env`:
```
OPENAI_API_KEY=sk-your-openai-key-here
SHEETS_API_URL=your_apps_script_url
SHEETS_API_TOKEN=your_optional_token
```

**Never commit `.env` to git!** (It's already in `.gitignore`)

### Google Sheets Portfolio Backend

If you are using the Google Sheets portfolio database (Apps Script Web App), set:

```
SHEETS_API_URL=your_apps_script_url
SHEETS_API_TOKEN=your_optional_token
```

- `SHEETS_API_URL` is the Web App URL from your Apps Script deployment.
- `SHEETS_API_TOKEN` should match `API_TOKEN` in the Apps Script file (leave empty if not used).

---

## 👥 Team

Built for Hack&Roll 2026 🎉

---

## 📝 License

MIT
