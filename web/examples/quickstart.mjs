/**
 * Seal a description, reveal it, seal a later copy from a second wallet,
 * challenge it, ask the validators and read the verdict, with genlayer-js.
 *
 *   node examples/quickstart.mjs <account name for the author> <account name for the copyist>
 *
 * In a browser the provider is window.ethereum and the account is the one the
 * wallet connected. Here a stand-in wallet signs for a local test account, so
 * the same code runs from a terminal. This file is the sample on the docs page
 * "Quickstart", copied in by scripts/gen_docs.py.
 */
import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { parseEther } from 'viem';

import { sealOf } from '../lib/seal.mjs';
import { standinWallet } from '../scripts/standin-wallet.mjs';

const PRIOR = '0xCc03C597dE98A0ecDEFBd500bbCF6314fCf03da4';
const chain = { ...studioDevnet, id: 61997, rpcUrls: { default: { http: ['https://studio-next.genlayer.com/api'] } } };

const [authorName = 'docs_author', copyistName = 'docs_copyist'] = process.argv.slice(2);

function wallet(name) {
  const { address, provider } = standinWallet(name); // browser: window.ethereum
  return { address, client: createClient({ chain, account: address, provider }) };
}

/** One write: a fee deposit from the SDK's estimate, then the success test. */
async function write(client, functionName, args, { value = 0n, rotations = 1 } = {}) {
  const estimate = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: 600,
    validatorTimeunitsAllocation: 600,
    totalMessageFees: 0,
    rotations: [rotations],
  });
  const hash = await client.writeContract({
    address: PRIOR,
    functionName,
    args,
    value,
    fees: { distribution: estimate.distribution, feeValue: estimate.feeValue },
  });
  const receipt = await client.waitForTransactionReceipt({ hash, waitUntil: 'decided', interval: 4000, retries: 120 });
  const leader = receipt.consensus_data.leader_receipt[0];
  // ACCEPTED is not success on its own: a refusal is accepted too. Check the result.
  if (leader.execution_result !== 'SUCCESS' || leader.result.status !== 'return') {
    throw new Error(`${functionName} refused: ${JSON.stringify(leader.result.payload)}`);
  }
  return { hash, returned: JSON.parse(leader.result.payload.readable) };
}

const author = wallet(authorName);
const copyist = wallet(copyistName);
const stamp = new Date().toISOString().slice(0, 16);
const original = `A weekly newsletter that turns each governance vote into plain language and adds a table of how the ten largest holders voted, with a note when a holder voted against their usual side. (${stamp})`;
const copy = `Every Friday we explain the week's protocol votes simply, and show how the top ten token holders voted, flagging anyone who broke from their own pattern. (${stamp})`;

// --- step: seal
// 1. Seal: the hash of text, salt and address, with a 2 GEN bond. The chain stamps the date.
const salt = 'quickstart-' + Math.random().toString(16).slice(2, 10);
const sealed = await write(author.client, 'register', [sealOf(original, salt, author.address)], { value: parseEther('2') });
const entryId = Number(sealed.returned);

// --- step: reveal
// 2. Reveal: the contract checks the text against the seal. The date does not move.
await write(author.client, 'reveal', [entryId, original, salt]);

// --- step: copy
// 3. A second wallet seals a reworded copy a little later, and reveals it.
const salt2 = 'copy-' + Math.random().toString(16).slice(2, 10);
const copied = await write(copyist.client, 'register', [sealOf(copy, salt2, copyist.address)], { value: parseEther('2') });
const copyId = Number(copied.returned);
await write(copyist.client, 'reveal', [copyId, copy, salt2]);

// --- step: challenge
// 4. The earlier author stakes 5 GEN against the later entry.
const challenged = await write(author.client, 'challenge', [entryId, copyId], { value: parseEther('5') });
const challengeId = Number(challenged.returned);

// --- step: judge
// 5. Anyone asks the validators. judge may rotate to a second committee, so it allows more rotations.
const judged = await write(author.client, 'judge', [challengeId], { rotations: 3 });

// --- step: read
// 6. Read the result back from the contract.
const view = JSON.parse(await author.client.readContract({ address: PRIOR, functionName: 'get_challenge', args: [challengeId] }));
console.log(JSON.stringify({ entryId, copyId, challengeId, label: view.label, verdict: view.verdict, toChallenger: view.to_challenger, judge: judged.hash }));
