// Holds web/lib/seal.mjs to tests/vectors.json, which scripts/gen_vectors.py
// writes from the contract's own seal_hash. Run: node web/scripts/hash-parity.mjs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sealOf, sha256Hex } from '../lib/seal.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { vectors } = JSON.parse(readFileSync(join(root, 'tests', 'vectors.json'), 'utf8'));
let failed = 0;
for (const v of vectors) {
  if (sealOf(v.text, v.salt, v.address) !== v.seal) {
    failed++;
    console.log('MISMATCH', v.name);
  }
}
for (const n of [0, 1, 55, 56, 57, 63, 64, 65, 119, 120, 1000]) {
  const bytes = new Uint8Array(n).map((_, i) => (i * 31 + 7) & 255);
  const want = createHash('sha256').update(bytes).digest('hex');
  if (sha256Hex(bytes) !== want) {
    failed++;
    console.log('SHA-256 differs from node:crypto at length', n);
  }
}
console.log(failed === 0 ? `hash parity ok: ${vectors.length} vectors` : `hash parity FAILED: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
