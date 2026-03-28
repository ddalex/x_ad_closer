# X Ad Closer

A Chrome extension that automatically dismisses ads on X.com (Twitter) by clicking "Not interested in this ad" on promoted tweets.

Unlike traditional ad blockers that just hide ads, this extension actively tells X's algorithm you're not interested, which should reduce the number of ads you see over time.

## How It Works

1. Monitors your X.com timeline for promoted/ad tweets using a MutationObserver
2. When an ad is detected (by its "Ad" label), it clicks the three-dot menu
3. Selects "Not interested in this ad" from the dropdown
4. Processes ads one at a time with natural delays

## Installation

### From ZIP (easiest)

1. Download `x_ad_closer.zip` from this repository
2. Unzip it to a folder on your computer
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked**
6. Select the unzipped folder
7. Navigate to [x.com](https://x.com) — the extension will start working automatically

### From source

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the repository folder
6. Navigate to [x.com](https://x.com) — the extension will start working automatically

## Features

- **Auto-dismiss ads** — detects promoted tweets and clicks "Not interested in this ad" automatically
- **Badge count** — shows the number of dismissed ads on the extension icon in the toolbar
- **Session & all-time stats** — popup shows both current session and total lifetime dismissed counts
- **Retry on failure** — retries up to 3 times with increasing delays if a dismissal fails
- **Toggle on/off** — enable or disable via the popup, takes effect immediately
- **Reset counts** — clear session and all-time stats from the popup

## Debugging

Open the browser console on x.com (F12 → Console) and filter for `[X Ad Closer]` to see log messages about detected and dismissed ads.

## Notes

- The extension uses `data-testid` attributes and text content matching to find ads, since X.com uses obfuscated class names
- If X.com changes their DOM structure, the selectors in `content.js` may need updating
- Ads are processed sequentially with delays to avoid issues with overlapping menus
