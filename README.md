# isf-pilot

Static study apps for the ISF pilot (Bar-Ilan University, Roy Azoulay), published on GitHub Pages.

- Participants: [Scenarios](https://royazoulay87.github.io/isf-pilot/scenarios/), [CyberStatus](https://royazoulay87.github.io/isf-pilot/cyberstatus/), [Throw & Catch](https://royazoulay87.github.io/isf-pilot/cyberball/).
- Fixed Scenarios review: [X](https://royazoulay87.github.io/isf-pilot/scenarios/?debug=1&half=X), [Y](https://royazoulay87.github.io/isf-pilot/scenarios/?debug=1&half=Y). These now fix order and counterbalancing defaults. Explicit `order`, `amb`, `lvl` override defaults; `seq=0` restores shuffling. The current `allSettings=true` study shows all 16 ambiguous and all 16 clear settings in either half. Review mode permits missing answers; do not send debug links to participants.

## Saving (receiver v10)

`save.js` stores checkpoints in a browser outbox before sending. A readable server acknowledgement removes only the exact payload acknowledged. Failed saves remain available for retries after reconnection or the next visit on the same browser/origin. Final saves wait for earlier checkpoints. Throw & Catch backs up committed pages and throws locally, sends progress at most 20 seconds after a new pending snapshot, and also sends at consent and game boundaries. Closing a browser before transmission cannot guarantee server receipt; recovery depends on reopening the same origin with browser storage intact.

`backend/receiver.gs` is the Apps Script source. Every raw write is locked and read back exactly. Batches contain up to eight original JSON strings. A raw body digest prevents duplicate raw records; `run_id` identifies one completed run in readable tables; `throw_id` identifies each game/throw. Partial writes can be retried without duplicate readable records. All existing raw JSON is retained. Live counts check actual readable rows rather than stale historical flags.

Deploy the receiver as a new version of the existing Apps Script web-app deployment **before** publishing clients, keeping its URL and permissions. The older single-record POST format remains supported. Selecting `doPost` and pressing Run no longer triggers maintenance. `maintenance`, `cleanupTests`, and `rebuildWide` are explicit administrative operations; do not run them during data collection.

## Configuration and publishing

`deploy_config.json` contains the endpoint and per-study Prolific completion URLs. Empty completion URLs show the final thank-you page. Fill the actual three URLs before recruiting through Prolific.

`./deploy.sh [scenarios cyberstatus cyberball]` syncs the Desktop build folders listed in that script / `cyberball/SOURCE`, applies deployment configuration, commits and pushes main. Keep those sources synchronized with published saving fixes; `save.js` must be present at the repository root. For a change made directly in this repository, apply configuration and commit/push the reviewed change without running the source-sync script.

Validation: `node tests/receiver.cjs` and `node tests/outbox.cjs`. These cover partial writes, corrupted raw data, old retries, batched retries, typed text, large Unicode records, progress vs completion, durable recovery, and an acknowledgement racing with a newer snapshot. A final live Sheets check is required after receiver deployment.
