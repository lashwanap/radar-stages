import { useState } from "react";
import { Tags } from "./ProfileCard.jsx";
import { Building, Pin, Clock, External, Trash, Refresh, Search, Check, Cross, Bulb, Chevron, Radar, Plus } from "./Icons.jsx";

const tone = (s) => (s >= 75 ? "good" : s >= 50 ? "mid" : "low");
const FILTERS = [
  [0, "Toutes"],
  [50, "50 % et +"],
  [75, "75 % et +"],
];

function ago(offer) {
  const t = offer.created ? Date.parse(offer.created) : offer.added;
  if (!t) return "";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} jours`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

function Score({ offer }) {
  if (offer.pending) return <div className="score"><div className="score-pending" aria-label="Score en cours de calcul" /></div>;
  if (offer.score == null) return <div className="score"><span className="verdict v-mid">Non évaluée</span></div>;
  return (
    <div className="score">
      <div className="score-ring" style={{ "--c": `var(--${tone(offer.score)})`, "--p": offer.score }}>
        <span aria-label={`Correspondance de ${offer.score} %`}>{offer.score}</span>
      </div>
      <span className={`verdict v-${tone(offer.score)}`}>{offer.verdict}</span>
    </div>
  );
}

function OfferCard({ offer, best, onRemove }) {
  const [open, setOpen] = useState(false);
  const initial = (offer.company || offer.title || "?").trim()[0].toUpperCase();
  const hasMatch = offer.forces?.length || offer.manques?.length;

  return (
    <article className={`card offer ${best ? "best" : ""} ${open ? "open" : ""}`}>
      <div className="avatar" aria-hidden="true">{initial}</div>
      <div className="offer-main">
        {best && <span className="best-label">Meilleure correspondance</span>}
        <h3 className="offer-title">{offer.title}</h3>
        <div className="offer-meta">
          {offer.company && <span><Building size={14} />{offer.company}</span>}
          {offer.place && <span><Pin size={14} />{offer.place}</span>}
          {ago(offer) && <span><Clock size={14} />{ago(offer)}</span>}
          {offer.origin && <span>{offer.origin}</span>}
        </div>
        {offer.pending ? (
          <div style={{ display: "grid", gap: 6, maxWidth: 360 }}>
            <span className="skeleton" />
            <span className="skeleton" style={{ width: "70%" }} />
          </div>
        ) : (
          offer.conseil && !open && <p className="muted" style={{ fontSize: 14 }}>{offer.conseil}</p>
        )}
      </div>
      <Score offer={offer} />

      {open && (
        <div className="offer-detail">
          {hasMatch ? (
            <div className="match-grid">
              <div>
                <span className="eyebrow">Points forts</span>
                {offer.forces?.length ? <Tags items={offer.forces} kind="ok" icon={<Check size={13} />} /> : <span className="hint">Aucun</span>}
              </div>
              <div>
                <span className="eyebrow">À renforcer</span>
                {offer.manques?.length ? <Tags items={offer.manques} kind="miss" icon={<Cross size={13} />} /> : <span className="hint">Rien à signaler</span>}
              </div>
            </div>
          ) : null}
          {offer.conseil && (
            <div className="advice"><Bulb /><span>{offer.conseil}</span></div>
          )}
          {offer.text && (
            <div className="field">
              <span className="eyebrow">Description de l'offre</span>
              <div className="description">{offer.text}</div>
            </div>
          )}
        </div>
      )}

      <div className="offer-actions">
        <button type="button" className="btn btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Masquer le détail" : "Voir le détail"} <Chevron size={14} className="chev" />
        </button>
        {/^https?:\/\//.test(offer.url || "") && (
          <a className="btn btn-sm btn-primary" href={offer.url} target="_blank" rel="noopener noreferrer">
            Postuler <External size={13} />
          </a>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemove(offer.id)} aria-label={`Retirer ${offer.title}`}>
          <Trash size={14} /> Retirer
        </button>
      </div>
    </article>
  );
}

export default function OfferList({ offers, hasProfile, onRemove, onRescore, onClear, onAdd }) {
  const [min, setMin] = useState(0);
  const [sort, setSort] = useState("score");
  const [text, setText] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const scored = offers.filter((o) => o.score != null);
  const pending = offers.filter((o) => o.pending).length;
  const needle = text.trim().toLowerCase();
  const shown = offers
    .filter((o) => o.pending || o.score == null || o.score >= min)
    .filter((o) => !needle || `${o.title} ${o.company} ${o.place}`.toLowerCase().includes(needle))
    .sort((a, b) => (sort === "recent" ? b.added - a.added : (b.score ?? -1) - (a.score ?? -1)));
  const best = scored.length ? Math.max(...scored.map((o) => o.score)) : 0;
  const avg = scored.length ? Math.round(scored.reduce((s, o) => s + o.score, 0) / scored.length) : null;
  const strong = scored.filter((o) => o.score >= 75).length;

  return (
    <>
      <div className="stats">
        <div className="card stat">
          <span className="stat-label">Offres suivies</span>
          <span className="stat-value">{offers.length}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Très bonnes correspondances</span>
          <span className="stat-value">{strong}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Score moyen</span>
          <span className="stat-value">{avg == null ? "—" : `${avg} %`}</span>
          <span className="stat-bar"><span style={{ width: `${avg ?? 0}%` }} /></span>
        </div>
        <div className="card stat">
          <span className="stat-label">Meilleur score</span>
          <span className="stat-value">{scored.length ? `${best} %` : "—"}</span>
          <span className="stat-bar"><span style={{ width: `${best}%` }} /></span>
        </div>
      </div>

      <section className="card" aria-labelledby="h-list">
        <h2 id="h-list" className="sr-only">Offres classées</h2>
        <div className="toolbar">
          <div className="toolbar-left">
            <label className="search-input">
              <Search size={15} />
              <span className="sr-only">Filtrer les offres</span>
              <input className="input" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Filtrer par intitulé, entreprise…" />
            </label>
            <div className="segmented" role="group" aria-label="Score minimum">
              {FILTERS.map(([v, label]) => (
                <button key={v} type="button" aria-pressed={min === v} onClick={() => setMin(v)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="toolbar-right">
            <label>
              <span className="sr-only">Trier</span>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="score">Trier par score</option>
                <option value="recent">Trier par date d'ajout</option>
              </select>
            </label>
            <button type="button" className="btn btn-sm" onClick={onRescore} disabled={!offers.length || !hasProfile || pending > 0}
              title={hasProfile ? undefined : "Analysez d'abord votre CV"}>
              <Refresh size={14} /> Recalculer
            </button>
            {offers.length > 0 &&
              (confirmClear ? (
                <>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => (onClear(), setConfirmClear(false))}>Confirmer</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmClear(false)}>Annuler</button>
                </>
              ) : (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmClear(true)}>
                  <Trash size={14} /> Tout retirer
                </button>
              ))}
          </div>
        </div>
      </section>

      {!hasProfile && offers.some((o) => o.score == null) && (
        <div className="banner">Analysez votre CV pour obtenir le score de chaque offre.</div>
      )}

      <div className="offers">
        {!offers.length ? (
          <div className="card empty-state">
            <span className="icon-circle"><Radar size={22} /></span>
            <strong>Aucune offre pour l'instant</strong>
            <span>Lancez une recherche ou ajoutez une annonce trouvée sur un site d'emploi.</span>
            <button className="btn" type="button" onClick={onAdd}><Plus /> Ajouter une offre</button>
          </div>
        ) : !shown.length ? (
          <div className="card empty-state">
            <strong>Aucune offre ne correspond à ces filtres</strong>
            <span>Élargissez le score minimum ou modifiez votre filtre.</span>
          </div>
        ) : (
          shown.map((o) => <OfferCard key={o.id} offer={o} best={best >= 75 && o.score === best} onRemove={onRemove} />)
        )}
      </div>
    </>
  );
}
