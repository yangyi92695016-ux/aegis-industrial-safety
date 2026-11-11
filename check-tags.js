// 标签配对检查（主站 + 手机 App）
const fs = require('fs');
for (const f of ['eagleeye-safety.html', 'eagleeye-app.html']) {
  const html = fs.readFileSync(__dirname + '/' + f, 'utf8');
  let ok = true;
  for (const t of ['section', 'div', 'svg', 'button', 'header', 'nav', 'main', 'aside', 'style', 'script']) {
    const o = (html.match(new RegExp('<' + t + '[\\s>]', 'g')) || []).length;
    const c = (html.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) { console.log(f, 'MISMATCH <' + t + '> open:' + o + ' close:' + c); ok = false; }
  }
  console.log(f, ok ? 'OK' : 'ISSUES');
}
