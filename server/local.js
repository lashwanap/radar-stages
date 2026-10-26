// Analyse et notation par mots-clés, utilisées quand Claude n'est pas configuré.

export const SKILLS = [
  "python", "java", "javascript", "typescript", "kotlin", "swift", "c#", "c++", "php", "ruby", "go", "rust",
  "sql", "nosql", "mysql", "postgresql", "mongodb", "html", "css", "react", "angular", "vue", "node",
  "express", "django", "flask", "spring", ".net", "laravel", "android", "ios", "flutter", "git", "github",
  "docker", "kubernetes", "aws", "azure", "gcp", "linux", "tests unitaires", "junit", "agile", "scrum",
  "jira", "figma", "photoshop", "illustrator", "ux", "ui", "excel", "power bi", "tableau", "sap", "matlab",
  "statistiques", "machine learning", "pandas", "api", "rest", "graphql", "cybersécurité", "réseaux",
  "comptabilité", "finance", "audit", "marketing", "seo", "réseaux sociaux", "communication", "vente",
  "gestion de projet", "logistique", "ressources humaines", "droit", "autocad", "solidworks",
  "électronique", "mécanique", "chimie", "biologie", "laboratoire", "rédaction", "service client",
  "jetpack compose", "wordpress", "shopify", "canva", "unity", "c",
];

const LANGS = ["Français", "Anglais", "Espagnol", "Allemand", "Arabe", "Mandarin"];

export const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function hasTerm(text, term) {
  const t = norm(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9#+])${t}($|[^a-z0-9#+])`).test(text);
}

const DISPLAY = {
  javascript: "JavaScript", typescript: "TypeScript", git: "Git", github: "GitHub", node: "Node.js",
  mysql: "MySQL", postgresql: "PostgreSQL", mongodb: "MongoDB", nosql: "NoSQL", graphql: "GraphQL",
  ios: "iOS", go: "Go", rust: "Rust", ruby: "Ruby", vue: "Vue", react: "React", "power bi": "Power BI",
  linux: "Linux", docker: "Docker", azure: "Azure", junit: "JUnit", jira: "Jira", seo: "SEO", sap: "SAP",
  "jetpack compose": "Jetpack Compose", wordpress: "WordPress", autocad: "AutoCAD", solidworks: "SolidWorks",
};
const label = (s) => DISPLAY[s] || (s.length <= 3 ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1));

export const verdictFor = (s) =>
  s >= 75 ? "Excellent match" : s >= 55 ? "Bon potentiel" : s >= 40 ? "Match partiel" : "Faible match";

export function localProfile(cv, domain) {
  const n = norm(cv);
  const d = domain || "informatique";
  return {
    resume: "Profil extrait par mots-clés.",
    niveau: "",
    competences: SKILLS.filter((s) => s !== "c" && hasTerm(n, s)).map(label),
    langues: LANGS.filter((l) => hasTerm(n, l)),
    intitules: [`Stage ${d}`, `Stagiaire ${d}`, `Internship ${d}`],
    source: "local",
  };
}

export function localScore(offer, profile, domain) {
  const n = norm(`${offer.title} ${offer.text}`);
  const mine = new Set(profile.competences.map(norm));
  const wanted = SKILLS.filter((s) => s !== "c" && hasTerm(n, s));
  const forces = wanted.filter((s) => mine.has(norm(s)));
  const manques = wanted.filter((s) => !mine.has(norm(s)));
  let score = wanted.length ? Math.round((forces.length / wanted.length) * 80) : 40;
  if (domain && norm(domain).split(/\s+/).some((w) => w.length > 3 && n.includes(w))) score += 15;
  if (/\bstag|intern/.test(n)) score += 5;
  score = Math.max(5, Math.min(98, score));
  return {
    score,
    verdict: verdictFor(score),
    forces: forces.map(label),
    manques: manques.map(label).slice(0, 6),
    conseil: manques.length
      ? `Mots-clés absents de votre CV : ${manques.slice(0, 3).join(", ")}.`
      : "Les compétences demandées sont dans votre CV.",
    source: "local",
  };
}
