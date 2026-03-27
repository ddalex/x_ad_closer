const toggle = document.getElementById("toggle");
const countEl = document.getElementById("count");

// Load current state
chrome.storage.local.get({ enabled: true, dismissedCount: 0 }, (result) => {
  toggle.checked = result.enabled;
  countEl.textContent = result.dismissedCount;
});

// Handle toggle
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
});

// Update count in real-time
chrome.storage.onChanged.addListener((changes) => {
  if (changes.dismissedCount) {
    countEl.textContent = changes.dismissedCount.newValue;
  }
});
