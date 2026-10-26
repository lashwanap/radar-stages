import { useState } from "react";
import { api } from "../api.js";
import { Upload, FileText, Sparkle, Trash } from "./Icons.jsx";

export default function CvPanel({ cvText, cvName, form, onCv, onForm, onProfile, notify }) {
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [over, setOver] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const setField = (k) => (e) => onForm({ ...form, [k]: e.target.value });

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setReading(true);
    try {
      const { text } = await api.extractCv(file);
      onCv(text, file.name);
    } catch (e) {
      setError(e.message);
    } finally {
      setReading(false);
    }
  }

  async function analyze() {
    if (cvText.trim().length < 40) return setError("Importez votre CV ou collez son contenu avant de lancer l'analyse.");
    setError("");
    setBusy(true);
    try {
      const { profile, warning } = await api.analyzeCv(cvText, form);
      onProfile(profile);
      notify(warning || "Profil analysé. Vous pouvez lancer une recherche.", warning ? "error" : "success");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const words = cvText.trim() ? cvText.trim().split(/\s+/).length : 0;

  return (
    <section className="card" aria-labelledby="h-cv">
      <div className="card-head">
        <h2 className="card-title" id="h-cv"><span className="step">01</span>Votre candidature</h2>
      </div>
      <div className="card-body">
        {cvText && !editing ? (
          <div className="file-chip">
            <FileText size={20} />
            <div>
              <div className="name">{cvName || "CV collé manuellement"}</div>
              <div className="meta">{words} mots extraits</div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" aria-label="Retirer le CV" onClick={() => onCv("", "")}>
              <Trash />
            </button>
          </div>
        ) : !editing ? (
          <label
            className={`dropzone ${over ? "over" : ""}`}
            onDragOver={(e) => (e.preventDefault(), setOver(true))}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            <span className="icon-circle">{reading ? <span className="spinner" /> : <Upload size={18} />}</span>
            <strong>{reading ? "Lecture du document…" : "Importer votre CV"}</strong>
            <span>Glissez-déposez un fichier ou cliquez pour parcourir</span>
            <span className="hint">PDF, DOCX ou TXT · 10 Mo max.</span>
            <input type="file" accept=".pdf,.docx,.txt,.md" className="sr-only" onChange={(e) => handleFile(e.target.files[0])} />
          </label>
        ) : null}

        {editing && (
          <label className="field">
            Contenu du CV
            <textarea className="textarea" rows={8} value={cvText} onChange={(e) => onCv(e.target.value, cvName)} placeholder="Collez ici le texte de votre CV…" />
          </label>
        )}
        <button type="button" className="toggle-link" onClick={() => setEditing(!editing)}>
          {editing ? "Terminer la modification" : cvText ? "Vérifier ou modifier le texte extrait" : "Coller le texte du CV à la place"}
        </button>

        <label className="field">
          Domaine visé
          <input className="input" type="text" value={form.domain} onChange={setField("domain")} placeholder="Ex. : développement mobile" />
        </label>
        <div className="field-row">
          <label className="field">
            Ville ou région
            <input className="input" type="text" value={form.city} onChange={setField("city")} placeholder="Ex. : Montréal" />
          </label>
          <label className="field">
            Pays
            <select className="select" value={form.country} onChange={setField("country")}>
              <option value="ca">Canada</option>
              <option value="fr">France</option>
              <option value="be">Belgique</option>
              <option value="ch">Suisse</option>
            </select>
          </label>
        </div>
        <label className="field">
          Période de stage
          <input className="input" type="text" value={form.period} onChange={setField("period")} placeholder="Ex. : été 2027, 15 semaines" />
        </label>

        {error && <div className="message error" role="alert">{error}</div>}

        <button className="btn btn-primary btn-block" onClick={analyze} disabled={busy}>
          {busy ? <span className="spinner" /> : <Sparkle />}
          {busy ? "Analyse en cours…" : "Analyser mon profil"}
        </button>
      </div>
    </section>
  );
}
