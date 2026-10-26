// Recherche d'offres via JSearch (RapidAPI), qui agrège Google Emplois : Indeed, LinkedIn, Glassdoor…
// https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch

export const jsearchEnabled = () => Boolean(process.env.JSEARCH_API_KEY);

const HOST = "jsearch.p.rapidapi.com";
const COUNTRIES = new Set(["ca", "fr", "be", "ch"]);
// Les descriptions peuvent être très longues : on garde l'essentiel pour la notation.
const MAX_TEXT = 6000;

async function query(params) {
  const res = await fetch(`https://${HOST}/search?${new URLSearchParams(params)}`, {
    headers: { "X-RapidAPI-Key": process.env.JSEARCH_API_KEY, "X-RapidAPI-Host": HOST },
  });
  if (res.status === 401 || res.status === 403) throw new Error("JSearch refuse la clé. Vérifie JSEARCH_API_KEY et ton abonnement à JSearch sur RapidAPI.");
  if (res.status === 429) throw new Error("Quota JSearch atteint pour ce mois-ci (ou trop de recherches d'affilée).");
  if (!res.ok) throw new Error(`JSearch a répondu ${res.status}.`);
  return (await res.json()).data || [];
}

export async function searchJSearch({ q, city, country = "ca" }) {
  if (!COUNTRIES.has(country)) throw new Error(`Pays non pris en charge : ${country}`);
  const params = {
    query: city ? `${q} ${city}` : q,
    country,
    language: "fr",
    page: "1",
    num_pages: "1",
    date_posted: "month",
  };
  // D'abord les offres marquées « stage » ; si rien ne sort, on élargit à toutes les offres.
  let jobs = await query({ ...params, employment_types: "INTERN" });
  if (!jobs.length) jobs = await query(params);
  return jobs.map((j) => ({
    id: `js-${j.job_id}`,
    title: j.job_title || "Offre sans titre",
    company: j.employer_name || "",
    place: [j.job_city, j.job_state].filter(Boolean).join(", ") + (j.job_is_remote ? " · télétravail" : ""),
    url: j.job_apply_link || "",
    text: (j.job_description || "").slice(0, MAX_TEXT),
    created: j.job_posted_at_datetime_utc || null,
    origin: j.job_publisher ? `via ${j.job_publisher}` : "JSearch",
  }));
}
