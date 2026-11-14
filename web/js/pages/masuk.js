import { getState, update } from '../store.js';
import { authenticate, homeFor, MSG_LOGIN_FAIL } from '../domain/auth.js';
import { MSG } from '../domain/validation.js';
import { button } from '../ui/components.js';

const app = document.getElementById('app');
app.innerHTML = `
<header class="rl-hero px-4 pt-5 pb-5">
  <i class="bi bi-door-closed fs-1 text-white-50 d-block mb-4"></i>
  <h1 class="display-6 fw-bold mb-2">RoomLink</h1>
  <p class="fs-5 mb-3">Sistem Peminjaman<br>Ruangan Kampus</p>
  <p class="small text-white-50 mb-0">Ruang untuk ide besar Anda.</p>
</header>
<form class="p-4" id="form" novalidate>
  <h2 class="h4 fw-bold mb-1">Selamat datang kembali</h2>
  <p class="text-secondary mb-4">Masuk menggunakan akun kampus Anda.</p>
  <div class="mb-3">
    <label for="login" class="form-label fw-medium">Email / NIM <span class="text-danger">*</span></label>
    <input id="login" class="form-control" autocomplete="username" placeholder="nama@kampus.ac.id">
    <div class="invalid-feedback"></div>
  </div>
  <div class="mb-2">
    <label for="pass" class="form-label fw-medium">Kata sandi <span class="text-danger">*</span></label>
    <div class="input-group has-validation">
      <input id="pass" type="password" class="form-control" autocomplete="current-password">
      <button type="button" class="btn btn-outline-secondary" id="eye" aria-label="Tampilkan kata sandi" aria-pressed="false"><i class="bi bi-eye"></i></button>
      <div class="invalid-feedback"></div>
    </div>
  </div>
  <div class="text-end mb-4"><a href="#" class="small fw-semibold text-decoration-none">Lupa kata sandi?</a></div>
  <div class="alert alert-danger py-2 small d-none" id="err" role="alert"></div>
  ${button('Masuk', { id: 'submit' }).replace('type="button"', 'type="submit"')}
  <p class="small text-secondary mt-4">Akses untuk mahasiswa, dosen, dan pengurus UKM.</p>
  <p class="small text-secondary text-center mt-5 mb-0">Layanan digital kampus &nbsp;•&nbsp; RoomLink</p>
</form>`;

const $ = id => document.getElementById(id);
const setErr = (input, msg) => {
  input.classList.toggle('is-invalid', !!msg);
  input.closest('.mb-3, .mb-2').querySelector('.invalid-feedback').textContent = msg;
};

$('eye').onclick = () => {
  const show = $('pass').type === 'password';
  $('pass').type = show ? 'text' : 'password';
  $('eye').setAttribute('aria-pressed', show);
  $('eye').setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
  $('eye').firstElementChild.className = `bi bi-eye${show ? '-slash' : ''}`;
};

$('form').onsubmit = e => {
  e.preventDefault();
  const btn = $('submit');
  if (btn.disabled) return;
  $('err').classList.add('d-none');
  const login = $('login').value, pass = $('pass').value;
  setErr($('login'), login.trim() ? '' : MSG.REQUIRED);
  setErr($('pass'), pass ? '' : MSG.REQUIRED);
  if (!login.trim() || !pass) return;

  btn.disabled = true; // simulasi loading; isian tidak dihapus bila gagal
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Memproses…';
  setTimeout(() => {
    const user = authenticate(getState().users, login, pass);
    if (!user) {
      btn.disabled = false;
      btn.textContent = 'Masuk';
      $('err').textContent = MSG_LOGIN_FAIL;
      $('err').classList.remove('d-none');
      return;
    }
    update(s => { s.session = user.id; });
    location.href = homeFor(user);
  }, 600);
};
