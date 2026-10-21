// Liens de recherche vers les sites d'offres, selon le pays.
export function searchLinks(q, city, country) {
  const e = encodeURIComponent;
  const qc = e(q);
  const lc = e(city);
  const indeed = { ca: "ca.indeed.com", fr: "fr.indeed.com", be: "be.indeed.com", ch: "ch-fr.indeed.com" }[country];
  const links = [
    ["Indeed", `https://${indeed}/jobs?q=${qc}&l=${lc}`],
    ["LinkedIn", `https://www.linkedin.com/jobs/search/?keywords=${qc}&location=${lc}&f_E=1`],
    ["Google Emplois", `https://www.google.com/search?q=${e(`${q} ${city}`)}&ibp=htl;jobs`],
  ];
  if (country === "ca")
    links.push(
      ["Jobillico", `https://www.jobillico.com/recherche-emploi?skwd=${qc}&scty=${lc}`],
      ["Guichet-Emplois", `https://www.guichetemplois.gc.ca/jobsearch/rechercheemplois?searchstring=${qc}&locationstring=${lc}`],
      ["Glassdoor", `https://www.glassdoor.ca/Job/jobs.htm?sc.keyword=${qc}`],
    );
  if (country === "fr")
    links.push(
      ["Welcome to the Jungle", `https://www.welcometothejungle.com/fr/jobs?query=${qc}`],
      ["HelloWork", `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${qc}&l=${lc}&c=Stage`],
      ["France Travail", `https://candidat.francetravail.fr/offres/recherche?motsCles=${qc}`],
      ["JobTeaser", `https://www.jobteaser.com/fr/job-offers?q=${qc}`],
    );
  if (country === "be")
    links.push(
      ["StepStone", `https://www.stepstone.be/fr/emplois/${e(q.replace(/\s+/g, "-"))}`],
      ["Welcome to the Jungle", `https://www.welcometothejungle.com/fr/jobs?query=${qc}`],
    );
  if (country === "ch")
    links.push(
      ["jobs.ch", `https://www.jobs.ch/fr/offres-emplois/?term=${qc}&location=${lc}`],
      ["Jobup", `https://www.jobup.ch/fr/emplois/?term=${qc}&location=${lc}`],
    );
  return links;
}
