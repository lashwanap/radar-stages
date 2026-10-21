export const Chips = ({ items, kind = "" }) => (
  <div className="chips">
    {items.map((t) => (
      <span key={t} className={`chip ${kind}`}>
        {t}
      </span>
    ))}
  </div>
);

export default function ProfileCard({ profile }) {
  return (
    <section className="panel" aria-labelledby="h-prof">
      <div className="row between">
        <h2 id="h-prof">Ton profil</h2>
        {profile && <span className="label">{profile.source === "claude" ? "Analysé par Claude" : "Mots-clés"}</span>}
      </div>
      {!profile ? (
        <p className="note">Ton profil apparaîtra ici après l'analyse du CV.</p>
      ) : (
        <div className="stack tight">
          {profile.resume && <div className="profile-name">{profile.resume}</div>}
          {profile.niveau && <div className="note">{profile.niveau}</div>}
          {profile.competences.length ? (
            <>
              <span className="label">Compétences</span>
              <Chips items={profile.competences} />
            </>
          ) : (
            <p className="note">Aucune compétence reconnue. Précise ton domaine ou colle un CV plus détaillé.</p>
          )}
          {profile.langues?.length > 0 && (
            <>
              <span className="label">Langues</span>
              <Chips items={profile.langues} />
            </>
          )}
        </div>
      )}
    </section>
  );
}
