/**
 * Compute the seal of a text in the browser or in Node, with no wallet and no network.
 *
 *   node examples/seal-a-text.mjs
 *
 * This is the same file the site runs (lib/seal.mjs), held byte for byte to the
 * contract's own hash by tests/vectors.json. The sample on the docs page "Hashing".
 */
import { sealOf } from '../lib/seal.mjs';

const seal = sealOf('A weekly newsletter on votes.', 's1', '0x3e8b3e8b3e8b3e8b3e8b3e8b3e8b3e8b3e8b41aa');
console.log(seal);
