# Prior

**Be first, provably.**

Prior is a priority registry for ideas and written work on [GenLayer](https://www.genlayer.com). An author seals a description with a bond: the chain stamps the date and the text stays hidden until the author chooses to reveal it. When a later entry looks like a copy, the earlier author stakes a challenge, GenLayer validators compare the two texts without seeing dates or names and label the overlap, and the contract derives the verdict and the mark from that label and the seal dates.

One contract (`contracts/prior.py`, ten methods), a Next.js site with a `/docs` section, deployed on **GenLayer Studio Next** (chain 61997). The build spec is the source of truth; where this build departs from it, [Honest departures](#honest-departures) says so.

| | |
|---|---|
| Network | GenLayer Studio Next, chain 61997 |
| Contract | [`0xCc03C597dE98A0ecDEFBd500bbCF6314fCf03da4`](https://explorer-studio-dev.genlayer.com/address/0xCc03C597dE98A0ecDEFBd500bbCF6314fCf03da4) |
| Deploy transaction | [`0x0e4be3ce…`](https://explorer-studio-dev.genlayer.com/tx/0x0e4be3ce8c7acec898ae1dc1bcd4dc15053d68ac4ec490fe2849d80ef5a48b20) |
| Source sha256 | `9f928dbfe6d1acba19cb64e725389bd8fa80992d1e1bc76c7abc2525a2369b84` (held to the deployed bytes by `scripts/verify.py`) |
| Golden pairs through real consensus | **8 of 10**, misses published, nothing tuned ([`eval/results.md`](eval/results.md)) |
| Held-out pairs | H1, H2 and H3 all `PARTIAL`, as they came out |
| Tests | 120 passing, offline |
| Mutations | 85 defences broken one at a time, 85 caught ([`docs/MUTATIONS.md`](docs/MUTATIONS.md)) |

## How it works

1. **Seal.** `sha256(text|salt|address)` with a bond of at least 2 GEN. The date is the chain time of the transaction.
2. **Reveal.** The author publishes the text; the contract checks it against the seal. A reveal never changes the date.
3. **Challenge.** The author of the earlier entry A stakes 5 GEN against a later entry B. Both revealed, A sealed strictly before B, a pair challenged once.
4. **Read.** Validators compare the two texts, the earlier always as TEXT 1, and agree on one label: `SUBSTANTIAL`, `PARTIAL` or `NONE`. They never see dates, names or addresses.
5. **Mark.** The contract computes the verdict in code:

| Verdict | When | Money |
|---|---|---|
| PRIOR | SUBSTANTIAL | stake back, plus B's bond if B was inside its 90 days; B is marked as overlapping A |
| RELATED | PARTIAL | stake back, the bond stays, both entries show a related note |
| CLEARED | NONE | the stake goes to the accused |
| SEASONED | 90 days, nothing upheld | the bond returns to its author |

Money moves only in `withdraw()`, a top-level transfer to the caller. `reveal`, `judge` and `close_entry` only move balances. A test asserts after nearly every step that `received == bonds_left + stakes_held + owed + paid`.

## The ten methods

`register` (payable), `reveal`, `challenge` (payable), `judge`, `close_entry`, `withdraw`, `get_entry`, `get_challenge`, `list_entries`, `list_marks`. The reference in the docs is generated from the source.

## Results, as they came out

The ten golden pairs went through the deployed contract: a reference entry A, then each later text sealed from its own account after it, challenged with 5 GEN and read by the real judge. The prompt is the spec's, word for word, and the set was hashed and timestamped before the first run.

- **8 of 10 matched.** The two misses are published, not tuned away: case 7 ("A bot that reminds token holders before a vote ends") and case 9 ("A newsletter") were expected NONE, and the validators agreed on PARTIAL both times.
- **Held out, run once, never used to tune:** H1 "A monthly governance digest with a turnout chart", H2 "A weekly vote summary plus how large holders voted, no pattern note" and H3 "A weekly thread explaining votes in plain language" all came back PARTIAL.
- **On chain from the golden run:** four PRIOR marks (cases 1 to 4, including a Persian translation and a podcast), RELATED and CLEARED outcomes, and a withdrawal of 63 GEN by the reference author checked at finality ([`docs/seed.studio-next.json`](docs/seed.studio-next.json)).

## Honest departures

- **The runtime header.** The spec names `py-genlayer:5jycge4q…`. On the day of this build Studio Next answered `invalid_contract runner malformed` for that hash. The contract is pinned to `py-genlayer:babwp9t3…`, the runner the network itself resolves `py-genlayer:latest` to, checked with the network's own `gen_getContractSchemaForCode`. The installed `genvm-lint` does not know that runner, so `scripts/deploy.py` and `scripts/verify.py` lint the same bytes with the one header line swapped.
- **A 48 hour bound on reading.** A challenge nobody could read is voided by the next `judge` call: no model runs, the stake goes back, and the pair can be filed again. It adds a fifth outcome, VOID, so that no money waits forever.
- The seal is over the text exactly as written; stretch goals (versions, group entries, embeds, format registries) are not built.

## Layout

```
contracts/prior.py     one contract, the judge prompt pinned inside
contracts/FROZEN.json  address, deploy tx and sha256 of the exact bytes deployed
tests/                 direct tests (every method, money invariant under random play) and static tests over the source
tests/vectors.json     seal vectors shared with the site
eval/                  golden pairs, held-out pairs, results with transaction hashes
scripts/               chain, deploy, verify, mutate, seed, gen_docs, gen_vectors
web/                   Next.js site and /docs (Fumadocs), genlayer-js 2.0.0-rc.1
submission/            portal text, X post, silent demo script, 512 px logo
```

## Run it

```bash
python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m pytest tests -q          # offline
.venv/Scripts/python scripts/verify.py           # deployed bytes against this repository
.venv/Scripts/python scripts/mutate.py           # break every defence once; refuses to pass if anything escapes
cd web && npm ci && npm run build && npm start   # the site, reading the live contract
node web/scripts/hash-parity.mjs                 # the browser seal against the contract's
```

Keys never live in this repository. Test accounts are kept in `~/.prior/accounts.json`, and the scripts print only addresses. The site holds no key; writes are signed in the visitor's wallet. Tickets (text and salt) live only in the visitor's browser.

## Honest limits

Prior shows who sealed a description first and whether a later one reproduces it. It proves neither authorship nor originality, it gives no legal rights, and a revealed text is public, so authors should seal a description, not a secret. Whether two things overlap is a judgment, which is why the label, both texts and the prompt are all public.
