/**
 * The reviewer's path, run from FRESH accounts through the site's own code.
 *
 *   node scripts/reviewer-path.mjs [site url]
 *
 * Two accounts are made for this run only. Each is funded by the site's own
 * faucet route (POST /api/faucet), then every write goes through
 * lib/genlayer-core.mjs with a stand-in EIP-1193 wallet, the same code the
 * browser runs:
 *
 *   author:    faucet, seal a description (seal computed by lib/seal.mjs), a wrong reveal is refused, reveal
 *   copyist:   faucet, seal a reworded copy later, reveal
 *   author:    stake 5 GEN, ask the validators, read the result, check the books
 *   author:    withdraw, then compare the wallet with what the contract owed, after finality
 *
 * It also fetches every page of the site at that URL. Writes docs/reviewer-path.studio-next.json.
 * Exits 1 on the first step that does not succeed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEther } from 'viem';

import { CONTRACT, outcomeOf, readClient, retried, submit, waitDecided, waitFinal, walletClient } from '../lib/genlayer-core.mjs';
import { sealOf } from '../lib/seal.mjs';
import { balanceOf, ensureAccount, standinWallet } from './standin-wallet.mjs';

const SITE = (process.argv[2] ?? 'http://localhost:3211').replace(/\/$/, '');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'docs', 'reviewer-path.studio-next.json');
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const AUTHOR = `reviewer_author_${stamp}`;
const COPYIST = `reviewer_copyist_${stamp}`;

const record = { site: SITE, contract: CONTRACT, started: new Date().toISOString(), steps: [] };
const reader = readClient();
const sent = {};

function say(step, detail = {}) {
  record.steps.push({ step, ...detail });
  console.error(`  ${step}`, JSON.stringify(detail, (k, v) => (typeof v === 'bigint' ? v.toString() : v)).slice(0, 220));
}

function fail(step, why) {
  record.failed = { step, why };
  fs.writeFileSync(OUT, JSON.stringify(record, null, 2));
  console.error(`FAILED at ${step}: ${why}`);
  process.exit(1);
}

/** One write through the site's code. With `expectRefusal` the contract must refuse, and the site's success test must say so. */
async function write(name, method, args, value = 0n, expectRefusal = false) {
  const { address, provider } = standinWallet(name);
  const client = walletClient(address, provider);
  const hash = await submit(client, { method, args, value, sender: address });
  (sent[name] ??= []).push({ hash, client });
  const outcome = outcomeOf(await waitDecided(client, hash, method));
  if (expectRefusal) {
    if (outcome.ok) fail(method, 'expected a refusal, the write succeeded');
    return { hash, outcome, client };
  }
  if (!outcome.ok) fail(method, outcome.refusal || `${outcome.status} ${outcome.execution}`);
  return { hash, outcome, client };
}

/** waitFinal that survives this machine's flaky connection: any error is retried, up to 25 times. */
async function finalize(client, hash) {
  for (let i = 0; ; i++) {
    try {
      return await waitFinal(client, hash);
    } catch (error) {
      if (i >= 25) throw error;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

const view = async (method, args) => JSON.parse(await retried(() => reader.readContract({ address: CONTRACT, functionName: method, args }), 4));

// -- accounts and the site's faucet -----------------------------------------------------
const authorAddr = ensureAccount(AUTHOR);
const copyistAddr = ensureAccount(COPYIST);
for (const [name, address] of [[AUTHOR, authorAddr], [COPYIST, copyistAddr]]) {
  const before = await balanceOf(address);
  const response = await fetch(`${SITE}/api/faucet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: address.toLowerCase() }) });
  const body = await response.json();
  if (!response.ok) fail('faucet', `${name}: ${body.error}`);
  const after = await balanceOf(address);
  if (after <= before) fail('faucet', `${name}: the balance did not move`);
  say('faucet', { account: name, address, from: before.toString(), to: after.toString(), note: 'a lowercase address, checksummed by the route' });
}

// -- the author seals, a wrong reveal is refused, the right one works ------------------------------
const original = `A weekly newsletter that turns each governance vote into plain language and adds a table of how the ten largest holders voted, with a note when a holder voted against their usual side. (${stamp})`;
const copy = `Every Friday we explain the week's protocol votes simply, and show how the top ten token holders voted, flagging anyone who broke from their own pattern. (${stamp})`;
const saltA = 'rp' + stamp;
const sealA = sealOf(original, saltA, authorAddr);
const registered = await write(AUTHOR, 'register', [sealA], parseEther('2'));
const aId = Number(registered.outcome.returned);
const e0 = await view('get_entry', [aId]);
if (e0.seal !== sealA || e0.revealed || e0.text !== '') fail('register', 'the stored seal is not the one the site computed, or the text leaked');
say('register', { entryId: aId, hash: registered.hash, sealed_at: e0.sealed_at, note: 'the seal computed by the site code is the seal on chain, and the text is not' });

const wrong = await write(AUTHOR, 'reveal', [aId, original + ' ', saltA], 0n, true);
say('reveal_wrong_text', { hash: wrong.hash, refusal: wrong.outcome.refusal, note: 'refused with the contract\'s own sentence, accepted but not a success' });
const revealed = await write(AUTHOR, 'reveal', [aId, original, saltA]);
const e1 = await view('get_entry', [aId]);
if (!e1.revealed || e1.text !== original || e1.sealed_at !== e0.sealed_at) fail('reveal', 'the reveal did not store the text, or the date moved');
say('reveal', { entryId: aId, hash: revealed.hash, date_unchanged: true });

// -- the copyist seals later --------------------------------------------------------------------------
await new Promise((r) => setTimeout(r, 3000));
const saltB = 'rc' + stamp;
const copied = await write(COPYIST, 'register', [sealOf(copy, saltB, copyistAddr)], parseEther('2'));
const bId = Number(copied.outcome.returned);
await write(COPYIST, 'reveal', [bId, copy, saltB]);
const b1 = await view('get_entry', [bId]);
if (!(b1.sealed_at > e1.sealed_at)) fail('register', 'the later seal is not later by chain time');
say('copy_sealed', { entryId: bId, hash: copied.hash, seconds_later: b1.sealed_at - e1.sealed_at });

// -- the challenge ---------------------------------------------------------------------------------------
const notMine = await write(COPYIST, 'challenge', [aId, bId], parseEther('5'), true);
say('challenge_by_the_wrong_author', { hash: notMine.hash, refusal: notMine.outcome.refusal });
const challenged = await write(AUTHOR, 'challenge', [aId, bId], parseEther('5'));
const cId = Number(challenged.outcome.returned);
say('challenge', { challengeId: cId, hash: challenged.hash });
const judged = await write(AUTHOR, 'judge', [cId]);
const c1 = await view('get_challenge', [cId]);
if (!c1.label || !c1.verdict) fail('judge', 'no label was stored');
say('judge', { challengeId: cId, hash: judged.hash, label: c1.label, verdict: c1.verdict, to_challenger: c1.to_challenger, b_marked_overlapping: c1.b.overlaps });

// -- the books, then the payout after finality --------------------------------------------------------------
const totals = (await view('get_entry', [0])).totals;
const sum = BigInt(totals.bonds_left) + BigInt(totals.stakes_held) + BigInt(totals.owed) + BigInt(totals.paid);
if (BigInt(totals.received) !== sum) fail('books', `received ${totals.received} is not ${sum}`);
say('books', { ...totals, note: 'received = bonds_left + stakes_held + owed + paid' });

const listing = await view('list_entries', [authorAddr.toLowerCase(), 0, 5]);
const owed = BigInt(listing.balance);
if (owed !== BigInt(c1.to_challenger)) fail('balance', `the contract owes ${owed}, the verdict credits ${c1.to_challenger}`);
for (const { hash, client } of sent[AUTHOR]) await finalize(client, hash);
const walletBefore = await balanceOf(authorAddr);
const withdrawn = await write(AUTHOR, 'withdraw', []);
const final = await finalize(withdrawn.client, withdrawn.hash);
const walletAfter = await balanceOf(authorAddr);
const gained = walletAfter - walletBefore;
say('withdraw', { hash: withdrawn.hash, owed: owed.toString(), wallet_before: walletBefore.toString(), wallet_after_finality: walletAfter.toString(), gained: gained.toString(), fee_difference: (owed - gained).toString(), final_status: outcomeOf(final).status, note: 'the wallet gains what was owed, less the fee of the withdraw transaction' });
if (gained <= 0n || gained > owed) fail('withdraw', `the wallet moved by ${gained}, which is not within what was owed (${owed})`);
if ((await view('list_entries', [authorAddr.toLowerCase(), 0, 5])).balance !== '0') fail('withdraw', 'the balance was not cleared');

// -- the pages -------------------------------------------------------------------------------------------------
const pages = ['/', '/entries', '/challenges', '/new', '/me', `/e/${aId}`, `/e/${bId}`, `/e/${aId}/challenge`, `/c/${cId}`, '/docs', '/docs/quickstart', '/docs/reference/contract', '/docs/more/evaluation', '/llms.txt'];
for (const page of pages) {
  const response = await fetch(SITE + page, { redirect: 'follow' });
  if (response.status !== 200) fail('pages', `${page} answered ${response.status}`);
}
const text = await (await fetch(`${SITE}/c/${cId}`)).text();
if (!text.includes(c1.label) || !text.includes(c1.verdict)) fail('pages', `/c/${cId} does not show ${c1.label} and ${c1.verdict}`);
say('pages', { checked: pages.length, all: 200, challenge_page_shows: `${c1.label} → ${c1.verdict}` });

record.finished = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(record, null, 2));
console.log(JSON.stringify({ ok: true, entryA: aId, entryB: bId, challengeId: cId, label: c1.label, verdict: c1.verdict, steps: record.steps.length }));
