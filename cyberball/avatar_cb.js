/* avatar_cb.js — the Throw & Catch (Cyberball) character as a parametric vector figure (Roy, 29.9.2026). DRAFT for Roy's review.
   Redraws the CuddleBunny / OSU Cyberball sprite (white hand-drawn figure, dark outline, big round head, mitten hands, blob feet)
   in inline SVG, so that it can vary continuously with the two placement axes and still play the game's frames:
   idle · active (holding the ball) · catch · throw1 · throw2 · throw3 (the task shows the three throw frames 84 ms each, then
   the ball flies ~0.5 s; the catch frame lasts 300 ms). Loads after avatar.js and registers
     AvatarField.renderers.cyberball = {figure(s, w, cx, cy, frame, opts), bbox(s, w, frame), frames, ball(cx, cy, r)}
   s = size (0 small → 1 big: height ×3, broader), w = approachability (0 reserved: arms folded, narrowed eyes turned aside, low
   brows, flat mouth → 1 approachable: waving, open arms, round eyes, smile). opts: {flip: true} mirrors the figure (the task flips
   the right-hand player), {ball: true} draws the ball in the right hand. Throw frames use the game's shouting face; idle, active
   and catch keep the participant's expression. A light displacement filter gives the hand-drawn wobble. */
(function(A){
'use strict';
if(!A||!A.renderers){ console.error('avatar_cb.js needs avatar.js loaded first'); return; }
let seq=0;
const f1=v=>(+v).toFixed(1);
const INK='#2b2b2b', PAPER='#ffffff';
// Key poses. Offsets in units of the figure's height, relative to the joint (shoulder for E = elbow / H = hand; hip for K = knee /
// F = ankle); viewer coordinates, y down. L = viewer's left limb, R = viewer's right limb.
const KP={
  idle_res:{L:{E:[-.12,.12],H:[.10,.17]},R:{E:[.12,.12],H:[-.10,.20]},LL:{K:[0,.12],F:[-.01,.24]},RL:{K:[0,.12],F:[.01,.24]},turn:1},
  idle_neu:{L:{E:[-.09,.14],H:[-.12,.28]},R:{E:[.09,.14],H:[.12,.28]},LL:{K:[-.01,.12],F:[-.03,.24]},RL:{K:[.01,.12],F:[.03,.24]},turn:0},
  idle_app:{L:{E:[-.13,.12],H:[-.22,.24]},R:{E:[.13,-.04],H:[.20,-.24]},LL:{K:[-.02,.12],F:[-.05,.24]},RL:{K:[.02,.12],F:[.05,.24]},turn:0},
  active:{L:{E:[-.16,.02],H:[-.29,-.06]},R:{E:[.16,-.02],H:[.27,-.14]},LL:{K:[-.02,.12],F:[-.04,.24]},RL:{K:[.10,.04],F:[.17,.12]},face:'brows'},
  catch:{L:{E:[-.16,0],H:[-.31,.01]},R:{E:[.16,0],H:[.31,.01]},LL:{K:[-.03,.12],F:[-.06,.24]},RL:{K:[.03,.12],F:[.06,.24]},face:'w'},
  throw1:{L:{E:[-.16,.06],H:[-.30,.02]},R:{E:[.14,-.08],H:[.21,-.24]},LL:{K:[-.02,.12],F:[-.04,.24]},RL:{K:[.12,0],F:[.21,.10]},face:'shout'},
  throw2:{L:{E:[-.12,.10],H:[-.22,.18]},R:{E:[.10,-.16],H:[.17,-.31]},LL:{K:[-.06,.12],F:[-.12,.24]},RL:{K:[.06,.12],F:[.14,.24]},face:'shout',turn:.9,bodyX:.8},
  throw3:{L:{E:[-.14,.06],H:[-.26,.14]},R:{E:[.17,-.02],H:[.33,-.08]},LL:{K:[-.10,.10],F:[-.22,.24]},RL:{K:[.12,.10],F:[.22,.24]},face:'shout',turn:.5,lean:10}
};
const FRAMES=['idle','active','catch','throw1','throw2','throw3'];
const DEF={turn:0,bodyX:1,lean:0};
function lerpPose(a,b,t){ const o={}; for(const k of ['L','R','LL','RL']){ o[k]={}; for(const j in a[k]) o[k][j]=a[k][j].map((v,i)=>v+(b[k][j][i]-v)*t); }
  for(const k in DEF){ const av=a[k]==null?DEF[k]:a[k], bv=b[k]==null?DEF[k]:b[k]; o[k]=av+(bv-av)*t; } o.face='w'; return o; }
function pose(w,frame){ if(frame&&frame!=='idle'&&KP[frame]) return Object.assign({},DEF,{face:'w'},KP[frame]); return w<.5?lerpPose(KP.idle_res,KP.idle_neu,w*2):lerpPose(KP.idle_neu,KP.idle_app,(w-.5)*2); }
function geom(s,w,frame){
  const Hh=64+130*s, top=-Hh/2, rh=.165*Hh, headCy=top+rh;                       // height 64 → 194; head radius = 16.5% of it
  const yb0=headCy+rh-.04*Hh, yb1=yb0+.40*Hh, wid=.8+.4*s, bw0=.14*Hh*wid, bw1=.16*Hh*wid;   // body: top / bottom, shoulder / hip half-widths
  const po=pose(w,frame), bx=po.bodyX;
  const S=[[-(bw0-.02*Hh)*bx, yb0+.07*Hh],[(bw0-.02*Hh)*bx, yb0+.07*Hh]];          // shoulders
  const HP=[[-bw1*.45*bx, yb1-.02*Hh],[bw1*.45*bx, yb1-.02*Hh]];                    // hips
  const at=.065*Hh, lt=.075*Hh, hr=.05*Hh, fr=.022*Hh, ow=1.4+1.2*s;               // arm / leg thickness, hand radius, finger radius, outline width
  const J=(b,o)=>[b[0]+o[0]*Hh, b[1]+o[1]*Hh];
  const L={S:S[0],E:J(S[0],po.L.E),H:J(S[0],po.L.H)}, R={S:S[1],E:J(S[1],po.R.E),H:J(S[1],po.R.H)};
  const LL={P:HP[0],K:J(HP[0],po.LL.K),F:J(HP[0],po.LL.F)}, RL={P:HP[1],K:J(HP[1],po.RL.K),F:J(HP[1],po.RL.F)};
  const foot={rx:.10*Hh, ry:.045*Hh};
  const xs=[-bw1,bw1,-rh,rh,L.H[0]-hr-fr,R.H[0]+hr+fr,L.E[0]-at,R.E[0]+at,LL.F[0]-foot.rx-.03*Hh,RL.F[0]+foot.rx+.03*Hh];
  const ys=[top,L.H[1]-hr-fr,R.H[1]-hr-fr,LL.F[1]+foot.ry*1.6,RL.F[1]+foot.ry*1.6,yb1];
  const m=ow+2;
  return {Hh,top,rh,headCy,yb0,yb1,bw0,bw1,at,lt,hr,fr,ow,po,L,R,LL,RL,foot,bb:{l:Math.min(...xs)-m,r:Math.max(...xs)+m,t:Math.min(...ys)-m,b:Math.max(...ys)+m}};
}
function ball(cx,cy,r){ r=r||10; return `<g transform="translate(${f1(cx)},${f1(cy)})"><circle r="${f1(r)}" fill="${PAPER}" stroke="${INK}" stroke-width="${f1(r*.16)}"/><path d="M${f1(-r*.1)},${f1(-r*.45)} Q${f1(-r*.62)},0 ${f1(-r*.1)},${f1(r*.45)} M${f1(-r*.42)},0 H${f1(r*.3)} M${f1(-r*.1)},${f1(-r*.45)} H${f1(r*.4)} M${f1(-r*.1)},${f1(r*.45)} H${f1(r*.4)}" fill="none" stroke="${INK}" stroke-width="${f1(r*.14)}" stroke-linecap="round"/></g>`; }
function figure(s,w,cx,cy,frame,opts){
  frame=frame||'idle'; opts=opts||{};
  const G=geom(s,w,frame), {Hh,rh,headCy,yb0,yb1,bw0,bw1,at,lt,hr,fr,ow,po,L,R,LL,RL,foot}=G;
  const id='cbw'+(++seq);
  const pl=pts=>pts.map(p=>f1(p[0])+','+f1(p[1])).join(' ');
  const stroke=(pts,wd,col)=>`<polyline points="${pl(pts)}" fill="none" stroke="${col}" stroke-width="${f1(wd)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const circ=(c,r,col)=>`<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="${col}"/>`;
  const ell=(c,rx,ry,col)=>`<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${col}"/>`;
  // every part is drawn twice: an ink pass widened by the outline, then a paper pass — so the pieces of one part merge into one
  // outlined shape, while parts drawn later keep their outline over the parts behind them (as in the sprites)
  const armPart=a=>{ const d=[a.H[0]-a.E[0],a.H[1]-a.E[1]], n=Math.hypot(d[0],d[1])||1, u=[d[0]/n,d[1]/n], v=[-u[1],u[0]];
    const fg=[[a.H[0]+u[0]*hr*.95,a.H[1]+u[1]*hr*.95,fr*1.2],[a.H[0]+u[0]*hr*.55+v[0]*hr*.8,a.H[1]+u[1]*hr*.55+v[1]*hr*.8,fr],[a.H[0]+u[0]*hr*.55-v[0]*hr*.8,a.H[1]+u[1]*hr*.55-v[1]*hr*.8,fr*.9]];
    const pts=[a.S,a.E,a.H];
    return stroke(pts,at+2*ow,INK)+circ(a.H,hr+ow,INK)+fg.map(f=>circ(f,f[2]+ow,INK)).join('')+stroke(pts,at,PAPER)+circ(a.H,hr,PAPER)+fg.map(f=>circ(f,f[2],PAPER)).join(''); };
  const legPart=(l,side)=>{ const fc=[l.F[0]+side*.03*Hh, l.F[1]+foot.ry*.6], pts=[l.P,l.K,l.F];
    return stroke(pts,lt+2*ow,INK)+ell(fc,foot.rx+ow,foot.ry+ow,INK)+stroke(pts,lt,PAPER)+ell(fc,foot.rx,foot.ry,PAPER); };
  const bx=po.bodyX, r0=.05*Hh, X0=bw0*bx, X1=bw1*bx;
  const body=`<path d="M${f1(-X0+r0)},${f1(yb0)} L${f1(X0-r0)},${f1(yb0)} Q${f1(X0)},${f1(yb0)} ${f1(X0)},${f1(yb0+r0)} L${f1(X1)},${f1(yb1-r0)} Q${f1(X1)},${f1(yb1)} ${f1(X1-r0)},${f1(yb1)} L${f1(-X1+r0)},${f1(yb1)} Q${f1(-X1)},${f1(yb1)} ${f1(-X1)},${f1(yb1-r0)} L${f1(-X0)},${f1(yb0+r0)} Q${f1(-X0)},${f1(yb0)} ${f1(-X0+r0)},${f1(yb0)} Z" fill="${PAPER}" stroke="${INK}" stroke-width="${f1(ow)}" stroke-linejoin="round"/>`;
  const head=`<circle cx="0" cy="${f1(headCy)}" r="${f1(rh)}" fill="${PAPER}" stroke="${INK}" stroke-width="${f1(ow)}"/>`;
  // face
  const mode=po.face==='brows'?'w':po.face, turn=po.turn||0, gx=turn*.07*Hh;       // eyes slide sideways when the head is turned
  const ex=.055*Hh, ey=headCy-.005*Hh; let erx=.032*Hh, ery=.06*Hh;
  if(mode==='w'){ ery*=(.45+.55*w); erx*=(.85+.3*w); }                            // narrowed when reserved, round when approachable
  let face=ell([-ex+gx,ey],erx*(1-turn*.35),ery,INK)+ell([ex+gx,ey],erx,ery,INK);
  const my=headCy+.075*Hh, sw1=f1(ow);
  if(mode==='w'){ const sm=(w-.5)*2;
    if(sm>0){ const mw=.05*Hh+.04*Hh*sm, dp=.06*Hh*sm; face+=`<path d="M${f1(-mw+gx)},${f1(my)} Q${f1(gx)},${f1(my+dp*2)} ${f1(mw+gx)},${f1(my)}" fill="none" stroke="${INK}" stroke-width="${sw1}" stroke-linecap="round"/>`; }   // smile
    else { const mw=.035*Hh, dp=.02*Hh*(-sm); face+=`<path d="M${f1(-mw+gx)},${f1(my+dp)} Q${f1(gx)},${f1(my-dp)} ${f1(mw+gx)},${f1(my+dp)}" fill="none" stroke="${INK}" stroke-width="${sw1}" stroke-linecap="round"/>`; }   // flat, slightly down
    if(w<.5){ const bl=(.5-w)*2, by=ey-ery-.028*Hh; face+=`<path d="M${f1(-ex-erx+gx)},${f1(by)} L${f1(-ex+erx+gx)},${f1(by)} M${f1(ex-erx+gx)},${f1(by)} L${f1(ex+erx+gx)},${f1(by)}" fill="none" stroke="${INK}" stroke-width="${f1(ow*1.1)}" stroke-linecap="round" opacity="${f1(bl)}"/>`; } }   // low flat brows
  else if(mode==='o') face+=circ([gx,my],.02*Hh,INK);
  else if(mode==='shout') face+=ell([gx,my+.01*Hh],.03*Hh,.045*Hh,INK);
  if(po.face==='brows'||po.face==='shout'){ const by=ey-ery-.025*Hh; face+=`<path d="M${f1(-ex-erx+gx)},${f1(by-.015*Hh)} L${f1(-ex+erx*.6+gx)},${f1(by+.012*Hh)} M${f1(ex+erx+gx)},${f1(by-.015*Hh)} L${f1(ex-erx*.6+gx)},${f1(by+.012*Hh)}" fill="none" stroke="${INK}" stroke-width="${f1(ow*1.1)}" stroke-linecap="round"/>`; }   // determined brows
  const wob=`<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="${(0.06-0.03*s).toFixed(3)}" numOctaves="1" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${f1(1.6+1.6*s)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  const flip=opts.flip?`translate(${f1(2*cx)},0) scale(-1,1) `:'';
  let g=`<g class="avf-fig cb-fig" transform="${flip}translate(${f1(cx)},${f1(cy)})"><defs>${wob}</defs>`;
  g+=`<ellipse cx="0" cy="${f1(G.bb.b-3)}" rx="${f1(bw1+.12*Hh)}" ry="${f1(.03*Hh)}" fill="#000" opacity=".10"/>`;   // ground shadow
  g+=`<g filter="url(#${id})">`+legPart(LL,-1)+legPart(RL,1);
  g+=`<g transform="rotate(${f1(po.lean||0)} 0 ${f1(yb1)})">`+body+head+face+armPart(L)+armPart(R)+(opts.ball?ball(R.H[0]+hr*.9,R.H[1]-hr*1.1,.055*Hh+3):'')+'</g>';
  return g+'</g></g>';
}
A.renderers.cyberball={figure:(s,w,cx,cy,frame,opts)=>figure(s,w,cx,cy,frame,opts), bbox:(s,w,frame)=>geom(s,w,frame).bb, frames:FRAMES, ball};
})(window.AvatarField);
