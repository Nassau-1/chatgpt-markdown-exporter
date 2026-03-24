const DEFAULTS = {
  userDisplayName: "You",
  fileNamePrefix: "chatgpt"
};

const SUPPORTED_HOSTS = new Set(["chatgpt.com", "chat.openai.com"]);

const userDisplayNameInput = document.getElementById("userDisplayName");
const fileNamePrefixInput = document.getElementById("fileNamePrefix");
const exportButton = document.getElementById("exportButton");
const statusElement = document.getElementById("status");

initialize().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Failed to load popup state.");
});

async function initialize() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  userDisplayNameInput.value = stored.userDisplayName || DEFAULTS.userDisplayName;
  fileNamePrefixInput.value = stored.fileNamePrefix || DEFAULTS.fileNamePrefix;
  exportButton.addEventListener("click", handleExport);

  const tab = await getActiveTab();
  if (!isSupportedChatGPTTab(tab)) {
    setStatus("Open a conversation on chatgpt.com or chat.openai.com before exporting.");
    exportButton.disabled = true;
    return;
  }

  setStatus("Ready to export the active conversation.");
}

async function handleExport() {
  exportButton.disabled = true;
  setStatus("Building Markdown from the active conversation...");

  try {
    const options = {
      userDisplayName: userDisplayNameInput.value.trim() || DEFAULTS.userDisplayName,
      fileNamePrefix: fileNamePrefixInput.value.trim() || DEFAULTS.fileNamePrefix
    };

    await chrome.storage.sync.set(options);

    const tab = await getActiveTab();
    if (!isSupportedChatGPTTab(tab) || !tab.id) {
      throw new Error("The active tab is not a supported ChatGPT conversation.");
    }

    const response = await sendMessage(tab.id, {
      type: "EXPORT_MARKDOWN",
      options
    });

    if (!response?.ok) {
      throw new Error(response?.error || "The content script could not export this page.");
    }

    await downloadMarkdown(response.fileName, response.markdown);
    setStatus(`Saved ${response.fileName} with ${response.messageCount} exported messages.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Export failed.");
  } finally {
    exportButton.disabled = false;
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isSupportedChatGPTTab(tab) {
  if (!tab?.url) {
    return false;
  }

  try {
    const url = new URL(tab.url);
    return SUPPORTED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function sendMessage(tabId, payload) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(`${lastError.message}. Reload the ChatGPT tab and try again.`));
        return;
      }

      resolve(response);
    });
  });
}

function downloadMarkdown(fileName, markdown) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download(
      {
        url,
        filename: fileName,
        saveAs: true
      },
      (downloadId) => {
        const lastError = chrome.runtime.lastError;
        URL.revokeObjectURL(url);

        if (lastError || !downloadId) {
          reject(new Error(lastError?.message || "Chrome rejected the download request."));
          return;
        }

        resolve(downloadId);
      }
    );
  });
}

function setStatus(message) {
  statusElement.textContent = message;
}
