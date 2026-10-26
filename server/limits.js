// Protections pour un déploiement public : chaque appel à Claude ou à JSearch est payé par le propriétaire.

const num = (name, fallback) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

export const LIMITS = {
  // Par visiteur (adresse IP), par heure.
  analyzePerHour: num("LIMIT_ANALYZE_PER_HOUR", 10),
  scorePerHour: num("LIMIT_SCORE_PER_HOUR", 20),
  searchPerHour: num("LIMIT_SEARCH_PER_HOUR", 10),
  // Pour tout le site, par jour (remis à zéro à minuit UTC).
  claudeCallsPerDay: num("LIMIT_CLAUDE_CALLS_PER_DAY", 300),
  searchesPerDay: num("LIMIT_SEARCHES_PER_DAY", 20),
  // Taille des entrées.
  maxCvChars: 20000,
  maxOffersPerScore: 30,
};

// Limite par visiteur sur une fenêtre fixe. Mémoire seulement : remise à zéro au redémarrage, suffisant pour une instance.
export function perVisitor({ max, windowMs = 3600_000, now = Date.now }) {
  const hits = new Map();
  return (req, res, next) => {
    const t = now();
    const key = req.ip || "inconnu";
    let entry = hits.get(key);
    if (!entry || t >= entry.reset) {
      entry = { count: 0, reset: t + windowMs };
      hits.set(key, entry);
    }
    if (hits.size > 10_000) for (const [k, e] of hits) if (t >= e.reset) hits.delete(k);
    if (++entry.count > max) {
      const minutes = Math.ceil((entry.reset - t) / 60_000);
      res.set("Retry-After", String(Math.ceil((entry.reset - t) / 1000)));
      return res.status(429).json({ error: `Trop de demandes. Réessayez dans ${minutes} min.` });
    }
    next();
  };
}

// Budget quotidien partagé par tous les visiteurs.
export function dailyBudget(max, now = Date.now) {
  let day = "";
  let used = 0;
  const today = () => new Date(now()).toISOString().slice(0, 10);
  return {
    take(n = 1) {
      if (today() !== day) {
        day = today();
        used = 0;
      }
      if (used + n > max) return false;
      used += n;
      return true;
    },
    get remaining() {
      return today() === day ? max - used : max;
    },
  };
}
