import { seed } from './data/seed.js';

const KEY = 'roomlink.state';
const PORTAL_ROLES = ['sarpras', 'kemahasiswaan', 'kabag'];

if (new URLSearchParams(location.search).has('reset')) localStorage.removeItem(KEY);

export function getState() {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    // Data lama dari versi sebelumnya: tambahkan akun seed yang belum ada (mis. Petugas Keamanan); data kerja tidak disentuh.
    const s = JSON.parse(raw);
    const missing = seed.users.filter(u => !s.users.some(x => x.id === u.id));
    // Ruangan: lengkapi field baru (mis. description) tanpa menimpa nilai yang sudah ada.
    let changed = missing.length > 0;
    s.users.push(...structuredClone(missing));
    for (const r of s.rooms) { const base = seed.rooms.find(x => x.id === r.id); for (const k in base ?? {}) if (!(k in r)) { r[k] = base[k]; changed = true; } }
    if (changed) localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  const s = { ...structuredClone(seed), session: null, draft: null };
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function update(fn) {
  const s = getState();
  fn(s);
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export const currentUser = () => {
  const s = getState();
  return s.users.find(u => u.id === s.session) ?? null;
};
// Data kerja milik akun (draft, revisi, hasil, toast) ikut dibuang agar tidak terbawa ke akun berikutnya.
export const logout = () => update(s => { s.session = null; for (const k of ['draft', 'revision', 'result', 'flash', 'securityDate']) delete s[k]; });

// kind: 'pemohon' | 'penyetuju' | 'keamanan'. Tanpa sesi / salah peran → masuk.html (lalu diarahkan ke beranda perannya).
export function requireSession(kind, loginUrl = 'masuk.html') {
  const u = currentUser();
  const ok = u && (kind === 'penyetuju' ? PORTAL_ROLES.includes(u.role) : u.role === kind);
  if (!ok) location.replace(loginUrl);
  return ok ? u : null;
}

export const unreadCount = userId => getState().notifications.filter(n => n.userId === userId && !n.read).length;
// Draft pengajuan lintas halaman (jadwal, ruangan terpilih, filter)
export const getDraft = () => getState().draft ?? {};
export const patchDraft = patch => update(s => { s.draft = { ...s.draft, ...patch }; });
// Toast (+ tab tujuan) lintas halaman, mis. setelah batal → pengajuan.html (Riwayat).
export const setFlash = (message, tab = '') => update(s => { s.flash = { message, tab }; });
export const popFlash = () => { const f = getState().flash ?? null; if (f) update(s => { delete s.flash; }); return f; };
