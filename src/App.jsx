import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import CvPanel from "./components/CvPanel.jsx";
import ProfileCard from "./components/ProfileCard.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import AddOffer from "./components/AddOffer.jsx";
import OfferList from "./components/OfferList.jsx";

const KEY = "radar-stages-v1";
const EMPTY = {
  cvText: "",
  form: { domain: "", city: "", country: "ca", period: "" },
  profile: null,
  offers: [],
};

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return EMPTY;
  }
}

let uid = Date.now();

export default function App() {
  const [state, setState] = useState(load);
  const [status, setStatus] = useState({ claude: false, adzuna: false, ready: false });
  const [note, setNote] = useState("");
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    api.status().then((s) => setStatus({ ...s, ready: true })).catch(() => setStatus((s) => ({ ...s, ready: true })));
  }, []);

  useEffect(() => {
    try {
      const offers = state.offers.map(({ pending, ...o }) => o);
      localStorage.setItem(KEY, JSON.stringify({ ...state, offers }));
    } catch {}
  }, [state]);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  async function scoreOffers(offers, profile = stateRef.current.profile) {
    if (!offers.length) return;
    if (!profile) return setNote("Analyse ton CV pour noter les offres.");
    const ids = new Set(offers.map((o) => o.id));
    setState((s) => ({ ...s, offers: s.offers.map((o) => (ids.has(o.id) ? { ...o, pending: true } : o)) }));
    const { cvText, form } = stateRef.current;
    try {
      const { scores, warning } = await api.scoreOffers(profile, cvText, form, offers);
      const byId = new Map(scores.map((s) => [s.id, s]));
      setState((s) => ({
        ...s,
        offers: s.offers.map((o) => (byId.has(o.id) ? { ...o, ...byId.get(o.id), pending: false } : o)),
      }));
      setNote(warning || "");
    } catch (e) {
      setState((s) => ({ ...s, offers: s.offers.map((o) => (ids.has(o.id) ? { ...o, pending: false } : o)) }));
      setNote(e.message);
    }
  }

  function addOffers(items) {
    const known = new Set(stateRef.current.offers.map((o) => o.url).filter(Boolean));
    const fresh = items
      .filter((o) => !o.url || !known.has(o.url))
      .map((o) => ({ ...o, id: o.id || `o${uid++}`, added: Date.now() + Math.random() }));
    if (!fresh.length) return 0;
    setState((s) => ({ ...s, offers: [...s.offers, ...fresh] }));
    scoreOffers(fresh);
    return fresh.length;
  }

  function onProfile(profile) {
    update({ profile });
    if (stateRef.current.offers.length) scoreOffers(stateRef.current.offers, profile);
  }

  const removeOffer = (id) => setState((s) => ({ ...s, offers: s.offers.filter((o) => o.id !== id) }));

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>
            Radar à <span>Stages</span>
          </h1>
          <p className="sub">
            Importe ton CV, choisis ton domaine, puis trouve des offres de stage : elles sont notées et classées selon ton
            profil.
          </p>
        </div>
        {status.ready && (
          <div className="services">
            <span className={`pill ${status.claude ? "on" : ""}`}>Claude {status.claude ? "activé" : "désactivé"}</span>
            <span className={`pill ${status.adzuna ? "on" : ""}`}>Recherche auto {status.adzuna ? "activée" : "désactivée"}</span>
          </div>
        )}
      </header>

      <div className="grid">
        <div className="stack">
          <CvPanel
            cvText={state.cvText}
            form={state.form}
            onCvText={(cvText) => update({ cvText })}
            onForm={(form) => update({ form })}
            onProfile={onProfile}
          />
          <ProfileCard profile={state.profile} />
          <SearchPanel profile={state.profile} form={state.form} adzuna={status.adzuna} onFound={addOffers} />
        </div>
        <div className="stack">
          <AddOffer onAdd={addOffers} />
          <OfferList
            offers={state.offers}
            note={note}
            onRemove={removeOffer}
            onRescore={() => scoreOffers(state.offers)}
            onClear={() => update({ offers: [] })}
          />
        </div>
      </div>
    </div>
  );
}
