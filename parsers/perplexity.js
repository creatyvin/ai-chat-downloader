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
            // Perplexity queries often have specific font classes or are in headers
            const qEl = block.querySelector('h1, h2, .font-display, [class*="font-semibold"]');
            // Find AI Answer
            const aEl = block.querySelector('.prose, [class*="prose"]');

            if (qEl) {
                const text = qEl.innerText.trim();
                // Filter: reasonably long, not a button, not seen
                if (text.length > 4 && !seenTexts.has(text) && !text.includes('Related') && !text.includes('Share')) {
                    messages.push({ role: "User", content: text, time: "" });
                    seenTexts.add(text);
                }
            }

            if (aEl) {
                // Use textContent to get hidden accordion text if innerText is empty or truncated
                const text = aEl.innerText.trim() || aEl.textContent.trim();
                if (text.length > 0 && !seenTexts.has(text)) {
                    messages.push({ role: "Perplexity", content: text, time: "" });
                    seenTexts.add(text);
                }
            }
        });

        // Fallback: If we missed things in the middle (lazy loading or weird DOM)
        // just grab ALL prose blocks that weren't seen
        const allProse = document.querySelectorAll('.prose');
        allProse.forEach(p => {
            const text = p.innerText.trim() || p.textContent.trim();
            if (text && !seenTexts.has(text)) {
                messages.push({ role: "Perplexity (Recovered)", content: text, time: "" });
                seenTexts.add(text);
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
