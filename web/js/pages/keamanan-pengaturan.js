import { esc } from '../ui/components.js';

export function renderSettings(user) {
  const row = (label, value) => `<dt class="col-4 fw-medium text-secondary">${label}</dt><dd class="col-8">${value}</dd>`;
  document.getElementById('content').innerHTML = `
    <h1 class="fs-2 fw-bold mb-2">Pengaturan</h1>
    <p class="text-secondary mb-4">Informasi akun Anda di RoomLink.</p>
    <div class="row"><div class="col-7">
      <div class="card mb-4"><div class="card-body p-4">
        <h2 class="fs-5 fw-semibold mb-3">Profil akun</h2>
        <dl class="row mb-0">
          ${row('Nama', esc(user.name))}
          ${row('Peran', esc(user.position))}
          ${row('Email', esc(user.login))}
        </dl>
        <p class="small text-secondary mb-0 mt-2">Data akun mengikuti akun kampus dan tidak dapat diubah di sini.</p>
      </div></div>
      <div class="card"><div class="card-body p-4 d-flex justify-content-between align-items-center gap-3">
        <div><div class="fw-semibold">Keluar dari akun</div><div class="small text-secondary">Sesi di perangkat ini akan diakhiri.</div></div>
        <button type="button" class="btn btn-danger-soft px-4" data-role="logout">Keluar</button>
      </div></div>
    </div></div>`;
}
