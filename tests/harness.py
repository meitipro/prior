"""
Loads the REAL contract file against the doubles in genvm_double.py.

Nothing is copied or re-implemented here, so a change to contracts/prior.py is
a change to what these tests exercise.
"""

from __future__ import annotations

import datetime
import importlib.util
import json
import os
import pathlib
import sys
import types

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
#: PRIOR_CONTRACT points the suite at a mutant; scripts/mutate.py sets it.
CONTRACT = pathlib.Path(os.environ.get("PRIOR_CONTRACT") or ROOT / "contracts" / "prior.py")

sys.path.insert(0, str(HERE))

import genvm_double as D  # noqa: E402

GEN = 10**18
HOUR = 3600
DAY = 86400
BOND = 2 * GEN
STAKE = 5 * GEN
#: 2026-11-01T00:00:00Z. Every world starts here.
T0 = 1793491200


def _install(gl: D.GL) -> None:
    storage = types.ModuleType("genlayer.storage")
    storage.TreeMap = D.TreeMap
    storage.DynArray = D.DynArray
    storage.allow = D.allow_storage
    module = types.ModuleType("genlayer")
    module.Address = D.Address
    for name in ("u8", "u16", "u32", "u64", "u256"):
        setattr(module, name, getattr(D, name))
    for name in ("contract", "vm", "message", "public", "nondet", "evm"):
        setattr(module, name, getattr(gl, name))
    module.storage = storage
    module.__all__ = ["Address", "u8", "u16", "u32", "u64", "u256"]
    sys.modules["genlayer"] = module
    sys.modules["genlayer.storage"] = storage


def load(gl: D.GL, path: pathlib.Path | None = None, name: str = "prior_contract") -> types.ModuleType:
    _install(gl)
    spec = importlib.util.spec_from_file_location(name, path or CONTRACT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def answer(label: str) -> str:
    return json.dumps({"label": label})


TEXT_A = "A weekly newsletter that turns each governance vote into plain language and adds a table of how the ten largest holders voted, with a note when a holder voted against their usual side."
TEXT_B = "Every Friday we explain the week's protocol votes simply, and show how the top ten token holders voted, flagging anyone who broke from their own pattern."


class World:
    """One Prior contract and the accounts around it. Time is explicit: `at(seconds)` sets the transaction datetime."""

    ADA = "0x" + "3e" * 20
    BOB = "0x" + "77" * 20
    CY = "0x" + "a2" * 20
    STRANGER = "0x" + "d4" * 20

    def __init__(self) -> None:
        self.gl = D.GL()
        self.mod = load(self.gl)
        self.at(T0)
        self.sender(self.ADA)
        self.c = self.mod.Prior()

    def at(self, seconds: int) -> "World":
        self.t = int(seconds)
        stamp = datetime.datetime.fromtimestamp(self.t, datetime.timezone.utc)
        self.gl.message.raw["datetime"] = stamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        return self

    def advance(self, seconds: int) -> "World":
        return self.at(self.t + seconds)

    def sender(self, address: str, value: int = 0) -> "World":
        self.gl.message.sender_address = D.Address(address)
        self.gl.message.origin_address = D.Address(address)
        self.gl.message.value = int(value)
        return self

    @property
    def leader(self) -> D.NodeWorld:
        return self.gl.nondet.leader

    @property
    def validators(self) -> list[D.NodeWorld]:
        return self.gl.nondet.validators

    # -- shorthands --------------------------------------------------------

    def seal_of(self, text: str, salt: str, who: str) -> str:
        return self.mod.seal_hash(text, salt, who)

    def seal(self, text: str = TEXT_A, salt: str = "s1", who=None, bond: int = BOND, raw_seal=None) -> int:
        who = who or self.ADA
        self.sender(who, bond)
        try:
            return int(self.c.register(raw_seal if raw_seal is not None else self.seal_of(text, salt, who)))
        finally:
            self.sender(who)

    def reveal(self, eid: int, text: str = TEXT_A, salt: str = "s1", who=None) -> int:
        self.sender(who or self.ADA)
        return int(self.c.reveal(eid, text, salt))

    def sealed(self, text: str, salt: str = "s1", who=None, bond: int = BOND, reveal: bool = True) -> int:
        eid = self.seal(text, salt, who, bond)
        if reveal:
            self.reveal(eid, text, salt, who)
        return eid

    def pair(self, gap: int = DAY) -> tuple[int, int]:
        """A sealed and revealed, then B sealed `gap` seconds later by BOB and revealed."""
        a = self.sealed(TEXT_A, "s1", self.ADA)
        self.advance(gap)
        b = self.sealed(TEXT_B, "s2", self.BOB)
        return a, b

    def challenge(self, a: int = 1, b: int = 2, who=None, value: int = STAKE) -> int:
        self.sender(who or self.ADA, value)
        try:
            return int(self.c.challenge(a, b))
        finally:
            self.sender(who or self.ADA)

    def queue(self, label: str, validator_label=None) -> None:
        self.leader.answers.append(answer(label))
        for world in self.validators:
            world.answers.append(answer(validator_label or label))

    def judge(self, cid: int, label: str | None = "SUBSTANTIAL", who=None, validator_label=None) -> str:
        if label is not None:
            self.queue(label, validator_label)
        self.sender(who or self.STRANGER)
        return str(self.c.judge(cid))

    def close(self, eid: int, who=None) -> int:
        self.sender(who or self.STRANGER)
        return int(self.c.close_entry(eid))

    def withdraw(self, who: str) -> int:
        self.sender(who)
        return int(self.c.withdraw())

    def entry(self, eid: int) -> dict:
        return json.loads(self.c.get_entry(eid))

    def chal(self, cid: int = 1) -> dict:
        return json.loads(self.c.get_challenge(cid))

    def listing(self, address: str = "", offset: int = 0, limit: int = 50) -> dict:
        return json.loads(self.c.list_entries(address, offset, limit))

    def marks(self, eid: int) -> dict:
        return json.loads(self.c.list_marks(eid))

    def totals(self) -> dict:
        return json.loads(self.c.get_entry(0))["totals"]

    def balance_of(self, address: str) -> int:
        return int(self.listing(address)["balance"])

    def paid_to(self, address: str) -> int:
        return sum(t.value for t in self.gl.bus.transfers if t.to.lower() == address.lower())

    def paid_out(self) -> int:
        return sum(t.value for t in self.gl.bus.transfers)


def refused(prefix: str, fn, *args, **kwargs) -> str:
    try:
        fn(*args, **kwargs)
    except D.UserError as error:
        message = str(error)
        assert message.startswith("[EXPECTED] "), f"unprefixed refusal: {message}"
        assert prefix in message, f"expected {prefix!r}, got {message!r}"
        return message
    raise AssertionError(f"expected a refusal containing {prefix!r}, nothing was raised")
