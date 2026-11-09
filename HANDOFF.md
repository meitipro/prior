# Handoff

Only the user can do these:

- Send the portal entry (`submission/portal.md`, counted with `python submission/count.py`) and the X post (`submission/x-post.md`).
- Record the silent demo from `submission/demo-script.md`.

Worth knowing:

- The runtime header differs from the spec's, because Studio Next rejects the spec's hash today. See the README, "Honest departures".
- The golden misses (cases 7 and 9) are published as they came out and were not tuned.
- Test keys live in `~/.prior/accounts.json`, outside the repository. Nothing prints a key.
- Two mutants of the first list were dropped because their check is redundant in the deployed contract: `(not b.closed)` is implied by `bond_left > 0` (closing zeroes the bond), and an unrevealed entry's text is already empty. Neither is a gap; the contract was not changed.
