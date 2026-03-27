# X Ad Closer

A Chrome extension that automatically dismisses ads on X.com (Twitter) by clicking "Not interested in this ad" on promoted tweets.

Unlike traditional ad blockers that just hide ads, this extension actively tells X's algorithm you're not interested, which should reduce the number of ads you see over time.

## How It Works

1. Monitors your X.com timeline for promoted/ad tweets using a MutationObserver
2. When an ad is detected (by its "Ad" label), it clicks the three-dot menu
3. Selects "Not interested in this ad" from the dropdown
4. Processes ads one at a time with natural delays

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `x_ad_closer` folder
6. Navigate to [x.com](https://x.com) — the extension will start working automatically

## Usage

- Click the extension icon in the toolbar to open the popup
- Use the toggle to enable/disable the extension
- The popup shows a count of ads dismissed

## Debugging

Open the browser console on x.com (F12 → Console) and filter for `[X Ad Closer]` to see log messages about detected and dismissed ads.

## Notes

- The extension uses `data-testid` attributes and text content matching to find ads, since X.com uses obfuscated class names
- If X.com changes their DOM structure, the selectors in `content.js` may need updating
- Ads are processed sequentially with delays to avoid issues with overlapping menus
