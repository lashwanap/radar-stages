import { useState } from "react";
import { api } from "../api.js";

export default function CvPanel({ cvText, form, onCvText, onForm, onProfile }) {
  const [msg, setMsg] = useState({ text: "", err: false });
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [showText, setShowText] = useState(Boolean(cvText));

  const setField = (k) => (e) => onForm({ ...form, [k]: e.target.value });

  async function handleFile(file) {
    if (!file) return;
    setMsg({ text: `Lecture de ${file.name}…`, err: false });
    try {
      const { text } = await api.extractCv(file);
      onCvText(text);
      setShowText(true);
      setMsg({ text: `${file.name} lu (${text.length} caractères). Clique sur « Analyser mon CV ».`, err: false });
    } catch (e) {
      setMsg({ text: e.message, err: true });
    }
  }

  async function analyze() {
    if (cvText.trim().length < 40) return setMsg({ text: "Importe ton CV ou colle son texte d'abord.", err: true });
    setBusy(true);
    setMsg({ text: "Analyse du CV… (10 à 40 s avec Claude)", err: false });
    try {
      const { profile, warning } = await api.analyzeCv(cvText, form);
      onProfile(profile);
      setMsg({ text: warning || "Profil analysé. Lance tes recherches à l'étape 2.", err: Boolean(warning) });
    } catch (e) {
      setMsg({ text: e.message, err: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="h-cv">
      <div className="row between">
        <h2 id="h-cv">1. Ton CV</h2>
        <span className="label">PDF · DOCX · TXT</span>
      </div>
      <label
        className={`drop ${over ? "over" : ""}`}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <strong>Dépose ton CV ici</strong>
        <small>ou clique pour choisir un fichier</small>
        <input type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={(e) => handleFile(e.target.files[0])} />
      </label>
      <details open={showText} onToggle={(e) => setShowText(e.currentTarget.open)}>
        <summary>{cvText ? "Voir ou modifier le texte du CV" : "Ou colle le texte du CV"}</summary>
        <textarea rows={6} value={cvText} onChange={(e) => onCvText(e.target.value)} placeholder="Colle le contenu de ton CV…" />
      </details>
      <div className="two">
        <label className="f">
          Domaine recherché
          <input type="text" value={form.domain} onChange={setField("domain")} placeholder="ex. Développement web" />
        </label>
        <label className="f">
          Ville / région
          <input type="text" value={form.city} onChange={setField("city")} placeholder="ex. Montréal" />
        </label>
      </div>
      <div className="two">
        <label className="f">
          Pays
          <select value={form.country} onChange={setField("country")}>
            <option value="ca">Canada (Québec)</option>
            <option value="fr">France</option>
            <option value="be">Belgique</option>
            <option value="ch">Suisse</option>
          </select>
        </label>
        <label className="f">
          Durée / période
          <input type="text" value={form.period} onChange={setField("period")} placeholder="ex. Été 2027, 12 sem." />
        </label>
      </div>
      <button className="primary" onClick={analyze} disabled={busy}>
        {busy ? "Analyse en cours…" : "Analyser mon CV"}
      </button>
      <div className={`status ${msg.err ? "err" : ""}`} role="status">
        {msg.text}
      </div>
    </section>
  );
}
