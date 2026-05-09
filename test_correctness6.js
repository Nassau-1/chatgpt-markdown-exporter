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

  const codeWithExport = code.replace(
      'exportConversation,',
      'exportConversation, renderNode, renderElementChildren, finishDocument,'
  );

  const fn = new Function('globalThis', 'Node', 'Element', codeWithExport);
  fn(mockGlobal, window.Node, window.Element);

  return { exporter: mockGlobal.ChatGPTMarkdownExporter, window };
}

const orig = evaluate(codeOrig);

// It fails because Node and Element aren't the window ones
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const window = dom.window;
const documentRoot = window.document;

const d = documentRoot.createElement('div');
d.innerHTML = `<p>hello</p>`;

// Let's use the window of the original evaluation
const d2 = orig.window.document.createElement('div');
d2.innerHTML = `<p>hello</p>`;
console.log(JSON.stringify(orig.exporter.renderElementChildren(d2)));
console.log(JSON.stringify(orig.exporter.renderNode(d2.firstElementChild)));
