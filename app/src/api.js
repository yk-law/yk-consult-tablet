const j = async (res) => {
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
};

async function snapshotVisit(id) {
  const base = import.meta.env.BASE_URL;
  const index = await fetch(`${base}snapshot/index.json`).then(j);
  const key = (id && (index.byId?.[id] || index.byName?.[id])) || index.default;
  return fetch(`${base}snapshot/${encodeURIComponent(key)}.json`).then(j);
}

export const api = {
  visit: (id) => {
    const host = location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return snapshotVisit(id);
    return fetch(`/api/visit${id ? `?id=${encodeURIComponent(id)}` : ""}`).then(j);
  },
};
