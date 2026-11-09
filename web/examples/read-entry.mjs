/**
 * Read an entry: its seal, its date, its text once revealed and its marks. Reads need no wallet and no fee.
 *
 *   node examples/read-entry.mjs <entry id>
 *
 * This file is the sample on the docs pages "Challenge a copy" and "Embeds",
 * copied in by scripts/gen_docs.py.
 */
import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';

const PRIOR = '0xCc03C597dE98A0ecDEFBd500bbCF6314fCf03da4';
const chain = { ...studioDevnet, id: 61997, rpcUrls: { default: { http: ['https://studio-next.genlayer.com/api'] } } };

const client = createClient({ chain });
const [id = '1'] = process.argv.slice(2);
const e = JSON.parse(await client.readContract({ address: PRIOR, functionName: 'get_entry', args: [Number(id)] }));

if (!e.found) throw new Error('no such entry');
console.log(`#${e.id} ${e.state}, sealed ${new Date(e.sealed_at * 1000).toISOString()}, seal ${e.seal.slice(0, 12)}…`);
if (e.revealed) console.log(`  ${e.text}`);
console.log(`  overlaps #${e.overlaps || 'none'}, ${e.related} related, ${e.cleared} cleared`);
