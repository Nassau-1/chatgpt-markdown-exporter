import fs from 'fs';
import { JSDOM } from 'jsdom';

const codeOrig = fs.readFileSync('src/lib/exporter-core.js', 'utf-8');

const code = codeOrig
  .replace(/finishDocument\(renderElementChildren\(node\)\)\.trim\(\)/g, 'renderElementChildren(node).replace(/(?:\\n\\s*){3,}/g, "\\n\\n").trim()')
  .replace(/finishDocument\(renderElementChildren\(cell\)\)/g, 'renderElementChildren(cell).replace(/(?:\\n\\s*){3,}/g, "\\n\\n")')
  .replace(/finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\s\*\\n\\s\*\/g, " "\)\)\.trim\(\)/g, 'proseChunks.join("").replace(/\\s*\\n\\s*/g, " ").replace(/(?:\\n\\s*){3,}/g, "\\n\\n").trim()');

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

for (let i = 0; i < 50; i++) {
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
exportConversation(documentRoot);

const start = performance.now();
for (let i = 0; i < 20; i++) {
  exportConversation(documentRoot);
}
const end = performance.now();

console.log(`Optimized Time taken: ${(end - start).toFixed(2)} ms`);
