// Forbidden characters in folder names
const FORBIDDEN_CHARS = /[<>:"/\\|?*]/g;

// Validate folder name
function validateFolder(folder) {
    if (!folder || folder.trim() === '') {
        return { valid: true, sanitized: 'AI_Chats' };
    }

    const sanitized = folder.replace(FORBIDDEN_CHARS, '').trim();

    if (sanitized !== folder) {
        return {
            valid: false,
            sanitized,
            error: 'Removed forbidden characters: < > : " / \\ | ? *'
        };
    }

    if (sanitized.length > 50) {
        return {
            valid: false,
            sanitized: sanitized.substring(0, 50),
            error: 'Folder name too long (max 50 characters)'
        };
    }

    return { valid: true, sanitized };
}

// Show status message
function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status status-${type}`;

    if (type === 'success') {
        setTimeout(() => {
            status.textContent = '';
            status.className = 'status';
        }, 2000);
    }
}

// Save options
function saveOptions() {
    const folderInput = document.getElementById('folder');
    const folder = folderInput.value;

    const validation = validateFolder(folder);

    if (!validation.valid) {
        folderInput.value = validation.sanitized;
        showStatus(validation.error, 'warning');
    }

    chrome.storage.sync.set({
        downloadFolder: validation.sanitized
    }, () => {
        if (chrome.runtime.lastError) {
            showStatus('Error saving settings', 'error');
        } else {
            showStatus('Settings saved!', 'success');
        }
    });
}

// Restore options
function restoreOptions() {
    chrome.storage.sync.get({
        downloadFolder: 'AI_Chats'
    }, (items) => {
        document.getElementById('folder').value = items.downloadFolder;
    });
}

// Live validation on input
function setupLiveValidation() {
    const folderInput = document.getElementById('folder');

    folderInput.addEventListener('input', () => {
        const validation = validateFolder(folderInput.value);
        const inputContainer = folderInput.parentElement;

        if (!validation.valid) {
            folderInput.classList.add('input-warning');
        } else {
            folderInput.classList.remove('input-warning');
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    setupLiveValidation();
});

document.getElementById('save').addEventListener('click', saveOptions);

// Save on Enter key
document.getElementById('folder').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveOptions();
    }
});
