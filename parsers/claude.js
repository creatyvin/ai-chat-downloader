class ClaudeParser extends (window.ChatParser || Object) {
    constructor() {
        super();
        this.maxScrollAttempts = 30;
        this.maxNoChangeAttempts = 2;
        this.scrollDelayMs = 500;
    }

    getScrollContainer() {
        const container = document.querySelector('div[class*="overflow-y-auto"]');
        return container || document.documentElement;
    }

    parse() {
        console.log("ClaudeParser: Starting parse...");
        const title = document.title || "Claude Chat";
        const messages = [];
        const seenTexts = new Set();

        const container = document.querySelector('main') || document.body;

        // Method 1: Look for turns with data-testid (new Claude UI)
        const humanTurns = container.querySelectorAll('[data-testid*="human"], [class*="human-turn"], [class*="user-turn"]');
        const assistantTurns = container.querySelectorAll('[data-testid*="assistant"], [class*="assistant-turn"], [class*="claude-turn"]');

        if (humanTurns.length > 0 || assistantTurns.length > 0) {
            const allTurns = [];

            humanTurns.forEach(el => {
                const rect = el.getBoundingClientRect();
                const text = this.extractTextContent(el);
                if (text && text.length > 5 && !seenTexts.has(text)) {
                    seenTexts.add(text);

                    // Extract images from user message
                    const images = this.extractImages(el);
                    const content = images.length > 0 ? text + '\n\n' + images.join('\n') : text;

                    allTurns.push({ role: 'User', content, top: rect.top + window.scrollY });
                }
            });

            assistantTurns.forEach(el => {
                const rect = el.getBoundingClientRect();
                let content = this.extractTextContent(el);

                // Extract images
                const images = this.extractImages(el);
                if (images.length > 0) {
                    content += '\n\n' + images.join('\n');
                }

                // Try to extract artifact content
                const artifactContent = this.extractArtifactContent(el);
                if (artifactContent) {
                    content += '\n\n' + artifactContent;
                }

                if (content && content.length > 5 && !seenTexts.has(content)) {
                    allTurns.push({ role: 'Claude', content, top: rect.top + window.scrollY });
                    seenTexts.add(content);
                }
            });

            // Sort by vertical position to maintain order
            allTurns.sort((a, b) => a.top - b.top);
            allTurns.forEach(t => messages.push({ role: t.role, content: t.content, time: "" }));
        }

        // Method 2: Fallback for older Claude UI
        if (messages.length === 0) {
            const chatRows = document.querySelectorAll('.grid.gap-2, [data-testid="chat-history"] > div');

            chatRows.forEach(row => {
                const isUser = row.querySelector('.font-user-message') || row.innerText.startsWith("You");
                const isClaude = row.querySelector('.font-claude-message');
                const role = isUser ? "User" : (isClaude ? "Claude" : null);

                if (role) {
                    const contentNode = row.querySelector('.font-claude-message, .font-user-message') || row;
                    const content = this.extractTextContent(contentNode);

                    if (content && content.length > 5 && !seenTexts.has(content)) {
                        messages.push({ role, content, time: "" });
                        seenTexts.add(content);
                    }
                }
            });
        }

        // Method 3: Generic fallback
        if (messages.length === 0) {
            const genericMessages = container.querySelectorAll('[class*="prose"], [class*="markdown"], [class*="message"]');
            let isUser = true;
            genericMessages.forEach(el => {
                const content = this.extractTextContent(el);
                if (content && content.length > 10 && !seenTexts.has(content)) {
                    messages.push({ role: isUser ? 'User' : 'Claude', content, time: "" });
                    seenTexts.add(content);
                    isUser = !isUser;
                }
            });
        }

        console.log(`ClaudeParser: Captured ${messages.length} messages.`);
        return { title, date: new Date().toLocaleString(), messages };
    }

    // Claude-specific artifact extraction (extends base functionality)
    extractArtifactContent(element) {
        if (!element) return '';

        const artifacts = [];

        // Look for artifact containers
        const artifactContainers = element.querySelectorAll('[data-testid*="artifact"]');

        artifactContainers.forEach(container => {
            // Get artifact title
            let title = '';
            const titleSelectors = [
                '[class*="title"]', 'h1', 'h2', 'h3', 'strong',
                '[class*="Document"]', '[class*="DOCX"]', '[class*="PDF"]'
            ];

            for (const selector of titleSelectors) {
                const titleEl = container.querySelector(selector);
                if (titleEl && titleEl.textContent.trim()) {
                    title = titleEl.textContent.trim();
                    break;
                }
            }

            // Extract code blocks
            const codeBlocks = container.querySelectorAll('pre code, code[class*="language-"]');
            codeBlocks.forEach(code => {
                const lang = code.className.match(/language-(\w+)/)?.[1] || '';
                const codeText = code.textContent.trim();
                if (codeText && codeText.length > 20) {
                    artifacts.push(`\n### Artifact${title ? ': ' + title : ''}\n\`\`\`${lang}\n${codeText}\n\`\`\``);
                }
            });

            // Extract document content
            if (codeBlocks.length === 0) {
                const docContent = container.querySelector('[class*="document"], [class*="pdf"], [class*="content"], iframe, canvas');
                if (docContent) {
                    const docText = this.extractTextContent(docContent);
                    if (docText && docText.length > 50) {
                        artifacts.push(`\n### Document Artifact${title ? ': ' + title : ''}\n${docText}`);
                    }
                }
            }

            // Check if artifact is collapsed
            const downloadBtn = container.querySelector('button');
            const hasContent = codeBlocks.length > 0 || container.querySelector('[class*="content"]');

            if (downloadBtn && !hasContent && title) {
                artifacts.push(`\n### Artifact: ${title}\n📎 *Click to expand artifact before downloading to capture full content.*`);
            }
        });

        // Look for standalone code blocks
        const standaloneCodes = element.querySelectorAll('pre:not([data-testid*="artifact"] pre)');
        standaloneCodes.forEach(pre => {
            const code = pre.querySelector('code');
            if (code) {
                const lang = code.className.match(/language-(\w+)/)?.[1] || '';
                const codeText = code.textContent.trim();
                if (codeText && codeText.length > 10) {
                    artifacts.push(`\n\`\`\`${lang}\n${codeText}\n\`\`\``);
                }
            }
        });

        return artifacts.join('\n\n');
    }
}
window.ClaudeParser = ClaudeParser;
