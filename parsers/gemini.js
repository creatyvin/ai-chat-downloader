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
        let messages = [];

        const containers = document.querySelectorAll('.conversation-container');

        containers.forEach(container => {
            const userQueryEl = container.querySelector('.query-text, user-query, .user-query-content');
            if (userQueryEl) {
                const userContent = userQueryEl.innerText.trim();
                if (userContent) {
                    messages.push({
                        role: "User",
                        content: userContent,
                        time: ""
                    });
                }
            }

            const modelResponseEl = container.querySelector('model-response, .model-response-text, message-content');
            if (modelResponseEl) {
                const modelContent = modelResponseEl.innerText.trim();
                if (modelContent) {
                    messages.push({
                        role: "Gemini",
                        content: modelContent,
                        time: ""
                    });
                }
            }
        });

        if (messages.length === 0) {
            const fallbackMsgs = document.querySelectorAll('user-query, model-response, .query-text, .model-response-text');
            fallbackMsgs.forEach(el => {
                const role = (el.tagName === 'USER-QUERY' || el.classList.contains('query-text')) ? "User" : "Gemini";
                const content = el.innerText.trim();
                if (content) messages.push({ role, content, time: "" });
            });
        }

        return { title, date: new Date().toLocaleString(), messages };
    }
}
window.GeminiParser = GeminiParser;
