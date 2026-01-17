const API_BASE = "http://127.0.0.1:8000";

chrome.runtime.onInstalled.addListener(() => {
  console.log("StonkGaze background ready - connected to backend at", API_BASE);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "STONK_PAGE") return;

  const pageData = {
    title: message.payload?.title || "",
    url: message.payload?.url || "",
    text: message.payload?.text || ""
  };

  // Store source info
  chrome.storage.session.set({ stonkSource: pageData });

  // Notify sidepanel that we're loading
  chrome.runtime.sendMessage({
    type: "STONK_LOADING",
    payload: { title: pageData.title, url: pageData.url }
  });

  // Call the backend API
  analyzeWithBackend(pageData.text)
    .then((result) => {
      chrome.runtime.sendMessage({
        type: "STONK_RESULT",
        payload: {
          ...result,
          sourceTitle: pageData.title,
          sourceUrl: pageData.url
        }
      });
    })
    .catch((error) => {
      console.error("Backend API error:", error);
      chrome.runtime.sendMessage({
        type: "STONK_ERROR",
        payload: { error: error.message }
      });
    });

  return true; // Indicates async response
});

async function analyzeWithBackend(webpageText: string) {
  if (!webpageText || webpageText.trim().length < 50) {
    throw new Error("Not enough content to analyze");
  }

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webpage_text: webpageText
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;
  chrome.tabs.sendMessage(tabId, { type: "STONK_REFRESH" });
});

// Handle side panel requests for manual refresh
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "STONK_MANUAL_REFRESH") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "STONK_REFRESH" });
      }
    });
  }
});
