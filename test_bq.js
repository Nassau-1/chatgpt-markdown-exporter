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

  const fn = new Function('globalThis', 'Node', 'Element', code.replace('exportConversation,', 'exportConversation, finishDocument, renderNode, renderElementChildren,'));
  fn(mockGlobal, window.Node, window.Element);

  return { exporter: mockGlobal.ChatGPTMarkdownExporter, window };
}

const orig = evaluate(codeOrig);
const bqHtml = `
      <p>A quoted paragraph</p>
      <p>Another quoted paragraph</p>
`;
const dom = orig.window;
const div = dom.document.createElement('div');
div.innerHTML = `<blockquote>${bqHtml}</blockquote>`;
const bq = div.querySelector('blockquote');

console.log("Raw children:");
const rawChildren = orig.exporter.renderElementChildren(bq);
console.log(JSON.stringify(rawChildren));

console.log("Finished children:");
const finishedChildren = orig.exporter.finishDocument(orig.exporter.renderElementChildren(bq));
console.log(JSON.stringify(finishedChildren));

console.log("Split and joined:");
const finished = finishedChildren.trim();
console.log(JSON.stringify(`\n\n${finished.split("\n").map((line) => `> ${line}`).join("\n")}\n\n`));

console.log("Split and joined without finishDocument:");
// We need to apply something else.
const modChildren = rawChildren.replace(/(?:\n\s*){3,}/g, "\n\n").trim();
console.log(JSON.stringify(`\n\n${modChildren.split("\n").map((line) => `> ${line}`).join("\n")}\n\n`));
