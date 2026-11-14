// Fungsi render komponen → string HTML. Tanpa aturan bisnis (itu di js/domain/).
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slug = s => s.toLowerCase().replace(/\s+/g, '-');

export const statusChip = status =>
  `<span class="badge badge-status badge-${slug(status)}">${esc(status)}</span>`;

export const filterChip = (label, key = '') =>
  `<span class="badge badge-filter rounded-pill">${esc(label)} <button type="button" class="btn-close btn-close-sm ms-1" style="font-size:.5rem" aria-label="Hapus filter ${esc(label)}" data-chip="${esc(key)}"></button></span>`;

// state: 'default' | 'loading' | 'disabled'; variant: primary | soft | danger
export function button(label, { variant = 'primary', state = 'default', full = true, id = '' } = {}) {
  const loading = state === 'loading';
  return `<button type="button" ${id && `id="${id}"`} class="btn btn-${variant} ${full ? 'w-100' : ''} ${loading ? 'is-loading' : ''}" ${state !== 'default' ? 'disabled' : ''}>` +
    `${loading ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>' : ''}${esc(label)}</button>`;
}

export function field({ id, label, placeholder = '', required = false, value = '', error = '' }) {
  return `<div class="mb-3"><label for="${id}" class="form-label fw-medium">${esc(label)}${required ? ' <span class="text-danger">*</span>' : ''}</label>` +
    `<input id="${id}" class="form-control ${error ? 'is-invalid' : ''}" placeholder="${esc(placeholder)}" value="${esc(value)}">` +
    `${error ? `<div class="invalid-feedback">${esc(error)}</div>` : ''}</div>`;
}

const opt = o => (typeof o === 'string' ? { value: o, label: o } : o);

export function select({ id, label, options, placeholder = '', required = false, error = '', value = '' }) {
  return `<div class="mb-3"><label for="${id}" class="form-label fw-medium">${esc(label)}${required ? ' <span class="text-danger">*</span>' : ''}</label>` +
    `<select id="${id}" class="form-select ${error ? 'is-invalid' : ''}">${placeholder ? `<option value="">${esc(placeholder)}</option>` : ''}${options.map(opt).map(o => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>` +
    `${error ? `<div class="invalid-feedback">${esc(error)}</div>` : ''}</div>`;
}

export const roomCard = ({ id = '', name, capacity, imageUrl = '', facilities = '' }) =>
  `<div class="card mb-3" ${id ? `data-room="${esc(id)}"` : ''}><div class="card-body d-flex gap-3">` +
  `<div class="rounded-3 bg-body-secondary flex-none" style="width:72px;height:72px;background:center/cover url('${esc(imageUrl)}')"></div>` +
  `<div class="flex-grow-1"><div class="fw-semibold">${esc(name)}</div>` +
  `<div class="small text-secondary">${capacity} orang · <span class="text-success">Tersedia</span></div>` +
  `<div class="small text-secondary">${esc(facilities)}</div>` +
  `<a href="#" class="btn btn-soft btn-sm mt-2 w-100">Pilih Ruangan <i class="bi bi-arrow-right"></i></a></div></div></div>`;

export const requestCard = ({ id, room, dateTime, status, href = '#' }) =>
  `<a href="${esc(href)}" class="card mb-3 text-decoration-none text-body"><div class="card-body">` +
  `<div class="d-flex justify-content-between align-items-start"><div class="fw-semibold">${esc(room)}</div>${statusChip(status)}</div>` +
  `<div class="small text-secondary mt-1">${esc(id)} · ${esc(dateTime)}</div></div></a>`;

export const notifCard = ({ title, body, time, unread = false }) =>
  `<div class="card mb-2 ${unread ? 'border-primary-subtle' : ''}"><div class="card-body d-flex gap-2">` +
  `<div class="flex-grow-1"><div class="fw-semibold small">${esc(title)}</div><div class="small text-secondary">${esc(body)}</div><div class="small text-secondary mt-1">${esc(time)}</div></div>` +
  `${unread ? '<span class="rl-dot" role="img" aria-label="Belum dibaca"></span>' : ''}</div></div>`;

// steps: [{name, person, status, note}] — urutan = tahap 1..3
export const stepper = steps => steps.map((s, i) =>
  `<div class="rl-step"><span class="rl-step-dot ${slug(s.status)}">${s.status === 'Disetujui' ? '<i class="bi bi-check-lg"></i>' : i + 1}</span>` +
  `<div class="flex-grow-1"><div class="d-flex justify-content-between align-items-center"><span class="fw-semibold">${esc(s.name)}</span>${statusChip(s.status)}</div>` +
  `<div class="small text-secondary">${esc(s.person)}</div><div class="small text-secondary">${esc(s.note ?? '')}</div></div></div>`).join('');

export const tabs = (items, active) =>
  `<ul class="nav nav-pills nav-fill gap-2 mb-3">${items.map(t => `<li class="nav-item"><a class="nav-link ${t === active ? 'active' : ''}" href="#">${esc(t)}</a></li>`).join('')}</ul>`;

// items: [{label, icon, href, active, count}]
export const bottomNav = items =>
  `<nav class="navbar fixed-bottom bottom-nav p-0"><ul class="nav nav-fill w-100">${items.map(i =>
    `<li class="nav-item"><a class="nav-link ${i.active ? 'active' : ''}" href="${esc(i.href)}"><i class="bi bi-${i.icon} fs-5"></i>${esc(i.label)}` +
    `${i.count ? `<span class="badge text-bg-danger rounded-pill">${i.count}</span>` : ''}</a></li>`).join('')}</ul></nav>`;

export const dayCell = (n, state = 'default', { date = '', label = '' } = {}) =>
  `<button type="button" class="rl-day ${state === 'selected' ? 'active' : ''}" ${state === 'disabled' ? 'disabled' : ''} ${date ? `data-date="${esc(date)}"` : ''} ${label ? `aria-label="${esc(label)}"` : ''} aria-pressed="${state === 'selected'}">${n}</button>`;

// Dialog konfirmasi (Batalkan / Buang isian). Buka lewat data-bs-toggle="modal".
export const confirmModal = ({ id, title, body, note = '', cancel, confirm, danger = true }) =>
  `<div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}-t" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content p-3">` +
  `<div class="modal-body"><h2 class="h5" id="${id}-t">${esc(title)}</h2><p class="text-secondary">${esc(body)}</p>${note ? `<p class="small text-secondary">${esc(note)}</p>` : ''}` +
  `<div class="d-grid gap-2"><button class="btn btn-soft" data-bs-dismiss="modal">${esc(cancel)}</button><button class="btn btn-${danger ? 'danger' : 'primary'}" data-role="confirm">${esc(confirm)}</button></div></div></div></div></div>`;

// Keputusan penyetuju: catatan wajib untuk Revisi/Tolak.
export const decisionModal = ({ id, title, confirm, danger = true, error = '' }) =>
  `<div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}-t" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content p-3">` +
  `<div class="modal-body"><h2 class="h5" id="${id}-t">${esc(title)}</h2>` +
  `<label for="${id}-n" class="form-label fw-medium">Catatan <span class="text-danger">*</span></label>` +
  `<textarea id="${id}-n" class="form-control ${error ? 'is-invalid' : ''}" rows="3"></textarea>${error ? `<div class="invalid-feedback">${esc(error)}</div>` : ''}` +
  `<div class="d-grid gap-2 mt-3"><button class="btn btn-soft" data-bs-dismiss="modal">Kembali</button><button class="btn btn-${danger ? 'danger' : 'primary'}" data-role="confirm">${esc(confirm)}</button></div></div></div></div></div>`;

// Filter ruangan: bottom sheet. jenis/kapasitas: string atau {value,label}; *Aktif = value terpilih.
export const filterSheet = ({ id, jenis, kapasitas, jenisAktif = '', kapasitasAktif = '' }) =>
  `<div class="offcanvas offcanvas-bottom rounded-top-4" tabindex="-1" id="${id}" aria-labelledby="${id}-t" style="max-width:430px;margin-inline:auto;height:auto">` +
  `<div class="offcanvas-header"><div><h2 class="h5 mb-0" id="${id}-t">Filter ruangan</h2><div class="small text-secondary">Sesuaikan dengan kebutuhan kegiatan.</div></div><button class="btn-close" data-bs-dismiss="offcanvas" aria-label="Tutup"></button></div>` +
  `<div class="offcanvas-body"><div class="fw-semibold mb-2">Jenis ruangan</div><div class="row g-2 mb-3">${jenis.map(opt).map(j => `<div class="col-6"><input type="radio" class="btn-check" name="jenis" value="${esc(j.value)}" id="${id}-j-${esc(j.value)}" ${j.value === jenisAktif ? 'checked' : ''}><label class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center" for="${id}-j-${esc(j.value)}">${esc(j.label)}</label></div>`).join('')}</div>` +
  `<div class="fw-semibold mb-2">Kapasitas</div>${kapasitas.map(opt).map(k => `<div class="form-check border rounded-3 p-2 ps-5 mb-2"><input class="form-check-input" type="radio" name="kap" value="${esc(k.value)}" id="${id}-k-${esc(k.value)}" ${k.value === kapasitasAktif ? 'checked' : ''}><label class="form-check-label w-100" for="${id}-k-${esc(k.value)}">${esc(k.label)}</label></div>`).join('')}` +
  `<div class="d-grid gap-2 mt-3">${button('Terapkan Filter', { id: `${id}-apply` })}<button type="button" class="btn btn-link text-secondary" id="${id}-reset">Reset filter</button></div></div></div>`;

// Empty state: icon bootstrap-icons, actions = HTML tombol.
export const emptyState = ({ icon, title, body, actions = '' }) =>
  `<div class="text-center py-5"><div class="rl-empty-icon mx-auto mb-4"><i class="bi bi-${icon} fs-3"></i></div>` +
  `<h2 class="h5 mb-2">${esc(title)}</h2><p class="text-secondary small mb-4">${body.split('\n').map(esc).join('<br>')}</p><div class="d-grid gap-2">${actions}</div></div>`;

// Nav bawah 3 tab (Kalender, Pengajuan Saya, Notifikasi + badge belum dibaca).
export const mainNav = (active, unread = 0) => bottomNav([
  { label: 'Kalender', icon: 'calendar3', href: 'index.html', active: active === 'Kalender' },
  { label: 'Pengajuan Saya', icon: 'file-earmark-text', href: 'pengajuan.html', active: active === 'Pengajuan Saya' },
  { label: 'Notifikasi', icon: 'bell', href: 'notifikasi.html', active: active === 'Notifikasi', count: unread },
]);

// Tabel portal: columns = ['No.', ...], rows = array of array HTML-aman (sudah di-escape/chip)
export const portalTable = (columns, rows) =>
  `<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="table-light"><tr>${columns.map(c => `<th scope="col" class="small text-secondary">${esc(c)}</th>`).join('')}</tr></thead>` +
  `<tbody>${rows.map(r => `<tr>${r.map(c => `<td class="small">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

export const sidebar = ({ role, items, active }) =>
  `<aside class="rl-sidebar d-flex flex-column p-3"><div class="fs-5 fw-bold mb-1"><i class="bi bi-building me-2"></i>RoomLink</div><div class="small mb-4 text-uppercase" style="opacity:.7">Portal Penyetuju</div>` +
  `<div class="rounded-3 p-2 mb-3" style="background:rgba(255,255,255,.08)"><div class="fw-semibold">${esc(role)}</div></div>` +
  `<ul class="nav flex-column gap-1 flex-grow-1">${items.map(i => `<li><a class="nav-link ${i.label === active ? 'active' : ''}" href="${esc(i.href)}"><i class="bi bi-${i.icon} me-2"></i>${esc(i.label)}</a></li>`).join('')}</ul>` +
  `<a class="nav-link text-white" href="#" data-role="logout"><i class="bi bi-box-arrow-left me-2"></i>Keluar</a></aside>`;

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
