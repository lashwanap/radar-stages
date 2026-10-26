import { test } from "node:test";
import assert from "node:assert/strict";
import { perVisitor, dailyBudget } from "./limits.js";

function fakeRes() {
  return {
    code: 200,
    headers: {},
    body: null,
    set(k, v) { this.headers[k] = v; return this; },
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test("perVisitor bloque au-delà du maximum puis repart après la fenêtre", () => {
  let t = 0;
  const limit = perVisitor({ max: 2, windowMs: 1000, now: () => t });
  const call = (ip) => {
    const res = fakeRes();
    let passed = false;
    limit({ ip }, res, () => (passed = true));
    return { passed, res };
  };
  assert.equal(call("1.1.1.1").passed, true);
  assert.equal(call("1.1.1.1").passed, true);
  const third = call("1.1.1.1");
  assert.equal(third.passed, false);
  assert.equal(third.res.code, 429);
  assert.match(third.res.body.error, /Trop de demandes/);
  assert.equal(call("2.2.2.2").passed, true, "un autre visiteur n'est pas bloqué");
  t = 1000;
  assert.equal(call("1.1.1.1").passed, true, "la fenêtre est repartie");
});

test("dailyBudget s'épuise et se recharge le lendemain", () => {
  let t = Date.parse("2026-10-26T10:00:00Z");
  const b = dailyBudget(3, () => t);
  assert.equal(b.take(2), true);
  assert.equal(b.take(2), false, "pas assez de budget pour 2 de plus");
  assert.equal(b.take(1), true);
  assert.equal(b.remaining, 0);
  t = Date.parse("2026-10-27T00:00:01Z");
  assert.equal(b.remaining, 3);
  assert.equal(b.take(3), true);
});
