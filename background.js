// Update badge with dismissed ad count
function updateBadge(count) {
  const text = count > 0 ? String(count) : "";
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: "#1d9bf0" });
}

// Set badge on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ dismissedCount: 0 }, (result) => {
    updateBadge(result.dismissedCount);
  });
});

// Update badge when count changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.dismissedCount) {
    updateBadge(changes.dismissedCount.newValue);
  }
});

// Set badge on service worker startup (e.g. after browser restart)
chrome.storage.local.get({ dismissedCount: 0 }, (result) => {
  updateBadge(result.dismissedCount);
});
