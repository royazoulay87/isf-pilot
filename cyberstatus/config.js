// ---- CyberStatus v3 (ISF 2026 pilot) configuration ----
const CONFIG = {
  // Where data is sent (POST JSON; receiver contract = backend/google_apps_script_multitask.gs of the pilot hub).
  // Leave empty to skip sending and offer a JSON download at the end (local testing).
  endpoint: 'https://script.google.com/macros/s/AKfycbzA9xE25wi0LRvcUIWVWDrB_oZoxA_QqXt_KDwNGB_xEyrEVTBspEBf2s_cjrVCJtI6/exec',
  // Prolific completion settings. Empty values leave the return button disabled.
  completionUrl: '',
  completionCode: 'C1PI6LAQ', // Add the Prolific code here (or through deploy_config.json).
  // Multiply every "waiting for the other members" delay, the reading minimums and the answer timers (1 = real timing; 0.1 = fast testing).
  timeScale: 1,
  // Trait questionnaires BEFORE the task (right after consent) and AFTER it (before the demographics). Roy, 30.9.2026.
  // Available: spin, fpes, bdi (BDI-II, 20 groups), bpni, npi16, lsas (fear matrix only), soas (Sense of Absence Scale); bfne, phq9 exist but are not administered.
  traitsBefore: ['spin','fpes','bdi','bpni'],
  traitsAfter: ['npi16','lsas','soas'],
  // Force a cell for testing (null = random 50/50 on each factor): standing 'high'|'low', acc 1|0
  force: { standing: null, acc: null },
  // Seconds allowed for each ranking choice (vote for the top, staircase picks); afterwards the system chooses and the choice is flagged.
  rankChoiceSeconds: 30,
  connChoiceSeconds: 30,   // Extended choice windows, Roy 2.10.2026.
  // Automatic transitions for task/instruction screens. State, emotion and distress
  // questionnaires are participant-paced at every administration (Roy, 2.10.2026).
  gameTimers: { read: 20, result: 15, outcome: 25, wish: 20, slider: 20, avatar: 40, rankInfo: 60, connInfo: 45 },
  contactEmail: 'Cyberstatusegs@gmail.com'
};
