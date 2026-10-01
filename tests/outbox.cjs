const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('save.js','utf8');
const storage=()=>new Proxy({},{get:(o,k)=>k==='setItem'?(key,value)=>o[key]=value:k==='getItem'?key=>o[key]??null:k==='removeItem'?key=>delete o[key]:o[k]});
function harness(localStorage=storage(),reply=async()=>true){
  let now=1000,seq=0;const timers=new Map(),posts=[],events={};
  class FakeDate extends Date{static now(){return now;}}
  const window={addEventListener:(n,f)=>events[n]=f};
  const context=vm.createContext({window,localStorage,Map,JSON,Math,Date:FakeDate,AbortController,console,
    setTimeout:(fn,ms)=>{const id=++seq;timers.set(id,{fn,when:now+ms});return id;},clearTimeout:id=>timers.delete(id),
    fetch:async(url,opts)=>{posts.push(JSON.parse(opts.body));const ok=await reply(posts.length);return {ok:true,text:async()=>ok?'ok verified':'error: retry'};}});
  vm.runInContext(source,context);const api=window.ISFSave('https://receiver.example/exec');
  async function tick(ms=0){now+=ms;for(const [id,t]of [...timers])if(t.when<=now){timers.delete(id);t.fn();}for(let i=0;i<15;i++)await Promise.resolve();}
  return {api,posts,localStorage,tick,events};
}
const guard=setTimeout(()=>{console.error('FAIL test promise did not resolve');process.exit(1);},3000);
(async()=>{
  {
    const h=harness();h.api.enqueue('{"checkpoint":1}','run|consent');assert.equal(Object.keys(h.localStorage).length,1);assert.equal(h.posts.length,0);
    const reloaded=harness(h.localStorage);await reloaded.api.flush();assert.equal(reloaded.posts[0].records[0],'{"checkpoint":1}');assert.equal(Object.keys(h.localStorage).length,0);console.log('PASS checkpoint durable before fetch; recovered on reload');
  }
  {
    const h=harness(undefined,async()=>false),p=h.api.complete('FINAL_EXACT','run|complete');await h.tick();await h.tick(4000);await h.tick(6000);assert.equal(await p,false);assert.equal(h.posts.length,3);assert.ok(h.posts.every(p=>p.records[0]==='FINAL_EXACT'));assert.equal(Object.keys(h.localStorage).length,1);
    const reload=harness(h.localStorage);await reload.api.flush();assert.equal(reload.posts[0].records[0],'FINAL_EXACT');assert.equal(Object.keys(h.localStorage).length,0);console.log('PASS failed final stays durable; exact body retried after restart');
  }
  {
    let resolve;const h=harness(undefined,()=>new Promise(r=>resolve=r));h.api.enqueue('older','run|progress',0);const p=h.api.flush();await h.tick();h.api.enqueue('newer','run|progress',20000);resolve(true);await h.tick();assert.equal(Object.keys(h.localStorage).length,1);assert.equal(JSON.parse(Object.values(h.localStorage)[0]).body,'newer');assert.equal(h.posts[1].records[0],'newer');resolve(true);await p;console.log('PASS older acknowledgement cannot erase newer progress');
  }
  {
    const h=harness();for(let i=0;i<12;i++)h.api.enqueue('stage'+i,'run|'+i,0);assert.equal(await h.api.complete('complete','run|complete'),true);assert.deepEqual(h.posts.map(p=>p.records.length),[8,5]);assert.equal(Object.keys(h.localStorage).length,0);console.log('PASS final awaits checkpoint batches and clears only confirmed entries');
  }
  {
    const st=storage();st.setItem('isf_pending_cyberball_TEST','{"meta":{"pid":"TEST"},"rows":[]}');let resolve;const h=harness(st,()=>new Promise(r=>resolve=r));const p=h.api.flush();await h.tick();assert.equal(st.getItem('isf_pending_cyberball_TEST'),'{"meta":{"pid":"TEST"},"rows":[]}');resolve(true);await p;assert.equal(Object.keys(st).length,0);console.log('PASS legacy final payload preserved until acknowledgement');
  }
  {
    const h=harness();h.api.enqueue('already saved','run|recovered',0);const other=harness(h.localStorage);await other.api.flush();await h.api.flush();assert.equal(h.posts.length,0);console.log('PASS one tab skips a record already acknowledged in another tab');
  }
  {
    const h=harness();h.api.enqueue('first','run|progress',20000);await h.tick(10000);h.api.enqueue('second','run|progress',20000);await h.tick(10000);assert.equal(h.posts.length,1);assert.equal(h.posts[0].records[0],'second');console.log('PASS continuous events do not postpone periodic backup');
  }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>clearTimeout(guard));
