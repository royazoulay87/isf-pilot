/* שאלון קצר לשיעור "פרשנות, שיפוט וזיכרון" (סמינר חרדה חברתית וטראומה חברתית, תשפ"ז). v1, 25.11.2026.
   זרימה: קוד אנונימי → חלק 1 מצבים חברתיים (6 עמומים + 2 חיוביים) → חלק 2 תפיסת עצמי → חלק 3 סיכוי ומחיר (8 אירועים) → חלק 4 פרצופים (10) → סיכום אישי → שמירה.
   חוזה הנתונים (המקלט המשותף, v11): task 'dotprobe' (ראו config.js), pid 'S' + 4 ספרות, stage 'start' | 'p1' | 'p2' | 'p3' | 'complete',
   cond 'seminar_q', version 'seminarq_v1_...', rows[] = {part, item, k, v} לכל תשובה, qsum{} = ממוצעים לסיכום.
   בדיקות: ?debug=1 חושף window.D; ?debug=1&auto=1 ממלא תשובות אקראיות ומתקדם לבד. */
(function () {
'use strict';
const q = new URLSearchParams(location.search);
const debug = q.get('debug') === '1';
const auto = debug && q.get('auto') === '1';
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const saver = ISFSave(CONFIG.endpoint);
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const D = {
  task: CONFIG.task, version: CONFIG.version + (debug ? '_debug' : ''), study: CONFIG.study, session: '', pid: '', stage: '', cond: CONFIG.cond,
  ua: navigator.userAgent, start: new Date().toISOString(), code: '',
  device: { touch: isTouch, w: innerWidth, h: innerHeight, dpr: devicePixelRatio || 1, lang: navigator.language, platform: navigator.platform || '' },
  rows: [], qsum: null, log: [], saved: {}
};
if (debug) window.D = D;
const A = {};          // התשובות: מפתח "part|item|k" → ערך
const META = {};       // סדר הצגה וזמני מסכים
const t0 = performance.now();
const logEv = (ev, extra) => D.log.push(Object.assign({ ev, ms: Math.round(performance.now() - t0) }, extra || {}));
function setA(part, item, k, v) { A[part + '|' + item + '|' + k] = v; }
function getA(part, item, k) { return A[part + '|' + item + '|' + k]; }
function buildRows() {
  const rows = Object.keys(A).map(key => { const [part, item, k] = key.split('|'); return { part, item, k, v: A[key] }; });
  Object.keys(META).forEach(k => rows.push({ part: 'meta', item: k, k: '', v: META[k] }));
  D.rows = rows;
}
function body() { buildRows(); const o = {}; for (const k in D) if (!k.startsWith('_')) o[k] = D[k]; return JSON.stringify(o); }
function identity(stage) { return 'seminarq:' + D.pid + ':' + D.start + ':' + stage; }
function checkpoint(stage) { D.stage = stage; if (!CONFIG.endpoint) return; saver.enqueue(body(), identity(stage)); }
async function finalSave() { D.stage = 'complete'; if (!CONFIG.endpoint) return null; const ok = await saver.complete(body(), identity('complete')); D.saved.complete = ok ? 1 : 0; return ok; }

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mean(a) { a = a.filter(x => typeof x === 'number' && !isNaN(x)); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; }
const r1 = v => v === null || v === undefined ? null : Math.round(v * 10) / 10;

/* ---------- מסכים ---------- */
let stepNo = 0, stepTotal = 1;
function show(html) {
  const pct = Math.min(100, Math.round(100 * stepNo / stepTotal));
  app.innerHTML = '<div class="screen"><div class="progress"><i style="width:' + pct + '%"></i></div>' + html + '</div>';
  window.scrollTo(0, 0);
  return app.firstElementChild;
}
function scaleHTML(key, lo, hi) {
  let b = '';
  for (let v = 1; v <= 7; v++) b += '<button type="button" data-v="' + v + '">' + v + '</button>';
  return '<div class="scale" data-key="' + esc(key) + '">' + b + '</div><div class="ends"><span>1 = ' + esc(lo) + '</span><span>7 = ' + esc(hi) + '</span></div>';
}
function sliderHTML(key, lo, hi) {
  return '<div class="slider untouched" data-key="' + esc(key) + '"><input type="range" min="0" max="100" step="5" value="50" aria-label="' + esc(lo + ' עד ' + hi) + '">' +
    '<div class="ends"><span>0 = ' + esc(lo) + '</span><span class="val">גררי לבחירה</span><span>100 = ' + esc(hi) + '</span></div></div>';
}
/* מחבר את רכיבי הדירוג שבמסך, ומחזיר פונקציה שבודקת מה חסר. keys = המפתחות שחובה לענות עליהם. */
function wire(s, keys) {
  s.querySelectorAll('.scale').forEach(sc => {
    sc.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
      const [part, item, k] = sc.dataset.key.split('|');
      setA(part, item, k, +btn.dataset.v);
      sc.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === btn));
      const it = sc.closest('.item'); if (it) it.classList.remove('missing');
    }));
  });
  s.querySelectorAll('.slider').forEach(sl => {
    const inp = sl.querySelector('input'), val = sl.querySelector('.val');
    const set = () => {
      const [part, item, k] = sl.dataset.key.split('|');
      setA(part, item, k, +inp.value); sl.classList.remove('untouched'); val.textContent = inp.value;
      const it = sl.closest('.item'); if (it) it.classList.remove('missing');
    };
    inp.addEventListener('input', set); inp.addEventListener('change', set);
    inp.addEventListener('pointerdown', () => setTimeout(set, 0));
  });
  return function missing() {
    const miss = keys.filter(k => A[k] === undefined);
    s.querySelectorAll('.scale, .slider').forEach(el => { const it = el.closest('.item'); if (it && miss.indexOf(el.dataset.key) >= 0) it.classList.add('missing'); });
    return miss;
  };
}
function autoFill(s) {
  s.querySelectorAll('.scale').forEach(sc => { const bs = sc.querySelectorAll('button'); bs[Math.floor(Math.random() * bs.length)].click(); });
  s.querySelectorAll('.slider input').forEach(inp => { inp.value = 5 * Math.floor(Math.random() * 21); inp.dispatchEvent(new Event('input')); });
  s.querySelectorAll('input[type=text]:not(.code)').forEach(inp => { inp.value = 'בדיקה'; });
}
/* מסך כללי: html + מפתחות חובה. מחזיר Promise שנפתר בלחיצה על "להמשיך". */
function page(id, html, keys, opts) {
  opts = opts || {};
  return new Promise(resolve => {
    stepNo += 1;
    const tStart = performance.now();
    const s = show(html + '<div class="err" id="err"></div><div class="btnrow"><button class="next" id="go">' + (opts.btn || 'להמשיך') + '</button></div>');
    const missing = wire(s, keys || []);
    s.querySelector('#go').onclick = () => {
      const miss = missing();
      if (miss.length) { s.querySelector('#err').textContent = 'נשארו ' + miss.length + ' דירוגים בלי תשובה (מסומנים בצבע).'; const m = s.querySelector('.item.missing'); if (m) m.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      if (opts.collect) opts.collect(s);
      META['ms_' + id] = Math.round(performance.now() - tStart);
      logEv('page', { id }); resolve();
    };
    if (auto) setTimeout(() => { autoFill(s); s.querySelector('#go').click(); }, 20);
  });
}

/* ---------- פרצוף סכמטי: m = פה (-1 זועף עד +1 מחייך), b = גבות (-1 כועסות עד +1 רפויות) ---------- */
function faceSVG(m, b) {
  const ang = Math.max(0, -b), rel = Math.max(0, b);
  const innerY = 86 + 13 * ang - 3 * rel, outerY = 82 - 5 * ang - 2 * rel, midY = Math.min(innerY, outerY) - 5 * (1 - ang);
  const eyeRy = 10 - 3 * ang - 2 * Math.max(0, m - 0.5);
  const hw = 30 + 7 * Math.max(0, m), cornerY = 172 - 5 * m, ctrlY = 172 + 30 * m;
  const brow = (xIn, xOut) => '<path d="M ' + xOut + ' ' + outerY.toFixed(1) + ' Q ' + ((xIn + xOut) / 2) + ' ' + midY.toFixed(1) + ' ' + xIn + ' ' + innerY.toFixed(1) + '" />';
  const eye = cx => '<ellipse cx="' + cx + '" cy="108" rx="13" ry="' + eyeRy.toFixed(1) + '" fill="#fff" /><circle cx="' + cx + '" cy="108" r="' + Math.min(5, eyeRy - 1.5).toFixed(1) + '" fill="#2b2b2b" stroke="none" />';
  return '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="פרצוף מצויר">' +
    '<g fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' +
    '<ellipse cx="100" cy="122" rx="80" ry="100" fill="#f6f2ea" />' +
    brow(84, 50) + brow(116, 150) + eye(68) + eye(132) +
    '<path d="M 100 122 L 95 146 L 104 146" stroke-width="3" />' +
    '<path d="M ' + (100 - hw).toFixed(1) + ' ' + cornerY.toFixed(1) + ' Q 100 ' + ctrlY.toFixed(1) + ' ' + (100 + hw).toFixed(1) + ' ' + cornerY.toFixed(1) + '" />' +
    '</g></svg>';
}
if (debug) window.faceSVG = faceSVG;

/* ---------- פתיחה ---------- */
function screenIntro() {
  return new Promise(resolve => {
    const s = show(`
      <h1>שאלון קצר לקראת השיעור</h1>
      <p class="muted">סמינר חרדה חברתית וטראומה חברתית · ד"ר רועי אזולאי · אוניברסיטת בר-אילן</p>
      <p>בשיעור הקרוב נעסוק באופן שבו אנשים <b>מפרשים</b> מצבים חברתיים, <b>שופטים</b> את עצמם ואת מה שעלול לקרות, ו<b>זוכרים</b> אירועים חברתיים. כדי שהדיון יהיה מוחשי, השאלון הזה מדגים ארבע מהמשימות שבהן משתמשים במחקר: מצבים חברתיים, תפיסת עצמי, סיכוי ומחיר של אירועים, ופרצופים.</p>
      <p>המילוי נמשך כשמונה עד עשר דקות, ואפשר למלא בטלפון. אין תשובות נכונות או שגויות. בסוף יוצג סיכום אישי של התשובות שלך.</p>
      <p>התשובות נשמרות <b>באופן אנונימי</b>, תחת קוד בן ארבע ספרות שאת בוחרת, ומשמשות לדיון בכיתה בלבד. זו לא בדיקה אבחנתית.</p>
      <label for="code">קוד בן ארבע ספרות</label>
      <input type="text" class="code" id="code" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="off">
      <p class="small" style="margin-top:8px">אם עשית את משימת החצים (dot-probe) ואת זוכרת את הקוד שבחרת שם, כדאי להשתמש באותו קוד.</p>
      <div class="err" id="err"></div>
      <div class="btnrow"><button class="next" id="go">להתחיל</button></div>`);
    const go = () => {
      const code = s.querySelector('#code').value.trim();
      if (!/^\d{4}$/.test(code)) { s.querySelector('#err').textContent = 'הקוד צריך להיות בדיוק ארבע ספרות.'; return; }
      D.code = code; D.pid = (debug && q.get('pid')) ? q.get('pid') : 'S' + code;
      logEv('intro_done'); checkpoint('start'); resolve();
    };
    s.querySelector('#go').onclick = go;
    if (auto) { s.querySelector('#code').value = q.get('code') || '0000'; setTimeout(go, 20); }
  });
}

/* ---------- חלק 1: מצבים חברתיים ---------- */
async function part1() {
  await page('p1_intro', `
    <div class="part">חלק 1 מתוך 4</div><h2>מצבים חברתיים</h2>
    <p>בכל מסך יתואר מצב קצר. דמייני שהוא קורה לך עכשיו, כאילו את רואה אותו דרך העיניים שלך.</p>
    <p>אחרי כל מצב יופיעו שלושה הסברים אפשריים. דרגי עד כמה כל אחד מהם נראה לך סביר. כל הסבר מדורג בנפרד, כך שאפשר לתת ציון גבוה ליותר מהסבר אחד.</p>`, []);
  const order = shuffle(ITEMS.interp.slice());
  META.order_interp = order.map(x => x.id).join(',');
  for (let i = 0; i < order.length; i++) {
    const it = order[i];
    if (i < 2) {
      await page('open_' + it.id, `
        <div class="part">חלק 1 · מצב ${i + 1} מתוך ${order.length}</div>
        <div class="scenario">${esc(it.text)}</div>
        <label for="open">מה ההסבר הראשון שעולה לך בראש? (משפט קצר, רשות)</label>
        <input type="text" id="open" maxlength="200" autocomplete="off">`, [], {
        collect: s => { const v = s.querySelector('#open').value.trim(); if (v) setA('interp_open', it.id, 'text', v); setA('interp_open', it.id, 'pos', i + 1); }
      });
    }
    const exps = shuffle([['neg', it.neg], ['neu', it.neu], ['pos', it.pos]]);
    META['order_' + it.id] = exps.map(e => e[0]).join(',');
    await page('rate_' + it.id, `
      <div class="part">חלק 1 · מצב ${i + 1} מתוך ${order.length}</div>
      <div class="scenario">${esc(it.text)}</div>
      <p class="q">עד כמה כל אחד מההסברים הבאים נראה לך סביר?</p>
      ${exps.map(e => '<div class="item"><p class="stmt">' + esc(e[1]) + '</p>' + scaleHTML('interp|' + it.id + '|' + e[0], 'כלל לא סביר', 'סביר מאוד') + '</div>').join('')}`,
      exps.map(e => 'interp|' + it.id + '|' + e[0]));
  }
  const pos = shuffle(ITEMS.positive.slice());
  for (let i = 0; i < pos.length; i++) {
    const it = pos[i];
    const th = shuffle([['accept', it.accept], ['raise', it.raise], ['discount', it.discount]]);
    await page('pos_' + it.id, `
      <div class="part">חלק 1 · ועכשיו שני מצבים מסוג אחר (${i + 1} מתוך ${pos.length})</div>
      <div class="scenario">${esc(it.text)}</div>
      <p class="q">עד כמה כל אחת מהמחשבות הבאות הייתה עולה בך?</p>
      ${th.map(e => '<div class="item"><p class="stmt">' + esc(e[1]) + '</p>' + scaleHTML('positive|' + it.id + '|' + e[0], 'כלל לא', 'מאוד') + '</div>').join('')}`,
      th.map(e => 'positive|' + it.id + '|' + e[0]));
  }
  checkpoint('p1');
}

/* ---------- חלק 2: תפיסת עצמי ---------- */
async function part2() {
  await page('p2_iam', `
    <div class="part">חלק 2 מתוך 4</div><h2>תפיסת עצמי</h2>
    <p>השלימי שלושה משפטים שמתחילים במילה "אני". כתבי את הדבר הראשון שעולה בראש, במילה או בכמה מילים. (רשות. מה שתכתבי כאן לא יוצג בכיתה.)</p>
    ${[1, 2, 3].map(n => '<label for="iam' + n + '">אני…</label><input type="text" id="iam' + n + '" maxlength="120" autocomplete="off">').join('')}`, [], {
    collect: s => [1, 2, 3].forEach(n => { const v = s.querySelector('#iam' + n).value.trim(); if (v) setA('iam', 'iam' + n, 'text', v); })
  });
  const tr = shuffle(ITEMS.traits.slice());
  META.order_traits = tr.map(x => x.id).join(',');
  await page('p2_traits', `
    <div class="part">חלק 2 · תפיסת עצמי</div>
    <p class="q">בהשוואה לאנשים אחרים בגילך, עד כמה את…</p>
    <p class="small">4 = כמו רוב האנשים בגילי</p>
    ${tr.map(t => '<div class="item"><p class="stmt"><b>' + esc(t.text) + '</b></p>' + scaleHTML('self|' + t.id + '|v', 'הרבה פחות מאחרים', 'הרבה יותר מאחרים') + '</div>').join('')}`,
    tr.map(t => 'self|' + t.id + '|v'));
  await page('p2_meta', `
    <div class="part">חלק 2 · תפיסת עצמי</div>
    <p class="q">ואיך לדעתך אחרים רואים אותך?</p>
    ${ITEMS.meta.map(t => '<div class="item"><p class="stmt">' + esc(t.text) + '</p>' + scaleHTML('meta|' + t.id + '|v', 'כלל לא', 'מאוד') + '</div>').join('')}`,
    ITEMS.meta.map(t => 'meta|' + t.id + '|v'));
  checkpoint('p2');
}

/* ---------- חלק 3: סיכוי ומחיר ---------- */
async function part3() {
  await page('p3_intro', `
    <div class="part">חלק 3 מתוך 4</div><h2>אירועים אפשריים</h2>
    <p>בכל מסך יתואר אירוע שעלול לקרות. לכל אירוע יש שתי שאלות: מה הסיכוי שדבר כזה יקרה לך בשנה הקרובה, ועד כמה זה יהיה קשה עבורך אם יקרה.</p>
    <p>עונים בגרירה של הסמן על פס בין 0 ל-100. אם האירוע לא מתאים בדיוק לחיים שלך (למשל, אין לך מנהל), דמייני מצב דומה.</p>`, []);
  const ev = shuffle(ITEMS.events.slice());
  META.order_events = ev.map(x => x.id).join(',');
  for (let i = 0; i < ev.length; i++) {
    const it = ev[i];
    await page('ev_' + it.id, `
      <div class="part">חלק 3 · אירוע ${i + 1} מתוך ${ev.length}</div>
      <div class="scenario">${esc(it.text)}</div>
      <div class="item"><p class="stmt"><b>מה הסיכוי שדבר כזה יקרה לך בשנה הקרובה?</b></p>${sliderHTML('event|' + it.id + '|prob', 'אין סיכוי', 'בטוח שיקרה')}</div>
      <div class="item"><p class="stmt"><b>אם זה יקרה, עד כמה זה יהיה קשה עבורך?</b></p>${sliderHTML('event|' + it.id + '|cost', 'כלל לא קשה', 'קשה מאוד')}</div>`,
      ['event|' + it.id + '|prob', 'event|' + it.id + '|cost']);
  }
  checkpoint('p3');
}

/* ---------- חלק 4: פרצופים ---------- */
async function part4() {
  await page('p4_intro', `
    <div class="part">חלק 4 מתוך 4</div><h2>פרצופים</h2>
    <p>יוצגו עשרה פרצופים מצוירים, אחד בכל מסך. לכל פרצוף יש שתי שאלות: כמה הוא נראה <b>כועס</b>, וכמה הוא נראה <b>שמח</b>.</p>
    <p>עני לפי הרושם הראשון, בלי להתעכב. אותו פרצוף יכול לקבל ציון גבוה או נמוך בשתי השאלות.</p>`, []);
  const fs = shuffle(ITEMS.faces.slice());
  META.order_faces = fs.map(x => x.id).join(',');
  for (let i = 0; i < fs.length; i++) {
    const f = fs[i];
    await page('face_' + f.id, `
      <div class="part">חלק 4 · פרצוף ${i + 1} מתוך ${fs.length}</div>
      <div class="facebox">${faceSVG(f.m, f.b)}</div>
      <div class="item"><p class="stmt"><b>כמה הפרצוף הזה כועס?</b></p>${scaleHTML('face|' + f.id + '|angry', 'כלל לא', 'מאוד')}</div>
      <div class="item"><p class="stmt"><b>כמה הפרצוף הזה שמח?</b></p>${scaleHTML('face|' + f.id + '|happy', 'כלל לא', 'מאוד')}</div>`,
      ['face|' + f.id + '|angry', 'face|' + f.id + '|happy']);
  }
}

/* ---------- סיכום ---------- */
function summarize() {
  const I = ITEMS, m = (list, part, k, f) => mean(list.filter(f || (() => true)).map(x => getA(part, x.id, k)));
  const S = {
    interp_neg: m(I.interp, 'interp', 'neg'), interp_neu: m(I.interp, 'interp', 'neu'), interp_pos: m(I.interp, 'interp', 'pos'),
    interp_neg_rank: m(I.interp, 'interp', 'neg', x => x.dom === 'rank'), interp_neg_accept: m(I.interp, 'interp', 'neg', x => x.dom === 'accept'),
    pos_accept: m(I.positive, 'positive', 'accept'), pos_raise: m(I.positive, 'positive', 'raise'), pos_discount: m(I.positive, 'positive', 'discount'),
    self_rank: m(I.traits, 'self', 'v', x => x.dom === 'rank'), self_affil: m(I.traits, 'self', 'v', x => x.dom === 'affil'),
    meta_respect: getA('meta', 'm_respect', 'v'), meta_liked: getA('meta', 'm_liked', 'v'),
    prob_put: m(I.events, 'event', 'prob', x => x.type === 'put'), prob_exc: m(I.events, 'event', 'prob', x => x.type === 'exc'), prob_non: m(I.events, 'event', 'prob', x => x.type === 'non'),
    cost_put: m(I.events, 'event', 'cost', x => x.type === 'put'), cost_exc: m(I.events, 'event', 'cost', x => x.type === 'exc'), cost_non: m(I.events, 'event', 'cost', x => x.type === 'non'),
    face0_angry: getA('face', 'f_0', 'angry'), face0_happy: getA('face', 'f_0', 'happy'),
    mix_angry: m(I.faces, 'face', 'angry', x => x.kind === 'mixed'), mix_happy: m(I.faces, 'face', 'happy', x => x.kind === 'mixed'),
    n_answers: Object.keys(A).length, duration_s: Math.round((performance.now() - t0) / 1000)
  };
  Object.keys(S).forEach(k => { if (typeof S[k] === 'number') S[k] = Math.round(S[k] * 100) / 100; });
  return S;
}
function bar(label, v, max, cls) {
  const w = v === null || v === undefined ? 0 : Math.max(2, Math.round(100 * v / max));
  return '<div class="brow ' + (cls || '') + '"><span class="lab">' + esc(label) + '</span><span class="track"><i style="width:' + w + '%"></i></span><span class="num">' + (v === null || v === undefined ? '–' : r1(v)) + '</span></div>';
}
function downloadJSON() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body()], { type: 'application/json' })); a.download = 'seminar_q_' + D.pid + '.json'; a.click();
}
async function screenResults() {
  D.qsum = summarize(); const S = D.qsum;
  stepNo = stepTotal;
  const line = ITEMS.faces.filter(f => f.kind === 'line'), mixed = ITEMS.faces.filter(f => f.kind === 'mixed');
  const fc = f => '<div class="fc">' + faceSVG(f.m, f.b) + '<br>כעס ' + (getA('face', f.id, 'angry') || '–') + ' · שמחה ' + (getA('face', f.id, 'happy') || '–') + '</div>';
  const s = show(`
    <h1>הסיכום האישי שלך</h1>
    <p>תודה. אלה הממוצעים של התשובות שלך בכל אחד מארבעת החלקים. הם לא ציון ולא אבחנה: הם נועדו כדי שתוכלי להשוות בשיעור בין מה שעלה אצלך לבין מה שמוצאים במחקר. הקוד שלך: <b>${esc(D.code)}</b>.</p>
    <div class="card"><h3>1. מצבים עמומים: כמה סביר נראה כל סוג של הסבר (1 עד 7)</h3><div class="bars">
      ${bar('הסבר שלילי', S.interp_neg, 7, 'alt')}${bar('הסבר ניטרלי', S.interp_neu, 7, 'blue')}${bar('הסבר חיובי', S.interp_pos, 7)}</div>
      <p class="small">ההסבר השלילי במצבים של הערכה ומעמד: ${r1(S.interp_neg_rank)} · במצבים של קבלה ושייכות: ${r1(S.interp_neg_accept)}</p></div>
    <div class="card"><h3>אירועים חיוביים: אילו מחשבות עלו (1 עד 7)</h3><div class="bars">
      ${bar('זה באמת טוב', S.pos_accept, 7)}${bar('עכשיו יצפו ממני ליותר', S.pos_raise, 7, 'alt')}${bar('זה רק מתוך נימוס', S.pos_discount, 7, 'blue')}</div></div>
    <div class="card"><h3>2. תפיסת עצמי ביחס לאחרים (1 עד 7, 4 = כמו אחרים)</h3><div class="bars">
      ${bar('תכונות של מעמד (אסרטיבית, מנהיגה…)', S.self_rank, 7)}${bar('תכונות של חום (חמה, ידידותית…)', S.self_affil, 7, 'blue')}
      ${bar('אחרים מעריכים אותי', S.meta_respect, 7)}${bar('אחרים מחבבים אותי', S.meta_liked, 7, 'blue')}</div></div>
    <div class="card"><h3>3. סיכוי ומחיר של אירועים (0 עד 100)</h3><div class="bars">
      ${bar('השפלה: סיכוי', S.prob_put, 100)}${bar('השפלה: מחיר', S.cost_put, 100, 'alt')}
      ${bar('הדרה: סיכוי', S.prob_exc, 100)}${bar('הדרה: מחיר', S.cost_exc, 100, 'alt')}
      ${bar('לא חברתי: סיכוי', S.prob_non, 100)}${bar('לא חברתי: מחיר', S.cost_non, 100, 'alt')}</div></div>
    <div class="card"><h3>4. פרצופים: הדירוגים שלך (1 עד 7)</h3>
      <p class="small">שבעת הפרצופים שעל הרצף, מהכועס ביותר ועד השמח ביותר:</p><div class="facegrid">${line.map(fc).join('')}</div>
      <p class="small">שלושת הפרצופים המעורבים (למשל פה מחייך עם גבות כועסות):</p><div class="facegrid">${mixed.map(fc).join('')}</div></div>
    <p>בשיעור נעבור על כל אחד מהחלקים: מה המשימה מודדת, מה מוצאים בה אצל אנשים עם חרדה חברתית, ואיפה הממצאים חלוקים. כדאי לצלם את המסך הזה או לזכור את הקוד.</p>
    <div class="status" id="st">שומר את התשובות…</div>
    <div class="btnrow" id="dl" style="display:none"><button class="ghost" id="dlb">להוריד את התשובות כקובץ</button></div>`);
  const st = s.querySelector('#st'), dl = s.querySelector('#dl');
  s.querySelector('#dlb').onclick = downloadJSON;
  const ok = await finalSave();
  if (ok === true) { st.className = 'status ok'; st.textContent = 'התשובות נשמרו. אפשר לסגור את העמוד.'; }
  else if (ok === null) { st.className = 'status bad'; st.textContent = 'גרסת בדיקה: אין שמירה לשרת.'; dl.style.display = 'flex'; }
  else { st.className = 'status bad'; st.textContent = 'השמירה לא הצליחה כרגע. העמוד ינסה שוב כשיהיה חיבור. אפשר גם להוריד את התשובות כקובץ ולשלוח במייל ל-' + CONFIG.contactEmail + '.'; dl.style.display = 'flex'; }
  logEv('results_shown', { saved: ok });
}

(async function main() {
  stepTotal = 1 + (6 + 2 + 2) + 3 + (1 + 8) + (1 + 10) + 1;
  await screenIntro();
  await part1(); await part2(); await part3(); await part4();
  await screenResults();
})();
})();
