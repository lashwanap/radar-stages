import { useEffect, useRef, useState } from "react";
import { Cross } from "./Icons.jsx";

const BLANK = { title: "", company: "", place: "", url: "", text: "" };

function splitOffer(raw) {
  const lines = raw.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const url = (raw.match(/https?:\/\/\S+/) || [""])[0];
  return { title: (lines[0] || "Offre sans titre").slice(0, 120), company: "", place: "", url, text: raw.trim() };
}

export default function AddOfferDialog({ open, onClose, onAdd }) {
  const ref = useRef(null);
  const [bulk, setBulk] = useState(false);
  const [offer, setOffer] = useState(BLANK);
  const [bulkText, setBulkText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const set = (k) => (e) => setOffer({ ...offer, [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    if (bulk) {
      const parts = bulkText.split(/\n\s*-{3,}\s*\n/).map((s) => s.trim()).filter((s) => s.length > 20);
      if (!parts.length) return setError("Aucune annonce détectée. Séparez chaque annonce par une ligne contenant ---");
      onAdd(parts.map((p) => ({ ...splitOffer(p), origin: "Ajout manuel" })));
      setBulkText("");
    } else {
      const text = offer.text.trim();
      if (!text && !offer.title.trim()) return setError("Renseignez au moins l'intitulé ou la description de l'offre.");
      onAdd([{ ...offer, title: offer.title.trim() || splitOffer(text).title, text, origin: "Ajout manuel" }]);
      setOffer(BLANK);
    }
    setError("");
    onClose();
  }

  return (
    <dialog ref={ref} className="modal" onClose={onClose} aria-labelledby="h-add">
      <form onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2 id="h-add">Ajouter une offre</h2>
            <p>Collez une annonce trouvée sur un site d'emploi : elle sera évaluée par rapport à votre profil.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" aria-label="Fermer" onClick={onClose}>
            <Cross />
          </button>
        </div>
        <div className="modal-body">
          <div className="segmented" role="group" aria-label="Mode d'ajout">
            <button type="button" aria-pressed={!bulk} onClick={() => setBulk(false)}>Une offre</button>
            <button type="button" aria-pressed={bulk} onClick={() => setBulk(true)}>Plusieurs offres</button>
          </div>
          {bulk ? (
            <label className="field">
              Annonces
              <textarea className="textarea" rows={10} value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Première annonce (intitulé sur la première ligne)…\n---\nDeuxième annonce…"} />
              <span className="hint">Séparez chaque annonce par une ligne contenant --- ; la première ligne sert d'intitulé.</span>
            </label>
          ) : (
            <>
              <div className="field-row">
                <label className="field">
                  Intitulé
                  <input className="input" type="text" value={offer.title} onChange={set("title")} placeholder="Ex. : stagiaire développeur Android" />
                </label>
                <label className="field">
                  Entreprise
                  <input className="input" type="text" value={offer.company} onChange={set("company")} placeholder="Nom de l'entreprise" />
                </label>
              </div>
              <div className="field-row">
                <label className="field">
                  Lieu
                  <input className="input" type="text" value={offer.place} onChange={set("place")} placeholder="Ville, hybride, télétravail…" />
                </label>
                <label className="field">
                  Lien de l'annonce
                  <input className="input" type="url" value={offer.url} onChange={set("url")} placeholder="https://…" />
                </label>
              </div>
              <label className="field">
                Description
                <textarea className="textarea" rows={7} value={offer.text} onChange={set("text")}
                  placeholder="Missions, profil recherché, compétences demandées…" />
              </label>
            </>
          )}
          {error && <div className="message error" role="alert">{error}</div>}
        </div>
        <div className="modal-foot">
          <span className="hint">Le score est calculé automatiquement après l'ajout.</span>
          <div className="search-actions">
            <button type="button" className="btn" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">{bulk ? "Ajouter les offres" : "Ajouter l'offre"}</button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
