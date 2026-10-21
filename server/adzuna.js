// Recherche d'offres via l'API Adzuna (https://developer.adzuna.com).

export const adzunaEnabled = () => Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);

const COUNTRIES = new Set(["ca", "fr", "be", "ch"]);

const stripHtml = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function searchAdzuna({ q, city, country = "ca", page = 1 }) {
  if (!COUNTRIES.has(country)) throw new Error(`Pays non pris en charge : ${country}`);
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    what: q,
    results_per_page: "20",
    "content-type": "application/json",
  });
  if (city) params.set("where", city);
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Adzuna a répondu ${res.status}. Vérifie tes clés ADZUNA_APP_ID / ADZUNA_APP_KEY.`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    id: `adz-${r.id}`,
    title: stripHtml(r.title),
    company: r.company?.display_name || "",
    place: r.location?.display_name || "",
    url: r.redirect_url || "",
    text: stripHtml(r.description),
    created: r.created || null,
    origin: "Adzuna",
  }));
}
