#!/usr/bin/env node
// Runefall: checks the game scripts after an edit.
//  - every file in www/js parses (node --check)
//  - www/js/load.js lists every .js file under www/js exactly once, and nothing that is missing
// Run: node scripts/check-js.js
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const JS = path.join(__dirname, '..', 'www', 'js');
const walk = d => fs.readdirSync(d, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const all = walk(JS).filter(f => f.endsWith('.js')).map(f => path.relative(JS, f).split(path.sep).join('/'));
const load = fs.readFileSync(path.join(JS, 'load.js'), 'utf8');
const listed = [...load.slice(load.indexOf('RUNEFALL_FILES'), load.indexOf('];')).matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
let bad = 0;
for(const f of all){
  try{ execFileSync(process.execPath, ['--check', path.join(JS, f)], {stdio:'pipe'}); }
  catch(e){ bad++; console.log('SYNTAX ERROR in', f + '\n' + String(e.stderr).trim() + '\n'); }
}
for(const f of listed) if(!all.includes(f)){ bad++; console.log('load.js lists a missing file:', f); }
for(const f of all) if(f!=='load.js' && !listed.includes(f)){ bad++; console.log('not in load.js (will never run):', f); }
const dup = listed.filter((f, i) => listed.indexOf(f) !== i); if(dup.length){ bad++; console.log('listed twice in load.js:', dup.join(', ')); }
// Warn about code hidden behind a mid-line // comment (statements written after it never run)
const hidden = /(\b(p|e|g|t|room|player|f)\.\w+\s*(=|\+=|-=|\*=)\s*[^=\s][^;]*;)|(\bconst \w+ = [^;]+;)/;
for(const f of all){
  fs.readFileSync(path.join(JS, f), 'utf8').split('\n').forEach((l, i)=>{
    let q = null, idx = -1;
    for(let j=0;j<l.length;j++){ const ch = l[j];
      if(q){ if(ch==='\\'){ j++; continue; } if(ch===q) q = null; }
      else if(ch==="'" || ch==='"' || ch==='`') q = ch;
      else if(ch==='/' && l[j+1]==='/' && l[j-1]!==':'){ idx = j; break; } }
    if(idx<0 || !l.slice(0, idx).trim()) return;
    const com = l.slice(idx+2);
    if(hidden.test(com) && !/\b(was|e\.g\.|i\.e\.|see|like|so|when|if you|means|instead)\b/.test(com.split(';')[0].slice(0, 60)))
      console.log('WARNING ' + f + ':' + (i+1) + ' code after a // comment never runs: ' + com.trim().slice(0, 100));
  });
}
console.log(bad ? bad + ' problem(s)' : 'OK: ' + all.length + ' files');
process.exit(bad ? 1 : 0);
