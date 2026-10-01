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
// Exercise the real game entry handlers: no start event may retain a blank URL ID.
const game=fs.readFileSync('cyberball/ThrowCatch_fix28.html','utf8');
const init=game.slice(game.indexOf('setCtx("setup","");\nPANAS.order'),game.indexOf('const PRE='));
const branches=game.slice(game.indexOf('  if(p.type==="prolific_id")'),game.indexOf('  else if(p.type==="text")'));
const events=[],nodes={measureBody:{innerHTML:''},prolificId:{value:''}},meta={pid:'',study:'study',session:'session'};
const context=vm.createContext({ISFProlific:p,META:meta,CONFIG:{contactEmail:'test',version:'test',idleMs:10000},state:{},CONDITIONS:{A:{label:'test'}},COND:'A',PANAS:{items:[1,2]},window:{innerWidth:1200,innerHeight:800},esc:String,setCtx(){},shuffle:a=>a,qa:()=>[],$:id=>nodes[id],header(){},logRow:row=>events.push({pid:meta.pid,...row})});
vm.runInContext(init+'\nfunction renderEntry(p){'+branches+'}\nvar page={type:"prolific_id"};renderEntry(page);',context);
assert.equal(events.length,0);assert.ok(vm.runInContext('page.validate()',context));
nodes.prolificId.value='  TEST_MANUAL_ID  ';assert.equal(vm.runInContext('page.validate()',context),null);
vm.runInContext('page={type:"welcome"};renderEntry(page);page.commit();',context);
assert.deepEqual(events.map(e=>[e.event,e.pid]),[['study_start','TEST_MANUAL_ID'],['consent','TEST_MANUAL_ID']]);
console.log('PASS manual first-screen ID is attached to both initial game events');
