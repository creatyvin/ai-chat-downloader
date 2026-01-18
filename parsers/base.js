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

    // Extract clean text content from an element
    extractTextContent(element) {
        if (!element) return '';

        // Clone to avoid modifying original
        const clone = element.cloneNode(true);

        // Remove script, style, and hidden elements
        clone.querySelectorAll('script, style, [hidden], [aria-hidden="true"], svg').forEach(el => el.remove());

        // Get text content
        let text = clone.textContent || clone.innerText || '';

        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    }

    // Extract images as markdown
    extractImages(element) {
        if (!element) return [];

        const images = [];
        element.querySelectorAll('img').forEach(img => {
            const src = img.src || img.dataset.src;
            const alt = img.alt || img.title || 'image';
            if (src && !src.startsWith('data:image/svg')) {
                images.push(`![${alt}](${src})`);
            }
        });

        return images;
    }

    // Extract links as markdown
    extractLinks(element) {
        if (!element) return [];

        const links = [];
        const seenUrls = new Set();

        element.querySelectorAll('a[href]').forEach(link => {
            const href = link.href;
            const text = link.textContent.trim();

            // Skip empty, anchor, or javascript links
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            // Skip duplicates
            if (seenUrls.has(href)) return;

            seenUrls.add(href);
            links.push({ text: text || href, url: href });
        });

        return links;
    }

    // Extract code blocks with language detection
    extractCodeBlocks(element) {
        if (!element) return [];

        const codeBlocks = [];

        element.querySelectorAll('pre code, pre').forEach(block => {
            const codeEl = block.tagName === 'PRE' ? block.querySelector('code') || block : block;
            const code = codeEl.textContent.trim();

            if (!code || code.length < 10) return;

            // Try to detect language from class
            const langMatch = codeEl.className.match(/language-(\w+)/);
            const lang = langMatch ? langMatch[1] : '';

            codeBlocks.push({ lang, code });
        });

        return codeBlocks;
    }

    // Format code blocks as markdown
    formatCodeBlocksMarkdown(codeBlocks) {
        return codeBlocks.map(block =>
            `\`\`\`${block.lang}\n${block.code}\n\`\`\``
        ).join('\n\n');
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
