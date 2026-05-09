import fs from 'fs';
import { JSDOM } from 'jsdom';

const codeOrig = fs.readFileSync('src/lib/exporter-core.js', 'utf-8');

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
const mod = evaluate(codeOrig
  .replace(/finishDocument\(renderElementChildren\(node\)\)/g, 'renderElementChildren(node)')
  .replace(/finishDocument\(renderElementChildren\(cell\)\)/g, 'renderElementChildren(cell)')
  .replace(/finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\s\*\\n\\s\*\/g, " "\)\)/g, 'proseChunks.join("").replace(/\\s*\\n\\s*/g, " ")')
);

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const window = dom.window;

const quoteDoc = window.document;
const bq = quoteDoc.createElement('blockquote');
bq.innerHTML = `
      <p>A quoted paragraph</p>
      <p>Another quoted paragraph</p>
`;

function render(win, node) {
    const mockGlobal = { Node: win.Node, Element: win.Element };
    const fn = new Function('globalThis', 'Node', 'Element', codeOrig + `\nreturn renderNode(node);`);
    return fn(mockGlobal, win.Node, win.Element)(node);
}

const fnOrig = new Function('globalThis', 'Node', 'Element', 'node', codeOrig + `\nreturn renderNode(node);`);
const fnMod = new Function('globalThis', 'Node', 'Element', 'node', codeOrig
  .replace(/finishDocument\(renderElementChildren\(node\)\)\.trim\(\)/g, 'renderElementChildren(node).trim()')
  .replace(/finishDocument\(renderElementChildren\(cell\)\)/g, 'renderElementChildren(cell)')
  .replace(/finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\s\*\\n\\s\*\/g, " "\)\)\.trim\(\)/g, 'proseChunks.join("").replace(/\\s*\\n\\s*/g, " ").trim()')
 + `\nreturn renderNode(node);`);

const mockGlobal = { Node: window.Node, Element: window.Element };

console.log("=== ORIG ===");
console.log(JSON.stringify(fnOrig(mockGlobal, window.Node, window.Element, bq)));
console.log("=== MOD ===");
console.log(JSON.stringify(fnMod(mockGlobal, window.Node, window.Element, bq)));
