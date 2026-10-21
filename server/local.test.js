import { test } from "node:test";
import assert from "node:assert/strict";
import { localProfile, localScore, hasTerm, norm } from "./local.js";

const CV = "Étudiant en informatique. Compétences : Kotlin, JavaScript, SQL, Git, tests unitaires. Anglais intermédiaire.";

test("hasTerm ne confond pas java et javascript", () => {
  assert.equal(hasTerm(norm("JavaScript et React"), "java"), false);
  assert.equal(hasTerm(norm("Java, Spring"), "java"), true);
});

test("localProfile trouve compétences et langues", () => {
  const p = localProfile(CV, "Développement web");
  assert.ok(p.competences.includes("Kotlin"));
  assert.ok(p.competences.includes("SQL"));
  assert.ok(p.langues.includes("Anglais"));
  assert.equal(p.intitules[0], "Stage Développement web");
});

test("localScore classe mieux une offre qui correspond", () => {
  const p = localProfile(CV, "Développement mobile");
  const bon = localScore({ title: "Stage développeur mobile", text: "Kotlin, Git, tests unitaires, SQL" }, p, "Développement mobile");
  const mauvais = localScore({ title: "Stagiaire comptable", text: "Comptabilité, audit, Excel, SAP" }, p, "Développement mobile");
  assert.ok(bon.score > mauvais.score);
  assert.ok(bon.forces.includes("Kotlin"));
  assert.ok(mauvais.manques.includes("Comptabilité"));
});
