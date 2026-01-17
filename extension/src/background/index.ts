chrome.runtime.onInstalled.addListener(() => {
  console.log("StonkGaze background ready");
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "STONK_PAGE") return;

  const payload = {
    title: message.payload?.title,
    url: message.payload?.url
  };

  chrome.storage.session.set({ stonkSource: payload });
  chrome.runtime.sendMessage({ type: "STONK_SOURCE", payload });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;
  chrome.tabs.sendMessage(tabId, { type: "STONK_REFRESH" });
});
