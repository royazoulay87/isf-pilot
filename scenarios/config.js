// ---- Run C: matched social scenarios (ISF 2026 pilot) configuration ----
const CONFIG = {
  // POST receiver URL (the hub's multitask Apps Script). Empty = no sending; a JSON download is offered on the last screen (local testing).
  endpoint: 'https://script.google.com/macros/s/AKfycbzA9xE25wi0LRvcUIWVWDrB_oZoxA_QqXt_KDwNGB_xEyrEVTBspEBf2s_cjrVCJtI6/exec',
  // Prolific completion URL; empty = thank-you page instead of a redirect.
  completionUrl: '',
  // Trait questionnaires, Cyberball structure (Roy, 30.9): four BEFORE the situations, three AFTER them (before the demographics).
  // Available: spin, bdi (BDI-II, 20 groups), bpni, fpes, phq9, npi16, soas (Sense of Absence Scale), lsas (fear matrix only).
  traitsBefore: ['spin','bdi','bpni','fpes'],
  traitsAfter: ['npi16','soas','lsas'],
  // Multiplies the minimum reading times (1 = real; 0.05 = fast testing).
  timeScale: 1,
  // true = every participant sees all 16 settings as ambiguous items first and then all 16 as clear versions (review mode; also ?debug=1&full=1). false = 8 + 8 design.
  allSettings: true,
  // Second part of the all-16 mode: 'story' = parallel story with different details (Option A, Roy 30.9) | 'mild' = same base, small changes.
  altSet: 'story',
  // Minimum seconds before Next is enabled on a scenario page (reading time floor); 0 = none.
  minReadSeconds: 8,
  // Force counterbalancing cells for testing (null = random): half 'X'|'Y' (X: H1 clear / H2 ambiguous), order 0-3 (version Latin-square row),
  // amb 0|1 (which four ambiguous settings get variant A), lvl 0|1 (high/low pattern).
  force: { half: null, order: null, amb: null, lvl: null },
  contactEmail: 'Cyberstatusegs@gmail.com'
};
