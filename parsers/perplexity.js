class PerplexityParser extends (window.ChatParser || Object) {
    constructor() {
        super();
        this.skipScroll = false;
        this.scrollDirection = 'up'; // Corrected to 'up' to load history
        this.maxScrollAttempts = 50; // Increased even more
        this.maxNoChangeAttempts = 5;
        this.scrollDelayMs = 900; // Slightly slower for more reliable lazy loading
    }

    getScrollContainer() {
        // Strategy 1: Find a known message element and traverse up to its scrollable parent
        const probe = document.querySelector('.prose, [class*="prose"], h1, h2');
        if (probe) {
            let parent = probe.parentElement;
            while (parent && parent !== document.body) {
                const style = window.getComputedStyle(parent);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
                    console.log("PerplexityParser: Detected custom scroll container.");
                    return parent;
                }
                parent = parent.parentElement;
            }
        }

        // Strategy 2: Perplexity main scrollable area is often in main
        const main = document.querySelector('main');
        if (main) {
            const scrollers = main.querySelectorAll('div[class*="overflow-y-auto"]');
            if (scrollers.length > 0) return scrollers[scrollers.length - 1];
        }
        return window;
    }

    parse() {
        console.log("PerplexityParser: Starting structural parse...");
        const title = document.title;
        const messages = [];
        const seenTexts = new Set();

        // Strategy:
        // Iterate through major semantic blocks (groups/sections)
        // to maintain order and structure.
        const blocks = document.querySelectorAll('.group, section, [class*="pb-"], [class*="mb-"]');

        blocks.forEach(block => {
            // Find User Query
            const qEl = block.querySelector('h1, h2, .font-display, [class*="font-semibold"]');
            // Find AI Answer
            const aEl = block.querySelector('.prose, [class*="prose"]');

            if (qEl) {
                const text = this.extractTextContent(qEl);
                // Filter: reasonably long, not a button, not seen
                if (text.length > 4 && !seenTexts.has(text) && !text.includes('Related') && !text.includes('Share')) {
                    seenTexts.add(text);

                    // Extract images from query
                    const images = this.extractImages(qEl);
                    const content = images.length > 0 ? text + '\n\n' + images.join('\n') : text;

                    messages.push({ role: "User", content, time: "" });
                }
            }

            if (aEl) {
                const text = this.extractTextContent(aEl);
                if (text.length > 0 && !seenTexts.has(text)) {
                    seenTexts.add(text);

                    // Extract images, code, and links from answer
                    const images = this.extractImages(aEl);
                    const codeBlocks = this.extractCodeBlocks(aEl);
                    const links = this.extractLinks(aEl);

                    let content = text;
                    if (codeBlocks.length > 0) {
                        content += '\n\n' + this.formatCodeBlocksMarkdown(codeBlocks);
                    }
                    if (images.length > 0) {
                        content += '\n\n' + images.join('\n');
                    }
                    if (links.length > 0) {
                        content += '\n\n**Sources:**\n' + links.map(l => `- [${l.text}](${l.url})`).join('\n');
                    }

                    messages.push({ role: "Perplexity", content, time: "" });
                }
            }
        });

        // Fallback: If we missed things in the middle (lazy loading or weird DOM)
        const allProse = document.querySelectorAll('.prose');
        allProse.forEach(p => {
            const text = this.extractTextContent(p);
            if (text && !seenTexts.has(text)) {
                seenTexts.add(text);

                const codeBlocks = this.extractCodeBlocks(p);
                let content = text;
                if (codeBlocks.length > 0) {
                    content += '\n\n' + this.formatCodeBlocksMarkdown(codeBlocks);
                }

                messages.push({ role: "Perplexity (Recovered)", content, time: "" });
            }
        });

        // Ensure title-based question if the first message isn't User
        if (messages.length > 0 && messages[0].role !== "User") {
            const cleanTitle = title.split(' - ')[0].trim();
            if (!seenTexts.has(cleanTitle)) {
                messages.unshift({ role: "User", content: cleanTitle, time: "Initial Query" });
            }
        }

        console.log(`PerplexityParser: Captured ${messages.length} messages.`);
        return { title, date: new Date().toLocaleString(), messages };
    }
}
window.PerplexityParser = PerplexityParser;
