/*  Run C (scenarios) — single-task data receiver (Google Apps Script → Google Sheet). The pilot hub uses its multitask receiver
 *  (google_apps_script_multitask.gs); this file is the fallback with the same contract: every POST is the whole data object with
 *  top-level task ('scenarios'), pid, stage ('consent','traits','amb','clear','complete'), cond, version, study, session, ua.
 *  1. Create a Google Sheet → Extensions → Apps Script → paste → Deploy → Web app (execute as me, anyone) → copy the URL into config.js endpoint.
 *  Keep the last 'complete' row per pid when analysing.
 */
function doPost(e) {
  var lock = LockService.getScriptLock(); lock.tryLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('data') || ss.insertSheet('data');
    if (sh.getLastRow() === 0) sh.appendRow(['timestamp','task','pid','stage','cond','version','json']);
    var d = JSON.parse(e.postData.contents);
    sh.appendRow([new Date(), d.task || '', d.pid || '', d.stage || '', JSON.stringify(d.cond || {}), d.version || '', e.postData.contents]);
    return ContentService.createTextOutput('ok');
  } catch (err) { return ContentService.createTextOutput('error: ' + err); }
  finally { lock.releaseLock(); }
}
function doGet() { return ContentService.createTextOutput('scenarios receiver up'); }
