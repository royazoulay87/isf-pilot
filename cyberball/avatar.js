/* avatar.js — CyberStatus v3 (ISF 2026 pilot): two-dimensional self-placement figure (Roy, 29.9.2026). DRAFT for Roy's review.
   Self-contained, no dependencies, monochrome (Roy: no colour, so that colour does not cue one dimension only).
   Horizontal axis: reserved (x = 0) ↔ approachable (x = 100): arms tightly crossed, narrowed averted eyes, tight mouth → arms thrown
   open, big smile, head tilted toward the viewer. Vertical axis: smaller (y = 0) ↔ bigger (y = 100): tiny, thin, hunched, feet
   together → about three times taller and much broader, level shoulders, wide stance. Extremes are deliberately exaggerated; the body is a
   pictogram without muscle or other gender cues (Roy, 29.9).
   Internally s = size (from y), w = warmth (from x).
   API — the same {html, setup, validate} contract as the app's matrix/sliders widgets:
     const w = AvatarField.create({id, title, text, small, labels:{left,right,top,bottom}, error, requireTouch, start:{x,y},
                                   split, pointsText});
       split: true = the "points" variant (Roy, 29.9): 100 points divided between the two qualities, x + y = 100, so 100 points of
       approachability means 0 of size and vice versa. The figure slides along the line from (100, 0) to (0, 100), drawn dashed on the
       field; positions are whole points. pointsText(x, y) → the readout under the field (default text below; DRAFT).
     w.html        markup (title/text/small are trusted HTML strings, as elsewhere in app.js)
     w.setup()     bind events once the markup is in the DOM (starts the clock)
     w.validate()  → error string (figure never touched, when requireTouch !== false) or null
     w.value()     → {x, y, touched, drags, seconds, moveSeconds}
     w.autofill()  random position for the autopilot; the field element also carries data-autofill and el.__autofill
     AvatarField.figureSVG(x, y, size, renderer) → standalone <svg> of the figure at (x, y): used on the vote cards (each member's
                   figure next to their "I am" sentence; the bots' positions are scripted by the app) and for previews
     renderer option / AvatarField.renderers: {figure(s, w, cx, cy), bbox(s, w)} draws the figure; default = the monochrome pictogram
                   below; avatar_cb.js adds AvatarField.renderers.cyberball (the Throw & Catch character, with the throw/catch frames)
   Data: x, y = integers 0–100 (right = approachable, up = bigger); touched = pressed, dragged or keyed at least once; drags = number of
   presses; seconds = screen onset → value(); moveSeconds = first touch → last release (null if never touched); in the split variant
   also split = 100 (the rule x + y = 100).
   The field element dispatches 'avf-change' (detail = value()) on every change. */
(function(global){
'use strict';
// ---- field geometry (SVG user units) ----
// Mapping x, y → the figure's centre: at each extreme the figure's own edge touches the field edge, whatever its size. So the reachable
// centre range shrinks only as much as the figure's current bounding box requires (the big figure keeps its centre away from the top,
// the small figure reaches the bottom corners; Roy, 29.9). The inverse mapping (pointer → x, y) is solved by bisection.
const FIELD=508;            // visible field side
const LX=110, TY=30;        // space for the labels left/right (fits "Approachable ▶") and top/bottom
const W=FIELD+2*LX, H=FIELD+2*TY, FX=LX, FY=TY;
let seq=0;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const f1=v=>(+v).toFixed(1);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BODY='#858c97', LIMB='#6d7582', EDGE='#4d5461', FACE='#262c35';   // one grey figure everywhere
// Arm posture = bilinear blend over a 3 × 3 grid of key poses (rows: small / mid / big; columns: reserved / neutral / warm).
// Each key pose = [elbow x, elbow y, hand x, hand y] for the RIGHT arm (mirrored for the left), in the figure's local coordinates.
function armPose(s,w,K){
  const fw=w*2, fs=s*2, iw=Math.min(1,Math.floor(fw)), is=Math.min(1,Math.floor(fs)), tw=fw-iw, ts=fs-is;
  const A=K[is][iw], B=K[is][iw+1], C=K[is+1][iw], D=K[is+1][iw+1];
  return A.map((v,k)=>{ const lo=A[k]+(B[k]-A[k])*tw, hi=C[k]+(D[k]-C[k])*tw; return lo+(hi-lo)*ts; });
}
// ---- geometry of the figure: s = size 0–1 (height, breadth, muscle, expansive posture), w = warmth 0–1 (expression, arm openness) ----
function geom(s,w){
  const Hh=64+130*s, top=-Hh/2, bot=Hh/2;                         // total height 64 → 194
  const rh=9+6*s, neckLen=.5+7*s, neckW=2+4.5*s;                  // head radius 9 → 15; the head sinks into the shoulders when small
  const droop=(1-s)*8, bulge=2.5*s;                               // drooping, rounded shoulders (small) → level shoulders, slightly lifted chest (big)
  const headCy=top+rh, shY=headCy+rh+neckLen;                     // shY = neck base
  const sw=8+22*s, hw=6+14*s, T=Hh*.36, hipY=shY+T;               // shoulder half-width 8 → 30, hip half-width 6 → 20 (pictogram body, no V-torso), T = torso length
  const at=2.5+7*s, lt=3+7.5*s;                                   // arm / leg thickness (in proportion to height, not muscular)
  const Sx=sw-at/2, Sy=shY+droop+at*.4;                           // shoulder joint (right side)
  const K=[ // small:   reserved = hugging itself tightly       neutral = hands together in front        warm = arms open wide, low
            [[Sx-2,Sy+T*.45,-hw*.9,Sy+T*.55],            [Sx+1,Sy+T*.52,hw*.25,hipY+T*.12],      [Sx+T*.25,Sy+T*.40,Sx+T*.62,hipY-T*.20]],
            // mid:     reserved = arms folded tightly          neutral = relaxed at the sides           warm = arms straight out, palms open
            [[Sx+T*.04,Sy+T*.50,-hw*.85,Sy+T*.48],       [Sx+T*.06,Sy+T*.50,Sx+T*.14,hipY+T*.12],[Sx+T*.36,Sy+T*.28,Sx+T*.80,Sy+T*.02]],
            // big:     reserved = arms crossed high, squared   neutral = hands on hips                  warm = arms thrown wide and high
            [[Sx+T*.08,Sy+T*.40,-sw*.5,Sy+T*.28],        [sw+T*.42,Sy+T*.42,hw+at*.3,hipY-T*.12],[Sx+T*.44,Sy-T*.02,Sx+T*.76,Sy-T*.46]] ];
  const [Ex,Ey,Hx,Hy]=armPose(s,w,K);
  const spread=-1.5+9*s, legTop=(hw-lt/2)*.75, foot=hw*.75+spread;    // stance: feet together → wide
  const pr=w>.5?at*(.6+.4*s)*Math.min(1,(w-.5)*2.2):0;                 // open palms in the warm half
  const gt=w<.5?(.5-w)*2:0, tilt=w>.5?-(w-.5)*2*10:0, gd=(1-s)*rh*.12+gt*rh*.06, gx=gt*rh*1.5;   // head turned away (gt) / tilted (tilt); gaze drop gd, gaze shift gx
  const shRx=Math.max(sw,foot)+8, shRy=2.5+2.5*s;                       // ground shadow
  const halfw=Math.max(sw+3+3*s,Math.abs(Ex)+at/2,Math.abs(Hx)+at/2+pr,foot+lt/2,shRx,gt>0?rh*1.3+.5:0);
  const bb={l:-halfw,r:halfw,t:Math.min(top-.5,Hy-at/2-pr),b:bot+3+shRy};   // bounding box relative to the centre (used by the field mapping and the hit test)
  return {Hh,top,bot,rh,neckLen,neckW,droop,bulge,headCy,shY,sw,hw,T,hipY,at,lt,Sx,Sy,Ex,Ey,Hx,Hy,spread,legTop,foot,pr,gt,tilt,gd,gx,shRx,shRy,bb};
}
// ---- the figure, centred at (cx, cy) ----
function figure(s,w,cx,cy){
  const G=geom(s,w), {Hh,top,bot,rh,neckLen,neckW,droop,bulge,headCy,shY,sw,hw,T,hipY,at,lt,Sx,Sy,Ex,Ey,Hx,Hy,legTop,foot,pr,gt,tilt,gd,gx,shRx,shRy}=G;
  const L=(x1,y1,x2,y2,wd,col)=>`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${col}" stroke-width="${f1(wd)}" stroke-linecap="round"/>`;
  let g=`<g class="avf-fig" transform="translate(${f1(cx)},${f1(cy)})">`;
  g+=`<ellipse cx="0" cy="${f1(bot+3)}" rx="${f1(shRx)}" ry="${f1(shRy)}" fill="#000" opacity=".12"/>`;              // ground shadow
  g+=L(-legTop,hipY-3,-foot,bot-lt/2,lt,BODY)+L(legTop,hipY-3,foot,bot-lt/2,lt,BODY);                                // legs
  g+=`<path d="M${f1(-sw)},${f1(shY+droop)} Q0,${f1(shY-droop-2*bulge)} ${f1(sw)},${f1(shY+droop)} L${f1(hw)},${f1(hipY)} L${f1(-hw)},${f1(hipY)} Z" fill="${BODY}" stroke="${BODY}" stroke-width="${f1(6+6*s)}" stroke-linejoin="round"/>`; // torso, rounded shoulders
  g+=`<rect x="${f1(-neckW)}" y="${f1(headCy+rh-3)}" width="${f1(2*neckW)}" height="${f1(neckLen+droop/2+5)}" fill="${BODY}"/>`; // neck
  // head: tilts toward the viewer when warm; when reserved it turns away: the features slide sideways out of the (clipped) head circle and only an ear remains
  const n=++seq;
  g+=`<g transform="rotate(${f1(tilt)} 0 ${f1(headCy)})"><clipPath id="avfc${n}"><circle cx="0" cy="${f1(headCy)}" r="${f1(rh)}"/></clipPath><circle cx="0" cy="${f1(headCy)}" r="${f1(rh)}" fill="${BODY}" stroke="${EDGE}" stroke-width="1"/>`;
  if(gt>0) g+=`<path d="M${f1(-rh*.86)},${f1(headCy-rh*.25)} Q${f1(-rh*1.3)},${f1(headCy)} ${f1(-rh*.86)},${f1(headCy+rh*.25)}" fill="${BODY}" stroke="${EDGE}" stroke-width="1" opacity="${f1(Math.min(1,gt*1.5))}"/>`;  // ear on the far side
  g+=`<g clip-path="url(#avfc${n})">`;
  // expression: reserved (narrowed eyes, low brows, tight mouth) → open (happy eyes, raised brows, big open smile)
  const ex=rh*.36, ey=headCy-rh*.06+gd, er=rh*.1+.7;
  if(w>.65){ const a=(w-.65)/.35, ry=er*(1+.6*a);                                                                    // happy-squint arcs at the warm end
    for(const m of [-1,1]) g+=`<path d="M${f1(m*ex-er)},${f1(ey+er*.3)} Q${f1(m*ex)},${f1(ey-ry)} ${f1(m*ex+er)},${f1(ey+er*.3)}" fill="none" stroke="${FACE}" stroke-width="${f1(Math.max(1.1,rh*.12))}" stroke-linecap="round"/>`; }
  else { const ery=er*(.3+.7*Math.min(1,w/.65));
    g+=`<ellipse cx="${f1(-ex+gx)}" cy="${f1(ey)}" rx="${f1(er)}" ry="${f1(ery)}" fill="${FACE}"/><ellipse cx="${f1(ex+gx)}" cy="${f1(ey)}" rx="${f1(er)}" ry="${f1(ery)}" fill="${FACE}"/>`; }
  const by0=ey-rh*.26-rh*.14*w+(1-w)*rh*.06, bw=Math.max(1,rh*.09);                                                  // brows: low when reserved, raised when warm
  g+=`<line x1="${f1(-rh*.52+gx)}" y1="${f1(by0)}" x2="${f1(-rh*.17+gx)}" y2="${f1(by0)}" stroke="${FACE}" stroke-width="${f1(bw)}" stroke-linecap="round"/>`;
  g+=`<line x1="${f1(rh*.52+gx)}" y1="${f1(by0)}" x2="${f1(rh*.17+gx)}" y2="${f1(by0)}" stroke="${FACE}" stroke-width="${f1(bw)}" stroke-linecap="round"/>`;
  const my=headCy+rh*.4+gd, mw=rh*(.28+.2*w), curve=rh*(-.3+1.1*w);                                                 // mouth: short tight line, slightly down → wide smile
  if(w>.5) g+=`<path d="M${f1(-mw)},${f1(my)} Q0,${f1(my+curve)} ${f1(mw)},${f1(my)} Z" fill="${FACE}" stroke="${FACE}" stroke-width="${f1(Math.max(1,rh*.08))}" stroke-linejoin="round"/>`;   // open smile
  else g+=`<path d="M${f1(-mw+gx)},${f1(my)} Q${f1(gx)},${f1(my+curve)} ${f1(mw+gx)},${f1(my)}" fill="none" stroke="${FACE}" stroke-width="${f1(Math.max(1,rh*.11))}" stroke-linecap="round"/>`;
  g+='</g></g>';
  for(const m of [-1,1]){                                                                                            // arms on top (they cross the torso when reserved): upper arm + forearm
    g+=L(m*Sx,Sy,m*Ex,Ey,at,LIMB)+L(m*Ex,Ey,m*Hx,Hy,at,LIMB);
    if(pr>0) g+=`<circle cx="${f1(m*Hx)}" cy="${f1(Hy)}" r="${f1(pr)}" fill="${LIMB}" stroke="${EDGE}" stroke-width="1"/>`;   // open palms
  }
  return g+'</g>';
}
// ---- field mapping (see the note at the top) ----
const MONO={figure:(s,w,cx,cy)=>figure(s,w,cx,cy), bbox:(s,w)=>geom(s,w).bb};   // the default (monochrome pictogram) renderer
function centreFor(x,y,R){ const B=(R||MONO).bbox(y/100,x/100); return [FX-B.l+x/100*(FIELD-(B.r-B.l)), FY-B.t+(1-y/100)*(FIELD-(B.b-B.t))]; }
function solve(f,target,dec){ let lo=0,hi=100; for(let i=0;i<20;i++){ const mid=(lo+hi)/2; if((f(mid)<target)!==dec) lo=mid; else hi=mid; } return (lo+hi)/2; }  // bisection on a monotonic f (dec = decreasing)
function positionFor(px,py,x0,y0,R){ let x=x0,y=y0; for(let k=0;k<3;k++){ y=solve(v=>centreFor(x,v,R)[1],py,true); x=solve(v=>centreFor(v,y,R)[0],px,false); } return [clamp(x,0,100),clamp(y,0,100)]; }
function sideLabel(x,cy,label,side){ // left/right axis label with its arrow; a multi-word label wraps after the first word
  const words=String(label).split(' '); const lines=words.length>=2&&label.length>9?[words[0],words.slice(1).join(' ')]:[label];
  if(side==='left') lines[0]='◀ '+lines[0]; else lines[lines.length-1]+=' ▶';
  const y0=cy+5-(lines.length-1)*9;
  return `<text x="${x}" text-anchor="middle" font-size="14" fill="#333">`+lines.map((l,i)=>`<tspan x="${x}" y="${y0+i*18}">${esc(l)}</tspan>`).join('')+'</text>';
}
function fieldSVG(id,L){
  const cx=FX+FIELD/2, cy=FY+FIELD/2;
  return `<svg class="avf-svg" viewBox="0 0 ${W} ${H}" tabindex="0" role="img" aria-label="Placement field" font-family="Arial, Helvetica, sans-serif">`+
  `<rect x="${FX}" y="${FY}" width="${FIELD}" height="${FIELD}" rx="14" fill="#f3f4f6" stroke="#c6ced8"/>`+
  `<line x1="${cx}" y1="${FY+10}" x2="${cx}" y2="${FY+FIELD-10}" stroke="#b9c1cb" stroke-dasharray="4,6"/>`+
  `<line x1="${FX+10}" y1="${cy}" x2="${FX+FIELD-10}" y2="${cy}" stroke="#b9c1cb" stroke-dasharray="4,6"/>`+
  `<text x="${cx}" y="${FY-11}" text-anchor="middle" font-size="15" fill="#333">▲ ${esc(L.top)}</text>`+
  `<text x="${cx}" y="${FY+FIELD+22}" text-anchor="middle" font-size="15" fill="#333">▼ ${esc(L.bottom)}</text>`+
  sideLabel(LX/2,cy,L.left,'left')+sideLabel(W-LX/2,cy,L.right,'right')+
  `<g id="${id}-region"></g><g id="${id}-fig"></g></svg>`;
}
function injectCSS(){ if(document.getElementById('avf-css')) return; const s=document.createElement('style'); s.id='avf-css';
  s.textContent='.avf{margin:14px auto 4px;max-width:680px}.avf svg{width:100%;height:auto;display:block;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:grab;outline:none;border-radius:12px}.avf svg.drag{cursor:grabbing}.avf svg:focus-visible{outline:2px solid #1a6fbf;outline-offset:2px}.avf svg[data-pf]:focus-visible{outline:none}.avf.missing svg{box-shadow:0 0 0 3px #f3c2c2}.avf-pts{text-align:center;font-size:15px;color:#1a4f7f;background:#eef5fc;border-radius:6px;padding:6px 10px;margin:0 auto 10px;max-width:680px}';
  document.head.appendChild(s); }
function create(o={}){
  const id=o.id||('avf'+(++seq));
  const L=Object.assign({left:'Reserved',right:'Approachable',top:'Bigger',bottom:'Smaller'},o.labels||{});  // axis labels (Roy 29.9: reserved / approachable [נגיש], bigger / smaller)
  const st={x:o.start&&o.start.x!=null?+o.start.x:50,y:o.start&&o.start.y!=null?+o.start.y:50,touched:false,drags:0,t0:Date.now(),first:null,last:null,dragging:false,off:[0,0]};
  const SPLIT=!!o.split, RND=o.renderer||MONO;   // renderer: {figure(s,w,cx,cy), bbox(s,w)}; see AvatarField.renderers
  let el=null,svg=null,gf=null,pts=null;
  // split: keep (x, y) on the line x + y = 100 (nearest point), whole points
  const constrain=(x,y)=>{ if(!SPLIT) return [x,y]; const t=clamp(Math.round((x-y+100)/2),0,100); return [t,100-t]; };
  const ptsText=()=>{ const x=Math.round(st.x), y=Math.round(st.y); if(o.pointsText) return o.pointsText(x,y);
    return `You have 100 points to divide: ${x} for ${L.right.toLowerCase()}, ${y} for ${L.top.toLowerCase()}.`; };  // DRAFT wording
  const region=()=>{ if(!SPLIT) return ''; const P=[]; for(let k=0;k<=20;k++){ const t=k*5; const [cx,cy]=centreFor(t,100-t,RND); P.push(f1(cx)+','+f1(cy)); }
    return `<polyline points="${P.join(' ')}" fill="none" stroke="#9aa3ae" stroke-width="2" stroke-dasharray="7,6"/>`; };
  const now=()=>(Date.now()-st.t0)/1000;
  const centre=()=>centreFor(st.x,st.y,RND);
  const setFrom=(px,py)=>{ const [x,y]=constrain(...positionFor(px,py,st.x,st.y,RND)); st.x=x; st.y=y; };
  const touch=()=>{ st.touched=true; if(st.first===null) st.first=now(); };
  function value(){ const v={x:Math.round(st.x),y:Math.round(st.y),touched:st.touched,drags:st.drags,seconds:+now().toFixed(1),moveSeconds:st.touched?+((st.last===null?now():st.last)-st.first).toFixed(1):null};
    if(SPLIT) v.split=100; return v; }
  const render=()=>{ if(!gf) return; const [cx,cy]=centre(); gf.innerHTML=RND.figure(st.y/100,st.x/100,cx,cy); if(pts) pts.textContent=ptsText();
    svg.setAttribute('aria-label',`Figure at ${Math.round(st.x)} of 100 from ${L.left.toLowerCase()} to ${L.right.toLowerCase()} and ${Math.round(st.y)} of 100 from ${L.bottom.toLowerCase()} to ${L.top.toLowerCase()}`);
    el.dispatchEvent(new CustomEvent('avf-change',{detail:value()})); };
  const pt=e=>{ const r=svg.getBoundingClientRect(); return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]; };
  const onDown=e=>{ if(e.button) return; e.preventDefault(); svg.dataset.pf='1'; try{svg.focus({preventScroll:true});}catch(x){}  // pf = pointer focus: no focus ring for mouse/touch use
    const [px,py]=pt(e), [cx,cy]=centre(), B=RND.bbox(st.y/100,st.x/100);
    if(px>=cx+B.l-6&&px<=cx+B.r+6&&py>=cy+B.t-6&&py<=cy+B.b+6) st.off=[cx-px,cy-py]; else { st.off=[0,0]; setFrom(px,py); }  // press on the figure: drag without a jump; press elsewhere: the figure comes to the pointer
    st.dragging=true; st.drags++; touch(); try{svg.setPointerCapture(e.pointerId);}catch(x){} svg.classList.add('drag'); render(); };
  const onMove=e=>{ if(!st.dragging) return; e.preventDefault(); const [px,py]=pt(e); setFrom(px+st.off[0],py+st.off[1]); render(); };
  const onUp=()=>{ if(!st.dragging) return; st.dragging=false; st.last=now(); svg.classList.remove('drag'); render(); };
  const onKey=e=>{ const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key]; if(!k) return; e.preventDefault(); delete svg.dataset.pf;
    const step=e.shiftKey?(SPLIT?20:10):2; const [x,y]=constrain(clamp(st.x+k[0]*step,0,100),clamp(st.y+k[1]*step,0,100)); st.x=x; st.y=y; touch(); st.last=now(); render(); };  // split: a press moves 1 point along the line (Shift = 10)
  function setup(){ injectCSS(); el=document.getElementById(id); svg=el.querySelector('svg'); gf=document.getElementById(id+'-fig'); pts=document.getElementById(id+'-pts'); st.t0=Date.now();
    const rg=document.getElementById(id+'-region'); if(rg) rg.innerHTML=region();
    svg.addEventListener('pointerdown',onDown); svg.addEventListener('pointermove',onMove); svg.addEventListener('pointerup',onUp); svg.addEventListener('pointercancel',onUp); svg.addEventListener('lostpointercapture',onUp); svg.addEventListener('keydown',onKey);
    el.__autofill=autofill; render(); }
  function validate(){ if(o.requireTouch!==false&&!st.touched){ if(el) el.classList.add('missing'); return o.error||'Please place the figure before continuing.'; } if(el) el.classList.remove('missing'); return null; }
  function autofill(){ if(st.touched) return; const [x,y]=constrain(Math.floor(Math.random()*101),Math.floor(Math.random()*101)); st.x=x; st.y=y; st.drags=1; touch(); st.last=now(); render(); }
  const html=`${o.title?`<h2>${o.title}</h2>`:''}${o.text?`<p>${o.text}</p>`:''}<div class="avf" id="${id}" data-autofill="avatar">${fieldSVG(id,L)}</div>${SPLIT?`<p class="avf-pts" id="${id}-pts"></p>`:''}${o.small?`<p class="small">${o.small}</p>`:''}`;
  return {html,setup,validate,value,autofill};
}
function figureSVG(x,y,size,renderer){ const s=clamp(+y||0,0,100)/100, w=clamp(+x||0,0,100)/100, box=210, R=renderer||MONO;  // s = size from y, w = warmth from x; box fits the biggest figure
  return `<svg viewBox="0 0 ${box} ${box}" width="${size||box}" height="${size||box}" font-family="Arial, Helvetica, sans-serif">${R.figure(s,w,box/2,box/2)}</svg>`; }
global.AvatarField={create,figureSVG,renderers:{mono:MONO}};   // other renderers (e.g. avatar_cb.js: the Cyberball-style figure) register themselves here
})(window);
