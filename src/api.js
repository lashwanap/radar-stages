async function call(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur serveur (${res.status}).`);
  return data;
}

const post = (url, body) =>
  call(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  status: () => call("/api/status"),
  extractCv(file) {
    const fd = new FormData();
    fd.append("cv", file);
    return call("/api/cv/extract", { method: "POST", body: fd });
  },
  analyzeCv: (cv, form) => post("/api/cv/analyze", { cv, form }),
  searchOffers: ({ q, city, country }) =>
    call(`/api/offers/search?${new URLSearchParams({ q, city, country })}`),
  scoreOffers: (profile, cv, form, offers) => post("/api/offers/score", { profile, cv, form, offers }),
};
