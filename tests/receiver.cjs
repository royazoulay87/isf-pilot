const fs = require('node:fs'), vm = require('node:vm'), crypto = require('node:crypto'), assert = require('node:assert/strict');
// An in-memory Sheets implementation. Failure injection happens AFTER a write,
// matching a lost reply / partial transaction rather than just a rejected request.
function harness() {
  let fault = null, locked = false, busy = false;
  class Range {
    constructor(sh,r,c,n=1,m=1){Object.assign(this,{sh,r,c,n,m});}
    getValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.sh.cells[this.r+i-1]?.[this.c+j-1]??''));}
    setValues(rows){
      assert.equal(locked,true,'all request writes hold lock');
      for(let i=0;i<this.n;i++)for(let j=0;j<this.m;j++){
        const r=this.r+i-1,c=this.c+j-1;this.sh.cells[r]??=[];const value=rows[i][j]; this.sh.cells[r][c]=typeof value==='string'&&value.startsWith("'")?value.slice(1):value==='=SUM(1,2)'?3:value;
      }
      if(fault)fault(this);
      return this;
    }
    setValue(v){return this.setValues([[v]]);}
    setNumberFormat(){return this;}
  }
  class Sheet {
    constructor(name){this.name=name;this.cells=[];}
    getName(){return this.name;} getLastRow(){return this.cells.length;}
    getLastColumn(){return Math.max(0,...this.cells.map(r=>r.length));}
    getMaxColumns(){return 2000;}getMaxRows(){return 10000;}
    getRange(...args){return new Range(this,...args);}getRangeList(){return {setNumberFormat(){}};}
  }
  const sheets={}, ss={getSheetByName:n=>sheets[n],insertSheet:n=>sheets[n]=new Sheet(n),getSheets:()=>Object.values(sheets)};
  const context=vm.createContext({Date,JSON,Math,console,SpreadsheetApp:{getActiveSpreadsheet:()=>ss,flush(){}},
    LockService:{getScriptLock:()=>({tryLock(){if(busy)return false;locked=true;return true;},releaseLock(){locked=false;}})},
    Utilities:{DigestAlgorithm:{MD5:'md5'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('md5').update(s).digest()]},
    ContentService:{createTextOutput:s=>s},Logger:{log(){}}});
  vm.runInContext(fs.readFileSync('backend/receiver.gs','utf8'),context);
  return {context,sheets,post:body=>context.doPost({postData:{contents:typeof body==='string'?body:JSON.stringify(body)}}),
    fail(fn){fault=fn;},busy(v){busy=v;},rows(n){const sh=sheets[n];if(!sh)return[];return sh.cells.slice(1).map(r=>Object.fromEntries(sh.cells[0].map((k,i)=>[k,r[i]??''])));}};
}
const study=(pid,stage='complete')=>({task:'cyberstatus',stage,pid,start:'2026-10-01T13:00:00Z',session:'00123',answer:'=SUM(1,2)',zero:'00001',truth:'TRUE',apostrophe:"'quoted",rating:4,accepted:false});
const ball=(stage='complete')=>({task:'cyberball',stage,meta:{pid:'TEST_UNIT_CB',condition:'A',start:'2026-10-01T13:00:00Z'},traits:{spin:[1,2,3]},rows:Array.from({length:120},(_,i)=>({event:'throw',round:1+Math.floor(i/60),throw_number:i%60+1,sender:'QA',receiver:'Blue',success:i%2===0,source:'participant',turn_ms:301}))});
const tests={
 'all checkpoints verified and deduplicated beyond 60 newer records'(){const h=harness(),body=study('TEST_OLD','consent');assert.match(h.post(body),/^ok/);for(let i=0;i<65;i++)assert.match(h.post(study('TEST_'+i,'consent')),/^ok/);assert.match(h.post(body),/^ok/);assert.equal(h.rows('cyberstatus').length,66);assert.ok(h.rows('cyberstatus').every(r=>r.ok===true));},
 'lock failure writes nothing'(){const h=harness();h.busy(true);assert.match(h.post(study('TEST_LOCK','consent')),/busy/);assert.equal(Object.keys(h.sheets).length,0);},
 'partial readable write followed by retry is idempotent'(){const h=harness();let once=true;h.fail(r=>{if(once&&r.sh.name==='cyberball_wide'&&r.r>1){once=false;throw Error('lost response after wide write');}});assert.match(h.post(ball()),/^error/);assert.match(h.post(ball()),/^ok/);assert.equal(h.rows('cyberball').length,1);assert.equal(h.rows('cyberball_wide').length,1);assert.equal(h.rows('cyberball_throws').length,120);assert.ok(h.rows('cyberball')[0].wide);},
 'partial throws write followed by retry is idempotent'(){const h=harness();let once=true;h.fail(r=>{if(once&&r.sh.name==='cyberball_throws'&&r.r>1){once=false;r.sh.cells.length=31;throw Error('partial throws');}});assert.match(h.post(ball()),/^error/);assert.match(h.post(ball()),/^ok/);assert.equal(h.rows('cyberball_wide').length,1);assert.equal(h.rows('cyberball_throws').length,120);},
 'same-length raw corruption is rejected and retry repairs it'(){const h=harness();let once=true;h.fail(r=>{if(once&&r.sh.name==='cyberstatus'&&r.r>1){once=false;let c=r.sh.cells[0].indexOf('json_1');r.sh.cells[r.r-1][c]=r.sh.cells[r.r-1][c].replace('TEST','FAIL');}});assert.match(h.post(study('TEST_CORRUPT')),/^error/);assert.match(h.post(study('TEST_CORRUPT')),/^ok/);assert.equal(h.rows('cyberstatus').length,1);assert.equal(h.rows('cyberstatus_wide').length,1);},
 'large Unicode record keeps every chunk and typed field'(){const h=harness(),d=study('TEST_CHUNKS');d.text='אב😀'.repeat(40000);const raw=JSON.stringify(d);assert.match(h.post(raw),/^ok/);const r=h.rows('cyberstatus')[0];assert.equal(r.n_chunks,4);assert.equal(h.context.readRawRow(h.sheets.cyberstatus,2),raw);const w=h.rows('cyberstatus_wide')[0];for(const k of ['answer','zero','truth','rating','accepted','session','apostrophe'])assert.equal(w[k],d[k]);},
 'Throw & Catch progress is not a completed participant'(){const h=harness();assert.match(h.post(ball('progress')),/^ok/);assert.equal(h.rows('cyberball')[0].stage,'progress');assert.equal(h.rows('cyberball_wide').length,0);assert.equal(h.rows('cyberball_throws').length,0);},
 'partially successful batch can be retried without duplicate records'(){const h=harness();let once=true;h.fail(r=>{if(once&&r.sh.name==='cyberstatus'&&r.r===3){once=false;throw Error('second request interrupted');}});const batch={isf_batch:1,records:['consent','traits','complete'].map(stage=>JSON.stringify(study('TEST_BATCH',stage)))};assert.match(h.post(batch),/^error/);assert.match(h.post(batch),/^ok/);assert.equal(h.rows('cyberstatus').length,3);assert.equal(h.rows('cyberstatus_wide').length,1);},
 'run identity prevents changed final body from adding another readable row'(){const h=harness(),d=study('TEST_CHANGED');assert.match(h.post(d),/^ok/);d.rating=6;assert.match(h.post(d),/^ok/);assert.equal(h.rows('cyberstatus').length,2);assert.equal(h.rows('cyberstatus_wide').length,1);assert.equal(h.rows('cyberstatus_wide')[0].rating,6);},
 'bad or unknown task cannot create a sheet'(){const h=harness();assert.match(h.post('{invalid'),/^error/);assert.match(h.post({task:'unexpected',stage:'complete'}),/^error/);assert.equal(Object.keys(h.sheets).length,0);}
};
for(const [name,test] of Object.entries(tests)){test();console.log('PASS',name);}
