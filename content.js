(function () {
  "use strict";

  const LOG_PREFIX = "[X Ad Closer]";
  const PROCESSED_ATTR = "data-xac-processed";
  const DISMISS_DELAY_MS = 500;
  const MENU_WAIT_MS = 600;
  const BETWEEN_ADS_DELAY_MS = 1500;
  const SCAN_DEBOUNCE_MS = 300;

  let enabled = true;
  let dismissedCount = 0;
  let processing = false;
  const adQueue = [];

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Load enabled state from storage
  chrome.storage.local.get({ enabled: true }, (result) => {
    enabled = result.enabled;
    log("Initialized, enabled:", enabled);
    if (enabled) {
      scanForAds();
    }
  });

  // Listen for toggle changes from popup
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      log("Enabled changed to:", enabled);
      if (enabled) {
        scanForAds();
      }
    }
  });

  /**
   * Check if a tweet article element is a promoted/ad tweet.
   * X.com marks ads with a small "Ad" label in the tweet metadata area.
   */
  function isAdTweet(article) {
    // Strategy 1: Look for spans with exact "Ad" text content
    // The ad label is typically a short span in the tweet's header/metadata
    const spans = article.querySelectorAll("span");
    for (const span of spans) {
      const text = span.textContent.trim();
      // Match exact "Ad" text (X.com uses this label for promoted content)
      if (text === "Ad") {
        // Verify it's a label-like element (small, not part of tweet text)
        // Check that this span doesn't have many children (it should be a leaf or near-leaf)
        if (span.children.length === 0 || span.childElementCount <= 1) {
          // Additional check: make sure it's not inside the actual tweet text area
          const tweetText = article.querySelector('[data-testid="tweetText"]');
          if (!tweetText || !tweetText.contains(span)) {
            return true;
          }
        }
      }
    }

    // Strategy 2: Check aria-label attributes that might indicate promotion
    const links = article.querySelectorAll("a");
    for (const link of links) {
      const ariaLabel = link.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.toLowerCase().includes("promoted")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find the three-dot (caret/more) menu button within a tweet.
   */
  function findMenuButton(article) {
    // Primary: data-testid="caret" is the three-dot menu on tweets
    const caret = article.querySelector('[data-testid="caret"]');
    if (caret) return caret;

    // Fallback: look for aria-label="More"
    const moreBtn = article.querySelector('[aria-label="More"]');
    if (moreBtn) return moreBtn;

    return null;
  }

  /**
   * Find the "Not interested in this ad" menu item in the currently open dropdown.
   * The dropdown menu is rendered in a portal/layer outside the tweet element.
   */
  function findNotInterestedMenuItem() {
    // Look for menu items in dropdown layers
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    for (const item of menuItems) {
      const text = item.textContent.toLowerCase();
      if (text.includes("not interested in this ad")) {
        return item;
      }
    }

    // Fallback: broader search for any clickable element with the text
    const allElements = document.querySelectorAll(
      '[role="menu"] span, [data-testid="Dropdown"] span'
    );
    for (const el of allElements) {
      if (el.textContent.toLowerCase().includes("not interested in this ad")) {
        // Click the closest clickable parent
        const clickable =
          el.closest('[role="menuitem"]') ||
          el.closest("div[tabindex]") ||
          el;
        return clickable;
      }
    }

    return null;
  }

  /**
   * Close any open dropdown menu by pressing Escape.
   */
  function closeMenu() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }

  /**
   * Dismiss a single ad tweet by clicking through the menu flow.
   */
  async function dismissAd(article) {
    if (!enabled) return false;

    // Verify the article is still in the DOM
    if (!document.contains(article)) {
      log("Ad tweet no longer in DOM, skipping");
      return false;
    }

    log("Dismissing ad tweet...");

    // Step 1: Find and click the three-dot menu
    const menuBtn = findMenuButton(article);
    if (!menuBtn) {
      log("Could not find menu button on ad tweet");
      return false;
    }

    menuBtn.click();
    log("Clicked menu button, waiting for dropdown...");

    // Step 2: Wait for the dropdown menu to appear
    await sleep(MENU_WAIT_MS);

    // Step 3: Find and click "Not interested in this ad"
    const notInterestedItem = findNotInterestedMenuItem();
    if (!notInterestedItem) {
      log("Could not find 'Not interested in this ad' menu item");
      closeMenu();
      await sleep(200);
      return false;
    }

    notInterestedItem.click();
    log("Clicked 'Not interested in this ad'");

    dismissedCount++;
    chrome.storage.local.set({ dismissedCount });

    await sleep(DISMISS_DELAY_MS);
    return true;
  }

  /**
   * Process the ad queue one tweet at a time.
   */
  async function processQueue() {
    if (processing) return;
    processing = true;

    while (adQueue.length > 0 && enabled) {
      const article = adQueue.shift();

      // Double-check it's still in the DOM and still an ad
      if (!document.contains(article)) continue;
      if (article.hasAttribute(PROCESSED_ATTR)) continue;

      article.setAttribute(PROCESSED_ATTR, "true");

      const success = await dismissAd(article);
      if (success) {
        log(`Ad dismissed (total: ${dismissedCount})`);
      }

      // Delay between processing ads
      await sleep(BETWEEN_ADS_DELAY_MS);
    }

    processing = false;
  }

  /**
   * Scan the page for ad tweets and queue them for dismissal.
   */
  function scanForAds() {
    if (!enabled) return;

    const tweets = document.querySelectorAll(
      `article[data-testid="tweet"]:not([${PROCESSED_ATTR}])`
    );

    let newAdsFound = 0;
    for (const tweet of tweets) {
      if (tweet.hasAttribute(PROCESSED_ATTR)) continue;

      if (isAdTweet(tweet)) {
        adQueue.push(tweet);
        newAdsFound++;
      }
    }

    if (newAdsFound > 0) {
      log(`Found ${newAdsFound} new ad(s)`);
      processQueue();
    }
  }

  // Debounced scan function
  let scanTimeout = null;
  function debouncedScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scanForAds, SCAN_DEBOUNCE_MS);
  }

  // Set up MutationObserver to watch for new tweets
  const observer = new MutationObserver((mutations) => {
    if (!enabled) return;

    // Check if any mutations added nodes that could be tweets
    let hasRelevantChanges = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        hasRelevantChanges = true;
        break;
      }
    }

    if (hasRelevantChanges) {
      debouncedScan();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial scan
  scanForAds();

  log("Content script loaded and watching for ads");
})();
