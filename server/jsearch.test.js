import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { searchJSearch } from "./jsearch.js";

const JOB = {
  job_id: "abc123",
  job_title: "Stagiaire développeur Android",
  employer_name: "Studio Nord",
  job_city: "Montréal",
  job_state: "QC",
  job_is_remote: false,
  job_apply_link: "https://exemple.com/offre",
  job_description: "Kotlin, tests unitaires, Git.",
  job_posted_at_datetime_utc: "2026-10-20T12:00:00.000Z",
  job_publisher: "LinkedIn",
};

let calls;
const realFetch = globalThis.fetch;
const mockFetch = (pages) => {
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: new URL(url), opts });
    return new Response(JSON.stringify({ status: "OK", data: pages.shift() ?? [] }), { status: 200 });
  };
};

beforeEach(() => {
  calls = [];
  process.env.JSEARCH_API_KEY = "cle-de-test";
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("convertit une offre JSearch au format de l'app", async () => {
  mockFetch([[JOB]]);
  const [o] = await searchJSearch({ q: "Stage développeur mobile", city: "Montréal", country: "ca" });
  assert.deepEqual(o, {
    id: "js-abc123",
    title: "Stagiaire développeur Android",
    company: "Studio Nord",
    place: "Montréal, QC",
    url: "https://exemple.com/offre",
    text: "Kotlin, tests unitaires, Git.",
    created: "2026-10-20T12:00:00.000Z",
    origin: "via LinkedIn",
  });
  const { url, opts } = calls[0];
  assert.equal(url.searchParams.get("query"), "Stage développeur mobile Montréal");
  assert.equal(url.searchParams.get("country"), "ca");
  assert.equal(url.searchParams.get("employment_types"), "INTERN");
  assert.equal(opts.headers["X-RapidAPI-Key"], "cle-de-test");
});

test("élargit la recherche quand aucun stage n'est trouvé", async () => {
  mockFetch([[], [JOB]]);
  const offers = await searchJSearch({ q: "Stage Kotlin", city: "", country: "ca" });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url.searchParams.get("employment_types"), null);
  assert.equal(offers.length, 1);
});

test("explique un quota dépassé", async () => {
  globalThis.fetch = async () => new Response("{}", { status: 429 });
  await assert.rejects(searchJSearch({ q: "Stage", country: "ca" }), /Quota JSearch/);
});
