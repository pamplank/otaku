// Admin mode entry: the "Admin" button (or ?admin in the address) opens a
// passcode dialog; the server sets an HttpOnly cookie and the page reloads into
// admin mode. Public viewers never see the editing tools.
import { login, logout } from './shared.js';

export function setupAdminEntry(status) {
  const btn = document.getElementById('adminBtn');
  const dialog = document.getElementById('adminDialog');
  const form = document.getElementById('adminForm');
  const code = document.getElementById('adminCode');
  const err = document.getElementById('adminErr');
  const bar = document.getElementById('adminBar');

  const showError = (msg) => { err.textContent = msg; err.hidden = !msg; };
  const open = () => {
    dialog.hidden = false;
    showError(status.enabled ? '' : 'Admin mode isn’t set up on this site yet (ADMIN_PASSCODE).');
    code.value = '';
    code.focus();
  };
  const close = () => { dialog.hidden = true; };

  if (status.admin) {
    btn.hidden = true;
    bar.hidden = false;
    document.body.classList.add('is-admin');
    document.getElementById('adminLogout').addEventListener('click', async () => {
      await logout().catch(() => {});
      location.reload();
    });
    return;
  }

  btn.addEventListener('click', open);
  document.getElementById('adminCancel').addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    form.classList.add('is-busy');
    try {
      await login(code.value);
      location.reload();
    } catch (ex) {
      showError(ex.message);
      form.classList.remove('is-busy');
      code.select();
    }
  });
  if (new URLSearchParams(location.search).has('admin')) open();
}
