import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const SiteContext = createContext({ settings: {}, links: [], reload: () => {} });

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [links, setLinks] = useState([]);
  const reload = useCallback(async () => {
    const [s, l] = await Promise.all([api.get("/public/settings"), api.get("/public/links")]);
    setSettings(s.data);
    setLinks(l.data.items);
  }, []);
  useEffect(() => {
    reload().catch(() => setSettings({}));
  }, [reload]);
  useEffect(() => {
    if (settings?.seo_title) document.title = settings.seo_title;
  }, [settings]);
  if (!settings) return <div className="min-h-screen grid place-items-center text-slate-500">Memuat…</div>;
  return <SiteContext.Provider value={{ settings, links, reload }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

export function usePublic(res, params) {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params || {});
  useEffect(() => {
    setLoading(true);
    api.get(`/public/${res}`, { params: JSON.parse(key) }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [res, key]);
  return { ...data, loading };
}
