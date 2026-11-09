#!/usr/bin/env python3
"""
Run the golden pairs through the deployed Prior contract on Studio Next,
through real consensus, and publish what came out.

    python eval/run_golden.py --lock       # hash and timestamp eval/golden.json, once, before the first run
    python eval/run_golden.py              # the ten golden cases
    python eval/run_golden.py H1 H2 H3     # the held-out cases, once
    python eval/run_golden.py --report     # rewrite results.md from results.json

eval/golden.json was written, hashed and timestamped before the first run, and
this script refuses to run if it has changed since. One account, golden_author,
seals and reveals the reference text A once. For every case a copyist account
then seals and reveals the later text (so its seal is later by chain time), the
author stakes 5 GEN against it, and a fourth account calls judge. The label is
read back from the contract with get_challenge. Every step is saved before
anything is printed, so a run can stop at any point and resume without sending
anything twice. H1 to H3 are held out: run once, reported as they came out.
"""

from __future__ import annotations

import ast
import datetime
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "scripts"))

import chain as C  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = pathlib.Path(__file__).resolve().parent
GOLDEN, LOCK, RESULTS, REPORT = HERE / "golden.json", HERE / "golden.lock.json", HERE / "results.json", HERE / "results.md"
AUTHOR, JUDGE = "golden_author", "golden_judge"
COPYISTS = ["golden_copyist_1", "golden_copyist_2", "golden_copyist_3"]
FINAL = ("SUBSTANTIAL", "PARTIAL", "NONE")


def seal_of(text: str, salt: str, address: str) -> str:
    return hashlib.sha256(f"{text}|{salt}|{address.lower()}".encode("utf-8")).hexdigest()


def judge_sha() -> str:
    tree = ast.parse(C.CONTRACT_FILE.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and ast.unparse(node.targets[0]) == "JUDGE":
            return hashlib.sha256(ast.literal_eval(node.value).encode("utf-8")).hexdigest()
    raise SystemExit("no JUDGE constant")


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_results() -> dict:
    return json.loads(RESULTS.read_text(encoding="utf-8")) if RESULTS.exists() else {"reference": {}, "cases": {}, "attempts": []}


def save(results: dict) -> None:
    RESULTS.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def finished(results: dict, case_id: str) -> bool:
    return any(a["case"] == case_id and a.get("label") in FINAL for a in results["attempts"])


def must(outcome: dict, what: str) -> dict:
    if not outcome["ok"]:
        raise SystemExit(f"{what} failed: {outcome['detail']}  {C.EXPLORER}/tx/{outcome['hash']}")
    return outcome


def matches(a: dict) -> bool:
    return a.get("label") in FINAL if a["expected"] == "EITHER" else a.get("label") == a["expected"]


def lock() -> None:
    if LOCK.exists():
        raise SystemExit("eval/golden.lock.json already exists; the golden set is locked once")
    LOCK.write_text(json.dumps({"file": "eval/golden.json", "sha256": C.sha256_file(GOLDEN), "locked_at": now_iso()}, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"locked eval/golden.json  sha256 {C.sha256_file(GOLDEN)}")


def seal_and_reveal(chain: C.Chain, address: str, text: str, salt: str) -> dict:
    who = chain.account.address
    sealed = must(chain.send(address, "register", [seal_of(text, salt, who)], value=2 * C.GEN), "register")
    eid = int(sealed["result"])
    revealed = must(chain.send(address, "reveal", [eid, text, salt]), "reveal")
    return {"entry": eid, "seal_tx": sealed["hash"], "reveal_tx": revealed["hash"]}


def run_case(case: dict, index: int, results: dict, address: str, golden: dict, author: C.Chain, judge: C.Chain, copyists: dict, reader: C.Chain) -> None:
    cid = case["id"]
    who = copyists[COPYISTS[index % len(COPYISTS)]]
    row = results["cases"].setdefault(cid, {"copyist": who.account.address})
    a_id = results["reference"]["entry"]
    if "entry" not in row:
        row.update(seal_and_reveal(who, address, case["later"], "g" + cid))
        save(results)
        print(f"  sealed and revealed as entry {row['entry']}  {C.EXPLORER}/tx/{row['seal_tx']}")
    if "challenge_id" not in row:
        outcome = must(author.send(address, "challenge", [a_id, row["entry"]], value=5 * C.GEN), f"challenge for case {cid}")
        row.update({"challenge_tx": outcome["hash"], "challenge_id": int(outcome["result"])})
        save(results)
        print(f"  challenged as {row['challenge_id']}  {C.EXPLORER}/tx/{outcome['hash']}")
    attempt = {"case": cid, "attempt": sum(1 for a in results["attempts"] if a["case"] == cid) + 1, "held_out": bool(case.get("held_out")), "expected": case["expected"], "challenge_id": row["challenge_id"]}
    outcome = judge.send(address, "judge", [row["challenge_id"]])
    attempt.update({"tx": outcome["hash"], "sent_at": now_iso(), "consensus": "decided" if outcome["ok"] else outcome["detail"]})
    read = reader.read_json(address, "get_challenge", [row["challenge_id"]])
    if read["label"] in FINAL:
        attempt.update({"label": read["label"], "verdict": read["verdict"], "to_challenger": read["to_challenger"], "to_accused": read["to_accused"], "seconds_between": read["seconds_between"]})
    results["attempts"].append(attempt)
    save(results)
    print(f"  {'MATCH' if matches(attempt) else 'MISS '} {attempt.get('label') or 'no label: ' + attempt['consensus']} -> {attempt.get('verdict', '')}")
    print(f"  {C.EXPLORER}/tx/{attempt['tx']}")


def run(ids: list[str]) -> None:
    lock_data = json.loads(LOCK.read_text(encoding="utf-8"))
    if C.sha256_file(GOLDEN) != lock_data["sha256"]:
        raise SystemExit("eval/golden.json changed after it was locked; the golden set is not edited after the first run")
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    address = C.address()
    people = C.accounts(AUTHOR, JUDGE, *COPYISTS)
    author, judge, reader = C.Chain(people[AUTHOR]), C.Chain(people[JUDGE]), C.Chain()
    copyists = {n: C.Chain(people[n]) for n in COPYISTS}
    results = load_results()
    results.update({"contract": address, "contract_sha256": C.deployment().get("prior_sha256"), "golden_sha256": lock_data["sha256"], "golden_locked_at": lock_data["locked_at"], "judge_sha256": judge_sha(), "network": C.NETWORK, "explorer": C.EXPLORER, "author": people[AUTHOR].address})
    save(results)
    wanted = ids or [c["id"] for c in golden["cases"] if not c.get("held_out")]
    todo = [(i, c) for i, c in enumerate(golden["cases"]) if c["id"] in wanted and not finished(results, c["id"])]
    if todo:
        author.ensure(people[AUTHOR].address, minimum_gen=80)
        judge.ensure(people[JUDGE].address, minimum_gen=20)
        for n in COPYISTS:
            copyists[n].ensure(people[n].address, minimum_gen=40)
        if "entry" not in results["reference"]:
            results["reference"] = seal_and_reveal(author, address, golden["reference"], "gref")
            save(results)
            print(f"reference entry {results['reference']['entry']} sealed and revealed  {C.EXPLORER}/tx/{results['reference']['seal_tx']}")
    for index, case in todo:
        print(f"\n{case['id']} {case['title']} (expected {case['expected']})")
        run_case(case, index, results, address, golden, author, judge, copyists, reader)
    report()


def report() -> None:
    results = load_results()
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    final = {a["case"]: a for a in results["attempts"] if a.get("label") in FINAL}
    scored = [a for a in final.values() if not a["held_out"]]
    hit = sum(1 for a in scored if matches(a))
    explorer = results.get("explorer", C.EXPLORER)
    contract = results.get("contract", "")
    lines = [
        "# Golden pairs, through real consensus", "",
        f"Contract [`{contract}`]({explorer}/address/{contract}) on Studio Next (chain 61997). The reference entry A is sealed and revealed once; every case seals the later text from its own account after that, so its seal is later by chain time, the author of A stakes 5 GEN against it, and one `judge` transaction asks the validators. The label is read back from the contract with `get_challenge`. Cases are scored on the one label, and the earlier text is always TEXT 1.", "",
        f"- Golden set: **{hit} of {len(scored)}** matched.",
        f"- Held-out cases: **{sum(1 for a in final.values() if a['held_out'])} run**, labels exactly as they came out (no expected answer, so none is scored).",
        f"- `eval/golden.json` sha256 `{results.get('golden_sha256', '')}`, locked at {results.get('golden_locked_at', '')}, before the first run.",
        f"- Judge prompt sha256 `{results.get('judge_sha256', '')}`.", "",
        "Nothing here was tuned. The prompt is the spec's, word for word, and no case was edited after the lock.", "",
        "| Case | Later text | Expected | Got | Verdict | Transaction |", "|---|---|---|---|---|---|",
    ]
    for case in golden["cases"]:
        a = final.get(case["id"])
        tag = case["id"] + (" (held out)" if case.get("held_out") else "")
        text = case["later"].replace("|", "/")
        if not a:
            lines.append(f"| {tag} | {text} | {case['expected']} | not run yet | | |")
            continue
        mark = "" if case["expected"] == "EITHER" else (" ✓" if matches(a) else " ✗ miss")
        lines.append(f"| {tag} | {text} | {case['expected']} | {a['label']}{mark} | {a['verdict']} | [{a['tx'][:10]}…]({explorer}/tx/{a['tx']}) |")
    others = [a for a in results["attempts"] if a.get("label") not in FINAL]
    lines += ["", "## Every attempt", ""]
    lines += [f"- case {a['case']} attempt {a['attempt']}: {a['consensus'][:200]} ([tx]({explorer}/tx/{a['tx']}))" for a in others] or ["Every judge produced a label on its first attempt; nothing was sent twice."]
    ref = results.get("reference", {})
    if ref.get("seal_tx"):
        lines += ["", "## Entries", "", f"- reference entry {ref['entry']}: sealed [{ref['seal_tx'][:10]}…]({explorer}/tx/{ref['seal_tx']}), revealed [{ref['reveal_tx'][:10]}…]({explorer}/tx/{ref['reveal_tx']})"]
    for case in golden["cases"]:
        row = results.get("cases", {}).get(case["id"])
        if row and "challenge_tx" in row:
            lines.append(f"- case {case['id']}: entry {row['entry']} sealed [{row['seal_tx'][:10]}…]({explorer}/tx/{row['seal_tx']}), challenge {row['challenge_id']} [{row['challenge_tx'][:10]}…]({explorer}/tx/{row['challenge_tx']})")
    lines.append("")
    REPORT.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"\nwrote eval/results.md: golden {hit}/{len(scored)}")


if __name__ == "__main__":
    if "--lock" in sys.argv:
        lock()
    elif "--report" in sys.argv:
        report()
    else:
        run([a for a in sys.argv[1:] if not a.startswith("--")])
