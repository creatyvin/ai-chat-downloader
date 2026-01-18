# AI Chat Downloader

Chrome extension for exporting chat conversations from AI platforms to Markdown files.

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| ChatGPT | ✅ Working | chatgpt.com |
| Claude | ✅ Working | claude.ai (includes artifacts) |
| Gemini | ✅ Working | gemini.google.com |
| Perplexity | ✅ Working | perplexity.ai |
| Grok | ⚠️ Basic | x.com |
| DeepSeek | ⚠️ Basic | chat.deepseek.com |

### Planned
- Qwen (chat.qwen.ai)
- Kimi (kimi.com)
- Zai (chat.z.ai)
- Mistral (chat.mistral.ai)
- Manus (manus.im)

## Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-chat-downloader.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the cloned folder

5. The extension icon will appear in your toolbar

## Usage

1. Open any supported AI chat platform
2. Click the floating download button (bottom-right corner)
3. The chat will be saved as a Markdown file to your configured folder

### Settings

Right-click the extension icon → Options to configure:
- **Download folder**: Default is `AI_Chats`

## Output Format

Chats are exported as Markdown files with the format:
```
ChatTitle_YYYY-MM-DD.md
```

Example output:
```markdown
# Chat Title

**Date:** 1/18/2026, 10:30:00 AM

---

### User

Your message here

---

### ChatGPT

AI response here

---
```

## Architecture

```
├── manifest.json      # Extension manifest (V3)
├── background.js      # Service worker for downloads
├── content.js         # Main logic (button, scroll, coordination)
├── options.html/js    # Settings page
├── styles.css         # Floating button styles
└── parsers/
    ├── base.js        # Base parser class + factory
    ├── chatgpt.js     # ChatGPT parser
    ├── claude.js      # Claude parser (with artifacts)
    ├── gemini.js      # Gemini parser
    ├── perplexity.js  # Perplexity parser
    └── others.js      # Grok + DeepSeek parsers
```

## Contributing

Contributions are welcome! To add support for a new platform:

1. Create a new parser in `parsers/` extending `ChatParser`
2. Implement `getScrollContainer()` and `parse()` methods
3. Register your parser in `parsers/base.js` factory
4. Add URL patterns to `manifest.json`

## License

MIT
