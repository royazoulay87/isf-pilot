/* Durable, acknowledged study saves. Requires receiver v10 (batch support). */
(function (root) {
  'use strict';
  const PREFIX = 'isf_outbox_v1_';
  root.ISFSave = function (endpoint) {
    const pending = new Map();
    let pumping = null, timer = null, failures = 0;
    function persist(key, entry) {
      pending.set(key, entry);
      try { localStorage.setItem(key, JSON.stringify(entry)); entry.durable = true; return true; }
      catch (error) { console.warn('Study backup could not be stored in this browser', error); return false; }
    }
    // Recover durable records from an earlier visit, including the older final-only format.
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(PREFIX)) {
          try { const entry = JSON.parse(localStorage.getItem(key)); if (entry && entry.body && entry.endpoint) pending.set(key, {...entry, readyAt: 0, durable: true}); } catch (_) {}
        } else if (key.startsWith('isf_pending_')) {
          const body = localStorage.getItem(key);
          if (body && endpoint) pending.set(key, {body, endpoint, readyAt: 0, legacy: true, durable: true});
        }
      }
    } catch (_) {}
    function schedule(delay = 500) {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; flush(); }, delay);
    }
    function enqueue(body, identity, delay = 500) {
      if (!endpoint) return null;
      const key = PREFIX + encodeURIComponent(identity);
      // A delayed progress snapshot replaces an older snapshot of the same stage.
      // It keeps the original deadline, even when events arrive continuously.
      const old = pending.get(key), readyAt = Math.min(old ? old.readyAt : Infinity, Date.now() + delay);
      persist(key, {body, endpoint, readyAt});
      schedule(Math.max(0, readyAt - Date.now()));
      return key;
    }
    async function post(entries) {
      const ctl = new AbortController(), timeout = setTimeout(() => ctl.abort(), 90000);
      try {
        const response = await fetch(entries[0][1].endpoint, {method: 'POST', mode: 'cors', cache: 'no-store',
          headers: {'Content-Type': 'text/plain'}, signal: ctl.signal,
          body: JSON.stringify({isf_batch: 1, records: entries.map(([, entry]) => entry.body)})});
        return response.ok && /^ok\b/.test((await response.text()).trim());
      } catch (_) { return false; } finally { clearTimeout(timeout); }
    }
    async function drain() {
      while (true) {
        // Another open study tab may have delivered a recovered record already.
        for (const [key, entry] of pending) {
          if (entry.durable) {
            try { const stored = localStorage.getItem(key); if (stored === null || (stored !== entry.body && JSON.parse(stored).body !== entry.body)) pending.delete(key); } catch (_) {}
          }
        }
        const ready = [...pending].filter(([, e]) => e.readyAt <= Date.now());
        if (!ready.length) { failures = 0; return true; }
        const entries = ready.filter(([, e]) => e.endpoint === ready[0][1].endpoint).slice(0, 8);
        if (await post(entries)) {
          failures = 0;
          for (const [key, entry] of entries) {
            // A newer snapshot may have replaced this entry while its request was in flight.
            if (pending.get(key)?.body === entry.body) pending.delete(key);
            try {
              const stored = localStorage.getItem(key);
              if (stored && (stored === entry.body || JSON.parse(stored).body === entry.body)) localStorage.removeItem(key);
            } catch (_) {}
          }
        } else {
          failures++;
          if (failures >= 3) { schedule(30000); return false; }
          await new Promise(resolve => setTimeout(resolve, failures * 2000 + Math.random() * 1000));
        }
      }
    }
    function flush() {
      if (!pumping) {
        pumping = drain().finally(() => {
          pumping = null;
          if (pending.size && failures < 3) schedule(Math.max(500, Math.min(...[...pending.values()].map(e => e.readyAt)) - Date.now()));
        });
      }
      return pumping;
    }
    async function complete(body, identity) {
      const key = enqueue(body, identity, 0);
      if (!key) return null;
      failures = 0;
      // Flush earlier checkpoints before acknowledging completion as well.
      for (const entry of pending.values()) entry.readyAt = 0;
      await flush();
      return !pending.has(key);
    }
    root.addEventListener('online', () => { failures = 0; schedule(0); });
    root.addEventListener('pageshow', () => schedule(0));
    if (pending.size) schedule(0);
    return {enqueue, complete, flush};
  };
})(window);
