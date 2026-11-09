"""
Read an entry's seal, date, text and marks from Python, with genlayer-py 0.19.0rc2.

    python web/examples/read_entry.py <entry id>

genlayer-py reads through an account even for views, so a throwaway one is
made here; it is never funded and never signs. This file is the Python sample
on the docs page "Challenge a copy", copied in by scripts/gen_docs.py.
"""

import json
import sys

from genlayer_py import create_account, create_client
from genlayer_py.chains import studio_devnet

PRIOR = "0xCc03C597dE98A0ecDEFBd500bbCF6314fCf03da4"
studio_devnet.rpc_urls = {"default": {"http": ["https://studio-next.genlayer.com/api"]}}

reader = create_account()
client = create_client(chain=studio_devnet, account=reader)
entry_id = int(sys.argv[1] if len(sys.argv) > 1 else 1)
e = json.loads(client.read_contract(address=PRIOR, function_name="get_entry", args=[entry_id], account=reader))

if not e["found"]:
    raise SystemExit("no such entry")
print(json.dumps({
    "state": e["state"],
    "sealed_at": e["sealed_at"],
    "bond_gen": int(e["bond"]) / 10**18,
    "text": e["text"],
    "overlaps": e["overlaps"],
    "related": e["related"],
    "cleared": e["cleared"],
}, ensure_ascii=False))
