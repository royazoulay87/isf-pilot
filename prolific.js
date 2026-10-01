/* Shared participant entry and completion UI for the three ISF studies. */
(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validateID(value){
  const id=String(value||'').trim();
  if(!id) return 'Please enter your Prolific ID before continuing.';
  if(id.length>100||/\s/.test(id)) return 'Please copy your Prolific ID without spaces.';
  return null;
}
function questionHTML(value){
  return `<div class="prolific-entry"><h2>Your Prolific ID</h2><p><label for="prolificId"><strong>What is your Prolific ID?</strong></label></p><p id="prolificHint">Please copy and paste your participant ID from Prolific. If it is already filled in, check that it is correct before continuing.</p><input type="text" id="prolificId" name="PROLIFIC_PID" value="${esc(value||'')}" maxlength="100" autocomplete="off" autocapitalize="none" spellcheck="false" required aria-describedby="prolificHint"></div>`;
}
function completionDetails(config){
  let code=String(config.completionCode||'').trim(),url=String(config.completionUrl||'').trim();
  if(url){
    try{
      const parsed=new URL(url),urlCode=parsed.searchParams.get('cc')||'';
      if(parsed.protocol!=='https:'||!['app.prolific.com','app.prolific.co'].includes(parsed.hostname)||parsed.pathname!=='/submissions/complete'||(code&&code!==urlCode)) return null;
      code=code||urlCode;
    }catch(_){return null;}
  }
  if(!/^[A-Za-z0-9]{1,64}$/.test(code)) return null;
  return {code,url:url||'https://app.prolific.com/submissions/complete?cc='+encodeURIComponent(code)};
}
function completionHTML(config,saved){
  const details=completionDetails(config),ready=!!details&&saved===true;
  let message;
  if(!details) message='The completion code and return link will be added before this study opens on Prolific.';
  else if(saved!==true) message='Please finish saving your responses before returning to Prolific. If saving fails, use the retry or download options on this page.';
  else message='Click below to register your completion on Prolific. You can also copy the completion code and enter it there yourself.';
  return `<section class="prolific-card" aria-labelledby="prolificCompletionTitle"><h2 id="prolificCompletionTitle">Return to Prolific</h2><p>${message}</p><div class="prolific-code-label">Completion code</div><output class="prolific-code" aria-label="Completion code">${ready?esc(details.code):details?'Available after saving':'Not yet available'}</output><div class="prolific-actions">${ready?`<a class="prolific-return" href="${esc(details.url)}">Return to Prolific →</a>`:'<button type="button" class="prolific-return" disabled>Return to Prolific →</button>'}</div></section>`;
}
function renderCompletion(element,config,saved){if(element)element.innerHTML=completionHTML(config,saved);}
root.ISFProlific={validateID,questionHTML,completionDetails,completionHTML,renderCompletion};
})(typeof window!=='undefined'?window:globalThis);
