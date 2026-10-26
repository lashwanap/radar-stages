import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { Radar, Check, Cross } from "./components/Icons.jsx";
import CvPanel from "./components/CvPanel.jsx";
import ProfileCard from "./components/ProfileCard.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import AddOfferDialog from "./components/AddOfferDialog.jsx";
import OfferList from "./components/OfferList.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";

const KEY = "radar-stages-v1";
const EMPTY = {
  cvText: "",
  cvName: "",
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
  const [status, setStatus] = useState({ claude: false, search: false, ready: false });
  const [toasts, setToasts] = useState([]);
  const [adding, setAdding] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const notify = useCallback((text, kind = "info") => {
    const id = ++uid;
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

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
    if (!profile) return notify("Analysez votre CV pour obtenir le score des offres.");
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
      if (warning) notify(warning, "error");
    } catch (e) {
      setState((s) => ({ ...s, offers: s.offers.map((o) => (ids.has(o.id) ? { ...o, pending: false } : o)) }));
      notify(e.message, "error");
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
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark"><Radar size={18} /></span>
            <div>
              Radar à Stages
              <small>Recherche de stages guidée par votre CV</small>
            </div>
          </div>
          <div className="topbar-right">
            {status.ready && (
              <div className="services" aria-label="État des services">
                <span className="service"><span className={`dot ${status.claude ? "on" : ""}`} />Analyse IA {status.claude ? "active" : "inactive"}</span>
                <span className="service"><span className={`dot ${status.search ? "on" : ""}`} />Recherche d'offres {status.search ? "active" : "inactive"}</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" aria-label="Profil candidat">
          <CvPanel
            cvText={state.cvText}
            cvName={state.cvName}
            form={state.form}
            onCv={(cvText, cvName) => update({ cvText, cvName })}
            onForm={(form) => update({ form })}
            onProfile={onProfile}
            notify={notify}
          />
          <ProfileCard profile={state.profile} />
        </aside>

        <main className="main">
          <SearchPanel
            profile={state.profile}
            form={state.form}
            search={status.search}
            onFound={addOffers}
            onAdd={() => setAdding(true)}
            notify={notify}
          />
          <OfferList
            offers={state.offers}
            hasProfile={Boolean(state.profile)}
            onRemove={removeOffer}
            onRescore={() => scoreOffers(state.offers)}
            onClear={() => update({ offers: [] })}
            onAdd={() => setAdding(true)}
          />
        </main>
      </div>

      <AddOfferDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(items) => {
          const n = addOffers(items);
          notify(n ? `${n} offre${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""}.` : "Cette offre est déjà dans la liste.", n ? "success" : "info");
        }}
      />

      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.kind === "error" ? <Cross className="toast-icon" /> : <Check className="toast-icon" />}
            <p>{t.text}</p>
            <button type="button" aria-label="Fermer" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              <Cross size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
