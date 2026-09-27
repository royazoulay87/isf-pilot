# isf-pilot

Static study apps for a Prolific pilot (Bar-Ilan University, Roy Azoulay). Three independent tasks, each in its own folder:
`scenarios/`, `cyberstatus/`, `cyberball/`. Served with GitHub Pages; data is posted by each app to a separate receiver
(not in this repo). Participants reach the apps only through the study links on Prolific.

Deploy: `./deploy.sh "message"` copies the current app folders from the build location, commits, and pushes `main`.
