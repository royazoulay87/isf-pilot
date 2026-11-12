/* הדגמת dot-probe לסמינר חרדה חברתית. v2 (11.11.2026): שני מצבי גירויים, מילים (words) או תמונות בגוף ראשון (images), ו-LSAS בסוף.
   זרימה: קוד אנונימי → הסבר → תרגול (8) → מבחן (64, הפסקה באמצע) → LSAS (24 פריטים, אפשר לדלג) → תוצאה אישית → שמירה למקלט המשותף.
   חוזה הנתונים (המקלט v11+): task 'dotprobe', pid 'S' + 4 ספרות, stage 'start' | 'half' | 'lsas' | 'complete', cond, version, study, ua, rows[] (ניסויים), summary{}, lsas{}. */
(function () {
'use strict';
const q = new URLSearchParams(location.search);
const debug = q.get('debug') === '1';
const MODE = (debug && q.get('mode')) ? q.get('mode') : (CONFIG.stimuli || 'words');
const ts = (debug && q.get('ts')) ? Math.max(0.02, parseFloat(q.get('ts')) || 1) : CONFIG.timeScale;
const nTest = (debug && q.get('n')) ? Math.max(2, parseInt(q.get('n'), 10) || CONFIG.testTrials) : CONFIG.testTrials;
const skipLsasDebug = debug && q.get('lsas') === '0';
const showMs = (debug && q.get('show')) ? Math.max(50, parseInt(q.get('show'), 10) || CONFIG.wordsMs) : CONFIG.wordsMs;  // ?debug=1&show=4000 מאריך את הצגת הגירויים לבדיקת פריסה
const T = ms => Math.max(0, Math.round(ms * ts));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const saver = ISFSave(CONFIG.endpoint);
const VERSION = CONFIG.version + '_' + MODE + (debug ? '_debug' : '');
const IMG = {};  // תמונות טעונות מראש, לפי שם קובץ

const D = {
  task: 'dotprobe', version: VERSION, study: CONFIG.study, session: '', pid: '', stage: '', cond: MODE === 'images' ? CONFIG.condImages : CONFIG.cond,
  ua: navigator.userAgent, start: new Date().toISOString(), code: '', spin: null, mode: MODE,
  device: { touch: isTouch, w: innerWidth, h: innerHeight, dpr: devicePixelRatio || 1, lang: navigator.language, platform: navigator.platform || '' },
  params: { fixationMs: CONFIG.fixationMs, wordsMs: CONFIG.wordsMs, maxRtMs: CONFIG.maxRtMs, itiMs: CONFIG.itiMs, practice: CONFIG.practiceTrials, test: nTest, breakAfter: CONFIG.breakAfter, validRtMin: CONFIG.validRtMin, validRtMax: CONFIG.validRtMax, timeScale: ts },
  rows: [], summary: null, lsas: null, log: [], saved: {}
};
if (debug) window.D = D;
const logEv = (ev, extra) => D.log.push(Object.assign({ ev, t: new Date().toISOString(), ms: Math.round(performance.now()) }, extra || {}));

function body() { const o = {}; for (const k in D) if (!k.startsWith('_')) o[k] = D[k]; return JSON.stringify(o); }
function identity(stage) { return D.task + ':' + D.pid + ':' + D.start + ':' + stage; }
function checkpoint(stage) { D.stage = stage; if (!CONFIG.endpoint) return; saver.enqueue(body(), identity(stage)); }
async function finalSave() { D.stage = 'complete'; if (!CONFIG.endpoint) return null; const ok = await saver.complete(body(), identity('complete')); D.saved.complete = ok ? 1 : 0; return ok; }

function show(html) { app.innerHTML = '<div class="screen">' + html + '</div>'; window.scrollTo(0, 0); return app.firstElementChild; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function median(a) { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; }
function sd(a) { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); }
const fmtMs = v => v === null || v === undefined ? '–' : (v > 0 ? '+' : '') + Math.round(v) + ' ms';

/* ---------- בניית הניסויים ---------- */
function buildTest() {
  const trials = [];
  if (MODE === 'images') {
    const pairs = shuffle(IMAGE_PAIRS.slice());
    pairs.forEach((p, i) => {
      const flip = i % 2 === 1;
      trials.push({ pair: p.id, cat: p.cat, threat: p.social, neutral: p.neutral, threatPos: 'top', congruent: flip ? 0 : 1 });
      trials.push({ pair: p.id, cat: p.cat, threat: p.social, neutral: p.neutral, threatPos: 'bottom', congruent: flip ? 1 : 0 });
    });
  } else {
    const pairs = shuffle(PAIRS.slice());
    pairs.forEach((p, i) => {
      const flip = i % 2 === 1;
      trials.push({ pair: i + 1, cat: 'threat', threat: p[0], neutral: p[1], threatPos: 'top', congruent: flip ? 0 : 1 });
      trials.push({ pair: i + 1, cat: 'threat', threat: p[0], neutral: p[1], threatPos: 'bottom', congruent: flip ? 1 : 0 });
    });
  }
  // קיצור לבדיקות (?n=): שומר על איזון מדויק בין congruent ל-incongruent.
  const half = Math.floor(Math.min(nTest, trials.length) / 2);
  const chosen = shuffle(trials.filter(t => t.congruent === 1)).slice(0, half).concat(shuffle(trials.filter(t => t.congruent === 0)).slice(0, half));
  shuffle(chosen);
  const dirs = shuffle(chosen.map((_, i) => i % 2 ? 'L' : 'R'));
  chosen.forEach((t, i) => { t.probeDir = dirs[i]; t.probePos = t.congruent ? t.threatPos : (t.threatPos === 'top' ? 'bottom' : 'top'); t.practice = 0; });
  return chosen;
}
function buildPractice() {
  const src = MODE === 'images' ? PRACTICE_IMAGE_PAIRS.concat(PRACTICE_IMAGE_PAIRS) : PRACTICE_PAIRS;
  return shuffle(src.slice()).slice(0, CONFIG.practiceTrials).map((p, i) => {
    const top = Math.random() < .5;
    return { pair: 'p' + (i + 1), cat: 'practice', threat: '', neutral: p[0] + '/' + p[1], wordTop: top ? p[0] : p[1], wordBottom: top ? p[1] : p[0], threatPos: '', congruent: '', probePos: Math.random() < .5 ? 'top' : 'bottom', probeDir: Math.random() < .5 ? 'L' : 'R', practice: 1 };
  });
}

/* ---------- טעינת תמונות מראש ---------- */
function preloadImages() {
  const names = new Set();
  IMAGE_PAIRS.forEach(p => { names.add(p.social); names.add(p.neutral); });
  PRACTICE_IMAGE_PAIRS.forEach(p => { names.add(p[0]); names.add(p[1]); });
  const list = [...names]; let done = 0, failed = [];
  const s = show('<h2>טוען את התמונות…</h2><div class="progress"><i id="pb" style="width:0%"></i></div><p class="small" id="pt">0 מתוך ' + list.length + '</p>');
  return Promise.all(list.map(n => new Promise(res => {
    const im = new Image();
    im.onload = () => { (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => { IMG[n] = im; done++; s.querySelector('#pb').style.width = Math.round(100 * done / list.length) + '%'; s.querySelector('#pt').textContent = done + ' מתוך ' + list.length; res(); }); };
    im.onerror = () => { failed.push(n); done++; res(); };
    im.src = CONFIG.imageDir + n;
  }))).then(() => { logEv('preload_done', { failed: failed.length }); D.log.push({ ev: 'preload_failed', files: failed }); return failed; });
}

/* ---------- מסכים ---------- */
function screenIntro() {
  return new Promise(resolve => {
    const s = show(`
      <h1>הדגמת dot-probe</h1>
      <p class="muted">סמינר חרדה חברתית, טראומה חברתית ו-EMA · ד"ר רועי אזולאי · אוניברסיטת בר-אילן</p>
      <p>זו המשימה הקלאסית שבה מודדים <b>הטיות קשב</b> (MacLeod, Mathews &amp; Tata, 1986). היא נמשכת כעשר דקות: תרגול קצר, 64 ניסויים קצרים עם הפסקה באמצע, ושאלון קצר בסוף. אחר כך מוצגת התוצאה שלך, עם הסבר מה אפשר ללמוד ממנה ומה לא.</p>
      <p>התוצאה נשמרת <b>באופן אנונימי</b>, תחת קוד בן ארבע ספרות שאת בוחרת, ומשמשת לדיון בכיתה בלבד. זו לא בדיקה אבחנתית, ואין בה תוצאה "טובה" או "רעה".</p>
      <label for="code">בחרי קוד בן ארבע ספרות (וזכרי אותו, כדי לזהות את התוצאה שלך בכיתה)</label>
      <input type="text" id="code" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="off">
      <p class="small" style="margin-top:14px">הכי נוח במחשב, עם מקשי החיצים. בטלפון זה עובד גם, עם שני כפתורים שיופיעו על המסך. ${isTouch ? 'זוהה כאן מסך מגע.' : 'זוהתה כאן מקלדת.'}</p>
      <div class="err" id="err"></div>
      <div class="btnrow"><button class="next" id="go">להמשיך</button></div>`);
    s.querySelector('#go').onclick = () => {
      const code = s.querySelector('#code').value.trim();
      if (!/^\d{4}$/.test(code)) { s.querySelector('#err').textContent = 'הקוד צריך להיות בדיוק ארבע ספרות.'; return; }
      D.code = code; D.pid = 'S' + code;
      logEv('intro_done'); checkpoint('start'); resolve();
    };
  });
}
function screenInstructions() {
  return new Promise(resolve => {
    const keys = isTouch
      ? 'בטלפון: לוחצים על הכפתור שעליו מצויר אותו חץ.'
      : 'חץ שמאלה ◀ = המקש <span class="kbd">←</span> במקלדת. חץ ימינה ▶ = המקש <span class="kbd">→</span>. (אפשר גם ללחוץ על הכפתורים שעל המסך.)';
    const what = MODE === 'images' ? 'שתי תמונות' : 'שתי מילים';
    const demo = MODE === 'images'
      ? `<div class="box"><span class="m">+</span><em>שלב 1: צלב</em></div><div class="box"><span class="t" style="font-size:13px">[תמונה]</span><span class="b" style="font-size:13px">[תמונה]</span><em>שלב 2: שתי תמונות</em></div><div class="box"><span class="pr">▶</span><em>שלב 3: חץ במקום אחת התמונות</em></div>`
      : `<div class="box"><span class="m">+</span><em>שלב 1: צלב</em></div><div class="box"><span class="t">בושה</span><span class="b">חלון</span><em>שלב 2: שתי מילים</em></div><div class="box"><span class="pr">▶</span><em>שלב 3: חץ במקום אחת המילים</em></div>`;
    const s = show(`
      <h2>מה רואים, ומה עושים</h2>
      <ol style="padding-right:22px;margin:0 0 14px">
        <li>במרכז המסך מופיע צלב <b>+</b>. מסתכלים עליו.</li>
        <li>אחריו מופיעות לרגע <b>${what}</b>: אחת מעל הצלב ואחת מתחתיו.</li>
        <li>${what === 'שתי תמונות' ? 'התמונות נעלמות' : 'המילים נעלמות'}, ובמקום אחת מהן מופיע <b>חץ</b>: ◀ או ▶.</li>
        <li><b>התפקיד שלך:</b> להגיב לחץ מהר ככל האפשר, בלי לטעות. ${keys}</li>
      </ol>
      <div class="demo">${demo}</div>
      <p style="margin-top:34px">${MODE === 'images' ? 'לא צריך לעשות כלום עם התמונות עצמן, רק להגיב לחץ: מהר, ובלי טעויות. למה בכלל יש שם תמונות? על זה נדבר בכיתה.' : 'לא צריך לקרוא את המילים ולא לזכור אותן. חשוב רק להגיב לחץ: מהר, ובלי טעויות. למה בכלל יש שם מילים? על זה נדבר בכיתה.'}</p>
      <p>קודם תרגול קצר (${CONFIG.practiceTrials} ניסויים) עם משוב אחרי כל תגובה. אחר כך המבחן עצמו (${nTest} ניסויים, עם הפסקה קצרה באמצע), בלי משוב.</p>
      <div class="btnrow"><button class="next" id="go">לתרגול</button></div>`);
    s.querySelector('#go').onclick = () => { logEv('instructions_done'); resolve(); };
  });
}
function screenMessage(title, text, btn) {
  return new Promise(resolve => {
    const s = show(`<h2>${title}</h2><p>${text}</p><div class="btnrow"><button class="next" id="go">${btn}</button></div>`);
    s.querySelector('#go').onclick = () => resolve();
  });
}

/* ---------- הרצת ניסויים ---------- */
function arenaHTML(progress) {
  const cls = MODE === 'images' ? 'arena imgs' : 'arena';
  return `<div class="progress"><i style="width:${progress}%"></i></div>
    <div class="${cls}"><div class="slot top" id="top"></div><div class="slot mid" id="mid"></div><div class="slot bottom" id="bottom"></div></div>
    <div class="fb" id="fb"></div>
    <div class="resp dim" id="resp"><button type="button" data-r="L" aria-label="שמאלה">◀</button><button type="button" data-r="R" aria-label="ימינה">▶</button></div>
    <div class="hint">${isTouch ? 'הגיבי בכפתורים' : 'הגיבי במקשי החיצים ← → (או בכפתורים)'}</div>`;
}
function setStim(el, name) {
  if (MODE === 'images') { el.textContent = ''; const im = IMG[name]; if (im) { const c = im.cloneNode(); c.className = 'stim'; el.appendChild(c); } else { el.textContent = '·'; } }
  else el.textContent = name;
}
let keyHandler = null;
function waitResponse(maxMs) {
  return new Promise(resolve => {
    let done = false; const t0 = performance.now();
    const finish = (resp, how) => { if (done) return; done = true; cleanup(); resolve({ resp, rt: Math.round(performance.now() - t0), how }); };
    const timer = setTimeout(() => finish(null, 'timeout'), maxMs);
    keyHandler = e => { if (e.repeat) return; if (e.key === 'ArrowLeft') { e.preventDefault(); finish('L', 'key'); } else if (e.key === 'ArrowRight') { e.preventDefault(); finish('R', 'key'); } };
    const btns = Array.from(document.querySelectorAll('#resp button'));
    const onBtn = e => finish(e.currentTarget.dataset.r, 'button');
    btns.forEach(b => b.addEventListener('pointerdown', onBtn));
    document.addEventListener('keydown', keyHandler);
    function cleanup() { clearTimeout(timer); document.removeEventListener('keydown', keyHandler); keyHandler = null; btns.forEach(b => b.removeEventListener('pointerdown', onBtn)); }
  });
}
async function runTrials(trials, practice, startIndex, total) {
  for (let i = 0; i < trials.length; i++) {
    const t = trials[i];
    show(arenaHTML(Math.round(100 * (startIndex + i) / total)));
    const top = document.getElementById('top'), mid = document.getElementById('mid'), bottom = document.getElementById('bottom'), resp = document.getElementById('resp'), fb = document.getElementById('fb');
    mid.textContent = '+';
    await sleep(T(CONFIG.fixationMs));
    const wTop = practice ? t.wordTop : (t.threatPos === 'top' ? t.threat : t.neutral);
    const wBottom = practice ? t.wordBottom : (t.threatPos === 'top' ? t.neutral : t.threat);
    setStim(top, wTop); setStim(bottom, wBottom);
    await sleep(T(showMs));
    top.textContent = ''; bottom.textContent = ''; mid.textContent = '';
    const probeEl = t.probePos === 'top' ? top : bottom;
    probeEl.classList.add('probe'); probeEl.textContent = t.probeDir === 'L' ? '◀' : '▶';
    resp.classList.remove('dim');
    const r = await waitResponse(T(CONFIG.maxRtMs));
    probeEl.textContent = ''; probeEl.classList.remove('probe'); resp.classList.add('dim');
    const correct = r.resp === null ? 0 : (r.resp === t.probeDir ? 1 : 0);
    D.rows.push({ n: startIndex + i + 1, practice: t.practice, pair: t.pair, cat: t.cat, threat: t.threat, neutral: t.neutral, wordTop: wTop, wordBottom: wBottom, threatPos: t.threatPos, probePos: t.probePos, congruent: t.congruent, probeDir: t.probeDir, resp: r.resp, correct, rt: r.resp === null ? null : r.rt, timeout: r.resp === null ? 1 : 0, how: r.how });
    if (practice) { fb.textContent = r.resp === null ? 'מהר יותר' : (correct ? 'נכון' : 'לא נכון'); fb.className = 'fb ' + (correct ? 'ok' : 'bad'); await sleep(T(CONFIG.feedbackMs)); }
    await sleep(T(CONFIG.itiMs));
  }
}

/* ---------- LSAS ---------- */
function screenLSAS() {
  return new Promise(resolve => {
    const rows = LSAS_ITEMS.map((it, i) => `<tr data-i="${i}"><td class="stem">${i + 1}. ${esc(it)}</td>
      <td><select class="fear" aria-label="פחד או חרדה"><option value="">בחרי</option>${LSAS_FEAR.map((l, v) => `<option value="${v}">${l}</option>`).join('')}</select></td>
      <td><select class="avoid" aria-label="הימנעות"><option value="">בחרי</option>${LSAS_AVOID.map((l, v) => `<option value="${v}">${l}</option>`).join('')}</select></td></tr>`).join('');
    const s = show(`
      <h2>לפני התוצאה: שאלון קצר (כשלוש דקות)</h2>
      <p>כדי שנוכל להסתכל בכיתה על הקשר בין התוצאה במשימה לבין חרדה חברתית, 24 מצבים חברתיים. בתשובותייך התייחסי <b>לשבוע האחרון, כולל היום</b>. אם מצב לא התרחש בשבוע שעבר, דרגי אותו לפי איך שאת חושבת שהיית נוהגת בו. לכל מצב דרגי גם את מידת <b>הפחד או החרדה</b> שהרגשת, וגם את התכיפות שבה את <b>נמנעת</b> מהמצב. השאלון אנונימי, כמו כל השאר כאן.</p>
      <table class="lsas"><thead><tr><th>המצב</th><th>פחד או חרדה</th><th>הימנעות</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="err" id="err"></div>
      <div class="btnrow"><button class="next" id="go">לתוצאה שלי</button><button class="ghost" id="skip">לדלג על השאלון</button></div>`);
    s.querySelector('#go').onclick = () => {
      const fear = [], avoid = []; let missing = 0;
      s.querySelectorAll('tbody tr').forEach(tr => { const f = tr.querySelector('.fear').value, a = tr.querySelector('.avoid').value; tr.classList.toggle('missing', f === '' || a === ''); if (f === '' || a === '') missing++; fear.push(f === '' ? null : +f); avoid.push(a === '' ? null : +a); });
      if (missing) { s.querySelector('#err').textContent = 'חסרות ' + missing + ' תשובות (מסומנות). אפשר גם לדלג על השאלון.'; s.querySelector('tr.missing')?.scrollIntoView({ block: 'center' }); return; }
      const sum = a => a.reduce((x, y) => x + y, 0);
      D.lsas = { skipped: 0, fear, avoid, fear_total: sum(fear), avoid_total: sum(avoid), total: sum(fear) + sum(avoid) };
      logEv('lsas_done'); checkpoint('lsas'); resolve();
    };
    s.querySelector('#skip').onclick = () => { D.lsas = { skipped: 1 }; logEv('lsas_skipped'); resolve(); };
  });
}

/* ---------- תוצאה ---------- */
function biasOf(rows) { const c = rows.filter(r => r.congruent === 1).map(r => r.rt), i = rows.filter(r => r.congruent === 0).map(r => r.rt); return { n_cong: c.length, n_incong: i.length, med_cong: median(c), med_incong: median(i), mean_cong: mean(c), mean_incong: mean(i), bias_med: (c.length && i.length) ? median(i) - median(c) : null, bias_mean: (c.length && i.length) ? mean(i) - mean(c) : null }; }
function summarize() {
  const test = D.rows.filter(r => !r.practice);
  const valid = test.filter(r => r.correct === 1 && r.rt !== null && r.rt >= CONFIG.validRtMin && r.rt <= CONFIG.validRtMax);
  const S = Object.assign({
    mode: MODE, n_test: test.length, n_correct: test.filter(r => r.correct === 1).length, n_timeout: test.filter(r => r.timeout).length, n_valid: valid.length,
    acc: test.length ? test.filter(r => r.correct === 1).length / test.length : null, sd_valid: sd(valid.map(r => r.rt)),
    input: D.rows.some(r => r.how === 'button') ? (D.rows.some(r => r.how === 'key') ? 'mixed' : 'button') : 'key'
  }, biasOf(valid));
  const half = rows => { const b = biasOf(rows); return (b.n_cong >= 3 && b.n_incong >= 3) ? b.bias_med : null; };
  S.bias_odd = half(valid.filter(r => r.n % 2 === 1)); S.bias_even = half(valid.filter(r => r.n % 2 === 0));
  if (MODE === 'images') {
    S.cats = {};
    Object.keys(IMAGE_CATS).forEach(c => { const b = biasOf(valid.filter(r => r.cat === c)); S.cats[c] = { n: b.n_cong + b.n_incong, bias_med: b.bias_med, med_cong: b.med_cong, med_incong: b.med_incong }; });
    S.bias_threat = biasOf(valid.filter(r => r.cat === 'status_low' || r.cat === 'reject')).bias_med;
    S.bias_reward = biasOf(valid.filter(r => r.cat === 'status_high' || r.cat === 'accept')).bias_med;
    S.bias_status = biasOf(valid.filter(r => r.cat === 'status_high' || r.cat === 'status_low')).bias_med;
    S.bias_affil = biasOf(valid.filter(r => r.cat === 'accept' || r.cat === 'reject')).bias_med;
  }
  return S;
}
function interpret(S) {
  const thing = MODE === 'images' ? 'התמונה החברתית' : 'מילת האיום החברתי';
  if (S.bias_med === null || S.n_valid < 24) return 'מעט מדי ניסויים תקינים כדי לחשב הטיה (צריך לפחות 24 תגובות נכונות בטווח הזמן).';
  const b = S.bias_med;
  if (Math.abs(b) < 15) return 'הפרש קטן מ-15 אלפיות שנייה: בטווח הרעש. אין כאן עדות להטיה לכיוון כלשהו.';
  if (b > 0) return 'תגובות מהירות יותר כשהחץ הופיע במקום ' + thing + ': הקשב כבר היה שם. דפוס שמתואר בספרות כ"דריכות" (vigilance). ' + (b >= 40 ? 'ההפרש בולט.' : 'ההפרש קטן.');
  return 'תגובות מהירות יותר כשהחץ הופיע במקום התמונה הניטרלית: הקשב התרחק מ' + thing + '. דפוס שמתואר בספרות כ"הימנעות" קשבית. ' + (b <= -40 ? 'ההפרש בולט.' : 'ההפרש קטן.');
}
function downloadJSON() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body()], { type: 'application/json' })); a.download = 'dotprobe_' + D.pid + '.json'; document.body.appendChild(a); a.click(); a.remove();
}
async function screenResults() {
  const S = D.summary = summarize();
  D.stage = 'complete';
  const maxRt = Math.max(S.med_cong || 0, S.med_incong || 0, 1), hC = Math.round(120 * (S.med_cong || 0) / maxRt), hI = Math.round(120 * (S.med_incong || 0) / maxRt);
  const capA = MODE === 'images' ? 'חץ במקום התמונה החברתית' : 'חץ במקום מילת האיום';
  const capB = MODE === 'images' ? 'חץ במקום התמונה הניטרלית' : 'חץ במקום המילה הניטרלית';
  let cats = '';
  if (MODE === 'images' && S.cats) {
    cats = '<div class="card"><b>לפי סוג התמונה.</b> ההטיה בנפרד לכל אחת מארבע הקטגוריות (16 ניסויים בכל אחת, ולכן כל מספר כאן רועש עוד יותר מהכללי):<table class="cats">' +
      Object.keys(IMAGE_CATS).map(c => `<tr><td>${IMAGE_CATS[c]}</td><td dir="ltr">${fmtMs(S.cats[c].bias_med)}</td><td class="small">${S.cats[c].n} ניסויים תקינים</td></tr>`).join('') +
      `</table><p class="small" style="margin:8px 0 0">איום (מעמד נמוך + דחייה): ${fmtMs(S.bias_threat)} · קבלה ומעמד גבוה: ${fmtMs(S.bias_reward)} · מעמד (גבוה + נמוך): ${fmtMs(S.bias_status)} · שייכות (קבלה + דחייה): ${fmtMs(S.bias_affil)}</p></div>`;
  }
  const s = show(`
    <h2>התוצאה שלך (קוד ${esc(D.pid)})</h2>
    <div class="bars">
      <div class="bar"><b>${S.med_cong === null ? '–' : Math.round(S.med_cong)} ms</b><i style="height:${hC}px"></i><span class="cap">${capA}</span></div>
      <div class="bar inc"><b>${S.med_incong === null ? '–' : Math.round(S.med_incong)} ms</b><i style="height:${hI}px"></i><span class="cap">${capB}</span></div>
    </div>
    <p class="small" style="text-align:center">חציון זמן התגובה בניסויים התקינים (${S.n_valid} מתוך ${S.n_test}; דיוק ${S.acc === null ? '–' : Math.round(100 * S.acc)}%)</p>
    <div class="res">ציון הטיה: ${fmtMs(S.bias_med)}</div>
    <p style="text-align:center">${interpret(S)}</p>
    <div class="card"><b>מה הציון אומר.</b> ציון ההטיה = זמן התגובה כשהחץ החליף את ${MODE === 'images' ? 'התמונה הניטרלית' : 'המילה הניטרלית'} פחות זמן התגובה כשהחץ החליף את ${MODE === 'images' ? 'התמונה החברתית' : 'מילת האיום'}. חיובי = הקשב היה כבר "שם"; שלילי = הקשב התרחק; סביב אפס = אין הבדל.</div>
    ${cats}
    <div class="card"><b>מה הציון לא יכול לומר.</b> זו מדידה אחת, של ${S.n_test} ניסויים, במכשיר ובסביבה לא מבוקרים. ציוני dot-probe של אדם יחיד נוטים להשתנות הרבה ממדידה למדידה (מהימנות נמוכה), ולכן הם מתאימים להשוואות בין קבוצות ולא לאבחון של אדם. דוגמה אצלך: ההטיה בניסויים האי-זוגיים ${fmtMs(S.bias_odd)}, ובזוגיים ${fmtMs(S.bias_even)}. כמה הן דומות?</div>
    <p><b>למפגש:</b> כתבי לעצמך שלושה משפטים: מה המשימה מודדת, מה הרגשת שהיא "תפסה" אצלך, ומה היא לא יכולה לדעת.</p>
    <div class="status" id="status">${CONFIG.endpoint ? 'שומר את התוצאה…' : 'מצב בדיקה: אין שליחה לשרת.'}</div>
    <div class="btnrow"><button class="ghost" id="dl">להוריד את הנתונים שלי (JSON)</button><button class="ghost" id="retry" style="display:none">לנסות לשמור שוב</button></div>
    <p class="small" style="margin-top:16px">שאלות: ${esc(CONFIG.contactEmail)}</p>`);
  s.querySelector('#dl').onclick = downloadJSON;
  logEv('results_shown');
  if (!CONFIG.endpoint) return;
  const status = s.querySelector('#status'), retry = s.querySelector('#retry');
  const attempt = async () => {
    status.className = 'status'; status.textContent = 'שומר את התוצאה…'; retry.style.display = 'none';
    const ok = await finalSave();
    if (ok) { status.className = 'status ok'; status.textContent = 'התוצאה נשמרה (אנונימית, תחת הקוד ' + D.pid + '). תודה!'; }
    else { status.className = 'status bad'; status.textContent = 'השמירה לא אושרה. אפשר לנסות שוב, או להוריד את הקובץ ולשלוח במייל.'; retry.style.display = ''; }
  };
  retry.onclick = attempt;
  await attempt();
}

/* ---------- זרימה ---------- */
(async function main() {
  try {
    await screenIntro();
    if (MODE === 'images') { const failed = await preloadImages(); if (failed.length) console.warn('missing images', failed); }
    await screenInstructions();
    const practice = buildPractice(), test = buildTest(), total = practice.length + test.length;
    logEv('practice_start');
    await runTrials(practice, true, 0, total);
    logEv('practice_done');
    await screenMessage('התרגול הסתיים', 'עכשיו המבחן עצמו: ' + test.length + ' ניסויים, בלי משוב, עם הפסקה קצרה באמצע. להגיב לחץ מהר ככל האפשר, בלי לטעות.', 'להתחיל');
    const brk = Math.min(CONFIG.breakAfter, test.length);
    await runTrials(test.slice(0, brk), false, practice.length, total);
    if (test.length > brk) {
      logEv('break'); checkpoint('half');
      await screenMessage('הפסקה קצרה', 'עברת חצי מהניסויים. אפשר לנוח רגע. כשאת מוכנה, ממשיכים לחצי השני.', 'להמשיך');
      await runTrials(test.slice(brk), false, practice.length + brk, total);
    }
    logEv('test_done');
    if (CONFIG.lsas && !skipLsasDebug) await screenLSAS();
    await screenResults();
  } catch (err) {
    console.error(err);
    show('<h2>משהו השתבש</h2><p class="err">' + esc(err && err.message || err) + '</p><p>אפשר לרענן את הדף ולהתחיל מחדש. שאלות: ' + esc(CONFIG.contactEmail) + '</p>');
  }
})();
})();
