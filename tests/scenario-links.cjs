const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const config=fs.readFileSync('scenarios/config.js','utf8'),items=fs.readFileSync('scenarios/items.js','utf8');
const app=fs.readFileSync('scenarios/app.js','utf8').split("if(DEBUG&&q.get('banner')")[0];
function plan(search,seed){let n=seed;const math=Object.create(Math);math.random=()=>{n=(n*16807)%2147483647;return n/2147483647;};const window={};const ctx=vm.createContext({window,Math:math,URLSearchParams,location:{search},navigator:{userAgent:'unit'},document:{getElementById(){return{}}}});vm.runInContext(config+'\n'+items+'\n'+app+'window.result={cond:D.cond,required:CONFIG.requireAnswers!==false};})();',ctx);return JSON.parse(JSON.stringify(window.result));}
for(const half of ['X','Y']){const a=plan('?debug=1&half='+half,3),b=plan('?debug=1&half='+half,91);assert.deepEqual(a,b);assert.equal(a.cond.clearPlan.length,16);assert.equal(a.cond.ambPlan.length,16);assert.equal(a.cond.order,0);console.log('PASS fixed review link '+half+' has deterministic order and variants');}
const a=plan('',3),b=plan('',91);assert.notDeepEqual(a.cond,b.cond);assert.equal(a.required,true);console.log('PASS participant route keeps random allocation and required answers');
assert.equal(plan('?debug=1&half=X&order=3',3).cond.order,3);console.log('PASS explicit review counterbalancing override retained');
