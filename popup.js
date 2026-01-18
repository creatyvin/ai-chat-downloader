// Supported platforms
const SUPPORTED_SITES = [
    { pattern: 'chatgpt.com', name: 'ChatGPT' },
    { pattern: 'claude.ai', name: 'Claude' },
    { pattern: 'gemini.google.com', name: 'Gemini' },
    { pattern: 'perplexity.ai', name: 'Perplexity' },
    { pattern: 'x.com', name: 'Grok' },
    { pattern: 'chat.deepseek.com', name: 'DeepSeek' }
];

// Check if URL is supported
function getSupportedSite(url) {
    for (const site of SUPPORTED_SITES) {
        if (url.includes(site.pattern)) {
            return site;
        }
    }
    return null;
}

// Update UI based on current tab
async function updateStatus() {
    const siteStatus = document.getElementById('site-status');
    const downloadBtn = document.getElementById('download-btn');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url) {
            siteStatus.textContent = 'Unknown';
            siteStatus.className = 'status-value unsupported';
            downloadBtn.disabled = true;
            return;
        }

        const site = getSupportedSite(tab.url);

        if (site) {
            siteStatus.textContent = site.name;
            siteStatus.className = 'status-value supported';
            downloadBtn.disabled = false;
        } else {
            siteStatus.textContent = 'Not supported';
            siteStatus.className = 'status-value unsupported';
            downloadBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error checking tab:', error);
        siteStatus.textContent = 'Error';
        siteStatus.className = 'status-value unsupported';
        downloadBtn.disabled = true;
    }
}

// Trigger download in content script
async function triggerDownload() {
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.id) {
            // Execute the download function in content script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    if (typeof handleDownload === 'function') {
                        handleDownload();
                    } else {
                        console.error('handleDownload not found');
                    }
                }
            });

            // Close popup after triggering
            setTimeout(() => window.close(), 500);
        }
    } catch (error) {
        console.error('Error triggering download:', error);
        downloadBtn.textContent = 'Error!';
        setTimeout(() => {
            downloadBtn.textContent = 'Download Chat';
            downloadBtn.disabled = false;
        }, 2000);
    }
}

// Open settings page
function openSettings() {
    chrome.runtime.openOptionsPage();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateStatus();

    document.getElementById('download-btn').addEventListener('click', triggerDownload);
    document.getElementById('settings-btn').addEventListener('click', openSettings);
});
