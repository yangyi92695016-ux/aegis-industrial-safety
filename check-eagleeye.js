// 粗检 eagleeye-safety.html 标签配对 + 内嵌 JS 语法
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/eagleeye-safety.html', 'utf8');
let ok = true;
for (const t of ['section', 'div', 'svg', 'form', 'header', 'footer', 'aside', 'style', 'script']) {
  const open = (html.match(new RegExp('<' + t + '[\\s>]', 'g')) || []).length;
  const close = (html.match(new RegExp('</' + t + '>', 'g')) || []).length;
  if (open !== close) { console.log('MISMATCH <' + t + '> open:' + open + ' close:' + close); ok = false; }
}
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
scripts.forEach(s => new Function(s[1]));
console.log(ok ? 'ALL TAGS BALANCED' : 'TAG ISSUES FOUND');
console.log('inline scripts:', scripts.length, '· JS syntax OK ·', html.length, 'bytes');
