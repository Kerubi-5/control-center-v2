# Control Center v2

Password-protected GitHub Pages host for Control Center sketch versions.

Live: https://kerubi-5.github.io/control-center-v2/

## How it works

- `index.html` — unlock gate + version dropdown shell (latest opens by default)
- `versions.json` — manifest of available versions, release notes, and Git tags
- `versions/<id>.json` — AES-GCM encrypted sketch payloads
- `scripts/encrypt-version.mjs` — helper to add a new encrypted version

Clients pick a version from the top bar. **What's new** shows release notes. **Git diff** opens a GitHub compare (or release) link when tags exist.

## Add a new version (e.g. 2.6)

### Option A — encrypt a full sketch (preferred for large changes)

```bash
node scripts/encrypt-version.mjs \
  --id 2.6 \
  --input ./control_center_V2.6.html \
  --password "$CC_PASSWORD"
```

Then append to `versions.json` (chronological order), set `"latest"`, tag, and push.

### Option B — patch an existing encrypted version (small UI deltas)

`versions/2.5.json` is a patch on top of encrypted `2.4`. The shell decrypts the base, then applies find/replace patches. Use this when you do not want to re-encrypt for a small change.

```json
{
  "id": "2.6",
  "label": "v2.6",
  "payload": "versions/2.6.json",
  "mode": "patch",
  "base": "2.5",
  "released": "2026-08-15",
  "tag": "v2.6",
  "notes": ["Describe what changed for clients"]
}
```

GitHub Pages redeploys from `main` automatically.
