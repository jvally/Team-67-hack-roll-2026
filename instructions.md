# 📝 INSTRUCTIONS.md

## 🚀 Project Name: StonkGaze

**Tagline:** The most unhinged financial advisor in your browser. No cap.

---

## 📌 Project Overview

StonkGaze is a **Chrome Extension** that transforms any webpage into a wild, far-fetched financial investment opportunity. Using a persistent **Side Panel UI**, it scrapes content from the user's active tab, uses AI to make "schizo-logical" leaps to a stock or crypto ticker, and presents the "Alpha" using Gen Z slang, memes, and technical-looking (but meaningless) charts.

---

## 🛠 Tech Stack

| Component       | Technology                                  |
|-----------------|---------------------------------------------|
| Frontend        | React 18, Tailwind CSS, Vite                |
| Charts          | Chart.js / Recharts                         |
| Extension API   | Manifest V3 (Side Panel API)                |
| Backend         | Python 3.10+, FastAPI                       |
| AI Engine       | OpenAI API (GPT-4o / GPT-4o-mini)           |
| Market Data     | Alpha Vantage / Yahoo Finance (via yfinance)|

---

## 🏗 System Architecture

1. **Content Script:** Monitors the DOM and extracts `innerText`.
2. **Side Panel (React):** The persistent UI on the right. It receives data from the background script.
3. **FastAPI Backend:**
   - **Inference Engine:** Takes website text → Extracts a relevant (or hilarious) ticker.
   - **Market Connector:** Fetches real price data for that ticker.
   - **Slang Processor:** Generates the "Troll" analysis.
4. **OpenAI:** Used for both entity extraction and creative writing (the "Troll" persona).

---

## ✨ Features & Requirements

### 1. The "Schizo-Analysis" Engine

- **Logical Leaps:** If a news article mentions "Rain in London," the AI should suggest buying `$UBER` (people need rides) or `$TSLA` (wipers?).
- **Tone:** High-energy, unhinged, Gen Z slang. Use terms like:
  - Cooked
  - No Cap
  - Fr Fr
  - Massive L
  - Secure the Bag
  - Alpha
  - Delulu

### 2. Side Panel UI (React + Tailwind)

- **The Ticker:** Large flashing ticker (e.g., `$AAPL`).
- **The Vibe Check:** A color-coded sentiment bar (Neon Green for "Mooning," Neon Red for "It's Over").
- **The Chart:** A line chart showing the last 24h of price action, overlaid with random emojis (🚀, 💎, 📉).
- **Meme Box:** A dedicated area for a randomly selected "Stonk" meme.

### 3. Automated Triggers

The extension should refresh its analysis every time the user navigates to a new URL or clicks a **"Vibe Check"** button.

---

## 📂 Repository Structure

```
/stonkgaze-root
├── /extension            # React + Vite + Tailwind
│   ├── manifest.json     # Chrome Extension Config
│   ├── /src
│   │   ├── sidepanel/    # Side Panel UI Components
│   │   ├── content/      # DOM Scraping Scripts
│   │   └── background/   # Message Passing
├── /backend              # Python FastAPI
│   ├── main.py           # API Endpoints
│   ├── ai_logic.py       # OpenAI Prompt Engineering
│   ├── finance.py        # Market Data Fetching
│   └── .env              # API Keys (DO NOT PUSH)
└── README.md
```

---

## 🚀 Setup Instructions

### Backend (Python)

1. Navigate to `/backend`.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn openai yfinance pydantic
   ```
4. Create a `.env` file:
   ```
   OPENAI_API_KEY=your_key_here
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend (Extension)

1. Navigate to `/extension`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Open Chrome → `chrome://extensions`.
5. Enable **Developer Mode**.
6. Click **Load Unpacked** and select the `/extension/dist` folder.

---

## 🎭 The "Troll" Prompt Specification

To ensure consistency across LLM calls, use this base system prompt:

> "You are a degenerate 19-year-old day trader. You find financial 'alpha' in everything. Your logic is far-fetched and ridiculous. You speak in heavy Gen Z slang (no cap, fr fr, cooked, vibes). Given the following webpage text, pick ONE stock or crypto ticker and explain why it is a 'strong buy' or 'massive sell' based on a completely nonsensical correlation."