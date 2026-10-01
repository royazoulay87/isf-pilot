// ---- CyberStatus v3 (ISF 2026 pilot) configuration ----
const CONFIG = {
  // Where data is sent (POST JSON; receiver contract = backend/google_apps_script_multitask.gs of the pilot hub).
  // Leave empty to skip sending and offer a JSON download at the end (local testing).
  endpoint: 'https://script.google.com/macros/s/AKfycbzA9xE25wi0LRvcUIWVWDrB_oZoxA_QqXt_KDwNGB_xEyrEVTBspEBf2s_cjrVCJtI6/exec',
  // Prolific completion settings. Empty values leave the return button disabled.
  completionUrl: '',
  completionCode: '', // Add the Prolific code here (or through deploy_config.json).
  // Multiply every "waiting for the other members" delay, the reading minimums and the answer timers (1 = real timing; 0.1 = fast testing).
  timeScale: 1,
  // Trait questionnaires BEFORE the task (right after consent) and AFTER it (before the demographics). Roy, 30.9.2026.
  // Available: spin, fpes, bdi (BDI-II, 20 groups), bpni, npi16, lsas (fear matrix only), soas (Sense of Absence Scale); bfne, phq9 exist but are not administered.
  traitsBefore: ['spin','fpes','bdi','bpni'],
  traitsAfter: ['npi16','lsas','soas'],
  // Force a cell for testing (null = random 50/50 on each factor): standing 'high'|'low', acc 1|0
  force: { standing: null, acc: null },
  // Seconds allowed for each ranking choice (vote for the top, staircase picks); afterwards the system chooses and the choice is flagged.
  rankChoiceSeconds: 14,
  connChoiceSeconds: 20,   // Roy 1.10: the connections choice gets 20 s in every round and every cell (votes and picks stay at rankChoiceSeconds)
  // Seconds before the other screens of the task continue by themselves (Roy, 30.9: a running clock, nothing waits for the participant):
  // read = round result, connections reveal, team's choices; outcome = overall ranking and connections outcome; state = the 6-item
  // check (partial answers saved); wish = desired position; distress = the slider after the outcome; emotions = the 13-item list after
  // the outcome (partial answers saved); slider = the participation slider before the mission.
  gameTimers: { read: 20, result: 15, outcome: 25, state: 60, wish: 20, distress: 20, emotions: 40, slider: 20, avatar: 40, rankInfo: 60, connInfo: 45 },
  contactEmail: 'Cyberstatusegs@gmail.com'
};
