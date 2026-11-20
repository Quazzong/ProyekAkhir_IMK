import { requireSession, currentUser, unreadCount } from '../store.js';
import { mainNav, bindLogout } from '../ui/components.js';
import { renderCalendar } from './index.js';
import { renderRooms } from './ruangan.js';
import { renderRequests } from './pengajuan.js';
import { renderNotifications } from './notifikasi.js';

const user = requireSession('pemohon', 'masuk.html');
if (user) init();

function init() {
  const nav = document.getElementById('nav');
  const pages = {
    'index.html': ['Kalender', () => renderCalendar(user, navigate)],
    'ruangan.html': ['Ruangan tersedia', () => renderRooms(view.signal)],
    'pengajuan.html': ['Pengajuan Saya', () => renderRequests(user)],
    'notifikasi.html': ['Notifikasi', () => renderNotifications(user, updateBadge)],
  };
  let view;
  nav.innerHTML = mainNav('Kalender', 0, user);
  bindLogout('masuk.html');

  function updateBadge(count) {
    for (const link of nav.querySelectorAll('a[href="notifikasi.html"]')) {
      let badge = link.querySelector('.badge');
      if (!count) { badge?.remove(); continue; }
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge text-bg-danger rounded-pill';
        link.append(badge);
      }
      badge.textContent = count;
    }
  }

  function render() {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (!pages[file] || currentUser()?.id !== user.id || document.querySelector('.modal.show, .offcanvas.show')) {
      location.reload();
      return;
    }
    view?.abort();
    view = new AbortController();
    document.getElementById('app').onclick = null;
    document.title = pages[file][0] + ' — RoomLink';
    const active = file === 'ruangan.html' ? 'index.html' : file;
    for (const link of nav.querySelectorAll('.nav-link')) {
      const selected = link.getAttribute('href') === active;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    updateBadge(unreadCount(user.id));
    pages[file][1]();
  }

  function navigate(href) {
    if (new URL(href, location.href).href !== location.href) history.pushState(null, '', href);
    render();
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || !Object.hasOwn(pages, link.getAttribute('href')) || link.target || event.defaultPrevented ||
        event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.href);
  });
  window.addEventListener('popstate', render);
  render();
}
