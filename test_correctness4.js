import fs from 'fs';
import { JSDOM } from 'jsdom';

const codeOrig = fs.readFileSync('src/lib/exporter-core.js', 'utf-8');
const codeMod = codeOrig
  .replace(/finishDocument\(renderElementChildren\(node\)\)\.trim\(\)/g, 'renderElementChildren(node).trim()')
  .replace(/finishDocument\(renderElementChildren\(cell\)\)/g, 'renderElementChildren(cell)')
  .replace(/finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\s\*\\n\\s\*\/g, " "\)\)\.trim\(\)/g, 'proseChunks.join("").replace(/\\s*\\n\\s*/g, " ").trim()');

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
const mod = evaluate(codeMod);

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const window = dom.window;
const documentRoot = window.document;

function evalNode(html) {
    const d = documentRoot.createElement('div');
    d.innerHTML = html;
    const node = d.firstElementChild;
    console.log("Input HTML:", html);
    console.log("ORIG:", JSON.stringify(orig.exporter.renderNode(node)));
    console.log("MOD: ", JSON.stringify(mod.exporter.renderNode(node)));
    console.log("MOD(finished): ", JSON.stringify(orig.exporter.finishDocument(mod.exporter.renderNode(node))));
    console.log("---");
}

evalNode(`<p>hello</p>`);
evalNode(`<p>hello   world\n\n\ntest</p>`);
evalNode(`<blockquote><p>hello</p><p>world</p></blockquote>`);
evalNode(`<ul><li>hello</li><li>world\n  with spaces</li></ul>`);
