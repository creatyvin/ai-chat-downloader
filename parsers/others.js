// Grok Parser (x.com)
class GrokParser extends (window.ChatParser || Object) {
    constructor() {
        super();
        this.maxScrollAttempts = 30;
        this.maxNoChangeAttempts = 3;
        this.scrollDelayMs = 600;
        this.scrollDirection = 'up';
    }

    getScrollContainer() {
        // Try to find scrollable container in Grok UI
        const containers = document.querySelectorAll('[data-testid="conversation"], [role="main"]');
        for (const container of containers) {
            if (container.scrollHeight > container.clientHeight) {
                return container;
            }
        }

        // Fallback: find any scrollable div
        const divs = document.querySelectorAll('div');
        for (const div of divs) {
            const style = window.getComputedStyle(div);
            if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                div.scrollHeight > div.clientHeight + 100) {
                return div;
            }
        }

        return window;
    }

    parse() {
        const title = document.title || "Grok Chat";
        const messages = [];
        const seenTexts = new Set();

        // Method 1: data-testid based (primary)
        const messageEntries = document.querySelectorAll('[data-testid="messageEntry"], [data-testid="message"]');
        if (messageEntries.length > 0) {
            messageEntries.forEach(entry => {
                const content = this.extractTextContent(entry);
                if (!content || content.length < 3 || seenTexts.has(content)) return;

                seenTexts.add(content);

                // Detect role by looking for Grok indicators
                const isGrok = entry.querySelector('[data-testid="grok-avatar"], [class*="grok"]') ||
                              entry.closest('[data-testid*="grok"]') ||
                              content.toLowerCase().startsWith('grok');

                const images = this.extractImages(entry);
                const codeBlocks = this.extractCodeBlocks(entry);

                let fullContent = content;
                if (codeBlocks.length > 0) {
                    fullContent += '\n\n' + this.formatCodeBlocksMarkdown(codeBlocks);
                }
                if (images.length > 0) {
                    fullContent += '\n\n' + images.join('\n');
                }

                messages.push({
                    role: isGrok ? "Grok" : "User",
                    content: fullContent,
                    time: ""
                });
            });
        }

        // Method 2: Role-based containers
        if (messages.length === 0) {
            const userMessages = document.querySelectorAll('[data-testid*="user"], [class*="user-message"]');
            const grokMessages = document.querySelectorAll('[data-testid*="grok"], [data-testid*="assistant"], [class*="assistant"]');

            const allMessages = [];

            userMessages.forEach(el => {
                const content = this.extractTextContent(el);
                if (content && content.length > 3 && !seenTexts.has(content)) {
                    seenTexts.add(content);
                    const rect = el.getBoundingClientRect();
                    allMessages.push({ role: "User", content, top: rect.top + window.scrollY });
                }
            });

            grokMessages.forEach(el => {
                const content = this.extractTextContent(el);
                if (content && content.length > 3 && !seenTexts.has(content)) {
                    seenTexts.add(content);
                    const rect = el.getBoundingClientRect();
                    allMessages.push({ role: "Grok", content, top: rect.top + window.scrollY });
                }
            });

            // Sort by position
            allMessages.sort((a, b) => a.top - b.top);
            allMessages.forEach(msg => messages.push({ role: msg.role, content: msg.content, time: "" }));
        }

        // Method 3: Generic fallback - alternating messages
        if (messages.length === 0) {
            const genericMessages = document.querySelectorAll('[class*="message"], [class*="chat"], article');
            let isUser = true;

            genericMessages.forEach(el => {
                const content = this.extractTextContent(el);
                if (content && content.length > 10 && !seenTexts.has(content)) {
                    seenTexts.add(content);
                    messages.push({ role: isUser ? "User" : "Grok", content, time: "" });
                    isUser = !isUser;
                }
            });
        }

        console.log(`GrokParser: Captured ${messages.length} messages.`);
        return { title, date: new Date().toLocaleString(), messages };
    }
}
window.GrokParser = GrokParser;


// DeepSeek Parser (chat.deepseek.com)
class DeepSeekParser extends (window.ChatParser || Object) {
    constructor() {
        super();
        this.maxScrollAttempts = 30;
        this.maxNoChangeAttempts = 3;
        this.scrollDelayMs = 600;
        this.scrollDirection = 'up';
    }

    getScrollContainer() {
        // DeepSeek specific containers
        const selectors = [
            '#root > div > div > div[class*="overflow"]',
            '[class*="chat-container"]',
            '[class*="conversation"]',
            'main'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.scrollHeight > el.clientHeight) {
                return el;
            }
        }

        // Generic scrollable finder
        const divs = document.querySelectorAll('div');
        for (const div of divs) {
            const style = window.getComputedStyle(div);
            if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                div.scrollHeight > div.clientHeight + 100 &&
                div.clientWidth > 300) {
                return div;
            }
        }

        return document.body;
    }

    parse() {
        const title = document.title || "DeepSeek Chat";
        const messages = [];
        const seenTexts = new Set();

        // Method 1: Message bubbles with class detection
        const bubbles = document.querySelectorAll('.message-bubble, .chat-message, [class*="message-content"]');
        if (bubbles.length > 0) {
            bubbles.forEach(bubble => {
                const content = this.extractTextContent(bubble);
                if (!content || content.length < 3 || seenTexts.has(content)) return;

                seenTexts.add(content);

                // Detect role
                const isUser = bubble.classList.contains('user') ||
                              bubble.classList.contains('me') ||
                              bubble.closest('[class*="user"]') ||
                              bubble.closest('[data-role="user"]');

                const images = this.extractImages(bubble);
                const codeBlocks = this.extractCodeBlocks(bubble);

                let fullContent = content;
                if (codeBlocks.length > 0) {
                    fullContent += '\n\n' + this.formatCodeBlocksMarkdown(codeBlocks);
                }
                if (images.length > 0) {
                    fullContent += '\n\n' + images.join('\n');
                }

                messages.push({
                    role: isUser ? "User" : "DeepSeek",
                    content: fullContent,
                    time: ""
                });
            });
        }

        // Method 2: Data attribute based
        if (messages.length === 0) {
            const roleMessages = document.querySelectorAll('[data-role], [data-message-role]');
            roleMessages.forEach(el => {
                const role = el.dataset.role || el.dataset.messageRole;
                const content = this.extractTextContent(el);

                if (content && content.length > 3 && !seenTexts.has(content)) {
                    seenTexts.add(content);
                    messages.push({
                        role: role === 'user' ? "User" : "DeepSeek",
                        content,
                        time: ""
                    });
                }
            });
        }

        // Method 3: Prose/markdown blocks alternating
        if (messages.length === 0) {
            const proseBlocks = document.querySelectorAll('.prose, .markdown, [class*="markdown"]');
            let isUser = true;

            proseBlocks.forEach(block => {
                const content = this.extractTextContent(block);
                if (content && content.length > 10 && !seenTexts.has(content)) {
                    seenTexts.add(content);

                    const codeBlocks = this.extractCodeBlocks(block);
                    let fullContent = content;
                    if (codeBlocks.length > 0) {
                        fullContent += '\n\n' + this.formatCodeBlocksMarkdown(codeBlocks);
                    }

                    messages.push({ role: isUser ? "User" : "DeepSeek", content: fullContent, time: "" });
                    isUser = !isUser;
                }
            });
        }

        // Method 4: Last resort - dump main content
        if (messages.length === 0) {
            const main = document.querySelector('main, [role="main"], #root');
            if (main) {
                const content = this.extractTextContent(main);
                if (content && content.length > 50) {
                    messages.push({
                        role: "System",
                        content: "Could not detect individual messages. Full content:\n\n" + content,
                        time: ""
                    });
                }
            }
        }

        console.log(`DeepSeekParser: Captured ${messages.length} messages.`);
        return { title, date: new Date().toLocaleString(), messages };
    }
}
window.DeepSeekParser = DeepSeekParser;
