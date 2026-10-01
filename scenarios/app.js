/* Run C — matched social scenarios (ISF 2026 pilot). Vanilla JS, no dependencies.
   Flow: consent → traits → instructions → AMBIGUOUS block (8 items) → CLEAR block (8 scenes) → demographics + attention check → debrief → Prolific.
   Counterbalancing: half (X: H1 clear / H2 ambiguous; Y: the reverse), order 0–3 (version Latin square), amb 0|1 (which settings get variant A), lvl 0|1 (level pattern). */
(function(){
'use strict';
const VERSION='scenarios_v6_2026-10-01';
const $app=document.getElementById('app'); let screenN=0;
const q=new URLSearchParams(location.search);
const DEBUG=q.get('debug')==='1';
const AUTO=DEBUG&&q.get('auto')==='1';
if(DEBUG){
  CONFIG.requireAnswers=false; // review mode: Next works without answering (missing = null); participants must answer everything
  if(q.get('ts')) CONFIG.timeScale=+q.get('ts');
  if(q.get('traits')!==null){ const L=q.get('traits')?q.get('traits').split(','):[]; CONFIG.traitsBefore=L.filter(t=>!['npi16','soas','lsas'].includes(t)); CONFIG.traitsAfter=L.filter(t=>['npi16','soas','lsas'].includes(t)); }
  if(q.get('half')) CONFIG.force.half=q.get('half');
  ['order','amb','lvl'].forEach(k=>{ if(q.get(k)!==null) CONFIG.force[k]=+q.get(k); });
  if(q.get('full')!==null) CONFIG.allSettings=q.get('full')==='1';
  if(q.get('seq')==='1') CONFIG.fixedOrder=true; // review: settings in their fixed numbers 1-16, no shuffle (same sequence in both copies)
  if(q.get('altset')) CONFIG.altSet=q.get('altset'); // all-16 mode, second part: 'story' (parallel story, default) or 'mild' (same base, slightly different details)
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=(v,alt)=>(v===null||v===undefined)?alt:v;
// ---------- data object ----------
const D={task:'scenarios',version:VERSION,pid:q.get('PROLIFIC_PID')||'',study:q.get('STUDY_ID')||'',session:q.get('SESSION_ID')||'',
         start:new Date().toISOString(),ua:navigator.userAgent,cond:{},timings:{},amb:[],clear:[],screens:[],log:[]};
if(DEBUG){ window.D=D; window.__screen=()=>screenN; window.__next=()=>{const b=document.getElementById('next'); if(b) b.click();}; }
// ---------- counterbalancing ----------
const half=pick(CONFIG.force.half,Math.random()<.5?'X':'Y');
const order=pick(CONFIG.force.order,rnd(4));
const ambPattern=pick(CONFIG.force.amb,rnd(2));
const levelPattern=pick(CONFIG.force.lvl,rnd(2));
D.cond={half,order,ambPattern,levelPattern};
const BY={}; SCENARIOS.forEach(s=>BY[s.id]=s);
const TYPE={}; Object.entries(DESIGN.types).forEach(([t,ids])=>ids.forEach(id=>TYPE[id]=t.split('_')[0]));
const FULL=!!CONFIG.allSettings; D.cond.mode=FULL?'all16':'8+8';
const ALL=DESIGN.halves.H1.concat(DESIGN.halves.H2);
const clearIds=FULL?ALL:(half==='X'?DESIGN.halves.H1:DESIGN.halves.H2);
const ambIds=FULL?ALL:(half==='X'?DESIGN.halves.H2:DESIGN.halves.H1);
const W=[[0,1,3,2],[1,2,0,3],[2,3,1,0],[3,0,2,1]]; const VER=['HH','HL','LH','LL']; // Williams square: each version once per row, each position once per column
const arrange=a=>CONFIG.fixedOrder?a.slice().sort((x,y)=>(BY[x.id].no||0)-(BY[y.id].no||0)):shuffle(a);
const clearPlan=arrange(clearIds.map((id,k)=>({id,settingType:TYPE[id],version:VER[W[(order+Math.floor(k/4))%4][k%4]]})));
// variant alternates within each pair of settings of a type (2 A + 2 B per type in all-16 mode); level pattern balanced within type and within variant
const ambPlan=arrange(ambIds.map((id,k)=>{const variant=((k%2===0)===(ambPattern===0))?'A':'B'; const level=(((Math.floor(k/2)+Math.floor(k/8))%2===0)===(levelPattern===0))?'high':'low'; return {id,settingType:TYPE[id],variant,level};}));
D.cond.clearPlan=clearPlan.map(x=>x.id+':'+x.version); D.cond.ambPlan=ambPlan.map(x=>x.id+':'+x.variant+':'+x.level);
if(DEBUG){ const lbl=(DESIGN.textVersion||'').startsWith('prenotes')?'PRE-NOTES TEXTS (Word v32)':'CURRENT TEXTS (settings '+DESIGN.textVersion+')'; const b=document.createElement('div'); b.id='verbanner'; b.textContent=lbl+' · mode: '+(FULL?'all 16 ambiguous, then all 16 clear':'8 + 8')+(CONFIG.fixedOrder?' · fixed order 1–16':'')+(FULL?' · second part: '+(CONFIG.altSet==='mild'?'MILD changes':'PARALLEL STORY'):'')+' · port '+location.port; document.body.prepend(b); }
// ---------- helpers ----------
let t0=Date.now(); function mark(k){D.timings[k]=(D.timings[k]||0)+(Date.now()-t0)/1000;t0=Date.now();}
// ---------- saving (1.10 b): checkpoint saves run in the background and never hold up the screen; only save('complete') is awaited ----------
const SAVE_TIMEOUT_MS=12000;
async function postOnce(body){ const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),SAVE_TIMEOUT_MS);
  try{ const r=await fetch(CONFIG.endpoint,{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'text/plain'},body,signal:ctl.signal}); const txt=(await r.text()).trim(); return (r.ok&&/^ok/.test(txt))?'ok':'reply:'+txt.slice(0,60); }
  catch(e){ return 'fail:'+String(e&&e.name||e).slice(0,40); } finally{ clearTimeout(t); } }
async function sendWithRetries(stage,body,waits){ // → true = the receiver stored and verified the record; false = not confirmed (a last no-cors copy is still sent)
  for(let i=0;i<waits.length;i++){ if(waits[i]) await new Promise(r=>setTimeout(r,waits[i])); const res=await postOnce(body); if(res==='ok'){ D.saved=D.saved||{}; D.saved[stage]=i+1; return true; } D.log.push('save-'+stage+':'+(i+1)+':'+res); }
  try{ const c2=new AbortController(); setTimeout(()=>c2.abort(),SAVE_TIMEOUT_MS); fetch(CONFIG.endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body,keepalive:body.length<60000,signal:c2.signal}).catch(()=>{}); }catch(e){}
  return false; }
function pendingKey(){ return 'isf_pending_'+D.task+'_'+(D.pid||'nopid'); }
function resendPending(){ // at start: any final record still waiting in this browser is sent again (the receiver ignores a copy it already stored)
  if(!CONFIG.endpoint) return; let keys=[]; try{ keys=Object.keys(localStorage).filter(k=>k.startsWith('isf_pending_')); }catch(e){ return; }
  keys.forEach(async k=>{ try{ const body=localStorage.getItem(k); if(!body) return; const res=await postOnce(body); if(res==='ok') localStorage.removeItem(k); }catch(e){} }); }
function wireRetry(){ // the thank-you page: "Try saving again" when the final save was not confirmed
  const b=document.getElementById('retrySave'), m=document.getElementById('retryMsg'); if(!b) return;
  b.onclick=async()=>{ b.disabled=true; m.textContent='Saving…'; const ok=await save('complete'); m.textContent=ok?'Saved. Thank you!':'Still not confirmed. Please download the file and send it to the researcher.'; if(!ok) b.disabled=false; }; }
function save(stage){ // returns a promise: resolved at once for checkpoints (the send continues in the background), the real result for 'complete'; null = no endpoint
  D.stage=stage; D.lastSave=new Date().toISOString(); if(!CONFIG.endpoint) return Promise.resolve(null);
  const body=JSON.stringify(D,(k,v)=>k.startsWith('_')?undefined:v);
  if(stage==='complete'){ if(!D._finalBody) D._finalBody=body; const fb=D._finalBody; try{ localStorage.setItem(pendingKey(),fb); }catch(e){} return sendWithRetries(stage,fb,[0,2000,5000]).then(ok=>{ if(ok){ try{ localStorage.removeItem(pendingKey()); }catch(e){} } return ok; }); }
  sendWithRetries(stage,body,[0,3000]).catch(()=>{}); return Promise.resolve(undefined); }
function show(html,opts={}){
  return new Promise(res=>{
    screenN++; const shown=Date.now();
    $app.innerHTML=`<div class="screen">${html}${opts.noNext?'':'<div class="err" id="err"></div><div class="btnrow"><button class="next" id="next">Next →</button></div>'}</div>`;
    window.scrollTo(0,0);
    if(DEBUG) console.log('screen '+screenN+' '+(opts.title||''));
    if(opts.setup) opts.setup();
    if(opts.noNext) return;
    const btn=document.getElementById('next');
    const minMs=(opts.minSeconds||0)*1000*CONFIG.timeScale;
    if(minMs>0){ btn.disabled=true; const note=document.createElement('span'); note.className='small'; note.id='mincount'; note.style.cssText='margin:0 12px;color:#666'; btn.parentNode.insertBefore(note,btn);
      let left=Math.ceil(minMs/1000); const tick=()=>{ note.textContent=left>0?`Next in ${left} s`:''; }; tick();
      const iv=setInterval(()=>{ left--; tick(); if(left<=0){ clearInterval(iv); btn.disabled=false; } },Math.min(1000,minMs)); }
    btn.onclick=()=>{ if(btn.disabled) return; const e=opts.validate?opts.validate():null; if(e){document.getElementById('err').textContent=e;return;} D.screens.push({n:screenN,title:opts.title||'',ms:Date.now()-shown}); res(); };
    if(AUTO){ setTimeout(()=>{ autofill(); const ivA=setInterval(()=>{ if(!btn.disabled){ clearInterval(ivA); btn.click(); } },100); },120); } // testing only: click as soon as the countdown releases the button
  });
}
function autofill(){ // testing only: answers every input at random (attention check answered correctly)
  const groups={}; document.querySelectorAll('input[type=radio]').forEach(r=>{(groups[r.name]=groups[r.name]||[]).push(r);});
  Object.values(groups).forEach(g=>{const r=g[rnd(g.length)]; r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true})); r.closest('td')&&r.closest('td').click();});
  document.querySelectorAll('.pair, .choice').forEach(p=>{const o=p.querySelectorAll('.opt'); o[rnd(o.length)].click();});
  document.querySelectorAll('input[type=text]').forEach(i=>{ if(!i.value) i.value=i.id==='age'?'34':i.id==='edu'?'15':'test'; });
  document.querySelectorAll('select').forEach(s=>{ if(s.id==='attn'){s.value='Disagree';} else if(s.selectedIndex<=0){s.selectedIndex=1+rnd(s.options.length-1);} });
  document.querySelectorAll('textarea').forEach(t=>t.value='autopilot');
}
// ---------- questionnaire widgets ----------
function matrix(key,def){ // Likert matrix; D[key] = array of values
  const rows=def.items.map((it,i)=>`<tr data-i="${i}"><td class="stem">${i+1}. ${esc(it)}</td>${def.scale.map((s,j)=>`<td><input type="radio" name="${key}_${i}" value="${def.values[j]}"></td>`).join('')}</tr>`).join('');
  const html=`<p>${esc(def.title)}</p><div style="overflow-x:auto"><table class="rt"><tr><th></th>${def.scale.map(s=>`<th>${esc(s)}</th>`).join('')}</tr>${rows}</table></div>`;
  return {html,setup:cellClicks,validate:()=>{const out=[];let miss=false;def.items.forEach((_,i)=>{const r=document.querySelector(`input[name="${key}_${i}"]:checked`);const tr=document.querySelector(`tr[data-i="${i}"]`);if(!r){miss=true;tr.classList.add('missing');out.push(null);}else{tr.classList.remove('missing');out.push(+r.value);}});if(miss&&CONFIG.requireAnswers!==false)return 'Please answer every item.';D[key]=out;return null;}};
}
function forcedChoice(key,def){ // NPI-16: D[key] = keyed 0/1 per pair; D[key+'_raw'] = chosen side
  const html=`<p>${esc(def.title)}</p>`+def.pairs.map((pr,i)=>`<div class="pair" data-i="${i}"><div class="opt" data-s="0">${esc(pr[0])}</div><div class="opt" data-s="1">${esc(pr[1])}</div></div>`).join('');
  const setup=()=>{document.querySelectorAll('.pair').forEach(p=>p.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{p.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');p.classList.remove('missing');}));};
  const validate=()=>{const raw=[],keyed=[];let miss=false;document.querySelectorAll('.pair').forEach((p,i)=>{const s=p.querySelector('.opt.sel');if(!s){miss=true;p.style.background='#fff3f3';raw.push(null);keyed.push(null);}else{p.style.background='';raw.push(+s.dataset.s);keyed.push(+s.dataset.s===def.key[i]?1:0);}});if(miss&&CONFIG.requireAnswers!==false)return 'Please choose one statement in every pair.';D[key+'_raw']=raw;D[key]=keyed;return null;};
  return {html,setup,validate};
}
const TRAIT_TITLE={spin:'Social Anxiety Questionnaire',bdi:'Mood Questionnaire',bpni:'Relationships Questionnaire',fpes:'Fear of Positive Evaluation Questionnaire',npi16:'Social Behaviour Questionnaire',soas:'Feelings in the World Questionnaire',lsas:'Social Situations Questionnaire',phq9:'Mood Questionnaire'};
const BDI_TITLES=['Sadness','Pessimism','Past Failure','Loss of Pleasure','Guilty Feelings','Punishment Feelings','Self-Dislike','Self-Criticalness','Crying','Agitation','Loss of Interest','Indecisiveness','Worthlessness','Loss of Energy','Changes in Sleeping Pattern','Irritability','Changes in Appetite','Concentration Difficulty','Tiredness or Fatigue','Loss of Interest in Sex'];
const BDI_L7=['0','1a','1b','2a','2b','3a','3b'];
const qhead=(t,i,n,instr)=>`<h2>${esc(TRAIT_TITLE[t]||'Questionnaire')}</h2><p class="qsub">Questionnaire ${i} of ${n}</p><div class="q-instr">${esc(instr)}</div>`;
function groupChoice(key,def){ // BDI-II as the form: item headings, statements listed with their score numbers; D[key] = scored values, D[key+'_raw'] = chosen statement index
  const html=`<div class="bdi-list">${def.groups.map((g,i)=>`<div class="bdi-item" data-g="${i}"><div class="bdi-head">${i+1}. ${esc(BDI_TITLES[i]||'')}</div>${g.map((t,j)=>`<label class="bdi-opt"><input type="radio" name="${key}_${i}" value="${j}"><span class="bdi-score">${g.length===7?BDI_L7[j]:j}</span><span>${esc(t)}</span></label>`).join('')}</div>`).join('')}</div>`;
  return {html,validate:()=>{ const raw=[]; let miss=false; document.querySelectorAll('.bdi-item').forEach(gr=>{const s=gr.querySelector('input:checked'); if(!s){miss=true;gr.classList.add('missing');raw.push(null);} else {gr.classList.remove('missing'); raw.push(+s.value);} }); if(miss&&CONFIG.requireAnswers!==false) return 'Please pick one statement in every group.'; D[key+'_raw']=raw; D[key]=raw.map((v,i)=>v===null?null:def.scores[i][v]); return null; }};
}
async function runTraits(list){ // Cyberball structure: four questionnaires before the situations, three after
  for(let i=0;i<list.length;i++){ const t=list[i]; let m, instr;
    if(t==='lsas'){ const L=ITEMS.lsas; m=matrix('lsas_fear',{title:'',scale:L.scaleA,values:L.values,items:L.items}); instr=L.titleFear; }
    else if(t==='npi16'){ m=forcedChoice('npi16',Object.assign({},ITEMS.npi16,{title:''})); instr=ITEMS.npi16.title; }
    else if(t==='bdi'){ m=groupChoice('bdi',ITEMS.bdi); instr=ITEMS.bdi.title; }
    else { m=matrix(t,Object.assign({},ITEMS[t],{title:''})); instr=ITEMS[t].title; }
    await show(qhead(t,i+1,list.length,instr)+m.html,Object.assign({title:'trait:'+t},m)); mark(t); }
}
function cellClicks(){ document.querySelectorAll('table.rt td').forEach(td=>{const r=td.querySelector('input[type=radio]'); if(!r) return; td.onclick=()=>{r.checked=true; const tr=td.parentElement; tr.querySelectorAll('td').forEach(x=>x.classList.remove('sel')); td.classList.add('sel'); tr.classList.remove('missing');};}); }
// ---------- scene rating widgets ----------
const SEVEN=[1,2,3,4,5,6,7];
function ratingTable(prefix,items,left,right){ // items: [{k,text}]; 7 radio columns; the anchor text sits above the 1 and the 7
  const head=`<tr><th></th>${SEVEN.map(n=>`<th><div class="num">${n}</div><div class="anc">${n===1?esc(left):n===7?esc(right):''}</div></th>`).join('')}</tr>`;
  const rows=items.map((it,i)=>`<tr data-k="${prefix}_${it.k}"><td class="stem">${esc(it.text)}</td>${SEVEN.map(n=>`<td><input type="radio" name="${prefix}_${it.k}" value="${n}"></td>`).join('')}</tr>`).join('');
  return `<div style="overflow-x:auto"><table class="rt">${head}${rows}</table></div>`;
}
function collect(prefix,keys){ const out={}; let miss=false; keys.forEach(k=>{const r=document.querySelector(`input[name="${prefix}_${k}"]:checked`); const tr=document.querySelector(`tr[data-k="${prefix}_${k}"]`); if(!r){miss=true; out[k]=null; tr&&tr.classList.add('missing');} else {tr&&tr.classList.remove('missing'); out[k]=+r.value;}}); return (miss&&CONFIG.requireAnswers!==false)?null:out; }
// one choice among boxed options; D-less: returns the chosen key or null
function choiceBoxes(prefix,items){ return `<div class="opts choice" data-c="${prefix}">`+items.map(it=>`<div class="opt" data-k="${esc(it.k)}">${esc(it.text)}</div>`).join('')+'</div>'; }
function choiceSetup(){ document.querySelectorAll('.choice').forEach(g=>g.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{g.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel')); o.classList.add('sel'); g.classList.remove('missing');})); }
function choiceValue(prefix){ const g=document.querySelector(`.choice[data-c="${prefix}"]`); const o=g&&g.querySelector('.opt.sel'); if(!o){ g&&g.classList.add('missing'); return CONFIG.requireAnswers===false?null:undefined; } return o.dataset.k; }
function sceneText(s,version){ const ALT=CONFIG.altSet==='mild'?s.alt_mild:s.alt; const T=(FULL&&ALT)?ALT:s; const st=version[0]==='H'?T.sH:T.sL, ac=version[1]==='H'?T.aH:T.aL; const su=FULL?(T.setup||s.setup2||s.setup):s.setup; return s.acceptFirst?`${su} ${ac} ${st}`:`${su} ${st} ${ac}`; } // all-16 mode: the clear part uses the parallel story (alt: same structure, different details)
// ---------- the two kinds of pages ----------
async function clearScene(plan,pos,total){
  const s=BY[plan.id]; const text=sceneText(s,plan.version); const P='c'+pos;
  const lik=s.block.likelihood.map(([k,t])=>({k,text:t})); const stay=s.block.react.slice(0,3).map(([k,t])=>({k,text:t})); const re=s.block.react.slice(3).map(([k,t])=>({k,text:t}));
  const html=`<div class="progress">Situation ${pos} of ${total}</div><div class="scene">${esc(text)}</div><p class="small">Imagine yourself in this situation and answer the questions below.</p>
    <div class="qtitle">How much would you feel…</div>${ratingTable(P,lik,'Not at all','Very much')}
    <div class="qtitle">Choose one of these three options:</div>${choiceBoxes(P,stay)}
    <div class="qtitle">How likely is it that you would react this way?</div>${ratingTable(P,re,'Not at all likely','Very likely')}`;
  const shown=Date.now(); let rec=null;
  await show(html,{title:'clear:'+plan.id,setup:()=>{cellClicks();choiceSetup();},minSeconds:CONFIG.minReadSeconds,validate:()=>{const b=collect(P,lik.map(x=>x.k)); const st=choiceValue(P); const r=collect(P,re.map(x=>x.k)); if(!b||st===undefined||!r) return 'Please answer every question.'; rec={pos,id:plan.id,settingType:plan.settingType,version:plan.version,text,block:b,stay:st,react:r,ms:Date.now()-shown}; return null;}});
  D.clear.push(rec);
}
async function ambScene(plan,pos,total){
  const s=BY[plan.id]; const text=s.amb[plan.variant][plan.level]; const cogs=plan.variant==='A'?s.cogA:s.cogB; const P='a'+pos;
  const cogItems=cogs.map((t,i)=>({k:'cog'+(i+1),text:'…'+t}));
  const short=s.block.likelihood.map(([k,t])=>({k,text:t})); const stay=s.block.react.slice(0,3).map(([k,t])=>({k,text:t}));
  const html=`<div class="progress">Situation ${pos} of ${total}</div><div class="scene">${esc(text)}</div><p class="small">Imagine yourself in this situation and answer the questions below.</p>
    <div class="qtitle">How likely is it that…</div>${ratingTable(P,cogItems,'Not at all likely','Very likely')}
    <div class="qtitle">And in this situation, how much would you feel…</div>${ratingTable(P,short,'Not at all','Very much')}
    <div class="qtitle">Choose one of these three options:</div>${choiceBoxes(P,stay)}`;
  const shown=Date.now(); let rec=null;
  await show(html,{title:'amb:'+plan.id,setup:()=>{cellClicks();choiceSetup();},minSeconds:CONFIG.minReadSeconds,validate:()=>{const c=collect(P,['cog1','cog2','cog3']); const b=collect(P,short.map(x=>x.k)); const st=choiceValue(P); if(!c||!b||st===undefined) return 'Please answer every question.'; rec={pos,id:plan.id,settingType:plan.settingType,variant:plan.variant,level:plan.level,text,cog:[c.cog1,c.cog2,c.cog3],block:b,stay:st,ms:Date.now()-shown}; return null;}});
  D.amb.push(rec);
}
// ---------- main flow ----------
const mc=(id,label,opts)=>`<p><b>${label}</b></p><select id="${id}"><option value="">–</option>${opts.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`;
async function main(){
  resendPending();
  await show(`<h2>Welcome</h2><p>Thank you for choosing our study! This study combines questionnaires and short descriptions of everyday situations. We aim to understand the way people experience various social events in their lives.</p><p>First you will complete four short questionnaires about yourself. Then you will read a series of short descriptions of everyday situations and answer a few questions after each one. At the end there are three more short questionnaires. The study takes approximately 45 minutes and must be completed in one sitting.</p><p>Participation is voluntary; if you choose to stop, close the browser window. Some situations describe unpleasant social events.</p><p>Confidentiality: all your data are anonymous and confidential. Questions: ${CONFIG.contactEmail}</p><p><b>By pressing the button I declare that I have read and understood the consent form and provide my free and informed consent to participate.</b></p>`,{title:'consent'});
  D.consent=new Date().toISOString(); await save('consent');
  await runTraits(CONFIG.traitsBefore||[]); await save('traits');
  await show(`<h2>Everyday situations</h2><p>Below are scenarios describing situations that people encounter in daily life. As you read each scenario, please try to imagine yourself in that situation. Imagine what your reactions would be and answer the questions accordingly.</p><p>There are no right or wrong answers. Each situation is followed by a short list of questions; please answer all of them before moving on.</p>`,{title:'instructions'});
  for(let i=0;i<ambPlan.length;i++) await ambScene(ambPlan[i],i+1,ambPlan.length+clearPlan.length);
  mark('amb'); await save('amb');
  for(let i=0;i<clearPlan.length;i++) await clearScene(clearPlan[i],ambPlan.length+i+1,ambPlan.length+clearPlan.length);
  mark('clear'); await save('clear');
  if((CONFIG.traitsAfter||[]).length){ await show(`<h2>Almost done</h2><p>Three more short questionnaires about yourself, then a few details, and you are finished.</p>`,{title:'traits_after_intro'}); await runTraits(CONFIG.traitsAfter); await save('traits_after'); }
  await show(`<h2>A few details about you</h2>${mc('gender','What is your gender?',['Man','Woman','Other'])}<p><b>What is your age?</b></p><input type="text" id="age" style="width:100px"><p><b>How many years of formal education do you have (beginning with 1st grade)?</b></p><input type="text" id="edu" style="width:100px">${mc('marital','What is your marital status?',['Single, never married','Romantic relationship (more than three months)','Married or domestic partnership','Divorced','Widowed'])}${mc('employment','What is your current employment status?',['Employed full-time','Employed part-time','Self-employed','Student','Unemployed','Retired','Other'])}<p><b>Please specify your nationality:</b></p><input type="text" id="nat">${mc('attn','This is an attention check. Please select "Disagree".',['Totally agree','Agree','Neutral','Disagree','Totally disagree'])}${D.pid?'':'<p><b>Please enter your Prolific ID:</b></p><input type="text" id="pidm">'}`,
    {title:'demographics',validate:()=>{const g=id=>document.getElementById(id).value.trim(); if(!g('gender')||!g('age')||!g('attn')) return 'Please complete the required fields (gender, age, attention check).'; D.demog={gender:g('gender'),age:g('age'),edu:g('edu'),marital:g('marital'),employment:g('employment'),nationality:g('nat')}; D.attention=g('attn'); if(!D.pid) D.pid=g('pidm'); return null;}});
  await show(`<h2>Almost done</h2><p><b>How realistic did the situations seem to you, on the whole?</b></p><div style="overflow-x:auto"><table class="rt"><tr><th></th>${SEVEN.map(n=>`<th>${n}</th>`).join('')}</tr><tr data-k="realism"><td class="stem">1 = not at all realistic, 7 = very realistic</td>${SEVEN.map(n=>`<td><input type="radio" name="realism" value="${n}"></td>`).join('')}</tr></table></div><p><b>Any comments on the study?</b></p><textarea id="cmt" rows="3"></textarea>`,
    {title:'realism',setup:cellClicks,validate:()=>{const r=document.querySelector('input[name="realism"]:checked'); if(!r) return 'Please rate how realistic the situations were.'; D.realism=+r.value; D.comments=document.getElementById('cmt').value; return null;}});
  D.end=new Date().toISOString(); mark('post');
  $app.innerHTML='<div class="screen"><h2>Saving your answers…</h2><p>Please keep this window open. This takes a few seconds.</p></div>';
  const savedOk=await save('complete');
  const dlLink=`<p><a id="dl" download="scenarios_${D.pid||'test'}.json">Download your data file${savedOk===null?' (local test mode)':''}</a></p>`;
  const dl=savedOk===true?'':(savedOk===false?`<p class="err"><b>We could not confirm that your answers were saved.</b> Please try again; if it still fails, download this file and send it to the researcher through a Prolific message, then continue.</p><p><button class="next" type="button" id="retrySave">Try saving again</button> <span id="retryMsg" class="small"></span></p>`+dlLink:dlLink);
  await show(`<h2>Thank you!</h2><p>The situations you read were fictional. This study looks at how people respond to two kinds of social feedback: how much a group values what they do, and how much it wants them around, and at how people interpret situations in which one of these is left unclear.</p><p>If any of the situations brought up difficult feelings, please know that they were invented for this study and say nothing about you. Questions, or a request to remove your data: ${CONFIG.contactEmail}.</p>${dl}${CONFIG.completionUrl?'<p>Press the button to return to Prolific.</p>':''}`,
    {title:'debrief',minSeconds:AUTO?2/CONFIG.timeScale:0,setup:()=>{const a=document.getElementById('dl'); if(a) a.href=URL.createObjectURL(new Blob([JSON.stringify(D,(k,v)=>k.startsWith('_')?undefined:v,1)],{type:'application/json'})); wireRetry();}});
  if(CONFIG.completionUrl) location.href=CONFIG.completionUrl; else await show('<h2>You may now close this window.</h2>',{noNext:true,title:'end'});
}
main().catch(e=>{ $app.innerHTML=`<div class="screen"><p>Something went wrong: ${esc(e.message)}. Please contact ${CONFIG.contactEmail}.</p></div>`; console.error(e); });
})();
