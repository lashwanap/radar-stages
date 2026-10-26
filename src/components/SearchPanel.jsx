import { useState } from "react";
import { api } from "../api.js";
import { searchLinks } from "../sites.js";

export default function SearchPanel({ profile, form, search, onFound }) {
  const queries = profile?.intitules?.length ? profile.intitules : [`Stage ${form.domain || "informatique"}`];
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", err: false });
  const q = queries[Math.min(current, queries.length - 1)];

  async function autoSearch() {
    setBusy(true);
    setMsg({ text: `Recherche « ${q} »…`, err: false });
    try {
      const { offers } = await api.searchOffers({ q, city: form.city, country: form.country });
      const added = onFound(offers);
      setMsg({
        text: offers.length
          ? `${offers.length} offre(s) trouvée(s), ${added} nouvelle(s) ajoutée(s) et en cours de notation.`
          : "Aucune offre trouvée. Essaie un autre intitulé ou une autre ville.",
        err: false,
      });
    } catch (e) {
      setMsg({ text: e.message, err: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="h-search">
      <h2 id="h-search">2. Chercher les offres</h2>
      <p className="note">Choisis un intitulé, puis lance la recherche automatique ou ouvre les sites d'offres.</p>
      <div className="queries">
        {queries.map((text, i) => (
          <button key={text} type="button" aria-pressed={i === current} onClick={() => setCurrent(i)}>
            {text}
          </button>
        ))}
      </div>
      <button className="primary" onClick={autoSearch} disabled={busy || !search} title={search ? "" : "Ajoute ta clé JSearch dans .env"}>
        {busy ? "Recherche…" : "Trouver et noter les offres"}
      </button>
      {!search && <p className="note">Recherche automatique désactivée : ajoute ta clé JSearch (JSEARCH_API_KEY) dans le fichier .env.</p>}
      <div className={`status ${msg.err ? "err" : ""}`} role="status">
        {msg.text}
      </div>
      <span className="label">Ou cherche sur les sites</span>
      <div className="links">
        {searchLinks(q, form.city || "", form.country || "ca").map(([name, href]) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer">
            <b>{name}</b>
            <span>↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
