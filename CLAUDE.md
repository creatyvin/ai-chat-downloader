# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Chat Downloader — Chrome extension (Manifest V3) for exporting chat conversations from AI platforms (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek) to Markdown files.

## Development

No build system — plain JavaScript loaded directly by Chrome. To test changes:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project folder
4. After code changes, click the refresh icon on the extension card

## Architecture

### Parser System

The extension uses a plugin-based parser architecture in `parsers/`:

- **base.js** — `ChatParser` base class and `getParser(url)` factory function. All parsers extend `ChatParser` and are registered on `window`
- **Platform parsers** (chatgpt.js, claude.js, gemini.js, perplexity.js, others.js) — each implements:
  - `getScrollContainer()` — returns the scrollable element for auto-loading history
  - `parse()` — extracts messages, returns `{ title, date, messages[] }`
  - Optional: `formatMarkdown(parsedData)` override for custom output

Parsers are loaded in order specified in manifest.json (base.js first).

### Script Roles

- **content.js** — injected into AI chat pages. Creates floating download button, handles scroll-to-load history, coordinates parsing and download
- **background.js** — service worker that receives download requests and saves files via `chrome.downloads` API
- **options.js/html** — settings page for configuring download folder (default: `AI_Chats`)

### Parser Configuration Properties

Parsers can customize scrolling behavior via instance properties:
- `scrollDirection` — 'up' (default) or 'down'
- `maxScrollAttempts` — limit scroll iterations (default: 30)
- `maxNoChangeAttempts` — stop after N unchanged checks (default: 5)
- `scrollDelayMs` — delay between scrolls (default: 800)
- `skipScroll` — set `true` to disable auto-scroll

## Adding a New Platform Parser

1. Create `parsers/newplatform.js` extending `ChatParser`
2. Implement `getScrollContainer()` and `parse()` methods
3. Register: `window.NewPlatformParser = NewPlatformParser;`
4. Add URL pattern to `manifest.json`: `host_permissions` and `content_scripts.matches`
5. Add parser file to `content_scripts.js` array (before content.js)
6. Update `getParser()` in base.js with URL detection
