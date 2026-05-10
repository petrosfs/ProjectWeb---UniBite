// app.js — Κοινές συναρτήσεις frontend (φορτώνεται σε ΟΛΕΣ τις σελίδες)

// ─── API wrapper ──────────────────────────────────────────────────────────────
const API = {
  async call(method, url, data = null, isFormData = false) {
    const opts = { method, credentials: 'include' };
    if (data) {
      if (isFormData) {
        opts.body = data; // FormData — no Content-Type header (browser sets it)
      } else {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body    = JSON.stringify(data);
      }
    }
    const res  = await fetch(url, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Κάτι πήγε στραβά');
    return json;
  },
  get:    (url)             => API.call('GET',    url),
  post:   (url, data, fd)   => API.call('POST',   url, data, fd),
  put:    (url, data)       => API.call('PUT',     url, data),
  delete: (url)             => API.call('DELETE',  url),
};

// ─── Toast notifications ──────────────────────────────────────────────────────
function toast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, 3500);
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
async function checkAuth(requiredRole = null) {
  try {
    const user = await API.get('/api/auth/me');
    if (requiredRole && user.role !== requiredRole) {
      redirectByRole(user.role);
      return null;
    }
    // Εμφάνιση ονόματος & πόντων στο navbar
    const nameEl    = document.getElementById('user-name');
    const creditsEl = document.getElementById('user-credits');
    if (nameEl)    nameEl.textContent    = user.name;
    if (creditsEl) creditsEl.textContent = `${user.credits} πόντοι`;
    return user;
  } catch {
    window.location.href = '/index.html';
    return null;
  }
}

function redirectByRole(role) {
  if (role === 'cook')     window.location.href = '/cook.html';
  else if (role === 'consumer') window.location.href = '/feed.html';
  else if (role === 'admin')    window.location.href = '/admin.html';
  else window.location.href = '/index.html';
}

async function logout() {
  try { await API.post('/api/auth/logout'); } catch {}
  window.location.href = '/index.html';
}

// ─── Βοηθητικές ──────────────────────────────────────────────────────────────

// Αστέρια (εμφάνιση)
function starsHtml(rating, max = 5) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    html += `<span class="star ${i <= rating ? 'filled' : ''}">${i <= rating ? '★' : '☆'}</span>`;
  }
  return html;
}

// Αστέρια (κλικ για επιλογή)
function interactiveStars(containerId, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  el.dataset.value = 0;
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('span');
    s.className   = 'star interactive';
    s.textContent = '☆';
    s.dataset.value = i;
    s.addEventListener('mouseover', () => highlightStars(el, i));
    s.addEventListener('mouseout',  () => highlightStars(el, +el.dataset.value));
    s.addEventListener('click',     () => {
      el.dataset.value = i;
      highlightStars(el, i);
      if (onSelect) onSelect(i);
    });
    el.appendChild(s);
  }
}
function highlightStars(container, upTo) {
  container.querySelectorAll('.star').forEach((s, idx) => {
    s.textContent = idx < upTo ? '★' : '☆';
    s.classList.toggle('filled', idx < upTo);
  });
}

// Μορφοποίηση ημερομηνίας
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('el-GR', { dateStyle: 'short', timeStyle: 'short' });
}

// Haversine για απόσταση σε km
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Κατάσταση αγγελίας
function listingStatus(listing) {
  const expired = new Date(listing.expires_at) <= new Date();
  if (expired) return 'expired';
  return listing.portions_available > 0 ? 'active' : 'inactive';
}

function statusBadge(listing) {
  const s = listingStatus(listing);
  const map = {
    active:   ['Διαθέσιμο', 'badge-success'],
    inactive: ['Εξαντλήθηκε', 'badge-warning'],
    expired:  ['Έληξε', 'badge-danger'],
  };
  const [label, cls] = map[s];
  return `<span class="badge ${cls}">${label}</span>`;
}
