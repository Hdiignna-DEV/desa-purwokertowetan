import { useCallback, useEffect, useMemo, useState } from "react";

// Hari besar otomatis: libur nasional & cuti bersama resmi dari layanan data publik gratis (tanpa kunci),
// ditambah hari peringatan nasional/lokal, plus hari besar buatan admin. Bila internet/layanan gagal,
// dipakai data tersimpan terakhir, lalu perkiraan kalender (Hijriah Umm al-Qura, Imlek, Paskah).
export const SHOW_DAYS_AFTER = 2;
const pad = (n) => String(n).padStart(2, "0");
export const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const shiftIso = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDay(new Date(y, m - 1, d + n, 12));
};
const isoToDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};

// Tanggal hari ini menurut WIB (Asia/Jakarta). ?simulasi_tanggal=YYYY-MM-DD untuk uji tampilan.
export const todayWIB = () => {
  const sim = new URLSearchParams(window.location.search).get("simulasi_tanggal");
  if (/^\d{4}-\d{2}-\d{2}$/.test(sim || "")) return sim;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
};

const hijriYear = (iso) => {
  try {
    const p = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { year: "numeric" }).formatToParts(isoToDate(iso));
    return parseInt(p.find((x) => x.type === "year" || x.type === "relatedYear")?.value, 10) || "";
  } catch {
    return "";
  }
};

// key: [nama, judul(ctx), pesan, tema]
const DEFS = {
  "tahun-baru": ["Tahun Baru Masehi", (c) => `Selamat Tahun Baru ${c.y}`, "Semoga tahun ini membawa kebaikan, kesehatan, dan kemajuan bagi seluruh warga.", "festive"],
  "hari-jadi-banyumas": ["Hari Jadi Kabupaten Banyumas", (c) => `Selamat Hari Jadi ke-${c.y - 1571} Kabupaten Banyumas`, "Mari terus bersatu membangun Banyumas yang maju, sejahtera, dan berbudaya.", "nasional"],
  "hari-kartini": ["Hari Kartini", () => "Selamat Hari Kartini", "Habis gelap terbitlah terang. Teruslah berkarya, perempuan Indonesia.", "nasional"],
  "hari-buruh": ["Hari Buruh Internasional", () => "Selamat Hari Buruh", "Terima kasih kepada seluruh pekerja yang menggerakkan perekonomian.", "nasional"],
  hardiknas: ["Hari Pendidikan Nasional", () => "Selamat Hari Pendidikan Nasional", "Ing ngarsa sung tuladha, ing madya mangun karsa, tut wuri handayani.", "nasional"],
  harkitnas: ["Hari Kebangkitan Nasional", () => "Selamat Hari Kebangkitan Nasional", "Bangkit bersama untuk Indonesia yang lebih kuat.", "nasional"],
  "hari-lahir-pancasila": ["Hari Lahir Pancasila", () => "Selamat Hari Lahir Pancasila", "Pancasila dalam tindakan, bersatu untuk Indonesia.", "merah-putih"],
  "hut-ri": ["Hari Kemerdekaan Republik Indonesia", (c) => `Dirgahayu ke-${c.y - 1945} Republik Indonesia`, "Merdeka! Mari isi kemerdekaan dengan karya dan gotong royong.", "merah-putih"],
  "kesaktian-pancasila": ["Hari Kesaktian Pancasila", () => "Hari Kesaktian Pancasila", "Menjaga persatuan dan mengamalkan nilai-nilai Pancasila.", "merah-putih"],
  "sumpah-pemuda": ["Hari Sumpah Pemuda", (c) => `Selamat Hari Sumpah Pemuda ke-${c.y - 1928}`, "Pemuda bersatu, Indonesia maju.", "nasional"],
  "hari-pahlawan": ["Hari Pahlawan", () => "Selamat Hari Pahlawan", "Meneladani semangat juang para pahlawan bangsa.", "merah-putih"],
  "hari-ibu": ["Hari Ibu", () => "Selamat Hari Ibu", "Terima kasih atas kasih sayang dan perjuangan para ibu Indonesia.", "nasional"],
  natal: ["Hari Raya Natal", () => "Selamat Hari Raya Natal", "Semoga damai dan sukacita Natal menyertai keluarga Anda.", "natal"],
  "tahun-baru-islam": ["Tahun Baru Islam", (c) => `Selamat Tahun Baru Islam ${c.h} H`, "Semoga tahun baru membawa keberkahan dan semangat hijrah menuju kebaikan.", "islami"],
  maulid: ["Maulid Nabi Muhammad SAW", () => "Peringatan Maulid Nabi Muhammad SAW", "Meneladani akhlak mulia Rasulullah dalam kehidupan sehari-hari.", "islami"],
  "isra-mikraj": ["Isra Mikraj Nabi Muhammad SAW", () => "Peringatan Isra Mikraj Nabi Muhammad SAW", "Semoga kita semakin istiqamah dalam beribadah.", "islami"],
  ramadan: ["Awal Ramadan", (c) => `Marhaban ya Ramadan ${c.h} H`, "Selamat menunaikan ibadah puasa. Semoga Ramadan membawa keberkahan bagi kita semua.", "islami"],
  "idul-fitri": ["Hari Raya Idul Fitri", (c) => `Selamat Hari Raya Idul Fitri ${c.h} H`, "Taqabbalallahu minna wa minkum. Mohon maaf lahir dan batin.", "islami"],
  "idul-adha": ["Hari Raya Idul Adha", (c) => `Selamat Hari Raya Idul Adha ${c.h} H`, "Semoga semangat berkurban mempererat kepedulian antarsesama.", "islami"],
  imlek: ["Tahun Baru Imlek", (c) => `Selamat Tahun Baru Imlek ${c.y + 551} Kongzili`, "Gong Xi Fa Cai. Semoga sehat, rukun, dan sejahtera.", "imlek"],
  nyepi: ["Hari Suci Nyepi", (c) => `Selamat Hari Suci Nyepi Tahun Baru Saka ${c.y - 78}`, "Semoga keheningan Nyepi membawa kedamaian dan kesucian hati.", "nasional"],
  waisak: ["Hari Raya Waisak", (c) => `Selamat Hari Raya Waisak ${c.y + 544} BE`, "Semoga semua makhluk hidup berbahagia.", "festive"],
  "wafat-isa": ["Wafat Yesus Kristus", () => "Memperingati Wafat Yesus Kristus", "Semoga kasih dan pengorbanan-Nya menguatkan iman kita.", "natal"],
  paskah: ["Hari Raya Paskah", () => "Selamat Hari Raya Paskah", "Semoga sukacita kebangkitan membawa harapan baru.", "natal"],
  kenaikan: ["Kenaikan Yesus Kristus", () => "Memperingati Kenaikan Yesus Kristus", "Semoga damai senantiasa menyertai kita semua.", "natal"],
};

// Urutan penting: pola khusus sebelum "tahun baru".
const MATCH = [
  [/malam/, null],
  [/imlek|chinese/, "imlek"],
  [/nyepi|saka/, "nyepi"],
  [/muharam|muharram|hijriah|hijriyah|tahun baru islam/, "tahun-baru-islam"],
  [/ramad/, "ramadan"],
  [/idul ?fitri|lebaran(?! haji)/, "idul-fitri"],
  [/idul ?adha|lebaran haji/, "idul-adha"],
  [/isra/, "isra-mikraj"],
  [/maulid/, "maulid"],
  [/waisak|vesak/, "waisak"],
  [/wafat|good friday/, "wafat-isa"],
  [/paskah|easter/, "paskah"],
  [/kenaikan|ascension/, "kenaikan"],
  [/natal|christmas/, "natal"],
  [/buruh|labou?r/, "hari-buruh"],
  [/pancasila/, "hari-lahir-pancasila"],
  [/proklamasi|kemerdekaan|independence/, "hut-ri"],
  [/tahun baru|new year/, "tahun-baru"],
];
const COMMEMORATIONS = [["hari-jadi-banyumas", 2, 22], ["hari-kartini", 4, 21], ["hardiknas", 5, 2], ["harkitnas", 5, 20], ["kesaktian-pancasila", 10, 1], ["sumpah-pemuda", 10, 28], ["hari-pahlawan", 11, 10], ["hari-ibu", 12, 22]];
const FIXED_LIBUR = [["tahun-baru", 1, 1], ["hari-buruh", 5, 1], ["hari-lahir-pancasila", 6, 1], ["hut-ri", 8, 17], ["natal", 12, 25]];
const HIJRI_LIBUR = [["tahun-baru-islam", 1, 1], ["maulid", 3, 12], ["isra-mikraj", 7, 27], ["ramadan", 9, 1], ["idul-fitri", 10, 1, 2], ["idul-adha", 12, 10]];

const ctxFor = (key, iso) => ({ y: Number(iso.slice(0, 4)), h: hijriYear(key === "tahun-baru-islam" ? shiftIso(iso, 2) : iso) });

const makeItem = (key, date, end, kind, source) => {
  const [name, title, message, theme] = DEFS[key];
  const c = ctxFor(key, date);
  return { key, id: `${key}-${date}`, auto: true, kind, source, name, title: title(c), message, theme, date, end };
};
const makeCuti = (base, date, end, source) => {
  const [name, , , theme] = DEFS[base];
  return { key: `cuti-${base}`, id: `cuti-${base}-${date}`, auto: true, kind: "cuti", source, name: `Cuti Bersama ${name}`, title: `Cuti Bersama ${name}`, message: "Pelayanan di kantor kelurahan libur pada hari cuti bersama dan kembali normal pada hari kerja berikutnya.", theme, date, end };
};

// Ubah entri mentah {date, name, holiday} → daftar hari besar (hari berurutan dengan nama sama digabung).
export function parseOfficial(entries) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const mapped = [];
  sorted.forEach((e) => {
    const n = e.name.toLowerCase().replace(/\(.*?\)/g, " ");
    const cuti = /cuti bersama|joint holiday/.test(n);
    const hit = MATCH.find(([re]) => re.test(n));
    if (!hit || !hit[1]) return;
    mapped.push({ base: hit[1], key: cuti ? `cuti-${hit[1]}` : hit[1], cuti, date: e.date, holiday: e.holiday });
  });
  const yearKey = (m) => `${m.key}-${m.date.slice(0, 4)}`;
  const hasTrue = new Set(mapped.filter((m) => m.holiday).map(yearKey));
  const groups = [];
  mapped.filter((m) => m.holiday || !hasTrue.has(yearKey(m))).forEach((m) => {
    const g = groups.find((x) => x.key === m.key && m.date <= shiftIso(x.end, 1));
    if (g) g.end = m.date > g.end ? m.date : g.end;
    else groups.push({ ...m, end: m.date });
  });
  return groups.map((g) => (g.cuti ? makeCuti(g.base, g.date, g.end, "resmi") : makeItem(g.key, g.date, g.end, g.holiday ? "libur" : "peringatan", "resmi")));
}

const cache = {};
function calendarMap(year, cal) {
  const k = `${cal}-${year}`;
  if (cache[k]) return cache[k];
  const map = {};
  try {
    const f = new Intl.DateTimeFormat(`en-u-ca-${cal}`, { year: "numeric", month: "numeric", day: "numeric" });
    for (let d = new Date(year, 0, 1, 12); d.getFullYear() === year; d = addDays(d, 1)) {
      const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
      if (!map[`${p.month}-${p.day}`]) map[`${p.month}-${p.day}`] = new Date(d);
    }
  } catch {
    // kalender tidak didukung browser
  }
  cache[k] = map;
  return map;
}

function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return new Date(y, Math.floor(n / 31) - 1, (n % 31) + 1, 12);
}

// Perkiraan libur nasional bila data resmi tahun itu belum tersedia.
function estimatedLibur(y) {
  const out = [];
  const add = (key, d, span = 1) => out.push(makeItem(key, isoDay(d), isoDay(addDays(d, span - 1)), "libur", "perkiraan"));
  FIXED_LIBUR.forEach(([key, m, d]) => add(key, new Date(y, m - 1, d, 12)));
  const hijri = calendarMap(y, "islamic-umalqura");
  HIJRI_LIBUR.forEach(([key, m, d, span]) => hijri[`${m}-${d}`] && add(key, hijri[`${m}-${d}`], span));
  const imlek = calendarMap(y, "chinese")["1-1"];
  if (imlek) add("imlek", imlek);
  const ea = easter(y);
  add("wafat-isa", addDays(ea, -2));
  add("paskah", ea);
  add("kenaikan", addDays(ea, 39));
  return out;
}

const customFor = (c, y) => {
  let date = c.yearly ? `${y}${c.date.slice(4)}` : c.date;
  if (c.yearly && date.endsWith("02-29") && shiftIso(date, 0) !== date) date = `${y}-02-28`;
  if (!c.yearly && c.date.slice(0, 4) !== String(y)) return null;
  const key = `custom-${c.cid}`;
  return { key, id: `${key}-${date}`, cid: c.cid, auto: true, kind: "custom", source: "admin", name: c.name, title: c.title || `Selamat ${c.name}`, message: c.message || "", theme: c.theme || "nasional", date, end: date };
};

export function holidaysForYear(y, official, auto = EMPTY) {
  const resmi = (official || []).filter((h) => h.date.startsWith(String(y)));
  const libur = resmi.length ? resmi : estimatedLibur(y);
  const liburKeys = new Set(libur.map((h) => h.key));
  const peringatan = COMMEMORATIONS.filter(([k]) => !liburKeys.has(k)).map(([k, m, d]) => {
    const iso = `${y}-${pad(m)}-${pad(d)}`;
    return makeItem(k, iso, iso, "peringatan", "kalender");
  });
  const custom = (auto.custom || []).map((c) => customFor(c, y)).filter(Boolean);
  const overrides = auto.overrides || {};
  const disabled = auto.disabled || [];
  return [...libur, ...peringatan, ...custom]
    .map((h) => ({ ...h, ...(overrides[h.id] || {}), hidden: disabled.includes(h.key), edited: !!overrides[h.id] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const showUntil = (h) => shiftIso(h.end, SHOW_DAYS_AFTER);
const KIND_ORDER = { libur: 0, custom: 1, peringatan: 2, cuti: 3 };
export const activeHolidays = (list, today = todayWIB()) =>
  list.filter((h) => !h.hidden && h.date <= today && today <= showUntil(h)).sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.date.localeCompare(a.date));

// ---- Sumber data resmi (gratis, tanpa kunci) + cache di browser ----
const STORE = "pw_holidays_official_v1";
const MAX_AGE = 3 * 24 * 3600 * 1000;
const SRC_MAIN = "https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/calendar.json";
const SRC_BACKUP = (y) => `https://date.nager.at/api/v3/PublicHolidays/${y}/ID`;

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || null;
  } catch {
    return null;
  }
};

const getJson = async (url) => {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};

async function fetchEntries(years) {
  let entries = [];
  let source = "";
  try {
    const d = await getJson(SRC_MAIN);
    Object.entries(d).forEach(([date, v]) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) (v.summary || []).forEach((name) => entries.push({ date, name, holiday: v.holiday !== false }));
    });
    source = "Kalender libur nasional & cuti bersama (APIHariLibur)";
  } catch {
    // lanjut ke cadangan
  }
  for (const y of years) {
    if (entries.some((e) => e.date.startsWith(String(y)))) continue;
    try {
      const d = await getJson(SRC_BACKUP(y));
      entries = entries.concat(d.map((h) => ({ date: h.date, name: h.localName, holiday: true })));
      source = source || "Nager.Date (libur nasional)";
    } catch {
      // tetap pakai data tersimpan / perkiraan
    }
  }
  if (!entries.length) throw new Error("offline");
  return { entries, source, fetched_at: new Date().toISOString() };
}

let pending = null;
export function loadOfficial(force = false) {
  const stored = readStore();
  const y = Number(todayWIB().slice(0, 4));
  const fresh = stored && Date.now() - new Date(stored.fetched_at).getTime() < MAX_AGE && stored.entries.some((e) => e.date.startsWith(String(y)));
  if (fresh && !force) return Promise.resolve({ ...stored, status: "cache" });
  if (!pending || force) {
    pending = fetchEntries([y, y + 1])
      .then((data) => {
        localStorage.setItem(STORE, JSON.stringify(data));
        return { ...data, status: "online" };
      })
      .catch(() => (stored ? { ...stored, status: "offline-cache" } : { entries: [], status: "offline" }))
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

const EMPTY = {};
export function useHolidays(autoSettings, years) {
  const auto = autoSettings || EMPTY;
  const [meta, setMeta] = useState(() => {
    const s = readStore();
    return s ? { ...s, status: "cache" } : { entries: [], status: "loading" };
  });
  const refresh = useCallback((force) => loadOfficial(force).then(setMeta), []);
  useEffect(() => {
    refresh(false);
  }, [refresh]);
  const official = useMemo(() => parseOfficial(meta.entries || []), [meta.entries]);
  const y = Number(todayWIB().slice(0, 4));
  const yrs = years || [y - 1, y];
  const key = yrs.join(",");
  const list = useMemo(() => key.split(",").flatMap((yy) => holidaysForYear(Number(yy), official, auto)), [key, official, auto]);
  return { list, meta, refresh };
}
