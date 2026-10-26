import { useState } from "react";
import { api } from "../api.js";
import { searchLinks } from "../sites.js";
import { Search, External, Plus } from "./Icons.jsx";

export default function SearchPanel({ profile, form, search, onFound, onAdd, notify }) {
  const queries = profile?.intitules?.length ? profile.intitules : [`Stage ${form.domain || "informatique"}`];
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState(false);
  const q = queries[Math.min(current, queries.length - 1)];

  async function autoSearch() {
    setBusy(true);
    try {
      const { offers } = await api.searchOffers({ q, city: form.city, country: form.country });
      const added = onFound(offers);
      if (!offers.length) notify(`Aucune offre trouvée pour « ${q} ». Essayez un autre intitulé ou une autre ville.`);
      else notify(`${offers.length} offres trouvées, dont ${added} nouvelle${added > 1 ? "s" : ""}. Calcul des scores en cours.`, "success");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" aria-labelledby="h-search">
      <div className="card-body">
        <div className="search-head">
          <div>
            <h1 id="h-search">Offres de stage</h1>
            <p>
              {form.city ? `${q} · ${form.city}` : q}
              {!profile && " · analysez votre CV pour des intitulés personnalisés"}
            </p>
          </div>
          <div className="search-actions">
            <button className="btn" type="button" onClick={onAdd}>
              <Plus /> Ajouter une offre
            </button>
            <button className="btn btn-primary" type="button" onClick={autoSearch} disabled={busy || !search}
              title={search ? undefined : "Ajoutez JSEARCH_API_KEY dans le fichier .env pour activer la recherche"}>
              {busy ? <span className="spinner" /> : <Search />}
              {busy ? "Recherche…" : "Rechercher des offres"}
            </button>
          </div>
        </div>

        <div className="field">
          <span className="eyebrow">Intitulés suggérés</span>
          <div className="queries" role="group" aria-label="Intitulé recherché">
            {queries.map((text, i) => (
              <button key={text} type="button" className="query" aria-pressed={i === current} onClick={() => setCurrent(i)}>
                {text}
              </button>
            ))}
          </div>
        </div>

        {!search && (
          <div className="message">
            Recherche automatique inactive : ajoutez votre clé JSearch (<span className="mono">JSEARCH_API_KEY</span>) dans le
            fichier <span className="mono">.env</span>. Vous pouvez aussi ajouter des offres manuellement.
          </div>
        )}

        <div className="sites">
          <span>Ouvrir sur :</span>
          {searchLinks(q, form.city || "", form.country || "ca").map(([name, href]) => (
            <a key={name} className="site-link" href={href} target="_blank" rel="noopener noreferrer">
              {name} <External size={12} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
