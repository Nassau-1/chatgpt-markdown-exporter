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

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const window = dom.window;
const documentRoot = window.document;

const d = documentRoot.createElement('div');
d.innerHTML = `<p>hello</p>`;
console.log(orig.exporter.renderElementChildren(d));
