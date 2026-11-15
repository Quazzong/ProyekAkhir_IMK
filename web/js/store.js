import { seed } from './data/seed.js';

const KEY = 'roomlink.state';
const PORTAL_ROLES = ['sarpras', 'kemahasiswaan', 'kabag'];

if (new URLSearchParams(location.search).has('reset')) localStorage.removeItem(KEY);

export function getState() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
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
export const logout = () => update(s => { s.session = null; for (const k of ['draft', 'revision', 'result', 'flash']) delete s[k]; });

// kind: 'pemohon' | 'penyetuju'. Tanpa sesi / salah peran → masuk.html.
export function requireSession(kind, loginUrl = 'masuk.html') {
  const u = currentUser();
  const ok = u && (kind === 'pemohon' ? u.role === 'pemohon' : PORTAL_ROLES.includes(u.role));
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
