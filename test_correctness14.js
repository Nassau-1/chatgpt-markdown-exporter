import fs from 'fs';
import { JSDOM } from 'jsdom';

const codeOrig = fs.readFileSync('src/lib/exporter-core.js', 'utf-8');

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


function evaluate(code) {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const window = dom.window;

  const mockGlobal = {
    Node: window.Node,
    Element: window.Element,
  };

  const fn = new Function('globalThis', 'Node', 'Element', code);
  fn(mockGlobal, window.Node, window.Element);

  return { exporter: mockGlobal.ChatGPTMarkdownExporter, window };
}

const orig = evaluate(codeOrig);
const mod = evaluate(codeMod);

function buildDoc(window) {
    const documentRoot = window.document;
    const msgContainer = documentRoot.createElement('div');
    msgContainer.setAttribute('data-message-author-role', 'assistant');

    const content = documentRoot.createElement('div');
    content.className = 'prose';

    content.innerHTML = `
    <p>First paragraph with   some spaces
    and a newline.</p>
    <blockquote>
      <p>A quoted paragraph</p>
      <p>Another quoted paragraph</p>
    </blockquote>
    <ul>
      <li>Item 1</li>
      <li>Item 2
        <ul><li>Nested</li></ul>
      </li>
    </ul>
    <table>
      <tr><th>Header 1</th><th>Header 2</th></tr>
      <tr><td>Cell 1</td><td>Cell 2\n\nwith spaces</td></tr>
    </table>
    <pre><code class="language-js">console.log("hello");</code></pre>
    <p>Inline <code>code</code> and <a href="https://example.com">link</a></p>
    `;
    msgContainer.appendChild(content);
    documentRoot.body.appendChild(msgContainer);
    return documentRoot;
}

const resOrig = orig.exporter.exportConversation(buildDoc(orig.window)).markdown;
console.log("=== ORIG ===");
console.log(JSON.stringify(resOrig));

const resMod = mod.exporter.exportConversation(buildDoc(mod.window)).markdown;
console.log("=== MOD ===");
console.log(JSON.stringify(resMod));

console.log("=== MATCH? ===");
console.log(resOrig === resMod);
