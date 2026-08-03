#!/usr/bin/env node
/**
 * Encrypt a plaintext HTML sketch into versions/<id>.json using the same
 * AES-GCM + PBKDF2 settings as the GitHub Pages unlock gate.
 *
 * Usage:
 *   node scripts/encrypt-version.mjs --id 2.5 --input ./sketch.html --password '***'
 *
 * Then add an entry to versions.json, set "latest", commit, and push.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

const { subtle } = webcrypto;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function usage(exitCode = 1) {
  console.error(`Usage:
  node scripts/encrypt-version.mjs --id <version> --input <file.html> --password <secret>

Example:
  node scripts/encrypt-version.mjs --id 2.5 --input ./control_center_V2.5.html --password "$CC_PASSWORD"
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    out[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return out;
}

function toB64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function embedData(plaintext, dataPath) {
  if (!dataPath) return plaintext;
  const data = readFileSync(resolve(dataPath), "utf8").trim();
  JSON.parse(data);
  const injection = `<script>window.__CONTROL_CENTER_PIPELINE__ = ${data};</script>`;
  if (!plaintext.includes("</head>")) {
    throw new Error("Cannot embed data: sketch HTML has no </head> element");
  }
  return plaintext.replace("</head>", `${injection}</head>`);
}

async function encryptHtml(plaintext, password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const ciphertext = new Uint8Array(
    await subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext)
    )
  );

  return {
    saltB64: toB64(salt),
    ivB64: toB64(iv),
    ciphertextB64: toB64(ciphertext),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usage(0);
  if (!args.id || !args.input || !args.password) usage(1);

  const inputPath = resolve(args.input);
  const source = readFileSync(inputPath, "utf8");
  const plaintext = embedData(source, args.data);
  const encrypted = await encryptHtml(plaintext, args.password);

  const payload = {
    id: String(args.id),
    ...encrypted,
  };

  const outDir = resolve(ROOT, "versions");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${args.id}.json`);
  writeFileSync(outPath, JSON.stringify(payload));

  console.log(`Wrote ${outPath}`);
  console.log(`Next:
  1. Add a versions.json entry for "${args.id}" (payload: "versions/${args.id}.json")
  2. Set "latest" to "${args.id}"
  3. Optionally: git tag v${args.id} && git push --tags
  4. Commit and push to redeploy GitHub Pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
