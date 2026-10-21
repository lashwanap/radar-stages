import { useState } from "react";
import { Chips } from "./ProfileCard.jsx";

const tone = (s) => (s >= 75 ? "good" : s >= 50 ? "mid" : "low");

function Ring({ offer }) {
  if (offer.pending) return <div className="ring none" title="Notation en cours"><i>…</i></div>;
  if (offer.score == null) return <div className="ring none"><i>—</i></div>;
  return (
    <div className="ring" style={{ "--c": `var(--${tone(offer.score)})`, "--p": offer.score }} aria-label={`Correspondance ${offer.score} %`}>
      <i>{offer.score}</i>
    </div>
  );
}

function OfferCard({ offer, top, onRemove }) {
  return (
    <article className={`offer ${top ? "top" : ""}`}>
      <Ring offer={offer} />
      <div className="offer-body">
        <h3>{offer.title}</h3>
        <div className="meta">
          {offer.company && <span>{offer.company}</span>}
          {offer.place && <span>{offer.place}</span>}
          {offer.origin && <span className="mono small">{offer.origin}</span>}
          {offer.pending ? (
            <span>Notation en cours…</span>
          ) : (
            offer.verdict && <span className={`verdict v-${tone(offer.score)}`}>{offer.verdict}</span>
          )}
        </div>
        {offer.forces?.length > 0 && <Chips items={offer.forces.map((f) => `✓ ${f}`)} kind="ok" />}
        {offer.manques?.length > 0 && <Chips items={offer.manques.map((f) => `✗ ${f}`)} kind="miss" />}
        {offer.conseil && <div className="advice">{offer.conseil}</div>}
        <div className="offer-actions">
          {offer.text && (
            <details>
              <summary>Voir l'annonce</summary>
              <pre>{offer.text}</pre>
            </details>
          )}
          {/^https?:\/\//.test(offer.url || "") && (
            <a href={offer.url} target="_blank" rel="noopener noreferrer">
              Ouvrir l'annonce ↗
            </a>
          )}
          <button className="ghost" type="button" onClick={() => onRemove(offer.id)}>
            Retirer
          </button>
        </div>
      </div>
    </article>
  );
}

export default function OfferList({ offers, note, onRemove, onRescore, onClear }) {
  const [min, setMin] = useState(0);
  const [sort, setSort] = useState("score");
  const [confirmClear, setConfirmClear] = useState(false);

  const scored = offers.filter((o) => o.score != null);
  const shown = offers
    .filter((o) => o.pending || o.score == null || o.score >= min)
    .sort((a, b) => (sort === "recent" ? b.added - a.added : (b.score ?? -1) - (a.score ?? -1)));
  const best = Math.max(0, ...scored.map((o) => o.score));
  const avg = scored.length ? Math.round(scored.reduce((s, o) => s + o.score, 0) / scored.length) : null;

  return (
    <section className="panel" aria-labelledby="h-list">
      <div className="toolbar">
        <h2 id="h-list">Offres classées</h2>
        <div className="row">
          <label>
            Score min <input type="range" min="0" max="90" step="5" value={min} onChange={(e) => setMin(+e.target.value)} />
            <span className="mono">{min}</span>
          </label>
          <label>
            Tri
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="score">Meilleur match</option>
              <option value="recent">Plus récentes</option>
            </select>
          </label>
          <button type="button" onClick={onRescore} disabled={!offers.length}>
            Re-noter tout
          </button>
          {offers.length > 0 &&
            (confirmClear ? (
              <>
                <button type="button" className="danger" onClick={() => (onClear(), setConfirmClear(false))}>
                  Oui, tout retirer
                </button>
                <button type="button" className="ghost" onClick={() => setConfirmClear(false)}>
                  Annuler
                </button>
              </>
            ) : (
              <button type="button" className="ghost" onClick={() => setConfirmClear(true)}>
                Tout retirer
              </button>
            ))}
        </div>
      </div>
      <div className="summary">
        <div><b>{offers.length}</b>offres</div>
        <div><b>{scored.filter((o) => o.score >= 75).length}</b>excellents matchs</div>
        <div><b>{avg == null ? "—" : `${avg}%`}</b>match moyen</div>
        {note && <div className="note center">{note}</div>}
      </div>
      <div className="offers">
        {!offers.length ? (
          <div className="empty">Aucune offre pour l'instant. Lance une recherche à l'étape 2 ou colle une annonce à l'étape 3.</div>
        ) : !shown.length ? (
          <div className="empty">Aucune offre au-dessus de {min} %. Baisse le score minimum.</div>
        ) : (
          shown.map((o) => <OfferCard key={o.id} offer={o} top={best >= 75 && o.score === best} onRemove={onRemove} />)
        )}
      </div>
    </section>
  );
}
