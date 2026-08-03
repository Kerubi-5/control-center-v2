# Control Center v2

Password-protected GitHub Pages host for Control Center sketch versions.

Live: https://kerubi-5.github.io/control-center-v2/

## How it works

- `index.html` — unlock gate + version dropdown shell (latest opens by default)
- `versions.json` — manifest of available versions, production selection, release notes, and Git tags
- `versions/<id>.json` — AES-GCM encrypted sketch payloads
- `scripts/encrypt-version.mjs` — helper to add a new encrypted version

Clients pick a version from the top bar. **What's new** shows plain-language release notes. **Compare** opens a side-by-side view of two versions (with optional synced scrolling) so non-technical clients can see UI changes themselves.

## Production and private versions

`production` in `versions.json` is the version that opens by default and is marked as production in the picker. To promote a released version, change only that field, for example `"production": "2.6"`.

Set `"hidden": true` on a version to keep it out of the version and compare pickers. It remains available to anyone with the password and an exact direct link such as `?v=2.5-alt`.

## Add a new version (e.g. 2.6)

Encrypt a plaintext sketch with the **same access password** used by all versions:

```bash
node scripts/encrypt-version.mjs \
  --id 2.6 \
  --input ./control_center_V2.6.html \
  --password "$CC_PASSWORD"
```

If a sketch reads a local JSON feed, keep that data inside the password-protected payload instead of publishing it as a separate static file:

```bash
node scripts/encrypt-version.mjs \
  --id 2.6 \
  --input ./control_center_V2.6.html \
  --data ./data/sales_pipeline.json \
  --password "$CC_PASSWORD"
```

`--data` injects the JSON into the encrypted sketch as `window.__CONTROL_CENTER_PIPELINE__`. The sketch should read that value before attempting any local-file fetch fallback.

Then append to `versions.json` (chronological order), set `"production"` when the version should become the default, tag, and push:

```bash
git add versions/2.6.json versions.json
git commit -m "feat: add control center v2.6"
git tag v2.6
git push origin main --tags
```

GitHub Pages redeploys from `main` automatically.

Do not commit plaintext sketches or the password. Keep `CC_PASSWORD` in your local shell/env only.
