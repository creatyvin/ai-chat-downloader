# Privacy Policy for AI Chat Downloader

**Last Updated:** January 2025

## Overview

AI Chat Downloader is a browser extension that exports AI chat conversations to Markdown files. This privacy policy explains how the extension handles your data.

## Data Collection

**We do not collect any data.**

AI Chat Downloader:
- Does NOT collect personal information
- Does NOT collect usage statistics
- Does NOT collect browsing history
- Does NOT track user behavior
- Does NOT use analytics services
- Does NOT contain advertisements

## Data Processing

All data processing happens **locally in your browser**:

1. **Chat Content**: The extension reads chat content only from the currently active tab on supported AI platforms. This content is processed locally to generate a Markdown file.

2. **Settings**: Your preferences (download folder name) are stored locally using Chrome's sync storage API. This data syncs across your Chrome browsers if you're signed into Chrome, but is never accessible to us.

3. **Downloaded Files**: Exported Markdown files are saved to your local Downloads folder. We have no access to these files.

## Data Transmission

**No data is ever transmitted to external servers.**

The extension:
- Works entirely offline
- Does not make network requests
- Does not communicate with any backend services
- Does not send data to third parties

## Permissions Explained

The extension requests the following permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Read chat content from the current tab only |
| `storage` | Save your settings (download folder preference) |
| `downloads` | Save Markdown files to your computer |
| `scripting` | Inject content scripts to parse chat content |
| `host_permissions` | Access specific AI platform domains only |

## Third-Party Services

This extension does not integrate with any third-party services, analytics platforms, or advertising networks.

## Children's Privacy

This extension does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date above.

## Open Source

This extension is open source. You can review the complete source code at:
https://github.com/creatyvin/ai-chat-downloader

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository:
https://github.com/creatyvin/ai-chat-downloader/issues

---

**Summary**: AI Chat Downloader is a privacy-respecting tool that processes your data locally and never sends anything to external servers.
