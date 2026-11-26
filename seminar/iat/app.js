/* משימת IAT לסמינר חרדה חברתית וטראומה חברתית (תשפ"ז): "אני" מול "אחרים", תכונות חיוביות מול שליליות. v1, 26.11.2026.
   מבנה: שבעה שלבים כמו ב-IAT הרגיל (Greenwald, McGhee & Schwartz, 1998; IAT להערכה עצמית: Greenwald & Farnham, 2000).
     1 מטרה בלבד · 2 תכונות בלבד · 3 משולב (תרגול) · 4 משולב (מבחן) · 5 מטרה בלבד, צדדים הפוכים · 6 משולב הפוך (תרגול) · 7 משולב הפוך (מבחן).
   איזון אקראי בין משתתפים: הצד של "חיובי" (posSide), והצירוף הראשון (first: 'compat' = "אני" ו"חיובי" באותו צד בשלבים 3 ו-4).
   טעות: מופיע ✕ וצריך לתקן; זמן התגובה נמדד עד התגובה הנכונה (עונש מובנה על טעות).
   ציון D (Greenwald, Nosek & Banaji, 2003): שלבים 3, 4, 6, 7; בלי צעדים מעל 10,000 מ"ש; לכל זוג שלבים (3 מול 6, 4 מול 7)
     הפרש הממוצעים חלקי סטיית התקן של כל הצעדים בשני השלבים יחד; הציון הוא ממוצע שני המנות. D חיובי = מהיר יותר כש"אני" ו"חיובי" באותו צד.
   חוזה הנתונים (המקלט המשותף, v11): task 'dotprobe' (כמו השאלון של הסמינר, ראו ../config.js), version 'seminariat_v1_...', cond 'seminar_iat',
     pid 'S' + 4 ספרות (אותו קוד כמו בשאלון), stage 'start' | 'half' | 'complete', rows[] = צעד בכל שורה, qsum{} = הציון והסיכומים, design{} = האיזון.
   צורת המילים (נקבה או זכר) אינה נשמרת: ב-rows נשמר מזהה הפריט ולא המילה.
   בדיקות: ?debug=1 חושף window.D ו-window.iatScore; ?debug=1&auto=1&code=0000 מריץ בלי המתנה עם זמני תגובה מדומים; &bias=-1 הופך את כיוון האפקט המדומה. */
(function () {
'use strict';
const q = new URLSearchParams(location.search);
const debug = q.get('debug') === '1';
const auto = debug && q.get('auto') === '1';
const simBias = q.get('bias') === null ? 1 : parseFloat(q.get('bias'));
const VERSION = 'seminariat_v1_2026-11-26', COND = 'seminar_iat';
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const saver = ISFSave(CONFIG.endpoint);
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const W = IAT_WORDS, L = W.labels;
const flip = s => s === 'L' ? 'R' : 'L';

const D = {
  task: CONFIG.task, version: VERSION + (debug ? '_debug' : ''), study: CONFIG.study, session: '', pid: '', stage: '', cond: COND,
  ua: navigator.userAgent, start: new Date().toISOString(), code: '',
  device: { touch: isTouch, w: innerWidth, h: innerHeight, dpr: devicePixelRatio || 1, lang: navigator.language, platform: navigator.platform || '' },
  design: {}, rows: [], qsum: null, log: [], saved: {}
};
if (debug) window.D = D;
let FORM = 'f';
const t0 = performance.now();
const logEv = (ev, extra) => D.log.push(Object.assign({ ev, ms: Math.round(performance.now() - t0) }, extra || {}));
function body() { const o = {}; for (const k in D) if (!k.startsWith('_')) o[k] = D[k]; return JSON.stringify(o); }
function identity(stage) { return 'seminariat:' + D.pid + ':' + D.start + ':' + stage; }
function checkpoint(stage) { D.stage = stage; if (!CONFIG.endpoint) return; saver.enqueue(body(), identity(stage)); }
async function finalSave() { D.stage = 'complete'; if (!CONFIG.endpoint) return null; const ok = await saver.complete(body(), identity('complete')); D.saved.complete = ok ? 1 : 0; return ok; }

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; }
function sd(a) { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); }
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- מסכים ---------- */
let doneTrials = 0, totalTrials = 1;
function show(html) {
  const pct = Math.min(100, Math.round(100 * doneTrials / totalTrials));
  app.innerHTML = '<div class="screen"><div class="progress"><i style="width:' + pct + '%"></i></div>' + html + '</div>';
  window.scrollTo(0, 0);
  return app.firstElementChild;
}
function setProgress() { const i = app.querySelector('.progress i'); if (i) i.style.width = Math.min(100, Math.round(100 * doneTrials / totalTrials)) + '%'; }
const wordOf = (cat, it) => (cat === 'pos' || cat === 'neg') ? it[FORM] : it.w;
const tgt = k => '<span class="tgt">' + esc(L[k]) + '</span>';
const att = k => '<span class="att">' + esc(L[k]) + '</span>';
/* התווית של צד אחד בשלב נתון */
function sideLabel(blk, side) {
  const t = blk.selfSide ? tgt(blk.selfSide === side ? 'self' : 'other') : '';
  const a = att(D.design.posSide === side ? 'pos' : 'neg');
  if (blk.kind === 'target') return t;
  if (blk.kind === 'attr') return a;
  return t + '<span class="or">או</span>' + a;
}
function mapHTML(blk) {
  const key = side => isTouch ? (side === 'L' ? 'הכפתור השמאלי' : 'הכפתור הימני') : (side === 'L' ? 'שמאל: המקש ← (או E)' : 'ימין: המקש → (או I)');
  return '<div class="map">' + ['L', 'R'].map(s => '<div class="side"><div class="where">' + key(s) + '</div><div class="lab">' + sideLabel(blk, s) + '</div></div>').join('') + '</div>';
}

function screenIntro() {
  return new Promise(resolve => {
    const s = show(`
      <h1>משימת מיון מהירה (IAT)</h1>
      <p class="muted">סמינר חרדה חברתית וטראומה חברתית · ד"ר רועי אזולאי · אוניברסיטת בר-אילן</p>
      <p>המשימה הזאת נקראת מבחן אסוציאציות סמויות (Implicit Association Test). היא בודקת באיזו קלות מקשרים בין מושגים, לפי <b>מהירות התגובה</b> ולא לפי מה שמדווחים בשאלון. כאן המושגים הם "אני" מול "אחרים", ותכונות חיוביות מול תכונות שליליות.</p>
      <p>במשימה ממיינים מילים לשני צדדים, מהר ככל האפשר. יש שבעה שלבים קצרים, והכול נמשך כשש דקות. כדאי לעשות אותה במקום שקט וברצף אחד. במחשב מגיבים במקשי החיצים ← → (או במקשים E ו-I); בטלפון מגיבים בשני כפתורים בתחתית המסך.</p>
      <p>בסוף יוצגו הציון שלך והכיוון שלו. התוצאות נשמרות <b>באופן אנונימי</b>, תחת קוד בן ארבע ספרות, ומשמשות לדיון בכיתה בלבד. זו לא בדיקה אבחנתית.</p>
      <label for="code">קוד בן ארבע ספרות</label>
      <input type="text" class="code" id="code" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="off">
      <p class="small" style="margin-top:8px">כדאי להשתמש באותו קוד שבחרת בשאלון של השיעור הקודם.</p>
      <label>באיזו צורה להציג את התכונות?</label>
      <div class="choice" id="form"><button type="button" data-f="f">נקבה (חכמה, נחמדה)</button><button type="button" data-f="m">זכר (חכם, נחמד)</button></div>
      <p class="small">הבחירה משפיעה רק על צורת המילים, והיא לא נשמרת.</p>
      <div class="err" id="err"></div>
      <div class="btnrow"><button class="next" id="go">להמשיך</button></div>`);
    let form = null;
    s.querySelectorAll('#form button').forEach(b => b.onclick = () => { form = b.dataset.f; s.querySelectorAll('#form button').forEach(x => x.classList.toggle('on', x === b)); });
    const go = () => {
      const code = s.querySelector('#code').value.trim();
      if (!/^\d{4}$/.test(code)) { s.querySelector('#err').textContent = 'הקוד צריך להיות בדיוק ארבע ספרות.'; return; }
      if (!form) { s.querySelector('#err').textContent = 'צריך לבחור באיזו צורה להציג את התכונות.'; return; }
      FORM = form; D.code = code; D.pid = (debug && q.get('pid')) ? q.get('pid') : 'S' + code;
      logEv('intro_done'); checkpoint('start'); resolve();
    };
    s.querySelector('#go').onclick = go;
    if (auto) { s.querySelector('#code').value = q.get('code') || '0000'; form = q.get('form') === 'm' ? 'm' : 'f'; setTimeout(go, 20); }
  });
}
function screenCats() {
  return new Promise(resolve => {
    const row = (cls, k) => '<tr><th class="' + cls + '">' + esc(L[k]) + '</th><td>' + W[k].map(it => esc(wordOf(k, it))).join(' · ') + '</td></tr>';
    const s = show(`
      <h2>ארבע הקבוצות</h2>
      <p>אלה ארבע הקבוצות והמילים ששייכות לכל אחת מהן. כדאי לעבור עליהן פעם אחת לפני שמתחילים.</p>
      <table class="cats">${row('tgt', 'self')}${row('tgt', 'other')}${row('att', 'pos')}${row('att', 'neg')}</table>
      <p>בכל צעד תופיע מילה אחת במרכז המסך. ממיינים אותה לצד שבו כתובה הקבוצה שלה. אם טועים מופיע ✕ אדום, ולוחצים על הצד השני כדי להמשיך.</p>
      <p>הכי חשוב: לענות <b>מהר</b>, לפי התגובה הראשונה. כמה טעויות בדרך הן חלק מהמשימה.</p>
      <div class="btnrow"><button class="next" id="go">להמשיך</button></div>`);
    s.querySelector('#go').onclick = () => { logEv('cats_done'); resolve(); };
    if (auto) setTimeout(() => s.querySelector('#go').click(), 20);
  });
}

/* ---------- בניית השלבים והצעדים ---------- */
function buildBlocks() {
  const pos = D.design.posSide, self1 = D.design.first === 'compat' ? pos : flip(pos), self2 = flip(self1), n = W.blockTrials;
  const B = [
    { b: 1, kind: 'target', selfSide: self1 }, { b: 2, kind: 'attr', selfSide: null }, { b: 3, kind: 'both', selfSide: self1 }, { b: 4, kind: 'both', selfSide: self1 },
    { b: 5, kind: 'target', selfSide: self2 }, { b: 6, kind: 'both', selfSide: self2 }, { b: 7, kind: 'both', selfSide: self2 }
  ];
  B.forEach((x, i) => { x.n = n[i]; x.pairing = x.kind === 'both' ? (x.selfSide === pos ? 'compat' : 'incompat') : ''; });
  D.design.pairing = {}; B.forEach(x => { if (x.pairing) D.design.pairing[x.b] = x.pairing; });
  D.design.selfSide = { first: self1, second: self2 };
  return B;
}
function cycler(list) {
  let pool = [], last = null;
  return () => {
    if (!pool.length) { pool = shuffle(list.slice()); if (pool.length > 1 && pool[pool.length - 1] === last) pool.unshift(pool.pop()); }
    last = pool.pop(); return last;
  };
}
const draw = { self: cycler(W.self), other: cycler(W.other), pos: cycler(W.pos), neg: cycler(W.neg) };
function half(a, b, n) { const out = []; for (let i = 0; i < n; i++) out.push(i % 2 ? b : a); return shuffle(out); }
function buildTrials(blk) {
  let cats;
  if (blk.kind === 'target') cats = half('self', 'other', blk.n);
  else if (blk.kind === 'attr') cats = half('pos', 'neg', blk.n);
  else { const t = half('self', 'other', blk.n / 2), a = half('pos', 'neg', blk.n / 2); cats = []; for (let i = 0; i < blk.n / 2; i++) cats.push(t[i], a[i]); }
  return cats.map(cat => {
    const it = draw[cat]();
    const side = cat === 'self' ? blk.selfSide : cat === 'other' ? flip(blk.selfSide) : cat === 'pos' ? D.design.posSide : flip(D.design.posSide);
    return { cat, item: it.id, word: wordOf(cat, it), side };
  });
}

/* ---------- מסך הוראות לשלב ---------- */
const BLOCK_TEXT = {
  1: 'בשלב הזה יופיעו מילים ששייכות ל"אני" או ל"אחרים". ממיינים כל מילה לצד שלה, מהר ככל האפשר.',
  2: 'עכשיו ממיינים תכונות: החיוביות לצד אחד, והשליליות לצד השני.',
  3: 'עכשיו שני המיונים יחד. המילים יופיעו לסירוגין: פעם מילה של "אני" או "אחרים", ופעם תכונה. כל הקבוצות נשארות בצדדים שלהן.',
  4: 'אותו מיון בדיוק, בשלב ארוך יותר. כדאי לענות מהר ככל האפשר.',
  5: 'שימו לב: "אני" ו"אחרים" החליפו צדדים. בשלב הזה ממיינים רק אותם, כדי להתרגל למקומות החדשים.',
  6: 'שוב שני המיונים יחד, עם המקומות החדשים של "אני" ו"אחרים". התכונות נשארו במקומן.',
  7: 'אותו מיון בדיוק, בשלב ארוך יותר. זה השלב האחרון.'
};
function screenBlock(blk) {
  return new Promise(resolve => {
    const s = show(`
      <div class="part">שלב ${blk.b} מתוך 7</div>
      <p>${esc(BLOCK_TEXT[blk.b])}</p>
      ${mapHTML(blk)}
      <p class="small">אם טועים מופיע ✕ אדום, ולוחצים על הצד השני כדי להמשיך.${isTouch ? '' : ' אפשר להתחיל גם במקש הרווח.'}</p>
      <div class="btnrow"><button class="next" id="go">להתחיל</button></div>`);
    let done = false; const shown = performance.now();
    const onKey = e => { if (e.code === 'Space' && !e.repeat && performance.now() - shown > 500) { e.preventDefault(); go(); } };
    function go() { if (done) return; done = true; document.removeEventListener('keydown', onKey); logEv('block_start', { b: blk.b }); resolve(); }
    document.addEventListener('keydown', onKey);
    s.querySelector('#go').onclick = go;
    if (auto) setTimeout(go, 20);
  });
}

/* ---------- הרצת שלב ---------- */
let current = null;
function respond(side, how) {
  const c = current; if (!c) return;
  const rt = Math.round(performance.now() - c.t0);
  if (side === c.side) { current = null; c.done({ rt, rt1: c.err ? c.rt1 : rt, err: c.err, how }); }
  else if (!c.err) { c.err = 1; c.rt1 = rt; c.onError(); }
}
document.addEventListener('keydown', e => {
  if (!current || e.repeat) return;
  if (e.code === 'KeyE' || e.key === 'ArrowLeft') { e.preventDefault(); respond('L', 'k'); }
  else if (e.code === 'KeyI' || e.key === 'ArrowRight') { e.preventDefault(); respond('R', 'k'); }
});
async function runBlock(blk) {
  const trials = buildTrials(blk);
  const s = show(`<div class="arena">
    <div class="top"><div class="lab l">${sideLabel(blk, 'L')}</div><div class="lab r">${sideLabel(blk, 'R')}</div></div>
    <div class="mid"><div class="word" id="w"></div><div class="x" id="x">✕</div><div class="fix" id="fx">טעות. לוחצים על הצד השני כדי להמשיך.</div></div>
    <div class="resp"><button type="button" data-r="L" aria-label="שמאל">${sideLabel(blk, 'L')}</button><button type="button" data-r="R" aria-label="ימין">${sideLabel(blk, 'R')}</button></div>
    <div class="hint">${isTouch ? 'מגיבים בשני הכפתורים' : 'מגיבים במקשי החיצים ← → (או E ו-I), או בלחיצה על הכפתורים'}</div></div>`);
  const w = s.querySelector('#w'), x = s.querySelector('#x'), fx = s.querySelector('#fx');
  s.querySelectorAll('.resp button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); respond(b.dataset.r, 'b'); }));
  if (!auto) await wait(600);
  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]; let res;
    if (auto) {
      const base = blk.kind !== 'both' ? 620 : (blk.pairing === 'compat' ? 680 : 680 + 190 * simBias);
      const err = Math.random() < 0.06 ? 1 : 0, rt1 = Math.max(280, Math.round(base + 170 * gauss()));
      res = { rt: err ? rt1 + 320 : rt1, rt1, err, how: 'sim' };
    } else {
      w.textContent = t.word; w.className = 'word ' + ((t.cat === 'self' || t.cat === 'other') ? 'tgt' : 'att');
      res = await new Promise(done => { current = { side: t.side, t0: performance.now(), err: 0, rt1: null, done, onError: () => { x.classList.add('show'); fx.classList.add('show'); } }; });
      w.textContent = ''; x.classList.remove('show'); fx.classList.remove('show');
    }
    D.rows.push({ b: blk.b, i: i + 1, cat: t.cat, item: t.item, side: t.side, rt: res.rt, rt1: res.rt1, err: res.err, how: res.how });
    doneTrials += 1; setProgress();
    if (!auto) await wait(250);
  }
  logEv('block_done', { b: blk.b });
}

/* ---------- ציון ---------- */
function iatScore(rows, pairing) {
  const crit = rows.filter(r => pairing[r.b]);
  const use = crit.filter(r => r.rt <= 10000);
  const by = b => use.filter(r => r.b === b).map(r => r.rt);
  const dPair = (bA, bB) => {
    const a = by(bA), b = by(bB), s = sd(a.concat(b));
    if (!a.length || !b.length || !s) return null;
    const mc = pairing[bA] === 'compat' ? mean(a) : mean(b), mi = pairing[bA] === 'compat' ? mean(b) : mean(a);
    return (mi - mc) / s;
  };
  const dPrac = dPair(3, 6), dTest = dPair(4, 7);
  const d = dPrac === null || dTest === null ? (dPrac === null ? dTest : dPrac) : (dPrac + dTest) / 2;
  const rtOf = p => mean(use.filter(r => pairing[r.b] === p).map(r => r.rt));
  const hows = Array.from(new Set(rows.map(r => r.how)));
  const fast = crit.length ? crit.filter(r => r.rt < 300).length / crit.length : null, errRate = crit.length ? crit.filter(r => r.err).length / crit.length : null;
  const r3 = v => v === null ? null : Math.round(v * 1000) / 1000;
  return {
    iat_d: r3(d), iat_d_practice: r3(dPrac), iat_d_test: r3(dTest),
    rt_compat: rtOf('compat') === null ? null : Math.round(rtOf('compat')), rt_incompat: rtOf('incompat') === null ? null : Math.round(rtOf('incompat')),
    err_rate: r3(errRate), fast_rate: r3(fast), slow_removed: crit.length - use.length, n_trials: rows.length, n_used: use.length,
    reliable: (fast !== null && fast > 0.10) || (errRate !== null && errRate > 0.30) ? 0 : 1,
    input: hows.length === 1 ? hows[0] : 'mixed'
  };
}
if (debug) window.iatScore = iatScore;
function verdict(d) {
  const a = Math.abs(d);
  if (a < 0.15) return 'אין נטייה ברורה לאחד הכיוונים';
  return (a < 0.35 ? 'נטייה קלה' : a < 0.65 ? 'נטייה בינונית' : 'נטייה חזקה') + ' לקשר "אני" עם תכונות ' + (d > 0 ? 'חיוביות' : 'שליליות');
}
function bar(label, v, max, cls) {
  const wd = v === null ? 0 : Math.max(2, Math.round(100 * v / max));
  return '<div class="brow ' + (cls || '') + '"><span class="lab" style="font-size:15px;font-weight:normal">' + esc(label) + '</span><span class="track"><i style="width:' + wd + '%"></i></span><span class="num" style="flex-basis:64px">' + (v === null ? '–' : v) + '</span></div>';
}
function downloadJSON() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body()], { type: 'application/json' })); a.download = 'seminar_iat_' + D.pid + '.json'; a.click();
}
async function screenResults() {
  const S = iatScore(D.rows, D.design.pairing);
  S.first = D.design.first; S.pos_side = D.design.posSide; S.duration_s = Math.round((performance.now() - t0) / 1000);
  D.qsum = S; doneTrials = totalTrials;
  const d = S.iat_d === null ? 0 : S.iat_d, shownD = (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(2);
  const left = 50 + 50 * Math.max(-1, Math.min(1, d / 1.2));
  const max = Math.max(S.rt_compat || 0, S.rt_incompat || 0) * 1.12 || 1;
  const s = show(`
    <h1>התוצאה שלך</h1>
    <p class="muted">הקוד שלך: <b>${esc(D.code)}</b></p>
    <div class="big">D = ${shownD}</div>
    <div class="verdict">${esc(verdict(d))}</div>
    <div class="axis"><div class="line"></div><div class="zero"></div><div class="dot" style="left:${left.toFixed(1)}%"></div>
      <div class="end l">"אני" עם "שלילי"</div><div class="end r">"אני" עם "חיובי"</div></div>
    <p class="small" style="text-align:center">הנקודה מראה באיזה צירוף המיון היה מהיר יותר. הקו האנכי הוא אפס.</p>
    ${S.reliable ? '' : '<div class="status bad">הרבה תגובות היו מהירות מאוד או שגויות, ולכן הציון הזה פחות אמין מהרגיל.</div>'}
    <div class="card"><h3>זמן התגובה הממוצע שלך (באלפיות שנייה)</h3><div class="bars">
      ${bar('כש"אני" ו"חיובי" היו באותו צד', S.rt_compat, max)}${bar('כש"אני" ו"שלילי" היו באותו צד', S.rt_incompat, max, 'alt')}</div>
      <p class="small">טעויות: ${S.err_rate === null ? '–' : Math.round(100 * S.err_rate)}% מהצעדים בשלבים המשולבים.</p></div>
    <div class="card"><h3>איך לקרוא את הציון</h3>
      <p>הציון משווה בין שני מצבים: כש"אני" חולק צד עם התכונות החיוביות, וכש"אני" חולק צד עם התכונות השליליות. ציון חיובי אומר שהמיון היה מהיר יותר כש"אני" ו"חיובי" היו באותו צד, כלומר שהקישור הזה זמין יותר. ציון שלילי אומר את ההפך. המספר עצמו הוא ההפרש בין זמני התגובה הממוצעים בשני המצבים, מחולק בפיזור של זמני התגובה.</p>
      <p>מקובל לקרוא את הגודל כך: עד 0.15 אין נטייה ברורה, בין 0.15 ל-0.35 נטייה קלה, בין 0.35 ל-0.65 נטייה בינונית, ומעל 0.65 נטייה חזקה. אצל רוב האנשים הציון במשימה כזאת חיובי.</p>
      <p>כדאי לזכור שהציון של אדם אחד במדידה אחת אינו יציב, ובחזרה על המשימה מחר הוא עשוי להשתנות. הוא מושפע גם מסדר השלבים, מעייפות ומהיכרות עם המשימה. הוא מודד מהירות של קישור בין מילים, והוא לא אבחנה. בשיעור נדבר על מה שמשימות כאלה מראות בחרדה חברתית, ועל הוויכוח סביבן.</p></div>
    <p>כדאי לצלם את המסך הזה או לזכור את הציון, כי נחזור אליו בשיעור.</p>
    <div class="status" id="st">שומר את התוצאות…</div>
    <div class="btnrow" id="dl" style="display:none"><button class="ghost" id="dlb">להוריד את התוצאות כקובץ</button></div>`);
  const st = s.querySelector('#st'), dl = s.querySelector('#dl');
  s.querySelector('#dlb').onclick = downloadJSON;
  const ok = await finalSave();
  if (ok === true) { st.className = 'status ok'; st.textContent = 'התוצאות נשמרו. אפשר לסגור את העמוד.'; }
  else if (ok === null) { st.className = 'status bad'; st.textContent = 'גרסת בדיקה: אין שמירה לשרת.'; dl.style.display = 'flex'; }
  else { st.className = 'status bad'; st.textContent = 'השמירה לא הצליחה כרגע. העמוד ינסה שוב כשיהיה חיבור. אפשר גם להוריד את התוצאות כקובץ ולשלוח במייל ל-' + CONFIG.contactEmail + '.'; dl.style.display = 'flex'; }
  logEv('results_shown', { saved: ok });
}

(async function main() {
  D.design.posSide = Math.random() < 0.5 ? 'L' : 'R';
  D.design.first = Math.random() < 0.5 ? 'compat' : 'incompat';
  if (debug && q.get('first')) D.design.first = q.get('first') === 'incompat' ? 'incompat' : 'compat';
  const blocks = buildBlocks();
  totalTrials = blocks.reduce((s, b) => s + b.n, 0);
  await screenIntro();
  await screenCats();
  for (const blk of blocks) {
    await screenBlock(blk);
    await runBlock(blk);
    if (blk.b === 4) checkpoint('half');
  }
  await screenResults();
})();
})();
