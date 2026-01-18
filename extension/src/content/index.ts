// Debounce state
let lastSentTime = 0;
const DEBOUNCE_MS = 2000; // Only send once every 2 seconds

const sendSnapshot = () => {
  const now = Date.now();

  // Debounce: skip if sent recently
  if (now - lastSentTime < DEBOUNCE_MS) {
    console.log("RobbingHood: Skipping duplicate snapshot");
    return;
  }

  lastSentTime = now;

  const payload = {
    title: document.title,
    url: window.location.href,
    text: document.body?.innerText?.slice(0, 2000) || ""
  };

  chrome.runtime.sendMessage({ type: "STONK_PAGE", payload });
};

// Only send on initial load
window.addEventListener("load", () => {
  setTimeout(sendSnapshot, 500);
});

// Handle refresh requests from background
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "STONK_REFRESH") {
    // Reset debounce for manual refresh
    lastSentTime = 0;
    sendSnapshot();
  }
});
