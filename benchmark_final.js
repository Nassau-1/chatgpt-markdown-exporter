import fs from 'fs';
import { JSDOM } from 'jsdom';

function runBench(code) {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const window = dom.window;

  const mockGlobal = {
    Node: window.Node,
    Element: window.Element,
  };

  const fn = new Function('globalThis', 'Node', 'Element', code);
  fn(mockGlobal, window.Node, window.Element);

  const { exportConversation } = mockGlobal.ChatGPTMarkdownExporter;

  const documentRoot = window.document;

  for (let i = 0; i < 200; i++) {
    const msgContainer = documentRoot.createElement('div');
    msgContainer.setAttribute('data-message-author-role', i % 2 === 0 ? 'user' : 'assistant');

    const content = documentRoot.createElement('div');
    content.className = 'prose';

    for (let j = 0; j < 5; j++) {
      const p = documentRoot.createElement('p');
      p.textContent = `Paragraph ${j} of message ${i}. Some text to process. `.repeat(10);

      if (j === 2) {
        const bq = documentRoot.createElement('blockquote');
        bq.textContent = 'This is a quote\nwith newlines\n\r\nand stuff.';
        p.appendChild(bq);
      }

      if (j === 4) {
        const a = documentRoot.createElement('a');
        a.href = "https://example.com";
        a.textContent = "Link text";
        p.appendChild(a);
      }

      content.appendChild(p);
    }

    msgContainer.appendChild(content);
    documentRoot.body.appendChild(msgContainer);
  }

  // Warm up
  for (let i=0; i<3; i++) exportConversation(documentRoot);

  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    exportConversation(documentRoot);
  }
  const end = performance.now();

  return end - start;
}

const codeOrig = fs.readFileSync('src/lib/exporter-core.js', 'utf-8');
const origTime = runBench(codeOrig);

const codeMod = codeOrig
  .replace(/finishDocument\(renderElementChildren\(node\)\)\.trim\(\)/g, 'renderElementChildren(node).trim()')
  .replace(/finishDocument\(renderElementChildren\(cell\)\)/g, 'renderElementChildren(cell)')
  .replace(/finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\s\*\\n\\s\*\/g, " "\)\)\.trim\(\)/g, 'proseChunks.join("").replace(/\\s*\\n\\s*/g, " ").trim()')
  .replace(/if \(node\.nodeType === Node\.TEXT_NODE\) \{\s+return protectMarkdown\(node\.textContent \|\| ""\);\s+\}/,
    `if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent || "";
      if (!text.trim() && text.includes("\\n")) {
        return "";
      }
      return protectMarkdown(text);
    }`)
  .replace(/const caption = finishDocument\(renderElementChildren\(node\)\)\.trim\(\) \|\| squashText\(node\.textContent \|\| ""\);/, 'const caption = renderElementChildren(node).trim() || squashText(node.textContent || "");')
  .replace(/return finishDocument\(renderElementChildren\(cell\)\)\.replace\(\/\\\\s\*\\\\n\+\\\\s\*\/\g, " "\)\.trim\(\) \|\| " ";/g, 'return renderElementChildren(cell).replace(/\\s*\\n+\\s*/g, " ").trim() || " ";')
  .replace(/const lineBody = finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\\\s\*\\\\n\\\\s\*\/\g, " "\)\)\.trim\(\) \|\| "\[Empty item\]";/, 'const lineBody = proseChunks.join("").replace(/\\s*\\n\\s*/g, " ").trim() || "[Empty item]";');

const modTime = runBench(codeMod);

console.log(`Original Time: ${origTime.toFixed(2)} ms`);
console.log(`Optimized Time: ${modTime.toFixed(2)} ms`);
