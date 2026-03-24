(function attachContentScript(globalScope) {
  const exporter = globalScope.ChatGPTMarkdownExporter;
  const COMPOSER_SELECTORS = [
    "form textarea",
    "form div[contenteditable='true'][role='textbox']",
    "form div[contenteditable='true'][data-lexical-editor='true']",
    "textarea[placeholder*='Message']",
    "div[contenteditable='true'][role='textbox']",
    "div[contenteditable='true'][data-lexical-editor='true']"
  ];

  if (!exporter) {
    console.error("ChatGPT Markdown Exporter failed to initialize its core library.");
    return;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.type) {
      return undefined;
    }

    try {
      if (message.type === "EXPORT_MARKDOWN") {
        const result = exporter.exportConversation(document, message.options || {});
        sendResponse({ ok: true, ...result });
        return true;
      }

      if (message.type === "PREPARE_MEMORY_EXPORT_PROMPT") {
        const result = prepareMemoryExportPrompt(document, message.prompt);
        sendResponse({ ok: true, ...result });
        return true;
      }

      return undefined;
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown export failure."
      });
    }

    return true;
  });

  function prepareMemoryExportPrompt(documentRoot, prompt) {
    const normalizedPrompt = String(prompt || "").trim();
    if (!normalizedPrompt) {
      throw new Error("The memory export prompt is empty.");
    }

    const composer = findComposer(documentRoot);
    if (!composer) {
      throw new Error("Open a blank ChatGPT chat with an empty composer before preparing the prompt.");
    }

    if (!isComposerEmpty(composer)) {
      throw new Error("The ChatGPT composer already contains text. Open a blank chat or clear the draft first.");
    }

    insertPrompt(composer, normalizedPrompt);
    return { prepared: true };
  }

  function findComposer(documentRoot) {
    const seen = new Set();
    const candidates = [];

    for (const selector of COMPOSER_SELECTORS) {
      for (const element of documentRoot.querySelectorAll(selector)) {
        if (seen.has(element) || !isVisible(element)) {
          continue;
        }

        seen.add(element);
        candidates.push(element);
      }
    }

    candidates.sort((left, right) => {
      const leftRect = left.getBoundingClientRect();
      const rightRect = right.getBoundingClientRect();
      return rightRect.top - leftRect.top;
    });

    return candidates[0] || null;
  }

  function isVisible(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const style = globalScope.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function isComposerEmpty(element) {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return element.value.trim() === "";
    }

    return (element.textContent || "").trim() === "";
  }

  function insertPrompt(element, prompt) {
    element.focus();

    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      setFormControlValue(element, prompt);
      return;
    }

    insertIntoContentEditable(element, prompt);
  }

  function setFormControlValue(element, value) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

    if (descriptor?.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function insertIntoContentEditable(element, value) {
    const documentRoot = element.ownerDocument;
    const selection = documentRoot.getSelection();
    const range = documentRoot.createRange();

    range.selectNodeContents(element);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const inserted = typeof documentRoot.execCommand === "function" && documentRoot.execCommand("insertText", false, value);
    if (!inserted) {
      element.textContent = value;
    }

    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: value,
        inputType: "insertText"
      })
    );
  }
})(globalThis);
