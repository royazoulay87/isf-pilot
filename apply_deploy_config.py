#!/usr/bin/env python3
"""Inject endpoint + completionUrl from deploy_config.json into the published app copies (run by deploy.sh after the sync)."""
import json, re, os, sys, glob
here=os.path.dirname(os.path.abspath(__file__)); cfg=json.load(open(os.path.join(here,'deploy_config.json')))
targets={'scenarios':['scenarios/config.js'],'cyberstatus':['cyberstatus/config.js'],'cyberball':glob.glob(os.path.join(here,'cyberball','ThrowCatch_*.html'))}
for task,files in targets.items():
    for f in files:
        p=f if os.path.isabs(f) else os.path.join(here,f)
        if not os.path.exists(p): print('skip',task,'(file missing)'); continue
        s=open(p,encoding='utf-8').read(); s0=s
        s=re.sub(r"(\bendpoint\s*:\s*)'[^']*'", lambda m: m.group(1)+"'"+cfg['endpoint']+"'", s, count=1)
        s=re.sub(r"(\bcompletionUrl\s*:\s*)'[^']*'", lambda m: m.group(1)+"'"+cfg['completionUrl'].get(task,'')+"'", s, count=1)
        if s!=s0: open(p,'w',encoding='utf-8').write(s)
        print(f"{task}: endpoint {'SET' if cfg['endpoint'] in s else 'NOT FOUND'}, completionUrl='{cfg['completionUrl'].get(task,'')}' in {os.path.relpath(p,here)}")
