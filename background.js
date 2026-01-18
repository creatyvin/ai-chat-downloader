chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "DOWNLOAD") {
    const { filename, content } = request.payload;

    chrome.storage.sync.get(["downloadFolder"], (result) => {
      let folder = result.downloadFolder || "AI_Chats";
      // Sanitize folder name slightly to avoid issues
      folder = folder.replace(/[<>:"/\\|?*]/g, "").trim();
      if (!folder) folder = "AI_Chats";

      const fullPath = `${folder}/${filename}`;
      const blob = new Blob([content], { type: "text/markdown" });
      const reader = new FileReader();

      reader.onload = function () {
        const url = this.result;
        chrome.downloads.download({
          url: url,
          filename: fullPath,
          saveAs: false,
          conflictAction: "uniquify"
        }, (downloadId) => {
             if (chrome.runtime.lastError) {
                 console.error("Download failed:", chrome.runtime.lastError);
                 // Fallback if folder structure fails? 
                 // Try downloading without folder if it fails maybe? 
                 // For now just logging error.
             }
        });
      };
      reader.readAsDataURL(blob);
    });
  }
});
