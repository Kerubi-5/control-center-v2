# Control Center v2

Password-protected GitHub Pages host for Control Center sketch versions.

Live: https://kerubi-5.github.io/control-center-v2/

## How it works

- `index.html` — unlock gate + version dropdown shell (latest opens by default)
- `versions.json` — manifest of available versions, release notes, and Git tags
- `versions/<id>.json` — AES-GCM encrypted sketch payloads
- `scripts/encrypt-version.mjs` — helper to add a new encrypted version

Clients pick a version from the top bar. **What's new** shows release notes. **Git diff** opens a GitHub compare (or release) link when tags exist.

## Add a new version (e.g. 2.5)

1. Encrypt the plaintext sketch with the same access password:

```bash
node scripts/encrypt-version.mjs \
  --id 2.5 \
  --input ./control_center_V2.5.html \
  --password "$CC_PASSWORD"
```

2. Append to `versions.json` (keep versions in chronological order) and set `"latest": "2.5"`:

```json
{
  "id": "2.5",
  "label": "v2.5",
  "payload": "versions/2.5.json",
  "released": "2026-08-01",
  "tag": "v2.5",
  "notes": [
    "Describe what changed for clients"
  ]
}
```

3. Tag and push so the Git diff link works:

```bash
git add versions/2.5.json versions.json
git commit -m "feat: add control center v2.5"
git tag v2.5
git push origin main --tags
```

GitHub Pages redeploys from `main` automatically.
