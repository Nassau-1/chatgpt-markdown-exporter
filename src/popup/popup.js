const DEFAULTS = {
  userDisplayName: "You",
  fileNamePrefix: "chatgpt"
};

const MEMORY_EXPORT_PROMPT = `I'm moving to another service and need to export my data. List every memory you have stored about me, as well as any context you've learned about me from past conversations. Output everything in a single code block so I can easily copy it. Format each entry as: [date saved, if available] - memory content. Make sure to cover all of the following - preserve my words verbatim where possible: Instructions I've given you about how to respond (tone, format, style, 'always do X', 'never do Y'). Personal details: name, location, job, family, interests. Projects, goals, and recurring topics. Tools, languages, and frameworks I use. Preferences and corrections I've made to your behavior. Any other stored context not covered above. Do not summarize, group, or omit any entries. After the code block, confirm whether that is the complete set or if any remain.`;
const SUPPORTED_HOSTS = new Set(["chatgpt.com", "chat.openai.com"]);

const userDisplayNameInput = document.getElementById("userDisplayName");
const fileNamePrefixInput = document.getElementById("fileNamePrefix");
const exportButton = document.getElementById("exportButton");
const memoryPromptButton = document.getElementById("memoryPromptButton");
const statusElement = document.getElementById("status");

initialize().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Failed to load popup state.");
});

async function initialize() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  userDisplayNameInput.value = stored.userDisplayName || DEFAULTS.userDisplayName;
  fileNamePrefixInput.value = stored.fileNamePrefix || DEFAULTS.fileNamePrefix;
  exportButton.addEventListener("click", handleExport);
  memoryPromptButton.addEventListener("click", handlePrepareMemoryPrompt);

  const tab = await getActiveTab();
  if (!isSupportedChatGPTTab(tab)) {
    setButtonsDisabled(true);
    setStatus("Open chatgpt.com or chat.openai.com before using this extension.");
    return;
  }

  setStatus("Ready to export the active conversation or prepare a memory export prompt.");
}

async function handleExport() {
  setButtonsDisabled(true);
  setStatus("Building Markdown from the active conversation...");

  try {
    const options = {
      userDisplayName: userDisplayNameInput.value.trim() || DEFAULTS.userDisplayName,
      fileNamePrefix: fileNamePrefixInput.value.trim() || DEFAULTS.fileNamePrefix
    };

    await chrome.storage.sync.set(options);

    const tab = await getSupportedTab();
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
    setButtonsDisabled(false);
  }
}

async function handlePrepareMemoryPrompt() {
  setButtonsDisabled(true);
  setStatus("Preparing the memory export prompt in the ChatGPT composer...");

  try {
    const tab = await getSupportedTab();
    const response = await sendMessage(tab.id, {
      type: "PREPARE_MEMORY_EXPORT_PROMPT",
      prompt: MEMORY_EXPORT_PROMPT
    });

    if (!response?.ok) {
      throw new Error(response?.error || "The content script could not prepare the memory export prompt.");
    }

    setStatus("Prepared the memory export prompt in the composer. Review it before sending.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Preparing the memory export prompt failed.");
  } finally {
    setButtonsDisabled(false);
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function getSupportedTab() {
  const tab = await getActiveTab();
  if (!isSupportedChatGPTTab(tab) || !tab?.id) {
    throw new Error("The active tab is not a supported ChatGPT page.");
  }

  return tab;
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

function setButtonsDisabled(disabled) {
  exportButton.disabled = disabled;
  memoryPromptButton.disabled = disabled;
}

function setStatus(message) {
  statusElement.textContent = message;
}
