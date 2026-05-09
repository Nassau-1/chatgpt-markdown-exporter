import fs from 'fs';
import { JSDOM } from 'jsdom';

const codeOrig = fs.readFileSync('src/lib/exporter-core.js', 'utf-8');

const codeMod = codeOrig
  .replace(/finishDocument\(renderElementChildren\(node\)\)\.trim\(\)/g, 'renderElementChildren(node).trim()')
  .replace(/finishDocument\(renderElementChildren\(cell\)\)/g, 'renderElementChildren(cell)')
  .replace(/finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\s\*\\n\\s\*\/g, " "\)\)\.trim\(\)/g, 'proseChunks.join("").replace(/\\s*\\n\\s*/g, " ").trim()')
  .replace(/const caption = finishDocument\(renderElementChildren\(node\)\)\.trim\(\) \|\| squashText\(node\.textContent \|\| ""\);/, 'const caption = renderElementChildren(node).trim() || squashText(node.textContent || "");')
  .replace(/return finishDocument\(renderElementChildren\(cell\)\)\.replace\(\/\\\\s\*\\\\n\+\\\\s\*\/\g, " "\)\.trim\(\) \|\| " ";/g, 'return renderElementChildren(cell).replace(/\\s*\\n+\\s*/g, " ").trim() || " ";')
  .replace(/const lineBody = finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\\\s\*\\\\n\\\\s\*\/\g, " "\)\)\.trim\(\) \|\| "\[Empty item\]";/, 'const lineBody = proseChunks.join("").replace(/\\s*\\n\\s*/g, " ").trim() || "[Empty item]";')
  .replace(/const quoted = renderElementChildren\(node\)\.trim\(\);/, 'const quoted = renderElementChildren(node).replace(/(?:\\n\\s*){3,}/g, "\\n\\n").trim();');

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

function evalNode(html) {
    const d1 = orig.window.document.createElement('div');
    d1.innerHTML = html;
    const node1 = d1.firstElementChild;

    const d2 = mod.window.document.createElement('div');
    d2.innerHTML = html;
    const node2 = d2.firstElementChild;

    const origRes = orig.exporter.finishDocument(orig.exporter.renderNode(node1));
    const modRes = mod.exporter.finishDocument(mod.exporter.renderNode(node2));

    if (origRes !== modRes) {
        console.log("Input HTML:", html);
        console.log("ORIG(finished):", JSON.stringify(origRes));
        console.log("MOD(finished): ", JSON.stringify(modRes));
        console.log("MATCH?", origRes === modRes);
        console.log("---");
    }
}

evalNode(`<p>hello</p>`);
evalNode(`<p>hello   world\n\n\ntest</p>`);
evalNode(`<blockquote>\n  <p>hello</p>\n  <p>world</p>\n</blockquote>`);
evalNode(`<ul><li>hello</li><li>world\n  with spaces</li></ul>`);
evalNode(`<table><tr><td>hello</td><td>world\n\n\ntest</td></tr></table>`);
