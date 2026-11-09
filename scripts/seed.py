#!/usr/bin/env python3
"""
Seed the deployed contract beyond the golden run.

    python scripts/seed.py

The golden run (eval/run_golden.py) already put real entries and challenges on
chain with every verdict: PRIOR, RELATED and CLEARED marks. This script adds
what that run leaves out, from real transactions and saved to
docs/seed.studio-next.json before anything is printed:

  - one entry that stays SEALED (a dotted entry: only its hash and date are public),
    from its own account; it is never revealed
  - the golden author's withdrawal of what the contract owes them, checked after finality
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import chain as C  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
RECORD = C.ROOT / "docs" / "seed.studio-next.json"


def main() -> int:
    address = C.address()
    people = C.accounts("seed_sealed", "golden_author")
    reader = C.Chain()
    record = json.loads(RECORD.read_text(encoding="utf-8")) if RECORD.exists() else {"steps": {}}
    if "sealed_only" not in record["steps"]:
        chain = C.Chain(people["seed_sealed"])
        chain.ensure(people["seed_sealed"].address, minimum_gen=10)
        text = "A short-lived idea that its author keeps to themselves until they decide to reveal it."
        seal = hashlib.sha256(f"{text}|private|{people['seed_sealed'].address.lower()}".encode("utf-8")).hexdigest()
        out = chain.send(address, "register", [seal], value=2 * C.GEN)
        record["steps"]["sealed_only"] = {"ok": out["ok"], "tx": out["hash"], "entry": out["result"], "revealed": False}
        RECORD.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8", newline="\n")
        print(f"  sealed-only entry {out['result']}  {C.EXPLORER}/tx/{out['hash']}")
    if "withdraw_golden_author" not in record["steps"]:
        author = C.Chain(people["golden_author"])
        owed = int(reader.read_json(address, "list_entries", [people["golden_author"].address.lower(), 0, 1])["balance"])
        if owed > 0:
            before = author.balance(people["golden_author"].address)
            out = author.send(address, "withdraw", [])
            author.wait(out["hash"], "finalized")
            after = C.retry("balance", author.balance, people["golden_author"].address)
            record["steps"]["withdraw_golden_author"] = {"ok": out["ok"], "tx": out["hash"], "owed": str(owed), "balance_before": str(before), "balance_after_finality": str(after)}
            RECORD.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8", newline="\n")
            print(f"  withdrew {owed / C.GEN} GEN, wallet {before / C.GEN:.4f} -> {after / C.GEN:.4f} after finality  {C.EXPLORER}/tx/{out['hash']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
