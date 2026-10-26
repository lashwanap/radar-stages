import { Sparkle, FileText } from "./Icons.jsx";

export const Tags = ({ items, kind = "", icon = null }) => (
  <div className="tags">
    {items.map((t) => (
      <span key={t} className={`tag ${kind}`}>
        {icon}
        {t}
      </span>
    ))}
  </div>
);

export default function ProfileCard({ profile }) {
  return (
    <section className="card" aria-labelledby="h-prof">
      <div className="card-head">
        <h2 className="card-title" id="h-prof"><span className="step">02</span>Profil détecté</h2>
        {profile && (
          <span className="source-badge">
            <Sparkle size={13} />
            {profile.source === "claude" ? "Analyse IA" : "Mots-clés"}
          </span>
        )}
      </div>
      <div className="card-body">
        {!profile ? (
          <div className="empty-state">
            <span className="icon-circle"><FileText size={20} /></span>
            <strong>Aucun profil pour l'instant</strong>
            <span>Importez votre CV puis lancez l'analyse pour voir vos compétences et les intitulés de stage suggérés.</span>
          </div>
        ) : (
          <>
            {profile.resume && <p className="profile-summary">{profile.resume}</p>}
            {profile.niveau && <p className="profile-level">{profile.niveau}</p>}
            <div className="field">
              <span className="eyebrow">Compétences</span>
              {profile.competences.length ? (
                <Tags items={profile.competences} />
              ) : (
                <span className="hint">Aucune compétence reconnue. Précisez le domaine visé ou ajoutez du détail au CV.</span>
              )}
            </div>
            {profile.langues?.length > 0 && (
              <div className="field">
                <span className="eyebrow">Langues</span>
                <Tags items={profile.langues} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
