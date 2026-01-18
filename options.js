// Saves options to chrome.storage
function saveOptions() {
    const folder = document.getElementById('folder').value;
    chrome.storage.sync.set({
        downloadFolder: folder
    }, () => {
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    chrome.storage.sync.get({
        downloadFolder: 'AI_Chats'
    }, (items) => {
        document.getElementById('folder').value = items.downloadFolder;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
