const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const window={};vm.runInNewContext(fs.readFileSync('prolific.js','utf8'),{window,URL});
const p=window.ISFProlific;
assert.ok(p.validateID('  '));assert.ok(p.validateID('two IDs'));assert.equal(p.validateID('  abc123  '),null);
assert.equal(p.validateID('TEST_PROLIFIC_QA'),null);
console.log('PASS empty/invalid ID blocked; pasted ID and test IDs accepted');
assert.match(p.questionHTML('abc123'),/value="abc123"/);
assert.doesNotMatch(p.questionHTML('\"><script>alert(1)</script>'),/<script>/);
console.log('PASS URL-prefilled ID retained and escaped');
const codeOnly={completionCode:'TESTCODE'};
assert.equal(p.completionDetails(codeOnly).url,'https://app.prolific.com/submissions/complete?cc=TESTCODE');
assert.equal(p.completionDetails({completionUrl:'https://app.prolific.com/submissions/complete?cc=TESTCODE'}).code,'TESTCODE');
assert.equal(p.completionDetails({...codeOnly,completionUrl:'https://app.prolific.com/submissions/complete?cc=OTHER'}),null);
assert.equal(p.completionDetails({completionUrl:'javascript:alert(1)'}),null);
assert.equal(p.completionDetails({completionCode:''}),null);
console.log('PASS code-only and URL-only setup work; mismatched/unsafe destinations blocked');
for(const saved of [false,null,undefined]){
  const html=p.completionHTML(codeOnly,saved);assert.match(html,/disabled/);assert.doesNotMatch(html,/href=|TESTCODE/);
}
const ready=p.completionHTML(codeOnly,true);assert.match(ready,/href="https:\/\/app.prolific.com\/submissions\/complete\?cc=TESTCODE"/);assert.match(ready,/>TESTCODE<\/output>/);assert.doesNotMatch(ready,/disabled/);
console.log('PASS actual code and return link appear only after confirmed saving');
const target={innerHTML:''};p.renderCompletion(target,{},true);assert.match(target.innerHTML,/Not yet available/);assert.match(target.innerHTML,/disabled/);assert.doesNotMatch(target.innerHTML,/href=/);
p.renderCompletion(target,codeOnly,false);assert.match(target.innerHTML,/disabled/);p.renderCompletion(target,codeOnly,true);assert.doesNotMatch(target.innerHTML,/disabled/);
console.log('PASS missing-code placeholder and successful retry update');
// Compile all inline game scripts without running or changing the game.
for(const match of fs.readFileSync('cyberball/ThrowCatch_fix28.html','utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
console.log('PASS game inline scripts parse');
