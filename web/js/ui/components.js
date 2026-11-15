// Fungsi render komponen → string HTML. Tanpa aturan bisnis (itu di js/domain/).
import { logout } from '../store.js';

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slug = s => s.toLowerCase().replace(/\s+/g, '-');

export const statusChip = status =>
  `<span class="badge badge-status badge-${slug(status)}">${esc(status)}</span>`;

export const filterChip = (label, key = '') =>
  `<span class="badge badge-filter rounded-pill">${esc(label)} <button type="button" class="btn-close ms-1" aria-label="Hapus filter ${esc(label)}" data-chip="${esc(key)}"></button></span>`;

// state: 'default' | 'loading' | 'disabled'; variant: primary | soft | danger
export function button(label, { variant = 'primary', state = 'default', full = true, id = '', type = 'button' } = {}) {
  const loading = state === 'loading';
  return `<button type="${type}" ${id && `id="${id}"`} class="btn btn-${variant} ${full ? 'w-100' : ''} ${loading ? 'is-loading' : ''}" ${state !== 'default' ? 'disabled' : ''}>` +
    `${loading ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>' : ''}${esc(label)}</button>`;
}

const label = (id, text, required) => `<label for="${id}" class="form-label fw-medium">${esc(text)}${required ? ' <span class="text-danger">*</span>' : ''}</label>`;
const feedback = (id, error) => `<div class="invalid-feedback" id="${id}-err">${esc(error)}</div>`;
const aria = (id, required, error, hint = '') => `${required ? 'required aria-required="true"' : ''} ${error ? 'aria-invalid="true"' : ''} ${error || hint ? `aria-describedby="${[error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ')}"` : ''}`;
const hintHtml = (id, hint) => (hint ? `<div class="form-text" id="${id}-hint">${esc(hint)}</div>` : '');

export function field({ id, label: text, placeholder = '', required = false, value = '', error = '', hint = '', type = 'text', inputmode = '' }) {
  return `<div class="mb-3">${label(id, text, required)}` +
    `<input id="${id}" type="${type}" ${inputmode && `inputmode="${inputmode}"`} class="form-control ${error ? 'is-invalid' : ''}" placeholder="${esc(placeholder)}" value="${esc(value)}" ${aria(id, required, error, hint)}>` +
    `${feedback(id, error)}${hintHtml(id, hint)}</div>`;
}

export function textarea({ id, label: text, placeholder = '', required = false, value = '', error = '', rows = 3 }) {
  return `<div class="mb-3">${label(id, text, required)}` +
    `<textarea id="${id}" rows="${rows}" class="form-control ${error ? 'is-invalid' : ''}" placeholder="${esc(placeholder)}" ${aria(id, required, error)}>${esc(value)}</textarea>${feedback(id, error)}</div>`;
}

const opt = o => (typeof o === 'string' ? { value: o, label: o } : o);

export function select({ id, label: text, options, placeholder = '', required = false, error = '', value = '' }) {
  return `<div class="mb-3">${label(id, text, required)}` +
    `<select id="${id}" class="form-select ${error ? 'is-invalid' : ''}" ${aria(id, required, error)}>${placeholder ? `<option value="">${esc(placeholder)}</option>` : ''}${options.map(opt).map(o => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>` +
    `${feedback(id, error)}</div>`;
}

const PHOTOS = new URL('../../img/rooms/', import.meta.url); // relatif ke modul, aman dari /penyetuju/
// Foto dari Figma frame C, satu per ruangan (img/rooms/{roomId}.jpg). Nama ruangan selalu tampil di sebelahnya → alt kosong.
export const roomPhoto = (roomId, cls) => roomId
  ? `<img src="${new URL(`${roomId}.jpg`, PHOTOS)}" alt="" class="${cls} object-fit-cover">`
  : `<div class="${cls}"><i aria-hidden="true" class="bi bi-building"></i></div>`;

export const roomCard = ({ id = '', name, capacity, facilities = '' }) =>
  `<div class="card mb-3" ${id ? `data-room="${esc(id)}"` : ''}><div class="card-body d-flex gap-3">` +
  roomPhoto(id, 'rl-photo rl-photo-xs') +
  `<div class="flex-grow-1"><div class="fw-semibold">${esc(name)}</div>` +
  `<div class="small text-secondary">${capacity} orang · <span class="text-success-emphasis">Tersedia</span></div>` +
  `<div class="small text-secondary">${esc(facilities)}</div>` +
  `<a href="#" class="btn btn-soft btn-sm mt-2 w-100">Pilih Ruangan <i aria-hidden="true" class="bi bi-arrow-right"></i></a></div></div></div>`;

// title (nama kegiatan) opsional: dengan title tampil + "Lihat Detail →".
export const requestCard = ({ id, room, dateTime, status, href = '#', title = '' }) =>
  `<a href="${esc(href)}" class="card mb-3 text-decoration-none text-body"><div class="card-body">` +
  `<div class="d-flex justify-content-between align-items-start"><div class="fw-semibold">${esc(room)}</div>${statusChip(status)}</div>` +
  (title
    ? `<div class="small text-secondary mt-1">${esc(dateTime)}</div><div class="small text-secondary">${esc(title)}</div><div class="small fw-semibold text-primary mt-2">Lihat Detail <i aria-hidden="true" class="bi bi-arrow-right"></i></div>`
    : `<div class="small text-secondary mt-1">${esc(id)} · ${esc(dateTime)}</div>`) +
  `</div></a>`;

// icon: nama bootstrap-icons; href: ketuk → detail.
export const notifCard = ({ title, body, time, unread = false, icon = '', href = '' }) =>
  `<${href ? `a href="${esc(href)}"` : 'div'} class="card mb-2 text-decoration-none text-body ${unread ? 'border-primary-subtle' : ''}"><div class="card-body d-flex gap-3">` +
  (icon ? `<span class="rl-notif-icon"><i aria-hidden="true" class="bi bi-${icon}"></i></span>` : '') +
  `<div class="flex-grow-1"><div class="fw-semibold small">${esc(title)}</div><div class="small text-secondary">${esc(body)}</div><div class="small text-secondary mt-1">${esc(time)}</div></div>` +
  `${unread ? '<span class="rl-dot" role="img" aria-label="Belum dibaca"></span>' : ''}</div></${href ? 'a' : 'div'}>`;

// steps: [{name, person, status, note}] — urutan = tahap 1..3
export const stepper = steps => steps.map((s, i) =>
  `<div class="rl-step"><span class="rl-step-dot ${slug(s.status)}">${s.status === 'Disetujui' ? '<i aria-hidden="true" class="bi bi-check-lg"></i>' : i + 1}</span>` +
  `<div class="flex-grow-1"><div class="d-flex justify-content-between align-items-center"><span class="fw-semibold">${esc(s.name)}</span>${statusChip(s.status)}</div>` +
  `<div class="small text-secondary">${esc(s.person)}</div><div class="small text-secondary">${esc(s.note ?? '')}</div></div></div>`).join('');

export const tabs = (items, active) =>
  `<ul class="nav nav-pills nav-fill gap-1 mb-3 rl-tabs" role="tablist">${items.map(t => `<li class="nav-item" role="presentation"><button type="button" role="tab" aria-selected="${t === active}" class="nav-link w-100 ${t === active ? 'active' : ''}" data-tab="${esc(t)}">${esc(t)}</button></li>`).join('')}</ul>`;

// items: [{label, icon, href, active, count}]
export const bottomNav = items =>
  `<nav class="navbar fixed-bottom bottom-nav p-0 d-lg-none"><ul class="nav nav-fill w-100">${items.map(i =>
    `<li class="nav-item"><a class="nav-link ${i.active ? 'active' : ''}" href="${esc(i.href)}"><i aria-hidden="true" class="bi bi-${i.icon} fs-5"></i>${esc(i.label)}` +
    `${i.count ? `<span class="badge text-bg-danger rounded-pill">${i.count}</span>` : ''}</a></li>`).join('')}</ul></nav>`;

export const dayCell = (n, state = 'default', { date = '', label = '' } = {}) =>
  `<button type="button" class="rl-day ${state === 'selected' ? 'active' : ''}" ${state === 'disabled' ? 'disabled' : ''} ${date ? `data-date="${esc(date)}"` : ''} ${label ? `aria-label="${esc(label)}"` : ''} aria-pressed="${state === 'selected'}">${n}</button>`;

// Dialog konfirmasi (Batalkan / Buang isian). Buka lewat data-bs-toggle="modal".
export const confirmModal = ({ id, title, body, note = '', cancel, confirm, danger = true }) =>
  `<div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}-t" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content p-3">` +
  `<div class="modal-body"><h2 class="h5" id="${id}-t">${esc(title)}</h2><p class="text-secondary">${esc(body)}</p>${note ? `<p class="small text-secondary">${esc(note)}</p>` : ''}` +
  `<div class="d-grid gap-2"><button class="btn btn-soft" data-bs-dismiss="modal">${esc(cancel)}</button><button class="btn btn-${danger ? 'danger' : 'primary'}" data-role="confirm">${esc(confirm)}</button></div></div></div></div></div>`;

// Dialog info satu tombol (Lupa kata sandi, Butuh bantuan). body: array paragraf.
export const infoModal = ({ id, title, body, ok = 'Mengerti' }) =>
  `<div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}-t" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content p-3">` +
  `<div class="modal-body"><h2 class="h5" id="${id}-t">${esc(title)}</h2>${body.map(p => `<p class="text-secondary">${esc(p)}</p>`).join('')}` +
  `<div class="d-grid"><button type="button" class="btn btn-primary" data-bs-dismiss="modal">${esc(ok)}</button></div></div></div></div></div>`;

// Menu akun pemohon di header: nama, jabatan · unit, Keluar (dikonfirmasi lewat bindLogout).
export const profileMenu = user =>
  `<div class="dropdown"><button type="button" class="btn p-2" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Akun ${esc(user.name)}"><i aria-hidden="true" class="bi bi-person-circle fs-4"></i></button>` +
  `<ul class="dropdown-menu dropdown-menu-end shadow-sm rl-menu"><li class="px-3 py-2"><div class="fw-semibold">${esc(user.name)}</div><div class="small text-secondary">${esc([user.position, user.unit].filter(Boolean).join(' · '))}</div></li>` +
  `<li><hr class="dropdown-divider"></li><li><button type="button" class="dropdown-item d-flex align-items-center text-danger" data-role="logout"><i aria-hidden="true" class="bi bi-box-arrow-left me-2"></i>Keluar</button></li></ul></div>`;

// Semua [data-role=logout] → konfirmasi → hapus sesi → halaman Masuk. Panggil sekali per halaman.
export function bindLogout(loginUrl) {
  document.body.insertAdjacentHTML('beforeend', confirmModal({ id: 'm-logout', title: 'Keluar dari RoomLink?', body: 'Anda perlu masuk lagi untuk melanjutkan.', cancel: 'Batal', confirm: 'Keluar' }));
  const m = document.getElementById('m-logout');
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-role=logout]')) return;
    e.preventDefault();
    bootstrap.Modal.getOrCreateInstance(m).show();
  });
  m.querySelector('[data-role=confirm]').onclick = () => { logout(); location.href = loginUrl; };
}

// Panel hasil keputusan penyetuju. r: {tone, title, lines[], cta}; href = tujuan tombol.
export const resultModal = ({ id, r, href }) =>
  `<div class="modal fade" id="${id}" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="${id}-t" aria-hidden="true"><div class="modal-dialog modal-dialog-centered rl-modal-result"><div class="modal-content p-4">` +
  `<div class="small fw-semibold text-${r.tone}-emphasis mb-3">ROOMLINK &nbsp;/&nbsp; KEPUTUSAN PENGAJUAN</div>` +
  `<h2 class="fs-3 fw-bold mb-4" id="${id}-t">${esc(r.title)}</h2><p class="text-secondary mb-4">${r.lines.map(esc).join('<br>')}</p>` +
  `<a href="${esc(href)}" ${href === '#' ? 'data-bs-dismiss="modal"' : ''} class="btn btn-${r.tone === 'danger' ? 'primary' : r.tone} w-100 justify-content-start">${esc(r.cta)}</a></div></div></div>`;

// Filter ruangan: bottom sheet. jenis/kapasitas: string atau {value,label}; *Aktif = value terpilih.
// placement: 'bottom' (bottom sheet, <992) | 'end' (panel kanan, ≥992).
export const filterSheet = ({ id, jenis, kapasitas, jenisAktif = '', kapasitasAktif = '', placement = 'bottom' }) =>
  `<div class="offcanvas offcanvas-${placement} ${placement === 'bottom' ? 'rounded-top-4 rl-sheet-bottom' : ''}" tabindex="-1" id="${id}" aria-labelledby="${id}-t">` +
  `<div class="offcanvas-header"><div><h2 class="h5 mb-0" id="${id}-t">Filter ruangan</h2><div class="small text-secondary">Sesuaikan dengan kebutuhan kegiatan.</div></div><button class="btn-close" data-bs-dismiss="offcanvas" aria-label="Tutup"></button></div>` +
  `<div class="offcanvas-body"><div class="fw-semibold mb-2">Jenis ruangan</div><div class="row g-2 mb-3">${jenis.map(opt).map(j => `<div class="col-6"><input type="radio" class="btn-check" name="jenis" value="${esc(j.value)}" id="${id}-j-${esc(j.value)}" ${j.value === jenisAktif ? 'checked' : ''}><label class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center" for="${id}-j-${esc(j.value)}">${esc(j.label)}</label></div>`).join('')}</div>` +
  `<div class="fw-semibold mb-2">Kapasitas</div>${kapasitas.map(opt).map(k => `<div class="form-check border rounded-3 p-2 ps-5 mb-2"><input class="form-check-input" type="radio" name="kap" value="${esc(k.value)}" id="${id}-k-${esc(k.value)}" ${k.value === kapasitasAktif ? 'checked' : ''}><label class="form-check-label w-100" for="${id}-k-${esc(k.value)}">${esc(k.label)}</label></div>`).join('')}` +
  `<div class="d-grid gap-2 mt-3">${button('Terapkan Filter', { id: `${id}-apply` })}<button type="button" class="btn btn-link text-secondary" id="${id}-reset">Reset filter</button></div></div></div>`;

// Empty state: icon bootstrap-icons, actions = HTML tombol.
export const emptyState = ({ icon, title, body, actions = '' }) =>
  `<div class="text-center py-5"><div class="rl-empty-icon mx-auto mb-4"><i aria-hidden="true" class="bi bi-${icon} fs-3"></i></div>` +
  `<h2 class="h5 mb-2">${esc(title)}</h2><p class="text-secondary small mb-4">${body.split('\n').map(esc).join('<br>')}</p><div class="d-grid gap-2">${actions}</div></div>`;

// Navbar atas desktop (≥992): item sama dengan bottom nav + merek + menu akun.
export const topNav = (items, user = null) =>
  `<nav class="navbar navbar-expand fixed-top rl-topnav border-bottom d-none d-lg-flex p-0" aria-label="Navigasi utama"><div class="rl-wrap w-100 d-flex align-items-center gap-4">` +
  `<a class="navbar-brand fw-bold d-flex align-items-center gap-2 m-0" href="index.html"><span class="rl-login-logo rl-logo-sm"><i aria-hidden="true" class="bi bi-door-closed"></i></span>RoomLink</a>` +
  `<ul class="navbar-nav gap-2 me-auto">${items.map(i => `<li class="nav-item"><a class="nav-link px-3 ${i.active ? 'active' : ''}" href="${esc(i.href)}" ${i.active ? 'aria-current="page"' : ''}><i aria-hidden="true" class="bi bi-${i.icon}"></i>${esc(i.label)}` +
  `${i.count ? `<span class="badge text-bg-danger rounded-pill">${i.count}</span>` : ''}</a></li>`).join('')}</ul>` +
  `${user ? profileMenu(user) : ''}</div></nav>`;

// Navigasi utama 3 tab (Kalender, Pengajuan Saya, Notifikasi + badge belum dibaca):
// bottom nav <992, navbar atas ≥992. Satu array item → badge & tab aktif selalu sinkron.
export const mainNav = (active, unread = 0, user = null) => {
  const items = [
    { label: 'Kalender', icon: 'calendar3', href: 'index.html', active: active === 'Kalender' },
    { label: 'Pengajuan Saya', icon: 'file-earmark-text', href: 'pengajuan.html', active: active === 'Pengajuan Saya' },
    { label: 'Notifikasi', icon: 'bell', href: 'notifikasi.html', active: active === 'Notifikasi', count: unread },
  ];
  return topNav(items, user) + bottomNav(items);
};

// Tabel portal: columns = ['No.', ...], rows = array of array HTML-aman (sudah di-escape/chip)
export const portalTable = (columns, rows) =>
  `<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="table-light"><tr>${columns.map(c => `<th scope="col" class="small text-secondary">${esc(c)}</th>`).join('')}</tr></thead>` +
  `<tbody>${rows.map(r => `<tr>${r.map(c => `<td class="small">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

// level: 'Tingkat 1 dari 3  •  Aktif'. Item tanpa layar (Riwayat Keputusan, Pengaturan) = href '#'.
export const sidebar = ({ role, level = '', items, active }) =>
  `<aside class="rl-sidebar d-flex flex-column p-3"><div class="fs-4 fw-bold mb-1"><i aria-hidden="true" class="bi bi-building me-2"></i>RoomLink</div><div class="small fw-semibold mb-4 text-uppercase rl-sidebar-muted">Portal Penyetuju</div>` +
  `<div class="rounded-3 p-3 mb-4 rl-sidebar-role"><div class="fw-semibold">${esc(role)}</div>${level ? `<div class="small rl-sidebar-muted">${esc(level)}</div>` : ''}</div>` +
  `<ul class="nav flex-column gap-2 flex-grow-1">${items.map(i => `<li><a class="nav-link py-2 ${i.label === active ? 'active' : ''}" href="${esc(i.href)}" ${i.label === active ? 'aria-current="page"' : ''}><i aria-hidden="true" class="bi bi-${i.icon} me-2"></i>${esc(i.label)}</a></li>`).join('')}</ul>` +
  `<hr class="rl-sidebar-muted"><button type="button" class="nav-link text-start small mb-3 rl-sidebar-muted" data-bs-toggle="modal" data-bs-target="#m-help">Butuh bantuan?</button>` +
  `<button type="button" class="nav-link text-start" data-role="logout"><i aria-hidden="true" class="bi bi-box-arrow-left me-2"></i>Keluar</button></aside>`;

// Linimasa horizontal portal: steps [{name, status, sub}] urutan tahap 1..3.
export const stepperH = steps =>
  `<div class="card"><div class="card-body d-flex align-items-center gap-3">${steps.map((s, i) =>
    `${i ? '<i aria-hidden="true" class="bi bi-arrow-right fs-5 text-secondary mx-auto"></i>' : ''}<div class="d-flex align-items-center gap-3 flex-grow-1">` +
    `<span class="rl-step-dot ${slug(s.status)}">${s.status === 'Disetujui' ? '<i aria-hidden="true" class="bi bi-check-lg"></i>' : i + 1}</span>` +
    `<div><div class="fw-semibold">${esc(s.name)}</div><div class="small ${s.status === 'Disetujui' ? 'text-success-emphasis' : ['Ditolak', 'Perlu Revisi'].includes(s.status) ? 'text-danger' : 'text-secondary'}">${esc(s.sub)}</div></div></div>`).join('')}</div></div>`;

export function showToast(message) {
  let box = document.getElementById('toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-box';
    box.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
    document.body.append(box);
  }
  const el = document.createElement('div');
  el.className = 'toast align-items-center text-bg-dark border-0';
  el.setAttribute('role', 'status');
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${esc(message)}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Tutup"></button></div>`;
  box.append(el);
  new bootstrap.Toast(el, { delay: 3000 }).show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}
