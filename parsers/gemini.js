class GeminiParser extends (window.ChatParser || Object) {
    constructor() {
        super();
        // Aggressive scroll settings for Gemini
        this.maxScrollAttempts = 50; // More attempts
        this.maxNoChangeAttempts = 5; // Wait longer for content to load
        this.scrollDelayMs = 800; // Slower scroll for lazy loading
        this.scrollDirection = 'up'; // Scroll up to load history
    }

    getScrollContainer() {
        // Strategy: Start from a message element and traverse up to find the scroller
        const message = document.querySelector('message-content, .user-query, .model-response');
        if (message) {
            let parent = message.parentElement;
            while (parent && parent !== document.body) {
                const style = window.getComputedStyle(parent);
                const overflowY = style.overflowY;
                const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight;

                if (isScrollable) {
                    return parent;
                }
                parent = parent.parentElement;
            }
        }

        const potentialScrollers = document.querySelectorAll('main, unknown-scroller, infinite-scroller');
        for (let el of potentialScrollers) {
            if (el.clientWidth > 500 && (getComputedStyle(el).overflowY === 'auto' || getComputedStyle(el).overflowY === 'scroll')) {
                return el;
            }
        }
        return document.documentElement;
    }

    parse() {
        const title = document.title || "Gemini Chat";
        const messages = [];
        const seenTexts = new Set(); // Deduplication

        // Method 1: Conversation containers
        const containers = document.querySelectorAll('.conversation-container');

        containers.forEach(container => {
            const userQueryEl = container.querySelector('.query-text, user-query, .user-query-content');
            if (userQueryEl) {
                const userContent = this.extractTextContent(userQueryEl);
                if (userContent && userContent.length > 3 && !seenTexts.has(userContent)) {
                    seenTexts.add(userContent);

                    // Extract images from user message
                    const images = this.extractImages(userQueryEl);
                    const content = images.length > 0
                        ? userContent + '\n\n' + images.join('\n')
                        : userContent;

                    messages.push({ role: "User", content, time: "" });
                }
            }

            const modelResponseEl = container.querySelector('model-response, .model-response-text, message-content');
            if (modelResponseEl) {
                const modelContent = this.extractTextContent(modelResponseEl);
                if (modelContent && modelContent.length > 3 && !seenTexts.has(modelContent)) {
                    seenTexts.add(modelContent);

                    // Extract images and code from response
                    const images = this.extractImages(modelResponseEl);
                    const codeBlocks = this.extractCodeBlocks(modelResponseEl);

                    let content = modelContent;
                    if (codeBlocks.length > 0) {
                        content += '\n\n' + this.formatCodeBlocksMarkdown(codeBlocks);
                    }
                    if (images.length > 0) {
                        content += '\n\n' + images.join('\n');
                    }

                    messages.push({ role: "Gemini", content, time: "" });
                }
            }
        });

        // Method 2: Fallback - direct element search
        if (messages.length === 0) {
            const fallbackMsgs = document.querySelectorAll('user-query, model-response, .query-text, .model-response-text');
            fallbackMsgs.forEach(el => {
                const role = (el.tagName === 'USER-QUERY' || el.classList.contains('query-text')) ? "User" : "Gemini";
                const content = this.extractTextContent(el);
                if (content && content.length > 3 && !seenTexts.has(content)) {
                    seenTexts.add(content);
                    messages.push({ role, content, time: "" });
                }
            });
        }

        // Method 3: Generic fallback - look for any message-like elements
        if (messages.length === 0) {
            const genericEls = document.querySelectorAll('[class*="message"], [class*="query"], [class*="response"]');
            let isUser = true;
            genericEls.forEach(el => {
                const content = this.extractTextContent(el);
                if (content && content.length > 10 && !seenTexts.has(content)) {
                    seenTexts.add(content);
                    messages.push({ role: isUser ? "User" : "Gemini", content, time: "" });
                    isUser = !isUser;
                }
            });
        }

        console.log(`GeminiParser: Captured ${messages.length} messages.`);
        return { title, date: new Date().toLocaleString(), messages };
    }
}
window.GeminiParser = GeminiParser;
