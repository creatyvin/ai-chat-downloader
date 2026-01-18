// Base class for all chat parsers
class ChatParser {
    constructor() {
        this.data = [];
    }

    // Returns the scrollable DOM element for this chat interface
    getScrollContainer() {
        return window; // Default to window if no specific container
    }

    parse() {
        throw new Error("Method 'parse()' must be implemented.");
    }

    formatMarkdown(parsedData) {
        const { title, date, messages } = parsedData;
        let md = `# ${title}\n\n`;
        md += `**Date:** ${date}\n\n`;
        md += `---\n\n`;

        messages.forEach(msg => {
            md += `### ${msg.role} ${msg.time ? `(${msg.time})` : ''}\n\n`;
            md += `${msg.content}\n\n`;
            md += `---\n\n`;
        });

        return md;
    }
}
window.ChatParser = ChatParser;

// Global factory to get the correct parser for the current URL
window.getParser = function (url) {
    console.log("Detecting parser for URL:", url);
    if (url.includes('chatgpt.com')) return new window.ChatGPTParser();
    if (url.includes('claude.ai')) return new window.ClaudeParser();
    if (url.includes('gemini.google.com')) return new window.GeminiParser();
    if (url.includes('perplexity.ai')) return new window.PerplexityParser();
    if (url.includes('x.com')) return new window.GrokParser();
    if (url.includes('deepseek.com')) return new window.DeepSeekParser();

    return null;
};
