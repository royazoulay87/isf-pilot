/* ISF pilot receiver v10, 2026-10-01.
 * Every request is locked and read back before acknowledgement. Batch requests
 * preserve each original JSON body. Raw records are keyed by their body digest;
 * readable records and throws are upserted by run/throw identifiers so a retry
 * after a partial write cannot create a second readable row.
 * Deploy as a NEW VERSION of the EXISTING web-app deployment (same URL/access).
 */
var CHUNK = 45000;                                                   // characters per cell (Sheets allows 50,000)
var WIDE_SKIP = { screens: 1, log: 1, visibility: 1, pages: 1, rows: 1 };   // per-screen / per-event logs stay in the raw JSON (rows → events tab)
var TEST_PREFIXES = ['TEST_', 'AI_', 'PERSONA'];                    // pids deleted by cleanupTests() (plus rows with an empty pid = manual test runs)
var RAW_TASKS = ['scenarios', 'cyberstatus', 'cyberball'];
var PROLIFIC_PID = /^[0-9a-f]{24}$/;
var EVENTS_TAB = false;                                              // true = also write the old one-row-per-event grid (cyberball_events)
var CB_SHARED = { timestamp: 1, ms_since_start: 1, condition: 1, condition_label: 1, pid: 1, participant_name: 1, participant_color: 1, phase: 1, event: 1, round: 1, timepoint: 1, for_game: 1 };
var CB_TRAIT_EVENTS = { spin: 1, bdi: 1, bpni: 1, fpes: 1, npi16: 1, soas: 1, lsas: 1 };          // already in the wide row as traits_* (d.traits)
var CB_SKIP_EVENTS = { throw: 1, practice_throw: 1, screen_continue: 1, text_seen: 1, consent: 1, name: 1, meet_seen: 1, sentences_shown: 1, traits_intro: 1, study_complete: 1 };

function doPost(e) {
  if (!e || !e.postData) return ContentService.createTextOutput('error: POST body required');
  var raw = e.postData.contents || '', bodies;
  try {
    var envelope = JSON.parse(raw);
    bodies = envelope.isf_batch === 1 ? envelope.records : [raw];
    if (!Array.isArray(bodies) || !bodies.length || bodies.length > 8) throw new Error('invalid batch');
    bodies.forEach(function (body) { normalizeRecord(body); }); // validate before any writes
  } catch (err) { return ContentService.createTextOutput('error: invalid request: ' + err); }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return ContentService.createTextOutput('error: busy, retry');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    bodies.forEach(function (body) { storeRecord(ss, body); });
    return ContentService.createTextOutput('ok verified ' + bodies.length);
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  } finally { lock.releaseLock(); }
}
function normalizeRecord(raw) {
  if (typeof raw !== 'string' || !raw.length) throw new Error('empty record');
  var d = JSON.parse(raw);
  if (!d || typeof d !== 'object') throw new Error('record must be an object');
  if (d.meta && Array.isArray(d.rows)) {
    d.task = d.task || 'cyberball'; d.stage = d.stage || 'complete';
    d.pid = d.meta.pid || ''; d.cond = d.meta.condition || '';
    d.study = d.meta.study || ''; d.session = d.meta.session || ''; d.version = d.meta.version || ''; d.ua = d.meta.ua || '';
  }
  if (RAW_TASKS.indexOf(d.task) < 0 || typeof d.stage !== 'string' || !d.stage) throw new Error('invalid task/stage');
  return d;
}
function runId(task, d, fallback) {
  var m = d.meta || d;
  return md5hex(JSON.stringify([task, m.pid || '', m.study || '', m.session || '', m.start || fallback]));
}
function storeRecord(ss, raw) {
  var d = normalizeRecord(raw), task = d.task, md5 = md5hex(raw), id = runId(task, d, md5);
  var sh = ss.getSheetByName(task) || ss.insertSheet(task);
  var chunks = [], offset = 0;
  while (offset < raw.length) { var end = Math.min(offset + CHUNK, raw.length); if (end < raw.length && /[\uD800-\uDBFF]/.test(raw.charAt(end - 1))) end--; chunks.push(raw.slice(offset, end)); offset = end; }
  var nChunks = chunks.length, cond = d.cond;
  if (cond !== null && typeof cond === 'object') cond = JSON.stringify(cond);
  var rec = {timestamp: new Date(), pid: d.pid || '', stage: d.stage, cond: cond || '', study: d.study || '', session: d.session || '',
    version: d.version || '', ua: String(d.ua || '').slice(0, 200), json_len: raw.length};
  for (var c = 0; c < nChunks; c++) rec['json_' + (c + 1)] = chunks[c];
  rec.n_chunks = nChunks; rec.md5 = md5; rec.ok = ''; rec.wide = ''; rec.run_id = id;
  var prev = findRecent(sh, md5), r;
  if (prev && readRawRow(sh, prev.row) === raw) r = prev.row;
  else r = upsertAlignedMany(sh, [rec], 'md5')[0];
  SpreadsheetApp.flush();
  if (readRawRow(sh, r) !== raw) { setCell(sh, r, 'ok', false); throw new Error('raw verification failed, retry'); }
  setCell(sh, r, 'ok', true);
  if (d.stage === 'complete') { writeWide(ss, task, d, id); setCell(sh, r, 'wide', true); }
  SpreadsheetApp.flush();
}

/* ---------- small helpers ---------- */
function md5hex(s) { var b = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s, Utilities.Charset.UTF_8), h = ''; for (var i = 0; i < b.length; i++) { var v = (b[i] + 256) % 256; h += (v < 16 ? '0' : '') + v.toString(16); } return h; }
function headerOf(sh) { var m = sh.getLastColumn(); return m ? sh.getRange(1, 1, 1, m).getValues()[0].map(function (x) { return String(x); }) : []; }
function colOf(header, name) { for (var i = 0; i < header.length; i++) if (header[i] === name) return i; return -1; }
function jsonCols(header) { var cols = []; for (var i = 0; i < header.length; i++) { var m = /^json_(\d+)$/.exec(header[i]); if (m) cols.push({ i: i, n: +m[1] }); } cols.sort(function (a, b) { return a.n - b.n; }); return cols; }
function ensureCols(sh, n) { if (n > sh.getMaxColumns()) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns()); }
function ensureRows(sh, n) { if (n > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), n - sh.getMaxRows() + 100); }
function setCell(sh, r, name, v) { var c = colOf(headerOf(sh), name); if (c >= 0) sh.getRange(r, c + 1).setValue(v); }
function colLetter(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }
function needsText(v) {                                               // strings that Sheets would turn into a number, date, boolean or formula
  return typeof v === 'string' && v.length > 0 && (/^[\s'=+\-$.\d]/.test(v) || /^(true|false)$/i.test(v) || /^[a-z]{3,9}\.? +\d/i.test(v));
}
function runsOf(r0, c0, matrix, test) {                               // A1 ranges (vertical runs) of the cells where test(value) holds
  var refs = [], nc = matrix.length ? matrix[0].length : 0;
  for (var c = 0; c < nc; c++) {
    var start = -1;
    for (var r = 0; r <= matrix.length; r++) {
      var hit = r < matrix.length && test(matrix[r][c]);
      if (hit && start < 0) start = r;
      if (!hit && start >= 0) { var L = colLetter(c0 + c); refs.push(L + (r0 + start) + (r - 1 > start ? ':' + L + (r0 + r - 1) : '')); start = -1; }
    }
  }
  return refs;
}
var RESET_FORMATS = false;                                           // true only during maintenance (rebuild / verify), where stale '@' cells must be reset
function textFormatCells(sh, r0, c0, matrix) {                        // before setValues: '@' on risky strings (and, in maintenance, General + date format on the rest)
  var nc = matrix.length ? matrix[0].length : 0; if (!nc) return;
  if (RESET_FORMATS) { sh.getRange(r0, c0, matrix.length, nc).setNumberFormat('General');
    var dt = runsOf(r0, c0, matrix, function (v) { return v instanceof Date; });
    for (var j = 0; j < dt.length; j += 500) sh.getRangeList(dt.slice(j, j + 500)).setNumberFormat('yyyy-mm-dd hh:mm:ss'); }
  var tx = runsOf(r0, c0, matrix, needsText);
  for (var i = 0; i < tx.length; i += 500) sh.getRangeList(tx.slice(i, i + 500)).setNumberFormat('@');
}
function sheetInputs(matrix) { return matrix.map(function (row) { return row.map(function (v) { return typeof v === 'string' && /^[=']/.test(v) ? "'" + v : v; }); }); }
function isTrue(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }
function isTestPid(p) { p = String(p || ''); if (p === '') return true; for (var i = 0; i < TEST_PREFIXES.length; i++) if (p.indexOf(TEST_PREFIXES[i]) === 0) return true; return false; }   // '' = a run without a Prolific id (manual test)
function readRawRow(sh, r) {                                          // the JSON text of one raw row (json_1..json_n in numeric order)
  var h = headerOf(sh), cols = jsonCols(h); if (!cols.length) return '';
  var vals = sh.getRange(r, 1, 1, h.length).getValues()[0], s = '';
  for (var j = 0; j < cols.length; j++) { var v = vals[cols[j].i]; s += (v === null || v === undefined) ? '' : String(v); }
  return s;
}
function findRecent(sh, md5) { // full history: offline retries can be older than the last 60 rows
  var n = sh.getLastRow(), h = headerOf(sh), cm = colOf(h, 'md5');
  if (n < 2 || cm < 0) return null;
  var vals = sh.getRange(2, cm + 1, n - 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]) === md5) return {row: i + 2};
  return null;
}
// Caller holds the script lock. Each group is verified, including retry repairs.
function upsertAlignedMany(sh, recs, key, legacyRows) {
  if (!recs.length) return [];
  var h = headerOf(sh), idx = {}, added = false;
  h.forEach(function (k, i) { idx[k] = i; });
  recs.forEach(function (rec) { for (var k in rec) if (!(k in idx)) { idx[k] = h.length; h.push(k); added = true; } });
  if (added) { ensureCols(sh, h.length); sh.getRange(1, 1, 1, h.length).setValues([h]); }
  var last = sh.getLastRow(), byKey = {}, targets = [], next = Math.max(2, last + 1);
  if (last >= 2) sh.getRange(2, idx[key] + 1, last - 1, 1).getValues().forEach(function (v, i) { if (v[0] !== '') byKey[String(v[0])] = i + 2; });
  recs.forEach(function (rec, i) {
    var k = String(rec[key]), r = byKey[k] || (legacyRows && legacyRows[i]) || next++;
    byKey[k] = r;
    var row = h.map(function (name) { return rec[name] === undefined || rec[name] === null ? '' : rec[name]; });
    targets.push({r: r, row: row, original: i});
  });
  targets.sort(function (a, b) { return a.r - b.r; });
  var result = [];
  for (var i = 0; i < targets.length;) {
    var start = targets[i].r, matrix = [targets[i].row]; result[targets[i].original] = targets[i].r; i++;
    while (i < targets.length && targets[i].r === start + matrix.length) { matrix.push(targets[i].row); result[targets[i].original] = targets[i].r; i++; }
    ensureRows(sh, start + matrix.length - 1);
    var range = sh.getRange(start, 1, matrix.length, h.length);
    range.setNumberFormat('General'); textFormatCells(sh, start, 1, matrix);
    // Every JSON chunk is text, irrespective of its first character.
    jsonCols(h).forEach(function (c) { sh.getRange(start, c.i + 1, matrix.length, 1).setNumberFormat('@'); });
    range.setValues(sheetInputs(matrix)); SpreadsheetApp.flush();
    var actual = range.getValues();
    for (var r = 0; r < matrix.length; r++) for (var c = 0; c < h.length; c++) {
      var a = actual[r][c], b = matrix[r][c];
      if (a instanceof Date && b instanceof Date ? a.getTime() !== b.getTime() : a !== b) throw new Error('verification failed: ' + sh.getName() + ' row ' + (start + r) + ' column ' + h[c]);
    }
  }
  return result;
}
function legacyWideRow(sh, task, d) {
  var h = headerOf(sh), n = sh.getLastRow(), meta = d.meta || d, cp = colOf(h, task === 'cyberball' ? 'meta_pid' : 'pid'), cs = colOf(h, task === 'cyberball' ? 'meta_start' : 'start'), ck = colOf(h, 'run_id');
  if (n < 2 || cp < 0 || cs < 0 || !meta.start) return 0;
  var p = sh.getRange(2, cp + 1, n - 1, 1).getValues(), s = sh.getRange(2, cs + 1, n - 1, 1).getValues(), keys = ck < 0 ? null : sh.getRange(2, ck + 1, n - 1, 1).getValues();
  for (var i = 0; i < n - 1; i++) if ((!keys || !keys[i][0]) && String(p[i][0]) === String(meta.pid || '') && String(s[i][0]) === meta.start) return i + 2;
  return 0;
}

/* ---------- aligned writers (header in row 1; new keys appended at the end; risky strings written as text) ---------- */
function appendAligned(sh, rec) {
  var header = headerOf(sh), idx = {}; for (var i = 0; i < header.length; i++) if (header[i] !== '') idx[header[i]] = i;
  var added = false; for (var k in rec) if (!(k in idx)) { idx[k] = header.length; header.push(k); added = true; }
  if (added) { ensureCols(sh, header.length); sh.getRange(1, 1, 1, header.length).setValues([header]); }
  var row = []; for (var c = 0; c < header.length; c++) row.push(''); for (var k2 in rec) row[idx[k2]] = rec[k2];
  var r = sh.getLastRow() + 1; ensureRows(sh, r);
  textFormatCells(sh, r, 1, [row]);
  sh.getRange(r, 1, 1, header.length).setValues([row]);
  return r;
}
function appendAlignedMany(sh, recs) {                      // many records in one setValues
  if (!recs.length) return;
  var header = headerOf(sh), idx = {}; for (var i = 0; i < header.length; i++) if (header[i] !== '') idx[header[i]] = i;
  var added = false;
  for (var r = 0; r < recs.length; r++) for (var k in recs[r]) if (!(k in idx)) { idx[k] = header.length; header.push(k); added = true; }
  if (added) { ensureCols(sh, header.length); sh.getRange(1, 1, 1, header.length).setValues([header]); }
  var matrix = [];
  for (var r2 = 0; r2 < recs.length; r2++) { var row = []; for (var c = 0; c < header.length; c++) row.push(''); for (var k2 in recs[r2]) row[idx[k2]] = recs[r2][k2]; matrix.push(row); }
  var r0 = sh.getLastRow() + 1; ensureRows(sh, r0 + matrix.length - 1);
  textFormatCells(sh, r0, 1, matrix);
  sh.getRange(r0, 1, matrix.length, header.length).setValues(matrix);
}

/* ---------- wide / events tabs ---------- */
function flatten(obj, prefix, out) {
  for (var k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    if (!prefix && WIDE_SKIP[k]) continue;
    var v = obj[k], key = prefix + k;
    if (v === null || v === undefined) { out[key] = ''; }
    else if (Array.isArray(v)) {
      if (v.length && typeof v[0] === 'object' && v[0] !== null) { for (var i = 0; i < v.length; i++) flatten(v[i], key + (i + 1) + '_', out); }
      else { for (var j = 0; j < v.length; j++) out[key + '_' + (j + 1)] = (v[j] === null || typeof v[j] === 'object') ? JSON.stringify(v[j]) : v[j]; }
    }
    else if (typeof v === 'object') { flatten(v, key + '_', out); }
    else { out[key] = v; }
  }
  return out;
}
function cyberballWideRow(d, now) {                                  // one row per participant: meta/participant/traits/config + every answer as <event>_<timepoint>_<field>
  var rec = {}; flatten({ meta: d.meta || {}, participant: d.participant || {}, traits: d.traits || {}, config: d.config || {} }, '', rec);
  var rows = d.rows || [], seen = {}, nThrows = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i], ev = r.event; if (ev === 'throw') nThrows++;
    if (!ev || CB_SKIP_EVENTS[ev] || CB_TRAIT_EVENTS[ev]) continue;
    var tag = r.timepoint ? String(r.timepoint) : ((r.round !== undefined && r.round !== '' && r.round !== null) ? 'game' + r.round : '');
    var base = ev + (tag ? '_' + tag : '');
    seen[base] = (seen[base] || 0) + 1; if (seen[base] > 1) base += '_' + seen[base];
    for (var k in r) {
      if (CB_SHARED[k]) continue;
      var name = (k.indexOf(ev + '_') === 0) ? k.slice(ev.length + 1) : k;       // status_3 → status_post_game1_3
      var v = r[k]; rec[base + '_' + name] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
    }
  }
  rec.n_throws = nThrows; rec.n_rows = rows.length; rec.received_at = now;
  return rec;
}
function cyberballThrowRows(d) {                                      // one row per throw (all 120: who threw to whom; ms_to_throw only for the participant's own throws)
  var pid = (d.meta || {}).pid || '', cond = (d.meta || {}).condition || '', rows = d.rows || [], out = [];
  for (var i = 0; i < rows.length; i++) { var r = rows[i]; if (r.event !== 'throw') continue;
    out.push({ pid: pid, condition: cond, game: r.round, throw_no: r.throw_number, from: r.sender, to: r.receiver, success: r.success,
               ms_to_throw: (r.source === 'participant' && r.turn_ms !== undefined && r.turn_ms !== '') ? r.turn_ms : '' }); }
  return out;
}
function writeWide(ss, task, d, id) {
  var now = new Date().toISOString(); id = id || runId(task, d, md5hex(JSON.stringify(d)));
  var wide = ss.getSheetByName(task + '_wide') || ss.insertSheet(task + '_wide');
  var legacy = legacyWideRow(wide, task, d);
  var rec = task === 'cyberball' ? cyberballWideRow(d, now) : flatten(d, '', {});
  rec.received_at = now; rec.run_id = id;
  if (task !== 'cyberball') { upsertAlignedMany(wide, [rec], 'run_id', [legacy]); return; }
  var throws = ss.getSheetByName('cyberball_throws') || ss.insertSheet('cyberball_throws'), rows = cyberballThrowRows(d), old = {};
  if (legacy && throws.getLastRow() >= 2) {
    var h = headerOf(throws), vals = throws.getRange(2, 1, throws.getLastRow() - 1, h.length).getValues();
    vals.forEach(function (r, i) { if (r[colOf(h, 'pid')] === (d.meta.pid || '') && (colOf(h, 'run_id') < 0 || !r[colOf(h, 'run_id')])) old[r[colOf(h, 'game')] + ':' + r[colOf(h, 'throw_no')]] = i + 2; });
  }
  rows.forEach(function (r) { r.run_id = id; r.throw_id = id + ':' + r.game + ':' + r.throw_no; });
  upsertAlignedMany(throws, rows, 'throw_id', rows.map(function (r) { return old[r.game + ':' + r.throw_no] || 0; }));
  upsertAlignedMany(wide, [rec], 'run_id', [legacy]);
}

/* ---------- utilities (run from the editor; maintenance() runs them all) ---------- */
function maintenanceSafe() {                                          // repair + verify + rebuild; nothing is deleted
  RESET_FORMATS = true;
  var log = [].concat(repairRawHeaders(), verifyRaw());
  rebuildWide(); log.push('rebuildWide: done');
  Logger.log(log.join('\n')); return log;
}
function maintenance() {                                              // the same plus cleanupTests() (deletes TEST_/AI_/PERSONA rows)
  RESET_FORMATS = true;
  var log = [].concat(repairRawHeaders(), verifyRaw(), cleanupTests());
  rebuildWide(); log.push('rebuildWide: done');
  Logger.log(log.join('\n')); return log;
}
function repairRawHeaders() {                                         // labels unlabeled data columns in the raw tabs as json_k (v2 left the fourth chunk unlabeled)
  var ss = SpreadsheetApp.getActiveSpreadsheet(), log = [];
  RAW_TASKS.forEach(function (t) {
    var sh = ss.getSheetByName(t); if (!sh || sh.getLastRow() < 2) return;
    var h = headerOf(sh), maxJ = 0, changed = false; jsonCols(h).forEach(function (c) { if (c.n > maxJ) maxJ = c.n; });
    for (var i = 0; i < h.length; i++) {
      if (h[i] !== '') continue;
      var col = sh.getRange(2, i + 1, sh.getLastRow() - 1, 1).getValues(), has = false;
      for (var r = 0; r < col.length; r++) if (col[r][0] !== '' && col[r][0] !== null) { has = true; break; }
      if (has) { maxJ++; h[i] = 'json_' + maxJ; changed = true; log.push(t + ': column ' + (i + 1) + ' labeled json_' + maxJ); }
    }
    if (changed) sh.getRange(1, 1, 1, h.length).setValues([h]);
  });
  if (!log.length) log.push('repairRawHeaders: nothing to repair');
  return log;
}
function verifyRaw() {                                                // fills n_chunks / md5 / ok for raw rows not yet verified; reports incomplete records
  var ss = SpreadsheetApp.getActiveSpreadsheet(), log = [];
  RAW_TASKS.forEach(function (t) {
    var sh = ss.getSheetByName(t); if (!sh || sh.getLastRow() < 2) return;
    var h = headerOf(sh), need = ['n_chunks', 'md5', 'ok'].filter(function (k) { return colOf(h, k) < 0; });
    if (need.length) { h = h.concat(need); ensureCols(sh, h.length); sh.getRange(1, 1, 1, h.length).setValues([h]); }
    var cols = jsonCols(h), cl = colOf(h, 'json_len'), cn = colOf(h, 'n_chunks'), cm = colOf(h, 'md5'), co = colOf(h, 'ok'), n = sh.getLastRow(), bad = 0, checked = 0;
    var oks = sh.getRange(2, co + 1, n - 1, 1).getValues();
    for (var r = 2; r <= n; r++) {
      if (oks[r - 2][0] === true) continue;                           // boolean only: a text "TRUE" left by v3/v4 is rewritten as a boolean
      var vals = sh.getRange(r, 1, 1, h.length).getValues()[0], raw = '', k = 0;
      for (var j = 0; j < cols.length; j++) { var v = vals[cols[j].i]; if (v !== '' && v !== null && v !== undefined) { raw += String(v); k++; } }
      var ok = raw.length === Number(vals[cl]); if (ok) { try { JSON.parse(raw); } catch (e) { ok = false; } }
      if (!ok) bad++; checked++;
      var cells = [[k, md5hex(raw), ok]]; textFormatCells(sh, r, cn + 1, cells); sh.getRange(r, cn + 1, 1, 3).setValues(cells);
    }
    log.push(t + ': ' + checked + ' rows verified, ' + bad + ' incomplete');
  });
  return log;
}
function cleanupTests() {                                             // deletes rows whose pid starts with a TEST_PREFIXES entry (raw, wide and events tabs) and the 'unknown' tab
  var ss = SpreadsheetApp.getActiveSpreadsheet(), log = [];
  var u = ss.getSheetByName('unknown'); if (u) { ss.deleteSheet(u); log.push('deleted tab unknown'); }
  var g = ss.getSheetByName('גיליון1'); if (g && g.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(g);
  ss.getSheets().forEach(function (sh) {
    var n = sh.getLastRow(); if (n < 2 || !sh.getLastColumn()) return;
    var h = headerOf(sh), col = -1; ['pid', 'pid_meta', 'meta_pid'].forEach(function (nm) { if (col < 0) col = colOf(h, nm); }); if (col < 0) return;
    var vals = sh.getRange(2, col + 1, n - 1, 1).getValues(), del = [];
    for (var r = vals.length - 1; r >= 0; r--) if (isTestPid(vals[r][0])) del.push(r + 2);   // bottom-up
    var i = 0; while (i < del.length) { var end = del[i], start = end; while (i + 1 < del.length && del[i + 1] === start - 1) { i++; start = del[i]; } sh.deleteRows(start, end - start + 1); i++; }
    if (del.length) log.push(sh.getName() + ': deleted ' + del.length + ' test rows');
  });
  if (!log.length) log.push('cleanupTests: nothing to delete');
  return log;
}
function forEachRawRecord(sh, fn) {                                   // fn({pid, stage, obj, row}) for every raw row, read in batches of 20 rows
  var n = sh.getLastRow(); if (n < 2) return;
  var h = headerOf(sh), cols = jsonCols(h);
  for (var r = 2; r <= n; r += 20) {
    var cnt = Math.min(20, n - r + 1), vals = sh.getRange(r, 1, cnt, h.length).getValues();
    for (var i = 0; i < cnt; i++) {
      var raw = ''; for (var j = 0; j < cols.length; j++) { var v = vals[i][cols[j].i]; raw += (v === null || v === undefined) ? '' : String(v); }
      var obj = null; try { obj = JSON.parse(raw); } catch (e) { }
      fn({ pid: vals[i][1], stage: vals[i][2], obj: obj, row: r + i });
    }
  }
}
function rebuildWide() {                                              // regenerates the wide/events tabs from the raw tabs
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['scenarios_wide', 'cyberstatus_wide', 'cyberball_wide', 'cyberball_throws', 'cyberball_events'].forEach(function (nm) { var s = ss.getSheetByName(nm); if (s) ss.deleteSheet(s); });
  RAW_TASKS.forEach(function (task) {
    var sh = ss.getSheetByName(task); if (!sh) return;
    var cw = colOf(headerOf(sh), 'wide');
    forEachRawRecord(sh, function (rec) { if (rec.obj && (rec.stage === 'complete')) { writeWide(ss, task, rec.obj); if (cw >= 0) sh.getRange(rec.row, cw + 1).setValue(true); } });
  });
}

/* GET = health check + live counts per tab (open the /exec URL in a browser during the run). Add ?task=cyberball to restrict. */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var want = (e && e.parameter && e.parameter.task) ? String(e.parameter.task) : null;
  var out = ['isf-pilot receiver v10 up  ' + new Date().toISOString(), ''];
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s], name = sh.getName();
    if (want && name.indexOf(want) !== 0) continue;
    var n = sh.getLastRow();
    if (n < 2) { out.push(name + ': 0 rows'); continue; }
    var h = headerOf(sh);
    if (h[2] !== 'stage') { out.push(name + ': ' + (n - 1) + ' rows, ' + sh.getLastColumn() + ' columns'); continue; }
    var vals = sh.getRange(2, 2, n - 1, 2).getValues(), co = colOf(h, 'ok'), oks = co >= 0 ? sh.getRange(2, co + 1, n - 1, 1).getValues() : null;
    var cw = colOf(h, 'wide'), wds = cw >= 0 ? sh.getRange(2, cw + 1, n - 1, 1).getValues() : null;
    var wideSheet = ss.getSheetByName(name + '_wide'), readable = {};
    if (wideSheet && wideSheet.getLastRow() >= 2) {
      var wh = headerOf(wideSheet), wk = colOf(wh, 'run_id'), wp = colOf(wh, name === 'cyberball' ? 'meta_pid' : 'pid'), wstart = colOf(wh, name === 'cyberball' ? 'meta_start' : 'start');
      var wvals = wideSheet.getRange(2, 1, wideSheet.getLastRow() - 1, wh.length).getValues();
      wvals.forEach(function (w) { if (wk >= 0 && w[wk]) readable[String(w[wk])] = 1; if (wp >= 0 && wstart >= 0) readable['legacy:' + w[wp] + ':' + w[wstart]] = 1; });
    }
    var rawIds = colOf(h, 'run_id') >= 0 ? sh.getRange(2, colOf(h, 'run_id') + 1, n - 1, 1).getValues() : null;
    var pids = {}, stages = {}, completePids = {}, notOk = 0, unverified = 0, fast = 0, noWide = 0;
    for (var r = 0; r < vals.length; r++) {
      var pid = String(vals[r][0]), st = String(vals[r][1]); pids[pid] = 1; stages[st] = (stages[st] || 0) + 1; if (st === 'complete') { completePids[pid] = 1; var rid = rawIds && rawIds[r][0]; if (!rid || !readable[rid]) { var rd = JSON.parse(readRawRow(sh, r + 2)), rm = rd.meta || rd; if (!readable['legacy:' + pid + ':' + rm.start]) noWide++; } }
      if (oks) { var ov = oks[r][0]; if (ov === false || String(ov).toUpperCase() === 'FALSE') notOk++; else if (String(ov) === 'fast') fast++; else if (!isTrue(ov)) unverified++; } else unverified++;
    }
    var test = 0, odd = 0; for (var p in pids) { if (isTestPid(p)) test++; else if (!PROLIFIC_PID.test(p)) odd++; }
    var stageStr = Object.keys(stages).sort().map(function (k) { return k + '=' + stages[k]; }).join(', ');
    out.push(name + ': ' + (n - 1) + ' rows, ' + Object.keys(pids).length + ' distinct pids (' + test + ' test, ' + odd + ' not Prolific-shaped), ' +
             Object.keys(completePids).length + ' complete (' + noWide + ' without readable row), ' + notOk + ' incomplete records, ' + unverified + ' unverified, ' + fast + ' fast checkpoints  [' + stageStr + ']');
  }
  return ContentService.createTextOutput(out.join('\n'));
}
