const API_BASE = "http://127.0.0.1:8000";

// Debounce state to prevent multiple concurrent requests
let isAnalyzing = false;
let lastAnalyzedUrl = "";
let analysisTimeout: ReturnType<typeof setTimeout> | null = null;
let currentTrollLevel = 50;

chrome.runtime.onInstalled.addListener(() => {
  console.log("StonkGaze background ready - connected to backend at", API_BASE);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Handle troll level updates from sidepanel
  if (message?.type === "STONK_MANUAL_REFRESH") {
    if (message.trollLevel !== undefined) {
      currentTrollLevel = message.trollLevel;
    }
    // Reset state to allow manual refresh
    isAnalyzing = false;
    lastAnalyzedUrl = "";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "STONK_REFRESH" });
      }
    });
    return;
  }

  if (message?.type !== "STONK_PAGE") return;

  const pageData = {
    title: message.payload?.title || "",
    url: message.payload?.url || "",
    text: message.payload?.text || ""
  };

  // Skip if same URL already analyzed recently
  if (pageData.url === lastAnalyzedUrl && isAnalyzing) {
    console.log("Skipping duplicate analysis for:", pageData.url);
    return;
  }

  // Clear any pending analysis
  if (analysisTimeout) {
    clearTimeout(analysisTimeout);
  }

  // Debounce: wait 300ms before starting analysis
  analysisTimeout = setTimeout(() => {
    runAnalysis(pageData);
  }, 300);

  return true;
});

async function runAnalysis(pageData: { title: string; url: string; text: string }) {
  // Prevent concurrent requests
  if (isAnalyzing) {
    console.log("Analysis already in progress, skipping");
    return;
  }

  isAnalyzing = true;
  lastAnalyzedUrl = pageData.url;

  // Load troll level from storage
  try {
    const result = await chrome.storage.local.get(["trollLevel"]);
    if (result.trollLevel !== undefined) {
      currentTrollLevel = result.trollLevel;
    }
  } catch (e) {
    console.log("Could not load troll level, using default:", currentTrollLevel);
  }

  // Store source info
  chrome.storage.session.set({ stonkSource: pageData });

  // Notify sidepanel that we're loading
  chrome.runtime.sendMessage({
    type: "STONK_LOADING",
    payload: { title: pageData.title, url: pageData.url }
  });

  try {
    const result = await analyzeWithBackend(pageData.text, currentTrollLevel);

    // Send result ONCE
    chrome.runtime.sendMessage({
      type: "STONK_RESULT",
      payload: {
        ...result,
        sourceTitle: pageData.title,
        sourceUrl: pageData.url
      }
    });
  } catch (error: any) {
    console.error("Backend API error:", error);
    chrome.runtime.sendMessage({
      type: "STONK_ERROR",
      payload: { error: error.message }
    });
  } finally {
    isAnalyzing = false;
  }
}

async function analyzeWithBackend(webpageText: string, trollLevel: number) {
  if (!webpageText || webpageText.trim().length < 50) {
    throw new Error("Not enough content to analyze");
  }

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webpage_text: webpageText,
      troll_level: trollLevel
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Analysis failed");
  }

  return data;
}

// Only trigger on complete navigation, with debounce
let tabUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;

  // Debounce tab updates
  if (tabUpdateTimeout) {
    clearTimeout(tabUpdateTimeout);
  }

  tabUpdateTimeout = setTimeout(() => {
    chrome.tabs.sendMessage(tabId, { type: "STONK_REFRESH" }).catch(() => {
      // Ignore errors for tabs without content script
    });
  }, 500);
});
