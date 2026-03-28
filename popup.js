const toggle = document.getElementById("toggle");
const countEl = document.getElementById("count");
const totalEl = document.getElementById("total");
const resetBtn = document.getElementById("reset");

// Load current state
chrome.storage.local.get(
  { enabled: true, dismissedCount: 0, dismissedCountTotal: 0 },
  (result) => {
    toggle.checked = result.enabled;
    countEl.textContent = result.dismissedCount;
    totalEl.textContent = result.dismissedCountTotal;
  }
);

// Handle toggle
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
});

// Handle reset
resetBtn.addEventListener("click", () => {
  chrome.storage.local.set({ dismissedCount: 0, dismissedCountTotal: 0 });
  countEl.textContent = "0";
  totalEl.textContent = "0";
});

// Update counts in real-time
chrome.storage.onChanged.addListener((changes) => {
  if (changes.dismissedCount) {
    countEl.textContent = changes.dismissedCount.newValue;
  }
  if (changes.dismissedCountTotal) {
    totalEl.textContent = changes.dismissedCountTotal.newValue;
  }
});
