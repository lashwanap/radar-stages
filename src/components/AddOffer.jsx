import { useState } from "react";

const BLANK = { title: "", company: "", place: "", url: "", text: "" };

function splitOffer(raw) {
  const lines = raw.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const url = (raw.match(/https?:\/\/\S+/) || [""])[0];
  return { title: (lines[0] || "Offre sans titre").slice(0, 120), company: "", place: "", url, text: raw.trim() };
}

export default function AddOffer({ onAdd }) {
  const [bulk, setBulk] = useState(false);
  const [offer, setOffer] = useState(BLANK);
  const [bulkText, setBulkText] = useState("");
  const [msg, setMsg] = useState({ text: "", err: false });

  const set = (k) => (e) => setOffer({ ...offer, [k]: e.target.value });

  function submitOne(e) {
    e.preventDefault();
    const text = offer.text.trim();
    if (!text && !offer.title.trim()) return setMsg({ text: "Colle au moins le texte de l'annonce.", err: true });
    onAdd([{ ...offer, title: offer.title.trim() || splitOffer(text).title, text, origin: "Ajout manuel" }]);
    setOffer(BLANK);
    setMsg({ text: "Offre ajoutée.", err: false });
  }

  function submitBulk(e) {
    e.preventDefault();
    const parts = bulkText.split(/\n\s*-{3,}\s*\n/).map((s) => s.trim()).filter((s) => s.length > 20);
    if (!parts.length) return setMsg({ text: "Aucune annonce trouvée. Sépare-les par une ligne ---", err: true });
    onAdd(parts.map((p) => ({ ...splitOffer(p), origin: "Ajout manuel" })));
    setBulkText("");
    setMsg({ text: `${parts.length} offre(s) ajoutée(s).`, err: false });
  }

  return (
    <section className="panel" aria-labelledby="h-add">
      <div className="row between">
        <h2 id="h-add">3. Ajouter une offre</h2>
        <button className="ghost" type="button" aria-expanded={bulk} onClick={() => setBulk(!bulk)}>
          {bulk ? "Ajouter une seule offre" : "Coller plusieurs offres"}
        </button>
      </div>
      {bulk ? (
        <form className="stack tight" onSubmit={submitBulk}>
          <label className="f">
            <span>
              Plusieurs annonces, séparées par une ligne <span className="mono">---</span>
            </span>
            <textarea rows={9} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"Annonce 1 (titre sur la première ligne)…\n---\nAnnonce 2…"} />
          </label>
          <div className="row">
            <button className="primary">Ajouter toutes</button>
            <span className={`status ${msg.err ? "err" : ""}`} role="status">{msg.text}</span>
          </div>
        </form>
      ) : (
        <form className="stack tight" onSubmit={submitOne}>
          <div className="two">
            <label className="f">
              Intitulé
              <input type="text" value={offer.title} onChange={set("title")} placeholder="Stagiaire développeur·se web" />
            </label>
            <label className="f">
              Entreprise
              <input type="text" value={offer.company} onChange={set("company")} placeholder="Nom de l'entreprise" />
            </label>
          </div>
          <div className="two">
            <label className="f">
              Lieu
              <input type="text" value={offer.place} onChange={set("place")} placeholder="Ville, hybride…" />
            </label>
            <label className="f">
              Lien de l'annonce
              <input type="url" value={offer.url} onChange={set("url")} placeholder="https://…" />
            </label>
          </div>
          <label className="f">
            Texte de l'annonce
            <textarea rows={5} value={offer.text} onChange={set("text")} placeholder="Colle la description complète : missions, profil recherché, compétences…" />
          </label>
          <div className="row">
            <button className="primary">Ajouter et noter</button>
            <span className={`status ${msg.err ? "err" : ""}`} role="status">{msg.text}</span>
          </div>
        </form>
      )}
    </section>
  );
}
