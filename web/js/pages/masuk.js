import { getState, update, currentUser } from '../store.js';
import { authenticate, homeFor, MSG_LOGIN_FAIL } from '../domain/auth.js';
import { MSG } from '../domain/validation.js';
import { button, infoModal } from '../ui/components.js';

// Satu pintu masuk untuk semua peran. Sesi aktif → langsung ke beranda perannya.
const me = currentUser();
if (me) location.replace(homeFor(me));
else init();

function init() {
  document.getElementById('app').innerHTML = `
  <div class="rl-hero min-vh-100 d-flex flex-column align-items-center justify-content-center px-3 py-5">
    <div class="card rl-login-card w-100 border-0 shadow text-body">
      <div class="card-body p-4 p-sm-5">
        <div class="d-flex align-items-center gap-3 mb-4">
          <span class="rl-login-logo"><i aria-hidden="true" class="bi bi-door-closed fs-4"></i></span>
          <div><div class="fs-4 fw-bold lh-sm">RoomLink</div><div class="small fw-semibold text-uppercase text-secondary">Portal Akun Kampus</div></div>
        </div>
        <h1 class="h4 fw-bold mb-1">Selamat datang kembali</h1>
        <p class="text-secondary mb-4">Masuk dengan akun kampus Anda.</p>
        <form id="form" novalidate>
          <div class="mb-3">
            <label for="login" class="form-label fw-medium">Email / NIM <span class="text-danger">*</span></label>
            <input id="login" class="form-control" autocomplete="username" placeholder="nama@kampus.ac.id">
            <div id="login-err" class="invalid-feedback"></div>
          </div>
          <div class="mb-2">
            <label for="pass" class="form-label fw-medium">Kata sandi <span class="text-danger">*</span></label>
            <div class="input-group has-validation">
              <input id="pass" type="password" class="form-control" autocomplete="current-password">
              <button type="button" class="btn btn-outline-secondary" id="eye" aria-label="Tampilkan kata sandi" aria-pressed="false"><i aria-hidden="true" class="bi bi-eye"></i></button>
              <div id="pass-err" class="invalid-feedback"></div>
            </div>
          </div>
          <div class="text-end mb-3"><button type="button" class="btn btn-link small fw-semibold text-decoration-none px-0" data-bs-toggle="modal" data-bs-target="#m-forgot">Lupa kata sandi?</button></div>
          <div class="alert alert-danger py-2 small d-none" id="err" role="alert"></div>
          ${button('Masuk', { id: 'submit', type: 'submit' })}
        </form>
        <hr class="my-4">
        <p class="small text-secondary text-center mb-0">Akses untuk mahasiswa, dosen, pengurus UKM, dan penyetuju.</p>
      </div>
    </div>
    <p class="small text-white-50 mt-4 mb-0">Layanan digital kampus &nbsp;•&nbsp; RoomLink</p>
  </div>
  ${infoModal({ id: 'm-forgot', title: 'Lupa kata sandi?', body: ['Kata sandi mengikuti akun kampus Anda.', 'Untuk mengatur ulang, hubungi layanan TI kampus.'] })}`;

  const $ = id => document.getElementById(id);
  const setErr = (input, msg) => {
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    input.setAttribute('aria-describedby', input.id + '-err');
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
    if (!login.trim() || !pass) { $(login.trim() ? 'pass' : 'login').focus(); return; }

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
}
