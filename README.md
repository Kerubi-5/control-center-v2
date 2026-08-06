# Control Center v2

Password-protected GitHub Pages host for Control Center sketch versions.

Live: https://kerubi-5.github.io/control-center-v2/

## How it works

- `index.html` — unlock gate + version dropdown shell (production opens by default)
- `versions.json` — manifest of available versions, production selection, release notes, and Git tags
- `versions/<id>.json` — AES-GCM encrypted sketch payloads
- `vendor/html2canvas.min.js` + `vendor/pixelmatch.js` — visual compare libraries
- `scripts/encrypt-version.mjs` — helper to add a new encrypted version

Clients pick a version from the top bar. **What's new** shows plain-language release notes.

**Compare** is opt-in (nothing auto-launches):

1. Side-by-side **Before / After** with optional synced scrolling
2. **Highlight changes** (on by default) matches sections/cards by label, outlines **new** UI (e.g. a CTA), and runs [html2canvas](https://html2canvas.hertzen.com/) + [pixelmatch](https://github.com/mapbox/pixelmatch) **inside** each changed card so page layout shift does not pink-wash the whole pane

Deep links: `?v=2.6`, `?mode=compare&left=2.5&right=2.6`, `?mode=compare&highlight=1&left=2.5&right=2.6`. Use `highlight=0` to turn the overlay off.

`?enable-flag=true` shows everything normally hidden: alternate versions in the pickers, and the Roadmap top-bar link. Without it, hidden versions stay direct-link only (`?v=2.5-alt`) and Roadmap stays off the bar (page still at `/roadmap.html`).

## Production and private versions

`production` in `versions.json` is the version that opens by default and is marked as production in the picker. To promote a released version, change only that field, for example `"production": "2.6"`.

Set `"hidden": true` on a version to keep it out of the version and compare pickers. It remains available to anyone with the password and an exact direct link such as `?v=2.5-alt`.

## Add a new version (e.g. 2.7)

Encrypt a plaintext sketch with the **same access password** used by all versions:

```bash
node scripts/encrypt-version.mjs \
  --id 2.7 \
  --input ./control_center_V2.7.html \
  --password "$CC_PASSWORD"
```

If a sketch reads a local JSON feed, keep that data inside the password-protected payload instead of publishing it as a separate static file:

```bash
node scripts/encrypt-version.mjs \
  --id 2.7 \
  --input ./control_center_V2.7.html \
  --data ./data/sales_pipeline.json \
  --password "$CC_PASSWORD"
```

Then append to `versions.json` (chronological order), set `"latest"` / `"production"` as needed, tag, and push:

```bash
git add versions/2.7.json versions.json
git commit -m "feat: add control center v2.7"
git tag v2.7
git push origin main --tags
```

GitHub Pages redeploys from `main` automatically.

Do not commit plaintext sketches or the password. Keep `CC_PASSWORD` in your local shell/env only.
