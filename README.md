# Smartify - AI Text Enhancement Chrome Extension

A minimalistic Chrome extension that enhances your casual text into more intelligent, professional writing using OpenAI's GPT-3.5.

## Features

- 🧠 Brain emoji button appears on hover near text inputs
- 🎯 Floating brain button for quick access anywhere on the page
- 📚 Educational grammar tips with each enhancement (optional)
- 📊 Grammar tips dashboard to track your learning progress
- Clean diff view showing original vs enhanced text
- One-click acceptance to replace text
- Copy enhanced text to clipboard with one click
- Keyboard shortcuts for power users (`⌘+Shift+E` on Mac, `Ctrl+Shift+E` on Windows/Linux)
- Secure local storage of API key
- Works on all websites
- Ultra-minimalistic design

## Installation

### For Development

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select this directory
5. The extension will be installed and active

### Setting Up

1. Click the Smartify icon in your Chrome toolbar
2. Click "Settings" or go to the extension options
3. Enter your OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))
4. Save the key

## Usage

### Method 1: Input Field Enhancement

1. Click on any text input field on any website
2. Look for the 🧠 brain emoji button that appears near the input
3. Type your text
4. Click the brain button to enhance your text
5. Review the diff between original and enhanced versions
6. Click "Accept" to use the enhanced text or "Cancel" to keep original

### Method 2: Extension Popup

1. Click the Smartify extension icon in Chrome toolbar
2. Type or paste text directly in the popup textarea
3. Click "Enhance Text" or press `⌘+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
4. View enhanced text and grammar tip instantly
5. Click "Copy" to copy the result

### Method 3: Floating Brain Button

1. Look for the blue 🧠 button in the top-right corner of any webpage
2. Click it to open the enhancement panel
3. Paste or type any text you want to enhance
4. Click "Enhance Text" or press `Ctrl+Enter`
5. Copy the enhanced result with one click
6. Use keyboard shortcut `⌘+Shift+E` (Mac) or `Ctrl+Shift+E` (Windows/Linux) to quickly toggle the panel

## Grammar Tips Feature

Smartify can help you improve your writing skills by providing educational grammar tips with each enhancement:

1. **Enable Grammar Tips**: Go to Settings and toggle "Enable Grammar Tips" (on by default)
2. **Learn as You Write**: Each enhancement includes a specific grammar tip explaining the improvements
3. **Track Your Progress**: Access the Grammar Tips Dashboard from Settings or the popup
4. **Review and Study**: Search through your collected tips, review examples, and learn from patterns
5. **Privacy First**: All tips are stored locally in your browser

### Testing Grammar Tips

To test if grammar tips are working:

1. Open `test-grammar-tips.html` in Chrome (included in the extension folder)
2. Focus on any test input field and click the brain button
3. The page will show if grammar tips are being displayed correctly
4. Click "Check Stored Grammar Tips" to verify local storage

### Troubleshooting

**If grammar tips aren't showing:**

- Ensure you're using a compatible model (gpt-4o-mini or gpt-4o)
- Check that grammar tips are enabled in settings
- Verify your API key has access to structured outputs
- Check the browser console for any errors

**If the brain button isn't appearing:**

1. Open Chrome DevTools Console (`⌘+Option+I` on Mac)
2. Type: `enableSmartifyDebug()` and press Enter
3. Look for error messages or warnings
4. Try: `processTextInputs()` to manually scan for inputs
5. Use keyboard shortcut `⌘+Shift+E` as a fallback

See `DEBUG_GUIDE.md` for detailed troubleshooting steps.

## Publishing to Chrome Web Store

1. **Create proper icons**:

   - Open `generate-icons.html` in Chrome
   - Right-click each canvas and save as PNG with the correct filename
   - Replace the placeholder icons

2. **Prepare for submission**:

   - Remove unnecessary files: `generate-icons.js`, `create-simple-icons.js`, `generate-icons.html`
   - Create a ZIP file of the extension directory

3. **Submit to Chrome Web Store**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay the one-time developer fee ($5)
   - Click "New Item" and upload your ZIP
   - Fill in the listing details
   - Submit for review

## Security

- Your OpenAI API key is stored locally using Chrome's secure storage API
- The key is never sent anywhere except directly to OpenAI's API
- All processing happens in your browser

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Injects brain button into web pages
- `content.css` - Styles for injected elements
- `options.html/js/css` - Settings page for API key
- `popup.html/js/css` - Extension popup
- `background.js` - Background service worker
- `icon*.png` - Extension icons (need to be generated)

## License

MIT License - See LICENSE file
