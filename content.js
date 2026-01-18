// content.js

function createFloatingButton() {
    if (document.getElementById('ai-chat-download-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'ai-chat-download-btn';
    btn.className = 'ai-chat-downloader-btn';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
</svg>`;

    btn.addEventListener('click', handleDownload);
    document.body.appendChild(btn);
}

function downloadFallback(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadLastArtifact() {
    try {
        // Find all Download buttons in artifacts
        const downloadButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
            btn.textContent.includes('Download') ||
            btn.getAttribute('aria-label')?.includes('Download')
        );

        if (downloadButtons.length > 0) {
            // Click the last Download button (most recent artifact)
            const lastButton = downloadButtons[downloadButtons.length - 1];
            console.log('Clicking last artifact Download button...');
            lastButton.click();
        }
    } catch (error) {
        console.warn('Failed to auto-download artifact:', error);
    }
}


async function handleDownload() {
    const parser = getParser(window.location.href);
    if (!parser) {
        alert("Parser not found for this site.");
        return;
    }

    // Visual feedback on the button
    const btn = document.getElementById('ai-chat-download-btn');
    const originalIcon = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<div style="border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite;"></div>`;
        // Inject spinner style if not present
        if (!document.getElementById('ai-chat-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'ai-chat-spinner-style';
            style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
    }

    try {
        // Automatically attempt to load history unless the parser explicitly skips it
        if (!parser.skipScroll) {
            await loadFullChatHistory(parser);
        }

        const parsedData = parser.parse();
        if (!parsedData.messages || parsedData.messages.length === 0) {
            alert("No messages found. Please ensure the chat is fully loaded.");
            if (btn) {
                btn.innerHTML = originalIcon;
                btn.disabled = false;
            }
            return;
        }

        // Try to download last artifact (for Claude)
        if (window.location.href.includes('claude.ai')) {
            downloadLastArtifact();
        }

        const markdownContent = parser.formatMarkdown(parsedData);
        const safeDate = new Date().toISOString().slice(0, 10);

        // Improved filename sanitization: Allow Russian characters, but remove truly forbidden ones
        // Forbidden on most OS: / \ < > : " | ? *
        const safeTitle = parsedData.title.replace(/[\\/:*?"<>|]/g, '_').trim().substring(0, 70);
        const filename = `${safeTitle}_${safeDate}.md`;

        try {
            chrome.runtime.sendMessage({
                action: "DOWNLOAD",
                payload: {
                    filename: filename,
                    content: markdownContent
                }
            });
        } catch (err) {
            // Extension context invalidated - offer manual download
            console.warn("Extension context invalidated, using fallback download");
            downloadFallback(markdownContent, filename);
        }
    } catch (error) {
        console.error("Parsing error:", error);
        alert("Failed to parse chat. See console for details.");
    } finally {
        if (btn) {
            btn.innerHTML = originalIcon;
            btn.disabled = false;
        }
    }
}

async function loadFullChatHistory(parser) {
    const container = parser.getScrollContainer();
    if (!container) return;

    return new Promise((resolve) => {
        let lastValue = (parser.scrollDirection === 'down' ? container.scrollHeight : (container === window ? window.scrollY : container.scrollTop)) || 0;
        let attemptsOfNoChange = 0;
        const maxNoChange = parser.maxNoChangeAttempts || 5;
        const delayMs = parser.scrollDelayMs || 800;

        const direction = parser.scrollDirection || 'up';
        console.log(`Starting ${direction} scroll for history...`);

        const doScroll = () => {
            if (container === window) {
                if (direction === 'up') window.scrollBy(0, -800);
                else window.scrollBy(0, 800);
            } else {
                if (direction === 'up') {
                    container.scrollTop -= 800;
                } else {
                    container.scrollTop += 800;
                }
            }
        };

        const scroller = setInterval(() => {
            const currentValue = (direction === 'down' ? container.scrollHeight : (container === window ? window.scrollY : container.scrollTop)) || 0;

            // Check if we reached the absolute top or bottom
            const isAtTop = (direction === 'up' && currentValue <= 0);
            const isAtBottom = (direction === 'down' && container !== window && (container.scrollTop + container.clientHeight >= container.scrollHeight - 5));

            if (Math.abs(currentValue - lastValue) > 5) {
                lastValue = currentValue;
                attemptsOfNoChange = 0;
            } else {
                attemptsOfNoChange++;
            }

            const limit = parser.maxScrollAttempts || 30;
            if (isAtTop || isAtBottom || attemptsOfNoChange >= maxNoChange || attemptsOfNoChange >= limit) {
                console.log(`Scrolling finished. Reason: ${isAtTop ? 'At Top' : (isAtBottom ? 'At Bottom' : 'No Change/Limit')}`);
                clearInterval(scroller);

                // Final adjustment
                if (container === window) {
                    if (direction === 'up') window.scrollTo(0, 0);
                } else {
                    if (direction === 'up') container.scrollTop = 0;
                }

                // Extra wait for lazy items to render
                setTimeout(resolve, 500);
            } else {
                doScroll();
            }
        }, delayMs);
    });
}

// Observe URL changes to re-inject if needed (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Re-check or re-inject if button disappeared
        createFloatingButton();
    }
}).observe(document, { subtree: true, childList: true });

// Initial injection
setTimeout(createFloatingButton, 2000); // Wait a bit for page to load
