# Portal entry

The fields in the order the portal shows them. `python submission/count.py` counts every limited field.

## Project name

Prior - be first, provably

## Project tag

Dispute Resolution

## Tag 1

Evidence Assessment

## Tag 2

Appeal Review

## Icon

`submission/prior-icon-512.png` (512 × 512, the site's own mark, safe for a circular crop)

## One-liner

Seal an idea, the chain stamps the date; validators compare a copy against it.

## Description

Prior is a priority registry for ideas and written work on GenLayer. An author seals a description with a bond, so the chain stamps a date while the text stays hidden until they reveal it. When a later entry looks like a copy, the earlier author stakes 5 GEN; validators compare the two texts without seeing dates or names and label the overlap substantial, partial or none. The contract derives the verdict and the mark from that label and the seal dates, paying the later entry's bond to the challenger when the copy is upheld. Only withdraw pays. Deployed on Studio Next, with golden pairs run through real consensus and published as they came out: 8 of 10, both misses shown.

## Show it in action

Demo video: not recorded yet (`submission/demo-script.md` has the shot list).

## Write the exact path

### 1. Fund a wallet

Open prior-genlayer.vercel.app and select Connect wallet in the header, then Switch to Studio Next: the site adds GenLayer Studio Next (chain 61997) to the wallet. The first action panel you reach offers Get test GEN, which pays 20 test GEN from the site's faucet.

### 2. Seal an idea

Select Register an idea, write a description, and select Seal with a 2 GEN bond, then confirm. The page shows your ticket saved in this browser; select Download the ticket to keep it.

### 3. Reveal it

Select Open the entry, then Reveal the text and confirm. The entry shows REVEALED with the text, and the seal date has not changed.

### 4. Challenge a later copy

Open entry 1 (the reference entry) from Entries, or your own, and select Challenge a later copy of this. Pick a later entry, read both texts side by side, then select Stake 5 GEN and file and confirm; only the earlier entry's author can sign.

### 5. Ask the validators

On the challenge page select Ask the validators to compare them and confirm. The page shows Validators are reading, then the label, the verdict and how many validators agreed.

### 6. Withdraw

Select Withdraw and confirm. Verdicts only move balances inside the contract; withdraw is the one call that pays.

## Prove the path works

### Expected verification outcome

The challenge page shows both texts, the label and the verdict, the later entry carries its mark, and My entries shows the balance. To confirm on chain, open the judge transaction: consensus_data.leader_receipt[0] has execution_result SUCCESS and result.status return; a refusal is also ACCEPTED, so status alone proves nothing. get_challenge(id) returns the label, verdict and payout. The same path ran from fresh accounts against the live site: https://github.com/meitipro/prior/blob/main/docs/reviewer-path.studio-next.json

### Contract link

https://explorer-studio-dev.genlayer.com/address/0xCc03C597dE98A0ecDEFBd500bbCF6314fCf03da4

## Send people to it

- Website: https://prior-genlayer.vercel.app
- GitHub: https://github.com/meitipro/prior

## Steward note

The runtime header in the spec is rejected by Studio Next today (invalid_contract runner malformed), so the contract is pinned to the runner the network resolves latest to. The golden set was locked before the first run and nothing was tuned: 8 of 10, with cases 7 and 9 expected NONE and labelled PARTIAL. Test with a fresh entry rather than the golden ones.

## Evidence

- Contract: https://explorer-studio-dev.genlayer.com/address/0xCc03C597dE98A0ecDEFBd500bbCF6314fCf03da4
- Deploy: https://explorer-studio-dev.genlayer.com/tx/0x0e4be3ce8c7acec898ae1dc1bcd4dc15053d68ac4ec490fe2849d80ef5a48b20
- Evaluation: https://github.com/meitipro/prior/blob/main/eval/results.md
- Mutations, 85 of 85: https://github.com/meitipro/prior/blob/main/docs/MUTATIONS.md
- Seed: https://github.com/meitipro/prior/blob/main/docs/seed.studio-next.json
- Reviewer path on the live site: https://github.com/meitipro/prior/blob/main/docs/reviewer-path.studio-next.json
