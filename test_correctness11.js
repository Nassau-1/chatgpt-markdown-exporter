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

// We need to figure out exactly why it produces >\n>\n>      Another quoted paragraph
// Let's trace the execution of `<blockquote>`

const codeWithTrace = codeOrig.replace(
      'if (tag === "blockquote") {',
      `if (tag === "blockquote") {
         console.log("blockquote rendering...");
         console.log("children raw:", JSON.stringify(renderElementChildren(node)));
         console.log("children finished:", JSON.stringify(finishDocument(renderElementChildren(node))));
      `
);

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const window = dom.window;

const mockGlobal = { Node: window.Node, Element: window.Element };
const codeExport = codeWithTrace.replace('exportConversation,', 'exportConversation, renderNode, renderElementChildren, finishDocument,');
const fn = new Function('globalThis', 'Node', 'Element', codeExport);
fn(mockGlobal, window.Node, window.Element);
const exporter = mockGlobal.ChatGPTMarkdownExporter;

const documentRoot = window.document;
const bq = documentRoot.createElement('blockquote');
bq.innerHTML = `
      <p>A quoted paragraph</p>
      <p>Another quoted paragraph</p>
`;
console.log(exporter.renderNode(bq));
