/* CyberStatus v3 — ISF 2026 pilot build (27.9.2026). Standing (High/Low) × Connections (Accepted/Rejected), five rounds.
   Vanilla JS, no dependencies. Based on the 15.9.2026 standalone build; every change is listed in README.md. */
(function(){
'use strict';
const VERSION='cyberstatus_v3_pilot_2026-10-01q';
const $app=document.getElementById('app');
const BOTS=['Emma','Tom','Taylor','Pixel'];
// Bots' "I am" descriptions shown on the voting cards (set = round index mod 3)
const BOT_DESC=[ // real participants' sentences from CyberStatus Study 1 (verbatim), one set per round; split approved by Roy 29.9.2026
  {Emma:'a camping person',Tom:'a cook',Taylor:'a teacher',Pixel:'a planner'},
  {Emma:'a nature lover',Tom:'a baker',Taylor:'a careful listener',Pixel:'a graphic designer'},
  {Emma:'an avid hiker',Tom:'a decent cook',Taylor:'interested in science',Pixel:'someone who loves board games and puzzles'},
  {Emma:'a gardener',Tom:'like to cook in holidays',Taylor:'a film lover',Pixel:'an artistic person'},
  {Emma:'a mountain climber',Tom:'a person who grew up on a farm',Taylor:'a Geography Bee winner',Pixel:'not very handy'}];
// Bots' self-introduction paragraphs (DRAFT, pending Roy's approval)
const BOT_INTRO={ // approved by Roy, 29.9.2026 (typed feel: small typos and stray spaces are intentional)
  Emma:"Ok so the one thing people know about me is that I once got four friends out of a forest with a paper map after everyones phone died, so yes, im the map person. Bookshop by day, history degree by night (american civil war, dont get me started). I grow herbs on the windowsill and they mostly survive. Emma, by the way :)",
  Tom:"Tom. 40. Cook in a busy kitchen, which means I dont panic when three things burn at once. Weekends: running, badly. Holidays: camping, where i insist on cooking on a tiny gas stove while everyone waits. I collect recipes from places ive never been. Thats about it, nice to meet you all",
  Taylor:"hi all, Taylor here, I teach middle school science and every spring I take 30 kids on a field trip which is why I now have a first aid certificate and strong opinions about how much water people bring, otherwise I watch too many films, hike when the weather allows and i tend to listen more than i talk",
  Pixel:"Whats the most useless skill you have? Mine is planning road trips I never take, complete with playlists and where to stop for lunch. Graphic designer, still living next to my parents (sunday dinner is not optional), podcast addict. Im the one who packs too much and then lends everyone stuff. Pixel (yes thats what everyone calls me, long story)"};
const ROLES=['Leader','First Deputy','Second Deputy','Support','Second Support'];
const CHOICE_SEC=CONFIG.rankChoiceSeconds||10;
const GT=Object.assign({read:20,result:15,outcome:25,state:60,wish:20,distress:20,emotions:40,slider:20,avatar:40,rankInfo:60,connInfo:45},CONFIG.gameTimers||{}); // seconds; every screen of the task continues by itself (Roy, 30.9); round result 15 s and the six pages before round 1 timed (Roy, 1.10)
const autoNote=sec=>`<p class="small autonote">This screen continues automatically after ${sec} seconds.</p>`; // ranking choices (vote, staircase picks) must be made within this time; otherwise the system chooses (Roy, 29.9)
const mustChoose=`<p class="small">You must choose within ${CHOICE_SEC} seconds. If you do not, the system will choose for you, and this counts as not taking part in the ranking.</p>`;
const ORDN=n=>n===2?'second':n===3?'third':n===4?'fourth':n+'th';
const redCard=(who,ctx)=>{ D.autoCount++; const again=D.autoCount>1?` This is the <b>${ORDN(D.autoCount)} time</b> you did not choose in time.`:''; return `<div class="redcard"><div class="card-shape"></div><div class="rc-text"><h2>Red card</h2><p><b>You did not choose in time.</b> The system chose <b>${esc(who)}</b> for you${ctx||''}.${again}</p><p>Not choosing is a serious problem: the team cannot rank without your choice, and it counts as not taking part in the ranking.</p></div></div>`; };
const ORD=['first','second','third','fourth','last'];
// Ranking scripts (five rounds): chain = final order of the five players, 'ME' at the participant's position. When it is ME's turn
// to choose, the chosen member takes the next step and the remaining others follow in chain order. Participant's rank per round:
// High 3,1,2,1,1 · Low 3,5,5,4,5 (rounds 1–4 as in the 15.9 build; round 5 added 27.9).
const RANK={high:[['Emma','Tom','ME','Taylor','Pixel'],['ME','Tom','Pixel','Emma','Taylor'],['Emma','ME','Tom','Taylor','Pixel'],['ME','Tom','Emma','Taylor','Pixel'],['ME','Taylor','Emma','Tom','Pixel']],
            low: [['Emma','Tom','ME','Taylor','Pixel'],['Emma','Taylor','Pixel','Tom','ME'],['Taylor','Emma','Tom','Pixel','ME'],['Emma','Tom','Taylor','ME','Pixel'],['Tom','Pixel','Emma','Taylor','ME']]};
// Final (overall) order announced after round 5
const FINAL={high:['ME','Emma','Tom','Taylor','Pixel'],low:['Emma','Tom','Taylor','Pixel','ME']};
// Connections scripts: incoming picks to ME per round (accepted 2,4,3,4,4 · rejected 2,0,1,0,0); others' web as [a,b,mutual]
const BASE=[['Emma','Tom',1],['Taylor','Pixel',0],['Taylor','Emma',0],['Pixel','Tom',0]];
const ACC_FULL=[['Emma','Tom',1],['Taylor','Pixel',1]], ACC_3=[['Emma','Tom',1],['Taylor','Pixel',0],['Pixel','Emma',0]];
const REJ_FULL=[['Emma','Tom',1],['Emma','Pixel',1],['Tom','Taylor',1],['Taylor','Pixel',1]], REJ_3=[['Emma','Tom',1],['Emma','Pixel',0],['Tom','Taylor',1],['Taylor','Pixel',0]];
const CONN={acc:{in:[['Emma','Tom'],BOTS.slice(),['Emma','Tom','Taylor'],BOTS.slice(),BOTS.slice()], web:[BASE,ACC_FULL,ACC_3,ACC_FULL,ACC_FULL]},
            rej:{in:[['Emma','Tom'],[],['Pixel'],[],[]], web:[BASE,REJ_FULL,REJ_3,REJ_FULL,REJ_FULL]}};
// Positions the bots "ask for" on the desired-position screens (same in every cell; Roy 27.9: all on steps 1–2)
const WISH={Emma:1,Tom:1,Taylor:2,Pixel:2};
// Scripted avatar positions of the four members [x = reserved→approachable, y = smaller→bigger], identical in every cell (DRAFT, from the avatar session's demo)
const BOT_AVATAR={Emma:[74,82],Tom:[46,64],Taylor:[86,56],Pixel:[62,44]};
// Figure of a member for the display (cards, staircase, circle): bots from BOT_AVATAR, the participant from avatar_pre; null before placement
const figOf=(n,size)=>{ const p=n===D.name?(D.avatar_pre?[D.avatar_pre.x,D.avatar_pre.y]:null):BOT_AVATAR[n]; return p&&window.AvatarField?AvatarField.figureSVG(p[0],p[1],size):null; };
const q=new URLSearchParams(location.search);
// Left-to-right order of the members is randomized (Roy, 30.9): once per participant for the introductions, the circle and the
// awareness check (D.botOrder), and afresh on every choice screen (vote, staircase picks, connections; the order is recorded).
const DEBUG=!!q.get('debug'); // testing only: ?debug=1 exposes window.D and enables &standing=high|low &acc=1|0 &ts=0.1 (timeScale) &auto=1 (autopilot)
const AUTO=DEBUG&&!!q.get('auto');
if(DEBUG){ if(q.get('standing')) CONFIG.force.standing=q.get('standing'); if(q.get('acc')!==null) CONFIG.force.acc=+q.get('acc'); if(q.get('ts')) CONFIG.timeScale=+q.get('ts');
  if(q.get('traits')!==null){ const L=q.get('traits')?q.get('traits').split(','):[]; CONFIG.traitsBefore=L.filter(t=>!['npi16','lsas','soas'].includes(t)); CONFIG.traitsAfter=L.filter(t=>['npi16','lsas','soas'].includes(t)); } } // &traits= (empty) skips the questionnaires; &stop=N halts the autopilot at screen N
const STOPAT=new Set(DEBUG&&q.get('stop')?q.get('stop').split(q.get('stop').includes('|')?'|':',').map(t=>isNaN(+t)?t:+t):[]); // autopilot pauses on these screen numbers or title fragments (separator '|' if any fragment contains a comma)
const STOPSEEN={}; // testing: a title fragment may carry '#n' = pause only on its n-th occurrence
const stopHere=(id,title)=>[...STOPAT].some(t=>{ if(typeof t==='number') return t===id; const [frag,n]=String(t).split('#'); if(!title.includes(frag)) return false; STOPSEEN[t]=(STOPSEEN[t]||0)+1; return !n||STOPSEEN[t]===+n; });
const D={task:'cyberstatus',version:VERSION,pid:q.get('PROLIFIC_PID')||'',study:q.get('STUDY_ID')||'',session:q.get('SESSION_ID')||'',
         start:new Date().toISOString(),ua:navigator.userAgent,timings:{},screens:[],visibility:[],autoCount:0,rounds:[],log:[]};
// Four ready versions (Roy, 30.9): ?v=1 high/accepted, ?v=2 high/rejected (lonely winner), ?v=3 low/accepted (beloved loser), ?v=4 low/rejected.
// The launcher files Version1_HighAccepted.html … Version4_LowRejected.html open index.html with the matching code (Prolific parameters kept).
const VCELL={1:['high',1],2:['high',0],3:['low',1],4:['low',0]}[q.get('v')];
D.standing=(VCELL&&VCELL[0])||CONFIG.force.standing||(Math.random()<.5?'high':'low');
D.acc=VCELL?VCELL[1]:(CONFIG.force.acc!==null&&CONFIG.force.acc!==undefined)?CONFIG.force.acc:(Math.random()<.5?1:0);
D.versionCode=q.get('v')||null;
D.cond={standing:D.standing,acc:D.acc};
D.botOrder=(function(){const a=BOTS.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;})();
if(DEBUG){ window.D=D; window.__screen=()=>screenNo; window.__next=()=>{autofill(); const b=document.getElementById('next'); if(b) b.click();}; }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const wait=ms=>new Promise(r=>setTimeout(r,ms*CONFIG.timeScale));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const sec=t=>+((Date.now()-t)/1000).toFixed(1);
let t0=Date.now();
function mark(k){D.timings[k]=(D.timings[k]||0)+(Date.now()-t0)/1000;t0=Date.now();}
const payload=()=>JSON.stringify(D,(k,v)=>k.startsWith('_')?undefined:v); // temporary '_' keys are never sent
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
  D.stage=stage; D.lastSave=new Date().toISOString();
  if(!CONFIG.endpoint) return Promise.resolve(null);
  const body=payload();
  if(stage==='complete'){ if(!D._finalBody) D._finalBody=body; const fb=D._finalBody; try{ localStorage.setItem(pendingKey(),fb); }catch(e){} return sendWithRetries(stage,fb,[0,2000,5000]).then(ok=>{ if(ok){ try{ localStorage.removeItem(pendingKey()); }catch(e){} } return ok; }); }
  sendWithRetries(stage,body,[0,3000]).catch(()=>{}); return Promise.resolve(undefined);
}
// ---------- generic screen: resolves when Next is clicked and validate() returns null, or when opts.timer (ms) runs out ----------
let screenNo=0, firstInteract=null; const T0=Date.now();
// tab hidden / shown again (switching apps or tabs), with the screen number where it happened (as in the Cyberball build)
document.addEventListener('visibilitychange',()=>D.visibility.push({state:document.visibilityState,screen:screenNo,ms:Date.now()-T0}));
// progress bar (monotonic; milestones set in the flow)
const prog=pct=>{ const el=document.getElementById('progressFill'); if(!el) return; D._prog=Math.max(D._prog||0,Math.min(100,pct)); el.style.width=D._prog+'%'; };
['pointerdown','keydown','input'].forEach(ev=>$app.addEventListener(ev,()=>{ if(firstInteract===null) firstInteract=Date.now(); },true));
const titleOf=html=>((document.querySelector('#app h2')||{}).textContent||html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,70));
const lastMs=()=>D.screens.length?D.screens[D.screens.length-1].ms:null; // reaction time of the screen that just finished
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function show(html,opts={}){
  return new Promise(res=>{
    const id=++screenNo; const tStart=Date.now(); firstInteract=null;
    $app.innerHTML=`<div class="screen">${opts.timer?'<div class="timer" id="timer"></div>':''}${html}${opts.noNext?'':'<div class="err" id="err"></div><div class="btnrow"><button class="next" id="next">→</button></div>'}</div>`;
    window.scrollTo(0,0);
    if(opts.setup) opts.setup();
    const title=titleOf(html);
    if(opts.noNext) return;
    let done=false,tH=null,iH=null,mH=null,errors=0;
    // per-screen reaction time: ms from render to the accepted Next press (or timeout), ms to the first interaction, rejected Next presses
    const finish=how=>{ if(done) return; done=true; if(tH) clearTimeout(tH); if(iH) clearInterval(iH); if(mH) clearInterval(mH); D.screens.push({n:id,title,ms:Date.now()-tStart,first:firstInteract===null?null:firstInteract-tStart,errors,end:how}); res(); };
    const btn=document.getElementById('next');
    if(opts.minTime){ btn.disabled=true; const ms=opts.minTime*CONFIG.timeScale, s0=Date.now(); const tick=()=>{const left=Math.ceil((ms-(Date.now()-s0))/1000); if(left<=0){btn.disabled=false;btn.textContent='→';clearInterval(mH);mH=null;} else btn.textContent=left+' s';}; tick(); mH=setInterval(tick,250); }
    if(opts.timer){ const ms=opts.timer*CONFIG.timeScale, s0=Date.now(), tm=document.getElementById('timer'); const tick=()=>{const left=Math.max(0,Math.ceil((ms-(Date.now()-s0))/1000)); tm.textContent=fmt(left); if(left<=10) tm.classList.add('warn');}; tick(); iH=setInterval(tick,250); tH=setTimeout(()=>{ if(opts.onTimeout) opts.onTimeout(); finish('timeout'); },ms); }
    btn.onclick=()=>{ const e=opts.validate?opts.validate():null; if(e){errors++; document.getElementById('err').textContent=e; return;} finish('next'); };
    if(DEBUG) console.log('screen',id,title);
    if(AUTO&&!stopHere(id,title)) autoDrive(id);
  });
}
async function timed(html,ms){ const t=Date.now(); $app.innerHTML=`<div class="screen">${html}</div>`; window.scrollTo(0,0); await wait(ms); D.screens.push({n:null,title:titleOf(html),ms:Date.now()-t,first:null,errors:0,end:'wait'}); }
const spinner=(txt)=>`<p><b>${txt}</b></p><div class="spinner"></div>`;
// ---------- widgets ----------
// Participant-facing questionnaire titles (Roy, 30.9, from the Cyberball build); the LSAS title is a draft
const TRAIT_TITLE={spin:'Social Anxiety Questionnaire',bdi:'Mood Questionnaire',bpni:'Relationships Questionnaire',fpes:'Fear of Positive Evaluation Questionnaire',npi16:'Social Behaviour Questionnaire',soas:'Feelings in the World Questionnaire',lsas:'Social Situations Questionnaire'};
const qhead=def=>`<span class="qpage"></span>${def.pageTitle?`<h2>${esc(def.pageTitle)}</h2>`:''}${def.pageSub?`<p class="qsub">${esc(def.pageSub)}</p>`:''}<div class="q-instr">${def.title}</div>`; // title + "Questionnaire k of n" + the instruction as a paragraph in a grey box (not a heading)
function matrix(key,def,extra){ // single-answer Likert matrix, Qualtrics style: numbered statements, whole cell clickable, sticky header; stores array in D[key]; partial() saves what was answered (null = missing) on a timeout
  const sc=def.scale, many=sc.length>=8;
  const head=`<thead><tr><th class="stem-h"></th>${sc.map((s,j)=>`<th>${esc(s)}${def.anchors&&j===0?`<span class="anchor">${esc(def.anchors[0])}</span>`:''}${def.anchors&&j===sc.length-1?`<span class="anchor">${esc(def.anchors[1])}</span>`:''}</th>`).join('')}</tr></thead>`;
  const rows=def.items.map((it,i)=>`<tr data-i="${i}"><td class="stem">${it.startsWith('…')?'':(i+1)+'. '}${esc(it)}</td>${sc.map((s,j)=>`<td class="c"><label class="cell"><input type="radio" name="${key}_${i}" value="${def.values[j]}"></label></td>`).join('')}</tr>`).join('');
  const html=qhead(def)+(extra||'')+`<div class="mx-wrap"><table class="mx qx${many?' many':''}">${head}<tbody>${rows}</tbody></table></div>`;
  return {html, validate:()=>{ const out=[]; let miss=false; def.items.forEach((_,i)=>{const r=document.querySelector(`input[name="${key}_${i}"]:checked`); const tr=document.querySelector(`tr[data-i="${i}"]`); if(!r){miss=true;tr.classList.add('missing');} else {tr.classList.remove('missing');out.push(+r.value);} }); if(miss) return 'Please answer every item.'; D[key]=out; return null; },
    partial:()=>{ D[key]=def.items.map((_,i)=>{const r=document.querySelector(`input[name="${key}_${i}"]:checked`); return r?+r.value:null;}); D[key+'Timeout']=true; }};
}
function timedMatrix(key,def,sec){ const m=matrix(key,def); return {html:m.html+autoNote(sec),timer:sec*1000,validate:()=>{ const e=m.validate(); if(e) return e; D[key+'Timeout']=false; return null; },onTimeout:()=>m.partial()}; }
function lsasMatrix(key,def){
  const rows=def.items.map((it,i)=>`<tr data-i="${i}"><td class="stem">${esc(it)}</td>${def.scaleA.map((s,j)=>`<td><input type="radio" name="${key}a_${i}" value="${j}"></td>`).join('')}<td style="width:14px"></td>${def.scaleB.map((s,j)=>`<td><input type="radio" name="${key}b_${i}" value="${j}"></td>`).join('')}</tr>`).join('');
  const html=`<h2>${def.title}</h2><div style="overflow-x:auto"><table class="mx"><tr><th></th><th colspan="4">Fear or anxiety</th><th></th><th colspan="4">Avoidance</th></tr><tr><th></th>${def.scaleA.map(s=>`<th>${s}</th>`).join('')}<th></th>${def.scaleB.map(s=>`<th>${s}</th>`).join('')}</tr>${rows}</table></div>`;
  return {html, validate:()=>{ const a=[],b=[]; let miss=false; def.items.forEach((_,i)=>{const ra=document.querySelector(`input[name="${key}a_${i}"]:checked`),rb=document.querySelector(`input[name="${key}b_${i}"]:checked`); const tr=document.querySelector(`tr[data-i="${i}"]`); if(!ra||!rb){miss=true;tr.classList.add('missing');} else {tr.classList.remove('missing');a.push(+ra.value);b.push(+rb.value);} }); if(miss) return 'Please answer every item (both columns).'; D[key+'_fear']=a; D[key+'_avoid']=b; return null; }};
}
function lsasCards(key,def){ // one card per situation, fear and avoidance as pill options (ported from the Cyberball build, fix16)
  const opts=(name,scale)=>scale.map((s,j)=>`<label class="lopt"><input type="radio" name="${name}" value="${j}"><span>${esc(s)}</span></label>`).join('');
  const html=`<h2>${def.title}</h2><div class="lsas-list">${def.items.map((it,i)=>`<div class="lsas-item" data-row="${i}"><div class="lsas-stem">${i+1}. ${esc(it)}</div><div class="lsas-row"><span class="lsas-lab">Fear or anxiety</span><div class="lopts">${opts(key+'a_'+i,def.scaleA)}</div></div><div class="lsas-row"><span class="lsas-lab">Avoidance</span><div class="lopts">${opts(key+'b_'+i,def.scaleB)}</div></div></div>`).join('')}</div>`;
  return {html, validate:()=>{ let miss=false; const a=[],b=[]; def.items.forEach((_,i)=>{ const ra=document.querySelector(`input[name="${key}a_${i}"]:checked`),rb=document.querySelector(`input[name="${key}b_${i}"]:checked`); const el=document.querySelector(`.lsas-item[data-row="${i}"]`); if(!ra||!rb){miss=true;el.classList.add('missing');} else {el.classList.remove('missing');a.push(def.values[+ra.value]);b.push(def.values[+rb.value]);} }); if(miss) return 'Please answer both rows of every item.'; D[key+'_fear']=a; D[key+'_avoid']=b; return null; }};
}
function oneSlider(key,title,ends){ // single 0–100 slider that must be touched
  const html=`<h2>${title}</h2><div class="slider" data-i="0"><input type="range" min="0" max="100" value="50" id="${key}s"><div class="ends"><span>${esc(ends[0])}</span><span>${esc(ends[1])}</span></div></div><p class="small">Please click or move the slider.</p>`;
  const setup=()=>{ const el=document.getElementById(key+'s'); const t=()=>{el.dataset.touched='1';}; ['input','change','pointerdown','keydown'].forEach(ev=>el.addEventListener(ev,t)); };
  return {html,setup,validate:()=>{ const el=document.getElementById(key+'s'); if(el.dataset.touched!=='1') return 'Please click or move the slider.'; D[key]=+el.value; return null; }};
}
function forcedChoice(key,def){ // NPI-16: one statement per pair; D[key] = keyed 0/1 per pair, D[key+'_raw'] = chosen side (0 left / 1 right)
  const html=qhead(def)+`<div class="pairs">`+def.pairs.map((p,i)=>`<div class="pair" data-max="1" data-row="${i}"><div class="pairname">${i+1}.</div><div class="opt" data-i="0">${esc(p[0])}</div><div class="opt" data-i="1">${esc(p[1])}</div></div>`).join('')+'</div>';
  return {html, setup:pairSetup, validate:()=>{ const raw=[]; let miss=false; document.querySelectorAll('.pair').forEach(p=>{const s=p.querySelector('.opt.sel'); if(!s){miss=true;p.classList.add('missing');} else {p.classList.remove('missing');raw.push(+s.dataset.i);} }); if(miss) return 'Please choose one statement in every pair.'; D[key+'_raw']=raw; D[key]=raw.map((v,i)=>v===def.key[i]?1:0); return null; }};
}
const BDI_TITLES=['Sadness','Pessimism','Past Failure','Loss of Pleasure','Guilty Feelings','Punishment Feelings','Self-Dislike','Self-Criticalness','Crying','Agitation','Loss of Interest','Indecisiveness','Worthlessness','Loss of Energy','Changes in Sleeping Pattern','Irritability','Changes in Appetite','Concentration Difficulty','Tiredness or Fatigue','Loss of Interest in Sex'];
const BDI_L7=['0','1a','1b','2a','2b','3a','3b'];
function groupChoice(key,def){ // BDI-II as the form: item headings, statements listed with their score numbers; D[key] = scored values, D[key+'_raw'] = chosen statement index
  const html=qhead(def)+`<div class="bdi-list">${def.groups.map((g,i)=>`<div class="bdi-item" data-g="${i}"><div class="bdi-head">${i+1}. ${esc(BDI_TITLES[i]||'')}</div>${g.map((t,j)=>`<label class="bdi-opt"><input type="radio" name="${key}_${i}" value="${j}"><span class="bdi-score">${g.length===7?BDI_L7[j]:j}</span><span>${esc(t)}</span></label>`).join('')}</div>`).join('')}</div>`;
  return {html,validate:()=>{ const raw=[]; let miss=false; document.querySelectorAll('.bdi-item').forEach(gr=>{const s=gr.querySelector('input:checked'); if(!s){miss=true;gr.classList.add('missing');} else {gr.classList.remove('missing'); raw.push(+s.value);} }); if(miss) return 'Please pick one statement in every group.'; D[key+'_raw']=raw; D[key]=raw.map((v,i)=>def.scores[i][v]); return null; }};
}
function pairSetup(){ document.querySelectorAll('.pair').forEach(p=>{ const els=[...p.querySelectorAll('.opt')]; els.forEach(el=>el.onclick=()=>{els.forEach(x=>x.classList.remove('sel')); el.classList.add('sel');}); }); }
function pairChoice(key,rows,mk,codes){ // one of two options per row (row = member name); D[key] = {name: code}
  const html='<div class="pairs">'+rows.map((n,i)=>{const [a,b]=mk(n); return `<div class="pair" data-max="1" data-row="${i}"><div class="pairname">${esc(n)}</div><div class="opt" data-i="0">${esc(a)}</div><div class="opt" data-i="1">${esc(b)}</div></div>`;}).join('')+'</div>';
  return {html, setup:pairSetup, validate:()=>{ const out={}; let miss=false; document.querySelectorAll('.pair').forEach(p=>{const s=p.querySelector('.opt.sel'); if(!s){miss=true;p.classList.add('missing');} else {p.classList.remove('missing');out[rows[+p.dataset.row]]=codes[+s.dataset.i];} }); if(miss) return 'Please make a choice for every member.'; D[key]=out; return null; }};
}
function sliders(key,def){
  const ends=def.ends||['Not at all','Very much'];
  const html=`<h2>${def.title}</h2>`+def.items.map((it,i)=>`<div class="slider" data-i="${i}"><label>${esc(it)} <span class="val" id="${key}v${i}">–</span></label><input type="range" min="0" max="100" value="50" id="${key}s${i}"><div class="ends"><span>${esc(ends[0])}</span><span>${esc(ends[1])}</span></div></div>`).join('')+'<p class="small">Please click or move every slider.</p>';
  const setup=()=>{ def.items.forEach((_,i)=>{ const el=document.getElementById(key+'s'+i), v=document.getElementById(key+'v'+i); const touch=()=>{el.dataset.touched='1'; v.textContent=el.value;}; ['input','change','pointerdown','keydown'].forEach(ev=>el.addEventListener(ev,touch)); }); };
  return {html, setup, validate:()=>{ let miss=false; def.items.forEach((_,i)=>{ const el=document.getElementById(key+'s'+i); const row=el.closest('.slider'); if(el.dataset.touched!=='1'){miss=true; row.classList.add('missing');} else row.classList.remove('missing'); }); if(miss) return 'Please click or move every slider.'; D[key]=def.items.map((_,i)=>+document.getElementById(key+'s'+i).value); return null; }};
}
function choiceList(key,options,{multi=false,max=99,exclusive=null,cards=false,desc=null,figs=false}={}){
  const cls=cards?'card':'opt';
  const html=`<div class="${cards?'cards':'opts'}" data-max="${multi?max:1}">`+options.map((o,i)=>cards?`<div class="card" data-i="${i}">${figs&&figOf(o,72)?`<div class="fig">${figOf(o,72)}</div>`:''}<b>${esc(o)}</b><i>${desc&&desc[o]!==undefined?'…I am '+esc(desc[o]):''}</i></div>`:`<div class="opt" data-i="${i}">${esc(o)}</div>`).join('')+'</div>';
  const setup=()=>{ const els=[...document.querySelectorAll('.'+cls)]; els.forEach(el=>el.onclick=()=>{ const i=+el.dataset.i; if(!multi){ els.forEach(x=>x.classList.remove('sel')); el.classList.add('sel'); return; } if(el.classList.contains('sel')){el.classList.remove('sel');return;} if(exclusive!==null&&i===exclusive){ els.forEach(x=>x.classList.remove('sel')); el.classList.add('sel'); return; } if(exclusive!==null) els[exclusive].classList.remove('sel'); const n=els.filter(x=>x.classList.contains('sel')).length; if(n>=max) return; el.classList.add('sel'); }); };
  const validate=()=>{ const sel=[...document.querySelectorAll('.'+cls+'.sel')].map(e=>+e.dataset.i); if(!sel.length) return 'Please make a choice.'; D[key]=multi?sel.map(i=>options[i]):options[sel[0]]; return null; };
  return {html,setup,validate};
}
// ---------- 3D staircase (SVG) ----------
const SW=84,SDX=26,SDY=14,SRISE=58,SX0=16;
const STEP_COL=['#f2c14e','#ddb055','#bda87c','#9ea3a8','#7f858c'];
function shade(hex,f){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255; const t=f<0?0:255; f=Math.abs(f); r=Math.round((t-r)*f+r); g=Math.round((t-g)*f+g); b=Math.round((t-b)*f+b); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
function avatar(cx,cy,n,isMe,cls){ const short=n.length>10?n.slice(0,9)+'…':n; const fg=figOf(n,52); const body=fg?fg.replace('<svg ',`<svg x="${cx-26}" y="${cy-34}" `):`<circle cx="${cx}" cy="${cy}" r="17" fill="${isMe?'#1a6fbf':'#ffffff'}" stroke="${isMe?'#0d4f8c':'#666'}" stroke-width="2"/><text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="15" font-weight="bold" fill="${isMe?'#fff':'#333'}">${esc(n[0].toUpperCase())}</text>`; return `<g class="avatar ${cls||''}" filter="url(#sh)">${body}<rect x="${cx-31}" y="${cy+21}" width="62" height="15" rx="7" fill="${isMe?'#1a6fbf':'#fff'}" stroke="${isMe?'#0d4f8c':'#999'}"/><text x="${cx}" y="${cy+32}" text-anchor="middle" font-size="10" fill="${isMe?'#fff':'#333'}">${esc(short)}</text></g>`; }
// assign: array of 5 names|null (one per step) — or o.wishes {name: step 1–5} for several names per step. o.clickable / o.selected (0–4) / o.pulse (name)
function stair(assign,o={}){
  assign=assign||[null,null,null,null,null]; const me=D.name||'';
  const perStep=[0,1,2,3,4].map(i=>o.wishes?Object.keys(o.wishes).filter(n=>o.wishes[n]===i+1).length:(assign[i]?1:0));
  const STOP=84+60*Math.max(0,Math.max(...perStep)-1), SBASE=STOP+4*SRISE+46; // headroom grows when several names share a step
  const W=SX0*2+5*SW+SDX,H=SBASE+18;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="stairsvg" style="font-family:Arial" role="img" aria-label="Team staircase"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9fbff"/><stop offset="1" stop-color="#e6ebf2"/></linearGradient><filter id="sh" x="-20%" y="-20%" width="140%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity=".28"/></filter></defs>`;
  s+=`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky)" rx="10"/><rect x="0" y="${SBASE}" width="${W}" height="${H-SBASE}" fill="#d3d9e0"/>`;
  for(let i=0;i<5;i++){
    const x=SX0+i*SW, yt=STOP+i*SRISE, col=STEP_COL[i];
    const top=`${x},${yt} ${x+SW},${yt} ${x+SW+SDX},${yt-SDY} ${x+SDX},${yt-SDY}`;
    const side=`${x+SW},${yt} ${x+SW+SDX},${yt-SDY} ${x+SW+SDX},${SBASE-SDY} ${x+SW},${SBASE}`;
    s+=`<g class="step${o.clickable?' clickable':''}${o.selected===i?' sel':''}" data-i="${i}">`;
    s+=`<polygon class="face side" points="${side}" fill="${shade(col,-.38)}"/>`;
    s+=`<rect class="face front" x="${x}" y="${yt}" width="${SW}" height="${SBASE-yt}" fill="${shade(col,-.16)}" stroke="${shade(col,-.42)}" stroke-width="1"/>`;
    s+=`<polygon class="face top" points="${top}" fill="${shade(col,.22)}" stroke="${shade(col,-.3)}" stroke-width="1"/>`;
    s+=`<text x="${x+SW/2}" y="${yt+27}" text-anchor="middle" font-size="21" font-weight="bold" fill="#fff" style="pointer-events:none">${i+1}</text>`;
    s+=`<text x="${x+SW/2}" y="${yt+42}" text-anchor="middle" font-size="10.5" fill="#fff" style="pointer-events:none">${ROLES[i]}</text>`;
    s+='</g>';
    const names=o.wishes?Object.keys(o.wishes).filter(n=>o.wishes[n]===i+1):(assign[i]?[assign[i]]:[]);
    names.forEach((n,k)=>{ const cx=x+SW/2+SDX/2, cy=yt-SDY/2-31-60*(names.length-1-k); s+=avatar(cx,cy,n,n===me,o.pulse===n?'pulse':''); }); // several names on one step stack upwards
  }
  return s+'</svg>';
}
function bindStair(box,fn){ box.querySelectorAll('.step.clickable').forEach(g=>g.addEventListener('click',()=>fn(+g.dataset.i))); }
// ---------- connections circle (SVG) ----------
function circle(web,incoming,outgoing,me){
  const NAMES=['Me'].concat(D.botOrder||BOTS); const POS={}; NAMES.forEach((n,i)=>{POS[n]=[200+150*Math.sin(2*Math.PI*i/5),190-150*Math.cos(2*Math.PI*i/5)];});
  const MK={'#8a8f96':'ah','#c3c9d0':'ahl','#1a6fbf':'ahm'};
  const seg=(a,b,color,w,dash)=>{const [x1,y1]=POS[a],[x2,y2]=POS[b];const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),r=30;return `<line x1="${x1+dx/L*r}" y1="${y1+dy/L*r}" x2="${x2-dx/L*r}" y2="${y2-dy/L*r}" stroke="${color}" stroke-width="${w}" ${dash?'stroke-dasharray="6,5"':''} marker-end="url(#${MK[color]})"/>`;};
  let s='<svg viewBox="0 -10 400 400" width="360" height="360" style="display:block;margin:6px auto;font-family:Arial;max-width:100%"><defs><marker id="ah" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#8a8f96"/></marker><marker id="ahl" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#c3c9d0"/></marker><marker id="ahm" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#1a6fbf"/></marker></defs>';
  web.forEach(([a,b,m])=>{ s+=seg(a,b,'#8a8f96',m?1.8:1.4); if(m) s+=seg(b,a,'#8a8f96',1.8); });
  outgoing.forEach(n=>s+=seg('Me',n,'#c3c9d0',2,true));
  incoming.forEach(n=>s+=seg(n,'Me','#1a6fbf',4));
  NAMES.forEach(n=>{const [x,y]=POS[n]; const nm=n==='Me'?me:n; const fg=figOf(nm,50); s+=`<circle cx="${x}" cy="${y}" r="28" fill="${n==='Me'?'#dfeeff':'#f2f2f2'}" stroke="#333" stroke-width="1.5"/>`; if(fg) s+=fg.replace('<svg ',`<svg x="${x-25}" y="${y-27}" `)+`<rect x="${x-30}" y="${y+29}" width="60" height="15" rx="7" fill="${n==='Me'?'#1a6fbf':'#fff'}" stroke="${n==='Me'?'#0d4f8c':'#999'}"/><text x="${x}" y="${y+40}" text-anchor="middle" font-size="10" fill="${n==='Me'?'#fff':'#333'}">${esc(nm.length>10?nm.slice(0,9)+'…':nm)}</text>`; else s+=`<text x="${x}" y="${y+5}" text-anchor="middle" font-size="13" font-weight="bold">${esc(nm.length>9?nm.slice(0,8)+'…':nm)}</text>`;});
  return s+'</svg>';
}
// ---------- desert illustration (SVG, drawn in-house) ----------
function desert(){
  return `<div class="desert"><svg viewBox="0 0 600 210" role="img" aria-label="Desert with a crash-landed plane"><defs><linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6ad"/><stop offset="1" stop-color="#f4a86a"/></linearGradient></defs>
  <rect width="600" height="210" fill="url(#dsky)"/><circle cx="498" cy="54" r="27" fill="#fff4c9" stroke="#ffd166" stroke-width="5"/>
  <path d="M0 132 Q130 84 260 128 T600 122 L600 210 L0 210 Z" fill="#e9c476"/><path d="M0 162 Q150 122 300 162 T600 152 L600 210 L0 210 Z" fill="#d6a44f"/><path d="M0 188 Q200 158 400 188 T600 180 L600 210 L0 210 Z" fill="#b9853c"/>
  <g transform="translate(150,128) rotate(-14)"><ellipse cx="0" cy="12" rx="52" ry="6" fill="#8a6a3a" opacity=".35"/><rect x="-44" y="-7" width="88" height="14" rx="7" fill="#d5dae2" stroke="#9aa3ae"/><polygon points="-12,-5 12,-5 5,-28 -6,-28" fill="#b7bfc9" stroke="#9aa3ae"/><polygon points="-6,1 22,1 34,19 4,19" fill="#b7bfc9" stroke="#9aa3ae"/><polygon points="-44,-5 -58,-20 -48,-20 -32,-5" fill="#b7bfc9" stroke="#9aa3ae"/><circle cx="30" cy="0" r="3" fill="#6b7480"/></g>
  <circle cx="176" cy="92" r="6" fill="#8b8b8b" opacity=".45"/><circle cx="186" cy="80" r="8" fill="#9a9a9a" opacity=".35"/><circle cx="200" cy="66" r="10" fill="#aaa" opacity=".25"/>
  <g transform="translate(380,150)"><rect x="-9" y="-14" width="18" height="24" rx="4" fill="#5c6b73"/><rect x="-4" y="-19" width="8" height="6" fill="#3f4a50"/></g>
  <g transform="translate(420,158)"><rect x="-11" y="-8" width="22" height="16" rx="2" fill="#dfe6ee" stroke="#8d99a6"/><line x1="-8" y1="-5" x2="6" y2="5" stroke="#fff" stroke-width="2"/></g>
  <g transform="translate(455,150)"><circle r="10" fill="#f4efe6" stroke="#6b5b3e" stroke-width="2"/><polygon points="0,-7 3,0 0,7 -3,0" fill="#c0392b"/></g>
  <text x="18" y="30" font-size="17" font-weight="bold" fill="#5a3d10" font-family="Arial">Mission preview: what would the team take along?</text></svg></div>`;
}
// ---------- autopilot (testing only; ?debug=1&auto=1) ----------
function autofill(){
  const err=document.getElementById('err'); const hasErr=err&&err.textContent;
  const groups={}; document.querySelectorAll('input[type=radio]').forEach(r=>{(groups[r.name]=groups[r.name]||[]).push(r);});
  Object.values(groups).forEach(g=>{ if(!g.some(r=>r.checked)){ const r=rnd(g); r.checked=true; r.dispatchEvent(new Event('change')); } });
  document.querySelectorAll('.opts,.cards,.pair').forEach(c=>{ const els=[...c.querySelectorAll('.opt,.card')]; if(!els.length) return; const max=+c.dataset.max||1; const sel=els.filter(e=>e.classList.contains('sel')); if(!sel.length||hasErr){ els.forEach(e=>e.classList.remove('sel')); shuffle(els).slice(0,max).forEach(e=>e.click()); } });
  document.querySelectorAll('input[type=text],textarea').forEach(el=>{ if(el.value||el.offsetParent===null) return; el.value=el.id==='age'?'30':el.id==='edu'?'15':el.id==='nm'?'Testy':el.dataset.min?Array.from({length:55},(_,i)=>'word'+i).join(' '):(el.tagName==='TEXTAREA'?'auto comment':'auto '+el.id); el.dispatchEvent(new Event('input')); });
  document.querySelectorAll('select').forEach(s=>{ if(!s.value){ if(s.id==='attn') s.value='Disagree'; else s.selectedIndex=1; } });
  document.querySelectorAll('input[type=range]').forEach(el=>{ if(el.dataset.touched!=='1'){ el.value=Math.floor(Math.random()*101); el.dispatchEvent(new Event('input')); } });
  document.querySelectorAll('[data-autofill="avatar"]').forEach(el=>{ if(el.__autofill) el.__autofill(); });
  document.querySelectorAll('input[type=range]').forEach(el=>{ if(el.dataset.touched!=='1'){ el.value=Math.floor(Math.random()*101); el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); } });
  const st=[...document.querySelectorAll('.step.clickable')]; if(st.length&&!document.querySelector('.step.sel')) rnd(st).dispatchEvent(new MouseEvent('click',{bubbles:true}));
}
function autoDrive(id){ let tries=0; const step=()=>{ if(screenNo!==id) return; if(++tries>400) return; autofill(); const btn=document.getElementById('next'); if(btn&&!btn.disabled) btn.click(); setTimeout(step,150); }; setTimeout(step,80); }
// ---------- trait questionnaires (list of keys; LSAS = fear matrix only) ----------
async function runTraits(list,p0,p1){
  for(let i=0;i<list.length;i++){ const t=list[i]; const page={pageTitle:TRAIT_TITLE[t]||'Questionnaire',pageSub:`Questionnaire ${i+1} of ${list.length}`}; let m;
    if(t==='lsas'){ const L=ITEMS.lsas; m=matrix('lsas_fear',Object.assign(page,{title:L.titleFear,scale:L.scaleA,values:L.values,items:L.items})); }
    else m=t==='npi16'?forcedChoice('npi16',Object.assign(page,ITEMS.npi16)):t==='bdi'?groupChoice('bdi',Object.assign(page,ITEMS.bdi)):matrix(t,Object.assign(page,ITEMS[t]));
    await show(m.html,m); mark(t); prog(p0+(p1-p0)*(i+1)/list.length); }
}
// ---------- emotions (13 items) in a random order drawn once per participant, the same at both administrations; stored in canonical order ----------
function emotionsMatrix(key){
  if(!D.panasOrder) D.panasOrder=shuffle(ITEMS.panas.items.map((_,i)=>i));
  const def=Object.assign({},ITEMS.panas,{pageTitle:'How do you feel right now?',items:D.panasOrder.map(i=>ITEMS.panas.items[i])});
  const m=matrix('_pan',def); const store=()=>{ const out=[]; D.panasOrder.forEach((orig,k)=>out[orig]=D._pan[k]); D[key]=out; };
  return {html:m.html,validate:()=>{ const e=m.validate(); if(e) return e; store(); D[key+'Timeout']=false; return null; },partial:()=>{ m.partial(); store(); D[key+'Timeout']=true; }};
}
// ---------- state check (6 items, order randomized once per participant; stored in canonical order) ----------
function stateCheck(key){
  if(!D.stateOrder) D.stateOrder=shuffle([0,1,2,3,4,5]);
  const def=Object.assign({},ITEMS.state,{items:D.stateOrder.map(i=>ITEMS.state.items[i])});
  const m=matrix('_st',def); const store=()=>{ const out=[]; D.stateOrder.forEach((orig,k)=>out[orig]=D._st[k]); D[key]=out; };
  return {html:m.html+autoNote(GT.state),timer:GT.state*1000,validate:()=>{ const e=m.validate(); if(e) return e; store(); D[key+'Timeout']=false; return null; },onTimeout:()=>{ m.partial(); store(); D[key+'Timeout']=true; }};
}
// ---------- single distress slider with a face that changes ----------
function distressSlider(key){
  const face=v=>v<=20?'😀':v<=40?'🙂':v<=60?'😐':v<=80?'😟':'😫';
  const html=`<h2>Right now, how much distress do you feel?</h2><div class="emoji" id="${key}face">😐</div><div class="slider" data-i="0"><input type="range" min="0" max="100" value="50" id="${key}s"><div class="ends"><span>Not distressed at all</span><span>Very distressed</span></div></div><p class="small">Please click or move the slider.</p>`;
  const setup=()=>{ const el=document.getElementById(key+'s'); const t=()=>{el.dataset.touched='1'; document.getElementById(key+'face').textContent=face(+el.value);}; ['input','change','pointerdown','keydown'].forEach(ev=>el.addEventListener(ev,t)); };
  return {html:html+autoNote(GT.distress),setup,timer:GT.distress*1000,validate:()=>{ const el=document.getElementById(key+'s'); if(el.dataset.touched!=='1') return 'Please click or move the slider.'; D[key]=+el.value; D[key+'Timeout']=false; return null; },onTimeout:()=>{ const el=document.getElementById(key+'s'); D[key]=el.dataset.touched==='1'?+el.value:null; D[key+'Timeout']=true; }};
}
// ---------- avatar self-placement (avatar.js; texts are DRAFTS pending Roy's approval) ----------
async function avatarScreen(key,phase){
  const text=phase==='pre'
    ?'Each member now places a figure to show the team how they see themselves right now. Drag the figure to the spot that best describes you: further to the right = more approachable, further to the left = more reserved; higher up = bigger, lower down = smaller. The figure changes as you move it. <b class="emph">Your figure will be shown to the other members, and theirs to you.</b>'
    :'Before the mission, each member places their figure again to show the team how they see themselves right now. Drag the figure to the spot that best describes you: further to the right = more approachable, further to the left = more reserved; higher up = bigger, lower down = smaller. <b class="emph">Your figure will be shown to the other members, and theirs to you.</b>';
  const w=AvatarField.create({id:key,title:'Choose your avatar',text,small:'Click or drag the figure, then press Next.',start:phase==='post'&&D.avatar_pre?{x:D.avatar_pre.x,y:D.avatar_pre.y}:undefined});
  const tmd=phase==='pre'; // Roy 1.10: timed before the ranking (the other members are waiting); untimed in the post-task block
  await show(w.html+(tmd?autoNote(GT.avatar):''),{setup:w.setup,timer:tmd?GT.avatar*1000:undefined,validate:()=>{ const e=w.validate(); if(e) return e; D[key]=w.value(); D[key+'Timeout']=false; return null; },onTimeout:()=>{ D[key]=w.value(); D[key+'Timeout']=true; }});
  mark(key);
}
// ---------- channel diagram for the connections outcome ----------
function channels(acc){
  const you=`<span class="you">${esc(D.name)}</span>`;
  return `<div class="channels"><div class="chan shared"><b>Team channel</b><div>${BOTS.map(esc).join(' · ')}${acc?' · '+you:''}</div></div><div class="chan sep"><b>Separate channel</b><div>${acc?'–':you}</div></div></div>`;
}
// ---------- ranking round ----------
async function rankingRound(r){
  const chain=RANK[D.standing][r-1].slice(); const desc=BOT_DESC[r-1];
  const R={round:r}; D.rounds.push(R);
  // 1. write one mission-related "I am" sentence (30-second limit; then the screen moves on with whatever was written)
  const ts=Date.now(); D._sent=null; D._sentAuto=false;
  const fallback=()=>{ const prev=D.rounds[r-2]&&D.rounds[r-2].sentence; if(prev) return prev; const first=(D.paragraph||'').split(/[.!?\n]/)[0].trim(); return first||'here to take part'; };
  await show(`<h2>Round ${r} of 5</h2><p>${r===1?'The ranking process will now begin.':'You and your team will now repeat the ranking process.'}</p><p>Introduce yourself to the other members with <b>one sentence</b>. Do not repeat your introduction; write it in your own words, without AI tools. You have 30 seconds.</p><div class="iam"><span>I am</span><input type="text" id="sent" maxlength="80"></div>`,
    {timer:30000,
     validate:()=>{ const v=document.getElementById('sent').value.trim(); if(!v) return 'Please complete the sentence.'; D._sent=v; return null; },
     onTimeout:()=>{ const v=document.getElementById('sent').value.trim(); if(v) D._sent=v; else {D._sent=fallback(); D._sentAuto=true;} }});
  R.sentence=D._sent; R.sentenceAuto=D._sentAuto; R.sentenceSeconds=sec(ts); R.sentenceMs=lastMs();
  // 2. vote for the top
  const everyone=shuffle(BOTS.concat([D.name])); R.voteOrder=everyone.slice(); const vdesc=Object.assign({},desc,{[D.name]:R.sentence});
  const c2=choiceList('_vote',everyone,{cards:true,desc:vdesc,figs:true}); D._vote=null; D._auto=false;
  await show(`<h2>Round ${r} – vote</h2><p>Please pick one of the other team members to be ranked at the top (step 1, Leader). Base your decision on their self-descriptions.</p><p class="small">(This screen is presented to all members. You cannot choose yourself.)</p>`+mustChoose+c2.html,
    {timer:CHOICE_SEC*1000,setup:c2.setup,validate:()=>{const e=c2.validate(); if(e) return e; if(D._vote===D.name) return 'You cannot choose yourself.'; return null;},
     onTimeout:()=>{ const sel=document.querySelector('.card.sel'); const v=sel?everyone[+sel.dataset.i]:null; D._vote=(v&&v!==D.name)?v:rnd(BOTS); D._auto=true; }});
  R.vote=D._vote; R.voteMs=lastMs(); R.voteAuto=D._auto;
  if(R.voteAuto) await timed(redCard(R.vote,' as your vote'),6000);
  await timed(spinner('Waiting for the other members to vote…'),5000);
  // 3. sequential placement on the staircase
  const assign=[null,null,null,null,null]; const label=n=>n==='ME'?D.name:n;
  let remaining=BOTS.concat(['ME']);
  const place=(pos,who)=>{assign[pos]=label(who); remaining=remaining.filter(x=>x!==who);};
  let chooser=null; place(0,chain[0]); chooser=chain[0];
  const view=(msg,opts)=>show(`<div class="split"><div class="txt"><h2>Round ${r} – ranking</h2>${msg}</div><div class="stair">${stair(assign,{pulse:D.name})}</div></div>`,opts);
  const viewTimed=(msg,ms)=>timed(`<div class="split"><div class="txt"><h2>Round ${r} – ranking</h2>${msg}</div><div class="stair">${stair(assign)}</div></div>`,ms);
  if(chain[0]==='ME') await viewTimed(`<p><b>You were chosen to be ranked at the top.</b></p>`,3000);
  else await viewTimed(`<p><b>${chain[0]} was chosen to be ranked at the top.</b></p><p>Please wait for ${chain[0]}'s decision.</p>`,5000);
  let order=chain.slice(1); let lastChooser=null;
  for(let pos=1;pos<5;pos++){
    if(chooser==='ME'){
      const opts=shuffle(remaining); R['pick'+pos+'Order']=opts.slice(); const cc=choiceList('_pick',opts,{cards:true,desc,figs:true}); D._pick=null; D._auto=false;
      const head=pos===1?'You were chosen to be ranked at the top.':esc(lastChooser)+' chose you.';
      await view(`<p><b>${head}</b></p><p>Choose a team member to be ranked beneath you (step ${pos+1}, ${ROLES[pos]}).</p>`+mustChoose+cc.html,
        {timer:CHOICE_SEC*1000,setup:cc.setup,validate:cc.validate,onTimeout:()=>{ const sel=document.querySelector('.card.sel'); D._pick=sel?opts[+sel.dataset.i]:rnd(opts); D._auto=true; }});
      const picked=D._pick; R['pick'+pos]=picked; R['pick'+pos+'Ms']=lastMs(); R['pick'+pos+'Auto']=D._auto; place(pos,picked);
      if(D._auto) await timed(redCard(picked,' for the step beneath you'),6000); order=[picked].concat(order.filter(x=>x!==picked));
      await viewTimed(`<p><b>You chose ${esc(picked)}.</b></p><p>${pos===4?esc(picked)+' was ranked at the bottom.':'Please wait for '+esc(picked)+"'s decision."}</p>`,pos===4?4000:5000);
      chooser=picked;
    } else {
      const nxt=order.find(x=>remaining.includes(x)); place(pos,nxt); order=order.filter(x=>x!==nxt);
      if(nxt==='ME'){
        lastChooser=chooser;
        if(pos<4){ chooser='ME'; }
        else { await viewTimed(`<p><b>${esc(chooser)} chose you.</b></p><p>You were ranked at the bottom.</p>`,4000); }
      } else {
        await viewTimed(`<p><b>${esc(chooser)} chose ${esc(nxt)}.</b></p><p>${pos===4?esc(nxt)+' was ranked at the bottom.':'Please wait for '+esc(nxt)+"'s decision."}</p>`,pos===4?4000:5000);
        chooser=nxt;
      }
    }
  }
  const myPos=assign.indexOf(D.name)+1; R.position=myPos; R.role=ROLES[myPos-1]; R.winner=assign[0]; R.finalOrder=assign.slice();
  await show(`<div class="split"><div class="txt"><h2>Round ${r} result</h2><p class="banner">Round winner: <b>${esc(R.winner)}</b></p><p>In this round you were ranked <b>${ORD[myPos-1]}</b> (step ${myPos}, <b>${ROLES[myPos-1]}</b>).</p><p>The rankings of this round are added to the overall standing.</p>${autoNote(GT.result)}</div><div class="stair">${stair(assign)}</div></div>`,{timer:GT.result*1000});
  R.resultMs=lastMs(); mark('rank'+r);
}
// ---------- connections round (cards show this round's sentences) ----------
async function connectionsRound(r){
  const R=D.rounds[r-1]; const S=D.acc?CONN.acc:CONN.rej; const desc=BOT_DESC[r-1];
  const connOpts=shuffle(BOTS); R.connOrder=connOpts.slice(); const c=choiceList('_conn',connOpts,{multi:true,max:2,cards:true,desc,figs:true}); D._conn=null; D._auto=false;
  await show(`<h2>Connections – round ${r}</h2><p>Choose <b>two</b> members you would like to be connected with during the mission. Everyone chooses at the same time; the connections are then shown to the whole team.</p>`+mustChoose.replace('taking part in the ranking','taking part in the connections')+c.html,
    {timer:CHOICE_SEC*1000,setup:c.setup,validate:()=>{const e=c.validate(); if(e) return e; if(D._conn.length!==2) return 'Please choose exactly two members.'; return null;},
     onTimeout:()=>{ const sel=[...document.querySelectorAll('.card.sel')].map(e=>connOpts[+e.dataset.i]); const rest=shuffle(BOTS.filter(b=>!sel.includes(b))); D._conn=sel.concat(rest).slice(0,2); D._auto=true; }});
  R.connPicks=D._conn.slice(); R.connMs=lastMs(); R.connAuto=D._auto;
  if(R.connAuto) await timed(redCard(R.connPicks.join(' and '),' as your connections').replace('the team cannot rank without your choice, and it counts as not taking part in the ranking','the team cannot form its connections without your choice, and it counts as not taking part'),6000);
  await timed(spinner('Waiting for the other members to make their choices…'),5000);
  const inc=S.in[r-1];
  await show(`<h2>Connections – round ${r}</h2>${circle(S.web[r-1],inc,R.connPicks,D.name)}<p class="legend"><span style="color:#1a6fbf;font-weight:bold">thick blue = chose you</span> &nbsp; light grey dashed = your choices &nbsp; grey = the others' choices (↔ chose each other)</p><p><b>You were chosen by:</b> ${inc.length?inc.join(', '):'no one'}.<br><b>You chose:</b> ${R.connPicks.join(', ')}</p>${autoNote(GT.read)}`,{timer:GT.read*1000});
  R.connReceived=inc.slice(); R.connResultMs=lastMs(); mark('conn'+r);
}
// ---------- desired position on the staircase, shown to the team (after round 1 and after the final ranking) ----------
async function wishScreen(phase){
  const ts=Date.now(); let sel=null;
  const intro=phase==='r1'
    ?`<h2>After the first round</h2><p>Before the ranking continues, each member states the position they would like to reach in the team. <b class="emph">Your choice will be shown to the other members, and theirs to you.</b></p><p><b>Click the step you would like to be on.</b></p>`
    :`<h2>Before the mission</h2><p>The ranking is complete. Each member now states the position they would like to have in the team during the mission. <b class="emph">Your choice will be shown to the other members, and theirs to you.</b></p><p><b>Click the step you would like to be on.</b></p>`;
  const render=()=>{ const a=[null,null,null,null,null]; if(sel!==null) a[sel]=D.name; const box=document.getElementById('stairbox'); box.innerHTML=stair(a,{clickable:true,selected:sel}); bindStair(box,i=>{sel=i; render(); document.getElementById('wishTxt').innerHTML=`You chose step <b>${i+1}</b> (${ROLES[i]}).`;}); };
  await show(`<div class="split"><div class="txt">${intro}<p id="wishTxt" class="small">No step chosen yet.</p>${autoNote(GT.wish)}</div><div class="stair" id="stairbox"></div></div>`,{setup:render,timer:GT.wish*1000,validate:()=>sel===null?'Please click the step you would like.':null,onTimeout:()=>{}});
  D['wish_'+phase]={step:sel===null?null:sel+1,role:sel===null?null:ROLES[sel],seconds:sec(ts),timeout:sel===null};
  await timed(spinner('Waiting for the other members to state their choices…'),5000);
  const wishes=Object.assign({},WISH); if(sel!==null) wishes[D.name]=sel+1;
  const on=s=>BOTS.filter(b=>WISH[b]===s);
  await show(`<div class="split"><div class="txt"><h2>The team's choices</h2><p>${on(1).join(' and ')} would like to be on step 1 (Leader). ${on(2).join(' and ')} would like to be on step 2 (First Deputy).</p><p>${sel===null?'<b>You</b> did not state a position in time; the team was told that you did not choose.':`<b>You</b> chose step ${sel+1} (${ROLES[sel]}).`}</p><p>${phase==='r1'?'The ranking now continues.':'The mission begins shortly.'}</p>${autoNote(GT.read)}</div><div class="stair">${stair(null,{wishes})}</div></div>`,{timer:GT.read*1000});
  mark('wish_'+phase);
}
// ---------- main flow ----------
async function main(){
  resendPending();
  await show(`<h2>Welcome</h2><p>Thank you for choosing our study! This study examines decision-making in a group.</p><p>First you will fill out a few questionnaires about yourself. Then you will take part in an online team task with other participants. Afterwards you will answer some questions about your experience and a few more questionnaires.</p><p><b>About 40 minutes.</b> The study must be completed in one sitting. Participation is voluntary; if you choose to stop, close the browser window.</p><p>Confidentiality: all your data are anonymous and confidential. Questions: ${CONFIG.contactEmail}</p><p><b>By pressing the button I declare that I have read and understood the consent form and provide my free and informed consent to participate.</b></p>`);
  D.consent=new Date().toISOString(); await save('consent');
  await show(`<h2>Questionnaires</h2><p>Before the team task, please fill out a few questionnaires about yourself. Answer honestly; there are no right or wrong answers.</p>`);
  await runTraits(CONFIG.traitsBefore||[],2,8); await save('traits_before');
  // framing (F1) + mission preview
  await show(`<h2>The team mission</h2><p>You are about to take part in an online team mission with four other participants.</p>${desert()}<p><b>The mission:</b> the team is given a scenario, such as being stranded in a desert, on a remote island, or in space, and has to agree, within a time limit, on which items to take along and in what order of importance. The task requires teamwork, leadership, creativity, general education, and knowledge in areas such as geography, physics, biology, and first aid. Every member first marks their own choice; then the team decides together in its channel, and the team's plan is scored against an expert solution.</p><p>Before the mission, two things will be decided by the team itself:</p><p><b>Roles.</b> The team will rank its members in five rounds. Rankings decide each member's role and how much influence they have over the final decision. The top-ranked member leads the mission.</p><p><b>Connections.</b> In each round, members also choose who they would like to be connected with during the mission. Connections decide who you will be in direct contact with. This is not about ability – it is about who you would like to be in contact with.</p><p>During the mission, you will be in a shared channel with your connections. Members without connections work in a separate channel.</p><p>If you are ready, press Next.</p>`);
  await timed(spinner('Please wait while we connect to the other participants. It might take a few seconds.'),6000);
  await show(`<p>Please write your name or nickname (this is how the other members will see you).</p><input type="text" id="nm" maxlength="20">`,{validate:()=>{const v=document.getElementById('nm').value.trim(); if(!v) return 'Please enter a name.'; if(BOTS.concat(['Me','You']).some(b=>b.toLowerCase()===v.toLowerCase())) return 'This name is already used by another member. Please choose a different one.'; D.name=v; return null;}});
  // self-introduction paragraph (40–120 words, two minutes)
  const tp=Date.now(); const wc=t=>t.trim()?t.trim().split(/\s+/).length:0;
  await show(`<h2>Introduce yourself</h2><p>Write a short paragraph introducing yourself to the team (about 40–120 words). The other members will read it before the ranking begins, and you will read theirs.</p><p class="small">Who are you, what do you do, what do you enjoy, what are you like in a team? Please write in your own words, without AI tools; what matters is that it truly represents you. You have two minutes.</p><textarea id="para" rows="6" data-min="40" maxlength="1200"></textarea><div class="wc" id="wc">0 words</div>`,
    {timer:120000,setup:()=>{const ta=document.getElementById('para'); ta.oninput=()=>document.getElementById('wc').textContent=wc(ta.value)+' words';},
     validate:()=>{const v=document.getElementById('para').value.trim(); const n=wc(v); if(n<40) return `Please write at least 40 words (currently ${n}).`; if(n>120) return `Please keep it under 120 words (currently ${n}).`; D.paragraph=v; D.paragraphWords=n; D.paragraphTimeout=false; return null;},
     onTimeout:()=>{const v=document.getElementById('para').value.trim(); D.paragraph=v; D.paragraphWords=wc(v); D.paragraphTimeout=true;}});
  D.paragraphSeconds=sec(tp); mark('paragraph');
  await timed(spinner('Please wait while the other members write their introductions…'),9000);
  D.introRead={};
  for(const b of D.botOrder){ const tr=Date.now(); await show(`<h2>Meet the team: ${b}</h2><div class="intro"><div class="who">${b}</div>${esc(BOT_INTRO[b])}</div><p class="small">Take a moment to read ${b}'s introduction. The button unlocks after a few seconds.</p>`,{minTime:10000}); D.introRead[b]=sec(tr); }
  await timed(spinner('The other members are reading the introductions…'),6000);
  mark('intros');
  prog(8); await avatarScreen('avatar_pre','pre');
  await timed(spinner('Waiting for the other members to place their figures…'),5000);
  prog(12);
  // ranking instructions (F2) with the staircase and the five roles
  await show(`<div class="split"><div class="txt"><h2>How the ranking works</h2><p>Before the mission, you and your team will rank each member to decide who does what. Each step of the staircase is a role:</p><ol><li><b>Leader</b> – runs the discussion and makes the final call.</li><li><b>First Deputy</b> – the Leader's right hand; contributes and argues for the plan.</li><li><b>Second Deputy</b> – contributes and argues for the plan.</li><li><b>Support</b> – prepares the parts assigned by the Leader.</li><li><b>Second Support</b> – assists the First Deputy.</li></ol><p>The ranking works like this:</p><ol><li>First, everyone votes for who should be ranked at the top (step 1, Leader).</li><li>Then the person with the most votes chooses who is ranked second (step 2), that member chooses who is ranked third, and so on, until everyone is ranked.</li></ol><p>This is repeated <b>five times</b> so that every member has a chance to show what they can bring. At the end, the overall ranking is computed and the roles for the mission are assigned.</p><p>(We remind you that the mission requires cooperation, creativity, and analytical thinking.)</p>${autoNote(GT.rankInfo)}</div><div class="stair">${stair()}</div></div>`,{timer:GT.rankInfo*1000});
  // connections instructions (F3) with the circle
  await show(`<h2>How the connections work</h2><p>Rankings decide roles. <b>Connections decide who you are in contact with.</b></p><p>After each ranking round, every member chooses <b>two</b> people they would like to be connected with during the mission – the people they would want in their channel. Everyone chooses at the same time, and then all the connections are shown on a circle like this one:</p>${circle(BASE,['Emma'],['Emma','Tom'],D.name)}<p class="legend"><span style="color:#1a6fbf;font-weight:bold">thick blue = chose you</span> &nbsp; light grey dashed = your choices &nbsp; grey = the others' choices (↔ chose each other)</p><p>In this example you chose Emma and Tom, and Emma chose you back.</p><p><b>This is not about ability.</b> Choose the people you would like to be in contact with. During the mission, you will be in a shared channel with your connections; members without connections work in a separate channel.</p>${autoNote(GT.connInfo)}`,{timer:GT.connInfo*1000});
  mark('instructions');
  { const pw=oneSlider('participation_pre','How much would you like to take part in the ranking rounds with these members?',['Not at all','Very much']); await show(pw.html+autoNote(GT.slider),{setup:pw.setup,timer:GT.slider*1000,validate:pw.validate,onTimeout:()=>{ const el=document.getElementById('participation_pres'); D.participation_pre=el&&el.dataset.touched==='1'?+el.value:null; D.participation_preTimeout=true; }}); mark('participation_pre'); }
  prog(15);
  // baseline emotions + distress right before the first round, after everything else (Roy, 29.9 night); timed like the task since 1.10
  { const e1=emotionsMatrix('panas_pre'); await show(e1.html+autoNote(GT.emotions),{timer:GT.emotions*1000,validate:e1.validate,onTimeout:e1.partial}); mark('panas_pre'); }
  { const ds=distressSlider('distress_pre'); await show(ds.html,ds); mark('distress_pre'); }
  for(let r=1;r<=5;r++){
    await rankingRound(r); await connectionsRound(r);
    if(r===1){ const st=stateCheck('state1'); await show(st.html,st); D.rounds[0].state=(D.state1||[]).slice(); mark('state1'); }
    if(r===1) await wishScreen('r1');
    await save('round'+r); prog(15+12*r);
  }
  await timed(spinner('Computing the overall ranking…'),5000);
  const hi=D.standing==='high'; const finalOrder=FINAL[D.standing].map(n=>n==='ME'?D.name:n);
  D.outcome={finalRank:hi?1:5,role:hi?ROLES[0]:ROLES[4],finalOrder,connections:D.acc?BOTS.slice():[]};
  await show(`<div class="split"><div class="txt"><h2>Overall ranking: ${hi?'First':'Last'}.</h2><p>${hi?"You are the team's <b>Leader</b> for the mission. You will direct the discussion and make the final call.":"You are the team's <b>Second Support</b> for the mission. You will carry out the parts assigned to you."}</p><p>The mission begins shortly.</p>${autoNote(GT.outcome)}</div><div class="stair">${stair(finalOrder)}</div></div>`,{timer:GT.outcome*1000});
  const S=D.acc?CONN.acc:CONN.rej; const lastPicks=D.rounds[4].connPicks;
  await show(`<h2>Your connections: ${D.acc?'Emma, Tom, Taylor, Pixel.':'none.'}</h2>${circle(S.web[4],S.in[4],lastPicks,D.name)}<p class="legend"><span style="color:#1a6fbf;font-weight:bold">thick blue = chose you</span> &nbsp; light grey dashed = your choices &nbsp; grey = the others' choices (↔ chose each other)</p>${channels(D.acc)}<p>${D.acc?'During the mission you will be in the shared channel with the whole team.':'During the mission you will work in a separate channel. The other members will be in the shared channel.'}</p><p>The mission begins shortly. Before it starts, there are a few quick steps and some questions.</p>${autoNote(GT.outcome)}`,{timer:GT.outcome*1000});
  mark('outcome'); await save('outcome'); prog(78);
  // right after the outcome is announced (Roy, 30.9): distress → state check → emotions
  { const ds=distressSlider('distress_post'); await show(ds.html,ds); mark('distress_post'); }
  { const st=stateCheck('state5'); await show(st.html,st); D.rounds[4].state=(D.state5||[]).slice(); mark('state5'); }
  { const e2=emotionsMatrix('panas_post'); await show(e2.html+autoNote(GT.emotions),{timer:GT.emotions*1000,validate:e2.validate,onTimeout:e2.partial}); mark('panas_post'); }
  await wishScreen('final');
  await avatarScreen('avatar_post','post');   // Roy 1.10: the second avatar choice comes right after the final place-on-the-stairs declaration
  { const pm=oneSlider('participation_mission','How much would you like to take part in the mission with this team?',['Not at all','Very much']); await show(pm.html+autoNote(GT.slider),{setup:pm.setup,timer:GT.slider*1000,validate:pm.validate,onTimeout:()=>{ const el=document.getElementById('participation_missions'); D.participation_mission=el&&el.dataset.touched==='1'?+el.value:null; D.participation_missionTimeout=true; }}); mark('participation_mission'); }
  // post measures
  const ps=matrix('pstatus',ITEMS.pstatus); await show(ps.html,ps);
  const inc=matrix('inclusion',ITEMS.inclusion); await show(inc.html,inc);
  const mp=sliders('metaperc',ITEMS.metaperc); await show(mp.html,mp);
  const sat=sliders('satisfaction',ITEMS.satisfaction); await show(sat.html,sat);
  const ex=matrix('expect',ITEMS.expect); await show(ex.html,ex);
  const dz=sliders('desires',ITEMS.desires); await show(dz.html,dz);
  mark('post1');
  // private "should" items
  { let sel=null; const ts=Date.now(); const render=()=>{ const a=[null,null,null,null,null]; if(sel!==null) a[sel]=D.name; const box=document.getElementById('stairbox'); box.innerHTML=stair(a,{clickable:true,selected:sel}); bindStair(box,i=>{sel=i; render(); document.getElementById('shTxt').innerHTML=`You chose step <b>${i+1}</b> (${ROLES[i]}).`;}); };
    await show(`<div class="split"><div class="txt"><h2>In your own view</h2><p>Based on your abilities, where would it be most right for you to be in this team? <span class="small">(This is not shown to the other members.)</span></p><p><b>Click the step.</b></p><p id="shTxt" class="small">No step chosen yet.</p></div><div class="stair" id="stairbox"></div></div>`,{setup:render,validate:()=>sel===null?'Please click a step.':null});
    D.shouldRank=sel+1; D.shouldRankSeconds=sec(ts); }
  const SP=['In the shared channel with the whole team','With some of the members (choose whom)','On my own, submitting my part through the system'];
  const sp=choiceList('_shouldPart',SP); await show(`<p>Regardless of the connections, how do you think you <b>should</b> take part in the mission? <span class="small">(Not shown to the other members.)</span></p>`+sp.html,sp);
  D.shouldParticipate=['everyone','some','alone'][SP.indexOf(D._shouldPart)];
  if(D.shouldParticipate==='some'){ const sw=choiceList('shouldWith',BOTS,{multi:true,max:4}); await show(`<p>With whom?</p>`+sw.html,sw); } else D.shouldWith=[];
  // literal manipulation checks (recall)
  const mc=(id,label,opts)=>`<p><b>${label}</b></p><select id="${id}"><option value="">–</option>${opts.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`;
  await show(`<h2>Two quick questions</h2>${mc('ck_rank','What was your overall ranking in the team?',['1 (first)','2','3','4','5 (last)'])}${mc('ck_conn','How many members chose to be connected with you in the last round?',['0','1','2','3','4'])}`,
    {validate:()=>{const a=document.getElementById('ck_rank').value,b=document.getElementById('ck_conn').value; if(!a||!b) return 'Please answer both questions.'; D.check={rank:parseInt(a),conn:parseInt(b)}; return null;}});
  // real choice: take part in the mission or not
  const MC=['Take part in the mission','Finish the study without the mission'];
  const mchoice=choiceList('_mission',MC); await show(`<h2>The mission</h2><p>The mission is optional. You can take part in it after the questionnaires (about 10 more minutes, with the same team and the same roles), or finish the study without it. Your payment is the same either way.</p><p><b>What do you choose?</b></p>`+mchoice.html,mchoice);
  D.missionChoice=['take_part','finish'][MC.indexOf(D._mission)];
  mark('post2'); await save('post'); prog(86);
  // trait questionnaires after the task: NPI-16, LSAS (fear only), Sense of Absence (Roy, 30.9)
  await show(`<h2>Questionnaires</h2><p>Before the mission, please fill out the remaining questionnaires about yourself. Answer honestly; there are no right or wrong answers.</p>`);
  await runTraits(CONFIG.traitsAfter||[],86,98); await save('traits');
  await show(`<h2>A few details about you</h2>${mc('gender','What is your gender?',['Man','Woman','Other'])}<p><b>What is your age?</b></p><input type="text" id="age" style="width:100px"><p><b>How many years of formal education do you have (beginning with 1st grade)?</b></p><input type="text" id="edu" style="width:100px">${mc('marital','What is your marital status?',['Single, never married','Romantic relationship (more than three months)','Married or domestic partnership','Divorced','Widowed'])}${mc('children','Do you have children?',['No','Yes'])}<p><b>If yes, how many children?</b></p><input type="text" id="nchild" style="width:100px">${mc('attract',"I'm mostly attracted to:",['Men','Women','Both',"I don't want to answer"])}<p><b>Please specify your nationality:</b></p><input type="text" id="nat"><p><b>In politics, where would you place yourself?</b></p><div class="slider" data-i="0"><input type="range" min="0" max="100" value="50" id="pol"><div class="ends"><span>Left</span><span>Right</span></div></div><p class="small">Please click or move the slider.</p>${mc('attn','This is an attention check. Please select "Disagree".',['Totally agree','Agree','Neutral','Disagree','Totally disagree'])}${D.pid?'':'<p><b>Please enter your Prolific ID:</b></p><input type="text" id="pidm">'}`,
    {setup:()=>{ const el=document.getElementById('pol'); const t=()=>{el.dataset.touched='1';}; ['input','change','pointerdown','keydown'].forEach(ev=>el.addEventListener(ev,t)); },
     validate:()=>{const g=id=>document.getElementById(id).value.trim(); if(!g('gender')||!g('age')||!g('marital')||!g('attn')) return 'Please complete the required fields (gender, age, marital status, attention check).'; const pol=document.getElementById('pol'); if(pol.dataset.touched!=='1') return 'Please click or move the politics slider.'; D.demog={gender:g('gender'),age:g('age'),edu:g('edu'),marital:g('marital'),children:g('children'),nChildren:g('nchild'),attract:g('attract'),nationality:g('nat'),politics:+pol.value,attention:g('attn')}; if(!D.pid) D.pid=g('pidm'); return null;}});
  await show(`<h2>About the other members</h2>${D.botOrder.map(b=>mc('aw_'+b,`According to your understanding, ${b} was a`,['Man','Woman','Computer','AI'])).join('')}<p><b>Any comments on the study?</b></p><textarea id="cmt" rows="3"></textarea>`,{validate:()=>{D.awareness={}; for(const b of BOTS){const v=document.getElementById('aw_'+b).value; if(!v) return 'Please answer for every member.'; D.awareness[b]=v;} D.comments=document.getElementById('cmt').value; return null;}});
  D.end=new Date().toISOString(); mark('post3'); prog(100);
  $app.innerHTML='<div class="screen"><h2>Saving your answers…</h2><p>Please keep this window open. This takes a few seconds.</p></div>';
  const savedOk=await save('complete');
  const dlLink=`<p><a id="dl" download="cyberstatus_${(D.pid||'test').replace(/[^A-Za-z0-9_-]/g,'')}.json">Download your data file${savedOk===null?' (local test mode)':''}</a></p>`;
  const dl=savedOk===true?'':(savedOk===false?`<p class="err"><b>We could not confirm that your answers were saved.</b> Please try again; if it still fails, download this file and send it to the researcher through a Prolific message, then continue.</p><p><button class="next" type="button" id="retrySave">Try saving again</button> <span id="retryMsg" class="small"></span></p>`+dlLink:dlLink);
  await show(`<h2>Thank you!</h2><p><b>There is no mission.</b></p><p>This study looks at how people respond to where they are ranked, and to being chosen or not chosen, in a group task.</p><p>The four other members were not real: they were controlled by the computer. Your rankings, the connections you received, the positions the others asked for, and everything they "wrote" or "chose" were set in advance and assigned at random. They say nothing about you or about how you come across to others.</p><p>Thank you for taking part. Questions, or a request to remove your data: ${CONFIG.contactEmail}.</p>${dl}${CONFIG.completionUrl?'<p>Press the button to return to Prolific.</p>':''}`,
    {setup:()=>{const a=document.getElementById('dl'); if(a) a.href=URL.createObjectURL(new Blob([JSON.stringify(JSON.parse(payload()),null,1)],{type:'application/json'})); wireRetry();}});
  if(CONFIG.completionUrl) location.href=CONFIG.completionUrl; else await show('<h2>You may now close this window.</h2>',{noNext:true});
}
main().catch(e=>{ $app.innerHTML=`<div class="screen"><p>Something went wrong: ${esc(e.message)}. Please contact ${CONFIG.contactEmail}.</p></div>`; console.error(e); });
})();
