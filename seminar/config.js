// ---- שאלון קצר לשיעור "פרשנות, שיפוט וזיכרון" (סמינר חרדה חברתית וטראומה חברתית, תשפ"ז) ----
const CONFIG = {
  // כתובת המקלט המשותף של המעבדה (Apps Script). מוזרקת בפריסה מ-isf-pilot/deploy_config.json.
  // ריק = בלי שליחה; בסוף מוצעת הורדת JSON (בדיקות מקומיות).
  endpoint: 'https://script.google.com/macros/s/AKfycbzA9xE25wi0LRvcUIWVWDrB_oZoxA_QqXt_KDwNGB_xEyrEVTBspEBf2s_cjrVCJtI6/exec',
  // המקלט מקבל רק משימות שברשימת RAW_TASKS שלו. כדי לא לשנות את המקלט, השאלון נשמר תחת המשימה 'dotprobe'
  // (הטאב של הסמינר), ומזוהה לפי version ו-cond. כל התשובות נמצאות תחת rows, שאינו נפרש לעמודות.
  task: 'dotprobe',
  study: 'seminar_sad_2026',
  version: 'seminarq_v1_2026-11-25',
  cond: 'seminar_q',
  contactEmail: 'royazoulaypsy@gmail.com'
};
