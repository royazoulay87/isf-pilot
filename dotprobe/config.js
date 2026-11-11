// ---- הדגמת dot-probe לסמינר "חרדה חברתית, טראומה חברתית ו-EMA" (תשפ"ז) ----
const CONFIG = {
  // כתובת המקלט המשותף של המעבדה (Apps Script). מוזרקת בפריסה מ-isf-pilot/deploy_config.json.
  // ריק = בלי שליחה; בסוף מוצעת הורדת JSON (בדיקות מקומיות).
  endpoint: 'https://script.google.com/macros/s/AKfycbzA9xE25wi0LRvcUIWVWDrB_oZoxA_QqXt_KDwNGB_xEyrEVTBspEBf2s_cjrVCJtI6/exec',
  study: 'seminar_sad_2026',
  version: 'dotprobe_he_words_v1b_2026-11-11',
  cond: 'words_he_v1',
  // תזמון (אלפיות שנייה), לפי הפרוטוקול המקובל: צלב 500, זוג מילים 500, חץ עד תגובה.
  fixationMs: 500, wordsMs: 500, maxRtMs: 3000, itiMs: 500, feedbackMs: 500,
  practiceTrials: 8, testTrials: 64, breakAfter: 32,
  // ניסוי "תקין" לחישוב ההטיה: תגובה נכונה, ו-150 עד 2000 אלפיות שנייה.
  validRtMin: 150, validRtMax: 2000,
  timeScale: 1,
  contactEmail: 'royazoulaypsy@gmail.com'
};
