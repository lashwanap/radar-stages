import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText } from "./cv.js";
import { localProfile, localScore } from "./local.js";
import { claudeEnabled, claudeProfile, claudeScores } from "./claude.js";
import { adzunaEnabled, searchAdzuna } from "./adzuna.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.use(express.json({ limit: "2mb" }));

const fail = (res, status, message) => res.status(status).json({ error: message });

app.get("/api/status", (_req, res) => {
  res.json({ claude: claudeEnabled(), adzuna: adzunaEnabled() });
});

app.post("/api/cv/extract", upload.single("cv"), async (req, res) => {
  if (!req.file) return fail(res, 400, "Aucun fichier reçu.");
  try {
    res.json({ text: await extractText(req.file) });
  } catch (e) {
    fail(res, 422, e.message);
  }
});

app.post("/api/cv/analyze", async (req, res) => {
  const { cv, form = {} } = req.body;
  if (!cv || cv.length < 40) return fail(res, 400, "Le texte du CV est vide ou trop court.");
  if (!claudeEnabled()) return res.json({ profile: localProfile(cv, form.domain) });
  try {
    res.json({ profile: await claudeProfile(cv, form) });
  } catch (e) {
    console.error("Analyse Claude :", e.message);
    res.json({ profile: localProfile(cv, form.domain), warning: "Claude indisponible, profil extrait par mots-clés." });
  }
});

app.get("/api/offers/search", async (req, res) => {
  if (!adzunaEnabled()) return fail(res, 503, "Recherche automatique désactivée : ajoute tes clés Adzuna dans le fichier .env.");
  const { q, city = "", country = "ca" } = req.query;
  if (!q) return fail(res, 400, "Indique un intitulé à rechercher.");
  try {
    res.json({ offers: await searchAdzuna({ q, city, country }) });
  } catch (e) {
    fail(res, 502, e.message);
  }
});

app.post("/api/offers/score", async (req, res) => {
  const { profile, cv = "", form = {}, offers = [] } = req.body;
  if (!profile) return fail(res, 400, "Analyse ton CV avant de noter les offres.");
  const local = () => offers.map((o) => ({ id: o.id, ...localScore(o, profile, form.domain) }));
  if (!claudeEnabled() || !offers.length) return res.json({ scores: local() });
  try {
    const scores = [];
    for (let i = 0; i < offers.length; i += 15) {
      scores.push(...(await claudeScores(profile, cv, form, offers.slice(i, i + 15))));
    }
    // Une offre oubliée par Claude reçoit la note par mots-clés.
    const byId = new Map(scores.map((s) => [s.id, s]));
    res.json({ scores: local().map((l) => byId.get(l.id) || l) });
  } catch (e) {
    console.error("Notation Claude :", e.message);
    res.json({ scores: local(), warning: "Claude indisponible, notation par mots-clés." });
  }
});

// En production, le serveur sert aussi l'interface construite par Vite.
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
app.use(express.static(dist));
app.get(/^(?!\/api).*/, (_req, res, next) => res.sendFile(path.join(dist, "index.html"), (err) => err && next()));

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Radar à Stages : http://localhost:${port}`);
  console.log(`  Claude : ${claudeEnabled() ? "activé" : "désactivé (notation par mots-clés)"}`);
  console.log(`  Adzuna : ${adzunaEnabled() ? "activé" : "désactivé (ajout manuel des offres)"}`);
});
