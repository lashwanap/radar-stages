// Analyse du CV et notation des offres avec Claude.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { verdictFor } from "./local.js";

const MODEL = "claude-opus-5-5";

export const claudeEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

let client;
const getClient = () => (client ??= new Anthropic());

const ProfileSchema = z.object({
  resume: z.string(),
  niveau: z.string(),
  competences: z.array(z.string()),
  langues: z.array(z.string()),
  intitules: z.array(z.string()),
});

const ScoresSchema = z.object({
  offres: z.array(
    z.object({
      id: z.string(),
      score: z.number(),
      forces: z.array(z.string()),
      manques: z.array(z.string()),
      conseil: z.string(),
    }),
  ),
});

async function ask(prompt, schema) {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: zodOutputFormat(schema) },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude a refusé cette demande.");
  if (response.stop_reason === "max_tokens") throw new Error("Réponse trop longue, coupée.");
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Réponse vide de Claude.");
  return schema.parse(JSON.parse(text));
}

export async function claudeProfile(cv, form) {
  const p = await ask(
    `Tu aides un·e étudiant·e à trouver un stage. Analyse son CV.
Domaine recherché : ${form.domain || "(non précisé, déduis-le du CV)"}
Lieu : ${form.city || "non précisé"} (${form.country})
Période : ${form.period || "non précisée"}

Donne :
- resume : une phrase qui décrit le profil
- niveau : le niveau d'études actuel
- competences : jusqu'à 15 compétences techniques et outils présents dans le CV
- langues : les langues parlées
- intitules : 4 à 6 intitulés de stage à taper dans un moteur de recherche d'emploi (Indeed, LinkedIn…), en français, courts, adaptés au domaine et au pays. Exemple : « Stage développeur web ».

<cv>
${cv}
</cv>`,
    ProfileSchema,
  );
  return { ...p, source: "claude" };
}

export async function claudeScores(profile, cv, form, offers) {
  const list = offers.map((o) => ({
    id: o.id,
    titre: o.title,
    entreprise: o.company,
    lieu: o.place,
    texte: o.text,
  }));
  const { offres } = await ask(
    `Tu es conseiller·ère en recrutement de stagiaires. Note chaque offre de 0 à 100 selon sa correspondance avec le candidat.
Pondération : compétences demandées présentes dans le CV (50 %), adéquation au domaine recherché (25 %), niveau d'études et poste de type stage (15 %), lieu et période (10 %).
Une offre qui n'est pas un stage ou qui est hors domaine doit avoir une note basse.

Domaine recherché : ${form.domain || "non précisé"}
Lieu souhaité : ${form.city || "non précisé"}
Période : ${form.period || "non précisée"}

Profil : ${JSON.stringify(profile)}

<cv>
${cv}
</cv>

<offres>
${JSON.stringify(list)}
</offres>

Pour chaque offre (même id) : score, forces (compétences du candidat qui correspondent, max 5), manques (ce qui manque, max 5), conseil (une phrase concrète pour postuler ou combler l'écart).`,
    ScoresSchema,
  );
  return offres.map((r) => {
    const score = Math.max(0, Math.min(100, Math.round(r.score)));
    return { ...r, score, verdict: verdictFor(score), source: "claude" };
  });
}
