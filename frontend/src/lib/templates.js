// Template pesan WhatsApp yang rapi & profesional (format tebal WhatsApp: *teks*).
const SEP = "────────────────────";
export const trackUrl = () => `${window.location.origin}/lacak`;

const rows = (pairs) => pairs.filter(([, v]) => v).map(([k, v]) => `${k.padEnd(10, " ")}: ${v}`).join("\n");

export const ticketSaveMsg = ({ site, docTitle, ticket, title, date, lines = [] }) => [
  `*${(site || "").toUpperCase()}*`,
  `_${docTitle}_`,
  SEP,
  rows([["No. Tiket", `*${ticket}*`], ["Perihal", title], ["Tanggal", date]]),
  ...(lines.length ? ["", "*Berkas yang perlu dibawa:*", ...lines.map((l, i) => `${i + 1}. ${l}`)] : []),
  SEP,
  "Lacak status pengajuan:",
  trackUrl(),
  "(masukkan nomor tiket + 4 digit akhir nomor WhatsApp)",
  "",
  "_Simpan pesan ini sebagai bukti pengajuan._",
].join("\n");

export const statusMsg = ({ site, name, kindLabel, ticket, titleLabel = "Perihal", title, status, note, schedule }) => [
  `*${(site || "").toUpperCase()}*`,
  `_Pemberitahuan Status ${kindLabel}_`,
  SEP,
  `Yth. Bapak/Ibu *${name}*,`,
  `Berikut pembaruan status ${kindLabel} Anda:`,
  "",
  rows([["No. Tiket", `*${ticket}*`], [titleLabel, title], ["Status", `*${status}*`], ["Jadwal", schedule], ["Catatan", note]]),
  SEP,
  "Lacak status kapan saja di:",
  trackUrl(),
  "",
  "Terima kasih.",
  `Hormat kami,\nPetugas ${site}`,
].join("\n");
