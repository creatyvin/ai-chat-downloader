class ChatGPTParser extends (window.ChatParser || Object) {
    constructor() {
        super();
        this.maxScrollAttempts = 30; // Max attempts if needed
        this.maxNoChangeAttempts = 2; // Stop fast if no new content
        this.scrollDelayMs = 500; // Faster scrolling for ChatGPT
    }

    getScrollContainer() {
        // Try to find the react-scroll-to-bottom container
        const scrollable = document.querySelector('[class*="react-scroll-to-bottom"] > div');
        if (scrollable) return scrollable;

        const main = document.querySelector('main');
        if (main) {
            const potential = main.querySelector('div[class*="overflow-y-auto"]');
            if (potential) return potential;
        }
        return window;
    }

    parse() {
        console.log("ChatGPTParser: Starting parse...");
        const title = document.title || "ChatGPT Chat";
        const messages = [];
        const seenTexts = new Set();

        // Direct approach: find all elements with data-message-author-role
        const turns = document.querySelectorAll('[data-message-author-role]');

        if (turns.length > 0) {
            turns.forEach(turn => {
                const role = turn.getAttribute('data-message-author-role');
                if (role === 'user' || role === 'assistant') {
                    // Look for content in markdown, prose, or text-base elements
                    const contentEl = turn.querySelector('.markdown, .prose, .text-base, .whitespace-pre-wrap');
                    const targetEl = contentEl || turn;

                    // Extract text content using base method
                    const text = this.extractTextContent(targetEl);

                    if (text && text.length > 5 && !seenTexts.has(text)) {
                        seenTexts.add(text);

                        // Extract images and code
                        const images = this.extractImages(targetEl);
                        const codeBlocks = this.extractCodeBlocks(targetEl);

                        let content = text;
                        if (codeBlocks.length > 0) {
                            content += '\n\n' + this.formatCodeBlocksMarkdown(codeBlocks);
                        }
                        if (images.length > 0) {
                            content += '\n\n' + images.join('\n');
                        }

                        messages.push({
                            role: role === 'user' ? 'User' : 'ChatGPT',
                            content,
                            time: ""
                        });
                    }
                }
            });
        }

        // Fallback: if no messages found, try article-based approach
        if (messages.length === 0) {
            const articles = document.querySelectorAll('article');
            articles.forEach(article => {
                const roleEl = article.querySelector('[data-message-author-role]');
                const role = roleEl ? roleEl.getAttribute('data-message-author-role') : null;

                if (role === 'user' || role === 'assistant') {
                    const contentEl = article.querySelector('.markdown, .prose, .text-base, .whitespace-pre-wrap');
                    const targetEl = contentEl || article;
                    const text = this.extractTextContent(targetEl);

                    if (text && text.length > 5 && !seenTexts.has(text)) {
                        seenTexts.add(text);

                        const images = this.extractImages(targetEl);
                        const codeBlocks = this.extractCodeBlocks(targetEl);

                        let content = text;
                        if (codeBlocks.length > 0) {
                            content += '\n\n' + this.formatCodeBlocksMarkdown(codeBlocks);
                        }
                        if (images.length > 0) {
                            content += '\n\n' + images.join('\n');
                        }

                        messages.push({
                            role: role === 'user' ? 'User' : 'ChatGPT',
                            content,
                            time: ""
                        });
                    }
                }
            });
        }

        console.log(`ChatGPTParser: Captured ${messages.length} messages.`);
        return { title, date: new Date().toLocaleString(), messages };
    }
}
window.ChatGPTParser = ChatGPTParser;
