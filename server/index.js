import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText } from "./cv.js";
import { localProfile, localScore } from "./local.js";
import { claudeEnabled, claudeProfile, claudeScores } from "./claude.js";
import { jsearchEnabled, searchJSearch } from "./jsearch.js";
import { LIMITS, perVisitor, dailyBudget } from "./limits.js";

const app = express();
// Derrière le proxy de Render : req.ip doit être l'adresse du visiteur, pas celle du proxy.
app.set("trust proxy", 1);
app.disable("x-powered-by");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.use(express.json({ limit: "2mb" }));
app.use((_req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "DENY" });
  next();
});

const fail = (res, status, message) => res.status(status).json({ error: message });
const claudeBudget = dailyBudget(LIMITS.claudeCallsPerDay);
const searchBudget = dailyBudget(LIMITS.searchesPerDay);
const BUDGET_MSG = "Limite quotidienne d'analyses IA atteinte pour le site ; évaluation par mots-clés en attendant demain.";

app.get("/api/status", (_req, res) => {
  res.json({ claude: claudeEnabled(), search: jsearchEnabled() });
});

app.post("/api/cv/extract", perVisitor({ max: 30 }), upload.single("cv"), async (req, res) => {
  if (!req.file) return fail(res, 400, "Aucun fichier reçu.");
  try {
    res.json({ text: await extractText(req.file) });
  } catch (e) {
    fail(res, 422, e.message);
  }
});

app.post("/api/cv/analyze", perVisitor({ max: LIMITS.analyzePerHour }), async (req, res) => {
  const { cv, form = {} } = req.body;
  if (typeof cv !== "string" || cv.length < 40) return fail(res, 400, "Le texte du CV est vide ou trop court.");
  if (cv.length > LIMITS.maxCvChars) return fail(res, 413, `CV trop long (${cv.length} caractères, ${LIMITS.maxCvChars} au maximum).`);
  if (!claudeEnabled()) return res.json({ profile: localProfile(cv, form.domain) });
  if (!claudeBudget.take()) return res.json({ profile: localProfile(cv, form.domain), warning: BUDGET_MSG });
  try {
    res.json({ profile: await claudeProfile(cv, form) });
  } catch (e) {
    console.error("Analyse Claude :", e.message);
    res.json({ profile: localProfile(cv, form.domain), warning: "Claude indisponible, profil extrait par mots-clés." });
  }
});

app.get("/api/offers/search", perVisitor({ max: LIMITS.searchPerHour }), async (req, res) => {
  if (!jsearchEnabled()) return fail(res, 503, "Recherche automatique désactivée : ajoutez votre clé JSearch (JSEARCH_API_KEY) dans le fichier .env.");
  const { q, city = "", country = "ca" } = req.query;
  if (!q || typeof q !== "string") return fail(res, 400, "Indiquez un intitulé à rechercher.");
  if (q.length > 120 || String(city).length > 80) return fail(res, 400, "Intitulé ou ville trop long.");
  // Une recherche peut faire deux appels JSearch (stages, puis toutes offres).
  if (!searchBudget.take(2)) return fail(res, 503, "Limite quotidienne de recherches atteinte pour le site. Réessayez demain ou ajoutez des offres manuellement.");
  try {
    res.json({ offers: await searchJSearch({ q, city: String(city), country: String(country) }) });
  } catch (e) {
    fail(res, 502, e.message);
  }
});

app.post("/api/offers/score", perVisitor({ max: LIMITS.scorePerHour }), async (req, res) => {
  const { profile, form = {}, offers = [] } = req.body;
  const cv = String(req.body.cv || "").slice(0, LIMITS.maxCvChars);
  if (!profile || !Array.isArray(profile.competences)) return fail(res, 400, "Analysez votre CV avant de noter les offres.");
  if (!Array.isArray(offers)) return fail(res, 400, "Liste d'offres invalide.");
  if (offers.length > LIMITS.maxOffersPerScore)
    return fail(res, 413, `Trop d'offres à la fois (${offers.length}, ${LIMITS.maxOffersPerScore} au maximum). Retirez-en quelques-unes.`);
  const local = () => offers.map((o) => ({ id: o.id, ...localScore(o, profile, form.domain) }));
  if (!claudeEnabled() || !offers.length) return res.json({ scores: local() });
  if (!claudeBudget.take(Math.ceil(offers.length / 15))) return res.json({ scores: local(), warning: BUDGET_MSG });
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

app.use("/api", (_req, res) => fail(res, 404, "Route inconnue."));

// En production, le serveur sert aussi l'interface construite par Vite.
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
app.use(express.static(dist, { maxAge: "1h", setHeaders: (res, p) => /[\\/]assets[\\/]/.test(p) && res.set("Cache-Control", "public, max-age=31536000, immutable") }));
app.get(/^(?!\/api).*/, (_req, res, next) => res.sendFile(path.join(dist, "index.html"), (err) => err && next()));

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Radar à Stages : http://localhost:${port}`);
  console.log(`  Claude : ${claudeEnabled() ? "activé" : "désactivé (notation par mots-clés)"}`);
  console.log(`  JSearch : ${jsearchEnabled() ? "activé" : "désactivé (ajout manuel des offres)"}`);
});
