import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { webcrypto } from 'node:crypto';

const root = new URL('..', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'cc-embed-test-'));
const output = join(root, 'versions', 'test-embedded-data.json');
const password = 'test-password';
try {
  execFileSync('node', [join(root, 'scripts/encrypt-version.mjs'), '--id', 'test-embedded-data', '--input', join(root, 'tests/fixtures/minimal-sketch.html'), '--data', join(root, 'tests/fixtures/pipeline.json'), '--password', password], { stdio: 'inherit' });
  const payload = JSON.parse(readFileSync(output, 'utf8'));
  const { subtle } = webcrypto;
  const material = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey({ name: 'PBKDF2', salt: Buffer.from(payload.saltB64, 'base64'), iterations: 100000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = new TextDecoder().decode(await subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(payload.ivB64, 'base64') }, key, Buffer.from(payload.ciphertextB64, 'base64')));
  if (!plain.includes('window.__CONTROL_CENTER_PIPELINE__ = {"meta":{"snapshot_date":"2026-08-03"},"triage":[{"ref":"Q-1","value":42}]};')) throw new Error('Embedded pipeline assignment missing from decrypted sketch');
  console.log('PASS: --data embeds a pipeline JSON assignment inside the encrypted sketch');
} finally {
  rmSync(output, { force: true });
  rmSync(dir, { recursive: true, force: true });
}
