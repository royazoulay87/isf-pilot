/* הדגמת dot-probe בעברית לסמינר חרדה חברתית. זרימה: קוד אנונימי → הסבר → תרגול (8) → מבחן (64, הפסקה באמצע) → תוצאה אישית → שמירה למקלט המשותף.
   חוזה הנתונים (המקלט המשותף, v11 ומעלה): task 'dotprobe', pid 'S' + 4 ספרות, stage 'start' | 'complete', cond, version, study, ua, rows[] (ניסויים), summary{}. */
(function () {
'use strict';
const q = new URLSearchParams(location.search);
const debug = q.get('debug') === '1';
const ts = (debug && q.get('ts')) ? Math.max(0.02, parseFloat(q.get('ts')) || 1) : CONFIG.timeScale;
const nTest = (debug && q.get('n')) ? Math.max(2, parseInt(q.get('n'), 10) || CONFIG.testTrials) : CONFIG.testTrials;
const T = ms => Math.max(0, Math.round(ms * ts));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const saver = ISFSave(CONFIG.endpoint);
const VERSION = CONFIG.version + (debug ? '_debug' : '');

const D = {
  task: 'dotprobe', version: VERSION, study: CONFIG.study, session: '', pid: '', stage: '', cond: CONFIG.cond,
  ua: navigator.userAgent, start: new Date().toISOString(), code: '', spin: null,
  device: { touch: isTouch, w: innerWidth, h: innerHeight, dpr: devicePixelRatio || 1, lang: navigator.language, platform: navigator.platform || '' },
  params: { fixationMs: CONFIG.fixationMs, wordsMs: CONFIG.wordsMs, maxRtMs: CONFIG.maxRtMs, itiMs: CONFIG.itiMs, practice: CONFIG.practiceTrials, test: nTest, breakAfter: CONFIG.breakAfter, validRtMin: CONFIG.validRtMin, validRtMax: CONFIG.validRtMax, timeScale: ts },
  rows: [], summary: null, log: [], saved: {}
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
const r1 = x => (x === null || x === undefined) ? '' : Math.round(x * 10) / 10;

/* ---------- בניית הניסויים ---------- */
function buildTest() {
  const pairs = shuffle(PAIRS.slice()), trials = [];
  pairs.forEach((p, i) => {
    // חצי מהזוגות: איום למעלה + חץ על האיום, איום למטה + חץ על הניטרלי; החצי השני הפוך. כך כל זוג מופיע פעמיים ובשתי העמדות.
    const flip = i % 2 === 1;
    trials.push({ pair: i + 1, threat: p[0], neutral: p[1], threatPos: 'top', congruent: flip ? 0 : 1 });
    trials.push({ pair: i + 1, threat: p[0], neutral: p[1], threatPos: 'bottom', congruent: flip ? 1 : 0 });
  });
  // קיצור לבדיקות (?n=): שומר על איזון מדויק בין congruent ל-incongruent גם ברשימה קצרה.
  const half = Math.floor(Math.min(nTest, trials.length) / 2);
  const chosen = shuffle(trials.filter(t => t.congruent === 1)).slice(0, half).concat(shuffle(trials.filter(t => t.congruent === 0)).slice(0, half));
  shuffle(chosen);
  // כיוון החץ מאוזן: חצי שמאלה, חצי ימינה.
  const dirs = shuffle(chosen.map((_, i) => i % 2 ? 'L' : 'R'));
  chosen.forEach((t, i) => { t.probeDir = dirs[i]; t.probePos = t.congruent ? t.threatPos : (t.threatPos === 'top' ? 'bottom' : 'top'); t.practice = 0; });
  return chosen;
}
function buildPractice() {
  return shuffle(PRACTICE_PAIRS.slice()).slice(0, CONFIG.practiceTrials).map((p, i) => {
    const top = Math.random() < .5;
    return { pair: 'p' + (i + 1), threat: '', neutral: p[0] + '/' + p[1], wordTop: top ? p[0] : p[1], wordBottom: top ? p[1] : p[0], threatPos: '', congruent: '', probePos: Math.random() < .5 ? 'top' : 'bottom', probeDir: Math.random() < .5 ? 'L' : 'R', practice: 1 };
  });
}

/* ---------- מסכים ---------- */
function screenIntro() {
  return new Promise(resolve => {
    const s = show(`
      <h1>הדגמת dot-probe</h1>
      <p class="muted">סמינר חרדה חברתית, טראומה חברתית ו-EMA · ד"ר רועי אזולאי · אוניברסיטת בר-אילן</p>
      <p>זו המשימה הקלאסית שבה מודדים <b>הטיות קשב</b> (MacLeod, Mathews &amp; Tata, 1986). היא נמשכת כחמש דקות: תרגול קצר, ואחריו 64 ניסויים קצרים עם הפסקה באמצע. בסוף מוצגת התוצאה שלך, עם הסבר מה אפשר ללמוד ממנה ומה לא.</p>
      <p>התוצאה נשמרת <b>באופן אנונימי</b>, תחת קוד בן ארבע ספרות שאת בוחרת, ומשמשת לדיון בכיתה בלבד. זו לא בדיקה אבחנתית, ואין בה תוצאה "טובה" או "רעה".</p>
      <label for="code">בחרי קוד בן ארבע ספרות (וזכרי אותו, כדי לזהות את התוצאה שלך בכיתה)</label>
      <input type="text" id="code" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="off">
      <label for="spin">רשות: ציון ה-SPIN מהשאלון של השבוע שעבר (0 עד 68), אם את זוכרת אותו</label>
      <input type="number" id="spin" min="0" max="68" placeholder="">
      <p class="small" style="margin-top:14px">הכי נוח במחשב, עם מקשי החיצים. בטלפון זה עובד גם, עם שני כפתורים שיופיעו על המסך. ${isTouch ? 'זוהה כאן מסך מגע.' : 'זוהתה כאן מקלדת.'}</p>
      <div class="err" id="err"></div>
      <div class="btnrow"><button class="next" id="go">להמשיך</button></div>`);
    s.querySelector('#go').onclick = () => {
      const code = s.querySelector('#code').value.trim(), spin = s.querySelector('#spin').value.trim();
      if (!/^\d{4}$/.test(code)) { s.querySelector('#err').textContent = 'הקוד צריך להיות בדיוק ארבע ספרות.'; return; }
      if (spin !== '' && !(/^\d{1,2}$/.test(spin) && +spin <= 68)) { s.querySelector('#err').textContent = 'ציון SPIN הוא מספר שלם בין 0 ל-68 (או להשאיר ריק).'; return; }
      D.code = code; D.pid = 'S' + code; D.spin = spin === '' ? null : +spin;
      logEv('intro_done'); checkpoint('start'); resolve();
    };
  });
}
function screenInstructions() {
  return new Promise(resolve => {
    const keys = isTouch
      ? 'בטלפון: לוחצים על הכפתור שעליו מצויר אותו חץ.'
      : 'חץ שמאלה ◀ = המקש <span class="kbd">←</span> במקלדת. חץ ימינה ▶ = המקש <span class="kbd">→</span>. (אפשר גם ללחוץ על הכפתורים שעל המסך.)';
    const s = show(`
      <h2>מה רואים, ומה עושים</h2>
      <ol style="padding-right:22px;margin:0 0 14px">
        <li>במרכז המסך מופיע צלב <b>+</b>. מסתכלים עליו.</li>
        <li>אחריו מופיעות לרגע <b>שתי מילים</b>: אחת מעל הצלב ואחת מתחתיו.</li>
        <li>המילים נעלמות, ובמקום אחת מהן מופיע <b>חץ</b>: ◀ או ▶.</li>
        <li><b>התפקיד שלך:</b> להגיב לחץ מהר ככל האפשר, בלי לטעות. ${keys}</li>
      </ol>
      <div class="demo">
        <div class="box"><span class="m">+</span><em>שלב 1: צלב</em></div>
        <div class="box"><span class="t">בושה</span><span class="b">חלון</span><em>שלב 2: שתי מילים</em></div>
        <div class="box"><span class="pr">▶</span><em>שלב 3: חץ במקום אחת המילים</em></div>
      </div>
      <p style="margin-top:34px">לא צריך לקרוא את המילים ולא לזכור אותן. חשוב רק להגיב לחץ: מהר, ובלי טעויות. למה בכלל יש שם מילים? על זה נדבר בכיתה.</p>
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
  return `<div class="progress"><i style="width:${progress}%"></i></div>
    <div class="arena"><div class="slot top" id="top"></div><div class="slot mid" id="mid"></div><div class="slot bottom" id="bottom"></div></div>
    <div class="fb" id="fb"></div>
    <div class="resp dim" id="resp"><button type="button" data-r="L" aria-label="שמאלה">◀</button><button type="button" data-r="R" aria-label="ימינה">▶</button></div>
    <div class="hint">${isTouch ? 'הגיבי בכפתורים' : 'הגיבי במקשי החיצים ← → (או בכפתורים)'}</div>`;
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
    top.textContent = wTop; bottom.textContent = wBottom;
    await sleep(T(CONFIG.wordsMs));
    top.textContent = ''; bottom.textContent = ''; mid.textContent = '';
    const probeEl = t.probePos === 'top' ? top : bottom;
    probeEl.classList.add('probe'); probeEl.textContent = t.probeDir === 'L' ? '◀' : '▶';
    resp.classList.remove('dim');
    const r = await waitResponse(T(CONFIG.maxRtMs));
    probeEl.textContent = ''; probeEl.classList.remove('probe'); resp.classList.add('dim');
    const correct = r.resp === null ? 0 : (r.resp === t.probeDir ? 1 : 0);
    D.rows.push({ n: startIndex + i + 1, practice: t.practice, pair: t.pair, threat: t.threat, neutral: t.neutral, wordTop: wTop, wordBottom: wBottom, threatPos: t.threatPos, probePos: t.probePos, congruent: t.congruent, probeDir: t.probeDir, resp: r.resp, correct, rt: r.resp === null ? null : r.rt, timeout: r.resp === null ? 1 : 0, how: r.how });
    if (practice) { fb.textContent = r.resp === null ? 'מהר יותר' : (correct ? 'נכון' : 'לא נכון'); fb.className = 'fb ' + (correct ? 'ok' : 'bad'); await sleep(T(CONFIG.feedbackMs)); }
    await sleep(T(CONFIG.itiMs));
  }
}

/* ---------- תוצאה ---------- */
function summarize() {
  const test = D.rows.filter(r => !r.practice);
  const valid = test.filter(r => r.correct === 1 && r.rt !== null && r.rt >= CONFIG.validRtMin && r.rt <= CONFIG.validRtMax);
  const cong = valid.filter(r => r.congruent === 1).map(r => r.rt), inc = valid.filter(r => r.congruent === 0).map(r => r.rt);
  const S = {
    n_test: test.length, n_correct: test.filter(r => r.correct === 1).length, n_timeout: test.filter(r => r.timeout).length, n_valid: valid.length,
    acc: test.length ? test.filter(r => r.correct === 1).length / test.length : null,
    n_cong: cong.length, n_incong: inc.length,
    med_cong: median(cong), med_incong: median(inc), mean_cong: mean(cong), mean_incong: mean(inc), sd_valid: sd(valid.map(r => r.rt)),
    bias_med: (cong.length && inc.length) ? median(inc) - median(cong) : null,
    bias_mean: (cong.length && inc.length) ? mean(inc) - mean(cong) : null,
    // חלוקה זוגי/אי-זוגי לפי סדר ההצגה: שני אומדני הטיה לאותו אדם, בסיס לדיון על מהימנות
    bias_odd: null, bias_even: null,
    input: D.rows.some(r => r.how === 'button') ? (D.rows.some(r => r.how === 'key') ? 'mixed' : 'button') : 'key'
  };
  const half = (rows) => { const c = rows.filter(r => r.congruent === 1).map(r => r.rt), i = rows.filter(r => r.congruent === 0).map(r => r.rt); return (c.length >= 3 && i.length >= 3) ? median(i) - median(c) : null; };
  S.bias_odd = half(valid.filter(r => r.n % 2 === 1)); S.bias_even = half(valid.filter(r => r.n % 2 === 0));
  return S;
}
function interpret(S) {
  if (S.bias_med === null || S.n_valid < 24) return 'מעט מדי ניסויים תקינים כדי לחשב הטיה (צריך לפחות 24 תגובות נכונות בטווח הזמן).';
  const b = S.bias_med;
  if (Math.abs(b) < 15) return 'הפרש קטן מ-15 אלפיות שנייה: בטווח הרעש. אין כאן עדות להטיה לכיוון כלשהו.';
  if (b > 0) return 'תגובות מהירות יותר כשהחץ הופיע במקום מילת האיום החברתי: דפוס שמתואר בספרות כ"דריכות" (vigilance) לאיום. ' + (b >= 40 ? 'ההפרש בולט.' : 'ההפרש קטן.');
  return 'תגובות מהירות יותר כשהחץ הופיע במקום המילה הניטרלית: דפוס שמתואר בספרות כ"הימנעות" קשבית מאיום. ' + (b <= -40 ? 'ההפרש בולט.' : 'ההפרש קטן.');
}
function downloadJSON() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body()], { type: 'application/json' })); a.download = 'dotprobe_' + D.pid + '.json'; document.body.appendChild(a); a.click(); a.remove();
}
async function screenResults() {
  const S = D.summary = summarize();
  D.stage = 'complete';
  const maxRt = Math.max(S.med_cong || 0, S.med_incong || 0, 1), hC = Math.round(120 * (S.med_cong || 0) / maxRt), hI = Math.round(120 * (S.med_incong || 0) / maxRt);
  const s = show(`
    <h2>התוצאה שלך (קוד ${esc(D.pid)})</h2>
    <div class="bars">
      <div class="bar"><b>${S.med_cong === null ? '–' : Math.round(S.med_cong)} ms</b><i style="height:${hC}px"></i><span class="cap">חץ במקום מילת האיום</span></div>
      <div class="bar inc"><b>${S.med_incong === null ? '–' : Math.round(S.med_incong)} ms</b><i style="height:${hI}px"></i><span class="cap">חץ במקום המילה הניטרלית</span></div>
    </div>
    <p class="small" style="text-align:center">חציון זמן התגובה בניסויים התקינים (${S.n_valid} מתוך ${S.n_test}; דיוק ${S.acc === null ? '–' : Math.round(100 * S.acc)}%)</p>
    <div class="res">ציון הטיה: ${S.bias_med === null ? '–' : (S.bias_med > 0 ? '+' : '') + Math.round(S.bias_med)} ms</div>
    <p style="text-align:center">${interpret(S)}</p>
    <div class="card"><b>מה הציון אומר.</b> ציון ההטיה = זמן התגובה כשהחץ החליף את המילה הניטרלית פחות זמן התגובה כשהחץ החליף את מילת האיום. חיובי = הקשב היה כבר "שם", אצל מילת האיום; שלילי = הקשב התרחק ממנה; סביב אפס = אין הבדל.</div>
    <div class="card"><b>מה הציון לא יכול לומר.</b> זו מדידה אחת, של 64 ניסויים, במכשיר ובסביבה לא מבוקרים. ציוני dot-probe של אדם יחיד נוטים להשתנות הרבה ממדידה למדידה (מהימנות נמוכה), ולכן הם מתאימים להשוואות בין קבוצות ולא לאבחון של אדם. דוגמה אצלך: ההטיה בניסויים האי-זוגיים ${S.bias_odd === null ? 'לא חושבה' : (S.bias_odd > 0 ? '+' : '') + Math.round(S.bias_odd) + ' ms'}, ובזוגיים ${S.bias_even === null ? 'לא חושבה' : (S.bias_even > 0 ? '+' : '') + Math.round(S.bias_even) + ' ms'}. כמה הן דומות?</div>
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
    await screenResults();
  } catch (err) {
    console.error(err);
    show('<h2>משהו השתבש</h2><p class="err">' + esc(err && err.message || err) + '</p><p>אפשר לרענן את הדף ולהתחיל מחדש. שאלות: ' + esc(CONFIG.contactEmail) + '</p>');
  }
})();
})();
