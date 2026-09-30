/*  CyberStatus v2 — data receiver (Google Apps Script → Google Sheet)
 *  1. Create a Google Sheet. Extensions → Apps Script. Paste this file. Save.
 *  2. Deploy → New deployment → Type: Web app → Execute as: Me → Who has access: Anyone → Deploy.
 *  3. Copy the Web app URL into config.js → endpoint.
 *  Each POST appends one row: timestamp, PROLIFIC_PID, stage, standing, acc, full JSON. Later stages overwrite nothing:
 *  keep the last row per PID+stage 'complete' when analysing.
 */
function doPost(e) {
  var lock = LockService.getScriptLock(); lock.tryLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('data') || ss.insertSheet('data');
    if (sh.getLastRow() === 0) sh.appendRow(['timestamp','pid','stage','standing','acc','json']);
    var d = JSON.parse(e.postData.contents);
    sh.appendRow([new Date(), d.pid || '', d.stage || '', d.standing || '', d.acc, e.postData.contents]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  } finally { lock.releaseLock(); }
}
function doGet() { return ContentService.createTextOutput('CyberStatus receiver up'); }
