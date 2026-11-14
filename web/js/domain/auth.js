// Login mock: email/NIM harus cocok akun demo, kata sandi bebas asal tidak kosong.
export const MSG_LOGIN_FAIL = 'Email/NIM atau kata sandi salah.';

export function authenticate(users, identifier = '', password = '') {
  const id = identifier.trim().toLowerCase();
  if (!id || !password) return null;
  return users.find(u => u.login.toLowerCase() === id || u.nim === id) ?? null;
}

export const homeFor = user => (user.role === 'pemohon' ? 'index.html' : 'penyetuju/index.html');
