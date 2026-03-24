(function attachContentScript(globalScope) {
  const exporter = globalScope.ChatGPTMarkdownExporter;

  if (!exporter) {
    console.error("ChatGPT Markdown Exporter failed to initialize its core library.");
    return;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "EXPORT_MARKDOWN") {
      return undefined;
    }

    try {
      const result = exporter.exportConversation(document, message.options || {});
      sendResponse({ ok: true, ...result });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown export failure."
      });
    }

    return true;
  });
})(globalThis);
