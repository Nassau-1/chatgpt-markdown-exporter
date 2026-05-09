const fs = require('fs');
let code = fs.readFileSync('src/lib/exporter-core.js', 'utf-8');
code = code.replace(/finishDocument\(renderElementChildren\(node\)\)/g, 'renderElementChildren(node)');
code = code.replace(/finishDocument\(renderElementChildren\(cell\)\)/g, 'renderElementChildren(cell)');
code = code.replace(/finishDocument\(proseChunks\.join\(""\)\.replace\(\/\\s\*\\n\\s\*\/\g, " "\)\)/g, 'proseChunks.join("").replace(/\\s*\\n\\s*/g, " ")');
fs.writeFileSync('src/lib/exporter-core-opt.js', code);
