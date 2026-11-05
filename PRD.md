# PRD – Website Kelurahan Purwokerto Wetan (Pengumuman & Hari Besar Otomatis)

## Original problem
"testing dan pastikan fitur pengumuman berjalan baik dan normal. untuk peringatan hari besar itu otomatis" (code from uploaded zip).

## Architecture
React (CRA/craco, Tailwind, shadcn) + FastAPI + MongoDB (REACT_APP_DATA_MODE=backend in preview; local/localStorage mode still supported).
Holiday engine is client-side: `frontend/src/lib/holidays.js`
- Official libur nasional + cuti bersama: raw.githubusercontent.com/guangrei/APIHariLibur_V2 calendar.json (free, no key), backup date.nager.at; cached in localStorage (3 days); fallback = last cache → calendar estimate (Hijri Umm al-Qura, Imlek, Easter).
- National commemorations (Kartini, Sumpah Pemuda, Hari Jadi Banyumas, …) + admin custom holidays.
- Shown day-H through H+2 (WIB). `?simulasi_tanggal=YYYY-MM-DD` simulates date.
- Settings: `settings.auto_holidays {enabled, disabled[keys], overrides{id:{title,message,theme}}, custom[]}`.

## Implemented (2026-06)
- Tested announcements CRUD end-to-end; fixed datetime field UTC drift bug; backend validation (title/content required, 422); server-side filtering of expired/future announcements on /api/public/announcements.
- Homepage "Pengumuman Resmi Kelurahan" section (active, newest first).
- Popup once per visit (holidays first, then announcements), "hide today" option.
- Thin holiday banner on top of homepage.
- Admin menu "Hari Besar" (/admin/hari-besar): source status + refresh, global toggle, year 2026/2027 list, badges (Libur Nasional/Cuti Bersama/Peringatan/Buatan Admin/Perkiraan), preview, edit text (with reset), hide per holiday, add/edit/delete local holidays.
- Merah-putih theme readability fix.

## Backlog
- P1: Upload poster image per holiday; preview popup before publishing
- P2: Scheduled announcements notifications; share announcement to WhatsApp/social
- P2: Per-year hiding (currently hide applies every year)
