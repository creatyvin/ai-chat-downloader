// ClaudeParser moved to parsers/claude.js

class GrokParser extends (window.ChatParser || Object) {
    getScrollContainer() { return window; }
    parse() {
        const title = document.title;
        const messages = [];
        const messageDivs = document.querySelectorAll('[data-testid="messageEntry"]');
        messageDivs.forEach(div => {
            const content = div.innerText;
            const role = content.startsWith("Grok") ? "Grok" : "User";
            messages.push({ role, content, time: "" });
        });
        return { title, date: new Date().toLocaleString(), messages };
    }
}
window.GrokParser = GrokParser;

class DeepSeekParser extends (window.ChatParser || Object) {
    getScrollContainer() { return document.querySelector('#root > div > div > div[class*="overflow"]') || document.body; }
    parse() {
        const title = document.title || "DeepSeek Chat";
        const messages = [];
        const bubbles = document.querySelectorAll('.message-bubble, .chat-message');
        if (bubbles.length === 0) {
            const main = document.querySelector('main');
            if (main) {
                messages.push({ role: "System", content: "Could not detect individual messages. Dump:\n" + main.innerText, time: "" });
            }
        } else {
            bubbles.forEach(b => {
                const isUser = b.classList.contains('user') || b.classList.contains('me');
                const role = isUser ? "User" : "DeepSeek";
                messages.push({ role, content: b.innerText, time: "" });
            });
        }
        return { title, date: new Date().toLocaleString(), messages };
    }
}
window.DeepSeekParser = DeepSeekParser;
