import fs from 'fs';
import { JSDOM } from 'jsdom';

function profile(code) {
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
}

const codeOrig = fs.readFileSync('src/lib/exporter-core.js', 'utf-8');
profile(codeOrig);
