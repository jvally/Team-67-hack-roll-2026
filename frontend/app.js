/**
 * RobbingHood Test UI - JavaScript
 */

// Replace API_BASE with Google Sheets API URL
const SHEETS_API_URL = 'YOUR_GOOGLE_SHEETS_SCRIPT_URL';

// DOM Elements
const webpageTextInput = document.getElementById('webpageText');
const analyzeBtn = document.getElementById('analyzeBtn');
const demoBtn = document.getElementById('demoBtn');
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const errorEl = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

// Result elements
const tickerAction = document.getElementById('tickerAction');
const tickerSymbol = document.getElementById('tickerSymbol');
const tickerName = document.getElementById('tickerName');
const vibeIndicator = document.getElementById('vibeIndicator');
const vibeText = document.getElementById('vibeText');
const confidenceValue = document.getElementById('confidenceValue');
const confidenceProgress = document.getElementById('confidenceProgress');
const keyInsight = document.getElementById('keyInsight');
const reasoning = document.getElementById('reasoning');
const memeCaption = document.getElementById('memeCaption');
const currentPrice = document.getElementById('currentPrice');
const priceChange = document.getElementById('priceChange');
const volume = document.getElementById('volume');
const marketCap = document.getElementById('marketCap');
const marketDataSection = document.getElementById('marketData');
const jsonOutput = document.getElementById('jsonOutput');

// Event Listeners
analyzeBtn.addEventListener('click', () => analyzeText(webpageTextInput.value));
demoBtn.addEventListener('click', runDemo);

// API Functions
async function analyzeText(text) {
    if (!text || text.trim().length < 50) {
        showError('Need at least 50 characters of content, no cap 🙅');
        return;
    }
    showLoading();
    try {
        // Send to Google Apps Script instead of backend
        const response = await fetch(SHEETS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                webpage_text: text
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'API request failed');
        }
        if (data.success) {
            displayResults(data);
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
    } catch (err) {
        showError(err.message);
    }
}

async function runDemo() {
    showLoading();
    try {
        // Send to Google Apps Script demo endpoint
        const response = await fetch(SHEETS_API_URL + '?demo=true');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Demo request failed');
        }
        if (data.success) {
            displayResults(data);
        } else {
            throw new Error(data.error || 'Demo failed');
        }
    } catch (err) {
        showError(err.message);
    }
}

// Display Functions
function showLoading() {
    loadingEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    analyzeBtn.disabled = true;
    demoBtn.disabled = true;
}

function hideLoading() {
    loadingEl.classList.add('hidden');
    analyzeBtn.disabled = false;
    demoBtn.disabled = false;
}

function showError(message) {
    hideLoading();
    errorEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
    errorMessage.textContent = message;
}

function displayResults(data) {
    hideLoading();
    resultsEl.classList.remove('hidden');
    errorEl.classList.add('hidden');

    const analysis = data.analysis;
    const market = data.market_data;

    // Ticker display
    const isBuy = analysis.action === 'BUY';
    tickerAction.textContent = isBuy ? '🚀 STRONG BUY' : '📉 MASSIVE SELL';
    tickerAction.className = `action-badge ${isBuy ? 'buy' : 'sell'}`;

    tickerSymbol.textContent = `$${analysis.ticker}`;
    tickerSymbol.className = `ticker-symbol ${isBuy ? 'buy' : 'sell'}`;

    tickerName.textContent = market?.name || analysis.asset_type.toUpperCase();

    // Vibe meter
    const vibePosition = analysis.vibe === 'MOONING' ? 85 : 15;
    vibeIndicator.style.left = `${vibePosition}%`;
    vibeText.textContent = analysis.vibe === 'MOONING' ? 'MOONING 🚀' : 'COOKED 💀';

    // Confidence
    confidenceValue.textContent = `${analysis.confidence}%`;
    confidenceProgress.style.width = `${analysis.confidence}%`;

    // Key Insight
    keyInsight.textContent = analysis.key_insight || analysis.reasoning;

    // Reasoning
    reasoning.textContent = analysis.reasoning;
    memeCaption.textContent = `"${analysis.meme_caption}"`;

    // Market data
    if (market) {
        marketDataSection.classList.remove('hidden');
        currentPrice.textContent = `$${market.current_price?.toLocaleString() || 'N/A'}`;

        const change = market.change_24h_percent || 0;
        priceChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        priceChange.className = `market-value ${change >= 0 ? 'change-positive' : 'change-negative'}`;

        volume.textContent = formatNumber(market.volume);
        marketCap.textContent = formatNumber(market.market_cap, true);
    } else {
        marketDataSection.classList.add('hidden');
    }

    // Raw JSON
    jsonOutput.textContent = JSON.stringify(data, null, 2);
}

// Utility Functions
function formatNumber(num, isCurrency = false) {
    if (!num) return 'N/A';

    if (num >= 1e12) {
        return (isCurrency ? '$' : '') + (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
        return (isCurrency ? '$' : '') + (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (isCurrency ? '$' : '') + (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (isCurrency ? '$' : '') + (num / 1e3).toFixed(2) + 'K';
    }
    return (isCurrency ? '$' : '') + num.toLocaleString();
}

// Initial state
console.log('🚀 RobbingHood Test UI loaded. Ready to find alpha fr fr.');
