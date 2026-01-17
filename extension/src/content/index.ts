const sendSnapshot = () => {
  const payload = {
    title: document.title,
    url: window.location.href,
    text: document.body?.innerText?.slice(0, 2000) || ""
  };
  chrome.runtime.sendMessage({ type: "STONK_PAGE", payload });
};

window.addEventListener("load", () => {
  setTimeout(sendSnapshot, 500);
});

window.addEventListener("hashchange", () => {
  setTimeout(sendSnapshot, 300);
});

window.addEventListener("popstate", () => {
  setTimeout(sendSnapshot, 300);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "STONK_REFRESH") {
    sendSnapshot();
  }
});
