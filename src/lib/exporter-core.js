(function registerThreadExporter(rootScope) {
  const BODY_CANDIDATES = ["[data-message-content]", ".prose", ".markdown", ".whitespace-pre-wrap"];
  const FALLBACK_TURN_CANDIDATES = [
    "main article",
    "main [data-testid^='conversation-turn-']",
    "main div[class*='group']"
  ];
  const PROFILE_CANDIDATES = [
    "[data-testid=\"user-menu-button\"]",
    "button[aria-label*=\"Account\"]",
    "button[aria-label*=\"account\"]",
    "button[aria-label*=\"Profile\"]",
    "button[aria-label*=\"profile\"]"
  ];
  const SPEAKER_LABELS = { assistant: "ChatGPT" };

  function exportConversation(documentRoot, options = {}) {
    const exportedOn = isoCalendarDay();
    const sourceUrl = documentRoot.location?.href || "";
    const title = deriveConversationTitle(documentRoot);
    const speakerForUser = chooseUserName(documentRoot, options.userDisplayName);
    const turns = collectTurns(documentRoot, speakerForUser);

    if (turns.length === 0) {
      throw new Error("No exportable conversation turns were detected on this page.");
    }

    const blocks = [];
    blocks.push(`# ${title}`);
    blocks.push("");
    blocks.push(`- Exported on: ${exportedOn}`);
    if (sourceUrl) {
      blocks.push(`- Source URL: ${sourceUrl}`);
    }

    for (const turn of turns) {
      blocks.push("");
      blocks.push(`## ${turn.speaker}`);
      blocks.push("");
      blocks.push(turn.markdown);
    }

    const chosenPrefix = makeSlug(options.fileNamePrefix || "chat-thread", "chat-thread");
    const chosenTitle = makeSlug(title, "conversation");

    return {
      title,
      date: exportedOn,
      fileName: `${chosenPrefix}-${chosenTitle}-${exportedOn}.md`,
      markdown: finishDocument(blocks.join("\n")),
      messageCount: turns.length
    };
  }

  function isoCalendarDay(now = new Date()) {
    return now.toISOString().slice(0, 10);
  }

  function deriveConversationTitle(documentRoot) {
    const raw = (documentRoot.title || "ChatGPT Thread").trim();
    return raw.replace(/\s*-\s*(ChatGPT|Comet)\s*$/i, "").trim() || "ChatGPT Thread";
  }

  function chooseUserName(documentRoot, preferredName) {
    const override = squashText(preferredName || "");
    if (override) {
      return override;
    }

    for (const selector of PROFILE_CANDIDATES) {
      const candidate = documentRoot.querySelector(selector);
      const text = squashText(candidate?.innerText || candidate?.textContent || "");
      if (text && text.length <= 40) {
        return text;
      }
    }

    return "You";
  }

  function collectTurns(documentRoot, userName) {
    const containers = findTurnContainers(documentRoot);
    const turns = [];

    for (const container of containers) {
      const body = pickTurnBody(container);
      if (!body) {
        continue;
      }

      const markdown = finishDocument(renderElementChildren(body)).trim();
      if (!markdown) {
        continue;
      }

      turns.push({
        speaker: turnSpeaker(container, userName),
        markdown
      });
    }

    return turns;
  }

  function findTurnContainers(documentRoot) {
    const direct = Array.from(documentRoot.querySelectorAll("[data-message-author-role]"));
    if (direct.length > 0) {
      return removeNestedEntries(direct);
    }

    const fallbacks = Array.from(documentRoot.querySelectorAll(FALLBACK_TURN_CANDIDATES.join(", ")));
    return removeNestedEntries(fallbacks.filter((entry) => pickTurnBody(entry)));
  }

  function removeNestedEntries(entries) {
    return entries.filter((entry, index) => {
      return !entries.some((other, otherIndex) => otherIndex !== index && other.contains(entry));
    });
  }

  function pickTurnBody(container) {
    if (!(container instanceof Element)) {
      return null;
    }

    for (const selector of BODY_CANDIDATES) {
      if (container.matches(selector)) {
        return container;
      }

      const nested = container.querySelector(selector);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  function turnSpeaker(container, userName) {
    const role =
      container.getAttribute?.("data-message-author-role") ||
      container.closest?.("[data-message-author-role]")?.getAttribute?.("data-message-author-role") ||
      "";

    if (role === "user") {
      return userName;
    }

    return SPEAKER_LABELS[role] || role || "Message";
  }

  function renderElementChildren(node, listDepth = 0) {
    return Array.from(node.childNodes).map((child) => renderNode(child, listDepth)).join("");
  }

  function renderNode(node, listDepth = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      return protectMarkdown(node.textContent || "");
    }

    if (!(node instanceof Element)) {
      return "";
    }

    if (node.hidden || node.getAttribute("aria-hidden") === "true") {
      return "";
    }

    const tag = node.tagName.toLowerCase();

    if (tag === "pre") {
      return renderFence(node);
    }

    if (tag === "code") {
      if (node.closest("pre")) {
        return "";
      }

      return `\`${inlineCode(node.textContent || "")}\``;
    }

    if (tag === "br") {
      return "\n";
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag.slice(1));
      const title = finishDocument(renderElementChildren(node)).trim();
      return title ? `\n\n${"#".repeat(level)} ${title}\n\n` : "";
    }

    if (tag === "p") {
      const paragraph = finishDocument(renderElementChildren(node)).trim();
      return paragraph ? `${paragraph}\n\n` : "";
    }

    if (tag === "blockquote") {
      const quoted = finishDocument(renderElementChildren(node)).trim();
      if (!quoted) {
        return "";
      }

      return `\n\n${quoted.split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
    }

    if (tag === "ul" || tag === "ol") {
      return renderList(node, listDepth);
    }

    if (tag === "a") {
      const caption = finishDocument(renderElementChildren(node)).trim() || squashText(node.textContent || "");
      const href = node.getAttribute("href");
      return href ? `[${caption}](${href})` : caption;
    }

    if (tag === "table") {
      return renderTable(node);
    }

    if (tag === "hr") {
      return "\n\n---\n\n";
    }

    if (tag === "img" || tag === "canvas" || tag === "svg") {
      const descriptor = squashText(node.getAttribute?.("alt") || "");
      return descriptor ? `[Embedded media: ${protectMarkdown(descriptor)}]` : "[Embedded media]";
    }

    return renderElementChildren(node, listDepth);
  }

  function renderFence(preNode) {
    const codeNode = preNode.querySelector("code") || preNode;
    const classTokens = codeNode.getAttribute("class") || "";
    const language = classTokens.match(/language-([\w-]+)/)?.[1] || "";
    const rawCode = normalizeForDocument(codeNode.textContent || "").replace(/\n+$/g, "");
    return `\n\n\`\`\`${language}\n${rawCode}\n\`\`\`\n\n`;
  }

  function renderList(listNode, level) {
    const ordered = listNode.tagName.toLowerCase() === "ol";
    const items = Array.from(listNode.children).filter((child) => child.tagName.toLowerCase() === "li");
    const lines = items.map((item, index) => renderListItem(item, ordered, index, level));
    return `\n${lines.join("\n")}\n\n`;
  }

  function renderListItem(itemNode, ordered, index, level) {
    const marker = ordered ? `${index + 1}.` : "-";
    const indentation = "  ".repeat(level);
    const proseChunks = [];
    const nestedLists = [];

    for (const child of Array.from(itemNode.childNodes)) {
      if (child instanceof Element && /^(ul|ol)$/i.test(child.tagName)) {
        nestedLists.push(child);
        continue;
      }

      proseChunks.push(renderNode(child, level + 1));
    }

    const lineBody = finishDocument(proseChunks.join("").replace(/\s*\n\s*/g, " ")).trim() || "[Empty item]";
    const nestedBody = nestedLists.map((entry) => renderList(entry, level + 1).trimEnd()).join("\n");

    return nestedBody
      ? `${indentation}${marker} ${lineBody}\n${nestedBody}`
      : `${indentation}${marker} ${lineBody}`;
  }

  function renderTable(tableNode) {
    const rows = Array.from(tableNode.querySelectorAll("tr")).map((row) => {
      return Array.from(row.children).map((cell) => {
        return finishDocument(renderElementChildren(cell)).replace(/\s*\n+\s*/g, " ").trim() || " ";
      });
    });

    if (rows.length === 0) {
      return "";
    }

    const header = rows[0];
    const ruler = header.map(() => "---");
    const lines = [`| ${header.join(" | ")} |`, `| ${ruler.join(" | ")} |`];

    for (const row of rows.slice(1)) {
      lines.push(`| ${row.join(" | ")} |`);
    }

    return `\n\n${lines.join("\n")}\n\n`;
  }

  function protectMarkdown(input) {
    const source = input || "";
    let escaped = "";

    for (const character of source) {
      if ("\\`*_#[]".includes(character)) {
        escaped += `\\${character}`;
      } else {
        escaped += character;
      }
    }

    return escaped;
  }

  function inlineCode(input) {
    return String(input || "").replace(/`/g, "\\`");
  }

  function normalizeForDocument(input) {
    return String(input || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n");
  }

  function squashText(input) {
    return normalizeForDocument(input).replace(/\s+/g, " ").trim();
  }

  function finishDocument(input) {
    return normalizeForDocument(input)
      .replace(/(?:\n\s*){3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }

  function makeSlug(value, fallback) {
    const cooked = String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return cooked || fallback;
  }

  rootScope.ChatGPTMarkdownExporter = {
    exportConversation,
    makeSlug
  };
})(globalThis);
