/**
 * APP.JS - Main Application Controller & Event Dispatcher (Clean Master Edition)
 * Coordinates Navigation, Elastic Nav Indicator, Dark/Light Mode, CRUD Modals,
 * Live Search Filters, Disposal Animation, and UI Rendering.
 */

// Ensure DB is globally available in this scope
var db = window.db || (typeof db !== 'undefined' ? db : null);

// Application State
let currentTab = 'dashboard';
let currentSelectedRoomId = null;
let currentUploadedAssetPhoto = '';
let temporaryKopBanner = '';
let temporaryLogo = '';
let temporaryDivisionLogo = '';
let isDarkMode = false;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initAuthSystem(); // Must run first to check session
  initDarkMode();
  initApp();
});

/**
 * ========================================================
 * 0. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
 * ========================================================
 */

/**
 * Called first on DOMContentLoaded.
 * Shows login overlay if user is not authenticated.
 * Sets up UI based on role after successful login.
 */
function initAuthSystem() {
  if (!AuthEngine.isLoggedIn()) {
    if (typeof navigateTo === 'function') {
      navigateTo('dashboard');
    }
    showLoginOverlay();
  } else {
    hideLoginOverlay();
    applyRoleUI();
  }
}

function showLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.style.zIndex = '99999';
    if (window.lucide) lucide.createIcons();
    // Focus username field
    setTimeout(() => {
      const input = document.getElementById('login-username');
      if (input) input.focus();
    }, 300);
  }
}

function hideLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
  }
}

/**
 * Apply UI restrictions & personalisation based on logged-in role.
 */
function applyRoleUI() {
  const user = AuthEngine.getCurrentUser();
  if (!user) return;

  // 1. Show topbar user badge
  const badge = document.getElementById('topbar-user-badge');
  if (badge) badge.style.display = 'flex';

  const nameEl = document.getElementById('topbar-user-name');
  if (nameEl) nameEl.textContent = user.displayName;

  const roleEl = document.getElementById('topbar-user-role');
  if (roleEl) roleEl.innerHTML = AuthEngine.getRoleBadgeHTML(user.role);

  const avatarEl = document.getElementById('topbar-user-avatar');
  if (avatarEl) {
    avatarEl.textContent = AuthEngine.getRoleIcon(user.role);
    avatarEl.title = `${user.displayName} (${AuthEngine.getRoleLabel(user.role)})`;
  }

  // 2. Sidebar & Settings Tabs based on role
  const navPengaturan = document.getElementById('nav-pengaturan');
  if (navPengaturan) {
    navPengaturan.style.display = ''; // Available for all roles
  }

  // Adjust settings tab visibility
  const tabProfil = document.getElementById('set-tab-profil');
  const tabCabang = document.getElementById('set-tab-cabang');
  const tabDivisi = document.getElementById('set-tab-divisi');
  const tabRuangan = document.getElementById('set-tab-ruangan');
  const tabKategori = document.getElementById('set-tab-kategori');
  const tabKode = document.getElementById('set-tab-kode');
  const tabDepresiasi = document.getElementById('set-tab-depresiasi');
  const tabBackup = document.getElementById('set-tab-backup');
  const tabUsers = document.getElementById('set-tab-users');
  const tabDatabase = document.getElementById('set-tab-database');

  if (AuthEngine.isAdmin()) {
    if (tabProfil) { tabProfil.style.display = ''; tabProfil.textContent = 'Profil & Kop Surat Pusat'; }
    if (tabCabang) tabCabang.style.display = '';
    if (tabDivisi) tabDivisi.style.display = '';
    if (tabRuangan) { tabRuangan.style.display = ''; tabRuangan.textContent = 'Master Ruangan'; }
    if (tabKategori) tabKategori.style.display = '';
    if (tabKode) tabKode.style.display = '';
    if (tabDepresiasi) tabDepresiasi.style.display = '';
    if (tabBackup) tabBackup.style.display = '';
    if (tabUsers) tabUsers.style.display = '';
    if (tabDatabase) tabDatabase.style.display = '';
  } else if (AuthEngine.isDivisi()) {
    if (tabProfil) { tabProfil.style.display = ''; tabProfil.textContent = 'Profil & Kop Divisi'; }
    if (tabCabang) tabCabang.style.display = 'none';
    if (tabDivisi) tabDivisi.style.display = 'none';
    if (tabRuangan) { tabRuangan.style.display = ''; tabRuangan.textContent = 'Master Ruangan Divisi'; }
    if (tabKategori) tabKategori.style.display = 'none';
    if (tabKode) tabKode.style.display = 'none';
    if (tabDepresiasi) tabDepresiasi.style.display = 'none';
    if (tabBackup) tabBackup.style.display = 'none';
    if (tabUsers) tabUsers.style.display = 'none';
    if (tabDatabase) tabDatabase.style.display = 'none';

    // Explicitly hide non-allowed subviews
    const forbiddenViews = ['set-view-cabang', 'set-view-divisi', 'set-view-kategori', 'set-view-kode', 'set-view-depresiasi', 'set-view-backup', 'set-view-users', 'set-view-database'];
    forbiddenViews.forEach(vid => {
      const el = document.getElementById(vid);
      if (el) el.classList.add('hidden');
    });
    const activeTabBtn = document.querySelector('.settings-tab-btn.active');
    if (activeTabBtn && ['set-tab-users', 'set-tab-database', 'set-tab-cabang', 'set-tab-divisi', 'set-tab-kategori', 'set-tab-kode', 'set-tab-depresiasi', 'set-tab-backup'].includes(activeTabBtn.id)) {
      switchSettingsTab('profil');
    }
  } else if (AuthEngine.isWilayah()) {
    if (tabProfil) { tabProfil.style.display = ''; tabProfil.textContent = 'Profil & Kop Cabang'; }
    if (tabCabang) tabCabang.style.display = 'none';
    if (tabDivisi) tabDivisi.style.display = 'none';
    if (tabRuangan) { tabRuangan.style.display = ''; tabRuangan.textContent = 'Master Ruangan Cabang'; }
    if (tabKategori) tabKategori.style.display = 'none';
    if (tabKode) tabKode.style.display = 'none';
    if (tabDepresiasi) tabDepresiasi.style.display = 'none';
    if (tabBackup) tabBackup.style.display = 'none';
    if (tabUsers) tabUsers.style.display = 'none';
    if (tabDatabase) tabDatabase.style.display = 'none';

    // Explicitly hide non-allowed subviews
    const forbiddenViews = ['set-view-cabang', 'set-view-divisi', 'set-view-kategori', 'set-view-kode', 'set-view-depresiasi', 'set-view-backup', 'set-view-users', 'set-view-database'];
    forbiddenViews.forEach(vid => {
      const el = document.getElementById(vid);
      if (el) el.classList.add('hidden');
    });
    const activeTabBtn = document.querySelector('.settings-tab-btn.active');
    if (activeTabBtn && ['set-tab-users', 'set-tab-database', 'set-tab-cabang', 'set-tab-divisi', 'set-tab-kategori', 'set-tab-kode', 'set-tab-depresiasi', 'set-tab-backup'].includes(activeTabBtn.id)) {
      switchSettingsTab('profil');
    }
  }

  // 3. Sidebar: show scope badge for non-admin
  const scopeBadge = document.getElementById('sidebar-scope-badge');
  const scopeName = document.getElementById('sidebar-scope-name');
  const scopeRoleBadge = document.getElementById('sidebar-scope-role-badge');
  if (!AuthEngine.isAdmin() && scopeBadge) {
    scopeBadge.classList.remove('hidden');
    if (scopeName) scopeName.textContent = user.scopeName || user.displayName;
    if (scopeRoleBadge) scopeRoleBadge.innerHTML = AuthEngine.getRoleBadgeHTML(user.role);
  } else if (scopeBadge) {
    scopeBadge.classList.add('hidden');
  }

  // 4. Sync filter dropdowns and lock states across pages
  try {
    const filterDivIds = ['filter-divisi', 'dash-filter-division', 'kir-filter-division', 'filter-kib-divisi'];
    const filterBranchIds = ['filter-cabang', 'dash-filter-branch', 'kir-filter-branch', 'filter-kib-cabang'];

    if (AuthEngine.isAdmin()) {
      filterDivIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = false; el.classList.remove('opacity-75', 'cursor-not-allowed'); }
      });
      filterBranchIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = false; el.classList.remove('opacity-75', 'cursor-not-allowed'); }
      });
    } else if (AuthEngine.isDivisi() && user.scopeId) {
      filterDivIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.value = user.scopeId;
          el.disabled = true;
          el.classList.add('opacity-75', 'cursor-not-allowed');
        }
      });
    } else if (AuthEngine.isWilayah() && user.scopeId) {
      filterBranchIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.value = user.scopeId;
          el.disabled = true;
          el.classList.add('opacity-75', 'cursor-not-allowed');
        }
      });
    }
  } catch (e) {
    console.warn('Error syncing filter scopes', e);
  }

  // Refresh icons
  if (window.lucide) lucide.createIcons();
}

/** Handle login form submission */
function handleLoginSubmit() {
  const username = (document.getElementById('login-username')?.value || '').trim();
  const password = (document.getElementById('login-password')?.value || '');
  const errorDiv = document.getElementById('login-error');
  const errorMsg = document.getElementById('login-error-msg');
  const card = document.querySelector('.login-card');

  if (!username || !password) {
    if (errorMsg) errorMsg.textContent = 'Username dan password wajib diisi.';
    if (errorDiv) errorDiv.classList.remove('hidden');
    return;
  }

  const result = AuthEngine.login(username, password);
  if (result.success) {
    if (errorDiv) errorDiv.classList.add('hidden');
    hideLoginOverlay();
    applyRoleUI();
    if (typeof navigateTo === 'function') {
      navigateTo('dashboard');
    }
    initApp(); // Reload app data with correct scope
    showToast(`✅ Selamat datang, ${result.user.displayName}! (${AuthEngine.getRoleLabel(result.user.role)})`, 'success');
    // Hide hint after first login
    const hint = document.getElementById('login-hint');
    if (hint) hint.style.display = 'none';
  } else {
    if (errorMsg) errorMsg.textContent = result.message;
    if (errorDiv) errorDiv.classList.remove('hidden');
    // Shake animation
    if (card) {
      card.classList.remove('login-shake');
      void card.offsetWidth; // reflow
      card.classList.add('login-shake');
      setTimeout(() => card.classList.remove('login-shake'), 500);
    }
    // Clear password field
    const pwField = document.getElementById('login-password');
    if (pwField) { pwField.value = ''; pwField.focus(); }
  }
}

/** Logout the current user */
function handleLogout() {
  AuthEngine.logout();

  // Reset UI
  const badge = document.getElementById('topbar-user-badge');
  if (badge) badge.style.display = 'none';
  const scopeBadge = document.getElementById('sidebar-scope-badge');
  if (scopeBadge) scopeBadge.classList.add('hidden');

  // Stop camera if scanner was active
  if (typeof QREngine !== 'undefined' && typeof QREngine.stopCamera === 'function') {
    QREngine.stopCamera();
  }

  // Clear password & username fields for security
  const pwField = document.getElementById('login-password');
  if (pwField) pwField.value = '';
  const usernameField = document.getElementById('login-username');
  if (usernameField) usernameField.value = '';
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) errorDiv.classList.add('hidden');

  // Close any open modals if any
  document.querySelectorAll('.modal-overlay, [id^="modal-"]').forEach(m => {
    if (m.id !== 'login-overlay') {
      m.classList.add('hidden');
      m.style.display = 'none';
    }
  });

  // Explicitly pop open the login overlay
  showLoginOverlay();

  // Cleanly reload window so app starts fresh on login screen with dashboard ready
  setTimeout(() => {
    window.location.reload();
  }, 150);
}

// Explicit global exports for inline HTML event handlers
window.handleLogout = handleLogout;
window.showLoginOverlay = showLoginOverlay;
window.hideLoginOverlay = hideLoginOverlay;
window.handleLoginSubmit = handleLoginSubmit;
window.quickFillLogin = quickFillLogin;
window.toggleLoginPasswordVisibility = toggleLoginPasswordVisibility;

/** Toggle password visibility on login form */
function toggleLoginPasswordVisibility() {
  const input = document.getElementById('login-password');
  const icon = document.getElementById('login-pw-eye');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  if (window.lucide) lucide.createIcons();
}

/** Quick fill credentials from hint helper */
function quickFillLogin(username, password) {
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  if (uInput) uInput.value = username;
  if (pInput) pInput.value = password;
  handleLoginSubmit();
}

// ── User Management Functions (Admin Only) ─────────────────────────

/** Render the users table in Manajemen User tab */
function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  const users = AuthEngine.getUsers();
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-slate-400 text-xs">Belum ada user terdaftar.</td></tr>`;
    return;
  }
  tbody.innerHTML = users.map(u => {
    const currentU = AuthEngine.getCurrentUser();
    const isCurrentUser = (u.id && currentU?.userId && u.id === currentU.userId) || (u.username && currentU?.username && u.username === currentU.username);
    const isAdmin = u.id === 'USR-ADMIN' || u.username === 'admin';
    const userIdOrName = u.id || u.username;
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isCurrentUser ? 'bg-amber-500/5' : ''}">
        <td class="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
          ${u.username}
          ${isCurrentUser ? '<span class="ml-1 text-[9px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded font-semibold">ANDA</span>' : ''}
        </td>
        <td class="p-3 text-slate-700 dark:text-slate-300">${u.displayName || u.username}</td>
        <td class="p-3">${AuthEngine.getRoleBadgeHTML(u.role)}</td>
        <td class="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
          ${u.role === 'admin' ? '<span class="text-amber-500 font-semibold">Semua Data</span>' : (u.scopeName || '-')}
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button type="button" onclick="openModalEditUser('${userIdOrName}')" class="p-1.5 rounded-lg text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-colors" title="Edit User">
              <i data-lucide="edit" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" onclick="openModalResetPassword('${userIdOrName}')" class="p-1.5 rounded-lg text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors" title="Reset Password">
              <i data-lucide="key" class="w-3.5 h-3.5"></i>
            </button>
            ${!isAdmin ? `<button type="button" onclick="handleDeleteUser('${userIdOrName}', '${u.username}')" class="p-1.5 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors" title="Hapus User">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

/** Open modal to add new user */
window.openModalTambahUser = function() {
  try {
    const titleEl = document.getElementById('modal-user-title');
    if (titleEl) titleEl.textContent = 'Tambah User Baru';
    
    const idEl = document.getElementById('user-form-id');
    if (idEl) idEl.value = '';
    
    const usernameEl = document.getElementById('user-form-username');
    if (usernameEl) {
      usernameEl.value = '';
      usernameEl.disabled = false;
    }
    
    const nameEl = document.getElementById('user-form-displayname');
    if (nameEl) nameEl.value = '';
    
    const pwEl = document.getElementById('user-form-password');
    if (pwEl) pwEl.value = '';
    
    const roleEl = document.getElementById('user-form-role');
    if (roleEl) roleEl.value = '';
    
    const hintEl = document.getElementById('user-pw-hint');
    if (hintEl) hintEl.textContent = 'Wajib diisi untuk user baru.';
    
    const scopeSection = document.getElementById('user-form-scope-section');
    if (scopeSection) scopeSection.classList.add('hidden');
    
    populateUserScopeDropdowns();
    openModal('modal-user');
  } catch (err) {
    console.error('[openModalTambahUser] Error:', err);
    alert('Terjadi kesalahan: ' + err.message);
  }
};

/** Open modal to edit existing user */
window.openModalEditUser = function(userId) {
  try {
    let user = null;
    if (typeof AuthEngine !== 'undefined' && AuthEngine.getUserById) {
      user = AuthEngine.getUserById(userId) || AuthEngine.getUserByUsername(userId);
    }
    if (!user) {
      try {
        const rawUsers = JSON.parse(localStorage.getItem('asetpro_users_v1') || '[]');
        user = rawUsers.find(u => u.id === userId || u.username === userId);
      } catch (e) {}
    }
    if (!user) {
      showToast('❌ User tidak ditemukan: ' + userId, 'danger');
      return;
    }

    const titleEl = document.getElementById('modal-user-title');
    if (titleEl) titleEl.textContent = 'Edit User';

    const idEl = document.getElementById('user-form-id');
    if (idEl) idEl.value = user.id || user.username;

    const usernameEl = document.getElementById('user-form-username');
    if (usernameEl) {
      usernameEl.value = user.username || '';
      usernameEl.disabled = (user.id === 'USR-ADMIN' || user.username === 'admin');
    }

    const nameEl = document.getElementById('user-form-displayname');
    if (nameEl) nameEl.value = user.displayName || user.username || '';

    const pwEl = document.getElementById('user-form-password');
    if (pwEl) pwEl.value = '';

    const roleEl = document.getElementById('user-form-role');
    if (roleEl) roleEl.value = user.role || 'admin';

    const hintEl = document.getElementById('user-pw-hint');
    if (hintEl) hintEl.textContent = 'Kosongkan untuk tidak mengubah password.';

    populateUserScopeDropdowns();
    onUserRoleChange();

    if (user.role === 'divisi') {
      const sel = document.getElementById('user-form-scope-divisi');
      if (sel) sel.value = user.scopeId || '';
    } else if (user.role === 'wilayah') {
      const sel = document.getElementById('user-form-scope-wilayah');
      if (sel) sel.value = user.scopeId || '';
    }

    openModal('modal-user');
  } catch (err) {
    console.error('[openModalEditUser] Error:', err);
    alert('Terjadi kesalahan saat membuka modal edit: ' + err.message);
  }
};

/** Populate scope dropdowns from db */
function populateUserScopeDropdowns() {
  const fallbackDivisions = [
    { id: 'DIV-001', name: 'Divisi Riayah & Sarpras' },
    { id: 'DIV-002', name: 'Pondok & Pendidikan Santri' },
    { id: 'DIV-003', name: 'Kantor Sekretariat & Humas' }
  ];
  const fallbackBranches = [
    { id: 'BR-001', name: 'Munzalan Pusat (Kubu Raya / Pontianak)' },
    { id: 'BR-002', name: 'Munzalan Cabang Sambas' },
    { id: 'BR-003', name: 'Munzalan Cabang Singkawang' },
    { id: 'BR-004', name: 'Munzalan Cabang Sintang' },
    { id: 'BR-005', name: 'Munzalan Cabang Mempawah' },
    { id: 'BR-006', name: 'Munzalan Cabang Ketapang' }
  ];

  // Divisi dropdown
  const selDiv = document.getElementById('user-form-scope-divisi');
  if (selDiv) {
    let divisions = [];
    try {
      if (typeof db !== 'undefined' && db && typeof db.getDivisions === 'function') {
        divisions = db.getDivisions();
      } else if (window.db && typeof window.db.getDivisions === 'function') {
        divisions = window.db.getDivisions();
      } else {
        divisions = JSON.parse(localStorage.getItem('asetpro_divisions_v2') || '[]');
      }
    } catch (e) {
      divisions = JSON.parse(localStorage.getItem('asetpro_divisions_v2') || '[]');
    }

    if (!divisions || divisions.length === 0) {
      divisions = (typeof DEFAULT_DIVISIONS !== 'undefined' && DEFAULT_DIVISIONS.length > 0) ? DEFAULT_DIVISIONS : fallbackDivisions;
    }

    selDiv.innerHTML = `<option value="">-- Pilih Divisi --</option>` +
      divisions.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  }

  // Wilayah/Cabang dropdown
  const selBr = document.getElementById('user-form-scope-wilayah');
  if (selBr) {
    let branches = [];
    try {
      if (typeof db !== 'undefined' && db && typeof db.getBranches === 'function') {
        branches = db.getBranches();
      } else if (window.db && typeof window.db.getBranches === 'function') {
        branches = window.db.getBranches();
      } else {
        branches = JSON.parse(localStorage.getItem('asetpro_branches_v2') || '[]');
      }
    } catch (e) {
      branches = JSON.parse(localStorage.getItem('asetpro_branches_v2') || '[]');
    }

    if (!branches || branches.length === 0) {
      branches = (typeof DEFAULT_BRANCHES !== 'undefined' && DEFAULT_BRANCHES.length > 0) ? DEFAULT_BRANCHES : fallbackBranches;
    }

    selBr.innerHTML = `<option value="">-- Pilih Wilayah / Cabang --</option>` +
      branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  }
}

/** Toggle scope dropdown visibility based on selected role */
function onUserRoleChange() {
  const role = document.getElementById('user-form-role')?.value;
  const scopeSection = document.getElementById('user-form-scope-section');
  const selDiv = document.getElementById('user-form-scope-divisi');
  const selBr = document.getElementById('user-form-scope-wilayah');
  if (!scopeSection) return;
  if (role === 'admin') {
    scopeSection.classList.add('hidden');
    if (selDiv) selDiv.classList.add('hidden');
    if (selBr) selBr.classList.add('hidden');
  } else if (role === 'divisi') {
    scopeSection.classList.remove('hidden');
    if (selDiv) selDiv.classList.remove('hidden');
    if (selBr) selBr.classList.add('hidden');
  } else if (role === 'wilayah') {
    scopeSection.classList.remove('hidden');
    if (selDiv) selDiv.classList.add('hidden');
    if (selBr) selBr.classList.remove('hidden');
  } else {
    scopeSection.classList.add('hidden');
  }
}

/** Save user (add or edit) */
function handleSaveUser(event) {
  event.preventDefault();
  const id = document.getElementById('user-form-id').value;
  const username = document.getElementById('user-form-username').value.trim().toLowerCase();
  const displayName = document.getElementById('user-form-displayname').value.trim();
  const password = document.getElementById('user-form-password').value;
  const role = document.getElementById('user-form-role').value;
  const isNew = !id;

  if (!username || !displayName || !role) {
    showToast('❌ Lengkapi semua field yang wajib diisi.', 'danger'); return;
  }
  if (isNew && !password) {
    showToast('❌ Password wajib diisi untuk user baru.', 'danger'); return;
  }
  if (password && password.length < 6) {
    showToast('❌ Password minimal 6 karakter.', 'danger'); return;
  }

  // Check username uniqueness for new users
  if (isNew) {
    const existing = AuthEngine.getUserByUsername(username);
    if (existing) {
      showToast(`❌ Username "${username}" sudah digunakan. Pilih username lain.`, 'danger'); return;
    }
  }

  // Determine scope
  let scopeId = null, scopeName = '';
  if (role === 'divisi') {
    const sel = document.getElementById('user-form-scope-divisi');
    scopeId = sel?.value || null;
    scopeName = sel?.options[sel.selectedIndex]?.text || '';
    if (!scopeId) { showToast('❌ Pilih Divisi untuk role Divisi.', 'danger'); return; }
  } else if (role === 'wilayah') {
    const sel = document.getElementById('user-form-scope-wilayah');
    scopeId = sel?.value || null;
    scopeName = sel?.options[sel.selectedIndex]?.text || '';
    if (!scopeId) { showToast('❌ Pilih Wilayah untuk role Wilayah.', 'danger'); return; }
  }

  const userObj = {
    id: id || `USR-${Date.now()}`,
    username,
    displayName,
    role,
    scopeId,
    scopeName,
    createdAt: isNew ? new Date().toISOString() : undefined
  };
  if (password) userObj.password = password;

  AuthEngine.saveUser(userObj);
  closeModal('modal-user');
  renderUsersTable();
  showToast(isNew ? `✅ User "${username}" berhasil ditambahkan.` : `✅ User "${username}" berhasil diperbarui.`, 'success');
}

/** Delete user with confirmation */
function handleDeleteUser(userId, username) {
  if (!confirm(`Hapus user "${username}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  const ok = AuthEngine.deleteUser(userId);
  if (ok) {
    renderUsersTable();
    showToast(`🗑️ User "${username}" berhasil dihapus.`, 'success');
  } else {
    showToast('❌ Tidak bisa menghapus akun Administrator utama.', 'danger');
  }
}

/** Open reset password modal */
function openModalResetPassword(userId) {
  const user = AuthEngine.getUserById(userId) || AuthEngine.getUserByUsername(userId);
  if (!user) {
    showToast('❌ User tidak ditemukan.', 'danger');
    return;
  }
  document.getElementById('reset-pw-user-id').value = user.id || user.username;
  document.getElementById('reset-pw-username').textContent = user.username;
  document.getElementById('reset-pw-new').value = '';
  openModal('modal-reset-pw');
}

/** Handle reset password form submit */
function handleResetPassword(event) {
  event.preventDefault();
  const userId = document.getElementById('reset-pw-user-id').value;
  const newPw = document.getElementById('reset-pw-new').value;
  if (!newPw || newPw.length < 6) {
    showToast('❌ Password baru minimal 6 karakter.', 'danger'); return;
  }
  AuthEngine.saveUser({ id: userId, password: newPw });
  closeModal('modal-reset-pw');
  showToast('✅ Password berhasil direset.', 'success');
}

/** Toggle visibility for user modal password */
function toggleUserPasswordVisibility() {
  const input = document.getElementById('user-form-password');
  const icon = document.getElementById('user-pw-eye');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  if (icon) icon.setAttribute('data-lucide', input.type === 'password' ? 'eye' : 'eye-off');
  if (window.lucide) lucide.createIcons();
}

/** Toggle visibility for reset password modal */
function toggleResetPwVisibility() {
  const input = document.getElementById('reset-pw-new');
  const icon = document.getElementById('reset-pw-eye');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  if (icon) icon.setAttribute('data-lucide', input.type === 'password' ? 'eye' : 'eye-off');
  if (window.lucide) lucide.createIcons();
}


/**
 * ========================================================
 * 1. THEME ENGINE: DARK / LIGHT MODE WITH NEON TOGGLE
 * ========================================================
 */
function initDarkMode() {
  const savedTheme = localStorage.getItem('asetpro_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);

  applyDarkModeState(isDarkMode);

  const themeSwitch = document.getElementById('theme-switch');
  if (themeSwitch) {
    themeSwitch.checked = isDarkMode;
  }
}

function toggleDarkMode(enableDark) {
  isDarkMode = enableDark;
  localStorage.setItem('asetpro_theme', isDarkMode ? 'dark' : 'light');
  
  const themeSwitch = document.getElementById('theme-switch');
  if (themeSwitch && themeSwitch.checked !== enableDark) {
    themeSwitch.checked = enableDark;
  }

  applyDarkModeState(isDarkMode);
  showToast(isDarkMode ? '🌙 Mode Gelap Aktif' : '☀️ Mode Terang Aktif', 'info');
}

function handleSidebarThemeClick(event) {
  if (event && (event.target.closest('#theme-switch') || event.target.closest('.neon-toggle'))) {
    return;
  }
  toggleDarkMode(!isDarkMode);
}

function applyDarkModeState(enableDark) {
  const html = document.documentElement;
  const body = document.body;
  if (enableDark) {
    html.classList.add('dark');
    html.classList.remove('light');
    body.classList.add('dark');
    body.classList.remove('light');
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
    body.classList.remove('dark');
    body.classList.add('light');
  }

  const themeLabel = document.getElementById('sidebar-theme-label');
  if (themeLabel) {
    themeLabel.textContent = enableDark ? 'Mode Gelap' : 'Mode Terang';
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * ========================================================
 * 2. SIDEBAR NAVIGATION CONTROLLER
 * ========================================================
 */
const PAGE_TITLES = {
  dashboard: 'Dashboard Utama & Ringkasan Nilai Aset',
  aset: 'Daftar Induk Aset & Pencarian Inventaris',
  bhp: 'Pencatatan Barang Habis Pakai (Non-Aset / Perlengkapan)',
  ruangan: 'Kartu Inventaris Ruangan (KIR)',
  kib: 'Kartu Inventaris Barang (KIB)',
  stiker: 'Pusat Stikerisasi & Cetak Stiker QR Aset',
  scanner: 'Scan Kamera QR Code & Cek Aset',
  disposal: 'Riwayat Penghapusan & Pemutihan Aset',
  peminjaman: 'Pencatatan Peminjaman & Pengembalian',
  bast: 'BAST & Pernyataan Kesanggupan Pemegang Aset',
  mutasi: 'Mutasi & Pemindahan Lokasi Barang Inventaris',
  laporan: 'Pusat Cetak Laporan (Format A4 / F4)',
  pengaturan: 'Pengaturan Sistem & Format Kop Surat'
};

window.navigateTo = function(pageId) {
  // If user is not logged in and tries to navigate, enforce login overlay
  if (!AuthEngine.isLoggedIn() && pageId !== 'dashboard') {
    showLoginOverlay();
    return;
  }

  // Support common aliases
  if (pageId === 'data-aset') pageId = 'aset';
  if (pageId === 'non-aset' || pageId === 'consumables') pageId = 'bhp';
  if (pageId === 'rooms') pageId = 'ruangan';
  if (pageId === 'settings') pageId = 'pengaturan';
  if (pageId === 'reports') pageId = 'laporan';

  // ── RBAC Access Guard ──
  if (AuthEngine.isLoggedIn() && pageId !== 'dashboard' && !AuthEngine.canAccess(pageId)) {
    showToast('⛔ Akses ditolak. Halaman ini hanya untuk Administrator.', 'danger');
    pageId = 'dashboard'; // Redirect to dashboard
  }

  currentTab = pageId;

  // 1. Hide all sections
  document.querySelectorAll('.page-content').forEach(el => {
    el.classList.add('hidden');
    el.style.display = 'none';
  });

  // 2. Show target section
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.remove('hidden');
    target.style.display = 'block';
  }

  // 3. Update Sidebar Nav Link Active States
  document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${pageId}`);
  if (activeNav) {
    activeNav.classList.add('active');
  }

  // 4. Update Topbar Page Title
  const topbarTitle = document.getElementById('topbar-page-title');
  if (topbarTitle && PAGE_TITLES[pageId]) {
    topbarTitle.textContent = PAGE_TITLES[pageId];
  }

  // 5. Specific page lifecycle hooks
  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'aset') {
    populateDropdowns();
    renderAssetTable();
  }
  if (pageId === 'bhp') {
    populateBHPFilterDropdowns();
    renderBHPPage();
  }
  if (pageId === 'ruangan') {
    renderRoomCards();
    if (currentSelectedRoomId) selectRoom(currentSelectedRoomId);
  }
  if (pageId === 'kib') {
    populateKIBDropdowns();
    renderKIBPage();
  }
  if (pageId === 'stiker') {
    initStickerPage();
  }
  if (pageId === 'scanner') {
    renderStickerGrid();
  } else {
    // If leaving scanner tab, stop camera
    if (typeof QREngine !== 'undefined') QREngine.stopCamera();
  }
  if (pageId === 'disposal') initDisposalPage();
  if (pageId === 'peminjaman') renderLendingTable();
  if (pageId === 'bast') renderBASTTable();
  if (pageId === 'mutasi') {
    populateMutasiFilterDropdowns();
    renderMutasiTable();
  }
  if (pageId === 'laporan') updateReportPreview();
  if (pageId === 'pengaturan') {
    loadSettingsForm();
    // Manajemen User tab only for admin
    const tabUsers = document.getElementById('set-tab-users');
    if (tabUsers) tabUsers.style.display = AuthEngine.isAdmin() ? '' : 'none';
  }

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (window.lucide) lucide.createIcons();
};

function toggleSidebarDrawer() {
  const sidebar = document.getElementById('main-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && backdrop) {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    if (isOpen) {
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    } else {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    }
  }
}

function closeSidebarOnMobile() {
  const sidebar = document.getElementById('main-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && backdrop && window.innerWidth < 1024) {
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  }
}

let isSidebarPinned = false;

function initSidebarPin() {
  const savedPin = localStorage.getItem('asetpro_sidebar_pinned');
  isSidebarPinned = savedPin === 'true';
  applySidebarPinState(isSidebarPinned);
}

function togglePinSidebar() {
  isSidebarPinned = !isSidebarPinned;
  localStorage.setItem('asetpro_sidebar_pinned', isSidebarPinned ? 'true' : 'false');
  applySidebarPinState(isSidebarPinned);
  showToast(isSidebarPinned ? '📌 Sidebar dikunci (Lebar Tetap)' : '⚡ Mode Auto-Hide / Mini Rail Aktif', 'info');
}

function applySidebarPinState(pinned) {
  const sidebar = document.getElementById('main-sidebar');
  const pinBtn = document.getElementById('btn-pin-sidebar');
  if (sidebar) {
    if (pinned) {
      sidebar.classList.add('is-pinned');
      if (pinBtn) pinBtn.classList.add('pinned');
    } else {
      sidebar.classList.remove('is-pinned');
      if (pinBtn) pinBtn.classList.remove('pinned');
    }
  }
}

// Bind explicit click listeners to all nav elements
function initNavListeners() {
  document.querySelectorAll('[data-nav-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-nav-target');
      if (targetId) {
        window.navigateTo(targetId);
        closeSidebarOnMobile();
      }
    });
  });
}

/**
 * ========================================================
 * 3. APPLICATION INITIALIZATION & HEADER
 * ========================================================
 */
function initApp() {
  try { initSidebarPin(); } catch (e) { console.warn(e); }
  try { initNavListeners(); } catch (e) { console.warn(e); }
  try { updateHeaderInstansiInfo(); } catch (e) { console.warn(e); }
  try { populateDropdowns(); } catch (e) { console.warn(e); }
  try { populateKIBDropdowns(); } catch (e) { console.warn(e); }
  try { renderDashboard(); } catch (e) { console.warn(e); }
  try { renderAssetTable(); } catch (e) { console.warn(e); }
  try { renderKIBPage(); } catch (e) { console.warn(e); }
  try { renderRoomCards(); } catch (e) { console.warn(e); }
  try { renderDisposalTable(); } catch (e) { console.warn(e); }
  try { renderLendingTable(); } catch (e) { console.warn(e); }
  try { renderBASTTable(); } catch (e) { console.warn(e); }
  try { renderStickerGrid(); } catch (e) { console.warn(e); }
  try { loadSettingsForm(); } catch (e) { console.warn(e); }
  try { updateNotificationCenter(); } catch (e) { console.warn(e); }

  // If rooms exist, select the first room by default
  try {
    const rooms = db.getRooms();
    if (rooms && rooms.length > 0) {
      selectRoom(rooms[0].id);
    }
  } catch (e) {
    console.warn(e);
  }

  try {
    if (window.lucide) {
      lucide.createIcons();
    }
  } catch (e) {
    console.warn(e);
  }
}

function updateHeaderInstansiInfo() {
  const settings = db.getSettings();
  const nameElem = document.getElementById('header-instansi-name');
  const subElem = document.getElementById('header-instansi-sub');
  const dashTitle = document.getElementById('dash-instansi-title');

  if (nameElem) nameElem.textContent = 'Masjid Kapal';
  if (subElem) subElem.textContent = 'Munzalan Mubarakan';
  if (dashTitle) dashTitle.textContent = settings.instansiName || 'MASJID KAPAL MUNZALAN MUBARAKAN';
}

/**
 * ========================================================
 * 4. NOTIFICATION CENTER
 * ========================================================
 */
function toggleNotificationPanel() {
  const panel = document.getElementById('notif-panel');
  if (panel) panel.classList.toggle('hidden');
}

function updateNotificationCenter() {
  const notifications = DepreciationEngine.generateNotifications();
  const notifBadge = document.getElementById('notif-badge');
  const notifCountBadge = document.getElementById('notif-count-badge');
  const notifList = document.getElementById('notif-list');

  if (notifBadge && notifCountBadge && notifList) {
    if (notifications.length > 0) {
      notifBadge.classList.remove('hidden');
      notifCountBadge.textContent = `${notifications.length} Perlu Tindakan`;
      notifCountBadge.className = 'text-xs bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold px-2 py-0.5 rounded-full';
    } else {
      notifBadge.classList.add('hidden');
      notifCountBadge.textContent = 'Semua Aman';
      notifCountBadge.className = 'text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full';
    }

    if (notifications.length === 0) {
      notifList.innerHTML = `
        <div class="py-8 text-center text-slate-400">
          <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-1 text-emerald-500"></i>
          <p class="text-xs">Tidak ada peringatan atau masalah pada aset.</p>
        </div>
      `;
    } else {
      notifList.innerHTML = notifications.map(n => `
        <div class="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors cursor-pointer" onclick="handleNotificationClick('${n.actionType}', '${n.targetId}')">
          <div class="flex items-start gap-2">
            <span class="text-${n.type === 'danger' ? 'rose' : (n.type === 'warning' ? 'amber' : 'blue')}-500 font-bold text-xs">●</span>
            <div>
              <h5 class="text-xs font-bold text-slate-800 dark:text-slate-100">${n.title}</h5>
              <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">${n.message}</p>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (window.lucide) lucide.createIcons();
  }
}

function handleNotificationClick(actionType, targetId) {
  toggleNotificationPanel();
  if (actionType === 'view_asset') {
    openModalDetailAset(targetId);
  } else if (actionType === 'view_lending') {
    navigateTo('peminjaman');
  }
}

/**
 * ========================================================
 * 5. TOAST NOTIFICATION SYSTEM
 * ========================================================
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `p-3.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 pointer-events-auto max-w-sm animate-in`;

  let bgClass = 'bg-slate-900 text-white border-slate-700';
  let iconName = 'info';

  if (type === 'success') {
    bgClass = 'bg-emerald-700 text-white border-emerald-600';
    iconName = 'check-circle-2';
  } else if (type === 'warning') {
    bgClass = 'bg-amber-600 text-white border-amber-500';
    iconName = 'alert-triangle';
  } else if (type === 'danger') {
    bgClass = 'bg-rose-700 text-white border-rose-600';
    iconName = 'alert-octagon';
  }

  toast.className += ` ${bgClass}`;
  toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i> <span>${message}</span>`;
  container.appendChild(toast);

  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * ========================================================
 * 6. DROPDOWN POPULATOR (ROOMS & CATEGORIES)
 * ========================================================
 */
function populateDropdowns() {
  const rooms = db.getRooms();
  const categories = db.getCategories();

  // Master Branches & Divisions
  const branches = (typeof db !== 'undefined' && db.getBranches) ? db.getBranches() : [];
  const divisions = (typeof db !== 'undefined' && db.getDivisions) ? db.getDivisions() : [];

  const authUser = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isUserAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();

  // Filter Cabang di Dashboard Scope
  const dashFilterBranch = document.getElementById('dash-filter-branch');
  if (dashFilterBranch) {
    const curVal = dashFilterBranch.value;
    dashFilterBranch.innerHTML = '<option value="">🌍 Semua Wilayah / Cabang</option>' + 
      branches.map(b => `<option value="${b.id}">${b.name} (${b.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'wilayah' && authUser.scopeId) {
      dashFilterBranch.value = authUser.scopeId;
    } else {
      dashFilterBranch.value = curVal;
    }
  }

  // Filter Divisi di Dashboard Scope
  const dashFilterDiv = document.getElementById('dash-filter-division');
  if (dashFilterDiv) {
    const curVal = dashFilterDiv.value;
    dashFilterDiv.innerHTML = '<option value="">🏢 Semua Divisi Pengelola</option>' + 
      divisions.map(d => `<option value="${d.id}">${d.name} (${d.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'divisi' && authUser.scopeId) {
      dashFilterDiv.value = authUser.scopeId;
    } else {
      dashFilterDiv.value = curVal;
    }
  }

  // Filter Cabang di Halaman Aset
  const filterBranch = document.getElementById('filter-cabang');
  if (filterBranch) {
    const curVal = filterBranch.value;
    filterBranch.innerHTML = '<option value="">🌍 Semua Cabang / Wilayah</option>' + 
      branches.map(b => `<option value="${b.id}">${b.name} (${b.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'wilayah' && authUser.scopeId) {
      filterBranch.value = authUser.scopeId;
    } else {
      filterBranch.value = curVal;
    }
  }

  // Filter Divisi di Halaman Aset
  const filterDiv = document.getElementById('filter-divisi');
  if (filterDiv) {
    const curVal = filterDiv.value;
    filterDiv.innerHTML = '<option value="">🏢 Semua Divisi Pengelola</option>' + 
      divisions.map(d => `<option value="${d.id}">${d.name} (${d.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'divisi' && authUser.scopeId) {
      filterDiv.value = authUser.scopeId;
    } else {
      filterDiv.value = curVal;
    }
  }

  // Filter Cabang di Halaman KIR Ruangan
  const kirFilterBranch = document.getElementById('kir-filter-branch');
  if (kirFilterBranch) {
    const curVal = kirFilterBranch.value;
    kirFilterBranch.innerHTML = '<option value="">🌍 Semua Wilayah / Cabang</option>' + 
      branches.map(b => `<option value="${b.id}">${b.name} (${b.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'wilayah' && authUser.scopeId) {
      kirFilterBranch.value = authUser.scopeId;
    } else {
      kirFilterBranch.value = curVal;
    }
  }

  // Filter Divisi di Halaman KIR Ruangan
  const kirFilterDiv = document.getElementById('kir-filter-division');
  if (kirFilterDiv) {
    const curVal = kirFilterDiv.value;
    kirFilterDiv.innerHTML = '<option value="">🏢 Semua Divisi Pengelola</option>' + 
      divisions.map(d => `<option value="${d.id}">${d.name} (${d.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'divisi' && authUser.scopeId) {
      kirFilterDiv.value = authUser.scopeId;
    } else {
      kirFilterDiv.value = curVal;
    }
  }

  // Dropdown Pilih Ruangan di Halaman KIR Ruangan
  populateKIRRoomDropdown();

  // Filter Cabang di Halaman KIB
  const kibFilterBranch = document.getElementById('filter-kib-cabang');
  if (kibFilterBranch) {
    const curVal = kibFilterBranch.value;
    kibFilterBranch.innerHTML = '<option value="">🌍 Semua Wilayah / Cabang</option>' + 
      branches.map(b => `<option value="${b.id}">${b.name} (${b.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'wilayah' && authUser.scopeId) {
      kibFilterBranch.value = authUser.scopeId;
    } else {
      kibFilterBranch.value = curVal;
    }
  }

  // Filter Divisi di Halaman KIB
  const kibFilterDiv = document.getElementById('filter-kib-divisi');
  if (kibFilterDiv) {
    const curVal = kibFilterDiv.value;
    kibFilterDiv.innerHTML = '<option value="">🏢 Semua Divisi Pengelola</option>' + 
      divisions.map(d => `<option value="${d.id}">${d.name} (${d.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'divisi' && authUser.scopeId) {
      kibFilterDiv.value = authUser.scopeId;
    } else {
      kibFilterDiv.value = curVal;
    }
  }

  // Filter Ruangan di Halaman KIB
  const kibFilterRoom = document.getElementById('filter-kib-ruangan');
  if (kibFilterRoom) {
    const curVal = kibFilterRoom.value;
    kibFilterRoom.innerHTML = '<option value="">🚪 Semua Lokasi / Ruangan</option>' + 
      rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    kibFilterRoom.value = curVal;
  }

  // Filter Ruangan di Halaman Aset
  const filterRoom = document.getElementById('filter-ruangan');
  if (filterRoom) {
    const currentVal = filterRoom.value;
    filterRoom.innerHTML = '<option value="">🚪 Semua Ruangan</option>' + rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    filterRoom.value = currentVal;
  }

  // Filter Kategori di Halaman Aset
  const filterCat = document.getElementById('filter-kategori');
  if (filterCat) {
    const currentVal = filterCat.value;
    filterCat.innerHTML = '<option value="">📦 Semua Kategori</option>' + categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    filterCat.value = currentVal;
  }

  // Form Tambah Aset - Divisi
  const formDiv = document.getElementById('asset-division');
  if (formDiv) {
    const currentDivVal = formDiv.value;
    formDiv.innerHTML = '<option value="">-- Pilih Divisi Pengelola --</option>' + 
      divisions.map(d => `<option value="${d.id}" data-name="${d.name}" data-code="${d.code || ''}">${d.name} (${d.code || ''})</option>`).join('');
    if (!isUserAdmin && authUser && authUser.role === 'divisi' && authUser.scopeId) {
      formDiv.value = authUser.scopeId;
    } else if (currentDivVal) {
      formDiv.value = currentDivVal;
    } else if (divisions.length > 0) {
      formDiv.value = divisions[0].id;
    }
  }

  // Form Tambah Aset - Ruangan (Filtered by selected Division)
  populateAssetRoomDropdown();

  // Form Tambah Aset - Kategori
  const formCat = document.getElementById('asset-category');
  if (formCat) {
    formCat.innerHTML = '<option value="">-- Pilih Kategori Barang --</option>' + categories.map(c => `<option value="${c.id}" data-name="${c.name}" data-code="${c.code}" data-lifespan="${c.lifespan}">${c.name} (${c.code})</option>`).join('');
  }

  // Datalist Saran Pemegang Amanah dari Riwayat BAST
  const recipientDatalist = document.getElementById('bast-recipients-datalist');
  if (recipientDatalist && typeof db.getBASTList === 'function') {
    const bastList = db.getBASTList();
    const seen = new Set();
    const options = [];
    bastList.forEach(b => {
      if (b.recipientName && !seen.has(b.recipientName)) {
        seen.add(b.recipientName);
        const label = b.amanah ? `${b.recipientName} (${b.amanah})` : b.recipientName;
        options.push(`<option value="${label}">${b.recipientName}</option>`);
      }
    });
    recipientDatalist.innerHTML = options.join('');
  }

  // Form Peminjaman - Aset Selector
  const lendAsset = document.getElementById('lend-asset-id');
  if (lendAsset) {
    const assets = db.getAssets();
    lendAsset.innerHTML = '<option value="">-- Pilih Barang yang Dipinjam --</option>' + assets.map(a => `<option value="${a.id}">${a.name} [${a.code}] - ${a.roomName}</option>`).join('');
  }

  // Report Filters
  const repRoom = document.getElementById('report-filter-room');
  if (repRoom) {
    repRoom.innerHTML = '<option value="">Semua Ruangan</option>' + rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  }

  const repCat = document.getElementById('report-filter-kategori');
  if (repCat) {
    repCat.innerHTML = '<option value="">Semua Kategori</option>' + categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }

  // Sticker Room Filter
  const stkRoom = document.getElementById('sticker-filter-room');
  if (stkRoom) {
    stkRoom.innerHTML = '<option value="">Semua Ruangan</option>' + rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  }

  // Branch & Wilayah Dropdowns
  populateBranchDropdowns();

  // Populate Master Catalog Datalist (1.600+ items from spreadsheet)
  populateMasterBarangDatalist();
}

/**
 * Filter Room Dropdown according to selected Division
 */
function populateAssetRoomDropdown(selectedRoomId = null) {
  const formRoom = document.getElementById('asset-room');
  if (!formRoom) return;

  const formDiv = document.getElementById('asset-division');
  const selectedDivId = formDiv?.value || '';
  const badge = document.getElementById('asset-division-badge');
  const hint = document.getElementById('asset-room-filter-hint');
  
  const rooms = (typeof db !== 'undefined' && db.getRooms) ? db.getRooms() : [];
  const divisions = (typeof db !== 'undefined' && db.getDivisions) ? db.getDivisions() : [];
  const activeDiv = divisions.find(d => d.id === selectedDivId);

  if (badge) {
    badge.textContent = activeDiv?.code ? `[${activeDiv.code}]` : '';
  }

  let filteredRooms = rooms;
  if (selectedDivId) {
    filteredRooms = rooms.filter(r => r.divisionId === selectedDivId);
    if (filteredRooms.length === 0) filteredRooms = rooms; // fallback
    if (hint) hint.textContent = `${filteredRooms.length} Ruangan Divisi`;
  } else if (hint) {
    hint.textContent = 'Semua Ruangan';
  }

  let html = '<option value="">-- Pilih Ruangan Penempatan --</option>';
  if (!selectedDivId) {
    divisions.forEach(d => {
      const divRooms = rooms.filter(r => r.divisionId === d.id);
      if (divRooms.length > 0) {
        html += `<optgroup label="🏢 ${d.name}">`;
        divRooms.forEach(r => {
          html += `<option value="${r.id}" data-name="${r.name}" data-code="${r.code || ''}" data-division-id="${r.divisionId || ''}">${r.name} (${r.code || ''})</option>`;
        });
        html += `</optgroup>`;
      }
    });
    const unassigned = rooms.filter(r => !r.divisionId || !divisions.some(d => d.id === r.divisionId));
    if (unassigned.length > 0) {
      html += `<optgroup label="📌 Ruangan Lainnya">`;
      unassigned.forEach(r => {
        html += `<option value="${r.id}" data-name="${r.name}" data-code="${r.code || ''}">${r.name} (${r.code || ''})</option>`;
      });
      html += `</optgroup>`;
    }
  } else {
    filteredRooms.forEach(r => {
      html += `<option value="${r.id}" data-name="${r.name}" data-code="${r.code || ''}" data-division-id="${r.divisionId || ''}">${r.name} (${r.code || ''})</option>`;
    });
  }

  formRoom.innerHTML = html;

  if (selectedRoomId) {
    formRoom.value = selectedRoomId;
  } else if (filteredRooms.length > 0 && selectedDivId) {
    formRoom.value = filteredRooms[0].id;
  }
}

function onDivisionChangeInForm() {
  populateAssetRoomDropdown();
  const assetId = document.getElementById('asset-form-id')?.value;
  if (!assetId) {
    autoGenerateCode();
  }
}

/**
 * SMART SYNONYMS & ACRONYMS DICTIONARY FOR SPREADSHEET MASTER BARANG
 */
const MASTER_BARANG_SYNONYMS = {
  // AC & Pendingin
  'ac': ['air conditioning', 'a.c.', 'split', 'window', 'sentral', 'pendingin'],
  'aircon': ['air conditioning', 'a.c.'],
  'pendingin': ['air conditioning', 'a.c.', 'alat pendingin', 'kamar pendingin'],

  // Komputer, PC & Laptop
  'pc': ['p.c unit', 'personal komputer', 'komputer', 'cpu'],
  'komputer': ['p.c unit', 'personal komputer', 'komputer', 'mini komputer'],
  'laptop': ['lap top', 'note book', 'laptop', 'tablet pc'],
  'notebook': ['note book', 'lap top'],
  'cpu': ['cpu (peralatan personal komputer)', 'cpu'],

  // Monitor & TV
  'tv': ['televisi', 'off air tv monitor'],
  'televisi': ['televisi'],
  'monitor': ['monitor', 'video monitor'],

  // Komunikasi & Radio
  'ht': ['handy talky (ht)', 'unit tranceiver', 'alat komunikasi radio'],
  'walkie': ['handy talky (ht)'],
  'intercom': ['intercom unit'],

  // Kamera & Proyektor
  'cctv': ['camera video', 'camera electronic', 'camera digital'],
  'kamera': ['camera video', 'camera electronic', 'camera digital', 'camera film'],
  'cam': ['camera video', 'camera digital', 'handy cam'],
  'proyektor': ['lcd projector/infocus', 'slide projector', 'film projector'],
  'projector': ['lcd projector/infocus', 'slide projector'],
  'lcd': ['lcd projector/infocus', 'display'],
  'infocus': ['lcd projector/infocus'],

  // Sound, Audio & Mic
  'mic': ['microphone', 'microphone/wireless mic', 'wireless', 'mic conference'],
  'mikrofon': ['microphone'],
  'speaker': ['loudspeaker', 'sound system'],
  'sound': ['sound system', 'professional sound system', 'loudspeaker', 'amplifier'],
  'ampli': ['amplifier', 'power amplifier', 'audio amplifier'],
  'toa': ['megaphone', 'loudspeaker'],
  'mixer': ['audio mixing portable', 'video mixer'],

  // APAR & Pemadam
  'apar': ['alat pemadam/portable', 'pompa kebakaran/portable', 'detektor kebakaran'],
  'pemadam': ['alat pemadam/portable', 'mobil pemadam kebakaran', 'hidran kebakaran'],

  // Rumah Tangga & Dapur
  'kulkas': ['lemari es', 'up right chiller/frezzer', 'reach in frezzer', 'cold storage'],
  'freezer': ['up right chiller/frezzer', 'cold room frezzer', 'reach in frezzer', 'lemari es'],
  'dispenser': ['dispenser', 'water filter'],
  'rice cooker': ['rice cooker (alat dapur)', 'rice warmer'],
  'magicom': ['rice cooker (alat dapur)', 'rice warmer'],

  // Genset & Listrik
  'genset': ['genset', 'portable generating set', 'electric generating set'],
  'generator': ['genset', 'portable generating set'],
  'ups': ['uninterruptible power supply (ups)', 'unit power supply'],
  'stabilizer': ['stabilisator', 'automatic voltage regulator (avr)'],
  'stavol': ['stabilisator'],

  // Pompa
  'pompa': ['pompa air', 'transportable water pump', 'portable water pump', 'sumersible pump', 'pompa tangan'],
  'sanyo': ['pompa air'],

  // Kendaraan
  'motor': ['sepeda motor', 'kendaraan bermotor beroda dua'],
  'mobil': ['mobil ambulance', 'mobil jenazah', 'pick up', 'truck', 'sedan', 'jeep', 'micro bus', 'mini bus', 'bus'],
  'ambulance': ['mobil ambulance'],
  'sepeda': ['sepeda'],

  // Perabot
  'meja': ['meja kerja', 'meja rapat', 'meja komputer', 'meja 1/2 biro', 'meja tamu'],
  'kursi': ['kursi kerja', 'kursi rapat', 'kursi putar', 'kursi lipat', 'kursi tamu'],
  'lemari': ['lemari besi/metal', 'lemari kayu', 'lemari kaca', 'lemari sorok', 'lemari buku'],
  'rak': ['rak besi', 'rak kayu', 'rak-rak penyimpan'],
  'kasur': ['kasur/spring bed', 'tempat tidur besi', 'tempat tidur kayu'],
  'springbed': ['kasur/spring bed'],
  'karpet': ['karpet', 'gordyin/kray'],
  'sofa': ['sofa', 'sice'],

  // Kebersihan & Alat Kerja
  'vacuum': ['mesin penghisap debu/vacuum cleaner'],
  'vacum': ['mesin penghisap debu/vacuum cleaner'],
  'bor': ['mesin bor', 'mesin bor beton', 'mesin bor kayu'],
  'las': ['mesin las listrik', 'peralatan las'],
  'kompresor': ['mesin kompresor', 'portable compressor']
};

let activeMasterBarangIndex = -1;
let currentMasterBarangResults = [];

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Smart Search Engine across 1.647+ Catalog Items
 */
function searchMasterBarangCatalog(rawQuery) {
  if (!rawQuery) return [];
  const q = rawQuery.trim().toLowerCase();
  const qClean = q.replace(/[.\-\/\(\)\s]/g, '');
  if (!qClean) return [];

  const catalogList = (typeof getMasterBarangList === 'function') ? getMasterBarangList() : (typeof MASTER_BARANG_DATA !== 'undefined' ? MASTER_BARANG_DATA : []);
  if (!Array.isArray(catalogList) || catalogList.length === 0) return [];

  const targetSynonyms = MASTER_BARANG_SYNONYMS[q] || MASTER_BARANG_SYNONYMS[qClean] || [];
  const matches = [];

  catalogList.forEach(item => {
    const nameLower = (item.nama || '').toLowerCase();
    const nameClean = nameLower.replace(/[.\-\/\(\)\s]/g, '');
    let score = 0;

    // 1. Synonym / Acronym Mapping (Prioritas Tertinggi untuk singkatan seperti 'ac', 'pc', 'tv', 'ht', 'apar', 'cctv')
    if (targetSynonyms.length > 0) {
      for (const syn of targetSynonyms) {
        if (nameLower.includes(syn) || nameClean.includes(syn.replace(/[.\-\/\(\)\s]/g, ''))) {
          score += 180;
          break;
        }
      }
    }

    // 2. Exact match
    if (nameLower === q || nameClean === qClean) {
      score += 200;
    }
    // 3. Name clean starts with query
    else if (nameClean.startsWith(qClean) || nameLower.startsWith(q)) {
      score += 110;
    }
    // 4. Any individual word starts with query (e.g. "Air Conditioning (AC)" word "AC" starts with "ac")
    else if (nameLower.split(/[\s\(\)\/\-]+/).some(w => w.startsWith(q))) {
      score += 90;
    }
    // 5. Parentheses acronym match: e.g. "(AC)", "(HT)", "(LAN)"
    else if (nameLower.includes(`(${q})`)) {
      score += 130;
    }
    // 6. Contains query as substring
    else if (nameClean.includes(qClean) || nameLower.includes(q)) {
      score += 40;
    }
    // 7. Match classification code (e.g. "1.3.2")
    else if (item.kode && item.kode.includes(q)) {
      score += 50;
    }

    if (score > 0) {
      matches.push({ item, score });
    }
  });

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 12).map(m => m.item);
}

/**
 * Populate badge counter
 */
function populateMasterBarangDatalist(forceReload = false) {
  const items = (typeof getMasterBarangList === 'function') ? getMasterBarangList() : (typeof MASTER_BARANG_DATA !== 'undefined' ? MASTER_BARANG_DATA : []);
  const countBadge = document.getElementById('catalog-count-badge');
  if (countBadge && Array.isArray(items)) {
    countBadge.textContent = `📖 ${items.length}+ Katalog`;
  }
}

/**
 * Input Handler: Run Smart Search & Display Custom Dropdown
 */
function onMasterBarangInput(val) {
  activeMasterBarangIndex = -1;
  const dropdown = document.getElementById('master-barang-dropdown');
  const infoBox = document.getElementById('catalog-selected-info');

  if (!val || val.trim().length === 0) {
    if (dropdown) dropdown.classList.add('hidden');
    if (infoBox) infoBox.classList.add('hidden');
    return;
  }

  const results = searchMasterBarangCatalog(val);
  currentMasterBarangResults = results;
  renderMasterBarangDropdown(results, val);

  // Exact match check for badge info
  const cleanVal = val.trim().toLowerCase();
  const catalogList = (typeof getMasterBarangList === 'function') ? getMasterBarangList() : (typeof MASTER_BARANG_DATA !== 'undefined' ? MASTER_BARANG_DATA : []);
  if (Array.isArray(catalogList)) {
    const matched = catalogList.find(item => item.nama.toLowerCase() === cleanVal);
    const codeSpan = document.getElementById('catalog-selected-code');
    if (matched && infoBox && codeSpan) {
      codeSpan.textContent = `${matched.kode} (No. Spreadsheet: ${matched.no})`;
      infoBox.classList.remove('hidden');
    } else if (infoBox) {
      infoBox.classList.add('hidden');
    }
  }

  // Auto-detect category
  autoDetectCategoryFromText(val);
}

function onMasterBarangFocus() {
  const input = document.getElementById('asset-name');
  if (input && input.value.trim().length > 0) {
    onMasterBarangInput(input.value);
  }
}

function renderMasterBarangDropdown(items, query) {
  const dropdown = document.getElementById('master-barang-dropdown');
  if (!dropdown) return;

  if (!items || items.length === 0) {
    dropdown.innerHTML = `
      <div class="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center flex flex-col items-center gap-1">
        <span>🔍 Tidak ditemukan kecocokan di 1.647 katalog spreadsheet.</span>
        <span class="text-[10px] text-slate-500 dark:text-slate-400">Antum tetap bisa menyimpan nama ini sebagai barang kustom.</span>
      </div>
    `;
    dropdown.classList.remove('hidden');
    return;
  }

  let html = '';
  items.forEach((item, index) => {
    html += `
      <div id="mb-item-${index}" 
           class="px-3.5 py-2.5 cursor-pointer hover:bg-amber-500/10 dark:hover:bg-amber-500/15 flex items-center justify-between transition-colors group"
           onmousedown="selectMasterBarangItem(${item.no})">
        <div class="flex-1 pr-2">
          <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            ${escapeHtml(item.nama)}
          </div>
          <div class="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
            Kode: <span class="text-slate-600 dark:text-slate-300 font-bold">${item.kode}</span> • No. ${item.no}
          </div>
        </div>
        <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 shrink-0">
          Pilih
        </span>
      </div>
    `;
  });

  dropdown.innerHTML = html;
  dropdown.classList.remove('hidden');
}

function selectMasterBarangItem(no) {
  const catalogList = (typeof getMasterBarangList === 'function') ? getMasterBarangList() : (typeof MASTER_BARANG_DATA !== 'undefined' ? MASTER_BARANG_DATA : []);
  const item = catalogList.find(i => i.no === no);
  if (!item) return;

  const input = document.getElementById('asset-name');
  if (input) {
    input.value = item.nama;
  }

  const infoBox = document.getElementById('catalog-selected-info');
  const codeSpan = document.getElementById('catalog-selected-code');
  if (infoBox && codeSpan) {
    codeSpan.textContent = `${item.kode} (No. Spreadsheet: ${item.no})`;
    infoBox.classList.remove('hidden');
  }

  autoDetectCategoryFromText(item.nama);
  hideMasterBarangDropdown();
}

function hideMasterBarangDropdown() {
  const dropdown = document.getElementById('master-barang-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  activeMasterBarangIndex = -1;
}

function onMasterBarangKeyDown(e) {
  const dropdown = document.getElementById('master-barang-dropdown');
  if (!dropdown || dropdown.classList.contains('hidden') || currentMasterBarangResults.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeMasterBarangIndex = Math.min(currentMasterBarangResults.length - 1, activeMasterBarangIndex + 1);
    updateDropdownHighlight();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeMasterBarangIndex = Math.max(0, activeMasterBarangIndex - 1);
    updateDropdownHighlight();
  } else if (e.key === 'Enter') {
    if (activeMasterBarangIndex >= 0 && activeMasterBarangIndex < currentMasterBarangResults.length) {
      e.preventDefault();
      selectMasterBarangItem(currentMasterBarangResults[activeMasterBarangIndex].no);
    }
  } else if (e.key === 'Escape') {
    hideMasterBarangDropdown();
  }
}

function updateDropdownHighlight() {
  currentMasterBarangResults.forEach((_, idx) => {
    const el = document.getElementById(`mb-item-${idx}`);
    if (el) {
      if (idx === activeMasterBarangIndex) {
        el.classList.add('bg-amber-500/20', 'dark:bg-amber-500/25');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('bg-amber-500/20', 'dark:bg-amber-500/25');
      }
    }
  });
}

// Auto-detect matching category based on name
function autoDetectCategoryFromText(text) {
  if (!text) return;
  const isNew = !document.getElementById('asset-form-id')?.value;
  if (!isNew) return;

  const cleanVal = text.trim().toLowerCase();
  const catSelect = document.getElementById('asset-category');
  if (!catSelect) return;

  let detectedCatCode = '';
  // 1. Elektronik (ELE) - Termasuk Handphone, Smartphone, Telepon Mobile, Gadget, Komputer, Audio, dll.
  if (/\b(telepon|telephone|phone|handphone|smartphone|ponsel|hp|gadget|tablet|ipad|iphone|android|ht|handy talky|walkie talkie|ac|air conditioning|komputer|laptop|pc|proyektor|tv|televisi|sound|audio|kamera|camera|printer|scanner|kulkas|dispenser|radio|kipas|monitor|ups|mixer|amplifier|microphone|speaker|stabilisator|cpu|hard disk|keyboard|modem|server|inverter|lcd)\b/i.test(cleanVal)) {
    detectedCatCode = 'ELE';
  } else if (/\b(meja|kursi|lemari|rak|mimbar|podium|karpet|sofa|kasur|filing|buffet|bangku|rehal|sice|spring bed|dipan)\b/i.test(cleanVal)) {
    detectedCatCode = 'PRB';
  } else if (/\b(vacuum|sapu|pel|pembersih|cuci|lap)\b/i.test(cleanVal)) {
    detectedCatCode = 'ALB';
  } else if (/\b(kompor|panci|piring|gelas|dapur|rice cooker|oven|blender|microwave|tabung gas|kitchen|sendok|garpu|teko)\b/i.test(cleanVal)) {
    detectedCatCode = 'PER';
  } else if (/\b(mobil|motor|sepeda|ambulance|ambulans|bus|bis|truk|truck|pick up|pickup|gerobak|tandu)\b/i.test(cleanVal) && !/\b(mobile|phone|telephone|handphone|smartphone)\b/i.test(cleanVal)) {
    detectedCatCode = 'KND';
  } else if (/\b(bor|gergaji|kunci|palu|tang|pahat|perkakas|mesin las|kompresor|gerinda|tool kit)\b/i.test(cleanVal)) {
    detectedCatCode = 'PKJ';
  } else if (/\b(genset|pompa|tangga|pemadam|apar|blower|hidran|water pump|generating set)\b/i.test(cleanVal)) {
    detectedCatCode = 'AGN';
  } else if (/\b(buku|stempel|arsip|dokumen|kardex|surat)\b/i.test(cleanVal)) {
    detectedCatCode = 'ADM';
  } else if (/\b(bola|raket|tenis|olahraga|fitness|senam|lapangan)\b/i.test(cleanVal)) {
    detectedCatCode = 'OLH';
  } else if (/\b(mesin ketik|fotocopy|kertas|kantor|penghancur kertas|laminating|white board|papan|absensi|display)\b/i.test(cleanVal)) {
    detectedCatCode = 'KNT';
  }

  if (detectedCatCode) {
    for (let i = 0; i < catSelect.options.length; i++) {
      if (catSelect.options[i].getAttribute('data-code') === detectedCatCode) {
        catSelect.selectedIndex = i;
        autoGenerateCode();
        break;
      }
    }
  }
  updateCategorySpecificFields();
}

// Close master barang dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('master-barang-dropdown');
  const input = document.getElementById('asset-name');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!dropdown.contains(e.target) && e.target !== input) {
      hideMasterBarangDropdown();
    }
  }
});

/**
 * Populate Branch Selector in BAST Form & Filters
 */
function populateBranchDropdowns() {
  const branches = (typeof db !== 'undefined' && db.getBranches) ? db.getBranches() : [];

  // 1. Selector di Form BAST
  const branchSelect = document.getElementById('bast-branch-selector');
  if (branchSelect) {
    const currentVal = branchSelect.value;
    branchSelect.innerHTML = '<option value="">-- Pilih dari Master Cabang / Wilayah --</option>' +
      branches.map(b => `<option value="${b.id}" data-name="${b.name}" data-is-pusat="${b.isPusat ? 'true' : 'false'}" data-pj="${b.pj || ''}" data-phone="${b.phone || ''}">${b.isPusat ? '🏢 ' : '📍 '} ${b.name}</option>`).join('') +
      '<option value="custom">✍️ Input Nama Cabang / Wilayah Lainnya (Manual)</option>';
    if (currentVal) branchSelect.value = currentVal;
  }

  // 2. Filter Wilayah di Tabel BAST
  const bastFilterReg = document.getElementById('bast-filter-region');
  if (bastFilterReg) {
    const currentVal = bastFilterReg.value;
    bastFilterReg.innerHTML = `
      <option value="all">Semua Wilayah</option>
      <option value="pusat">🏢 Wilayah Pusat (Semua)</option>
      <option value="cabang">📍 Wilayah Cabang / Daerah (Semua)</option>
    ` + branches.map(b => `<option value="${b.name}">• ${b.name}</option>`).join('');
    if (currentVal) bastFilterReg.value = currentVal;
  }
}

function onSelectBranchInBAST(selectElem) {
  if (!selectElem) return;
  const val = selectElem.value;
  const regionInput = document.getElementById('bast-region');
  const isPusatSelect = document.getElementById('bast-is-pusat');

  if (val === 'custom') {
    if (regionInput) {
      regionInput.value = '';
      regionInput.focus();
    }
  } else if (val) {
    const opt = selectElem.options[selectElem.selectedIndex];
    const branchName = opt?.getAttribute('data-name');
    const isPusat = opt?.getAttribute('data-is-pusat');

    if (regionInput && branchName) regionInput.value = branchName;
    if (isPusatSelect && isPusat !== null) isPusatSelect.value = isPusat;
  }
}

/**
 * ========================================================
 * 7. SECTION 1: DASHBOARD
 * ========================================================
 */
function renderDashboard() {
  let rawAssets = db.getAssets();
  let rawRooms = db.getRooms();
  let assets = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterAssets(rawAssets) : rawAssets;
  let rooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(rawRooms) : rawRooms;
  const categories = db.getCategories();
  const disposals = db.getDisposals();
  const settings = db.getSettings();

  // Apply Dashboard Executive Scope (Branch & Division)
  const branchFilter = document.getElementById('dash-filter-branch')?.value || '';
  const divFilter = document.getElementById('dash-filter-division')?.value || '';

  if (branchFilter) {
    assets = assets.filter(a => 
      a.branchId === branchFilter || 
      a.branchName === branchFilter || 
      (a.code && a.code.includes(branchFilter))
    );
    rooms = rooms.filter(r => r.branchId === branchFilter || r.branchName === branchFilter);
  }

  if (divFilter) {
    assets = assets.filter(a => 
      a.divisionId === divFilter || 
      a.divisionName === divFilter
    );
    rooms = rooms.filter(r => r.divisionId === divFilter);
  }

  // Update Scope Active Badge & Reset Button
  const activeBadge = document.getElementById('dash-filter-active-badge');
  const resetBtn = document.getElementById('btn-reset-dash-scope');

  let badgeText = 'Semua Data (Konsolidasi)';
  let isFiltered = false;

  const branches = (typeof db !== 'undefined' && db.getBranches) ? db.getBranches() : [];
  const divisions = (typeof db !== 'undefined' && db.getDivisions) ? db.getDivisions() : [];

  if (branchFilter && divFilter) {
    const b = branches.find(x => x.id === branchFilter || x.name === branchFilter);
    const d = divisions.find(x => x.id === divFilter || x.name === divFilter);
    badgeText = `Cabang: ${b?.name || branchFilter} • Divisi: ${d?.name || divFilter}`;
    isFiltered = true;
  } else if (branchFilter) {
    const b = branches.find(x => x.id === branchFilter || x.name === branchFilter);
    badgeText = `Cabang: ${b?.name || branchFilter}`;
    isFiltered = true;
  } else if (divFilter) {
    const d = divisions.find(x => x.id === divFilter || x.name === divFilter);
    badgeText = `Divisi: ${d?.name || divFilter}`;
    isFiltered = true;
  }

  if (activeBadge) activeBadge.textContent = badgeText;
  if (resetBtn) {
    if (isFiltered) resetBtn.classList.remove('hidden');
    else resetBtn.classList.add('hidden');
  }

  let totalPerolehan = 0;
  let totalBuku = 0;
  let baikCount = 0;
  let rusakRinganCount = 0;
  let rusakBeratCount = 0;
  let totalBarangUnits = 0;

  const roomDistributionMap = {};
  const catDistributionMap = {};

  assets.forEach(a => {
    const calc = DepreciationEngine.calculateCurrentValue(a, settings);
    const price = parseFloat(a.price) || 0;
    const qty = parseInt(a.qty) || 1;
    
    totalPerolehan += price;
    totalBuku += calc.bookValue;
    totalBarangUnits += qty;

    if (a.condition === 'Baik') baikCount += qty;
    else if (a.condition === 'Rusak Ringan') rusakRinganCount += qty;
    else if (a.condition === 'Rusak Berat') rusakBeratCount += qty;

    // Count per room
    const rName = a.roomName || 'Tanpa Ruangan';
    roomDistributionMap[rName] = (roomDistributionMap[rName] || 0) + qty;

    // Financial Breakdown per Category
    const cName = a.categoryName || 'Lainnya';
    if (!catDistributionMap[cName]) {
      catDistributionMap[cName] = { count: 0, nominal: 0, buku: 0 };
    }
    catDistributionMap[cName].count += qty;
    catDistributionMap[cName].nominal += price;
    catDistributionMap[cName].buku += calc.bookValue;
  });

  // Set Top Metric Numbers
  const totalNominalElem = document.getElementById('dash-total-nominal');
  const totalBukuElem = document.getElementById('dash-total-buku');
  const statTotalAset = document.getElementById('stat-total-aset');
  const statKondisiBaik = document.getElementById('stat-kondisi-baik');
  const statTotalRuangan = document.getElementById('stat-total-ruangan');
  const statTotalRusak = document.getElementById('stat-total-rusak');
  const statRusakDetail = document.getElementById('stat-rusak-detail');
  const statTotalDisposal = document.getElementById('stat-total-disposal');

  if (totalNominalElem) totalNominalElem.textContent = DepreciationEngine.formatRupiah(totalPerolehan);
  if (totalBukuElem) totalBukuElem.textContent = DepreciationEngine.formatRupiah(totalBuku);
  if (statTotalAset) statTotalAset.textContent = `${totalBarangUnits} Unit (${assets.length} Item)`;
  if (statKondisiBaik) statKondisiBaik.textContent = `${baikCount} Unit Baik`;
  if (statTotalRuangan) statTotalRuangan.textContent = `${rooms.length} Ruangan`;
  if (statTotalRusak) statTotalRusak.textContent = `${rusakRinganCount + rusakBeratCount} Unit`;
  if (statRusakDetail) statRusakDetail.textContent = `${rusakRinganCount} Ringan / ${rusakBeratCount} Berat`;
  if (statTotalDisposal) statTotalDisposal.textContent = `${disposals.length} Unit`;

  // Render Room Distribution Progress Bars
  const roomDistContainer = document.getElementById('dash-ruangan-distribution');
  if (roomDistContainer) {
    if (Object.keys(roomDistributionMap).length === 0) {
      roomDistContainer.innerHTML = '<p class="text-xs text-slate-400">Belum ada aset</p>';
    } else {
      roomDistContainer.innerHTML = Object.entries(roomDistributionMap).slice(0, 5).map(([room, count]) => {
        const pct = Math.round((count / (totalBarangUnits || 1)) * 100);
        return `
          <div class="cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors" onclick="filterAssetsByRoom('${room.replace(/'/g, "\\'")}')">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-700 dark:text-slate-300 truncate max-w-[180px] hover:text-amber-500">${room}</span>
              <span class="text-amber-500 font-bold">${count} Unit (${pct}%)</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render Category Financial & Quantity Recap (Jumlah Barang Saat Ini)
  const catDistContainer = document.getElementById('dash-kategori-distribution');
  if (catDistContainer) {
    const catEntries = Object.entries(catDistributionMap);
    if (catEntries.length === 0) {
      catDistContainer.innerHTML = '<p class="text-xs text-slate-400">Belum ada aset terdaftar</p>';
    } else {
      // Sort by Highest Item Count first, then Nominal
      catEntries.sort((a, b) => (b[1].count - a[1].count) || (b[1].nominal - a[1].nominal));

      const itemsHTML = catEntries.map(([cat, data]) => {
        const qtyPct = totalBarangUnits > 0 ? Math.round((data.count / totalBarangUnits) * 100) : 0;
        const danaPct = totalPerolehan > 0 ? Math.round((data.nominal / totalPerolehan) * 100) : 0;
        return `
          <div class="space-y-1 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors" onclick="filterAssetsByCategory('${cat.replace(/'/g, "\\'")}')">
            <div class="flex items-center justify-between text-xs font-semibold">
              <div class="flex items-center gap-1.5 truncate max-w-[170px]">
                <span class="text-slate-900 dark:text-slate-100 font-bold truncate hover:text-emerald-500">${cat}</span>
              </div>
              <div class="text-right">
                <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-extrabold border border-emerald-500/20">
                  ${data.count} Unit (${qtyPct}%)
                </span>
              </div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>Dana: <strong class="text-emerald-600 dark:text-emerald-400">${DepreciationEngine.formatRupiah(data.nominal)}</strong></span>
              <span>Buku: <strong class="text-slate-700 dark:text-slate-300">${DepreciationEngine.formatRupiah(data.buku)}</strong></span>
            </div>
            <div class="w-full bg-slate-200/80 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden mt-1">
              <div class="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500" style="width: ${Math.max(qtyPct, 6)}%"></div>
            </div>
          </div>
        `;
      }).join('');

      // Grand Total Financial Recap Box
      const grandTotalHTML = `
        <div class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-[#141724] p-3 rounded-xl border border-emerald-200/40 dark:border-slate-800/80 space-y-1">
          <div class="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
            <span class="flex items-center gap-1 text-slate-800 dark:text-slate-200">
              <i data-lucide="boxes" class="w-3.5 h-3.5 text-emerald-500"></i> TOTAL BARANG SAAT INI:
            </span>
            <span class="text-emerald-600 dark:text-emerald-400 font-black text-sm">${totalBarangUnits} Unit (100%)</span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-emerald-100 dark:border-slate-800/60">
            <span>Total Dana Beli: <strong class="text-amber-500 font-bold">${DepreciationEngine.formatRupiah(totalPerolehan)}</strong></span>
            <span>Total Buku: <strong class="text-emerald-500 font-bold">${DepreciationEngine.formatRupiah(totalBuku)}</strong></span>
          </div>
        </div>
      `;

      catDistContainer.innerHTML = itemsHTML + grandTotalHTML;
    }
  }

  // Render Recent Assets List
  const recentContainer = document.getElementById('dash-recent-list');
  if (recentContainer) {
    const recent5 = assets.slice(0, 4);
    if (recent5.length === 0) {
      recentContainer.innerHTML = '<p class="text-xs text-slate-400">Belum ada aset terdaftar</p>';
    } else {
      recentContainer.innerHTML = recent5.map(a => `
        <div class="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-colors" onclick="openModalDetailAset('${a.id}')">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
              <i data-lucide="package" class="w-4 h-4"></i>
            </div>
            <div>
              <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">${a.name}</h5>
              <p class="text-[10px] text-slate-400">${a.code} • ${a.roomName}</p>
            </div>
          </div>
          <span class="text-xs font-bold text-amber-500">${DepreciationEngine.formatRupiah(a.price)}</span>
        </div>
      `).join('');
    }
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * ========================================================
 * 8. SECTION 2: DATA ASET (CRUD & MULTI-FILTER)
 * ========================================================
 */
function onModernSearchInput(value) {
  const clearBtn = document.getElementById('btn-clear-search');
  if (clearBtn) {
    if (value && value.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
  applyAssetFilters();
}

function clearModernSearch() {
  const input = document.getElementById('filter-search');
  const clearBtn = document.getElementById('btn-clear-search');
  if (input) {
    input.value = '';
    input.focus();
  }
  if (clearBtn) clearBtn.classList.add('hidden');
  applyAssetFilters();
}

function renderAssetTable(filteredAssets = null) {
  const allScopedAssets = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterAssets(db.getAssets()) : db.getAssets();
  const assets = filteredAssets !== null ? filteredAssets : allScopedAssets;
  const settings = db.getSettings();

  const tbody = document.getElementById('asset-table-body');
  const emptyState = document.getElementById('asset-empty-state');
  const countDisplay = document.getElementById('asset-count-display');
  const totalDisplay = document.getElementById('asset-total-display');

  if (countDisplay) countDisplay.textContent = assets.length;
  if (totalDisplay) totalDisplay.textContent = allScopedAssets.length;

  if (!tbody) return;

  if (assets.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  const bastList = typeof db.getBASTList === 'function' ? db.getBASTList() : [];

  tbody.innerHTML = assets.map(a => {
    const calc = DepreciationEngine.calculateCurrentValue(a, settings);
    const qrThumbId = `qr-mini-${a.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    const activeBAST = bastList.find(b => (b.assetId === a.id || b.assetCode === a.code) && b.status === 'Aktif');

    let conditionBadge = '<span class="badge badge-success font-bold">B (Baik)</span>';
    if (a.condition === 'RR' || a.condition === 'Rusak Ringan') conditionBadge = '<span class="badge badge-warning font-bold">RR (Ringan)</span>';
    if (a.condition === 'RB' || a.condition === 'Rusak Berat') conditionBadge = '<span class="badge badge-danger font-bold">RB (Berat)</span>';

    setTimeout(() => {
      QREngine.generateQR(qrThumbId, a.code, 36);
    }, 20);

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-2.5">
            <div id="${qrThumbId}" class="w-9 h-9 bg-white p-0.5 rounded-lg border border-slate-200 flex-shrink-0 flex items-center justify-center cursor-pointer shadow-sm" title="Klik untuk cetak label" onclick="printSingleSticker('${a.id}')"></div>
            <div>
              <span class="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">${a.code}</span>
              <div class="text-[10px] text-slate-400">Tgl: ${a.date || '-'}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-amber-500" onclick="openModalDetailAset('${a.id}')">${a.name}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${a.brandType || a.brand || 'Tanpa Merk'} ${a.material ? '• Bahan: ' + a.material : ''}</div>
        </td>
        <td class="px-4 py-3">
          <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">${a.categoryName}</span>
        </td>
        <td class="px-4 py-3 text-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
            ${a.qty || 1} ${a.unit || 'Unit'}
          </span>
        </td>
        <td class="px-4 py-3">
          <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">${a.roomName}</div>
          <div class="text-[11px] text-slate-400">PJ: ${a.pic || '-'}</div>
          ${activeBAST ? `
            <div class="mt-1">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20" onclick="openModalDetailBAST('${activeBAST.id}')" title="Klik untuk lihat Surat BAST">
                <i data-lucide="file-signature" class="w-3 h-3"></i> BAST: ${activeBAST.recipientName} (${activeBAST.isPusat ? 'Pusat' : 'Cabang'})
              </span>
            </div>
          ` : ''}
          ${a.isUnderDisposalRequest ? `
            <div class="mt-1">
              <span class="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                <i data-lucide="clock" class="w-3 h-3"></i> Usulan Hapus
              </span>
            </div>
          ` : ''}
        </td>
        <td class="px-4 py-3">${conditionBadge}</td>
        <td class="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">${DepreciationEngine.formatRupiah(a.price)}</td>
        <td class="px-4 py-3 text-right font-bold text-emerald-500">${DepreciationEngine.formatRupiah(calc.bookValue)}</td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="openModalDetailAset('${a.id}')" class="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Detail & QR">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="openModalEditAset('${a.id}')" class="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit Aset">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button onclick="openModalMutasiAset('${a.id}')" class="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Mutasi / Pindah Ruangan & Divisi">
              <i data-lucide="arrow-right-left" class="w-4 h-4"></i>
            </button>
            ${activeBAST ? `
              <button onclick="openModalDetailBAST('${activeBAST.id}')" class="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors" title="Lihat & Cetak BAST (${activeBAST.recipientName})">
                <i data-lucide="file-signature" class="w-4 h-4"></i>
              </button>
            ` : `
              <button onclick="openModalTambahBAST(); setTimeout(function(){ document.getElementById('bast-asset-select').value='${a.id}'; onBASTAssetSelectChange(); }, 80);" class="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Buat BAST Serah Terima">
                <i data-lucide="file-plus" class="w-4 h-4"></i>
              </button>
            `}
            <button onclick="printSingleSticker('${a.id}')" class="p-1.5 text-slate-500 hover:text-teal-500 hover:bg-teal-500/10 rounded-lg transition-colors" title="Cetak Stiker QR">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            ${a.isUnderDisposalRequest ? `
              <button onclick="navigateTo('disposal'); switchDisposalTab('requests'); document.getElementById('filter-disp-req-search').value='${a.code}'; renderDisposalRequestsTable();" class="p-1.5 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors" title="Lihat Berkas Usulan Penghapusan">
                <i data-lucide="clock" class="w-4 h-4"></i>
              </button>
            ` : `
              <button onclick="openModalAjukanPenghapusan('${a.id}')" class="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Ajukan Permohonan Penghapusan">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function onFilterDivisionChange() {
  const divId = document.getElementById('filter-divisi')?.value || '';
  const filterRoom = document.getElementById('filter-ruangan');
  const rooms = db.getRooms();
  
  if (filterRoom) {
    let filteredRooms = rooms;
    if (divId) {
      filteredRooms = rooms.filter(r => r.divisionId === divId);
    }
    filterRoom.innerHTML = '<option value="">🚪 Semua Ruangan</option>' + 
      filteredRooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    filterRoom.value = '';
  }
  applyAssetFilters();
}

function onDashboardScopeChange() {
  renderDashboard();
  const branchFilter = document.getElementById('dash-filter-branch')?.value;
  const divFilter = document.getElementById('dash-filter-division')?.value;
  if (branchFilter || divFilter) {
    showToast('📊 Dashboard disesuaikan berdasarkan filter wilayah/divisi', 'info');
  }
}

function resetDashboardScope() {
  if (document.getElementById('dash-filter-branch')) document.getElementById('dash-filter-branch').value = '';
  if (document.getElementById('dash-filter-division')) document.getElementById('dash-filter-division').value = '';
  renderDashboard();
  showToast('🔄 Dashboard di-reset ke Rekap Gabungan (Konsolidasi)', 'info');
}

function applyAssetFilters() {
  const query = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
  const branchFilter = document.getElementById('filter-cabang')?.value || '';
  const divFilter = document.getElementById('filter-divisi')?.value || '';
  const roomFilter = document.getElementById('filter-ruangan')?.value || '';
  const catFilter = document.getElementById('filter-kategori')?.value || '';
  const condFilter = document.getElementById('filter-kondisi')?.value || '';

  const allAssets = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterAssets(db.getAssets()) : db.getAssets();
  const allRooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(db.getRooms()) : db.getRooms();

  const filtered = allAssets.filter(a => {
    const matchQuery = !query || 
      (a.name && a.name.toLowerCase().includes(query)) ||
      (a.code && a.code.toLowerCase().includes(query)) ||
      (a.brand && a.brand.toLowerCase().includes(query)) ||
      (a.serial && a.serial.toLowerCase().includes(query)) ||
      (a.pic && a.pic.toLowerCase().includes(query));

    // Find linked room to check division/branch if not explicitly on asset
    const roomObj = allRooms.find(r => r.name === a.roomName || r.id === a.roomId || (r.code && a.code && a.code.includes(r.code)));

    const matchBranch = !branchFilter || 
      a.branchId === branchFilter || 
      a.branchName === branchFilter || 
      (roomObj && (roomObj.branchId === branchFilter || roomObj.branchName === branchFilter)) ||
      (a.code && a.code.includes(branchFilter));

    const matchDiv = !divFilter || 
      a.divisionId === divFilter || 
      a.divisionName === divFilter ||
      (roomObj && (roomObj.divisionId === divFilter || roomObj.divisionName === divFilter));

    const matchRoom = !roomFilter || a.roomName === roomFilter || a.roomId === roomFilter;
    const matchCat = !catFilter || a.categoryName === catFilter || a.categoryId === catFilter;
    
    // Normalize condition
    let aCond = (a.condition || 'B').toString().toUpperCase().trim();
    if (aCond === 'BAIK') aCond = 'B';
    if (aCond === 'RUSAK RINGAN') aCond = 'RR';
    if (aCond === 'RUSAK BERAT') aCond = 'RB';

    let matchCond = true;
    if (condFilter) {
      const cFilter = condFilter.toString().toUpperCase().trim();
      if (cFilter === 'BAIK' || cFilter === 'B') {
        matchCond = (aCond === 'B');
      } else if (cFilter === 'RUSAK RINGAN' || cFilter === 'RR') {
        matchCond = (aCond === 'RR');
      } else if (cFilter === 'RUSAK BERAT' || cFilter === 'RB') {
        matchCond = (aCond === 'RB');
      } else if (cFilter === 'RUSAK' || cFilter === 'PERLU SERVIS') {
        matchCond = (aCond === 'RR' || aCond === 'RB');
      } else {
        matchCond = (a.condition === condFilter);
      }
    }

    return matchQuery && matchBranch && matchDiv && matchRoom && matchCat && matchCond;
  });

  renderAssetTable(filtered);
}

function filterAssetsByCondition(conditionType) {
  navigateTo('data-aset');
  resetAssetFilters();
  
  const condSelect = document.getElementById('filter-kondisi');
  if (condSelect) {
    if (conditionType === 'rusak' || conditionType === 'service') {
      condSelect.value = 'Rusak';
    } else if (conditionType === 'baik') {
      condSelect.value = 'Baik';
    } else {
      condSelect.value = conditionType;
    }
  }

  applyAssetFilters();
  
  if (conditionType === 'rusak' || conditionType === 'service') {
    showToast('🔍 Menampilkan daftar barang yang butuh servis / rusak', 'info');
  }
}

function filterAssetsByRoom(roomName) {
  navigateTo('data-aset');
  resetAssetFilters();
  const roomSelect = document.getElementById('filter-ruangan');
  if (roomSelect) roomSelect.value = roomName;
  applyAssetFilters();
  showToast(`🔍 Menampilkan daftar aset di ruangan "${roomName}"`, 'info');
}

function filterAssetsByCategory(catName) {
  navigateTo('data-aset');
  resetAssetFilters();
  const catSelect = document.getElementById('filter-kategori');
  if (catSelect) catSelect.value = catName;
  applyAssetFilters();
  showToast(`🔍 Menampilkan daftar aset kategori "${catName}"`, 'info');
}

function resetAssetFilters() {
  const authUser = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isUserAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();

  if (document.getElementById('filter-search')) document.getElementById('filter-search').value = '';
  if (document.getElementById('btn-clear-search')) document.getElementById('btn-clear-search').classList.add('hidden');
  
  if (document.getElementById('filter-cabang')) {
    if (!isUserAdmin && authUser && authUser.role === 'wilayah' && authUser.scopeId) {
      document.getElementById('filter-cabang').value = authUser.scopeId;
    } else {
      document.getElementById('filter-cabang').value = '';
    }
  }

  if (document.getElementById('filter-divisi')) {
    if (!isUserAdmin && authUser && authUser.role === 'divisi' && authUser.scopeId) {
      document.getElementById('filter-divisi').value = authUser.scopeId;
    } else {
      document.getElementById('filter-divisi').value = '';
    }
  }

  if (document.getElementById('filter-ruangan')) {
    const rooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(db.getRooms()) : db.getRooms();
    document.getElementById('filter-ruangan').innerHTML = '<option value="">🚪 Semua Ruangan</option>' + rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    document.getElementById('filter-ruangan').value = '';
  }
  if (document.getElementById('filter-kategori')) document.getElementById('filter-kategori').value = '';
  if (document.getElementById('filter-kondisi')) document.getElementById('filter-kondisi').value = '';
  applyAssetFilters();
}

let uploadedAssetPhotos = {
  front: '',
  back: '',
  dus_front: '',
  dus_sticker: ''
};

function handleUploadCustomPhoto(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    uploadedAssetPhotos[type] = dataUrl;

    const imgMap = {
      'front': 'preview-img-front',
      'back': 'preview-img-back',
      'dus_front': 'preview-img-dus-front',
      'dus_sticker': 'preview-img-dus-sticker'
    };
    const iconMap = {
      'front': 'icon-img-front',
      'back': 'icon-img-back',
      'dus_front': 'icon-img-dus-front',
      'dus_sticker': 'icon-img-dus-sticker'
    };

    const targetImgId = imgMap[type];
    const targetIconId = iconMap[type];

    const imgElem = document.getElementById(targetImgId);
    const iconElem = document.getElementById(targetIconId);

    if (imgElem) {
      imgElem.src = dataUrl;
      imgElem.classList.remove('hidden');
    }
    if (iconElem) {
      iconElem.classList.add('hidden');
    }
  };
  reader.readAsDataURL(file);
}

function resetAssetPhotoPreviews() {
  uploadedAssetPhotos = { front: '', back: '', dus_front: '', dus_sticker: '' };
  ['front', 'back', 'dus_front', 'dus_sticker'].forEach(type => {
    const imgMap = {
      'front': 'preview-img-front',
      'back': 'preview-img-back',
      'dus_front': 'preview-img-dus-front',
      'dus_sticker': 'preview-img-dus-sticker'
    };
    const iconMap = {
      'front': 'icon-img-front',
      'back': 'icon-img-back',
      'dus_front': 'icon-img-dus-front',
      'dus_sticker': 'icon-img-dus-sticker'
    };
    const imgElem = document.getElementById(imgMap[type]);
    const iconElem = document.getElementById(iconMap[type]);
    if (imgElem) {
      imgElem.src = '';
      imgElem.classList.add('hidden');
    }
    if (iconElem) {
      iconElem.classList.remove('hidden');
    }
  });
}

function setAssetPhotoPreviewsFromData(asset) {
  uploadedAssetPhotos = {
    front: asset.imageFront || asset.image || '',
    back: asset.imageBack || '',
    dus_front: asset.imageDusFront || '',
    dus_sticker: asset.imageDusSticker || ''
  };

  const keys = ['front', 'back', 'dus_front', 'dus_sticker'];
  const imgMap = {
    'front': 'preview-img-front',
    'back': 'preview-img-back',
    'dus_front': 'preview-img-dus-front',
    'dus_sticker': 'preview-img-dus-sticker'
  };
  const iconMap = {
    'front': 'icon-img-front',
    'back': 'icon-img-back',
    'dus_front': 'icon-img-dus-front',
    'dus_sticker': 'icon-img-dus-sticker'
  };

  keys.forEach(k => {
    const val = uploadedAssetPhotos[k];
    const imgElem = document.getElementById(imgMap[k]);
    const iconElem = document.getElementById(iconMap[k]);
    if (val && imgElem && iconElem) {
      imgElem.src = val;
      imgElem.classList.remove('hidden');
      iconElem.classList.add('hidden');
    } else if (imgElem && iconElem) {
      imgElem.src = '';
      imgElem.classList.add('hidden');
      iconElem.classList.remove('hidden');
    }
  });
}

/**
 * ========================================================
 * SMART CONDITIONAL & ADVANCED ASSET INPUT HELPERS
 * ========================================================
 */
function setFormValue(fieldId, value) {
  const elem = document.getElementById(fieldId);
  if (elem) {
    elem.value = value;
    elem.dispatchEvent(new Event('input', { bubbles: true }));
    elem.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function setAssetInputMode(mode) {
  const btnGadget = document.getElementById('btn-mode-gadget');
  const btnVehicle = document.getElementById('btn-mode-vehicle');
  const btnGeneral = document.getElementById('btn-mode-general');
  const indicator = document.getElementById('label-mode-indicator');

  const labelRamNopol = document.getElementById('label-ram-nopol');
  const inputRamNopol = document.getElementById('asset-ram-nopol');
  const chipsRam = document.getElementById('chips-ram-preset');
  const wrapperStorage = document.getElementById('wrapper-storage');
  const labelSn = document.getElementById('label-sn-imei1');
  const inputSn = document.getElementById('asset-serial');
  const labelImei2 = document.getElementById('label-imei2-mesin');
  const inputImei2 = document.getElementById('asset-imei2-mesin');

  // Reset button styles
  const allBtns = [btnGadget, btnVehicle, btnGeneral];
  allBtns.forEach(b => {
    if (b) {
      b.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1';
    }
  });

  if (mode === 'vehicle') {
    if (btnVehicle) btnVehicle.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm flex items-center gap-1';
    if (indicator) {
      indicator.textContent = 'Mode: Kendaraan Dinas';
      indicator.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20';
    }
    if (labelRamNopol) labelRamNopol.textContent = 'Nomor Polisi (Nopol Plat) *';
    if (inputRamNopol) inputRamNopol.placeholder = 'Contoh: KB 4521 XX';
    if (chipsRam) {
      chipsRam.innerHTML = `
        <span onclick="setFormValue('asset-ram-nopol', 'KB ')" class="cursor-pointer px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">KB</span>
        <span onclick="setFormValue('asset-ram-nopol', 'KB  XX')" class="cursor-pointer px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">KB..XX</span>
      `;
    }
    if (wrapperStorage) wrapperStorage.classList.add('opacity-40');
    if (labelSn) labelSn.innerHTML = 'No. Rangka / VIN <span class="text-rose-500 font-bold">(*wajib diisi)</span>';
    if (inputSn) inputSn.placeholder = 'Contoh: MH1KF11...';
    if (labelImei2) labelImei2.textContent = 'No. Mesin Kendaraan';
    if (inputImei2) inputImei2.placeholder = 'Contoh: KF11E-1234567';

  } else if (mode === 'general') {
    if (btnGeneral) btnGeneral.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm flex items-center gap-1';
    if (indicator) {
      indicator.textContent = 'Mode: Inventaris Umum / Mebel';
      indicator.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    }
    if (labelRamNopol) labelRamNopol.textContent = 'Dimensi / Spesifikasi Tambahan';
    if (inputRamNopol) inputRamNopol.placeholder = 'Contoh: 180x80cm / Kayu Jati Solid';
    if (chipsRam) chipsRam.innerHTML = '';
    if (wrapperStorage) wrapperStorage.classList.remove('opacity-40');
    if (labelSn) labelSn.innerHTML = 'Nomor Seri / Tag Label <span class="text-rose-500 font-bold">(*wajib diisi)</span>';
    if (inputSn) inputSn.placeholder = 'Contoh: MBL-INF-091';
    if (labelImei2) labelImei2.textContent = 'Kode Produksi / Tambahan';
    if (inputImei2) inputImei2.placeholder = 'Contoh: PROD-2024';

  } else {
    // Gadget mode default
    if (btnGadget) btnGadget.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm flex items-center gap-1';
    if (indicator) {
      indicator.textContent = 'Mode: Elektronik & IT';
      indicator.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20';
    }
    if (labelRamNopol) labelRamNopol.textContent = 'RAM (Memori Utama)';
    if (inputRamNopol) inputRamNopol.placeholder = 'Contoh: 8GB / 16GB DDR4 / 32GB';
    if (chipsRam) {
      chipsRam.innerHTML = `
        <span onclick="setFormValue('asset-ram-nopol', '8GB')" class="cursor-pointer px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700">8GB</span>
        <span onclick="setFormValue('asset-ram-nopol', '16GB')" class="cursor-pointer px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700">16GB</span>
        <span onclick="setFormValue('asset-ram-nopol', '32GB')" class="cursor-pointer px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700">32GB</span>
      `;
    }
    if (wrapperStorage) wrapperStorage.classList.remove('opacity-40');
    if (labelSn) labelSn.innerHTML = 'SN / IMEI 1 <span class="text-rose-500 font-bold">(*wajib diisi)</span>';
    if (inputSn) inputSn.placeholder = 'Contoh: SN-883921093 / IMEI: 356892...';
    if (labelImei2) labelImei2.textContent = 'IMEI 2 (Jika Ada)';
    if (inputImei2) inputImei2.placeholder = 'Contoh: IMEI2: 356893...';
  }
}

function calculateFormLiveDepreciation() {
  const price = parseFloat(document.getElementById('asset-price')?.value) || 0;
  const lifespan = parseFloat(document.getElementById('asset-lifespan')?.value) || 4;
  const dateStr = document.getElementById('asset-date')?.value || new Date().toISOString().split('T')[0];

  const dummyAsset = {
    price: price,
    lifespan: lifespan,
    date: dateStr
  };

  const calc = DepreciationEngine.calculateCurrentValue(dummyAsset);

  const elemAnnual = document.getElementById('live-deprec-annual');
  const elemMonthly = document.getElementById('live-deprec-monthly');
  const elemAccum = document.getElementById('live-deprec-accum');
  const elemBook = document.getElementById('live-deprec-book');

  if (elemAnnual) elemAnnual.textContent = `${DepreciationEngine.formatRupiah(calc.annualDepreciation)} / thn`;
  if (elemMonthly) elemMonthly.textContent = `${DepreciationEngine.formatRupiah(calc.annualDepreciation / 12)} / bln`;
  if (elemAccum) elemAccum.textContent = `-${DepreciationEngine.formatRupiah(calc.accumulatedDepreciation)}`;
  if (elemBook) elemBook.textContent = DepreciationEngine.formatRupiah(calc.bookValue);
}

function openSmartExcelPasteModal() {
  const input = document.getElementById('excel-paste-input');
  if (input) input.value = '';
  openModal('modal-excel-paste');
}

function executeSmartExcelPaste() {
  const text = document.getElementById('excel-paste-input')?.value.trim();
  if (!text) {
    showToast('Teks baris Excel belum diisi!', 'warning');
    return;
  }

  // Split by tab (standard Excel copy) or semicolon or comma
  let cols = text.split('\t');
  if (cols.length < 3 && text.includes(';')) cols = text.split(';');
  else if (cols.length < 3 && text.includes(',')) cols = text.split(',');

  cols = cols.map(c => c.replace(/^["']|["']$/g, '').trim());

  // Mapping from images 3 -> 2 -> 1
  // 0: No, 1: Nama Barang, 2: Jenis, 3: Merk, 4: Type, 5: Warna, 6: RAM/Nopol, 7: Storage, 8: SN/IMEI 1,
  // 9: IMEI 2, 10: Lokasi, 11: Tanggal, 12: Qty, 13: Harga, 14: Penyusutan, 15: Sumber Dana, 16: Vendor, 17: Kondisi, 18: PJ
  // 19: Amanah, 20: No Telp, 21: Riwayat, 22: Keterangan, 23: Serah Terima, 24: Tanggal BAST, 25: Nota, 26: No Berita Acara

  let offset = 0;
  if (!isNaN(parseInt(cols[0])) && cols.length > 5) {
    offset = 1; // skip "No" column
  }

  if (cols[offset]) setFormValue('asset-name', cols[offset]);
  if (cols[offset + 2]) setFormValue('asset-brand', cols[offset + 2]);
  if (cols[offset + 3]) setFormValue('asset-type-model', cols[offset + 3]);
  if (cols[offset + 4]) setFormValue('asset-color', cols[offset + 4]);
  if (cols[offset + 5]) setFormValue('asset-ram-nopol', cols[offset + 5]);
  if (cols[offset + 6]) setFormValue('asset-storage', cols[offset + 6]);
  if (cols[offset + 7]) setFormValue('asset-serial', cols[offset + 7]);
  if (cols[offset + 8]) setFormValue('asset-imei2-mesin', cols[offset + 8]);
  
  // Date, Qty, Price
  if (cols[offset + 10]) {
    const rawDate = cols[offset + 10];
    if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setFormValue('asset-date', rawDate);
    }
  }
  if (cols[offset + 11]) {
    const q = parseInt(cols[offset + 11].replace(/\D/g, ''));
    if (q) setFormValue('asset-qty', q);
  }
  if (cols[offset + 12]) {
    const p = parseFloat(cols[offset + 12].replace(/[^0-9.]/g, ''));
    if (p) setFormValue('asset-price', p);
  }
  if (cols[offset + 14]) setFormValue('asset-source', cols[offset + 14]);
  if (cols[offset + 15]) setFormValue('asset-vendor', cols[offset + 15]);
  if (cols[offset + 17]) setFormValue('asset-pic', cols[offset + 17]);

  // Amanah & BAST
  if (cols[offset + 18]) setFormValue('asset-amanah', cols[offset + 18]);
  if (cols[offset + 19]) setFormValue('asset-phone', cols[offset + 19]);
  if (cols[offset + 20]) setFormValue('asset-history', cols[offset + 20]);
  if (cols[offset + 21]) setFormValue('asset-notes', cols[offset + 21]);
  if (cols[offset + 24]) setFormValue('asset-nota-proof', cols[offset + 24]);
  if (cols[offset + 25]) setFormValue('asset-no-berita-acara', cols[offset + 25]);

  calculateFormLiveDepreciation();
  closeModal('modal-excel-paste');
  showToast('✨ Kolom data berhasil diekstrak dan diisi ke dalam formulir secara otomatis!', 'success');
}

function updatePriceReader(prefix, amount) {
  const formattedEl = document.getElementById(`${prefix}-formatted-text`);
  const badgeEl = document.getElementById(`${prefix}-short-badge`);
  const terbilangEl = document.getElementById(`${prefix}-terbilang-text`);

  const num = Math.round(Number(amount) || 0);

  if (formattedEl) {
    formattedEl.textContent = (typeof DepreciationEngine !== 'undefined' && DepreciationEngine.formatRupiah)
      ? DepreciationEngine.formatRupiah(num)
      : `Rp ${num.toLocaleString('id-ID')}`;
  }
  if (badgeEl) {
    badgeEl.textContent = (typeof DepreciationEngine !== 'undefined' && DepreciationEngine.formatRingkas)
      ? DepreciationEngine.formatRingkas(num)
      : `${num} Rupiah`;
  }
  if (terbilangEl) {
    const terb = (typeof DepreciationEngine !== 'undefined' && DepreciationEngine.terbilang)
      ? DepreciationEngine.terbilang(num)
      : `${num} Rupiah`;
    terbilangEl.textContent = `"${terb}"`;
  }
}

function calculateAssetPriceTotal() {
  const qty = parseInt(document.getElementById('asset-qty')?.value) || 1;
  const unitPrice = parseFloat(document.getElementById('asset-price-unit')?.value) || 0;
  const total = qty * unitPrice;
  const priceField = document.getElementById('asset-price');
  if (priceField) priceField.value = total;

  // Live reader updates
  updatePriceReader('price-unit', unitPrice);
  updatePriceReader('price-total', total);

  if (typeof calculateFormLiveDepreciation === 'function') {
    calculateFormLiveDepreciation();
  }
}

function multiplyPriceInput(fieldId, factor) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  let val = parseFloat(el.value) || 0;
  if (val === 0) {
    el.value = factor;
  } else {
    el.value = val * factor;
  }
  calculateAssetPriceTotal();
}

function setFormPrice(fieldId, amount) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.value = amount;
  calculateAssetPriceTotal();
}

function toggleBastFields(show) {
  const container = document.getElementById('asset-bast-fields-container');
  const checkbox = document.getElementById('asset-has-bast');
  if (checkbox) checkbox.checked = !!show;
  if (container) {
    if (show) {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  }
}

/**
 * Auto-generate Kode Barang & No Induk based on System Settings
 * Standard Format: [Kategori]-[Lokasi]-[Nomor Urut]-[Tahun] (Contoh: ELE-RUT-001-2026)
 */
function autoGenerateCode() {
  try {
    const s = (typeof db !== 'undefined' && db.getSettings) ? db.getSettings() : {};
    const prefix = (s.codePrefix || '').trim().toUpperCase();
    const sep = s.codeSeparator !== undefined ? s.codeSeparator : '-';
    const yearOpt = s.codeIncludeYear || 'YYYY';
    const includeCat = s.codeIncludeCategory !== false;
    const includeRoom = s.codeIncludeRoom !== false;
    const digits = parseInt(s.codeDigits) || 3;
    const seqMode = s.codeSequenceMode || 'category_room';

    // Tanggal & Tahun
    const dateVal = document.getElementById('asset-date')?.value || new Date().toISOString().split('T')[0];
    const fullYear = new Date(dateVal).getFullYear().toString();
    let yearPart = '';
    if (yearOpt === 'YYYY') yearPart = fullYear;
    else if (yearOpt === 'YY') yearPart = fullYear.slice(-2);

    // Kategori
    let catCode = '';
    if (includeCat) {
      const catSelect = document.getElementById('asset-category');
      if (catSelect && catSelect.selectedIndex >= 0) {
        const selectedOpt = catSelect.options[catSelect.selectedIndex];
        catCode = selectedOpt?.getAttribute('data-code') || '';
      }
      if (!catCode) {
        const categories = (typeof db !== 'undefined' && db.getCategories) ? db.getCategories() : [];
        catCode = categories[0]?.code || 'ELE';
      }
    }

    // Ruangan / Lokasi
    let roomCode = '';
    if (includeRoom) {
      const roomSelect = document.getElementById('asset-room');
      if (roomSelect && roomSelect.selectedIndex >= 0) {
        const selectedOpt = roomSelect.options[roomSelect.selectedIndex];
        roomCode = selectedOpt?.getAttribute('data-code') || '';
      }
      if (!roomCode) {
        const rooms = (typeof db !== 'undefined' && db.getRooms) ? db.getRooms() : [];
        roomCode = rooms[0]?.code || 'RUT';
      }
    }

    // Sequence calculation
    const assets = (typeof db !== 'undefined' && db.getAssets) ? db.getAssets() : [];
    let seq = 1;

    if (seqMode === 'category_room' && (catCode || roomCode)) {
      const matching = assets.filter(a => {
        const hasCat = !catCode || (a.categoryCode === catCode || (a.code && a.code.includes(catCode)));
        const hasRoom = !roomCode || (a.roomCode === roomCode || (a.code && a.code.includes(roomCode)));
        return hasCat && hasRoom;
      });
      seq = matching.length + 1;
    } else if (seqMode === 'category' && catCode) {
      const matching = assets.filter(a => (a.code && a.code.includes(catCode)) || a.categoryCode === catCode || a.categoryId === document.getElementById('asset-category')?.value);
      seq = matching.length + 1;
    } else if (seqMode === 'room' && roomCode) {
      const matching = assets.filter(a => (a.code && a.code.includes(roomCode)) || a.roomCode === roomCode || a.roomId === document.getElementById('asset-room')?.value);
      seq = matching.length + 1;
    } else if (seqMode === 'year' && yearPart) {
      const matching = assets.filter(a => (a.code && a.code.includes(yearPart)) || (a.date && a.date.startsWith(fullYear)));
      seq = matching.length + 1;
    } else {
      seq = assets.length + 1;
    }

    // Divisi
    const divSelect = document.getElementById('asset-division');
    let divShortCode = '';
    if (divSelect && divSelect.selectedIndex >= 0) {
      const rawDivCode = divSelect.options[divSelect.selectedIndex]?.getAttribute('data-code') || '';
      if (rawDivCode === 'RIAYAH') divShortCode = 'RYH';
      else if (rawDivCode === 'PONDOK') divShortCode = 'PDK';
      else if (rawDivCode === 'SEKRET') divShortCode = 'SKR';
      else if (rawDivCode) divShortCode = rawDivCode.substring(0, 3).toUpperCase();
    }

    // Ensure generated code is unique
    let generatedCode = '';
    let maxAttempts = 500;
    while (maxAttempts > 0) {
      const numPart = String(seq).padStart(digits, '0');
      const parts = [];
      if (prefix) parts.push(prefix);
      else if (divShortCode) parts.push(divShortCode);
      if (catCode) parts.push(catCode);
      if (roomCode) parts.push(roomCode);
      if (yearPart) parts.push(yearPart);
      parts.push(numPart);

      generatedCode = parts.join(sep);
      const exists = assets.some(a => a.code === generatedCode);
      if (!exists) break;
      seq++;
      maxAttempts--;
    }

    const codeInput = document.getElementById('asset-code');
    if (codeInput) {
      codeInput.value = generatedCode;
    }

    const noIndukInput = document.getElementById('asset-no-induk');
    const isNew = !document.getElementById('asset-form-id')?.value;
    if (noIndukInput && (isNew || !noIndukInput.value)) {
      const assetsThisYear = assets.filter(a => a.date && a.date.startsWith(fullYear));
      const nextNoIndukSeq = assetsThisYear.length + 1;
      const divTag = divShortCode ? `-${divShortCode}` : '';
      noIndukInput.value = `${String(nextNoIndukSeq).padStart(3, '0')}/INV${divTag}/${fullYear}`;
    }

    return generatedCode;
  } catch (err) {
    console.error('Error in autoGenerateCode:', err);
    const fallback = `ELE-RUT-${new Date().getFullYear()}-001`;
    const codeInput = document.getElementById('asset-code');
    if (codeInput) codeInput.value = fallback;
    return fallback;
  }
}

function updateCategorySpecificFields() {
  const catSelect = document.getElementById('asset-category');
  let catCode = '';
  let catName = '';
  if (catSelect && catSelect.selectedIndex >= 0) {
    const opt = catSelect.options[catSelect.selectedIndex];
    catCode = opt?.getAttribute('data-code') || '';
    catName = opt?.getAttribute('data-name') || opt?.text || '';
  }

  const assetName = (document.getElementById('asset-name')?.value || '').toLowerCase();

  const isElektronik = catCode === 'ELE' || 
    catName.toLowerCase().includes('elektronik') || 
    catName.toLowerCase().includes('komputer');

  const isKendaraan = catCode === 'KND' || 
    catName.toLowerCase().includes('kendaraan');

  const eleBox = document.getElementById('box-category-elektronik');
  const kndBox = document.getElementById('box-category-kendaraan');

  if (eleBox) {
    if (isElektronik) {
      eleBox.classList.remove('hidden');
    } else {
      eleBox.classList.add('hidden');
    }
  }

  if (kndBox) {
    if (isKendaraan) {
      kndBox.classList.remove('hidden');
    } else {
      kndBox.classList.add('hidden');
    }
  }

  if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function onCategoryChangeInForm() {
  const assetId = document.getElementById('asset-form-id')?.value;
  if (!assetId) {
    autoGenerateCode();
  }
  updateCategorySpecificFields();
}

function onRoomChangeInForm() {
  const assetId = document.getElementById('asset-form-id')?.value;
  if (!assetId) {
    autoGenerateCode();
  }
}

function onDateChangeInForm() {
  const assetId = document.getElementById('asset-form-id')?.value;
  if (!assetId) {
    autoGenerateCode();
  }
}

/**
 * ========================================================
 * 9. MODAL TAMBAH & EDIT ASET (16 KOLOM STANDAR)
 * ========================================================
 */
function openModalTambahAset() {
  try { populateDropdowns(); } catch (e) { console.warn(e); }
  const titleElem = document.getElementById('modal-aset-title');
  if (titleElem) titleElem.textContent = 'Input Buku Induk Barang Inventaris';
  
  const formElem = document.getElementById('form-aset');
  if (formElem) formElem.reset();
  
  const idElem = document.getElementById('asset-form-id');
  if (idElem) idElem.value = '';
  
  try { resetAssetPhotoPreviews(); } catch (e) { console.warn(e); }

  // Show split units checkbox on Add
  const splitBox = document.getElementById('box-split-units');
  if (splitBox) splitBox.style.display = 'flex';
  const splitCheck = document.getElementById('asset-split-units');
  if (splitCheck) splitCheck.checked = false;

  // Set default values
  const dateElem = document.getElementById('asset-date');
  if (dateElem) dateElem.value = new Date().toISOString().split('T')[0];
  if (document.getElementById('asset-qty')) document.getElementById('asset-qty').value = 1;
  if (document.getElementById('asset-unit')) document.getElementById('asset-unit').value = 'Unit';
  if (document.getElementById('asset-condition')) document.getElementById('asset-condition').value = 'B';
  if (document.getElementById('asset-production-year')) document.getElementById('asset-production-year').value = new Date().getFullYear();
  if (document.getElementById('catalog-selected-info')) document.getElementById('catalog-selected-info').classList.add('hidden');

  // Setup Divisi based on role
  const formDiv = document.getElementById('asset-division');
  const divBadge = document.getElementById('asset-division-badge');
  const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();

  if (formDiv) {
    if (!isAdmin && user && user.role === 'divisi' && user.scopeId) {
      formDiv.value = user.scopeId;
      formDiv.disabled = true;
      formDiv.classList.add('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
      if (divBadge) divBadge.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold"><i data-lucide="lock" class="w-3 h-3"></i> [${user.scopeName || 'Divisi'}]</span>`;
    } else {
      formDiv.disabled = false;
      formDiv.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
      if (divBadge) divBadge.innerHTML = `<span class="text-[10px] text-emerald-500 font-bold">Admin: Bebas Pilih</span>`;
    }
  }

  try { hideMasterBarangDropdown(); } catch (e) { console.warn(e); }
  try { populateAssetRoomDropdown(); } catch (e) { console.warn(e); }
  try { autoGenerateCode(); } catch (e) { console.warn(e); }
  try { calculateAssetPriceTotal(); } catch (e) { console.warn(e); }
  try { toggleBastFields(false); } catch (e) { console.warn(e); }

  // Reset custom category fields
  const fieldsToClear = ['asset-serial-number', 'asset-imei', 'asset-tech-specs', 'asset-nopol', 'asset-norangka', 'asset-nomesin', 'asset-nobpkb'];
  fieldsToClear.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  try { updateCategorySpecificFields(); } catch (e) { console.warn(e); }

  const detailsElem = document.querySelector('#form-aset details');
  if (detailsElem) detailsElem.removeAttribute('open');
  const bastBox = document.getElementById('asset-bast-connection-info');
  if (bastBox) bastBox.classList.add('hidden');
  openModal('modal-aset');
}

window.openModalTambahAset = openModalTambahAset;

function openModalTambahAsetWithCode(code) {
  openModalTambahAset();
  const codeInput = document.getElementById('asset-code');
  if (codeInput) codeInput.value = code;
}

window.openModalTambahAsetWithCode = openModalTambahAsetWithCode;

function openModalEditAset(assetId) {
  populateDropdowns();
  const asset = db.getAssetById(assetId);
  if (!asset) return;

  document.getElementById('modal-aset-title').textContent = 'Edit Data Buku Induk Barang';
  document.getElementById('asset-form-id').value = asset.id;

  // Hide split checkbox during Edit
  const splitBox = document.getElementById('box-split-units');
  if (splitBox) splitBox.style.display = 'none';
  hideMasterBarangDropdown();

  // 1. Tanggal Diterima
  document.getElementById('asset-date').value = asset.date || asset.tanggalDiterima || '';
  // 2. No Induk
  if (document.getElementById('asset-no-induk')) document.getElementById('asset-no-induk').value = asset.noInduk || '';
  // 3. Kode Barang
  document.getElementById('asset-code').value = asset.code || asset.kodeBarang || '';
  // 4. Nama/Jenis Barang
  document.getElementById('asset-name').value = asset.name || asset.namaBarang || '';
  // 5. Merk/Type
  if (document.getElementById('asset-brand-type')) {
    document.getElementById('asset-brand-type').value = asset.brandType || (asset.brand ? `${asset.brand} ${asset.typeModel || ''}`.trim() : '');
  }
  // 6. Ukuran
  if (document.getElementById('asset-size')) document.getElementById('asset-size').value = asset.size || asset.ukuran || '';
  // 7. Bahan
  if (document.getElementById('asset-material')) document.getElementById('asset-material').value = asset.material || asset.bahan || '';
  // 8. Tahun Pembuatan
  if (document.getElementById('asset-production-year')) document.getElementById('asset-production-year').value = asset.productionYear || asset.tahunPembuatan || '';
  // 9. Asal Barang
  if (document.getElementById('asset-source')) document.getElementById('asset-source').value = asset.source || asset.asalBarang || '';
  // 10. Kelengkapan Dokumen
  if (document.getElementById('asset-docs')) document.getElementById('asset-docs').value = asset.documents || asset.kelengkapanDokumen || '';
  // 11. Jumlah Barang
  if (document.getElementById('asset-qty')) document.getElementById('asset-qty').value = asset.qty || asset.jumlahBarang || 1;
  // 12. Satuan
  if (document.getElementById('asset-unit')) document.getElementById('asset-unit').value = asset.unit || asset.satuan || 'Unit';
  // 13. Kondisi (B / RR / RB)
  if (document.getElementById('asset-condition')) {
    let cond = asset.condition || asset.kondisi || 'B';
    if (cond === 'Baik') cond = 'B';
    else if (cond === 'Rusak Ringan') cond = 'RR';
    else if (cond === 'Rusak Berat') cond = 'RB';
    document.getElementById('asset-condition').value = cond;
  }
  // 14. Harga Satuan (Rp)
  const unitPrice = asset.unitPrice || (asset.qty ? (asset.price / asset.qty) : asset.price) || 0;
  if (document.getElementById('asset-price-unit')) document.getElementById('asset-price-unit').value = unitPrice;
  // 15. Harga Jumlah (Rp)
  if (document.getElementById('asset-price')) document.getElementById('asset-price').value = asset.price || (unitPrice * (asset.qty || 1));
  calculateAssetPriceTotal();
  // 16. Keterangan
  document.getElementById('asset-notes').value = asset.notes || asset.keterangan || '';

  // Custom Category Fields (Elektronik & Kendaraan)
  if (document.getElementById('asset-serial-number')) document.getElementById('asset-serial-number').value = asset.serialNumber || asset.noSeri || '';
  if (document.getElementById('asset-imei')) document.getElementById('asset-imei').value = asset.imei || '';
  if (document.getElementById('asset-tech-specs')) document.getElementById('asset-tech-specs').value = asset.techSpecs || asset.spesifikasi || '';
  if (document.getElementById('asset-nopol')) document.getElementById('asset-nopol').value = asset.nopol || asset.noPolisi || '';
  if (document.getElementById('asset-norangka')) document.getElementById('asset-norangka').value = asset.noRangka || asset.nomorRangka || '';
  if (document.getElementById('asset-nomesin')) document.getElementById('asset-nomesin').value = asset.noMesin || asset.nomorMesin || '';
  if (document.getElementById('asset-nobpkb')) document.getElementById('asset-nobpkb').value = asset.noBpkb || asset.nomorBpkb || '';

  // Dipergunakan Oleh / Di (Kolom 14 KIB) & BAST
  const bastList = typeof db.getBASTList === 'function' ? db.getBASTList() : [];
  const linkedBAST = bastList.find(b => (b.id === asset.bastId || b.assetId === asset.id || b.assetCode === asset.code) && b.status === 'Aktif');
  const hasBastInfo = !!(asset.usedBy || (asset.documents && asset.documents.toLowerCase().includes('bast')) || linkedBAST || asset.bastId);

  toggleBastFields(hasBastInfo);

  if (document.getElementById('asset-used-by')) {
    document.getElementById('asset-used-by').value = asset.usedBy || asset.dipergunakanOleh || '';
  }

  // Divisi, Ruangan & Kategori
  const divSelect = document.getElementById('asset-division');
  const roomObj = asset.roomId ? db.getRoomById(asset.roomId) : null;
  const targetDivId = asset.divisionId || roomObj?.divisionId || (db.getDivisions()[0]?.id || '');
  if (divSelect && targetDivId) {
    divSelect.value = targetDivId;
  }
  const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();
  if (divSelect) {
    if (!isAdmin && user && user.role === 'divisi') {
      divSelect.disabled = true;
      divSelect.classList.add('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
    } else {
      divSelect.disabled = false;
      divSelect.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
    }
  }

  populateAssetRoomDropdown(asset.roomId);
  if (document.getElementById('asset-category') && asset.categoryId) document.getElementById('asset-category').value = asset.categoryId;

  updateCategorySpecificFields();

  // Foto Preview
  setAssetPhotoPreviewsFromData(asset);

  const detailsElem = document.querySelector('#form-aset details');
  if (detailsElem) {
    const hasSpec = (asset.size && asset.size !== '-') || (asset.material && asset.material !== '-') || asset.image;
    if (hasSpec) detailsElem.setAttribute('open', '');
    else detailsElem.removeAttribute('open');
  }

  // Cek Status BAST Terkoneksi
  const bastBox = document.getElementById('asset-bast-connection-info');
  if (bastBox) {
    if (linkedBAST) {
      bastBox.classList.remove('hidden');
      const docLink = document.getElementById('asset-bast-doc-link');
      if (docLink) docLink.textContent = linkedBAST.docNo;
      const recLink = document.getElementById('asset-bast-recipient-link');
      if (recLink) recLink.textContent = linkedBAST.recipientName;
      const btnView = document.getElementById('btn-view-connected-bast');
      if (btnView) {
        btnView.onclick = () => {
          closeModal('modal-aset');
          openModalDetailBAST(linkedBAST.id);
        };
      }
    } else {
      bastBox.classList.add('hidden');
    }
  }

  openModal('modal-aset');
}

function handleSaveAsset(event) {
  event.preventDefault();

  const isEdit = !!document.getElementById('asset-form-id').value;
  const splitUnits = document.getElementById('asset-split-units')?.checked;
  const hasBast = !!document.getElementById('asset-has-bast')?.checked;
  
  // 16 Kolom Standar
  const date = document.getElementById('asset-date')?.value || new Date().toISOString().split('T')[0];
  const fullYear = new Date(date).getFullYear().toString();
  const noIndukBase = document.getElementById('asset-no-induk')?.value.trim() || '';
  const baseCode = document.getElementById('asset-code')?.value.trim() || '';
  const name = document.getElementById('asset-name')?.value.trim() || '';
  const brandType = document.getElementById('asset-brand-type')?.value.trim() || '';
  const size = document.getElementById('asset-size')?.value.trim() || '-';
  const material = document.getElementById('asset-material')?.value.trim() || '-';
  const productionYear = parseInt(document.getElementById('asset-production-year')?.value) || new Date(date).getFullYear();
  const source = document.getElementById('asset-source')?.value.trim() || 'Pembelian';
  const documents = hasBast ? (document.getElementById('asset-docs')?.value.trim() || 'BAST Resmi') : (document.getElementById('asset-docs')?.value.trim() || 'Lengkap');
  const qty = parseInt(document.getElementById('asset-qty')?.value) || 1;
  const unit = document.getElementById('asset-unit')?.value || 'Unit';
  const condition = document.getElementById('asset-condition')?.value || 'B';
  const unitPrice = parseFloat(document.getElementById('asset-price-unit')?.value) || 0;
  const notes = document.getElementById('asset-notes')?.value.trim() || '-';

  // Custom Category Fields
  const serialNumber = document.getElementById('asset-serial-number')?.value.trim() || '';
  const imei = document.getElementById('asset-imei')?.value.trim() || '';
  const techSpecs = document.getElementById('asset-tech-specs')?.value.trim() || '';
  const nopol = document.getElementById('asset-nopol')?.value.trim().toUpperCase() || '';
  const noRangka = document.getElementById('asset-norangka')?.value.trim().toUpperCase() || '';
  const noMesin = document.getElementById('asset-nomesin')?.value.trim().toUpperCase() || '';
  const noBpkb = document.getElementById('asset-nobpkb')?.value.trim() || '';

  // Divisi, Ruangan & Kategori (Enforce scope based on Auth)
  const authUser = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isUserAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();

  const divSelect = document.getElementById('asset-division');
  let divId = divSelect?.value || 'DIV-001';
  let divName = divSelect?.options[divSelect.selectedIndex]?.getAttribute('data-name') || 'Divisi Riayah & Sarpras';
  let divCode = divSelect?.options[divSelect.selectedIndex]?.getAttribute('data-code') || 'RIAYAH';

  if (!isUserAdmin && authUser && authUser.role === 'divisi' && authUser.scopeId) {
    divId = authUser.scopeId;
    divName = authUser.scopeName || divName;
    const divisions = (typeof db !== 'undefined' && db.getDivisions) ? db.getDivisions() : [];
    const matchedDiv = divisions.find(d => d.id === divId);
    if (matchedDiv) {
      divName = matchedDiv.name;
      divCode = matchedDiv.code || divCode;
    }
  }

  let branchId = null;
  let branchName = null;
  if (!isUserAdmin && authUser && authUser.role === 'wilayah' && authUser.scopeId) {
    branchId = authUser.scopeId;
    branchName = authUser.scopeName;
  }

  const roomSelect = document.getElementById('asset-room');
  const roomId = roomSelect?.value || 'RM-RUT';
  const roomName = roomSelect?.options[roomSelect.selectedIndex]?.getAttribute('data-name') || roomSelect?.value || 'Ruang Utama';
  const roomCode = roomSelect?.options[roomSelect.selectedIndex]?.getAttribute('data-code') || 'RUT';

  const catSelect = document.getElementById('asset-category');
  const catId = catSelect?.value || 'CAT-ELE';
  const catName = catSelect?.options[catSelect.selectedIndex]?.getAttribute('data-name') || catSelect?.value || 'Elektronik';
  const catCode = catSelect?.options[catSelect.selectedIndex]?.getAttribute('data-code') || 'ELE';

  const lifespan = parseInt(catSelect?.options[catSelect.selectedIndex]?.getAttribute('data-lifespan')) || 5;
  const usedBy = hasBast ? (document.getElementById('asset-used-by')?.value.trim() || roomName) : roomName;

  if (isEdit) {
    const id = document.getElementById('asset-form-id').value;
    const price = unitPrice * qty;
    const assetObj = {
      id,
      date,
      tanggalDiterima: date,
      noInduk: noIndukBase,
      code: baseCode,
      kodeBarang: baseCode,
      name,
      namaBarang: name,
      brandType,
      merkType: brandType,
      brand: brandType,
      size,
      ukuran: size,
      material,
      bahan: material,
      productionYear,
      tahunPembuatan: productionYear,
      source,
      asalBarang: source,
      documents,
      kelengkapanDokumen: documents,
      qty,
      jumlahBarang: qty,
      unit,
      satuan: unit,
      condition,
      kondisi: condition,
      unitPrice,
      hargaSatuan: unitPrice,
      price,
      hargaJumlah: price,
      notes,
      keterangan: notes,
      usedBy,
      dipergunakanOleh: usedBy,
      serialNumber,
      noSeri: serialNumber,
      imei,
      techSpecs,
      spesifikasi: techSpecs,
      nopol,
      noPolisi: nopol,
      noRangka,
      nomorRangka: noRangka,
      noMesin,
      nomorMesin: noMesin,
      noBpkb,
      nomorBpkb: noBpkb,
      divisionId: divId,
      divisionName: divName,
      divisionCode: divCode,
      roomId,
      roomName,
      roomCode,
      categoryId: catId,
      categoryName: catName,
      categoryCode: catCode,
      status: 'Aktif',
      lifespan,
      image: uploadedAssetPhotos.front || '',
      imageFront: uploadedAssetPhotos.front || ''
    };
    db.saveAsset(assetObj);
    showToast(`✅ Data "${name}" (${baseCode}) berhasil diperbarui!`, 'success');
  } else if (splitUnits && qty > 1) {
    // Multi-Unit auto-generation (Auto Pecah Tiap Unit)
    const s = db.getSettings();
    const sep = s.codeSeparator !== undefined ? s.codeSeparator : '-';
    const yearOpt = s.codeIncludeYear || 'YYYY';
    const digits = parseInt(s.codeDigits) || 3;
    let prefix = (s.codePrefix || '').trim().toUpperCase();
    if (!prefix && divCode) {
      if (divCode === 'RIAYAH') prefix = 'RYH';
      else if (divCode === 'PONDOK') prefix = 'PDK';
      else if (divCode === 'SEKRET') prefix = 'SKR';
      else prefix = divCode.substring(0, 3).toUpperCase();
    }

    let yearPart = '';
    if (yearOpt === 'YYYY') yearPart = fullYear;
    else if (yearOpt === 'YY') yearPart = fullYear.slice(-2);

    const existingAssets = db.getAssets();
    let currentSeq = 1;
    const matching = existingAssets.filter(a => {
      const hasCat = !catCode || (a.categoryCode === catCode || (a.code && a.code.includes(catCode)));
      const hasRoom = !roomCode || (a.roomCode === roomCode || (a.code && a.code.includes(roomCode)));
      return hasCat && hasRoom;
    });
    currentSeq = matching.length + 1;

    for (let i = 1; i <= qty; i++) {
      let unitCode = '';
      while (true) {
        const numPart = String(currentSeq).padStart(digits, '0');
        const parts = [];
        if (prefix) parts.push(prefix);
        if (catCode) parts.push(catCode);
        if (roomCode) parts.push(roomCode);
        if (yearPart) parts.push(yearPart);
        parts.push(numPart);
        unitCode = parts.join(sep);
        if (!existingAssets.some(a => a.code === unitCode)) break;
        currentSeq++;
      }

      const unitId = `AST-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const divTag = prefix ? `-${prefix}` : '';
      const unitNoInduk = `${String(currentSeq).padStart(3, '0')}/INV${divTag}/${fullYear}`;

      const unitObj = {
        id: unitId,
        date,
        tanggalDiterima: date,
        noInduk: unitNoInduk,
        code: unitCode,
        kodeBarang: unitCode,
        name: `${name} (Unit ${i})`,
        namaBarang: `${name} (Unit ${i})`,
        brandType,
        merkType: brandType,
        brand: brandType,
        size,
        ukuran: size,
        material,
        bahan: material,
        productionYear,
        tahunPembuatan: productionYear,
        source,
        asalBarang: source,
        documents,
        kelengkapanDokumen: documents,
        qty: 1,
        jumlahBarang: 1,
        unit,
        satuan: unit,
        condition,
        kondisi: condition,
        unitPrice,
        hargaSatuan: unitPrice,
        price: unitPrice,
        hargaJumlah: unitPrice,
        notes: `${notes} [Unit ${i} dari ${qty}]`,
        keterangan: `${notes} [Unit ${i} dari ${qty}]`,
        usedBy,
        dipergunakanOleh: usedBy,
        serialNumber,
        noSeri: serialNumber,
        imei,
        techSpecs,
        spesifikasi: techSpecs,
        nopol,
        noPolisi: nopol,
        noRangka,
        nomorRangka: noRangka,
        noMesin,
        nomorMesin: noMesin,
        noBpkb,
        nomorBpkb: noBpkb,
        divisionId: divId,
        divisionName: divName,
        divisionCode: divCode,
        branchId: branchId || undefined,
        branchName: branchName || undefined,
        roomId,
        roomName,
        roomCode,
        categoryId: catId,
        categoryName: catName,
        categoryCode: catCode,
        status: 'Aktif',
        lifespan,
        image: uploadedAssetPhotos.front || '',
        imageFront: uploadedAssetPhotos.front || ''
      };

      db.saveAsset(unitObj);
      existingAssets.push(unitObj);
      currentSeq++;
    }
    showToast(`✅ Berhasil membuat ${qty} unit aset terpisah (${catCode}-${roomCode}-${yearPart}-...) lengkap dengan stiker QR unik masing-masing!`, 'success');
  } else {
    // Single / aggregate save
    const id = `AST-${Date.now()}`;
    const price = unitPrice * qty;
    const existingAssets = db.getAssets();
    let divTag = '';
    if (divCode === 'RIAYAH') divTag = '-RYH';
    else if (divCode === 'PONDOK') divTag = '-PDK';
    else if (divCode === 'SEKRET') divTag = '-SKR';
    else if (divCode) divTag = `-${divCode.substring(0, 3).toUpperCase()}`;

    const assetObj = {
      id,
      date,
      tanggalDiterima: date,
      noInduk: noIndukBase || `${String(existingAssets.length + 1).padStart(3, '0')}/INV${divTag}/${fullYear}`,
      code: baseCode,
      kodeBarang: baseCode,
      name,
      namaBarang: name,
      brandType,
      merkType: brandType,
      brand: brandType,
      size,
      ukuran: size,
      material,
      bahan: material,
      productionYear,
      tahunPembuatan: productionYear,
      source,
      asalBarang: source,
      documents,
      kelengkapanDokumen: documents,
      qty,
      jumlahBarang: qty,
      unit,
      satuan: unit,
      condition,
      kondisi: condition,
      unitPrice,
      hargaSatuan: unitPrice,
      price,
      hargaJumlah: price,
      notes,
      keterangan: notes,
      usedBy,
      dipergunakanOleh: usedBy,
      serialNumber,
      noSeri: serialNumber,
      imei,
      techSpecs,
      spesifikasi: techSpecs,
      nopol,
      noPolisi: nopol,
      noRangka,
      nomorRangka: noRangka,
      noMesin,
      nomorMesin: noMesin,
      noBpkb,
      nomorBpkb: noBpkb,
      divisionId: divId,
      divisionName: divName,
      divisionCode: divCode,
      branchId: branchId || undefined,
      branchName: branchName || undefined,
      roomId,
      roomName,
      roomCode,
      categoryId: catId,
      categoryName: catName,
      categoryCode: catCode,
      status: 'Aktif',
      lifespan,
      image: uploadedAssetPhotos.front || '',
      imageFront: uploadedAssetPhotos.front || ''
    };
    db.saveAsset(assetObj);
    showToast(`✅ Data "${name}" (${baseCode}) berhasil disimpan ke Buku Induk Barang & KIB!`, 'success');
  }

  closeModal('modal-aset');
  renderAssetTable();
  renderDashboard();
  renderRoomCards();
  renderKIBPage();
  renderStickerGrid();
  updateNotificationCenter();
}

/**
 * ========================================================
 * 10. MODAL DETAIL ASET (16 KOLOM STANDAR BUKU INDUK)
 * ========================================================
 */
function openModalDetailAset(assetId) {
  const asset = db.getAssetById(assetId);
  if (!asset) return;

  const rawUnitPrice = asset.unitPrice || (asset.qty ? (asset.price / asset.qty) : asset.price) || 0;
  const rawTotalPrice = asset.price || (rawUnitPrice * (asset.qty || 1)) || 0;
  const unitPriceFormatted = DepreciationEngine.formatRupiah(rawUnitPrice);
  const totalPriceFormatted = DepreciationEngine.formatRupiah(rawTotalPrice);

  const qrContainerId = `qr-modal-dtl-${asset.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  let conditionLabel = '<span class="badge badge-success font-bold">B (Baik - Normal 100%)</span>';
  if (asset.condition === 'RR' || asset.condition === 'Rusak Ringan') {
    conditionLabel = '<span class="badge badge-warning font-bold">RR (Rusak Ringan)</span>';
  } else if (asset.condition === 'RB' || asset.condition === 'Rusak Berat') {
    conditionLabel = '<span class="badge badge-danger font-bold">RB (Rusak Berat)</span>';
  }

  const modalBody = document.getElementById('detail-modal-content');
  if (!modalBody) return;

  modalBody.innerHTML = `
    <div class="space-y-4">
      
      <!-- Top Overview Card -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3.5 w-full sm:w-auto">
          <div id="${qrContainerId}" class="w-24 h-24 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0"></div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">${asset.code}</span>
              ${asset.noInduk ? `<span class="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">No Induk: ${asset.noInduk}</span>` : ''}
            </div>
            <h3 class="text-lg font-bold font-heading text-slate-900 dark:text-slate-100 mt-1 truncate">${asset.name}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${asset.brandType || asset.brand || 'Tanpa Merk'} • Tgl Diterima: ${asset.date || asset.tanggalDiterima || '-'}</p>
            <div class="flex items-center gap-2 mt-2">
              ${conditionLabel}
              <span class="badge badge-info font-bold">${asset.qty || 1} ${asset.unit || asset.satuan || 'Unit'}</span>
            </div>
          </div>
        </div>
        <div class="flex sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
          <button onclick="openModalEditAset('${asset.id}'); closeModal('modal-detail-aset')" class="btn-primary text-xs justify-center flex-1">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i> Masuk Form Penginputan (Edit)
          </button>
          <button onclick="printSingleSticker('${asset.id}')" class="btn-secondary text-xs justify-center flex-1">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i> Cetak Stiker QR
          </button>
        </div>
      </div>

      <!-- 16 Kolom Buku Induk Barang -->
      <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div class="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider">
          <span class="flex items-center gap-1.5"><i data-lucide="clipboard-list" class="w-4 h-4"></i> Rincian Standar 16 Kolom Buku Induk Barang</span>
          <span class="text-[10px] text-slate-400 font-normal normal-case">Format Standar Resmi Inventaris</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <!-- 1. Tanggal Diterima -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">1. Tanggal Diterima</span>
            <strong class="text-slate-900 dark:text-slate-100 font-mono">${asset.date || asset.tanggalDiterima || '-'}</strong>
          </div>

          <!-- 2. No Induk -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">2. No Induk</span>
            <strong class="text-slate-900 dark:text-slate-100 font-mono">${asset.noInduk || '-'}</strong>
          </div>

          <!-- 3. Kode Barang -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">3. Kode Barang</span>
            <strong class="text-amber-600 dark:text-amber-400 font-mono font-bold">${asset.code || asset.kodeBarang}</strong>
          </div>

          <!-- 4. Nama Barang -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">4. Nama / Jenis Barang</span>
            <strong class="text-slate-900 dark:text-slate-100">${asset.name || asset.namaBarang}</strong>
          </div>

          <!-- 5. Merk / Type -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">5. Merk / Type</span>
            <strong class="text-slate-900 dark:text-slate-100">${asset.brandType || asset.brand || '-'}</strong>
          </div>

          <!-- 6. Ukuran -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">6. Ukuran</span>
            <strong class="text-slate-900 dark:text-slate-100">${asset.size || asset.ukuran || '-'}</strong>
          </div>

          <!-- 7. Bahan -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">7. Bahan</span>
            <strong class="text-slate-900 dark:text-slate-100">${asset.material || asset.bahan || '-'}</strong>
          </div>

          <!-- 8. Tahun Pembuatan -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">8. Tahun Pembuatan</span>
            <strong class="text-slate-900 dark:text-slate-100 font-mono">${asset.productionYear || asset.tahunPembuatan || '-'}</strong>
          </div>

          <!-- 9. Asal Barang -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">9. Asal Barang</span>
            <strong class="text-slate-900 dark:text-slate-100">${asset.source || asset.asalBarang || '-'}</strong>
          </div>

          <!-- 10. Kelengkapan Dokumen -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">10. Kelengkapan Dokumen</span>
            <strong class="text-slate-900 dark:text-slate-100">${asset.documents || asset.kelengkapanDokumen || '-'}</strong>
          </div>

          <!-- 11 & 12. Jumlah & Satuan -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">11 & 12. Jumlah & Satuan</span>
            <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${asset.qty || asset.jumlahBarang || 1} ${asset.unit || asset.satuan || 'Unit'}</strong>
          </div>

          <!-- 13. Kondisi -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">13. Kondisi</span>
            <div>${conditionLabel}</div>
          </div>

          <!-- 14. Harga Satuan (Rp) -->
          <div class="sm:col-span-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
            <span class="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">14. Harga Satuan (Rp)</span>
            <div class="flex items-center justify-between mt-1">
              <strong class="text-slate-900 dark:text-slate-100 font-bold text-sm">${unitPriceFormatted}</strong>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">${DepreciationEngine.formatRingkas(rawUnitPrice)}</span>
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5 leading-snug">"${DepreciationEngine.terbilang(rawUnitPrice)}"</div>
          </div>

          <!-- 15. Harga Jumlah (Total Rp) -->
          <div class="sm:col-span-2 p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
            <span class="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">15. Harga Jumlah Total (Rp)</span>
            <div class="flex items-center justify-between mt-1">
              <strong class="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">${totalPriceFormatted}</strong>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/30 text-emerald-800 dark:text-emerald-200">${DepreciationEngine.formatRingkas(rawTotalPrice)}</span>
            </div>
            <div class="text-[10px] text-emerald-700 dark:text-emerald-300 italic mt-0.5 leading-snug">"${DepreciationEngine.terbilang(rawTotalPrice)}"</div>
          </div>

          <!-- Ruangan & Dipergunakan Oleh -->
          <div class="sm:col-span-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-500/20">
            <span class="text-blue-700 dark:text-blue-400 block text-[10px] uppercase font-bold">Lokasi / Ruangan Penempatan</span>
            <strong class="text-slate-900 dark:text-slate-100">${asset.roomName || '-'}</strong>
          </div>

          <div class="sm:col-span-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-500/20">
            <span class="text-blue-700 dark:text-blue-400 block text-[10px] uppercase font-bold">Dipergunakan Oleh / Di (Kolom 14 KIB)</span>
            <strong class="text-slate-900 dark:text-slate-100">${asset.usedBy || asset.dipergunakanOleh || asset.roomName || '-'}</strong>
          </div>

          <!-- 16. Keterangan -->
          <div class="col-span-2 sm:col-span-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">16. Keterangan</span>
            <p class="text-slate-800 dark:text-slate-200 mt-0.5">${asset.notes || asset.keterangan || '-'}</p>
          </div>
        </div>
      </div>

      <!-- Detail Khusus Elektronik / Kendaraan jika ada -->
      ${(asset.serialNumber || asset.imei || asset.techSpecs || asset.nopol || asset.noRangka || asset.noMesin || asset.noBpkb) ? `
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div class="text-xs font-bold ${asset.nopol || asset.noRangka ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'} flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider">
            <span class="flex items-center gap-1.5">
              <i data-lucide="${asset.nopol || asset.noRangka ? 'truck' : 'cpu'}" class="w-4 h-4"></i>
              ${asset.nopol || asset.noRangka ? 'Identitas Kendaraan Bermotor (Dokumen & Mesin)' : 'Identitas Khusus Elektronik, Serial Number & IMEI'}
            </span>
            <span class="text-[10px] text-slate-400 font-normal normal-case">Nomor Identitas Pabrik / Samsat</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            ${asset.serialNumber ? `
              <div class="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-500/20">
                <span class="text-blue-700 dark:text-blue-400 block text-[10px] uppercase font-bold">Serial Number (SN)</span>
                <strong class="font-mono text-slate-900 dark:text-slate-100 font-bold">${asset.serialNumber}</strong>
              </div>
            ` : ''}
            ${asset.imei ? `
              <div class="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-500/20">
                <span class="text-blue-700 dark:text-blue-400 block text-[10px] uppercase font-bold">Nomor IMEI</span>
                <strong class="font-mono text-slate-900 dark:text-slate-100 font-bold">${asset.imei}</strong>
              </div>
            ` : ''}
            ${asset.techSpecs ? `
              <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Spesifikasi Teknis (RAM / Storage / Spek)</span>
                <strong class="text-slate-900 dark:text-slate-100">${asset.techSpecs}</strong>
              </div>
            ` : ''}
            ${asset.nopol ? `
              <div class="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-500/30">
                <span class="text-amber-700 dark:text-amber-400 block text-[10px] uppercase font-bold">Plat Nomor (Nopol)</span>
                <strong class="font-mono text-amber-600 dark:text-amber-400 font-extrabold text-sm">${asset.nopol}</strong>
              </div>
            ` : ''}
            ${asset.noRangka ? `
              <div class="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-500/20">
                <span class="text-amber-700 dark:text-amber-400 block text-[10px] uppercase font-bold">No. Rangka (Chasis / VIN)</span>
                <strong class="font-mono text-slate-900 dark:text-slate-100">${asset.noRangka}</strong>
              </div>
            ` : ''}
            ${asset.noMesin ? `
              <div class="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-500/20">
                <span class="text-amber-700 dark:text-amber-400 block text-[10px] uppercase font-bold">Nomor Mesin</span>
                <strong class="font-mono text-slate-900 dark:text-slate-100">${asset.noMesin}</strong>
              </div>
            ` : ''}
            ${asset.noBpkb ? `
              <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">No. BPKB & Pajak STNK</span>
                <strong class="text-slate-900 dark:text-slate-100">${asset.noBpkb}</strong>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Riwayat Mutasi / Perpindahan Barang jika ada -->
      ${(() => {
        const assetMuts = (typeof db.getMutations === 'function' ? db.getMutations() : []).filter(m => m.assetId === asset.id || m.assetCode === asset.code);
        if (assetMuts.length === 0) return '';
        return `
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div class="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span class="flex items-center gap-1.5">
                <i data-lucide="history" class="w-4 h-4"></i> Riwayat Mutasi & Pemindahan Lokasi (${assetMuts.length} Kali)
              </span>
              <span class="text-[10px] text-slate-400 font-normal">Arsip Pemindahan Terakhir</span>
            </div>
            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
              ${assetMuts.map(m => `
                <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <span class="text-rose-500 font-semibold">${m.fromRoomName || '-'}</span>
                      <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-amber-500"></i>
                      <span class="text-emerald-500 font-semibold">${m.toRoomName || '-'}</span>
                      <span class="text-[10px] font-normal text-slate-400">(${m.date})</span>
                    </div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${m.reason || '-'} • PJ: ${m.toPj || '-'}</div>
                  </div>
                  <button onclick="closeModal('modal-detail-aset'); printBAMutasi('${m.id}')" class="btn-secondary text-[10px] py-1 px-2 text-blue-500 whitespace-nowrap">
                    <i data-lucide="printer" class="w-3 h-3"></i> Cetak BA
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })()}

      <!-- Action Footer -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <button onclick="openModalAjukanPenghapusan('${asset.id}'); closeModal('modal-detail-aset')" class="btn-secondary text-xs text-rose-500 hover:bg-rose-500/10 border-rose-500/30">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Ajukan Penghapusan
          </button>
          <button onclick="openModalMutasiAset('${asset.id}'); closeModal('modal-detail-aset')" class="btn-secondary text-xs text-amber-500 hover:bg-amber-500/10 border-amber-500/30">
            <i data-lucide="arrow-right-left" class="w-3.5 h-3.5"></i> Mutasi Barang Ini
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button type="button" onclick="closeModal('modal-detail-aset')" class="btn-secondary text-xs">Tutup</button>
          <button onclick="openModalEditAset('${asset.id}'); closeModal('modal-detail-aset')" class="btn-primary text-xs">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit Aset
          </button>
        </div>
      </div>

    </div>
  `;

  setTimeout(() => {
    QREngine.generateQR(qrContainerId, asset.code, 96);
    if (window.lucide) lucide.createIcons();
  }, 50);

  openModal('modal-detail-aset');
}

/**
 * ========================================================
 * 11. SECTION 3: INVENTARIS RUANGAN (KIR)
 * ========================================================
 */
function populateKIRRoomDropdown() {
  const kirRoomSelect = document.getElementById('kir-filter-room');
  if (!kirRoomSelect) return;

  const allRooms = db.getRooms();
  let rooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(allRooms) : allRooms;

  const branchFilter = document.getElementById('kir-filter-branch')?.value || '';
  const divFilter = document.getElementById('kir-filter-division')?.value || '';

  if (branchFilter) {
    rooms = rooms.filter(r => r.branchId === branchFilter || r.branchName === branchFilter);
  }
  if (divFilter) {
    rooms = rooms.filter(r => r.divisionId === divFilter || r.divisionName === divFilter);
  }

  const curVal = kirRoomSelect.value;
  kirRoomSelect.innerHTML = '<option value="">-- Tampilkan Semua Ruangan --</option>' + 
    rooms.map(r => `<option value="${r.id}">🚪 ${r.name} (${r.code || ''}) - PJ: ${r.pj || '-'}</option>`).join('');

  if (curVal && rooms.some(r => r.id === curVal)) {
    kirRoomSelect.value = curVal;
  } else if (currentSelectedRoomId && rooms.some(r => r.id === currentSelectedRoomId)) {
    kirRoomSelect.value = currentSelectedRoomId;
  } else {
    kirRoomSelect.value = '';
  }
}

function onKIRScopeChange() {
  populateKIRRoomDropdown();
  renderRoomCards();

  const allRooms = db.getRooms();
  let rooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(allRooms) : allRooms;
  const branchFilter = document.getElementById('kir-filter-branch')?.value || '';
  const divFilter = document.getElementById('kir-filter-division')?.value || '';

  if (branchFilter) {
    rooms = rooms.filter(r => r.branchId === branchFilter || r.branchName === branchFilter);
  }
  if (divFilter) {
    rooms = rooms.filter(r => r.divisionId === divFilter || r.divisionName === divFilter);
  }

  if (rooms.length > 0 && (!currentSelectedRoomId || !rooms.some(r => r.id === currentSelectedRoomId))) {
    selectRoom(rooms[0].id);
  } else if (rooms.length === 0) {
    selectRoom(null);
  }
}

function onKIRRoomSelectDropdown(roomId) {
  if (roomId) {
    selectRoom(roomId);
    const room = db.getRoomById(roomId);
    if (room) {
      showToast(`🚪 Ruangan "${room.name}" dipilih`, 'info');
    }
  } else {
    renderRoomCards();
    const allRooms = db.getRooms();
    let rooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(allRooms) : allRooms;
    const branchFilter = document.getElementById('kir-filter-branch')?.value || '';
    const divFilter = document.getElementById('kir-filter-division')?.value || '';
    if (branchFilter) rooms = rooms.filter(r => r.branchId === branchFilter || r.branchName === branchFilter);
    if (divFilter) rooms = rooms.filter(r => r.divisionId === divFilter || r.divisionName === divFilter);
    if (rooms.length > 0) selectRoom(rooms[0].id);
  }
}

function resetKIRScope() {
  if (document.getElementById('kir-filter-branch')) document.getElementById('kir-filter-branch').value = '';
  if (document.getElementById('kir-filter-division')) document.getElementById('kir-filter-division').value = '';
  if (document.getElementById('kir-filter-room')) document.getElementById('kir-filter-room').value = '';
  onKIRScopeChange();
  showToast('🔄 Filter ruangan di-reset ke Semua Ruangan', 'info');
}

function renderRoomCards() {
  const allRooms = db.getRooms();
  let rooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(allRooms) : allRooms;
  const allAssets = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterAssets(db.getAssets()) : db.getAssets();
  const container = document.getElementById('room-card-selector');
  if (!container) return;

  // Apply KIR Scope Filters
  const branchFilter = document.getElementById('kir-filter-branch')?.value || '';
  const divFilter = document.getElementById('kir-filter-division')?.value || '';

  if (branchFilter) {
    rooms = rooms.filter(r => r.branchId === branchFilter || r.branchName === branchFilter);
  }
  if (divFilter) {
    rooms = rooms.filter(r => r.divisionId === divFilter || r.divisionName === divFilter);
  }

  // Update room count display label
  const roomCountLabel = document.getElementById('kir-room-count-display');
  if (roomCountLabel) {
    roomCountLabel.textContent = `${rooms.length}`;
  }

  if (rooms.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-6 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 text-center text-xs text-slate-500 dark:text-slate-400">
        Tidak ada ruangan yang cocok dengan filter cabang/divisi yang dipilih.
        <button type="button" onclick="resetKIRScope()" class="mt-2 block mx-auto px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors">
          Reset Filter Ruangan
        </button>
      </div>
    `;
    return;
  }

  const divisions = (typeof db !== 'undefined' && db.getDivisions) ? db.getDivisions() : [];
  const branches = (typeof db !== 'undefined' && db.getBranches) ? db.getBranches() : [];

  container.innerHTML = rooms.map(r => {
    const roomAssets = allAssets.filter(a => a.roomId === r.id || a.roomName === r.name);
    const isSelected = r.id === currentSelectedRoomId;
    const divObj = divisions.find(d => d.id === r.divisionId || d.name === r.divisionName);
    const divLabel = divObj ? (divObj.code || divObj.name) : (r.divisionName || 'Pusat');

    return `
      <div onclick="selectRoom('${r.id}')" class="p-3.5 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/25' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'}">
        <div class="flex items-center justify-between mb-1.5">
          <i data-lucide="door-closed" class="w-5 h-5 ${isSelected ? 'text-slate-950' : 'text-amber-500'}"></i>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-black/20 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}">${roomAssets.length} Unit</span>
        </div>
        <h4 class="font-bold text-xs truncate ${isSelected ? 'text-slate-950' : 'text-slate-900 dark:text-slate-100'}">${r.name}</h4>
        <div class="flex items-center justify-between mt-1 pt-1 border-t ${isSelected ? 'border-black/10 text-slate-900/90' : 'border-slate-100 dark:border-slate-800 text-slate-400'} text-[10px]">
          <span class="truncate max-w-[85px]">${r.floor || '-'}</span>
          <span class="px-1.5 py-0.5 rounded font-mono font-semibold ${isSelected ? 'bg-black/20 text-slate-950' : 'bg-amber-500/10 text-amber-500'}">${divLabel}</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function selectRoom(roomId) {
  const allRooms = db.getRooms();
  const rooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(allRooms) : allRooms;
  
  if (rooms.length === 0) {
    currentSelectedRoomId = null;
    const roomNameEl = document.getElementById('current-room-name');
    const roomPjEl = document.getElementById('current-room-pj');
    const statCountEl = document.getElementById('room-stat-count');
    const statNominalEl = document.getElementById('room-stat-nominal');
    const statBEl = document.getElementById('room-stat-b');
    const statRREl = document.getElementById('room-stat-rr');
    const statRBEl = document.getElementById('room-stat-rb');
    if (roomNameEl) roomNameEl.textContent = 'Belum Ada Ruangan Terdaftar';
    if (roomPjEl) roomPjEl.textContent = 'Klik tombol "+ Tambah Ruangan Baru" di kanan atas untuk membuat ruangan.';
    if (statCountEl) statCountEl.textContent = '0 Unit';
    if (statNominalEl) statNominalEl.textContent = 'Rp 0';
    if (statBEl) statBEl.textContent = '0 Unit';
    if (statRREl) statRREl.textContent = '0 Unit';
    if (statRBEl) statRBEl.textContent = '0 Unit';
    const tbody = document.getElementById('room-items-table-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="12" class="text-center py-10 text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">Belum ada ruangan untuk wilayah ini.<br><button type="button" onclick="openModalTambahRuangan()" class="mt-2 btn-primary text-xs">+ Tambah Ruangan Baru</button></td></tr>';
    }
    return;
  }

  currentSelectedRoomId = roomId || rooms[0]?.id;

  // Sync Dropdown Pilih Ruangan
  const kirRoomSelect = document.getElementById('kir-filter-room');
  if (kirRoomSelect && currentSelectedRoomId) {
    kirRoomSelect.value = currentSelectedRoomId;
  }

  renderRoomCards();

  const room = rooms.find(r => r.id === currentSelectedRoomId) || rooms[0];
  if (!room) return;

  const allAssets = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterAssets(db.getAssets()) : db.getAssets();
  const roomAssets = allAssets.filter(a => a.roomId === room.id || a.roomName === room.name);

  let totalNominal = 0;
  let totalQty = 0;
  let baikCount = 0;
  let rrCount = 0;
  let rbCount = 0;

  roomAssets.forEach(a => {
    const qty = a.qty || 1;
    totalQty += qty;
    const unitPrice = a.unitPrice || (a.qty ? (a.price / a.qty) : a.price) || 0;
    const itemTotal = a.price || (unitPrice * qty);
    totalNominal += itemTotal;

    let cond = a.condition || 'B';
    if (cond === 'Baik' || cond === 'B') {
      baikCount += qty;
    } else if (cond === 'Rusak Ringan' || cond === 'RR') {
      rrCount += qty;
    } else if (cond === 'Rusak Berat' || cond === 'RB') {
      rbCount += qty;
    }
  });

  const roomNameEl = document.getElementById('current-room-name');
  const roomPjEl = document.getElementById('current-room-pj');
  const statCountEl = document.getElementById('room-stat-count');
  const statNominalEl = document.getElementById('room-stat-nominal');
  const statBEl = document.getElementById('room-stat-b');
  const statRREl = document.getElementById('room-stat-rr');
  const statRBEl = document.getElementById('room-stat-rb');

  if (roomNameEl) roomNameEl.textContent = room.name;
  if (roomPjEl) roomPjEl.textContent = `Penanggung Jawab: ${room.pj || '-'} ${room.pjNip ? `(Amanah: ${room.pjNip})` : ''} • Lokasi: ${room.floor || 'Gedung Utama'}`;
  if (statCountEl) statCountEl.textContent = `${totalQty} Unit (${roomAssets.length} Jenis)`;
  if (statNominalEl) statNominalEl.textContent = DepreciationEngine.formatRupiah(totalNominal);
  if (statBEl) statBEl.textContent = `${baikCount} Unit`;
  if (statRREl) statRREl.textContent = `${rrCount} Unit`;
  if (statRBEl) statRBEl.textContent = `${rbCount} Unit`;

  const tbody = document.getElementById('room-items-table-body');
  if (tbody) {
    if (roomAssets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="12" class="text-center py-10 text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">Belum ada barang inventaris yang ditempatkan di ruangan ini.<br><button onclick="openModalTambahAset()" class="mt-2 text-xs text-amber-500 font-bold hover:underline">+ Input Barang ke Ruangan Ini</button></td></tr>';
    } else {
      tbody.innerHTML = roomAssets.map((a, idx) => {
        let cond = a.condition || 'B';
        if (cond === 'Baik') cond = 'B';
        else if (cond === 'Rusak Ringan') cond = 'RR';
        else if (cond === 'Rusak Berat') cond = 'RB';

        const year = a.productionYear || a.tahunPembuatan || (a.date ? a.date.split('-')[0] : '-');

        // B indicator
        const bCell = cond === 'B' 
          ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[11px] shadow-sm" title="Kondisi Baik (${a.qty || 1} Unit)">✓</span>`
          : '<span class="text-slate-300 dark:text-slate-600">-</span>';

        // RR indicator
        const rrCell = cond === 'RR' 
          ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] shadow-sm" title="Rusak Ringan (${a.qty || 1} Unit)">✓</span>`
          : '<span class="text-slate-300 dark:text-slate-600">-</span>';

        // RB indicator
        const rbCell = cond === 'RB' 
          ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[11px] shadow-sm" title="Rusak Berat (${a.qty || 1} Unit)">✓</span>`
          : '<span class="text-slate-300 dark:text-slate-600">-</span>';

        return `
          <tr class="hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800 text-xs">
            <td class="px-3 py-2.5 text-center font-bold text-slate-500 dark:text-slate-400">${idx + 1}</td>
            <td class="px-3 py-2.5">
              <strong class="text-slate-900 dark:text-slate-100 hover:text-amber-500 cursor-pointer block" onclick="openModalDetailAset('${a.id}')">${a.name}</strong>
            </td>
            <td class="px-3 py-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">${a.code}</td>
            <td class="px-3 py-2.5 text-slate-700 dark:text-slate-300">${a.brandType || a.brand || '-'}</td>
            <td class="px-3 py-2.5 text-slate-600 dark:text-slate-400">${a.size || a.ukuran || '-'}</td>
            <td class="px-3 py-2.5 text-slate-600 dark:text-slate-400">${a.material || a.bahan || '-'}</td>
            <td class="px-3 py-2.5 text-center font-mono text-slate-700 dark:text-slate-300">${year}</td>
            <td class="px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">${a.qty || 1}</td>
            <td class="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400">${a.unit || 'Unit'}</td>
            <td class="px-2 py-2 text-center bg-emerald-50/40 dark:bg-emerald-950/20">${bCell}</td>
            <td class="px-2 py-2 text-center bg-amber-50/40 dark:bg-amber-950/20">${rrCell}</td>
            <td class="px-2 py-2 text-center bg-rose-50/40 dark:bg-rose-950/20">${rbCell}</td>
            <td class="px-3 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[130px]" title="${a.notes || '-'}">${a.notes || '-'}</td>
            <td class="px-3 py-2.5 text-center">
              <div class="flex items-center justify-center gap-1">
                <button onclick="printSingleSticker('${a.id}')" class="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors" title="Cetak Stiker QR">
                  <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="openModalDetailAset('${a.id}')" class="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-colors" title="Detail">
                  <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  if (window.lucide) lucide.createIcons();
}

function printKIRCurrentRoom() {
  if (!currentSelectedRoomId) return;
  const settings = db.getSettings();
  const kirHTML = ReportEngine.generateKIRHTML(currentSelectedRoomId, settings);

  printIsolatedHTML(kirHTML);
}

function printStickersCurrentRoom() {
  if (!currentSelectedRoomId) {
    navigateTo('stiker');
    return;
  }
  navigateToStikerWithRoom(currentSelectedRoomId);
}

/**
 * ========================================================
 * 12. SECTION 4: SCANNER QR & STIKER GENERATOR
 * ========================================================
 */
function toggleCameraScanner() {
  QREngine.toggleCamera();
}

function scanQRFromImage(event) {
  QREngine.scanFromFile(event);
}

function handleManualSearchCode() {
  const code = document.getElementById('manual-scan-code').value.trim();
  if (!code) return;
  QREngine.onScanSuccess(code);
}

function renderStickerGrid() {
  const filterRoomId = document.getElementById('sticker-filter-room')?.value || '';
  const allAssets = db.getAssets();
  const settings = db.getSettings();

  const filtered = filterRoomId 
    ? allAssets.filter(a => a.roomId === filterRoomId) 
    : allAssets;

  const container = document.getElementById('sticker-grid-preview');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 py-8 text-center col-span-full">Tidak ada aset untuk dicetak stikernya.</p>';
    return;
  }

  container.innerHTML = filtered.map(a => QREngine.generateStickerHTML(a, settings)).join('');

  if (window.lucide) lucide.createIcons();
}

function printStickerGridSheet() {
  const filterRoomId = document.getElementById('sticker-filter-room')?.value || '';
  const allAssets = db.getAssets();
  const filtered = filterRoomId ? allAssets.filter(a => a.roomId === filterRoomId) : allAssets;

  if (filtered.length === 0) {
    showToast('Tidak ada stiker untuk dicetak.', 'warning');
    return;
  }

  printBulkStickers(filtered, 'Lembar Stiker QR Aset');
}

function printSingleSticker(assetId) {
  const asset = db.getAssetById(assetId);
  if (!asset) return;
  printBulkStickers([asset], `Stiker QR - ${asset.name}`);
}

function printBulkStickers(assetsArray, title = 'Cetak Stiker Label') {
  const settings = db.getSettings();

  let stickersHTML = '';
  assetsArray.forEach(a => {
    stickersHTML += `
      <div class="sticker-card" style="border: 1.5px solid #0f172a; border-radius: 8px; padding: 8px 10px; display: flex; align-items: center; gap: 10px; page-break-inside: avoid; background: #ffffff; box-sizing: border-box;">
        <div id="print-qr-${a.id}" style="width: 64px; height: 64px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #fff;"></div>
        <div style="flex: 1; min-width: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 0.3px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${settings.instansiName}</div>
          <div style="font-size: 9pt; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.name}</div>
          <div style="font-size: 8.5pt; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; color: #d97706; letter-spacing: 0.5px;">${a.code}</div>
          <div style="font-size: 7.5pt; color: #475569; font-weight: 600; margin-top: 1px;">Ruang: ${a.roomName || '-'}</div>
        </div>
      </div>
    `;
  });

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { margin: 8mm; font-family: sans-serif; background: #fff; }
        .sticker-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media print {
          body { margin: 4mm; }
          .sticker-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
    </head>
    <body>
      <div class="sticker-grid">
        ${stickersHTML}
      </div>
      <script>
        window.onload = function() {
          ${assetsArray.map(a => `
            new QRCode(document.getElementById('print-qr-${a.id}'), {
              text: "${a.code}",
              width: 64,
              height: 64,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.M
            });
          `).join('')}
          setTimeout(function() {
            window.print();
          }, 400);
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * ========================================================
 * PUSAT STIKERISASI & CETAK STIKER QR ASET (DEDICATED ENGINE)
 * ========================================================
 */
let stickerState = {
  scope: 'all',          // 'all' | 'room' | 'category' | 'manual'
  layout: '2col',        // '2col' | '3col'
  selectedRoomId: '',
  selectedCategoryId: '',
  selectedAssetIds: new Set(),
  manualSearch: ''
};

function initStickerPage() {
  populateStickerDropdowns();
  populateStickerDivisionDropdown();

  const scopeSelect = document.getElementById('stiker-scope-select');
  if (scopeSelect) scopeSelect.value = stickerState.scope || 'all';

  const layoutSelect = document.getElementById('stiker-layout-select');
  if (layoutSelect) layoutSelect.value = stickerState.layout || '2col';

  if (stickerState.selectedAssetIds.size === 0) {
    const active = db.getAssets().filter(a => a.status !== 'Dihapuskan');
    active.forEach(a => stickerState.selectedAssetIds.add(a.id));
  }
  renderStickerManualAssetList();
  renderStickerCenter();
}

function setStickerScope(scope) {
  stickerState.scope = scope;

  const scopeSelect = document.getElementById('stiker-scope-select');
  if (scopeSelect && scopeSelect.value !== scope) {
    scopeSelect.value = scope;
  }

  const roomBox = document.getElementById('stiker-filter-room-box');
  const catBox = document.getElementById('stiker-filter-category-box');
  const manualBox = document.getElementById('stiker-filter-manual-box');
  const manualBadge = document.getElementById('stiker-filter-manual-badge');

  if (roomBox) roomBox.classList.toggle('hidden', scope !== 'room');
  if (catBox) catBox.classList.toggle('hidden', scope !== 'category');
  if (manualBox) manualBox.classList.toggle('hidden', scope !== 'manual');
  if (manualBadge) manualBadge.classList.toggle('hidden', scope !== 'manual');

  if (scope === 'manual') {
    renderStickerManualAssetList();
  }

  renderStickerCenter();
  if (window.lucide) lucide.createIcons();
}

function setStickerLayout(layout) {
  stickerState.layout = layout;
  const layoutSelect = document.getElementById('stiker-layout-select');
  if (layoutSelect && layoutSelect.value !== layout) {
    layoutSelect.value = layout;
  }

  renderStickerCenter();
}

function populateStickerDropdowns() {
  const roomSelect = document.getElementById('stiker-select-room');
  const catSelect = document.getElementById('stiker-select-cat');
  const rooms = db.getRooms();
  const cats = db.getCategories();

  if (roomSelect) {
    const currentVal = roomSelect.value;
    roomSelect.innerHTML = '<option value="">-- Pilih Ruangan --</option>' + 
      rooms.map(r => `<option value="${r.id}">${r.name} (${r.code || '-'})</option>`).join('');
    if (currentVal) roomSelect.value = currentVal;
    else if (rooms.length > 0) roomSelect.value = rooms[0].id;
  }

  if (catSelect) {
    const currentCat = catSelect.value;
    catSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>' + 
      cats.map(c => `<option value="${c.id}">${c.name} (${c.code || '-'})</option>`).join('');
    if (currentCat) catSelect.value = currentCat;
    else if (cats.length > 0) catSelect.value = cats[0].id;
  }
}

function getActiveStickerAssets() {
  const all = db.getAssets().filter(a => a.status !== 'Dihapuskan');
  
  if (stickerState.scope === 'all') {
    return all;
  } else if (stickerState.scope === 'room') {
    const selectedRoom = document.getElementById('stiker-select-room')?.value || '';
    return selectedRoom ? all.filter(a => a.roomId === selectedRoom) : all;
  } else if (stickerState.scope === 'category') {
    const selectedCat = document.getElementById('stiker-select-cat')?.value || '';
    return selectedCat ? all.filter(a => a.categoryId === selectedCat) : all;
  } else if (stickerState.scope === 'manual') {
    return all.filter(a => stickerState.selectedAssetIds.has(a.id));
  }
  return all;
}

function filterStickerManualAssetList() {
  const searchInput = document.getElementById('stiker-manual-search');
  stickerState.manualSearch = (searchInput ? searchInput.value : '').toLowerCase().trim();
  renderStickerManualAssetList();
}

function renderStickerManualAssetList() {
  const listContainer = document.getElementById('stiker-manual-asset-list');
  if (!listContainer) return;

  const all = db.getAssets().filter(a => a.status !== 'Dihapuskan');
  const q = stickerState.manualSearch;
  const filtered = q ? all.filter(a => 
    (a.name || '').toLowerCase().includes(q) || 
    (a.code || '').toLowerCase().includes(q) || 
    (a.roomName || '').toLowerCase().includes(q)
  ) : all;

  if (filtered.length === 0) {
    listContainer.innerHTML = '<div class="p-3 text-center text-xs text-slate-400">Tidak ada aset yang cocok.</div>';
    return;
  }

  listContainer.innerHTML = filtered.map(a => {
    const isChecked = stickerState.selectedAssetIds.has(a.id);
    return `
      <label class="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors text-xs">
        <div class="flex items-center gap-2.5 min-w-0 pr-2">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSingleStickerManualAsset('${a.id}', this.checked)" class="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500">
          <div class="truncate">
            <span class="font-bold text-slate-800 dark:text-slate-200 truncate block">${a.name}</span>
            <span class="font-mono text-[10px] text-slate-400 font-semibold">${a.code} • ${a.roomName || '-'}</span>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full ${a.condition === 'Baik' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600'} font-semibold flex-shrink-0">
          ${a.condition || 'Baik'}
        </span>
      </label>
    `;
  }).join('');
}

function toggleSingleStickerManualAsset(assetId, checked) {
  if (checked) {
    stickerState.selectedAssetIds.add(assetId);
  } else {
    stickerState.selectedAssetIds.delete(assetId);
  }
  renderStickerCenter();
}

function toggleSelectAllStickerAssets(selectAll) {
  const all = db.getAssets().filter(a => a.status !== 'Dihapuskan');
  if (selectAll) {
    all.forEach(a => stickerState.selectedAssetIds.add(a.id));
  } else {
    stickerState.selectedAssetIds.clear();
  }
  renderStickerManualAssetList();
  renderStickerCenter();
}

function populateStickerDivisionDropdown() {
  const select = document.getElementById('stiker-select-divisi');
  if (!select) return;

  const currentVal = select.value;
  const settings = db.getSettings();
  const divisions = db.getDivisions();

  let optionsHtml = `
    <option value="auto_room" class="dark:bg-slate-900 dark:text-slate-100 bg-white text-slate-900 font-medium">⚡ Otomatis Ikuti Divisi Ruangan (Per Aset)</option>
    <option value="lembaga" class="dark:bg-slate-900 dark:text-slate-100 bg-white text-slate-900 font-medium">🏛️ Standar Lembaga (${settings.instansiName || 'Munzalan'})</option>
  `;
  divisions.forEach(d => {
    optionsHtml += `<option value="${d.id}" class="dark:bg-slate-900 dark:text-slate-100 bg-white text-slate-900 font-medium">🏢 ${d.name} (${d.code || 'DIV'})</option>`;
  });

  select.innerHTML = optionsHtml;
  if (currentVal) select.value = currentVal;
  else select.value = 'auto_room';
}

function resolveAssetDivisionAndLogo(asset, selectedDivId, settings, rooms) {
  if (!settings) settings = db.getSettings();
  if (!rooms) rooms = db.getRooms();

  if (selectedDivId && selectedDivId !== 'auto_room' && selectedDivId !== 'lembaga') {
    const explicitDiv = db.getDivisionById(selectedDivId);
    if (explicitDiv) {
      return {
        name: explicitDiv.name,
        parent: explicitDiv.parent || settings.instansiName,
        logo: explicitDiv.logo || settings.logoImage || 'logo-munzalan.png',
        code: explicitDiv.code || ''
      };
    }
  } else if (selectedDivId === 'auto_room') {
    // Find asset's room and resolve division
    const room = rooms.find(r => r.id === asset.roomId || r.name === asset.roomName);
    if (room && room.divisionId) {
      const roomDiv = db.getDivisionById(room.divisionId);
      if (roomDiv) {
        return {
          name: roomDiv.name,
          parent: roomDiv.parent || settings.instansiName,
          logo: roomDiv.logo || settings.logoImage || 'logo-munzalan.png',
          code: roomDiv.code || ''
        };
      }
    }
  }

  return {
    name: settings.instansiName || 'MASJID KAPAL MUNZALAN MUBARAKAN',
    parent: settings.instansiParent || 'PENCATATAN ASET RIAYAH',
    logo: settings.logoImage || 'logo-munzalan.png',
    code: ''
  };
}

let tempStikerBuktiDataUrl = '';

function openModalUploadStikerBukti(assetId) {
  const asset = db.getAssetById(assetId);
  if (!asset) return;

  document.getElementById('upload-stiker-target-asset-id').value = asset.id;
  document.getElementById('upload-stiker-target-name').textContent = asset.name;
  document.getElementById('upload-stiker-target-code').textContent = asset.code;

  const previewImg = document.getElementById('preview-img-stiker-bukti');
  const placeholder = document.getElementById('placeholder-stiker-bukti');
  const existingPhoto = asset.imageDusSticker || asset.imageSticker || '';

  tempStikerBuktiDataUrl = existingPhoto;

  if (existingPhoto) {
    if (previewImg) {
      previewImg.src = existingPhoto;
      previewImg.classList.remove('hidden');
    }
    if (placeholder) placeholder.classList.add('hidden');
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.classList.add('hidden');
    }
    if (placeholder) placeholder.classList.remove('hidden');
  }

  openModal('modal-upload-stiker-bukti');
}

function previewStikerBuktiImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    tempStikerBuktiDataUrl = e.target.result;
    const previewImg = document.getElementById('preview-img-stiker-bukti');
    const placeholder = document.getElementById('placeholder-stiker-bukti');
    if (previewImg) {
      previewImg.src = tempStikerBuktiDataUrl;
      previewImg.classList.remove('hidden');
    }
    if (placeholder) placeholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

function saveStikerBuktiPhoto() {
  const assetId = document.getElementById('upload-stiker-target-asset-id').value;
  const asset = db.getAssetById(assetId);
  if (!asset) return;

  if (!tempStikerBuktiDataUrl) {
    showToast('Silakan pilih atau ambil foto stiker terlebih dahulu.', 'warning');
    return;
  }

  asset.imageDusSticker = tempStikerBuktiDataUrl;
  asset.imageSticker = tempStikerBuktiDataUrl;
  asset.isStickerAttached = true;
  asset.stickerDate = new Date().toISOString().split('T')[0];
  
  db.updateAsset(asset);

  if (typeof confetti === 'function') {
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  }

  showToast(`✅ Foto bukti stiker terpasang untuk "${asset.name}" berhasil disimpan!`, 'success');
  closeModal('modal-upload-stiker-bukti');
  renderStickerCenter();
}

function renderStickerCenter() {
  const assets = getActiveStickerAssets();
  const settings = db.getSettings();
  const rooms = db.getRooms();

  const countStat = document.getElementById('stiker-stat-count');
  const pagesStat = document.getElementById('stiker-stat-pages');
  const scopeStat = document.getElementById('stiker-stat-scope');
  const layoutStat = document.getElementById('stiker-stat-layout');

  const perPage = stickerState.layout === '3col' ? 15 : 10;
  const estimatedPages = Math.ceil(assets.length / perPage) || 0;

  if (countStat) countStat.textContent = `${assets.length}`;
  if (pagesStat) pagesStat.textContent = `${estimatedPages} Lembar`;

  if (scopeStat) {
    if (stickerState.scope === 'all') {
      scopeStat.textContent = 'Semua Aset Aktif';
    } else if (stickerState.scope === 'room') {
      const roomSelect = document.getElementById('stiker-select-room');
      const roomText = roomSelect && roomSelect.selectedIndex >= 0 ? roomSelect.options[roomSelect.selectedIndex].text : 'Ruangan';
      scopeStat.textContent = roomText;
    } else if (stickerState.scope === 'category') {
      const catSelect = document.getElementById('stiker-select-cat');
      const catText = catSelect && catSelect.selectedIndex >= 0 ? catSelect.options[catSelect.selectedIndex].text : 'Kategori';
      scopeStat.textContent = catText;
    } else if (stickerState.scope === 'manual') {
      scopeStat.textContent = `Pilihan Manual (${stickerState.selectedAssetIds.size} dipilih)`;
    }
  }

  const manualBadgeText = document.getElementById('stiker-manual-counter-badge');
  if (manualBadgeText) {
    manualBadgeText.textContent = `${stickerState.selectedAssetIds.size} Aset Dipilih`;
  }

  if (layoutStat) {
    layoutStat.textContent = stickerState.layout === '3col' ? '3 Kolom (Kompak)' : '2 Kolom (Standar)';
  }

  const container = document.getElementById('stiker-center-preview');
  if (!container) return;

  if (stickerState.layout === '3col') {
    container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-6 bg-slate-100/70 dark:bg-[#07090e] rounded-2xl border border-slate-200 dark:border-slate-800/80 min-h-[220px]';
  } else {
    container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 p-4 sm:p-6 bg-slate-100/70 dark:bg-[#07090e] rounded-2xl border border-slate-200 dark:border-slate-800/80 min-h-[220px]';
  }

  if (assets.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <i data-lucide="tag" class="w-6 h-6"></i>
        </div>
        <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada aset dalam filter ini</p>
        <p class="text-xs text-slate-400">Silakan ubah cakupan filter di atas atau centang aset yang ingin dicetak.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const showLogo = document.getElementById('stiker-opt-logo')?.checked ?? true;
  const showPhoto = document.getElementById('stiker-opt-photo')?.checked ?? false;
  const showRoom = document.getElementById('stiker-opt-room')?.checked ?? true;
  const showInfo = document.getElementById('stiker-opt-info')?.checked ?? true;
  const selectedDivId = document.getElementById('stiker-select-divisi')?.value || 'auto_room';

  container.innerHTML = assets.map((a, idx) => {
    const qrId = `stk-prev-${a.id}-${idx}`;
    setTimeout(() => {
      QREngine.generateQR(qrId, a.code, stickerState.layout === '3col' ? 64 : 76);
    }, 40);

    const branding = resolveAssetDivisionAndLogo(a, selectedDivId, settings, rooms);

    return `
      <div class="relative bg-white dark:bg-[#111420] p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 shadow-sm transition-all flex flex-col justify-between group">
        <div class="flex items-center gap-3.5">
          <!-- QR Code Container -->
          <div id="${qrId}" class="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] bg-white p-1 rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-inner"></div>

          ${showPhoto && (a.imageFront || a.image) ? `
            <div class="w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 shadow-sm">
              <img src="${a.imageFront || a.image}" alt="${a.name}" class="w-full h-full object-cover">
            </div>
          ` : ''}

          <!-- Info details -->
          <div class="flex-1 min-w-0 font-sans">
            <div class="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">
              ${showLogo ? `<img src="${branding.logo}" alt="Logo" class="w-4 h-4 object-contain flex-shrink-0 filter drop-shadow">` : ''}
              <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate" title="${branding.name}">
                ${branding.name}
              </span>
            </div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-tight" title="${a.name}">
              ${a.name}
            </h4>
            <div class="font-mono text-[11px] sm:text-xs font-black text-amber-600 dark:text-amber-400 tracking-wide mt-0.5">
              ${a.code}
            </div>
            ${showRoom ? `
              <div class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5 flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3 h-3 text-slate-400 flex-shrink-0"></i> ${a.roomName || 'Tanpa Ruangan'}
              </div>
            ` : ''}
            ${showInfo ? `
              <div class="text-[9px] text-slate-400 mt-1 flex items-center gap-2">
                <span>Beli: ${a.date || '-'}</span>
                <span>•</span>
                <span class="${a.condition === 'Baik' ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}">${a.condition || 'Baik'}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Bottom Action Bar -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <div class="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Siap Cetak</span>
          </div>
          <div>
            <button onclick="printSingleSticker('${a.id}')" class="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors flex items-center gap-1.5 text-xs font-bold" title="Cetak Stiker Ini Saja">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i> Cetak Stiker
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function printStickerSheetCustom() {
  const assets = getActiveStickerAssets();
  if (assets.length === 0) {
    showToast('Tidak ada stiker dalam filter ini untuk dicetak.', 'warning');
    return;
  }

  const settings = db.getSettings();
  const rooms = db.getRooms();
  const is3Col = stickerState.layout === '3col';
  const showLogo = document.getElementById('stiker-opt-logo')?.checked ?? true;
  const showPhoto = document.getElementById('stiker-opt-photo')?.checked ?? false;
  const showRoom = document.getElementById('stiker-opt-room')?.checked ?? true;
  const showInfo = document.getElementById('stiker-opt-info')?.checked ?? true;
  const selectedDivId = document.getElementById('stiker-select-divisi')?.value || 'auto_room';

  let stickersHTML = '';
  assets.forEach(a => {
    const branding = resolveAssetDivisionAndLogo(a, selectedDivId, settings, rooms);

    stickersHTML += `
      <div class="sticker-card" style="border: 1.5px solid #0f172a; border-radius: 8px; padding: ${is3Col ? '6px 8px' : '8px 10px'}; display: flex; align-items: center; gap: ${is3Col ? '8px' : '10px'}; page-break-inside: avoid; background: #ffffff; box-sizing: border-box;">
        <div id="print-qr-${a.id}" style="width: ${is3Col ? '54px' : '64px'}; height: ${is3Col ? '54px' : '64px'}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #fff;"></div>
        
        ${showPhoto && (a.imageFront || a.image) ? `
          <img src="${a.imageFront || a.image}" alt="${a.name}" style="width: ${is3Col ? '44px' : '52px'}; height: ${is3Col ? '44px' : '52px'}; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; flex-shrink: 0;">
        ` : ''}

        <div style="flex: 1; min-width: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; align-items: center; gap: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            ${showLogo ? `<img src="${branding.logo}" alt="Logo" style="width: 12px; height: 12px; object-fit: contain; flex-shrink: 0;">` : ''}
            <div style="font-size: ${is3Col ? '6.5pt' : '7.5pt'}; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${branding.name}
            </div>
          </div>
          <div style="font-size: ${is3Col ? '8pt' : '9pt'}; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${a.name}
          </div>
          <div style="font-size: ${is3Col ? '7.5pt' : '8.5pt'}; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; color: #d97706; letter-spacing: 0.5px;">
            ${a.code}
          </div>
          ${showRoom ? `<div style="font-size: ${is3Col ? '6.5pt' : '7.5pt'}; color: #475569; font-weight: 600; margin-top: 1px;">Ruang: ${a.roomName || '-'}</div>` : ''}
          ${showInfo ? `<div style="font-size: 6pt; color: #64748b; margin-top: 1px;">Tgl: ${a.date || '-'} | Kondisi: ${a.condition || 'Baik'}</div>` : ''}
        </div>
      </div>
    `;
  });

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lembar Stiker QR Aset - ${settings.instansiName || 'Inventaris'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 6mm;
        }
        body { 
          margin: 6mm; 
          font-family: sans-serif; 
          background: #fff; 
          color: #000;
        }
        .header-print {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 6px;
          margin-bottom: 12px;
        }
        .header-title {
          font-size: 11pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-meta {
          font-size: 8pt;
          color: #64748b;
        }
        .sticker-grid { 
          display: grid; 
          grid-template-columns: ${is3Col ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'}; 
          gap: ${is3Col ? '8px' : '10px'}; 
        }
        @media print {
          body { margin: 4mm; }
          .header-print { display: none; }
          .sticker-grid { 
            grid-template-columns: ${is3Col ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'}; 
            gap: ${is3Col ? '6px' : '8px'}; 
          }
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
    </head>
    <body>
      <div class="header-print">
        <div>
          <div class="header-title">LEMBAR STIKERISASI QR CODE ASET</div>
          <div class="header-meta">${settings.instansiName || 'Inventaris'} • Total ${assets.length} Label Stiker</div>
        </div>
        <div style="font-size: 8pt; text-align: right; color: #475569;">
          Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div class="sticker-grid">
        ${stickersHTML}
      </div>

      <script>
        window.onload = function() {
          ${assets.map(a => `
            new QRCode(document.getElementById('print-qr-${a.id}'), {
              text: "${a.code}",
              width: ${is3Col ? 54 : 64},
              height: ${is3Col ? 54 : 64},
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.M
            });
          `).join('')}
          setTimeout(function() {
            window.print();
          }, 450);
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Download Lembar Stiker Langsung sebagai File PDF
 */
async function downloadStickerSheetPDF() {
  const assets = getActiveStickerAssets();
  if (assets.length === 0) {
    showToast('Tidak ada stiker dalam filter ini untuk diunduh.', 'warning');
    return;
  }

  showToast('⏳ Sedang menyusun file PDF Lembar Stiker QR...', 'info');

  const settings = db.getSettings();
  const rooms = db.getRooms();
  const is3Col = stickerState.layout === '3col';
  const showLogo = document.getElementById('stiker-opt-logo')?.checked ?? true;
  const showRoom = document.getElementById('stiker-opt-room')?.checked ?? true;
  const showInfo = document.getElementById('stiker-opt-info')?.checked ?? true;
  const selectedDivId = document.getElementById('stiker-select-divisi')?.value || 'auto_room';

  const divTitle = (selectedDivId && selectedDivId !== 'auto_room' && selectedDivId !== 'lembaga') 
    ? (db.getDivisionById(selectedDivId)?.name || 'Divisi') 
    : (settings.instansiName || 'Inventaris');

  // Create temporary offscreen container for PDF rendering
  const tempWrapper = document.createElement('div');
  tempWrapper.style.position = 'absolute';
  tempWrapper.style.left = '-9999px';
  tempWrapper.style.top = '0';
  tempWrapper.style.width = '794px'; // Standard A4 width in 96dpi
  tempWrapper.style.padding = '24px';
  tempWrapper.style.background = '#ffffff';
  tempWrapper.style.color = '#000000';
  tempWrapper.style.fontFamily = 'Arial, sans-serif';
  tempWrapper.style.boxSizing = 'border-box';

  let stickersHTML = '';
  assets.forEach((a, idx) => {
    const branding = resolveAssetDivisionAndLogo(a, selectedDivId, settings, rooms);
    const qrDivId = `pdf-qr-box-${a.id}-${idx}`;

    stickersHTML += `
      <div style="border: 1.5px solid #0f172a; border-radius: 8px; padding: ${is3Col ? '6px 8px' : '8px 10px'}; display: flex; align-items: center; gap: ${is3Col ? '8px' : '10px'}; page-break-inside: avoid; background: #ffffff; box-sizing: border-box;">
        <div id="${qrDivId}" style="width: ${is3Col ? '54px' : '64px'}; height: ${is3Col ? '54px' : '64px'}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #fff;"></div>
        
        <div style="flex: 1; min-width: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; align-items: center; gap: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            ${showLogo && branding.logo ? `<img src="${branding.logo}" alt="Logo" style="width: ${is3Col ? '13px' : '15px'}; height: ${is3Col ? '13px' : '15px'}; object-fit: contain; flex-shrink: 0;">` : ''}
            <div style="font-size: ${is3Col ? '6.5pt' : '7.5pt'}; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${branding.name}
            </div>
          </div>
          <div style="font-size: ${is3Col ? '8pt' : '9pt'}; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${a.name}
          </div>
          <div style="font-size: ${is3Col ? '7.5pt' : '8.5pt'}; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; color: #d97706; letter-spacing: 0.5px;">
            ${a.code}
          </div>
          ${showRoom ? `<div style="font-size: ${is3Col ? '6.5pt' : '7.5pt'}; color: #475569; font-weight: 600; margin-top: 1px;">Ruang: ${a.roomName || '-'}</div>` : ''}
          ${showInfo ? `<div style="font-size: 6pt; color: #64748b; margin-top: 1px;">Tgl: ${a.date || '-'} | Kondisi: ${a.condition || 'Baik'}</div>` : ''}
        </div>
      </div>
    `;
  });

  tempWrapper.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px;">
      <div>
        <div style="font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">LEMBAR STIKERISASI QR CODE ASET</div>
        <div style="font-size: 8pt; color: #475569;">${divTitle} • Total ${assets.length} Label Stiker</div>
      </div>
      <div style="font-size: 8pt; text-align: right; color: #475569;">
        Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </div>
    <div style="display: grid; grid-template-columns: ${is3Col ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'}; gap: ${is3Col ? '8px' : '10px'};">
      ${stickersHTML}
    </div>
  `;

  document.body.appendChild(tempWrapper);

  // Generate QR codes inside tempWrapper
  assets.forEach((a, idx) => {
    const qrElem = document.getElementById(`pdf-qr-box-${a.id}-${idx}`);
    if (qrElem) {
      new QRCode(qrElem, {
        text: a.code,
        width: is3Col ? 54 : 64,
        height: is3Col ? 54 : 64,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  });

  setTimeout(() => {
    const cleanFilename = `Lembar_Stiker_QR_${divTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: [8, 8, 8, 8],
        filename: cleanFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(tempWrapper).save().then(() => {
        if (tempWrapper.parentNode) tempWrapper.parentNode.removeChild(tempWrapper);
        showToast('✅ Berhasil mengunduh File PDF Lembar Stiker QR!', 'success');
      }).catch(err => {
        console.error('HTML2PDF error', err);
        if (tempWrapper.parentNode) tempWrapper.parentNode.removeChild(tempWrapper);
        printStickerSheetCustom();
      });
    } else {
      if (tempWrapper.parentNode) tempWrapper.parentNode.removeChild(tempWrapper);
      printStickerSheetCustom();
    }
  }, 450);
}

function downloadStickerSheetHTML() {
  const assets = getActiveStickerAssets();
  if (assets.length === 0) {
    showToast('Tidak ada stiker untuk di-download.', 'warning');
    return;
  }

  const settings = db.getSettings();
  const rooms = db.getRooms();
  const is3Col = stickerState.layout === '3col';
  const showLogo = document.getElementById('stiker-opt-logo')?.checked ?? true;
  const showPhoto = document.getElementById('stiker-opt-photo')?.checked ?? false;
  const showRoom = document.getElementById('stiker-opt-room')?.checked ?? true;
  const showInfo = document.getElementById('stiker-opt-info')?.checked ?? true;
  const selectedDivId = document.getElementById('stiker-select-divisi')?.value || 'auto_room';

  let stickersHTML = '';
  assets.forEach(a => {
    const branding = resolveAssetDivisionAndLogo(a, selectedDivId, settings, rooms);

    stickersHTML += `
      <div class="sticker-card" style="border: 1.5px solid #0f172a; border-radius: 8px; padding: ${is3Col ? '6px 8px' : '8px 10px'}; display: flex; align-items: center; gap: ${is3Col ? '8px' : '10px'}; page-break-inside: avoid; background: #ffffff; box-sizing: border-box;">
        <div id="print-qr-${a.id}" style="width: ${is3Col ? '54px' : '64px'}; height: ${is3Col ? '54px' : '64px'}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #fff;"></div>
        
        ${showPhoto && (a.imageFront || a.image) ? `
          <img src="${a.imageFront || a.image}" alt="${a.name}" style="width: ${is3Col ? '44px' : '52px'}; height: ${is3Col ? '44px' : '52px'}; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; flex-shrink: 0;">
        ` : ''}

        <div style="flex: 1; min-width: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; align-items: center; gap: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            ${showLogo ? `<img src="${branding.logo}" alt="Logo" style="width: 12px; height: 12px; object-fit: contain; flex-shrink: 0;">` : ''}
            <div style="font-size: ${is3Col ? '6.5pt' : '7.5pt'}; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${branding.name}
            </div>
          </div>
          <div style="font-size: ${is3Col ? '8pt' : '9pt'}; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${a.name}
          </div>
          <div style="font-size: ${is3Col ? '7.5pt' : '8.5pt'}; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; color: #d97706; letter-spacing: 0.5px;">
            ${a.code}
          </div>
          ${showRoom ? `<div style="font-size: ${is3Col ? '6.5pt' : '7.5pt'}; color: #475569; font-weight: 600; margin-top: 1px;">Ruang: ${a.roomName || '-'}</div>` : ''}
          ${showInfo ? `<div style="font-size: 6pt; color: #64748b; margin-top: 1px;">Tgl: ${a.date || '-'} | Kondisi: ${a.condition || 'Baik'}</div>` : ''}
        </div>
      </div>
    `;
  });

  const fullHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Lembar Stiker QR Aset - ${settings.instansiName || 'Inventaris'}</title>
  <style>
    @page { size: A4 portrait; margin: 6mm; }
    body { margin: 6mm; font-family: sans-serif; background: #fff; color: #000; }
    .header-print { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px; }
    .header-title { font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .header-meta { font-size: 8pt; color: #64748b; }
    .sticker-grid { display: grid; grid-template-columns: ${is3Col ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'}; gap: ${is3Col ? '8px' : '10px'}; }
    .print-bar { background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
    .btn-print { background: #f59e0b; color: #000; font-weight: bold; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
    @media print {
      body { margin: 4mm; }
      .header-print, .print-bar { display: none !important; }
      .sticker-grid { grid-template-columns: ${is3Col ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'}; gap: ${is3Col ? '6px' : '8px'}; }
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
</head>
<body>
  <div class="print-bar">
    <span>💡 File Stiker QR Siap Cetak (Offline). Klik tombol untuk mencetak ke printer / simpan PDF.</span>
    <button class="btn-print" onclick="window.print()">🖨️ Cetak Lembar Stiker</button>
  </div>

  <div class="header-print">
    <div>
      <div class="header-title">LEMBAR STIKERISASI QR CODE ASET</div>
      <div class="header-meta">${settings.instansiName || 'Inventaris'} • Total ${assets.length} Label Stiker</div>
    </div>
    <div style="font-size: 8pt; text-align: right; color: #475569;">
      Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
    </div>
  </div>

  <div class="sticker-grid">
    ${stickersHTML}
  </div>

  <script>
    window.onload = function() {
      ${assets.map(a => `
        new QRCode(document.getElementById('print-qr-${a.id}'), {
          text: "${a.code}",
          width: ${is3Col ? 54 : 64},
          height: ${is3Col ? 54 : 64},
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      `).join('')}
    };
  <\/script>
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `stiker-qr-aset-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('✅ Berhasil mendownload file lembar stiker HTML!', 'success');
}

function navigateToStikerWithRoom(roomId) {
  navigateTo('stiker');
  setTimeout(() => {
    setStickerScope('room');
    const select = document.getElementById('stiker-select-room');
    if (select) {
      select.value = roomId;
      renderStickerCenter();
    }
  }, 100);
}

/**
 * ========================================================
 * 13. SECTION 5: PENGHAPUSAN ASET (WORKFLOW PERMOHONAN & APPROVAL)
 * ========================================================
 */
let disposalActiveTab = 'requests'; // 'requests' | 'history' | 'damaged'
let currentDisposalPhotos = [];
let currentDamagePhotos = [];
let currentDamageDoc = null;

function initDisposalPage() {
  populateDamagedDropdowns();
  updateDisposalMetrics();
  if (disposalActiveTab === 'requests') {
    renderDisposalRequestsTable();
  } else if (disposalActiveTab === 'history') {
    renderDisposalTable();
  } else if (disposalActiveTab === 'damaged') {
    renderDamagedTable();
  }
}

function switchDisposalTab(tab) {
  disposalActiveTab = tab;
  const btnReq = document.getElementById('tab-btn-disp-requests');
  const btnHist = document.getElementById('tab-btn-disp-history');
  const btnDamaged = document.getElementById('tab-btn-disp-damaged');
  const contentReq = document.getElementById('disp-tab-content-requests');
  const contentHist = document.getElementById('disp-tab-content-history');
  const contentDamaged = document.getElementById('disp-tab-content-damaged');

  // Reset tabs styling
  if (btnReq) btnReq.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-xl border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all';
  if (btnHist) btnHist.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-xl border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all';
  if (btnDamaged) btnDamaged.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-xl border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all';

  if (contentReq) contentReq.classList.add('hidden');
  if (contentHist) contentHist.classList.add('hidden');
  if (contentDamaged) contentDamaged.classList.add('hidden');

  if (tab === 'requests') {
    if (btnReq) btnReq.className = 'tab-btn active px-4 py-2 text-xs font-bold rounded-xl border border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-2';
    if (contentReq) contentReq.classList.remove('hidden');
    renderDisposalRequestsTable();
  } else if (tab === 'history') {
    if (btnHist) btnHist.className = 'tab-btn active px-4 py-2 text-xs font-bold rounded-xl border border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2';
    if (contentHist) contentHist.classList.remove('hidden');
    renderDisposalTable();
  } else if (tab === 'damaged') {
    if (btnDamaged) btnDamaged.className = 'tab-btn active px-4 py-2 text-xs font-bold rounded-xl border border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-2';
    if (contentDamaged) contentDamaged.classList.remove('hidden');
    populateDamagedDropdowns();
    renderDamagedTable();
  }
}

function updateDisposalMetrics() {
  const requests = db.getDisposalRequests();
  const disposals = db.getDisposals();
  const damagedItems = db.getDamagedItems();

  const pendingCount = requests.filter(r => r.status === 'Menunggu Persetujuan').length;
  const approvedCount = disposals.length;
  const rejectedCount = requests.filter(r => r.status === 'Ditolak').length;
  const damagedCount = damagedItems.length;

  let totalNominal = 0;
  disposals.forEach(d => totalNominal += (parseFloat(d.price) || 0));

  const statPending = document.getElementById('stat-disp-pending');
  const statApproved = document.getElementById('stat-disp-approved');
  const statRejected = document.getElementById('stat-disp-rejected');
  const statNominal = document.getElementById('disposal-stat-nominal');
  const statCount = document.getElementById('disposal-stat-count');
  const statDamaged = document.getElementById('stat-disp-damaged');
  const badgeReq = document.getElementById('badge-disp-req-count');
  const badgeHist = document.getElementById('badge-disp-hist-count');
  const badgeDamaged = document.getElementById('badge-disp-damaged-count');

  if (statDamaged) statDamaged.textContent = `${damagedCount} Unit`;
  if (statPending) statPending.textContent = `${pendingCount} Unit`;
  if (statApproved) statApproved.textContent = `${approvedCount} Unit`;
  if (statRejected) statRejected.textContent = `${rejectedCount} Unit`;
  if (statNominal) statNominal.textContent = DepreciationEngine.formatRupiah(totalNominal);
  if (statCount) statCount.textContent = `${approvedCount} Unit Dihapuskan`;
  if (badgeReq) badgeReq.textContent = requests.length;
  if (badgeHist) badgeHist.textContent = approvedCount;
  if (badgeDamaged) badgeDamaged.textContent = damagedCount;
}

function filterDisposalRequestsByStatus(status) {
  const select = document.getElementById('filter-disp-req-status');
  if (select) select.value = status;
  renderDisposalRequestsTable();
}

function renderDisposalRequestsTable() {
  const requests = db.getDisposalRequests();
  const tbody = document.getElementById('disposal-requests-table-body');
  const emptyState = document.getElementById('disposal-requests-empty');
  const searchQuery = (document.getElementById('filter-disp-req-search')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('filter-disp-req-status')?.value || '';

  updateDisposalMetrics();
  if (!tbody) return;

  let filtered = requests;
  if (searchQuery) {
    filtered = filtered.filter(r => 
      (r.assetName || '').toLowerCase().includes(searchQuery) ||
      (r.assetCode || '').toLowerCase().includes(searchQuery) ||
      (r.proposedBy || '').toLowerCase().includes(searchQuery) ||
      (r.roomName || '').toLowerCase().includes(searchQuery)
    );
  }
  if (statusFilter) {
    filtered = filtered.filter(r => r.status === statusFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map(r => {
    let statusBadge = '<span class="badge badge-warning">⏳ Menunggu Review</span>';
    if (r.status === 'Disetujui') statusBadge = '<span class="badge badge-success">✅ Disetujui</span>';
    if (r.status === 'Ditolak') statusBadge = '<span class="badge badge-danger">❌ Ditolak</span>';

    const hasPhoto = r.photos && r.photos.length > 0;
    const hasDoc = !!r.suratDoc;
    const photoThumb = hasPhoto ? `
      <div class="relative group cursor-pointer inline-block" onclick="openModalDetailDisposalRequest('${r.id}')" title="Klik untuk lihat foto bukti">
        <img src="${r.photos[0]}" class="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs hover:scale-105 transition-transform">
        ${r.photos.length > 1 ? `<span class="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-bold px-1 rounded-full">+${r.photos.length - 1}</span>` : ''}
      </div>
    ` : `<span class="text-[11px] text-slate-400 italic">Tanpa foto</span>`;

    const docBadge = hasDoc ? `
      <button type="button" onclick="previewDisposalReqDoc('${r.id}')" class="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold hover:bg-blue-500/20" title="Buka Surat Usulan">
        <i data-lucide="file-text" class="w-3 h-3"></i> Surat Divisi
      </button>
    ` : '';

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-semibold">${r.date || '-'}</td>
        <td class="px-4 py-3">
          <div class="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">${r.assetCode}</div>
          <div class="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">${r.assetName}</div>
        </td>
        <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">${r.roomName || '-'}</td>
        <td class="px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400 max-w-[150px] truncate" title="${r.reason}">
          ${r.reason}
        </td>
        <td class="px-4 py-3">
          ${photoThumb}
          ${docBadge}
        </td>
        <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 font-medium">${r.proposedBy || '-'}</td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openModalDetailDisposalRequest('${r.id}')" class="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Lihat Berkas Usulan">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            ${r.status === 'Menunggu Persetujuan' ? `
              <button onclick="openModalApproveDisposal('${r.id}')" class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Setujui (Approve)">
                <i data-lucide="check" class="w-4 h-4"></i>
              </button>
              <button onclick="openModalRejectDisposal('${r.id}')" class="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors" title="Tolak Usulan">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            ` : (r.status === 'Disetujui' ? `
              <button onclick="printSingleDisposalBAByRequestId('${r.id}')" class="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-500/10 rounded-lg transition-colors" title="Cetak Berita Acara">
                <i data-lucide="printer" class="w-4 h-4"></i>
              </button>
            ` : '')}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function renderDisposalTable() {
  const disposals = db.getDisposals();
  const tbody = document.getElementById('disposal-table-body');
  const emptyState = document.getElementById('disposal-empty-state');

  updateDisposalMetrics();
  if (!tbody) return;

  if (disposals.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = disposals.map(d => `
    <tr class="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
      <td class="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">${d.date || '-'}</td>
      <td class="px-4 py-3 font-mono font-bold text-xs text-rose-500">${d.docNo || '-'}</td>
      <td class="px-4 py-3">
        <div class="font-mono text-[11px] text-slate-400">${d.assetCode}</div>
        <div class="font-bold text-slate-900 dark:text-slate-100 text-xs">${d.assetName}</div>
      </td>
      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">${d.roomName || '-'}</td>
      <td class="px-4 py-3 text-xs"><span class="badge badge-danger">${d.reason}</span></td>
      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
        <strong>${d.approvedBy || '-'}</strong>
        ${d.witnessName ? `<br><span class="text-[10px] text-slate-400">Saksi: ${d.witnessName}</span>` : ''}
      </td>
      <td class="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">${DepreciationEngine.formatRupiah(d.price)}</td>
      <td class="px-4 py-3 text-center">
        <button onclick="printSingleDisposalBAById('${d.id}')" class="btn-secondary text-[11px] py-1 px-2.5 hover:border-rose-500 hover:text-rose-500 font-bold" title="Cetak Format Berita Acara Resmi">
          <i data-lucide="printer" class="w-3.5 h-3.5 text-rose-500"></i> Cetak BA
        </button>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

/**
 * Open Modal Form Ajukan Penghapusan Aset
 */
function openModalAjukanPenghapusan(preselectedAssetId = null) {
  const assets = db.getAssets().filter(a => a.status !== 'Dihapuskan');
  const select = document.getElementById('req-disp-asset-select');
  if (!select) return;

  currentDisposalPhotos = [];
  currentDisposalDoc = null;

  const docInput = document.getElementById('req-disp-doc-input');
  if (docInput) docInput.value = '';

  select.innerHTML = '<option value="">-- Pilih Barang Aktif --</option>' + 
    assets.map(a => `<option value="${a.id}">${a.name} (${a.code}) - ${a.roomName || 'Tanpa Ruangan'}</option>`).join('');

  document.getElementById('req-disp-id').value = '';
  document.getElementById('req-disp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('req-disp-reason').value = 'Rusak Berat / Rusak Total';
  
  const settings = db.getSettings();
  document.getElementById('req-disp-proposer').value = settings.assetOfficerName || '';
  document.getElementById('req-disp-docno').value = `USL.${Math.floor(10 + Math.random() * 90)}/SARPRAS/${new Date().getFullYear()}`;
  document.getElementById('req-disp-notes').value = '';

  if (preselectedAssetId) {
    select.value = preselectedAssetId;
    const report = db.getDamageReportByAssetId(preselectedAssetId);
    if (report) {
      if (report.docNo) document.getElementById('req-disp-docno').value = report.docNo;
      if (report.damageDescription) {
        document.getElementById('req-disp-notes').value = `[Lampiran Berita Acara Kerusakan: ${report.docNo}]\n${report.damageDescription}`;
      }
      if (report.severity === 'Rusak Berat') {
        document.getElementById('req-disp-reason').value = 'Rusak Berat / Rusak Total';
      }
      if (report.suratDoc) {
        currentDisposalDoc = report.suratDoc;
      }
      if (report.photos && report.photos.length > 0) {
        currentDisposalPhotos = [...report.photos];
      }
    }
  }

  renderDisposalPhotosPreview();
  renderDisposalDocPreview();
  onDisposalAssetSelected();

  openModal('modal-ajukan-penghapusan');
}

// Aliases for compatibility
function openModalDisposalAction(assetId) {
  openModalAjukanPenghapusan(assetId);
}

function onDisposalAssetSelected() {
  const assetId = document.getElementById('req-disp-asset-select')?.value;
  const previewBox = document.getElementById('req-disp-asset-preview');
  if (!assetId) {
    if (previewBox) previewBox.classList.add('hidden');
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) return;

  const calc = DepreciationEngine.calculateCurrentValue(asset);
  const codeLabel = document.getElementById('req-disp-code-label');
  const nameLabel = document.getElementById('req-disp-name-label');
  const roomLabel = document.getElementById('req-disp-room-label');
  const priceLabel = document.getElementById('req-disp-price-label');
  const bookLabel = document.getElementById('req-disp-book-label');

  if (codeLabel) codeLabel.textContent = asset.code;
  if (nameLabel) nameLabel.textContent = `${asset.name} ${asset.brand ? '(' + asset.brand + ')' : ''}`;
  if (roomLabel) roomLabel.textContent = asset.roomName || 'Tanpa Ruangan';
  if (priceLabel) priceLabel.textContent = DepreciationEngine.formatRupiah(asset.price);
  if (bookLabel) bookLabel.textContent = DepreciationEngine.formatRupiah(calc.bookValue);

  if (previewBox) previewBox.classList.remove('hidden');
}

let currentDisposalDoc = null; // { dataUrl, name, size, type }

function handleDisposalDocSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentDisposalDoc = {
      dataUrl: e.target.result,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
    };
    renderDisposalDocPreview();
  };
  reader.readAsDataURL(file);
}

function removeDisposalDoc() {
  currentDisposalDoc = null;
  const input = document.getElementById('req-disp-doc-input');
  if (input) input.value = '';
  renderDisposalDocPreview();
}

function previewSelectedDisposalDoc() {
  if (!currentDisposalDoc || !currentDisposalDoc.dataUrl) return;
  const isPdf = currentDisposalDoc.type.includes('pdf');
  openDisposalMediaViewer(currentDisposalDoc.dataUrl, currentDisposalDoc.name, isPdf, currentDisposalDoc.size);
}

function previewDisposalReqDoc(reqId) {
  const req = db.getDisposalRequestById(reqId);
  if (!req || !req.suratDoc || !req.suratDoc.dataUrl) {
    showToast('Berkas surat tidak ditemukan.', 'warning');
    return;
  }
  const isPdf = req.suratDoc.type && req.suratDoc.type.includes('pdf');
  openDisposalMediaViewer(req.suratDoc.dataUrl, req.suratDoc.name || 'Surat Usulan Divisi', isPdf, req.docProposalNo || req.assetCode);
}

function openDisposalMediaViewer(dataUrl, title = 'Pratinjau Dokumen', isPdf = false, subtitle = '') {
  const modal = document.getElementById('modal-disposal-media-viewer');
  const titleEl = document.getElementById('disp-media-title');
  const subEl = document.getElementById('disp-media-subtitle');
  const bodyEl = document.getElementById('disp-media-body');
  const btnExternal = document.getElementById('btn-disp-media-external');

  if (!modal || !bodyEl) return;

  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle || (isPdf ? 'Dokumen PDF Resmi' : 'Foto Bukti Fisik');

  if (isPdf) {
    bodyEl.innerHTML = `
      <div class="w-full h-full flex flex-col items-center">
        <iframe src="${dataUrl}" class="w-full h-[70vh] rounded-xl border border-slate-700 bg-white shadow-2xl"></iframe>
      </div>
    `;
  } else {
    bodyEl.innerHTML = `
      <div class="flex items-center justify-center p-2">
        <img src="${dataUrl}" class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl transition-transform hover:scale-[1.02]">
      </div>
    `;
  }

  if (btnExternal) {
    btnExternal.onclick = () => {
      const win = window.open();
      if (win) {
        if (isPdf) {
          win.document.write(`<iframe src="${dataUrl}" style="width:100vw;height:100vh;border:none;margin:0;padding:0;"></iframe>`);
        } else {
          win.document.write(`<div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a;margin:0;"><img src="${dataUrl}" style="max-width:95%;max-height:95vh;object-fit:contain;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.5);"></div>`);
        }
      }
    };
  }

  openModal('modal-disposal-media-viewer');
}

function renderDisposalDocPreview() {
  const previewBox = document.getElementById('req-disp-doc-preview');
  if (!previewBox) return;

  if (!currentDisposalDoc) {
    previewBox.classList.add('hidden');
    return;
  }

  previewBox.classList.remove('hidden');
  const nameEl = document.getElementById('req-disp-doc-name');
  const sizeEl = document.getElementById('req-disp-doc-size');
  if (nameEl) nameEl.textContent = currentDisposalDoc.name;
  if (sizeEl) sizeEl.textContent = currentDisposalDoc.size;

  if (window.lucide) lucide.createIcons();
}

function handleDisposalPhotoSelect(event) {
  const files = Array.from(event.target.files);
  if (!files || files.length === 0) return;

  const remainingSlots = 3 - currentDisposalPhotos.length;
  const filesToRead = files.slice(0, remainingSlots);

  filesToRead.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (currentDisposalPhotos.length < 3) {
        currentDisposalPhotos.push(e.target.result);
        renderDisposalPhotosPreview();
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeDisposalPhoto(index) {
  currentDisposalPhotos.splice(index, 1);
  renderDisposalPhotosPreview();
}

function renderDisposalPhotosPreview() {
  const container = document.getElementById('req-disp-photos-preview');
  if (!container) return;

  if (currentDisposalPhotos.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = currentDisposalPhotos.map((src, idx) => `
    <div class="relative w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs group">
      <img src="${src}" class="w-full h-full object-cover">
      <button type="button" onclick="removeDisposalPhoto(${idx})" class="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 shadow-sm" title="Hapus foto">
        <i data-lucide="x" class="w-3 h-3"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function handleSubmitDisposalRequest(event) {
  event.preventDefault();

  const assetId = document.getElementById('req-disp-asset-select').value;
  const asset = db.getAssetById(assetId);
  if (!asset) {
    showToast('⚠️ Silakan pilih barang inventaris terlebih dahulu.', 'warning');
    return;
  }

  // 1. Validasi Wajib: Upload Surat Usulan dari Divisi
  if (!currentDisposalDoc || !currentDisposalDoc.dataUrl) {
    showToast('⚠️ Mohon upload file Surat Usulan / Memo dari Divisi (PDF/Foto) terlebih dahulu.', 'warning');
    const docInput = document.getElementById('req-disp-doc-input');
    if (docInput) {
      docInput.focus();
      docInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // 2. Validasi Wajib: Lampiran Foto Bukti Fisik Kerusakan (Min 1 Foto)
  if (!currentDisposalPhotos || currentDisposalPhotos.length === 0) {
    showToast('⚠️ Mohon lampirkan minimal 1 Foto Bukti Fisik Kerusakan Barang.', 'warning');
    const photoInput = document.getElementById('req-disp-photo-input');
    if (photoInput) {
      photoInput.focus();
      photoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  const calc = DepreciationEngine.calculateCurrentValue(asset);
  const date = document.getElementById('req-disp-date').value;
  const reason = document.getElementById('req-disp-reason').value;
  const proposedBy = document.getElementById('req-disp-proposer').value.trim();
  const docProposalNo = document.getElementById('req-disp-docno').value.trim();
  const notes = document.getElementById('req-disp-notes').value.trim();

  const request = {
    id: `REQ-DISP-${Date.now()}`,
    assetId: asset.id,
    assetCode: asset.code,
    assetName: asset.name,
    categoryName: asset.categoryName || '-',
    roomName: asset.roomName || '-',
    brand: asset.brand || '-',
    serial: asset.serial || '-',
    price: parseFloat(asset.price) || 0,
    bookValue: parseFloat(calc.bookValue) || 0,
    date,
    reason,
    proposedBy,
    docProposalNo,
    notes,
    suratDoc: currentDisposalDoc ? { ...currentDisposalDoc } : null,
    photos: [...currentDisposalPhotos],
    status: 'Menunggu Persetujuan',
    createdAt: new Date().toISOString()
  };

  db.saveDisposalRequest(request);
  closeModal('modal-ajukan-penghapusan');

  showToast(`✅ Permohonan penghapusan "${asset.name}" berhasil diajukan! Menunggu review pimpinan.`, 'success');
  
  if (typeof confetti === 'function') {
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
  }

  renderDisposalRequestsTable();
  renderAssetTable();
  renderDashboard();
}

function openModalDetailDisposalRequest(requestId) {
  const req = db.getDisposalRequestById(requestId);
  if (!req) return;

  const idLabel = document.getElementById('detail-disp-req-id-label');
  if (idLabel) idLabel.textContent = `ID Usulan: ${req.id} • Tgl: ${req.date}`;

  const container = document.getElementById('detail-disp-req-content');
  if (!container) return;

  let statusBadge = '<span class="badge badge-warning">⏳ Menunggu Persetujuan Pimpinan</span>';
  if (req.status === 'Disetujui') statusBadge = '<span class="badge badge-success">✅ Disetujui (Berita Acara Terbit)</span>';
  if (req.status === 'Ditolak') statusBadge = '<span class="badge badge-danger">❌ Ditolak</span>';

  container.innerHTML = `
    <!-- Top Status Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
      <div>
        <span class="text-slate-400 block text-[10px]">Status Usulan:</span>
        <div class="mt-0.5">${statusBadge}</div>
      </div>
      <div class="text-right">
        <span class="text-slate-400 block text-[10px]">Petugas Pengusul:</span>
        <strong class="text-slate-800 dark:text-slate-200 font-bold">${req.proposedBy || '-'}</strong>
      </div>
    </div>

    <!-- Asset Passport Info -->
    <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <span class="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">${req.assetCode}</span>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">${req.assetName}</h4>
        </div>
        <span class="badge badge-info">${req.roomName || '-'}</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div class="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <span class="text-slate-400 block">Kategori:</span>
          <strong class="text-slate-800 dark:text-slate-200 truncate block mt-0.5">${req.categoryName || '-'}</strong>
        </div>
        <div class="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <span class="text-slate-400 block">Merek / Seri:</span>
          <strong class="text-slate-800 dark:text-slate-200 truncate block mt-0.5">${req.brand || '-'}</strong>
        </div>
        <div class="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <span class="text-slate-400 block">Harga Perolehan:</span>
          <strong class="text-slate-800 dark:text-slate-200 truncate block mt-0.5">${DepreciationEngine.formatRupiah(req.price || 0)}</strong>
        </div>
        <div class="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <span class="text-slate-400 block">Nilai Buku Saat Ini:</span>
          <strong class="text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">${DepreciationEngine.formatRupiah(req.bookValue || 0)}</strong>
        </div>
      </div>
    </div>

    <!-- Reason & Technical Notes -->
    <div class="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800/50 space-y-2">
      <div class="flex items-center justify-between text-rose-900 dark:text-rose-200">
        <strong>Alasan Penghapusan:</strong>
        <span class="badge badge-danger">${req.reason}</span>
      </div>
      ${req.docProposalNo ? `<p class="text-[11px] text-rose-800/80 dark:text-rose-300/80">No. Surat Usulan: <strong>${req.docProposalNo}</strong></p>` : ''}
      <div class="pt-1 text-slate-700 dark:text-slate-300">
        <span class="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Kronologi / Penjelasan Teknis:</span>
        <p class="italic bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/50">${req.notes || '-'}</p>
      </div>
    </div>

    <!-- Surat Usulan Resmi Divisi -->
    ${req.suratDoc ? `
      <div class="p-3.5 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-3">
        <div class="flex items-center justify-between text-blue-900 dark:text-blue-300">
          <span class="font-bold flex items-center gap-1.5 text-xs">
            <i data-lucide="file-text" class="w-4 h-4 text-blue-600 dark:text-blue-400"></i>
            Surat Usulan Resmi dari Divisi (Dokumen Penguat)
          </span>
          <span class="badge badge-info text-[10px]">${req.suratDoc.size || 'Dokumen Terlampir'}</span>
        </div>

        <div class="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/60 shadow-xs">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <i data-lucide="${req.suratDoc.type && req.suratDoc.type.includes('pdf') ? 'file-text' : 'image'}" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
              <strong class="text-xs text-slate-900 dark:text-slate-100 truncate block">${req.suratDoc.name || 'Surat_Usulan_Divisi.pdf'}</strong>
              <span class="text-[10px] text-slate-400 block">${req.docProposalNo ? 'No. Surat: ' + req.docProposalNo : 'Dokumen Bukti Penguat'}</span>
            </div>
          </div>
          <button type="button" onclick="previewDisposalReqDoc('${req.id}')" class="btn-primary py-1.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shrink-0 shadow-xs">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i> Lihat Surat (Viewer)
          </button>
        </div>

        <!-- Pratinjau Tersemat Langsung (Jika Gambar / PDF) -->
        <div class="mt-2 rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/80 bg-slate-950/20">
          ${req.suratDoc.type && req.suratDoc.type.includes('pdf') ? `
            <iframe src="${req.suratDoc.dataUrl}" class="w-full h-80 rounded-xl bg-white border-none"></iframe>
          ` : `
            <div class="p-2 flex justify-center">
              <img src="${req.suratDoc.dataUrl}" class="max-h-80 w-auto rounded-lg object-contain cursor-pointer hover:opacity-95 shadow-xs" onclick="previewDisposalReqDoc('${req.id}')" title="Klik untuk perbesar layar penuh">
            </div>
          `}
        </div>
      </div>
    ` : ''}

    <!-- Photos Evidence (Galeri Interaktif) -->
    <div class="space-y-2 pt-1">
      <span class="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
        <i data-lucide="camera" class="w-4 h-4 text-rose-500"></i>
        Lampiran Foto Bukti Fisik Kerusakan:
      </span>
      ${(req.photos && req.photos.length > 0) ? `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${req.photos.map((p, i) => `
            <div class="group relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs bg-slate-100 dark:bg-slate-800 cursor-pointer" onclick="openDisposalMediaViewer('${p}', 'Foto Bukti Kerusakan #${i + 1} - ${req.assetName}', false, '${req.assetCode}')" title="Klik untuk perbesar foto">
              <img src="${p}" class="w-full h-32 object-cover group-hover:scale-105 transition-transform">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                <i data-lucide="maximize-2" class="w-4 h-4"></i> Perbesar Foto
              </div>
              <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md font-mono">Foto #${i + 1}</div>
            </div>
          `).join('')}
        </div>
      ` : '<p class="text-slate-400 italic text-[11px]">Tidak ada lampiran foto bukti fisik.</p>'}
    </div>

    <!-- Rejection Info (If Rejected) -->
    ${req.status === 'Ditolak' ? `
      <div class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-800 dark:text-rose-300 space-y-1">
        <div class="flex items-center justify-between font-bold">
          <span>❌ Catatan Penolakan Usulan:</span>
          <span class="text-[10px] text-rose-400">${req.rejectedAt || '-'}</span>
        </div>
        <p class="italic">${req.rejectReason || 'Tidak disetujui pimpinan.'}</p>
        <span class="text-[10px] text-slate-400 block">Ditolak oleh: ${req.rejectedBy || '-'}</span>
      </div>
    ` : ''}

    <!-- Approval Info (If Approved) -->
    ${req.status === 'Disetujui' && req.approvalData ? `
      <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 space-y-1">
        <div class="flex items-center justify-between font-bold">
          <span>✅ Berita Acara Penghapusan Sah:</span>
          <span class="font-mono">${req.approvalData.baNumber || '-'}</span>
        </div>
        <p class="text-[11px]">Disahkan pada ${req.approvalData.approvedAt || '-'} oleh <strong>${req.approvalData.approvedBy || '-'}</strong> (${req.approvalData.approverTitle || '-'}).</p>
      </div>
    ` : ''}

    <!-- Action Footer -->
    <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
      <button type="button" onclick="closeModal('modal-detail-disposal-request')" class="btn-secondary text-xs">Tutup</button>
      <div class="flex items-center gap-2">
        ${req.status === 'Menunggu Persetujuan' ? `
          <button onclick="closeModal('modal-detail-disposal-request'); openModalRejectDisposal('${req.id}')" class="btn-secondary text-xs text-rose-500 hover:bg-rose-500/10 border-rose-500/30">
            <i data-lucide="x" class="w-3.5 h-3.5"></i> Tolak Usulan
          </button>
          <button onclick="closeModal('modal-detail-disposal-request'); openModalApproveDisposal('${req.id}')" class="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Setujui & Terbitkan BA
          </button>
        ` : (req.status === 'Disetujui' ? `
          <button onclick="printSingleDisposalBAByRequestId('${req.id}')" class="btn-primary text-xs bg-teal-600 hover:bg-teal-700">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i> Cetak Berita Acara (BA)
          </button>
        ` : '')}
      </div>
    </div>
  `;

  openModal('modal-detail-disposal-request');
  if (window.lucide) lucide.createIcons();
}

function openModalApproveDisposal(requestId) {
  const req = db.getDisposalRequestById(requestId);
  if (!req) return;

  const settings = db.getSettings();
  document.getElementById('approve-disp-req-id').value = req.id;
  document.getElementById('approve-disp-asset-name').textContent = req.assetName;
  document.getElementById('approve-disp-asset-code').textContent = req.assetCode;
  
  document.getElementById('approve-disp-ba-no').value = `BA.${Math.floor(10 + Math.random() * 90)}/DISP-AST/${new Date().getFullYear()}`;
  document.getElementById('approve-disp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('approve-disp-by').value = settings.leaderName || 'Pimpinan Yayasan';
  document.getElementById('approve-disp-title').value = settings.leaderTitle || 'Pimpinan Lembaga';
  document.getElementById('approve-disp-witness').value = settings.assetOfficerName || 'Divisi Sarpras & Riayah';
  document.getElementById('approve-disp-notes').value = 'Disetujui dan telah diverifikasi tidak memiliki fungsi operasional ekonomis.';

  openModal('modal-approve-disposal');
}

function handleExecuteApproveDisposal(event) {
  event.preventDefault();

  const requestId = document.getElementById('approve-disp-req-id').value;
  const baNumber = document.getElementById('approve-disp-ba-no').value.trim();
  const approvedAt = document.getElementById('approve-disp-date').value;
  const approvedBy = document.getElementById('approve-disp-by').value.trim();
  const approverTitle = document.getElementById('approve-disp-title').value.trim();
  const witnessName = document.getElementById('approve-disp-witness').value.trim();
  const notes = document.getElementById('approve-disp-notes').value.trim();

  const approvalData = {
    baNumber,
    approvedAt,
    approvedBy,
    approverTitle,
    witnessName,
    notes
  };

  const success = db.approveDisposalRequest(requestId, approvalData);
  if (success) {
    closeModal('modal-approve-disposal');
    showToast(`✅ Berita Acara ${baNumber} sah diterbitkan! Aset resmi dihapusbukukan.`, 'success');

    if (typeof confetti === 'function') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }

    renderDisposalRequestsTable();
    renderDisposalTable();
    renderAssetTable();
    renderDashboard();
  }
}

function openModalRejectDisposal(requestId) {
  const req = db.getDisposalRequestById(requestId);
  if (!req) return;

  const settings = db.getSettings();
  document.getElementById('reject-disp-req-id').value = req.id;
  document.getElementById('reject-disp-asset-name').textContent = `${req.assetName} (${req.assetCode})`;
  document.getElementById('reject-disp-reason').value = '';
  document.getElementById('reject-disp-by').value = settings.leaderName || 'Pimpinan Lembaga';

  openModal('modal-reject-disposal');
}

function handleExecuteRejectDisposal(event) {
  event.preventDefault();

  const requestId = document.getElementById('reject-disp-req-id').value;
  const reason = document.getElementById('reject-disp-reason').value.trim();
  const rejectedBy = document.getElementById('reject-disp-by').value.trim();

  const success = db.rejectDisposalRequest(requestId, { reason, rejectedBy });
  if (success) {
    closeModal('modal-reject-disposal');
    showToast('Usulan penghapusan aset telah ditolak. Aset tetap aktif di inventaris.', 'info');

    renderDisposalRequestsTable();
    renderAssetTable();
    renderDashboard();
  }
}

function printSingleDisposalBAById(disposalId) {
  const disposals = db.getDisposals();
  const record = disposals.find(d => d.id === disposalId);
  if (!record) return;

  const settings = db.getSettings();
  const html = ReportEngine.generateSingleDisposalBAHTML(record, settings);
  printIsolatedHTML(html);
}

function printSingleDisposalBAByRequestId(requestId) {
  const disposals = db.getDisposals();
  const record = disposals.find(d => d.requestId === requestId);
  if (record) {
    printSingleDisposalBAById(record.id);
  } else {
    showToast('Data Berita Acara tidak ditemukan.', 'warning');
  }
}

function printDisposalReport() {
  const settings = db.getSettings();
  const html = ReportEngine.generateDisposalReportHTML(settings);
  printIsolatedHTML(html);
}

/**
 * ========================================================
 * 13.3 TAB 3: BARANG RUSAK & BERITA ACARA KERUSAKAN
 * ========================================================
 */
function populateDamagedDropdowns() {
  const rooms = db.getRooms();
  const filterRoom = document.getElementById('filter-disp-damaged-room');
  if (filterRoom) {
    const cur = filterRoom.value;
    filterRoom.innerHTML = '<option value="">Semua Ruangan</option>' + 
      rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    filterRoom.value = cur;
  }
}

function renderDamagedTable() {
  const items = db.getDamagedItems();
  const tbody = document.getElementById('disposal-damaged-table-body');
  const emptyState = document.getElementById('disposal-damaged-empty');
  const searchQuery = (document.getElementById('filter-disp-damaged-search')?.value || '').toLowerCase().trim();
  const roomFilter = document.getElementById('filter-disp-damaged-room')?.value || '';
  const severityFilter = document.getElementById('filter-disp-damaged-severity')?.value || '';
  const baFilter = document.getElementById('filter-disp-damaged-ba')?.value || '';

  updateDisposalMetrics();
  if (!tbody) return;

  let filtered = items;
  if (searchQuery) {
    filtered = filtered.filter(item =>
      (item.name || '').toLowerCase().includes(searchQuery) ||
      (item.code || '').toLowerCase().includes(searchQuery) ||
      (item.roomName || '').toLowerCase().includes(searchQuery) ||
      (item.brand || '').toLowerCase().includes(searchQuery) ||
      (item.baNumber || '').toLowerCase().includes(searchQuery)
    );
  }
  if (roomFilter) {
    filtered = filtered.filter(item => item.roomName === roomFilter);
  }
  if (severityFilter) {
    filtered = filtered.filter(item => item.severity === severityFilter || item.condition === severityFilter);
  }
  if (baFilter) {
    if (baFilter === 'has_ba') filtered = filtered.filter(item => item.hasBA);
    if (baFilter === 'no_ba') filtered = filtered.filter(item => !item.hasBA);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map(item => {
    const isHeavy = item.severity === 'Rusak Berat' || item.condition === 'RB' || item.condition === 'Rusak Berat';
    const severityBadge = isHeavy
      ? '<span class="badge badge-danger text-[10px] font-extrabold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Rusak Berat</span>'
      : '<span class="badge badge-warning text-[10px] font-extrabold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Rusak Ringan</span>';

    const baStatusHTML = item.hasBA
      ? `<div class="space-y-1">
           <div class="flex items-center gap-1.5">
             <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
               ✅ ${item.baNumber}
             </span>
             <button onclick="previewDamageBA('${item.damageReport.id}')" class="text-blue-500 hover:text-blue-600 p-0.5" title="Lihat Detail BA">
               <i data-lucide="eye" class="w-3.5 h-3.5"></i>
             </button>
             <button onclick="printDamageBA('${item.damageReport.id}')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5" title="Cetak Surat BA">
               <i data-lucide="printer" class="w-3.5 h-3.5"></i>
             </button>
           </div>
           <div class="text-[10px] text-slate-400">Tgl: ${item.baDate || '-'} • Oleh: ${item.inspector || 'Tim Sarpras'}</div>
         </div>`
      : `<div class="space-y-1">
           <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
             ⚠️ Belum Ada Berita Acara
           </span>
           <div class="pt-0.5">
             <button onclick="openModalUploadBAKerusakan('${item.id}')" class="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
               <i data-lucide="file-plus-2" class="w-3 h-3"></i> Upload / Buat BA
             </button>
           </div>
         </div>`;

    const recommendationHTML = item.isUnderDisposal
      ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">⏳ Sedang Diajukan Penghapusan</span>'
      : (item.recommendation
          ? `<span class="text-xs font-semibold ${item.recommendation.includes('Penghapusan') ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}">${item.recommendation}</span>`
          : '<span class="text-[11px] text-slate-400 italic">Perlu pemeriksaan teknis</span>');

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">${item.code}</span>
              <div class="font-bold text-slate-900 dark:text-slate-100 text-xs">${item.name}</div>
              <div class="text-[10px] text-slate-400">${item.brand ? item.brand + ' • ' : ''}${item.categoryName}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
          <div class="flex items-center gap-1.5">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
            <span>${item.roomName}</span>
          </div>
        </td>
        <td class="px-4 py-3 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
          ${item.qty} ${item.unit}
        </td>
        <td class="px-4 py-3 text-center">
          ${severityBadge}
        </td>
        <td class="px-4 py-3">
          ${baStatusHTML}
        </td>
        <td class="px-4 py-3">
          ${recommendationHTML}
        </td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openModalUploadBAKerusakan('${item.id}')" class="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Upload / Edit Berita Acara">
              <i data-lucide="file-edit" class="w-4 h-4"></i>
            </button>
            ${!item.isUnderDisposal ? `
              <button onclick="openModalAjukanPenghapusan('${item.id}')" class="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Ajukan Penghapusan (Lampirkan BA)">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            ` : `
              <span class="p-1.5 text-blue-500 opacity-70" title="Sedang dalam proses permohonan penghapusan">
                <i data-lucide="clock" class="w-4 h-4"></i>
              </span>
            `}
            <button onclick="handleMarkAsRepaired('${item.id}')" class="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Telah Selesai Diperbaiki (Kembalikan ke Kondisi Baik)">
              <i data-lucide="check-check" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openModalCatatBarangRusak() {
  openModalUploadBAKerusakan(null);
}

function openModalUploadBAKerusakan(assetId = null) {
  const assets = db.getAssets().filter(a => a.status !== 'Dihapuskan');
  const select = document.getElementById('ba-damage-asset-select');
  const form = document.getElementById('form-ba-kerusakan');
  if (!form) return;

  currentDamagePhotos = [];
  renderDamagePhotosPreview();

  currentDamageDoc = null;
  const docInput = document.getElementById('ba-damage-doc-input');
  if (docInput) docInput.value = '';
  renderDamageDocPreview();

  if (select) {
    select.innerHTML = '<option value="">-- Pilih Barang yang Mengalami Kerusakan --</option>' +
      assets.map(a => `<option value="${a.id}">${a.name} (${a.code}) - ${a.roomName || 'Tanpa Ruangan'}</option>`).join('');
  }

  const existingReport = assetId ? db.getDamageReportByAssetId(assetId) : null;
  const asset = assetId ? db.getAssetById(assetId) : null;
  const settings = db.getSettings();

  document.getElementById('ba-damage-report-id').value = existingReport ? existingReport.id : '';
  document.getElementById('ba-damage-asset-id-hidden').value = assetId || '';
  document.getElementById('ba-damage-docno').value = existingReport ? existingReport.docNo : `BA.${Math.floor(10 + Math.random() * 90)}/RSK-SARPRAS/${new Date().getFullYear()}`;
  document.getElementById('ba-damage-date').value = existingReport ? existingReport.date : new Date().toISOString().split('T')[0];
  document.getElementById('ba-damage-inspector').value = existingReport ? existingReport.inspectorName : (settings.assetOfficerName || '');
  document.getElementById('ba-damage-inspector-title').value = existingReport ? existingReport.inspectorTitle : 'Tim Verifikasi Sarpras';
  
  let defaultSeverity = 'Rusak Berat';
  if (existingReport && existingReport.severity) {
    defaultSeverity = existingReport.severity;
  } else if (asset && (asset.condition === 'RR' || asset.condition === 'Rusak Ringan')) {
    defaultSeverity = 'Rusak Ringan';
  }
  document.getElementById('ba-damage-severity').value = defaultSeverity;

  document.getElementById('ba-damage-recommendation').value = existingReport ? existingReport.recommendation : 'Usulkan Penghapusan (Pemutihan Aset)';
  document.getElementById('ba-damage-description').value = existingReport ? (existingReport.damageDescription || existingReport.notes || '') : '';

  if (existingReport && existingReport.suratDoc) {
    currentDamageDoc = existingReport.suratDoc;
    renderDamageDocPreview();
  }

  if (existingReport && existingReport.photos && existingReport.photos.length > 0) {
    currentDamagePhotos = [...existingReport.photos];
    renderDamagePhotosPreview();
  } else if (asset && asset.image) {
    currentDamagePhotos = [asset.image];
    renderDamagePhotosPreview();
  }

  if (assetId && select) {
    select.value = assetId;
  }
  onDamageAssetSelected();

  openModal('modal-ba-kerusakan');
}

function onDamageAssetSelected() {
  const assetId = document.getElementById('ba-damage-asset-select')?.value;
  const previewBox = document.getElementById('ba-damage-asset-preview');
  if (!assetId) {
    if (previewBox) previewBox.classList.add('hidden');
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) return;

  const codeLabel = document.getElementById('ba-damage-code-label');
  const nameLabel = document.getElementById('ba-damage-name-label');
  const roomLabel = document.getElementById('ba-damage-room-label');
  const catLabel = document.getElementById('ba-damage-cat-label');
  const priceLabel = document.getElementById('ba-damage-price-label');

  if (codeLabel) codeLabel.textContent = asset.code;
  if (nameLabel) nameLabel.textContent = `${asset.name} ${asset.brand ? '(' + asset.brand + ')' : ''}`;
  if (roomLabel) roomLabel.textContent = asset.roomName || 'Tanpa Ruangan';
  if (catLabel) catLabel.textContent = asset.categoryName || '-';
  if (priceLabel) priceLabel.textContent = DepreciationEngine.formatRupiah(asset.price);

  if (previewBox) previewBox.classList.remove('hidden');
}

function handleDamageDocSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentDamageDoc = {
      dataUrl: e.target.result,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
    };
    renderDamageDocPreview();
  };
  reader.readAsDataURL(file);
}

function removeDamageDoc() {
  currentDamageDoc = null;
  const input = document.getElementById('ba-damage-doc-input');
  if (input) input.value = '';
  renderDamageDocPreview();
}

function renderDamageDocPreview() {
  const preview = document.getElementById('ba-damage-doc-preview');
  const nameEl = document.getElementById('ba-damage-doc-name');
  const sizeEl = document.getElementById('ba-damage-doc-size');

  if (!preview) return;

  if (currentDamageDoc && currentDamageDoc.dataUrl) {
    if (nameEl) nameEl.textContent = currentDamageDoc.name;
    if (sizeEl) sizeEl.textContent = currentDamageDoc.size;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
}

function previewSelectedDamageDoc() {
  if (!currentDamageDoc || !currentDamageDoc.dataUrl) return;
  const isPdf = currentDamageDoc.type && currentDamageDoc.type.includes('pdf');
  openDisposalMediaViewer(currentDamageDoc.dataUrl, currentDamageDoc.name, isPdf, currentDamageDoc.size);
}

function handleDamagePhotoSelect(event) {
  const files = Array.from(event.target.files);
  if (!files || files.length === 0) return;

  const remainingSlots = 3 - currentDamagePhotos.length;
  if (remainingSlots <= 0) {
    showToast('Maksimal 3 foto lampiran.', 'warning');
    return;
  }

  const toProcess = files.slice(0, remainingSlots);
  let processed = 0;

  toProcess.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      currentDamagePhotos.push(e.target.result);
      processed++;
      if (processed === toProcess.length) {
        renderDamagePhotosPreview();
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeDamagePhoto(index) {
  currentDamagePhotos.splice(index, 1);
  renderDamagePhotosPreview();
}

function renderDamagePhotosPreview() {
  const container = document.getElementById('ba-damage-photos-preview');
  if (!container) return;

  if (currentDamagePhotos.length === 0) {
    container.innerHTML = '<span class="text-[11px] text-slate-400 italic">Belum ada foto bukti kerusakan yang dipilih.</span>';
    return;
  }

  container.innerHTML = currentDamagePhotos.map((photo, idx) => `
    <div class="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm shrink-0">
      <img src="${photo}" class="w-full h-full object-cover">
      <button type="button" onclick="removeDamagePhoto(${idx})" class="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <i data-lucide="x" class="w-2.5 h-2.5"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function handleSaveDamageReport(event) {
  event.preventDefault();

  const assetId = document.getElementById('ba-damage-asset-select').value;
  const asset = db.getAssetById(assetId);
  if (!asset) {
    showToast('Silakan pilih barang inventaris terlebih dahulu.', 'warning');
    return;
  }

  const existingReportId = document.getElementById('ba-damage-report-id').value;
  const severity = document.getElementById('ba-damage-severity').value;
  const recommendation = document.getElementById('ba-damage-recommendation').value;
  const docNo = document.getElementById('ba-damage-docno').value.trim();
  const date = document.getElementById('ba-damage-date').value;
  const inspectorName = document.getElementById('ba-damage-inspector').value.trim();
  const inspectorTitle = document.getElementById('ba-damage-inspector-title').value.trim();
  const damageDescription = document.getElementById('ba-damage-description').value.trim();

  const reportData = {
    id: existingReportId || `BA-RSK-${Date.now()}`,
    docNo,
    assetId: asset.id,
    assetCode: asset.code,
    assetName: asset.name,
    categoryName: asset.categoryName || '-',
    roomName: asset.roomName || 'Tanpa Ruangan',
    date,
    inspectorName,
    inspectorTitle,
    severity,
    damageDescription,
    recommendation,
    status: 'Berita Acara Kerusakan Terbit',
    photos: currentDamagePhotos,
    suratDoc: currentDamageDoc,
    createdAt: new Date().toISOString()
  };

  db.saveDamageReport(reportData);

  // Update asset condition in asset registry if needed
  if (asset.condition !== severity) {
    asset.condition = severity === 'Rusak Berat' ? 'Rusak Berat' : 'Rusak Ringan';
    db.saveAsset(asset);
  }

  closeModal('modal-ba-kerusakan');
  showToast(`✅ Berita Acara Kerusakan \"${docNo}\" berhasil disimpan!`, 'success');

  renderDamagedTable();
  updateDisposalMetrics();
  renderAssetTable();
  renderDashboard();
}

function previewDamageBA(reportId) {
  const report = db.getDamageReportById(reportId);
  if (!report) {
    showToast('Data Berita Acara Kerusakan tidak ditemukan.', 'warning');
    return;
  }

  const docNoLabel = document.getElementById('detail-ba-damage-docno-label');
  const content = document.getElementById('detail-ba-damage-content');
  if (docNoLabel) docNoLabel.textContent = report.docNo || '-';

  if (!content) return;

  const photosHTML = (report.photos && report.photos.length > 0)
    ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        ${report.photos.map(p => `
          <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video cursor-pointer hover:opacity-90" onclick="openDisposalMediaViewer('${p}', 'Foto Bukti Kerusakan Fisik', false, '${report.docNo}')">
            <img src="${p}" class="w-full h-full object-cover">
          </div>
        `).join('')}
       </div>`
    : '<p class="text-[11px] text-slate-400 italic">Tidak ada foto bukti terlampir.</p>';

  const docButtonHTML = (report.suratDoc && report.suratDoc.dataUrl)
    ? `<div class="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-between mt-2">
         <div class="flex items-center gap-2">
           <i data-lucide="file-text" class="w-4 h-4 text-amber-500"></i>
           <span class="font-bold text-slate-800 dark:text-slate-200">${report.suratDoc.name || 'Dokumen Scan BA'}</span>
         </div>
         <button onclick="openDisposalMediaViewer('${report.suratDoc.dataUrl}', '${report.suratDoc.name}', ${(report.suratDoc.type || '').includes('pdf')}, '${report.docNo}')" class="btn-secondary py-1 px-2 text-xs font-bold text-amber-600 dark:text-amber-400">
           <i data-lucide="eye" class="w-3.5 h-3.5"></i> Buka Berkas
         </button>
       </div>`
    : '';

  content.innerHTML = `
    <!-- Top Summary Card -->
    <div class="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">${report.assetCode}</span>
        <span class="badge ${report.severity === 'Rusak Berat' ? 'badge-danger' : 'badge-warning'}">${report.severity}</span>
      </div>
      <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm">${report.assetName}</h4>
      <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-amber-500/15">
        <div>Ruangan: <strong>${report.roomName}</strong></div>
        <div>Tgl Periksa: <strong>${report.date}</strong></div>
        <div>Pemeriksa: <strong>${report.inspectorName}</strong></div>
        <div>Jabatan: <strong>${report.inspectorTitle || 'Tim Sarpras'}</strong></div>
      </div>
    </div>

    <!-- Kronologi & Rekomendasi -->
    <div class="space-y-3">
      <div>
        <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kronologi Kerusakan / Temuan Fisik:</label>
        <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
          ${report.damageDescription || '-'}
        </div>
      </div>

      <div>
        <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Rekomendasi Tim Pemeriksa:</label>
        <div class="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
          ${report.recommendation || 'Usulkan Penghapusan (Pemutihan Aset)'}
        </div>
      </div>

      ${docButtonHTML}

      <div>
        <label class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Foto Bukti Fisik:</label>
        ${photosHTML}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
      <button onclick="printDamageBA('${report.id}')" class="btn-secondary text-xs">
        <i data-lucide="printer" class="w-3.5 h-3.5 text-amber-500"></i> Cetak Lembar BA Fisik
      </button>
      <div class="flex items-center gap-2">
        <button onclick="openModalAjukanPenghapusan('${report.assetId}'); closeModal('modal-detail-ba-kerusakan')" class="btn-primary text-xs bg-rose-600 hover:bg-rose-700">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Ajukan Penghapusan
        </button>
        <button onclick="closeModal('modal-detail-ba-kerusakan')" class="btn-secondary text-xs">Tutup</button>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  openModal('modal-detail-ba-kerusakan');
}

function printDamageBA(reportId) {
  const report = db.getDamageReportById(reportId);
  if (!report) {
    showToast('Data Berita Acara tidak ditemukan.', 'warning');
    return;
  }
  const settings = db.getSettings();
  const html = ReportEngine.generateDamageInspectionBAHTML(report, settings);
  printIsolatedHTML(html);
}

function handleMarkAsRepaired(assetId) {
  const asset = db.getAssetById(assetId);
  if (!asset) return;

  const notes = prompt(`Konfirmasi barang telah diperbaiki:\n\nMasukkan catatan perbaikan atau servis untuk \"${asset.name}\":`, 'Telah diservis & berfungsi normal kembali');
  if (notes === null) return;

  const success = db.markAssetRepaired(assetId, notes);
  if (success) {
    showToast(`✅ Kondisi \"${asset.name}\" berhasil dikembalikan ke BAIK (Normal)!`, 'success');
    renderDamagedTable();
    updateDisposalMetrics();
    renderAssetTable();
    renderDashboard();
  }
}

function exportDamagedItemsToExcel() {
  const items = db.getDamagedItems();
  if (items.length === 0) {
    showToast('Tidak ada data barang rusak untuk diekspor.', 'info');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += 'No,Kode Barang,Nama Barang,Merek/Tipe,Ruangan,Jumlah,Satuan,Tingkat Kerusakan,Status BA,No. Berita Acara,Tgl Pemeriksaan,Pemeriksa,Rekomendasi\n';

  items.forEach((item, index) => {
    const row = [
      index + 1,
      `"${(item.code || '').replace(/"/g, '""')}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.brand || '').replace(/"/g, '""')}"`,
      `"${(item.roomName || '').replace(/"/g, '""')}"`,
      item.qty || 1,
      `"${(item.unit || 'Unit').replace(/"/g, '""')}"`,
      `"${(item.severity || '').replace(/"/g, '""')}"`,
      item.hasBA ? 'Sudah Ada BA' : 'Belum Ada BA',
      `"${(item.baNumber || '-').replace(/"/g, '""')}"`,
      `"${(item.baDate || '-').replace(/"/g, '""')}"`,
      `"${(item.inspector || '-').replace(/"/g, '""')}"`,
      `"${(item.recommendation || '-').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Daftar_Barang_Rusak_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Daftar Barang Rusak & Berita Acara berhasil diekspor ke format spreadsheet!', 'success');
}

/**
 * ========================================================
 * SECTION: KARTU INVENTARIS BARANG (KIB) CONTROLLER
 * ========================================================
 */
function populateKIBDropdowns() {
  const assets = db.getAssets();
  const rooms = db.getRooms();

  // Filter Ruangan / Pengguna
  const filterRoom = document.getElementById('filter-kib-ruangan');
  if (filterRoom) {
    const currentVal = filterRoom.value;
    const roomOptions = rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    filterRoom.innerHTML = '<option value="">Semua Lokasi / Pengguna</option>' + roomOptions;
    filterRoom.value = currentVal;
  }

  // Filter Tahun Pengadaan
  const filterYear = document.getElementById('filter-kib-tahun');
  if (filterYear) {
    const currentVal = filterYear.value;
    const years = new Set();
    assets.forEach(a => {
      const y = a.productionYear || a.tahunPembuatan || (a.date ? a.date.split('-')[0] : null);
      if (y) years.add(y.toString());
    });
    const sortedYears = Array.from(years).sort().reverse();
    filterYear.innerHTML = '<option value="">Semua Tahun Pengadaan</option>' + sortedYears.map(y => `<option value="${y}">Tahun ${y}</option>`).join('');
    filterYear.value = currentVal;
  }
}

function renderKIBPage(filteredAssets = null) {
  const assets = filteredAssets !== null ? filteredAssets : db.getAssets();
  const allAssets = db.getAssets();

  const tbody = document.getElementById('kib-table-body');
  const emptyState = document.getElementById('kib-empty-state');
  const countDisplay = document.getElementById('kib-count-display');
  const totalDisplay = document.getElementById('kib-total-display');

  if (countDisplay) countDisplay.textContent = assets.length;
  if (totalDisplay) totalDisplay.textContent = allAssets.length;

  // Compute Stats
  let totalVal = 0;
  let goodCount = 0;
  let damagedCount = 0;

  allAssets.forEach(a => {
    const unitP = a.unitPrice || (a.qty ? (a.price / a.qty) : a.price) || 0;
    const totalP = a.price || (unitP * (a.qty || 1));
    totalVal += totalP;

    const cond = a.condition || 'B';
    if (cond === 'B' || cond === 'Baik') {
      goodCount++;
    } else {
      damagedCount++;
    }
  });

  const statItems = document.getElementById('kib-stat-total-items');
  const statVal = document.getElementById('kib-stat-total-val');
  const statGood = document.getElementById('kib-stat-good');
  const statDamaged = document.getElementById('kib-stat-damaged');

  if (statItems) statItems.textContent = allAssets.length;
  if (statVal) statVal.textContent = DepreciationEngine.formatRupiah(totalVal);
  if (statGood) statGood.textContent = goodCount;
  if (statDamaged) statDamaged.textContent = damagedCount;

  if (!tbody) return;

  if (assets.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = assets.map((a, idx) => {
    const unitPrice = a.unitPrice || (a.qty ? (a.price / a.qty) : a.price) || 0;
    const totalPrice = a.price || (unitPrice * (a.qty || 1));
    
    let cond = a.condition || 'B';
    let condBadge = '<span class="px-1.5 py-0.5 rounded font-black text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">B</span>';
    if (cond === 'RR' || cond === 'Rusak Ringan') {
      cond = 'RR';
      condBadge = '<span class="px-1.5 py-0.5 rounded font-black text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">RR</span>';
    } else if (cond === 'RB' || cond === 'Rusak Berat') {
      cond = 'RB';
      condBadge = '<span class="px-1.5 py-0.5 rounded font-black text-[11px] bg-rose-500/10 text-rose-500 border border-rose-500/20">RB</span>';
    }

    const year = a.productionYear || a.tahunPembuatan || (a.date ? a.date.split('-')[0] : '-');
    const usedByText = a.usedBy || a.dipergunakanOleh || a.roomName || a.pic || '-';

    return `
      <tr class="hover:bg-red-50/40 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800 text-xs">
        <td class="px-3 py-2.5 text-center font-bold text-slate-500 dark:text-slate-400">${idx + 1}</td>
        <td class="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">${a.noInduk || '-'}</td>
        <td class="px-3 py-2.5">
          <strong class="text-slate-900 dark:text-slate-100 hover:text-red-600 cursor-pointer block" onclick="openModalDetailAset('${a.id}')">${a.name}</strong>
        </td>
        <td class="px-3 py-2.5 font-mono font-bold text-red-600 dark:text-red-400">${a.code}</td>
        <td class="px-3 py-2.5 text-slate-700 dark:text-slate-300">${a.brandType || a.brand || '-'}</td>
        <td class="px-3 py-2.5 text-slate-600 dark:text-slate-400">${a.size || a.ukuran || '-'}</td>
        <td class="px-3 py-2.5 text-center font-mono text-slate-700 dark:text-slate-300">${year}</td>
        <td class="px-3 py-2.5 text-slate-600 dark:text-slate-400">${a.source || a.asalBarang || '-'}</td>
        <td class="px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">${a.qty || 1}</td>
        <td class="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400">${a.unit || 'Unit'}</td>
        <td class="px-3 py-2.5 text-center">${condBadge}</td>
        <td class="px-3 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">${DepreciationEngine.formatRupiah(unitPrice)}</td>
        <td class="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">${DepreciationEngine.formatRupiah(totalPrice)}</td>
        <td class="px-3 py-2.5">
          <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-[11px] block truncate max-w-[140px]" title="${usedByText}">${usedByText}</span>
        </td>
        <td class="px-3 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title="${a.notes || '-'}">${a.notes || '-'}</td>
        <td class="px-3 py-2.5 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="openModalDetailAset('${a.id}')" class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded transition-colors" title="Lihat Detail">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="openModalEditAset('${a.id}')" class="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 rounded transition-colors" title="Edit Barang">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function onFilterKIBDivisionChange() {
  const divId = document.getElementById('filter-kib-divisi')?.value || '';
  const filterRoom = document.getElementById('filter-kib-ruangan');
  const rooms = db.getRooms();
  
  if (filterRoom) {
    let filteredRooms = rooms;
    if (divId) {
      filteredRooms = rooms.filter(r => r.divisionId === divId);
    }
    filterRoom.innerHTML = '<option value="">🚪 Semua Lokasi / Ruangan</option>' + 
      filteredRooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    filterRoom.value = '';
  }
  applyKIBFilters();
}

function applyKIBFilters() {
  const query = (document.getElementById('filter-kib-search')?.value || '').toLowerCase().trim();
  const branchFilter = document.getElementById('filter-kib-cabang')?.value || '';
  const divFilter = document.getElementById('filter-kib-divisi')?.value || '';
  const roomFilter = document.getElementById('filter-kib-ruangan')?.value || '';
  const condFilter = document.getElementById('filter-kib-kondisi')?.value || '';
  const yearFilter = document.getElementById('filter-kib-tahun')?.value || '';

  const allAssets = db.getAssets();
  const allRooms = db.getRooms();

  const filtered = allAssets.filter(a => {
    const matchQuery = !query ||
      (a.name && a.name.toLowerCase().includes(query)) ||
      (a.code && a.code.toLowerCase().includes(query)) ||
      (a.noInduk && a.noInduk.toLowerCase().includes(query)) ||
      (a.brandType && a.brandType.toLowerCase().includes(query)) ||
      (a.brand && a.brand.toLowerCase().includes(query)) ||
      (a.usedBy && a.usedBy.toLowerCase().includes(query)) ||
      (a.roomName && a.roomName.toLowerCase().includes(query));

    const roomObj = allRooms.find(r => r.name === a.roomName || r.id === a.roomId || (r.code && a.code && a.code.includes(r.code)));

    const matchBranch = !branchFilter || 
      a.branchId === branchFilter || 
      a.branchName === branchFilter || 
      (roomObj && (roomObj.branchId === branchFilter || roomObj.branchName === branchFilter)) ||
      (a.code && a.code.includes(branchFilter));

    const matchDiv = !divFilter || 
      a.divisionId === divFilter || 
      a.divisionName === divFilter ||
      (roomObj && (roomObj.divisionId === divFilter || roomObj.divisionName === divFilter));

    const matchRoom = !roomFilter || (a.roomName === roomFilter) || (a.usedBy && a.usedBy.includes(roomFilter));
    
    let cond = a.condition || 'B';
    if (cond === 'Baik') cond = 'B';
    else if (cond === 'Rusak Ringan') cond = 'RR';
    else if (cond === 'Rusak Berat') cond = 'RB';
    const matchCond = !condFilter || (cond === condFilter);

    const aYear = (a.productionYear || a.tahunPembuatan || (a.date ? a.date.split('-')[0] : '')).toString();
    const matchYear = !yearFilter || (aYear === yearFilter);

    return matchQuery && matchBranch && matchDiv && matchRoom && matchCond && matchYear;
  });

  renderKIBPage(filtered);
}

function resetKIBFilters() {
  if (document.getElementById('filter-kib-search')) document.getElementById('filter-kib-search').value = '';
  if (document.getElementById('filter-kib-cabang')) document.getElementById('filter-kib-cabang').value = '';
  if (document.getElementById('filter-kib-divisi')) document.getElementById('filter-kib-divisi').value = '';
  if (document.getElementById('filter-kib-ruangan')) {
    const rooms = db.getRooms();
    document.getElementById('filter-kib-ruangan').innerHTML = '<option value="">🚪 Semua Lokasi / Ruangan</option>' + rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    document.getElementById('filter-kib-ruangan').value = '';
  }
  if (document.getElementById('filter-kib-kondisi')) document.getElementById('filter-kib-kondisi').value = '';
  if (document.getElementById('filter-kib-tahun')) document.getElementById('filter-kib-tahun').value = '';
  renderKIBPage();
}

function printKIBReport() {
  const settings = db.getSettings();
  const assets = db.getAssets();

  let totalQty = 0;
  let totalPrice = 0;

  const rowsHTML = assets.map((a, idx) => {
    const unitPrice = a.unitPrice || (a.qty ? (a.price / a.qty) : a.price) || 0;
    const itemTotal = a.price || (unitPrice * (a.qty || 1));
    totalQty += (a.qty || 1);
    totalPrice += itemTotal;

    let cond = a.condition || 'B';
    if (cond === 'Baik') cond = 'B';
    else if (cond === 'Rusak Ringan') cond = 'RR';
    else if (cond === 'Rusak Berat') cond = 'RB';

    const year = a.productionYear || a.tahunPembuatan || (a.date ? a.date.split('-')[0] : '-');
    const usedBy = a.usedBy || a.dipergunakanOleh || a.roomName || '-';

    return `
      <tr>
        <td style="text-align: center; padding: 5px; border: 1px solid #333;">${idx + 1}</td>
        <td style="padding: 5px; border: 1px solid #333; font-family: monospace;">${a.noInduk || '-'}</td>
        <td style="padding: 5px; border: 1px solid #333; font-weight: 600;">${a.name}</td>
        <td style="padding: 5px; border: 1px solid #333; font-family: monospace; font-weight: bold;">${a.code}</td>
        <td style="padding: 5px; border: 1px solid #333;">${a.brandType || a.brand || '-'}</td>
        <td style="padding: 5px; border: 1px solid #333;">${a.size || a.ukuran || '-'}</td>
        <td style="text-align: center; padding: 5px; border: 1px solid #333;">${year}</td>
        <td style="padding: 5px; border: 1px solid #333;">${a.source || a.asalBarang || '-'}</td>
        <td style="text-align: center; padding: 5px; border: 1px solid #333; font-weight: bold;">${a.qty || 1}</td>
        <td style="text-align: center; padding: 5px; border: 1px solid #333;">${a.unit || 'Unit'}</td>
        <td style="text-align: center; padding: 5px; border: 1px solid #333; font-weight: bold;">${cond}</td>
        <td style="text-align: right; padding: 5px; border: 1px solid #333;">${DepreciationEngine.formatRupiah(unitPrice)}</td>
        <td style="text-align: right; padding: 5px; border: 1px solid #333; font-weight: bold;">${DepreciationEngine.formatRupiah(itemTotal)}</td>
        <td style="padding: 5px; border: 1px solid #333;">${usedBy}</td>
        <td style="padding: 5px; border: 1px solid #333;">${a.notes || '-'}</td>
      </tr>
    `;
  }).join('');

  const printHTML = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>KARTU INVENTARIS BARANG (KIB) - ${settings.instansiName || 'MASJID KAPAL MUNZALAN MUBARAKAN'}</title>
      <style>
        @page { size: landscape; margin: 10mm; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 9pt; color: #111; margin: 0; padding: 8px; }
        .header-box { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
        .header-box h2 { margin: 0; font-size: 14pt; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; }
        .header-box h3 { margin: 2px 0 0; font-size: 11pt; text-transform: uppercase; }
        .header-box p { margin: 2px 0 0; font-size: 8.5pt; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8pt; }
        th { background-color: #dc2626; color: #ffffff; padding: 5px 3px; font-weight: bold; border: 1px solid #991b1b; text-align: center; }
        th.sub { background-color: #b91c1c; font-size: 7pt; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .total-row { background-color: #fee2e2 !important; font-weight: bold; }
        .signature-section { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { width: 35%; text-align: center; }
        .sig-space { height: 50px; }
        @media print {
          th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .total-row { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header-box">
        <h2>KARTU INVENTARIS BARANG (KIB)</h2>
        <h3>${settings.instansiName || 'MASJID KAPAL MUNZALAN MUBARAKAN'}</h3>
        <p>${settings.instansiAddress || 'Jl. Sungai Raya Dalam Gg. Imaduddin, Kubu Raya, Kalimantan Barat'} • Telp: ${settings.instansiPhone || '0812-5567-8901'}</p>
      </div>

      <div style="margin-bottom: 8px; display: flex; justify-content: space-between; font-size: 8.5pt;">
        <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div><strong>Total Inventaris:</strong> ${assets.length} Item (${totalQty} Unit)</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px;">No. Urut</th>
            <th>No Induk</th>
            <th>Nama/Jenis Barang</th>
            <th>Kode Barang</th>
            <th>Merk/Type</th>
            <th>Ukuran/Kapasitas</th>
            <th style="width: 35px;">Tahun Pengadaan</th>
            <th>Asal Perolehan</th>
            <th style="width: 30px;">Jumlah Barang</th>
            <th style="width: 35px;">Satuan</th>
            <th style="width: 35px;">Kondisi (B/RR/RB)</th>
            <th>Harga Satuan (Rp)</th>
            <th>Harga Jumlah (Rp)</th>
            <th>Dipergunakan Oleh/Di</th>
            <th>Keterangan</th>
          </tr>
          <tr>
            <th class="sub">1</th>
            <th class="sub">2</th>
            <th class="sub">3</th>
            <th class="sub">4</th>
            <th class="sub">5</th>
            <th class="sub">6</th>
            <th class="sub">7</th>
            <th class="sub">8</th>
            <th class="sub">9</th>
            <th class="sub">10</th>
            <th class="sub">11</th>
            <th class="sub">12</th>
            <th class="sub">13</th>
            <th class="sub">14</th>
            <th class="sub">15</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
          <tr class="total-row">
            <td colspan="8" style="text-align: right; padding: 6px; border: 1px solid #333;">TOTAL KESELURUHAN:</td>
            <td style="text-align: center; padding: 6px; border: 1px solid #333;">${totalQty}</td>
            <td colspan="3" style="text-align: right; padding: 6px; border: 1px solid #333;">TOTAL NILAI ASET:</td>
            <td style="text-align: right; padding: 6px; border: 1px solid #333; font-size: 9pt;">${DepreciationEngine.formatRupiah(totalPrice)}</td>
            <td colspan="2" style="border: 1px solid #333;"></td>
          </tr>
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          <div>Mengetahui,</div>
          <strong>Pimpinan / Ketua Yayasan</strong>
          <div class="sig-space"></div>
          <div style="font-weight: bold; text-decoration: underline;">${settings.picLeader || 'KH. Luqmanulhakim'}</div>
          <div style="font-size: 8pt; color: #555;">Pimpinan Lembaga</div>
        </div>

        <div class="sig-box">
          <div>Pontianak, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <strong>Pengurus / Pengelola Inventaris</strong>
          <div class="sig-space"></div>
          <div style="font-weight: bold; text-decoration: underline;">${settings.picAssets || 'Ust. Hendra Gunawan'}</div>
          <div style="font-size: 8pt; color: #555;">Divisi Riayah & Sarpras</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printIsolatedHTML(printHTML);
}

/**
 * ========================================================
 * 14. SECTION 6: PEMINJAMAN ASET
 * ========================================================
 */
function renderLendingTable() {
  const lendings = db.getLendings();
  const tbody = document.getElementById('lending-table-body');
  if (!tbody) return;

  if (lendings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">Belum ada catatan peminjaman aset.</td></tr>';
    return;
  }

  tbody.innerHTML = lendings.map(l => {
    const isOverdue = l.status === 'Dipinjam' && l.returnDate && l.returnDate < new Date().toISOString().split('T')[0];
    let badge = `<span class="badge badge-info">${l.status}</span>`;
    if (l.status === 'Dikembalikan') badge = `<span class="badge badge-success">Dikembalikan</span>`;
    else if (isOverdue) badge = `<span class="badge badge-danger animate-pulse">Terlambat Kembali</span>`;

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 dark:text-slate-100">${l.assetName}</div>
          <div class="font-mono text-xs text-amber-500">${l.assetCode}</div>
        </td>
        <td class="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">${l.borrower}</td>
        <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">${l.date}</td>
        <td class="px-4 py-3 text-xs font-semibold ${isOverdue ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}">${l.returnDate}</td>
        <td class="px-4 py-3">${badge}</td>
        <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${l.purpose || '-'}</td>
        <td class="px-4 py-3 text-center">
          ${l.status === 'Dipinjam' ? `
            <button onclick="handleReturnLending('${l.id}')" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs">
              Kembalikan
            </button>
          ` : `<span class="text-xs text-slate-400">Selesai (${l.actualReturnDate || '-'})</span>`}
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openModalTambahPinjam() {
  populateDropdowns();
  document.getElementById('form-peminjaman').reset();
  document.getElementById('lend-date').value = new Date().toISOString().split('T')[0];
  openModal('modal-peminjaman');
}

function handleSaveLending(event) {
  event.preventDefault();

  const assetSelect = document.getElementById('lend-asset-id');
  const assetId = assetSelect.value;
  const asset = db.getAssetById(assetId);
  if (!asset) return;

  const borrower = document.getElementById('lend-borrower').value.trim();
  const date = document.getElementById('lend-date').value;
  const returnDate = document.getElementById('lend-return-date').value;
  const purpose = document.getElementById('lend-purpose').value.trim();

  const lendObj = {
    id: `LND-${Date.now()}`,
    assetId: asset.id,
    assetCode: asset.code,
    assetName: asset.name,
    borrower,
    date,
    returnDate,
    status: 'Dipinjam',
    purpose
  };

  db.saveLending(lendObj);
  closeModal('modal-peminjaman');
  showToast(`Peminjaman barang "${asset.name}" berhasil dicatat!`, 'success');

  renderLendingTable();
  updateNotificationCenter();
}

function handleReturnLending(lendingId) {
  db.returnLending(lendingId);
  showToast('Barang telah dikembalikan ke inventaris.', 'success');
  renderLendingTable();
  updateNotificationCenter();
}

/**
 * ========================================================
 * 14B. SECTION: BAST & PEMEGANG AMANAH ASET
 * ========================================================
 */
let currentActiveBASTId = null;

function renderBASTStats() {
  const list = db.getBASTList();
  const total = list.length;
  const active = list.filter(b => b.status === 'Aktif').length;
  const pusat = list.filter(b => b.isPusat).length;
  const cabang = list.filter(b => !b.isPusat).length;

  const statTotal = document.getElementById('stat-bast-total');
  const statActive = document.getElementById('stat-bast-active');
  const statPusat = document.getElementById('stat-bast-pusat');
  const statCabang = document.getElementById('stat-bast-cabang');

  if (statTotal) statTotal.textContent = total;
  if (statActive) statActive.textContent = active;
  if (statPusat) statPusat.textContent = pusat;
  if (statCabang) statCabang.textContent = cabang;
}

function renderBASTTable() {
  renderBASTStats();
  const tbody = document.getElementById('bast-table-body');
  if (!tbody) return;

  const searchQuery = (document.getElementById('bast-search')?.value || '').toLowerCase().trim();
  const filterRegion = document.getElementById('bast-filter-region')?.value || 'all';
  const filterStatus = document.getElementById('bast-filter-status')?.value || 'all';

  let list = db.getBASTList();

  if (filterRegion === 'pusat') {
    list = list.filter(b => b.isPusat);
  } else if (filterRegion === 'cabang') {
    list = list.filter(b => !b.isPusat);
  } else if (filterRegion !== 'all') {
    list = list.filter(b => b.region === filterRegion || (b.region && b.region.includes(filterRegion)));
  }

  if (filterStatus !== 'all') {
    list = list.filter(b => b.status === filterStatus);
  }

  if (searchQuery) {
    list = list.filter(b => 
      (b.docNo || '').toLowerCase().includes(searchQuery) ||
      (b.recipientName || '').toLowerCase().includes(searchQuery) ||
      (b.stambuk || '').toLowerCase().includes(searchQuery) ||
      (b.amanah || '').toLowerCase().includes(searchQuery) ||
      (b.region || '').toLowerCase().includes(searchQuery) ||
      (b.assetName || '').toLowerCase().includes(searchQuery) ||
      (b.assetCode || '').toLowerCase().includes(searchQuery) ||
      (b.assetSerial || '').toLowerCase().includes(searchQuery)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-12 text-slate-400">
          <div class="flex flex-col items-center justify-center space-y-2">
            <i data-lucide="file-x" class="w-10 h-10 text-slate-300 dark:text-slate-600"></i>
            <p class="text-xs font-semibold">Belum ada data Berita Acara Serah Terima (BAST)</p>
            <button onclick="openModalTambahBAST()" class="btn-primary text-xs mt-2">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> Buat Surat BAST Pertama
            </button>
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  tbody.innerHTML = list.map(b => {
    const isPusatBadge = b.isPusat
      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"><i data-lucide="building-2" class="w-3 h-3"></i> PUSAT</span>`
      : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"><i data-lucide="map-pin" class="w-3 h-3"></i> CABANG</span>`;

    const statusBadge = b.status === 'Aktif'
      ? `<span class="badge badge-success text-[10px] font-bold">Dipegang Aktif</span>`
      : `<span class="badge badge-secondary text-[10px] font-bold">Dikembalikan</span>`;

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td class="px-4 py-3.5">
          <div class="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">${b.docNo}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">${b.date}</div>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-bold text-xs text-slate-900 dark:text-slate-100">${b.recipientName}</div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span class="font-mono text-slate-600 dark:text-slate-300 font-semibold">${b.stambuk}</span>
            <span>•</span>
            <span class="truncate max-w-[140px]">${b.amanah}</span>
          </div>
        </td>
        <td class="px-4 py-3.5">
          <div class="mb-1">${isPusatBadge}</div>
          <div class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title="${b.region}">${b.region}</div>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-amber-500 cursor-pointer flex items-center gap-1 group" onclick="openModalDetailAset('${b.assetId}')" title="Klik untuk membuka detail master aset">
            <span>${b.assetName}</span>
            <i data-lucide="external-link" class="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity"></i>
          </div>
          <div class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <span class="font-mono text-amber-600 dark:text-amber-400">${b.assetCode}</span>
            ${b.assetSerial ? `<span>• SN: ${b.assetSerial}</span>` : ''}
          </div>
        </td>
        <td class="px-4 py-3.5 text-center">
          ${statusBadge}
        </td>
        <td class="px-4 py-3.5 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="printSingleBASTReport('${b.id}')" class="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Cetak Surat BAST & Pernyataan">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            <button onclick="openModalDetailBAST('${b.id}')" class="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Lihat Detail BAST">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="openModalEditBAST('${b.id}')" class="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit BAST">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            ${b.status === 'Aktif' ? `
              <button onclick="handleReturnBAST('${b.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Kembalikan Aset (Serah Terima Balik)">
                <i data-lucide="undo-2" class="w-4 h-4"></i>
              </button>
            ` : ''}
            <button onclick="handleDeleteBAST('${b.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus Data">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function populateBASTAssetDropdown(selectedAssetId = '') {
  const select = document.getElementById('bast-asset-select');
  if (!select) return;

  const assets = db.getAssets();
  select.innerHTML = '<option value="">-- Pilih Barang dari Database Aset --</option>' + assets.map(a => {
    const isSelected = a.id === selectedAssetId ? 'selected' : '';
    return `<option value="${a.id}" data-code="${a.code}" data-name="${a.name}" data-category="${a.categoryName}" data-serial="${a.serial || ''}" data-brand="${a.brand || ''}" ${isSelected}>${a.code} - ${a.name} (${a.categoryName})</option>`;
  }).join('');
}

function onBASTAssetSelectChange() {
  const select = document.getElementById('bast-asset-select');
  if (!select || select.selectedIndex <= 0) {
    document.getElementById('bast-asset-code-display').value = '';
    return;
  }
  const assetId = select.value;
  const opt = select.options[select.selectedIndex];
  const code = opt.getAttribute('data-code') || '';
  const category = opt.getAttribute('data-category') || '';
  const serial = opt.getAttribute('data-serial') || '';

  document.getElementById('bast-asset-code-display').value = `${code} (${category})`;
  if (serial && !document.getElementById('bast-asset-serial').value) {
    document.getElementById('bast-asset-serial').value = serial;
  }

  // Pre-fill recipient name jika aset sudah tercatat pemegang amanahnya
  const asset = db.getAssetById(assetId);
  const recipientInput = document.getElementById('bast-recipient-name');
  if (asset && recipientInput && !recipientInput.value) {
    const rawHolder = asset.usedBy || asset.dipergunakanOleh || asset.pic || '';
    if (rawHolder && rawHolder !== asset.roomName && !rawHolder.startsWith('Ruang') && !rawHolder.startsWith('Divisi')) {
      const namePart = rawHolder.split('(')[0].trim();
      recipientInput.value = namePart;
    }
  }
}

function autoGenerateBASTDocNo() {
  const list = db.getBASTList();
  const curYear = new Date().getFullYear();
  const nextNum = (list.length + 1).toString().padStart(3, '0');
  return `BAST/RIAYAH/${curYear}/${nextNum}`;
}

function openModalTambahBAST() {
  populateBASTAssetDropdown();
  populateBranchDropdowns();
  document.getElementById('modal-bast-title').textContent = 'Buat Berita Acara Serah Terima (BAST)';
  document.getElementById('form-bast').reset();
  document.getElementById('bast-form-id').value = '';
  document.getElementById('bast-doc-no').value = autoGenerateBASTDocNo();
  document.getElementById('bast-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('bast-clause').value = 'Sanggup menjaga, merawat, dan mengelola aset amanah dakwah ini dengan penuh tanggung jawab, tidak memindahtangankan tanpa izin tertulis, serta siap mengembalikan sewaktu-waktu saat masa penugasan berakhir.';
  document.getElementById('bast-asset-code-display').value = '';

  const branchSelect = document.getElementById('bast-branch-selector');
  if (branchSelect) branchSelect.value = '';

  openModal('modal-bast');
}

function openModalEditBAST(bastId) {
  const b = db.getBASTById(bastId);
  if (!b) return;

  populateBASTAssetDropdown(b.assetId);
  populateBranchDropdowns();
  document.getElementById('modal-bast-title').textContent = 'Edit Dokumen BAST';
  document.getElementById('bast-form-id').value = b.id;
  document.getElementById('bast-doc-no').value = b.docNo;
  document.getElementById('bast-date').value = b.date;
  document.getElementById('bast-recipient-name').value = b.recipientName;
  document.getElementById('bast-stambuk').value = b.stambuk;
  document.getElementById('bast-amanah').value = b.amanah;
  document.getElementById('bast-phone').value = b.phone || '';
  document.getElementById('bast-region').value = b.region;
  document.getElementById('bast-is-pusat').value = b.isPusat ? 'true' : 'false';
  document.getElementById('bast-asset-select').value = b.assetId;
  document.getElementById('bast-asset-code-display').value = `${b.assetCode} (${b.assetCategory})`;
  document.getElementById('bast-asset-serial').value = b.assetSerial || '';
  document.getElementById('bast-accessories').value = b.accessories || '';
  document.getElementById('bast-condition').value = b.condition || 'Baik Normal (Fungsi 100%)';
  document.getElementById('bast-clause').value = b.commitmentClause || '';
  document.getElementById('bast-notes').value = b.notes || '';

  // Match branch selector
  const branchSelect = document.getElementById('bast-branch-selector');
  if (branchSelect) {
    let matchedOption = Array.from(branchSelect.options).find(opt => opt.getAttribute('data-name') === b.region);
    if (matchedOption) {
      branchSelect.value = matchedOption.value;
    } else {
      branchSelect.value = 'custom';
    }
  }

  openModal('modal-bast');
}

function handleSaveBAST(event) {
  event.preventDefault();

  const id = document.getElementById('bast-form-id').value || `BAST-${Date.now()}`;
  const assetSelect = document.getElementById('bast-asset-select');
  const selectedOpt = assetSelect.options[assetSelect.selectedIndex];

  const assetId = assetSelect.value;
  const assetCode = selectedOpt ? (selectedOpt.getAttribute('data-code') || '') : '';
  const assetName = selectedOpt ? (selectedOpt.getAttribute('data-name') || '') : '';
  const assetCategory = selectedOpt ? (selectedOpt.getAttribute('data-category') || '') : '';

  const bastItem = {
    id: id,
    docNo: document.getElementById('bast-doc-no').value.trim().toUpperCase(),
    date: document.getElementById('bast-date').value,
    recipientName: document.getElementById('bast-recipient-name').value.trim(),
    stambuk: document.getElementById('bast-stambuk').value.trim(),
    amanah: document.getElementById('bast-amanah').value.trim(),
    phone: document.getElementById('bast-phone').value.trim(),
    region: document.getElementById('bast-region').value.trim(),
    isPusat: document.getElementById('bast-is-pusat').value === 'true',
    assetId: assetId,
    assetCode: assetCode,
    assetName: assetName,
    assetCategory: assetCategory,
    assetSerial: document.getElementById('bast-asset-serial').value.trim(),
    accessories: document.getElementById('bast-accessories').value.trim(),
    condition: document.getElementById('bast-condition').value,
    commitmentClause: document.getElementById('bast-clause').value.trim(),
    status: 'Aktif',
    notes: document.getElementById('bast-notes').value.trim()
  };

  db.saveBAST(bastItem);

  // Sinkronkan ke Data Master Aset (Konsolidasi Otomatis ke Buku Induk & KIB)
  const targetAsset = db.getAssetById(assetId) || db.getAssets().find(a => a.code === assetCode);
  if (targetAsset) {
    const holderText = `${bastItem.recipientName} (${bastItem.amanah || 'Penerima BAST'})`;
    targetAsset.pic = holderText;
    targetAsset.usedBy = holderText;
    targetAsset.dipergunakanOleh = holderText;
    targetAsset.documents = `BAST Resmi (${bastItem.docNo})`;
    targetAsset.kelengkapanDokumen = `BAST Resmi (${bastItem.docNo})`;
    targetAsset.bastId = bastItem.id;
    targetAsset.bastDocNo = bastItem.docNo;
    targetAsset.bastRecipient = bastItem.recipientName;
    targetAsset.bastDate = bastItem.date;

    // Jika ada nomor seri di BAST, sinkronkan ke catatan aset jika belum ada
    if (bastItem.assetSerial && (!targetAsset.notes || !targetAsset.notes.includes(bastItem.assetSerial))) {
      targetAsset.notes = targetAsset.notes && targetAsset.notes !== '-' ? `${targetAsset.notes} | SN: ${bastItem.assetSerial}` : `SN: ${bastItem.assetSerial}`;
      targetAsset.keterangan = targetAsset.notes;
    }

    db.saveAsset(targetAsset);
  }

  closeModal('modal-bast');
  showToast('✅ Berita Acara Serah Terima (BAST) berhasil disimpan & terkoneksi ke data aset!', 'success');
  renderBASTTable();
  renderAssetTable();
  renderRoomCards();
  renderKIBPage();
}

function handleReturnBAST(bastId) {
  const b = db.getBASTById(bastId);
  if (!b) return;

  if (confirm(`Apakah aset "${b.assetName}" telah diterima kembali dari ${b.recipientName}?`)) {
    db.returnBAST(bastId, 'Aset telah dikembalikan ke Riayah Pusat dalam kondisi baik.');

    // Kembalikan PIC & Pemegang Aset ke default ruangan / Riayah Pusat
    const targetAsset = db.getAssetById(b.assetId) || db.getAssets().find(a => a.code === b.assetCode);
    if (targetAsset) {
      targetAsset.pic = 'Pengurus Riayah Pusat';
      targetAsset.usedBy = targetAsset.roomName || 'Divisi Riayah Pusat';
      targetAsset.dipergunakanOleh = targetAsset.roomName || 'Divisi Riayah Pusat';
      targetAsset.bastId = null;
      targetAsset.bastDocNo = null;
      db.saveAsset(targetAsset);
    }

    showToast('Aset telah ditandai selesai/dikembalikan & status master aset diperbarui.', 'success');
    renderBASTTable();
    renderAssetTable();
    renderRoomCards();
    renderKIBPage();
  }
}

function handleDeleteBAST(bastId) {
  if (confirm('Apakah Anda yakin ingin menghapus arsip BAST ini?')) {
    db.deleteBAST(bastId);
    showToast('Data BAST berhasil dihapus.', 'info');
    renderBASTTable();
  }
}

function openModalDetailBAST(bastId) {
  const b = db.getBASTById(bastId);
  if (!b) return;

  currentActiveBASTId = bastId;
  const settings = db.getSettings();
  const detailContainer = document.getElementById('detail-bast-content');
  if (!detailContainer) return;

  const kopHTML = ReportEngine.renderKopSuratHTML(settings);

  detailContainer.innerHTML = `
    <div class="bg-white text-slate-950 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-inner font-serif">
      ${kopHTML}

      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase;">
          BERITA ACARA SERAH TERIMA (BAST)
        </h3>
        <h4 style="font-size: 11pt; font-weight: bold; margin: 2px 0 0; text-transform: uppercase;">
          DAN SURAT PERNYATAAN KESANGGUPAN PEMEGANG AMANAH ASET
        </h4>
        <p style="font-size: 10pt; font-family: monospace; margin-top: 4px; font-weight: bold;">
          Nomor: ${b.docNo}
        </p>
      </div>

      <p style="font-size: 10pt; line-height: 1.6; text-align: justify; margin-bottom: 12px;">
        Pada hari ini <strong>${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date(b.date))}</strong>, bertempat di <strong>${settings.city || 'Kubu Raya / Pontianak'}</strong>, telah dilakukan serah terima fasilitas / aset operasional dakwah antara pihak-pihak di bawah ini:
      </p>

      <!-- Pihak Penyerah & Penerima -->
      <table style="width: 100%; font-size: 9.5pt; margin-bottom: 15px; border-collapse: collapse;">
        <tr>
          <td style="width: 130px; font-weight: bold; vertical-align: top; padding: 2px 0;">I. Yang Menyerahkan</td>
          <td style="width: 10px; vertical-align: top;">:</td>
          <td><strong>${settings.assetOfficerName || 'Divisi Riayah Munzalan'}</strong> (${settings.assetOfficerTitle || 'Pengurus Aset & Sarana Prasarana'})</td>
        </tr>
        <tr>
          <td style="font-weight: bold; vertical-align: top; padding: 2px 0;">II. Yang Menerima</td>
          <td style="vertical-align: top;">:</td>
          <td><strong>${b.recipientName}</strong></td>
        </tr>
        <tr>
          <td style="padding-left: 20px; vertical-align: top;">• No. Stambuk / NIP</td>
          <td style="vertical-align: top;">:</td>
          <td><strong style="font-family: monospace;">${b.stambuk}</strong></td>
        </tr>
        <tr>
          <td style="padding-left: 20px; vertical-align: top;">• Amanah / Jabatan</td>
          <td style="vertical-align: top;">:</td>
          <td>${b.amanah}</td>
        </tr>
        <tr>
          <td style="padding-left: 20px; vertical-align: top;">• Wilayah Penugasan</td>
          <td style="vertical-align: top;">:</td>
          <td>${b.region} <strong>(${b.isPusat ? 'PUSAT' : 'CABANG / DAERAH'})</strong></td>
        </tr>
        <tr>
          <td style="padding-left: 20px; vertical-align: top;">• No. Kontak / WA</td>
          <td style="vertical-align: top;">:</td>
          <td>${b.phone || '-'}</td>
        </tr>
      </table>

      <!-- Rincian Aset Table -->
      <p style="font-size: 10pt; font-weight: bold; margin-bottom: 6px;">
        Dengan ini Pihak Pertama menyerahkan kepada Pihak Kedua fasilitas / aset inventaris dengan rincian:
      </p>

      <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: center; font-weight: bold;">
            <th style="border: 1px solid #000; padding: 6px;">Kode Aset</th>
            <th style="border: 1px solid #000; padding: 6px;">Nama Barang / Merek</th>
            <th style="border: 1px solid #000; padding: 6px;">No. Seri / Plat Nomor</th>
            <th style="border: 1px solid #000; padding: 6px;">Kelengkapan Barang</th>
            <th style="border: 1px solid #000; padding: 6px;">Kondisi Fisik</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">${b.assetCode}</td>
            <td style="border: 1px solid #000; padding: 6px;"><strong>${b.assetName}</strong><br><span style="font-size: 8pt; color: #555;">Kategori: ${b.assetCategory}</span></td>
            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: center;">${b.assetSerial || '-'}</td>
            <td style="border: 1px solid #000; padding: 6px;">${b.accessories || '-'}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${b.condition}</td>
          </tr>
        </tbody>
      </table>

      <!-- Klausul Pernyataan Kesanggupan -->
      <div style="border: 1px dashed #000; padding: 10px 14px; background: #fafafa; font-size: 8.5pt; line-height: 1.5; margin-bottom: 20px;">
        <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">
          KLAUSUL SURAT PERNYATAAN KESANGGUPAN PEMEGANG AMANAH:
        </p>
        <ol style="margin: 0; padding-left: 18px;">
          <li>Bersedia menjaga, merawat, dan memelihara aset amanah ini dengan sebaik-baiknya sesuai fungsinya.</li>
          <li>Menggunakan aset semata-mata untuk kelancaran tugas amanah dakwah/operasional lembaga dan tidak menyalahgunakan untuk kepentingan pribadi yang melanggar SOP.</li>
          <li>Tidak meminjamkan, menggadaikan, atau memindahtangankan aset kepada pihak ketiga tanpa izin tertulis dari Divisi Riayah/Pimpinan.</li>
          <li>Segera melaporkan apabila terjadi kebutuhan servis pemeliharaan berkala atau kejadian musibah tak terduga.</li>
          <li>Bersedia mengembalikan aset dalam kondisi lengkap, baik, dan bersih sewaktu-waktu masa amanah berakhir atau ada rotasi/mutasi penugasan.</li>
        </ol>
      </div>

      <!-- Signature Section 3 Pihak -->
      <div style="display: flex; justify-content: space-between; text-align: center; font-size: 9pt; margin-top: 25px;">
        <div style="width: 30%;">
          <p>Pihak Kedua (Yang Menerima),</p>
          <p style="font-weight: bold;">Pemegang Amanah</p>
          <div style="height: 55px;"></div>
          <p style="font-weight: bold; text-decoration: underline;">${b.recipientName}</p>
          <p style="font-size: 8pt; font-family: monospace;">Stambuk: ${b.stambuk}</p>
        </div>

        <div style="width: 30%;">
          <p>Mengetahui,</p>
          <p style="font-weight: bold;">${settings.leaderTitle || 'Pimpinan Yayasan'}</p>
          <div style="height: 55px;"></div>
          <p style="font-weight: bold; text-decoration: underline;">${settings.leaderName || 'Ust. H. Luqmanulhakim, M.Pd.'}</p>
          <p style="font-size: 8pt;">${settings.leaderNip ? 'NIP. ' + settings.leaderNip : ''}</p>
        </div>

        <div style="width: 30%;">
          <p>Pihak Pertama (Yang Menyerahkan),</p>
          <p style="font-weight: bold;">${settings.assetOfficerTitle || 'Pengurus Riayah'}</p>
          <div style="height: 55px;"></div>
          <p style="font-weight: bold; text-decoration: underline;">${settings.assetOfficerName || 'Divisi Riayah'}</p>
          <p style="font-size: 8pt;">Bagian Aset & Sarpras</p>
        </div>
      </div>

    </div>
  `;

  openModal('modal-detail-bast');
}

function printCurrentBAST() {
  const detailContainer = document.getElementById('detail-bast-content');
  if (!detailContainer) return;
  printIsolatedHTML(detailContainer.innerHTML);
}

function exportBASTExcel() {
  const list = db.getBASTList();
  if (!list || list.length === 0) {
    showToast('Belum ada data BAST untuk diekspor.', 'warning');
    return;
  }

  const exportData = list.map((b, idx) => ({
    'No': idx + 1,
    'No. Surat BAST': b.docNo,
    'Tanggal Serah Terima': b.date,
    'Nama Penerima': b.recipientName,
    'Nomor Stambuk / NIP': b.stambuk,
    'Amanah / Jabatan': b.amanah,
    'Wilayah Penugasan': b.region,
    'Tingkat Wilayah': b.isPusat ? 'Pusat' : 'Cabang / Daerah',
    'No. Kontak / WA': b.phone || '-',
    'Kode Aset': b.assetCode,
    'Nama Aset / Barang': b.assetName,
    'Kategori Aset': b.assetCategory,
    'No. Seri / Plat Nomor': b.assetSerial || '-',
    'Kelengkapan': b.accessories,
    'Kondisi Fisik': b.condition,
    'Status': b.status,
    'Catatan': b.notes || '-'
  }));

  if (window.XLSX) {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_BAST');
    XLSX.writeFile(wb, `Rekap_BAST_Pemegang_Aset_${new Date().getFullYear()}.xlsx`);
    showToast('✅ Data BAST berhasil diexport ke Excel!', 'success');
  } else {
    showToast('Modul Excel belum dimuat.', 'danger');
  }
}

/**
 * ========================================================
 * 14B. SECTION: MUTASI & PEMINDAHAN BARANG INVENTARIS
 * ========================================================
 */
let currentActiveBAMutasiId = null;

function populateMutasiFilterDropdowns() {
  const branchSelect = document.getElementById('filter-mutasi-branch');
  const divSelect = document.getElementById('filter-mutasi-division');
  const roomSelect = document.getElementById('filter-mutasi-room');

  if (branchSelect) {
    const branches = db.getBranches();
    const curVal = branchSelect.value;
    branchSelect.innerHTML = '<option value="">Semua Cabang / Wilayah</option>' + 
      branches.map(b => `<option value="${b.id}">${b.isPusat ? '🏢' : '📍'} ${b.name}</option>`).join('');
    branchSelect.value = curVal || '';
  }

  if (divSelect) {
    const divisions = db.getDivisions();
    const curVal = divSelect.value;
    divSelect.innerHTML = '<option value="">Semua Divisi Pengelola</option>' + 
      divisions.map(d => `<option value="${d.id}">🏢 ${d.name} (${d.code || 'DIV'})</option>`).join('');
    divSelect.value = curVal || '';
  }

  if (roomSelect) {
    const rooms = db.getRooms();
    const curVal = roomSelect.value;
    roomSelect.innerHTML = '<option value="">Semua Ruangan</option>' + 
      rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    roomSelect.value = curVal || '';
  }
}

function renderMutasiTable() {
  const tbody = document.getElementById('mutasi-table-body');
  const emptyState = document.getElementById('mutasi-empty-state');
  const countDisplay = document.getElementById('mutasi-count-display');

  if (!tbody) return;

  const allMutations = db.getMutations();
  let list = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterMutations(allMutations) : allMutations;

  // KPI Calculations
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let monthCount = 0;
  let divMutCount = 0;
  let branchMutCount = 0;

  list.forEach(m => {
    if (m.date && m.date.startsWith(currentMonthStr)) monthCount++;
    if ((m.fromDivisionId && m.toDivisionId && m.fromDivisionId !== m.toDivisionId) || 
        (m.fromDivisionName && m.toDivisionName && m.fromDivisionName !== m.toDivisionName)) {
      divMutCount++;
    }
    if ((m.fromBranchId && m.toBranchId && m.fromBranchId !== m.toBranchId) || 
        (m.fromBranchName && m.toBranchName && m.fromBranchName !== m.toBranchName)) {
      branchMutCount++;
    }
  });

  const statTotalEl = document.getElementById('stat-mutasi-total');
  const statMonthEl = document.getElementById('stat-mutasi-month');
  const statDivEl = document.getElementById('stat-mutasi-div');
  const statBranchEl = document.getElementById('stat-mutasi-branch');

  if (statTotalEl) statTotalEl.textContent = `${list.length} Transaksi`;
  if (statMonthEl) statMonthEl.textContent = `${monthCount} Transaksi`;
  if (statDivEl) statDivEl.textContent = `${divMutCount} Kali`;
  if (statBranchEl) statBranchEl.textContent = `${branchMutCount} Kali`;

  // Apply filters
  const search = (document.getElementById('filter-mutasi-search')?.value || '').toLowerCase().trim();
  const filterBranch = document.getElementById('filter-mutasi-branch')?.value || '';
  const filterDiv = document.getElementById('filter-mutasi-division')?.value || '';
  const filterRoom = document.getElementById('filter-mutasi-room')?.value || '';

  if (search) {
    list = list.filter(m => 
      (m.assetName && m.assetName.toLowerCase().includes(search)) ||
      (m.assetCode && m.assetCode.toLowerCase().includes(search)) ||
      (m.docNo && m.docNo.toLowerCase().includes(search)) ||
      (m.reason && m.reason.toLowerCase().includes(search)) ||
      (m.fromPj && m.fromPj.toLowerCase().includes(search)) ||
      (m.toPj && m.toPj.toLowerCase().includes(search)) ||
      (m.fromRoomName && m.fromRoomName.toLowerCase().includes(search)) ||
      (m.toRoomName && m.toRoomName.toLowerCase().includes(search))
    );
  }

  if (filterBranch) {
    list = list.filter(m => 
      m.fromBranchId === filterBranch || m.toBranchId === filterBranch ||
      m.fromBranchName === filterBranch || m.toBranchName === filterBranch
    );
  }

  if (filterDiv) {
    list = list.filter(m => 
      m.fromDivisionId === filterDiv || m.toDivisionId === filterDiv ||
      m.fromDivisionName === filterDiv || m.toDivisionName === filterDiv
    );
  }

  if (filterRoom) {
    list = list.filter(m => 
      m.fromRoomId === filterRoom || m.toRoomId === filterRoom ||
      m.fromRoomName === filterRoom || m.toRoomName === filterRoom
    );
  }

  if (countDisplay) countDisplay.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = list.map((m) => {
    let condBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Baik</span>';
    if (m.condition === 'Rusak Ringan' || m.condition === 'RR') {
      condBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">RR</span>';
    } else if (m.condition === 'Rusak Berat' || m.condition === 'RB') {
      condBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">RB</span>';
    }

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
        <td class="px-4 py-3">
          <div class="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 cursor-pointer hover:underline" onclick="printBAMutasi('${m.id}')" title="Klik untuk cetak Berita Acara">${m.docNo}</div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <i data-lucide="calendar" class="w-3 h-3"></i> ${m.date}
          </div>
          <div class="text-[10px] text-slate-400">Oleh: ${m.operator || 'Administrator'}</div>
        </td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-amber-500" onclick="openModalDetailAset('${m.assetId}')">${m.assetName}</div>
          <div class="font-mono text-[11px] text-slate-500 dark:text-slate-400">${m.assetCode}</div>
          <div class="text-[10px] text-slate-400">${m.categoryName || '-'} • <strong class="text-emerald-500">${m.qty || 1} ${m.unit || 'Unit'}</strong></div>
        </td>
        <td class="px-4 py-3">
          <div class="p-2 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 text-xs space-y-0.5">
            <div class="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <i data-lucide="door-closed" class="w-3 h-3"></i> ${m.fromRoomName || '-'}
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400">${m.fromDivisionName || 'Umum'}</div>
            <div class="text-[10px] text-slate-400">${m.fromBranchName || 'Pusat'} • PJ: <strong>${m.fromPj || '-'}</strong></div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="p-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 text-xs space-y-0.5">
            <div class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <i data-lucide="door-open" class="w-3 h-3"></i> ${m.toRoomName || '-'}
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400">${m.toDivisionName || 'Umum'}</div>
            <div class="text-[10px] text-slate-400">${m.toBranchName || 'Pusat'} • PJ: <strong>${m.toPj || '-'}</strong></div>
          </div>
        </td>
        <td class="px-4 py-3 max-w-xs">
          <div class="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2" title="${m.reason || '-'}">${m.reason || '-'}</div>
          <div class="mt-1 flex items-center gap-1.5">
            ${condBadge}
            ${m.notes ? `<span class="text-[10px] text-slate-400 truncate max-w-[150px]" title="${m.notes}">• ${m.notes}</span>` : ''}
          </div>
        </td>
        <td class="px-4 py-3 text-center">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <i data-lucide="check-circle-2" class="w-3 h-3"></i> Selesai
          </span>
        </td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="printBAMutasi('${m.id}')" class="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors" title="Lihat & Cetak Berita Acara (BA) Mutasi">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteMutationItem('${m.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus Riwayat Mutasi">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function onMutasiFilterChange() {
  renderMutasiTable();
}

function resetMutasiFilter() {
  if (document.getElementById('filter-mutasi-search')) document.getElementById('filter-mutasi-search').value = '';
  if (document.getElementById('filter-mutasi-branch')) document.getElementById('filter-mutasi-branch').value = '';
  if (document.getElementById('filter-mutasi-division')) document.getElementById('filter-mutasi-division').value = '';
  if (document.getElementById('filter-mutasi-room')) document.getElementById('filter-mutasi-room').value = '';
  renderMutasiTable();
  showToast('🔄 Filter riwayat mutasi di-reset', 'info');
}

function openModalMutasiAset(assetId = null) {
  const allAssets = db.getAssets().filter(a => a.status !== 'Dihapuskan');
  const assets = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterAssets(allAssets) : allAssets;

  const select = document.getElementById('mutasi-asset-select');
  if (select) {
    select.innerHTML = '<option value="">-- Pilih Barang yang Akan Dimutasi --</option>' +
      assets.map(a => `<option value="${a.id}">[${a.code}] ${a.name} • Lokasi: ${a.roomName || '-'} (${a.divisionName || 'Pusat'})</option>`).join('');
    if (assetId) {
      select.value = assetId;
    }
  }

  // Populate Destination Branch & Division
  const branchSelect = document.getElementById('mutasi-to-branch');
  const divSelect = document.getElementById('mutasi-to-div');

  if (branchSelect) {
    const branches = db.getBranches();
    branchSelect.innerHTML = branches.map(b => `<option value="${b.id}">${b.isPusat ? '🏢' : '📍'} ${b.name}</option>`).join('');
  }

  if (divSelect) {
    const divisions = db.getDivisions();
    divSelect.innerHTML = divisions.map(d => `<option value="${d.id}">🏢 ${d.name} (${d.code || 'DIV'})</option>`).join('');
  }

  // Set default date & generated BA Doc number
  const dateInput = document.getElementById('mutasi-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const docNoInput = document.getElementById('mutasi-doc-no');
  if (docNoInput) {
    const muts = db.getMutations();
    const seq = String(muts.length + 1).padStart(3, '0');
    const monthRoman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][new Date().getMonth()];
    docNoInput.value = `${seq}/BA-MUTASI/MKMM/${monthRoman}/${new Date().getFullYear()}`;
  }

  const reasonInput = document.getElementById('mutasi-reason');
  if (reasonInput) reasonInput.value = '';

  const notesInput = document.getElementById('mutasi-notes');
  if (notesInput) notesInput.value = '';

  onMutasiAssetSelectChange();
  onMutasiToScopeChange();

  openModal('modal-mutasi-aset');
}

function onMutasiAssetSelectChange() {
  const assetId = document.getElementById('mutasi-asset-select')?.value;
  const fromBranchEl = document.getElementById('mutasi-from-branch-display');
  const fromDivEl = document.getElementById('mutasi-from-div-display');
  const fromRoomEl = document.getElementById('mutasi-from-room-display');
  const fromPjEl = document.getElementById('mutasi-from-pj-display');
  const fromQtyEl = document.getElementById('mutasi-from-qty-badge');

  if (!assetId) {
    if (fromBranchEl) fromBranchEl.textContent = '-';
    if (fromDivEl) fromDivEl.textContent = '-';
    if (fromRoomEl) fromRoomEl.textContent = '-';
    if (fromPjEl) fromPjEl.textContent = '-';
    if (fromQtyEl) fromQtyEl.textContent = '0 Unit';
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) return;

  if (fromBranchEl) fromBranchEl.textContent = asset.branchName || 'Munzalan Pusat';
  if (fromDivEl) fromDivEl.textContent = asset.divisionName || 'Divisi Riayah & Sarpras';
  if (fromRoomEl) fromRoomEl.textContent = asset.roomName || 'Tanpa Ruangan';
  if (fromPjEl) fromPjEl.textContent = asset.pic || asset.pj || '-';
  if (fromQtyEl) fromQtyEl.textContent = `${asset.qty || 1} ${asset.unit || 'Unit'}`;

  const condEl = document.getElementById('mutasi-condition');
  if (condEl) {
    if (asset.condition === 'RR' || asset.condition === 'Rusak Ringan') condEl.value = 'Rusak Ringan';
    else if (asset.condition === 'RB' || asset.condition === 'Rusak Berat') condEl.value = 'Rusak Berat';
    else condEl.value = 'Baik';
  }
}

function onMutasiToScopeChange() {
  const branchId = document.getElementById('mutasi-to-branch')?.value || '';
  const divId = document.getElementById('mutasi-to-div')?.value || '';
  const roomSelect = document.getElementById('mutasi-to-room');

  if (!roomSelect) return;

  let rooms = db.getRooms();
  if (branchId) {
    rooms = rooms.filter(r => !r.branchId || r.branchId === branchId);
  }
  if (divId) {
    rooms = rooms.filter(r => !r.divisionId || r.divisionId === divId);
  }

  if (rooms.length === 0) {
    rooms = db.getRooms(); // fallback to all rooms if no specific room created under this sub-scope
  }

  roomSelect.innerHTML = rooms.map(r => `<option value="${r.id}">🚪 ${r.name} (${r.code || '-'})</option>`).join('');
  onMutasiToRoomChange();
}

function onMutasiToRoomChange() {
  const roomId = document.getElementById('mutasi-to-room')?.value;
  const pjInput = document.getElementById('mutasi-to-pj');
  const nipInput = document.getElementById('mutasi-to-pj-nip');

  if (!roomId) return;
  const room = db.getRoomById(roomId);
  if (room) {
    if (pjInput && room.pj) pjInput.value = room.pj;
    if (nipInput && room.pjNip) nipInput.value = room.pjNip;
  }
}

function submitMutasiForm(event = null, andPrint = false) {
  if (event && event.preventDefault) event.preventDefault();

  const assetId = document.getElementById('mutasi-asset-select')?.value;
  if (!assetId) {
    showToast('Silakan pilih barang yang akan dimutasi.', 'warning');
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) {
    showToast('Data aset tidak ditemukan.', 'danger');
    return;
  }

  const branchSelect = document.getElementById('mutasi-to-branch');
  const toBranchId = branchSelect?.value || '';
  const toBranchName = branchSelect?.selectedIndex >= 0 ? branchSelect.options[branchSelect.selectedIndex].text.replace(/^[🏢📍]\s*/, '') : 'Munzalan Pusat';

  const divSelect = document.getElementById('mutasi-to-div');
  const toDivisionId = divSelect?.value || '';
  const toDivisionName = divSelect?.selectedIndex >= 0 ? divSelect.options[divSelect.selectedIndex].text.replace(/^🏢\s*/, '').replace(/\s*\([^)]*\)$/, '') : 'Umum';

  const roomSelect = document.getElementById('mutasi-to-room');
  const toRoomId = roomSelect?.value || '';
  const toRoomName = roomSelect?.selectedIndex >= 0 ? roomSelect.options[roomSelect.selectedIndex].text.replace(/^🚪\s*/, '').replace(/\s*\([^)]*\)$/, '') : 'Ruangan Baru';

  const toPj = document.getElementById('mutasi-to-pj')?.value.trim() || '-';
  const toPjNip = document.getElementById('mutasi-to-pj-nip')?.value.trim() || '';
  const date = document.getElementById('mutasi-date')?.value || new Date().toISOString().split('T')[0];
  const docNo = document.getElementById('mutasi-doc-no')?.value.trim() || `BA-MUT/MKMM/${Date.now()}`;
  const condition = document.getElementById('mutasi-condition')?.value || 'Baik';
  const reason = document.getElementById('mutasi-reason')?.value.trim() || 'Perpindahan penempatan barang inventaris';
  const notes = document.getElementById('mutasi-notes')?.value.trim() || '';

  const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const operator = user ? `${user.displayName} (${user.role.toUpperCase()})` : 'Administrator';

  const mutationData = {
    docNo,
    date,
    assetId: asset.id,
    assetCode: asset.code,
    assetName: asset.name,
    categoryName: asset.categoryName || '-',
    brandType: asset.brandType || asset.brand || '-',
    qty: asset.qty || 1,
    unit: asset.unit || 'Unit',

    // Asal
    fromBranchId: asset.branchId || '',
    fromBranchName: asset.branchName || 'Munzalan Pusat',
    fromDivisionId: asset.divisionId || '',
    fromDivisionName: asset.divisionName || 'Divisi Riayah & Sarpras',
    fromRoomId: asset.roomId || '',
    fromRoomName: asset.roomName || 'Tanpa Ruangan',
    fromPj: asset.pic || asset.pj || '-',
    fromPjNip: '',

    // Tujuan
    toBranchId,
    toBranchName,
    toDivisionId,
    toDivisionName,
    toRoomId,
    toRoomName,
    toPj,
    toPjNip,

    reason,
    condition,
    notes,
    operator
  };

  const newMut = db.addMutation(mutationData);

  closeModal('modal-mutasi-aset');
  showToast(`✅ Barang "${asset.name}" berhasil dimutasi ke "${toRoomName}"!`, 'success');

  // Trigger re-renders
  renderMutasiTable();
  renderAssetTable();
  renderRoomCards();
  renderKIBPage();

  if (andPrint && newMut) {
    setTimeout(() => {
      printBAMutasi(newMut.id);
    }, 150);
  }
}

function printBAMutasi(mutationId) {
  const m = db.getMutationById(mutationId);
  if (!m) return;

  currentActiveBAMutasiId = mutationId;
  const settings = db.getSettings();
  const printArea = document.getElementById('ba-mutasi-print-area');
  if (!printArea) return;

  const kopHTML = ReportEngine.renderKopSuratHTML(settings);

  printArea.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; color: #000; font-family: 'Times New Roman', serif;">
      
      <!-- Kop Surat -->
      ${kopHTML}

      <!-- Document Title -->
      <div style="text-align: center; margin: 18px 0 20px 0;">
        <h3 style="font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase;">
          BERITA ACARA SERAH TERIMA & MUTASI BARANG INVENTARIS
        </h3>
        <p style="font-size: 10pt; margin: 4px 0 0 0; font-family: monospace;">
          Nomor: <strong>${m.docNo}</strong>
        </p>
      </div>

      <!-- Pembuka -->
      <p style="text-align: justify; margin-bottom: 12px; font-size: 9.5pt;">
        Pada hari ini, tanggal <strong>${m.date}</strong>, telah dilaksanakan serah terima pemindahan lokasi fisik (mutasi) dan peralihan tanggung jawab pengelolaan barang inventaris milik <strong>${settings.instansiName || 'Masjid Munzalan Mubarakan'}</strong> antara pihak-pihak di bawah ini:
      </p>

      <!-- Pihak 1 & Pihak 2 -->
      <div style="margin-bottom: 15px; font-size: 9.5pt;">
        
        <table style="width: 100%; border: none; margin-bottom: 8px;">
          <tr>
            <td style="width: 25px; vertical-align: top; font-weight: bold;">1.</td>
            <td style="width: 170px; vertical-align: top; font-weight: bold;">PIHAK PERTAMA (Asal)</td>
            <td style="width: 10px; vertical-align: top;">:</td>
            <td style="vertical-align: top;"><strong>${m.fromPj || 'Penanggung Jawab Asal'}</strong></td>
          </tr>
          <tr>
            <td></td>
            <td style="vertical-align: top; color: #444;">Unit Kerja / Divisi</td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;">${m.fromDivisionName || '-'} (${m.fromBranchName || 'Pusat'})</td>
          </tr>
          <tr>
            <td></td>
            <td style="vertical-align: top; color: #444;">Ruangan Asal</td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;">${m.fromRoomName || '-'}</td>
          </tr>
          <tr>
            <td></td>
            <td colspan="3" style="font-style: italic; font-size: 8.5pt; color: #555;">Selanjutnya disebut sebagai <strong>PIHAK YANG MENYERAHKAN</strong>.</td>
          </tr>
        </table>

        <table style="width: 100%; border: none; margin-top: 10px;">
          <tr>
            <td style="width: 25px; vertical-align: top; font-weight: bold;">2.</td>
            <td style="width: 170px; vertical-align: top; font-weight: bold;">PIHAK KEDUA (Tujuan)</td>
            <td style="width: 10px; vertical-align: top;">:</td>
            <td style="vertical-align: top;"><strong>${m.toPj || 'Penanggung Jawab Baru'}</strong> ${m.toPjNip ? `(NIP/Stambuk: ${m.toPjNip})` : ''}</td>
          </tr>
          <tr>
            <td></td>
            <td style="vertical-align: top; color: #444;">Unit Kerja / Divisi Baru</td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;">${m.toDivisionName || '-'} (${m.toBranchName || 'Pusat'})</td>
          </tr>
          <tr>
            <td></td>
            <td style="vertical-align: top; color: #444;">Ruangan Penempatan Baru</td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><strong>${m.toRoomName || '-'}</strong></td>
          </tr>
          <tr>
            <td></td>
            <td colspan="3" style="font-style: italic; font-size: 8.5pt; color: #555;">Selanjutnya disebut sebagai <strong>PIHAK YANG MENERIMA</strong>.</td>
          </tr>
        </table>

      </div>

      <!-- Tabel Rincian Barang -->
      <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 9pt; margin-bottom: 14px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: center; font-weight: bold;">
            <th style="border: 1px solid #000; padding: 6px; width: 30px;">No</th>
            <th style="border: 1px solid #000; padding: 6px; width: 130px;">Kode Aset</th>
            <th style="border: 1px solid #000; padding: 6px;">Nama & Spesifikasi Barang</th>
            <th style="border: 1px solid #000; padding: 6px; width: 70px;">Jumlah</th>
            <th style="border: 1px solid #000; padding: 6px; width: 90px;">Kondisi Fisik</th>
            <th style="border: 1px solid #000; padding: 6px; width: 140px;">Mutasi Dari → Ke</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">${m.assetCode}</td>
            <td style="border: 1px solid #000; padding: 6px;">
              <strong>${m.assetName}</strong><br>
              <span style="font-size: 8pt; color: #444;">Merk/Tipe: ${m.brandType || '-'} • Kategori: ${m.categoryName || '-'}</span>
              ${m.notes ? `<br><span style="font-size: 8pt; color: #666; font-style: italic;">Kelengkapan: ${m.notes}</span>` : ''}
            </td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${m.qty || 1} ${m.unit || 'Unit'}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${m.condition || 'Baik'}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 8pt;">
              <span style="color: #c00;">[Asal]</span> ${m.fromRoomName}<br>
              ↓<br>
              <span style="color: #080; font-weight: bold;">[Tujuan]</span> ${m.toRoomName}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Alasan & Keterangan -->
      <div style="border: 1px dashed #444; padding: 8px 12px; background: #fafafa; font-size: 9pt; margin-bottom: 15px;">
        <strong>Alasan / Keperluan Mutasi:</strong><br>
        <span>${m.reason || 'Pemindahan penempatan barang inventaris operasional lembaga.'}</span>
      </div>

      <p style="text-align: justify; font-size: 9pt; margin-bottom: 25px;">
        Terhitung sejak tanggal ditandatanganinya Berita Acara ini, barang inventaris tersebut di atas telah berpindah lokasi penempatan secara sah, dan kewajiban perawatan, pencatatan fisik, serta penggunaan operasional beralih sepenuhnya kepada <strong>PIHAK KEDUA</strong>.
      </p>

      <!-- Kolom Tanda Tangan 3 Pihak -->
      <div style="display: flex; justify-content: space-between; text-align: center; font-size: 9pt;">
        <div style="width: 30%;">
          <p>Pihak Pertama (Yang Menyerahkan),</p>
          <p style="font-weight: bold;">PJ Ruangan Asal</p>
          <div style="height: 50px;"></div>
          <p style="font-weight: bold; text-decoration: underline;">${m.fromPj || '..................................'}</p>
        </div>

        <div style="width: 30%;">
          <p>Pihak Kedua (Yang Menerima),</p>
          <p style="font-weight: bold;">PJ Ruangan Tujuan</p>
          <div style="height: 50px;"></div>
          <p style="font-weight: bold; text-decoration: underline;">${m.toPj || '..................................'}</p>
          ${m.toPjNip ? `<p style="font-size: 8pt;">NIP: ${m.toPjNip}</p>` : ''}
        </div>

        <div style="width: 30%;">
          <p>Mengetahui,</p>
          <p style="font-weight: bold;">${settings.leaderTitle || 'Kepala Sarana & Prasarana'}</p>
          <div style="height: 50px;"></div>
          <p style="font-weight: bold; text-decoration: underline;">${settings.leaderName || 'Ust. H. Luqmanulhakim, M.Pd.'}</p>
          <p style="font-size: 8pt;">${settings.leaderNip ? 'NIP. ' + settings.leaderNip : ''}</p>
        </div>
      </div>

    </div>
  `;

  openModal('modal-print-ba-mutasi');
}

function printBAMutasiDirect() {
  const printArea = document.getElementById('ba-mutasi-print-area');
  if (!printArea) return;
  printIsolatedHTML(printArea.innerHTML);
}

function exportMutasiToExcel() {
  const list = db.getMutations();
  if (!list || list.length === 0) {
    showToast('Belum ada data mutasi untuk diekspor.', 'warning');
    return;
  }

  const exportData = list.map((m, idx) => ({
    'No': idx + 1,
    'No. Berita Acara (BA)': m.docNo,
    'Tanggal Mutasi': m.date,
    'Kode Aset': m.assetCode,
    'Nama Barang': m.assetName,
    'Kategori': m.categoryName || '-',
    'Merk / Tipe': m.brandType || '-',
    'Jumlah (Qty)': `${m.qty || 1} ${m.unit || 'Unit'}`,
    'Kondisi Saat Mutasi': m.condition || 'Baik',
    'Wilayah Asal': m.fromBranchName || '-',
    'Divisi Asal': m.fromDivisionName || '-',
    'Ruangan Asal': m.fromRoomName || '-',
    'PJ Asal': m.fromPj || '-',
    'Wilayah Tujuan': m.toBranchName || '-',
    'Divisi Tujuan': m.toDivisionName || '-',
    'Ruangan Tujuan': m.toRoomName || '-',
    'PJ Tujuan': m.toPj || '-',
    'NIP PJ Tujuan': m.toPjNip || '-',
    'Alasan Pemindahan': m.reason || '-',
    'Catatan / Kelengkapan': m.notes || '-',
    'Petugas / Operator': m.operator || 'Administrator'
  }));

  if (window.XLSX) {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Mutasi_Aset');
    XLSX.writeFile(wb, `Rekap_Mutasi_Barang_Inventaris_${new Date().getFullYear()}.xlsx`);
    showToast('✅ Riwayat Mutasi Aset berhasil diexport ke Excel!', 'success');
  } else {
    showToast('Modul Excel belum dimuat.', 'danger');
  }
}

function deleteMutationItem(mutationId) {
  if (confirm('Apakah Anda yakin ingin menghapus catatan riwayat mutasi ini?')) {
    db.deleteMutation(mutationId);
    showToast('Data riwayat mutasi berhasil dihapus.', 'info');
    renderMutasiTable();
  }
}

/**
 * ========================================================
 * 15. SECTION 7: LAPORAN (A4 / F4) & EXPORT
 * ========================================================
 */
function setPaperSize(size) {
  ReportEngine.setPaper(size);
  updateReportPreview();
}

function updateReportPreview() {
  const type = document.getElementById('report-type')?.value || 'buku-induk';
  const filterRoom = document.getElementById('report-filter-room')?.value || '';
  const filterCat = document.getElementById('report-filter-kategori')?.value || '';
  const sheet = document.getElementById('report-preview-sheet');
  const settings = db.getSettings();

  if (!sheet) return;

  let allAssets = db.getAssets();
  if (filterRoom) allAssets = allAssets.filter(a => a.roomId === filterRoom);
  if (filterCat) allAssets = allAssets.filter(a => a.categoryName === filterCat);

  let outputHTML = '';

  if (type === 'buku-induk') {
    outputHTML = ReportEngine.generateBukuIndukHTML(allAssets, settings);
  } else if (type === 'rekap-kategori') {
    outputHTML = ReportEngine.generateCategoryFinancialReportHTML(settings);
  } else if (type === 'kir') {
    const roomId = filterRoom || (db.getRooms()[0]?.id || '');
    outputHTML = ReportEngine.generateKIRHTML(roomId, settings);
  } else if (type === 'kondisi-rusak') {
    outputHTML = ReportEngine.generateDamagedAssetsHTML(settings);
  } else if (type === 'disposal') {
    outputHTML = ReportEngine.generateDisposalReportHTML(settings);
  } else if (type === 'depresiasi') {
    outputHTML = ReportEngine.generateDepreciationReportHTML(settings);
  } else if (type === 'bhp-stok') {
    outputHTML = ReportEngine.generateBHPStockReportHTML(settings);
  } else if (type === 'bhp-mutasi') {
    outputHTML = ReportEngine.generateBHPMutasiReportHTML(settings);
  }

  sheet.innerHTML = outputHTML;
}

function printGeneratedReport() {
  const sheet = document.getElementById('report-preview-sheet');
  if (!sheet) return;
  printIsolatedHTML(sheet.innerHTML);
}

function exportToExcel() {
  ReportEngine.exportAssetsToExcel(null, `Buku_Induk_Inventaris_${new Date().getFullYear()}.xlsx`);
}

function exportToExcelFiltered() {
  const type = document.getElementById('report-type')?.value || 'buku-induk';
  const filterRoom = document.getElementById('report-filter-room')?.value || '';
  const filterCat = document.getElementById('report-filter-kategori')?.value || '';

  if (type === 'bhp-stok') {
    exportBHPToExcel();
    return;
  }
  if (type === 'bhp-mutasi') {
    exportBHPHistoryToExcel();
    return;
  }
  if (type === 'rekap-kategori') {
    ReportEngine.exportCategoryFinancialToExcel(`Rekapitulasi_Dana_per_Kategori_${new Date().getFullYear()}.xlsx`);
    return;
  }

  let assets = db.getAssets();
  if (filterRoom) assets = assets.filter(a => a.roomId === filterRoom);
  if (filterCat) assets = assets.filter(a => a.categoryName === filterCat);

  ReportEngine.exportAssetsToExcel(assets, 'Laporan_Inventaris_Terfilter.xlsx');
}

function printIsolatedHTML(contentHTML) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Cetak Dokumen Laporan</title>
      <style>
        body { font-family: "Times New Roman", Times, serif; margin: 15mm; color: #000; }
        .doc-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt; }
        .doc-table th, .doc-table td { border: 1px solid #000; padding: 6px 8px; }
        .doc-table th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
        .doc-signatures { margin-top: 35px; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 10pt; }
        .sig-block { width: 220px; text-align: center; }
        .sig-space { height: 60px; }
        @media print {
          @page { margin: 15mm; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      ${contentHTML}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * ========================================================
 * 16. SECTION 8: PENGATURAN (SETTINGS)
 * ========================================================
 */
function switchSettingsTab(subtabId) {
  document.querySelectorAll('.settings-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.settings-subview').forEach(view => view.classList.add('hidden'));

  const activeBtn = document.getElementById(`set-tab-${subtabId}`);
  const activeView = document.getElementById(`set-view-${subtabId}`);

  if (activeBtn) activeBtn.classList.add('active');
  if (activeView) activeView.classList.remove('hidden');

  if (subtabId === 'cabang') renderSettingsBranchTable();
  if (subtabId === 'divisi') renderSettingsDivisionsTable();
  if (subtabId === 'kode') loadCodeSettingsForm();
  if (subtabId === 'ruangan') renderSettingsRoomTable();
  if (subtabId === 'kategori') renderSettingsCategoryTable();
  if (subtabId === 'users') {
    if (!AuthEngine.isAdmin()) {
      showToast('⛔ Tab ini hanya untuk Administrator.', 'danger');
      switchSettingsTab('profil');
      return;
    }
    renderUsersTable();
  }
  if (subtabId === 'database') {
    if (!AuthEngine.isAdmin()) {
      showToast('⛔ Tab ini hanya untuk Administrator.', 'danger');
      switchSettingsTab('profil');
      return;
    }
    loadSupabaseSettingsUI();
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * ========================================================
 * MASTER CABANG & WILAYAH PENUGASAN CRUD
 * ========================================================
 */
function renderSettingsBranchTable() {
  const branches = db.getBranches();
  const tbody = document.getElementById('settings-branch-table-body');
  if (!tbody) return;

  if (branches.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-slate-400">
          Belum ada data cabang / wilayah. Klik "Tambah Cabang / Wilayah Baru" untuk menambahkan.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = branches.map(b => {
    const badgeType = b.isPusat 
      ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">🏢 Wilayah Pusat</span>'
      : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">📍 Cabang Daerah</span>';

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td class="px-4 py-3.5">
          <div class="font-bold text-slate-900 dark:text-slate-100">${b.name}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">${b.address || '-'}</div>
        </td>
        <td class="px-4 py-3.5">${badgeType}</td>
        <td class="px-4 py-3.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">${b.code || '-'}</td>
        <td class="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">${b.pj || '-'}</td>
        <td class="px-4 py-3.5 text-xs font-mono text-slate-600 dark:text-slate-400">${b.phone || '-'}</td>
        <td class="px-4 py-3.5 text-center">
          <button onclick="openModalEditCabang('${b.id}')" class="px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors">
            Edit
          </button>
          <button onclick="handleDeleteBranch('${b.id}')" class="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1">
            Hapus
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openModalTambahCabang() {
  const form = document.getElementById('form-cabang');
  if (form) form.reset();
  const idInput = document.getElementById('branch-form-id');
  if (idInput) idInput.value = '';
  const title = document.getElementById('modal-cabang-title');
  if (title) title.textContent = 'Tambah Cabang / Wilayah Baru';
  openModal('modal-cabang');
}

function openModalEditCabang(branchId) {
  const branch = db.getBranchById(branchId);
  if (!branch) return;

  const title = document.getElementById('modal-cabang-title');
  if (title) title.textContent = 'Edit Data Cabang / Wilayah';

  document.getElementById('branch-form-id').value = branch.id;
  document.getElementById('branch-name').value = branch.name || '';
  document.getElementById('branch-is-pusat').value = branch.isPusat ? 'true' : 'false';
  document.getElementById('branch-code').value = branch.code || '';
  document.getElementById('branch-pj').value = branch.pj || '';
  document.getElementById('branch-phone').value = branch.phone || '';
  document.getElementById('branch-address').value = branch.address || '';

  openModal('modal-cabang');
}

function handleSaveBranch(event) {
  event.preventDefault();

  const id = document.getElementById('branch-form-id').value || `BR-${Date.now()}`;
  const name = document.getElementById('branch-name').value.trim();
  const isPusat = document.getElementById('branch-is-pusat').value === 'true';
  const code = (document.getElementById('branch-code').value.trim() || '').toUpperCase();
  const pj = document.getElementById('branch-pj').value.trim();
  const phone = document.getElementById('branch-phone').value.trim();
  const address = document.getElementById('branch-address').value.trim();

  const branchObj = { id, name, isPusat, code, pj, phone, address };

  const existing = db.getBranchById(id);
  if (existing) {
    db.updateBranch(branchObj);
    showToast(`✅ Data wilayah "${name}" berhasil diperbarui!`, 'success');
  } else {
    db.addBranch(branchObj);
    showToast(`✅ Cabang/wilayah "${name}" berhasil ditambahkan!`, 'success');
  }

  closeModal('modal-cabang');
  renderSettingsBranchTable();
  populateBranchDropdowns();
}

function handleDeleteBranch(branchId) {
  const branch = db.getBranchById(branchId);
  if (!branch) return;

  if (confirm(`Apakah Anda yakin ingin menghapus wilayah/cabang "${branch.name}"?`)) {
    db.deleteBranch(branchId);
    showToast(`Wilayah "${branch.name}" berhasil dihapus.`, 'info');
    renderSettingsBranchTable();
    populateBranchDropdowns();
  }
}

function renderSettingsDivisionsTable() {
  const divisions = db.getDivisions();
  const tbody = document.getElementById('settings-division-table-body');
  if (!tbody) return;

  if (divisions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-slate-400">
          Belum ada data divisi. Klik "Tambah Divisi Baru" untuk menambahkan unit/divisi.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = divisions.map(d => {
    const logoHtml = d.logo ? `
      <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center mx-auto overflow-hidden">
        <img src="${d.logo}" alt="${d.name}" class="max-w-full max-h-full object-contain">
      </div>
    ` : `
      <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
        <i data-lucide="image" class="w-5 h-5"></i>
      </div>
    `;

    return `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
        <td class="px-4 py-3 text-center">
          ${logoHtml}
        </td>
        <td class="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
          ${d.name}
        </td>
        <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
          ${d.parent || '-'}
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            ${d.code || '-'}
          </span>
        </td>
        <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
          ${d.pj || '-'}
        </td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openModalTambahDivisi('${d.id}')" class="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors" title="Edit Divisi & Ganti Logo">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteDivision('${d.id}')" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors" title="Hapus Divisi">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openModalTambahDivisi(divId = null) {
  const title = document.getElementById('modal-divisi-title');
  const idInput = document.getElementById('form-divisi-id');
  const nameInput = document.getElementById('form-divisi-name');
  const parentInput = document.getElementById('form-divisi-parent');
  const codeInput = document.getElementById('form-divisi-code');
  const pjInput = document.getElementById('form-divisi-pj');
  const previewImg = document.getElementById('form-divisi-preview-img');
  const placeholderIcon = document.getElementById('form-divisi-placeholder-icon');
  const logoInput = document.getElementById('form-divisi-logo-input');

  if (logoInput) logoInput.value = '';

  if (divId) {
    const d = db.getDivisionById(divId);
    if (!d) return;
    if (title) title.textContent = 'Edit Divisi & Logo';
    if (idInput) idInput.value = d.id;
    if (nameInput) nameInput.value = d.name;
    if (parentInput) parentInput.value = d.parent || '';
    if (codeInput) codeInput.value = d.code || '';
    if (pjInput) pjInput.value = d.pj || '';
    temporaryDivisionLogo = d.logo || '';
  } else {
    if (title) title.textContent = 'Tambah Divisi / Unit Baru';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (parentInput) parentInput.value = 'Masjid Munzalan Mubarakan';
    if (codeInput) codeInput.value = '';
    if (pjInput) pjInput.value = '';
    temporaryDivisionLogo = '';
  }

  if (temporaryDivisionLogo) {
    if (previewImg) {
      previewImg.src = temporaryDivisionLogo;
      previewImg.classList.remove('hidden');
    }
    if (placeholderIcon) placeholderIcon.classList.add('hidden');
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.classList.add('hidden');
    }
    if (placeholderIcon) placeholderIcon.classList.remove('hidden');
  }

  openModal('modal-tambah-divisi');
}

function previewDivisionLogo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawData = e.target.result;
    // Auto-compress image to max 400x400 to prevent localStorage quota issues
    const img = new Image();
    img.onload = () => {
      const maxDim = 400;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      temporaryDivisionLogo = canvas.toDataURL('image/png', 0.9);

      const previewImg = document.getElementById('form-divisi-preview-img');
      const placeholderIcon = document.getElementById('form-divisi-placeholder-icon');
      if (previewImg) {
        previewImg.src = temporaryDivisionLogo;
        previewImg.classList.remove('hidden');
      }
      if (placeholderIcon) placeholderIcon.classList.add('hidden');
    };
    img.onerror = () => {
      temporaryDivisionLogo = rawData;
    };
    img.src = rawData;
  };
  reader.readAsDataURL(file);
}

function saveDivisionForm(event) {
  if (event) event.preventDefault();
  const id = document.getElementById('form-divisi-id')?.value;
  const name = (document.getElementById('form-divisi-name')?.value || '').trim();
  const parent = (document.getElementById('form-divisi-parent')?.value || '').trim();
  const code = (document.getElementById('form-divisi-code')?.value || '').trim().toUpperCase();
  const pj = (document.getElementById('form-divisi-pj')?.value || '').trim();

  if (!name) {
    showToast('Nama Divisi wajib diisi.', 'warning');
    return;
  }

  try {
    const activeDb = window.db || (typeof db !== 'undefined' ? db : null);
    if (!activeDb) {
      throw new Error('Database belum siap dimuat. Silakan muat ulang halaman.');
    }

    if (id) {
      const existing = activeDb.getDivisionById(id);
      if (existing) {
        existing.name = name;
        existing.parent = parent;
        existing.code = code;
        existing.pj = pj;
        existing.logo = temporaryDivisionLogo || existing.logo;
        activeDb.updateDivision(existing);
        showToast(`Divisi "${name}" berhasil diperbarui!`, 'success');
      }
    } else {
      const newDiv = {
        id: 'DIV-' + Date.now().toString().slice(-4),
        name,
        parent: parent || 'Masjid Munzalan Mubarakan',
        code: code || 'DIV',
        pj: pj || '',
        logo: temporaryDivisionLogo || 'logo-munzalan.png'
      };
      activeDb.addDivision(newDiv);
      showToast(`Divisi "${name}" berhasil ditambahkan!`, 'success');
    }

    closeModal('modal-tambah-divisi');
    if (typeof renderSettingsDivisionsTable === 'function') renderSettingsDivisionsTable();
    if (typeof populateStickerDivisionDropdown === 'function') populateStickerDivisionDropdown();
    if (typeof populateUserScopeDropdowns === 'function') populateUserScopeDropdowns();
    if (typeof renderStickerCenter === 'function') renderStickerCenter();
  } catch (err) {
    console.error('Error saving division:', err);
    showToast('Gagal menyimpan divisi: ' + err.message, 'danger');
  }
}

function deleteDivision(id) {
  const activeDb = window.db || (typeof db !== 'undefined' ? db : null);
  if (!activeDb) return;
  const d = activeDb.getDivisionById(id);
  if (!d) return;

  if (confirm(`Yakin ingin menghapus divisi "${d.name}"?`)) {
    activeDb.deleteDivision(id);
    showToast(`Divisi "${d.name}" berhasil dihapus.`, 'warning');
    if (typeof renderSettingsDivisionsTable === 'function') renderSettingsDivisionsTable();
    if (typeof populateStickerDivisionDropdown === 'function') populateStickerDivisionDropdown();
    if (typeof populateUserScopeDropdowns === 'function') populateUserScopeDropdowns();
    if (typeof renderStickerCenter === 'function') renderStickerCenter();
  }
}

// Explicit window bindings
window.openModalTambahDivisi = openModalTambahDivisi;
window.previewDivisionLogo = previewDivisionLogo;
window.saveDivisionForm = saveDivisionForm;
window.deleteDivision = deleteDivision;

function renderSettingsRoomTable() {
  const allRooms = db.getRooms();
  const rooms = (typeof AuthEngine !== 'undefined') ? AuthEngine.filterRooms(allRooms) : allRooms;
  const tbody = document.getElementById('settings-room-table-body');
  if (!tbody) return;

  if (rooms.length === 0) {
    const scope = (typeof AuthEngine !== 'undefined') ? AuthEngine.getScope() : null;
    const scopeLabel = (scope && scope.name && !AuthEngine.isAdmin()) ? `untuk ${scope.name}` : '';
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-slate-400">
          Belum ada master ruangan ${scopeLabel}. Klik "+ Tambah Ruangan" untuk menambahkan.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rooms.map(r => {
    const div = r.divisionId ? db.getDivisionById(r.divisionId) : null;
    const divName = div ? div.name : (r.divisionName || 'Standar Lembaga');
    const divLogo = div && div.logo ? div.logo : 'logo-munzalan.png';
    const branchName = r.branchName || 'Munzalan Pusat';

    return `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
        <td class="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
              <i data-lucide="door-closed" class="w-4 h-4"></i>
            </span>
            <div>
              <div class="flex items-center gap-1.5 font-bold">
                ${r.code ? `<span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-extrabold border border-blue-500/20">${r.code}</span>` : ''}
                <span>${r.name}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
          <span class="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <i data-lucide="map-pin" class="w-3 h-3 text-amber-500"></i> ${branchName}
          </span>
        </td>
        <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
          ${r.floor || '-'}
        </td>
        <td class="px-4 py-3">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-semibold">
            <img src="${divLogo}" alt="Logo" class="w-4 h-4 object-contain rounded">
            <span class="truncate max-w-[140px]" title="${divName}">${divName}</span>
          </div>
        </td>
        <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
          <div class="font-semibold">${r.pj || '-'}</div>
          <div class="text-[10px] text-amber-500/90 font-medium">${r.pjNip ? 'Amanah: ' + r.pjNip : ''}</div>
        </td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openModalTambahRuangan('${r.id}')" class="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors" title="Edit Ruangan & Hubungkan Divisi">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteRoom('${r.id}')" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors" title="Hapus Ruangan">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

window.renderSettingsRoomTable = renderSettingsRoomTable;
window.openModalTambahRuangan = openModalTambahRuangan;
window.openModalEditRuangan = openModalTambahRuangan;
window.openEditCurrentRoomModal = openEditCurrentRoomModal;
window.saveRoomForm = saveRoomForm;
window.deleteRoom = deleteRoom;
window.handleDeleteRoom = deleteRoom;

function loadProfileSettingsForm() {
  const s = (typeof db !== 'undefined' && db.getScopeSettings) ? db.getScopeSettings() : db.getSettings();
  const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;

  document.getElementById('cfg-instansi-name').value = s.instansiName || '';
  document.getElementById('cfg-instansi-parent').value = s.instansiParent || '';
  document.getElementById('cfg-instansi-address').value = s.instansiAddress || '';
  document.getElementById('cfg-instansi-phone').value = s.instansiPhone || '';
  document.getElementById('cfg-instansi-email').value = s.instansiEmail || '';
  document.getElementById('cfg-leader-title').value = s.leaderTitle || '';
  document.getElementById('cfg-leader-name').value = s.leaderName || '';
  document.getElementById('cfg-leader-nip').value = s.leaderNip || '';
  document.getElementById('cfg-asset-officer-title').value = s.assetOfficerTitle || '';
  document.getElementById('cfg-asset-officer-name').value = s.assetOfficerName || '';
  document.getElementById('cfg-city').value = s.city || '';
  document.getElementById('cfg-use-kop-banner').checked = !!s.useKopBanner;

  temporaryKopBanner = s.kopBannerImage || '';
  temporaryLogo = s.logoImage || '';

  const kopImg = document.getElementById('cfg-kop-preview-img');
  const kopPlaceholder = document.getElementById('cfg-kop-placeholder');
  if (temporaryKopBanner && kopImg && kopPlaceholder) {
    kopImg.src = temporaryKopBanner;
    kopImg.classList.remove('hidden');
    kopPlaceholder.classList.add('hidden');
  } else if (kopImg && kopPlaceholder) {
    kopImg.src = '';
    kopImg.classList.add('hidden');
    kopPlaceholder.classList.remove('hidden');
  }

  const logoImg = document.getElementById('cfg-logo-preview-img');
  const logoPlaceholder = document.getElementById('cfg-logo-placeholder-icon');
  if (temporaryLogo && logoImg && logoPlaceholder) {
    logoImg.src = temporaryLogo;
    logoImg.classList.remove('hidden');
    logoPlaceholder.classList.add('hidden');
  } else if (logoImg && logoPlaceholder) {
    logoImg.src = '';
    logoImg.classList.add('hidden');
    logoPlaceholder.classList.remove('hidden');
  }

  document.getElementById('cfg-depreciation-enabled').checked = s.depreciationEnabled !== false;
  document.getElementById('cfg-residual-rate').value = s.residualRate || 0;

  loadCodeSettingsForm();
}

function saveProfileSettings(notify = false) {
  const updated = {
    instansiName: document.getElementById('cfg-instansi-name').value.trim(),
    instansiParent: document.getElementById('cfg-instansi-parent').value.trim(),
    instansiAddress: document.getElementById('cfg-instansi-address').value.trim(),
    instansiPhone: document.getElementById('cfg-instansi-phone').value.trim(),
    instansiEmail: document.getElementById('cfg-instansi-email').value.trim(),
    leaderTitle: document.getElementById('cfg-leader-title').value.trim(),
    leaderName: document.getElementById('cfg-leader-name').value.trim(),
    leaderNip: document.getElementById('cfg-leader-nip').value.trim(),
    assetOfficerTitle: document.getElementById('cfg-asset-officer-title').value.trim(),
    assetOfficerName: document.getElementById('cfg-asset-officer-name').value.trim(),
    city: document.getElementById('cfg-city').value.trim(),
    kopBannerImage: temporaryKopBanner,
    useKopBanner: document.getElementById('cfg-use-kop-banner').checked,
    logoImage: temporaryLogo
  };

  if (typeof db !== 'undefined' && db.saveScopeSettings) {
    db.saveScopeSettings(null, updated);
  } else {
    db.saveSettings({ ...db.getSettings(), ...updated });
  }

  updateHeaderInstansiInfo();
  if (notify) {
    const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
    const label = user && user.scopeName ? user.scopeName : 'Lembaga';
    showToast(`✅ Pengaturan Profil & Kop Surat (${label}) berhasil disimpan!`, 'success');
  }
}

function openModalTambahRuangan(roomId = null) {
  const title = document.getElementById('modal-room-title');
  const idInput = document.getElementById('form-room-id');
  const codeInput = document.getElementById('form-room-code');
  const nameInput = document.getElementById('form-room-name');
  const floorInput = document.getElementById('form-room-floor');
  const branchSelect = document.getElementById('form-room-branch');
  const branchBadge = document.getElementById('form-room-branch-badge');
  const divSelect = document.getElementById('form-room-division');
  const divBadge = document.getElementById('form-room-division-badge');
  const pjInput = document.getElementById('form-room-pj');
  const nipInput = document.getElementById('form-room-nip');

  const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();
  const isDivisi = (typeof AuthEngine !== 'undefined') && AuthEngine.isDivisi();
  const isWilayah = (typeof AuthEngine !== 'undefined') && AuthEngine.isWilayah();

  // Populate Branch dropdown
  const branches = db.getBranches();
  const pusatBranch = branches.find(b => b.isPusat) || branches[0];

  if (branchSelect) {
    branchSelect.innerHTML = branches.map(b => `<option value="${b.id}">${b.isPusat ? '🏢' : '📍'} ${b.name}</option>`).join('');
    // Auto-lock user's branch if user is wilayah
    if (isWilayah && (user?.scopeId || user?.scopeName)) {
      let targetBranch = branches.find(b => (user?.scopeId && b.id === user.scopeId) || (user?.scopeName && b.name.toLowerCase() === user.scopeName.toLowerCase()));
      if (targetBranch) branchSelect.value = targetBranch.id;
      branchSelect.disabled = true;
      branchSelect.classList.add('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
      if (branchBadge) branchBadge.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold"><i data-lucide="lock" class="w-3 h-3"></i> [${targetBranch?.name || user.scopeName || 'Cabang'}]</span>`;
    } else if (isDivisi) {
      // Divisi user is automatically stationed at Pusat
      if (pusatBranch) branchSelect.value = pusatBranch.id;
      branchSelect.disabled = true;
      branchSelect.classList.add('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
      if (branchBadge) branchBadge.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold"><i data-lucide="lock" class="w-3 h-3"></i> [${pusatBranch?.name || 'Munzalan Pusat'}]</span>`;
    } else {
      branchSelect.disabled = false;
      branchSelect.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
      if (branchBadge) branchBadge.innerHTML = `<span class="text-[10px] text-slate-400">Pilih wilayah cabang</span>`;
    }
  }

  // Populate Division dropdown in room modal
  const divisions = db.getDivisions();
  const settings = db.getSettings();
  if (divSelect) {
    divSelect.innerHTML = `<option value="">🏛️ Standar Lembaga (${settings.instansiName || 'Munzalan'})</option>` +
      divisions.map(d => `<option value="${d.id}">🏢 ${d.name} (${d.code || 'DIV'})</option>`).join('');
    
    // Auto-lock user's division if user is divisi
    if (isDivisi) {
      let targetDiv = null;
      if (user?.scopeId) {
        targetDiv = divisions.find(d => d.id === user.scopeId || d.name.toLowerCase() === user.scopeId.toLowerCase());
      }
      if (!targetDiv && user?.scopeName) {
        targetDiv = divisions.find(d => d.name.toLowerCase() === user.scopeName.toLowerCase() || d.id === user.scopeName);
      }
      if (!targetDiv && user?.displayName) {
        targetDiv = divisions.find(d => user.displayName.toLowerCase().includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(user.displayName.toLowerCase()));
      }
      if (!targetDiv && divisions.length > 0) {
        targetDiv = divisions[0];
      }

      if (targetDiv) {
        divSelect.value = targetDiv.id;
      }
      divSelect.disabled = true;
      divSelect.classList.add('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
      const divLabel = targetDiv ? targetDiv.name : (user?.scopeName || user?.displayName || 'Divisi');
      if (divBadge) divBadge.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold"><i data-lucide="lock" class="w-3 h-3"></i> [${divLabel}]</span>`;
    } else {
      divSelect.disabled = false;
      divSelect.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-80');
      if (divBadge) divBadge.innerHTML = `<span class="text-[10px] text-slate-400">Otomatis untuk KIR & Stiker</span>`;
    }
  }

  if (roomId) {
    const r = db.getRooms().find(x => x.id === roomId);
    if (!r) return;
    if (title) title.textContent = 'Edit Ruangan & Lokasi';
    if (idInput) idInput.value = r.id;
    if (codeInput) codeInput.value = r.code || '';
    if (nameInput) nameInput.value = r.name;
    if (floorInput) floorInput.value = r.floor || '';
    if (branchSelect && r.branchId && (!isWilayah || !user?.scopeId) && !isDivisi) branchSelect.value = r.branchId;
    if (divSelect && r.divisionId && (!isDivisi || !user?.scopeId)) divSelect.value = r.divisionId;
    if (pjInput) pjInput.value = r.pj || '';
    if (nipInput) nipInput.value = r.pjNip || '';
  } else {
    if (title) title.textContent = 'Tambah Ruangan Baru';
    if (idInput) idInput.value = '';
    if (codeInput) codeInput.value = '';
    if (nameInput) nameInput.value = '';
    if (floorInput) floorInput.value = '';
    if (pjInput) pjInput.value = '';
    if (nipInput) nipInput.value = '';
  }

  previewRoomDivisionLogo();
  if (window.lucide) lucide.createIcons();
  openModal('modal-tambah-ruangan');
}

function previewRoomDivisionLogo() {
  const divSelect = document.getElementById('form-room-division');
  const previewBox = document.getElementById('form-room-division-preview');
  if (!divSelect || !previewBox) return;

  const divId = divSelect.value;
  if (!divId) {
    const s = db.getSettings();
    previewBox.innerHTML = `
      <img src="${s.logoImage || 'logo-munzalan.png'}" class="w-5 h-5 object-contain rounded border border-slate-200">
      <span>Menggunakan Logo Standar Lembaga: <strong>${s.instansiName || 'Munzalan'}</strong></span>
    `;
  } else {
    const d = db.getDivisionById(divId);
    if (d) {
      previewBox.innerHTML = `
        <img src="${d.logo || 'logo-munzalan.png'}" class="w-5 h-5 object-contain rounded border border-slate-200">
        <span>Logo Divisi: <strong>${d.name}</strong> (${d.parent || '-'})</span>
      `;
    }
  }
}

function generateRoomCodeHelper(name) {
  if (!name) return 'RUM';
  const words = name.trim().split(/\s+/);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    return (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  } else {
    return name.slice(0, 4).toUpperCase();
  }
}

function saveRoomForm(event) {
  event.preventDefault();
  const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isDivisi = (typeof AuthEngine !== 'undefined') && AuthEngine.isDivisi();
  const isWilayah = (typeof AuthEngine !== 'undefined') && AuthEngine.isWilayah();

  const id = document.getElementById('form-room-id').value;
  const name = document.getElementById('form-room-name').value.trim();
  const codeRaw = document.getElementById('form-room-code')?.value.trim();
  const code = (codeRaw || generateRoomCodeHelper(name)).toUpperCase();
  const floor = document.getElementById('form-room-floor').value.trim();
  
  const branchSelect = document.getElementById('form-room-branch');
  const branches = db.getBranches();
  const pusatBranch = branches.find(b => b.isPusat) || branches[0];

  let branchId = null;
  if (isWilayah && user?.scopeId) {
    branchId = user.scopeId;
  } else if (isDivisi) {
    branchId = pusatBranch ? pusatBranch.id : 'BR-001';
  } else {
    branchId = branchSelect ? branchSelect.value : (pusatBranch ? pusatBranch.id : 'BR-001');
  }

  let branchName = '';
  if (branchId) {
    const b = db.getBranchById(branchId);
    branchName = b ? b.name : (user?.scopeId === branchId ? user.scopeName : (pusatBranch ? pusatBranch.name : 'Munzalan Pusat'));
  }

  const divSelect = document.getElementById('form-room-division');
  const divisions = db.getDivisions();
  let divisionId = '';
  if (isDivisi) {
    let matchedDiv = null;
    if (user?.scopeId) matchedDiv = divisions.find(d => d.id === user.scopeId || d.name.toLowerCase() === user.scopeId.toLowerCase());
    if (!matchedDiv && user?.scopeName) matchedDiv = divisions.find(d => d.name.toLowerCase() === user.scopeName.toLowerCase() || d.id === user.scopeName);
    if (!matchedDiv && user?.displayName) matchedDiv = divisions.find(d => user.displayName.toLowerCase().includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(user.displayName.toLowerCase()));
    divisionId = matchedDiv ? matchedDiv.id : (divSelect?.value || user?.scopeId || '');
  } else {
    divisionId = divSelect ? divSelect.value : '';
  }

  let divisionName = '';
  if (divisionId) {
    const d = db.getDivisionById(divisionId);
    divisionName = d ? d.name : (user?.scopeName || user?.displayName || 'Standar Lembaga');
  }

  const pj = document.getElementById('form-room-pj').value.trim();
  const pjNip = document.getElementById('form-room-nip').value.trim();

  if (!name) {
    showToast('Nama Ruangan wajib diisi.', 'warning');
    return;
  }

  let rooms = db.getRooms();

  if (id) {
    const idx = rooms.findIndex(r => r.id === id);
    if (idx !== -1) {
      rooms[idx] = {
        ...rooms[idx],
        code,
        name,
        floor,
        branchId,
        branchName,
        divisionId,
        divisionName,
        pj,
        pjNip
      };
      db.save(STORAGE_KEYS.ROOMS, rooms);
      showToast(`✅ Ruangan "${name}" (${code}) berhasil diperbarui!`, 'success');
    }
  } else {
    const newRoom = {
      id: 'RM-' + Date.now().toString().slice(-4),
      code,
      name,
      floor,
      branchId,
      branchName,
      divisionId,
      divisionName,
      pj,
      pjNip
    };
    rooms.push(newRoom);
    db.save(STORAGE_KEYS.ROOMS, rooms);
    showToast(`✅ Ruangan "${name}" (${code}) berhasil ditambahkan!`, 'success');
  }

  closeModal('modal-tambah-ruangan');
  renderSettingsRoomTable();
  if (typeof populateRoomDropdowns === 'function') populateRoomDropdowns();
  if (typeof populateStickerDropdowns === 'function') populateStickerDropdowns();
  if (typeof renderRoomCards === 'function') renderRoomCards();
  if (typeof selectRoom === 'function') selectRoom(id || rooms[rooms.length - 1]?.id);
  if (typeof renderStickerCenter === 'function') renderStickerCenter();
  if (typeof populateDropdowns === 'function') populateDropdowns();
  if (typeof renderKIRPage === 'function') renderKIRPage();
}

function deleteRoom(id) {
  const rooms = db.getRooms();
  const target = rooms.find(r => r.id === id);
  if (!target) return;

  if (confirm(`Yakin ingin menghapus ruangan "${target.name}"?`)) {
    const updated = rooms.filter(r => r.id !== id);
    db.save(STORAGE_KEYS.ROOMS, updated);
    showToast(`Ruangan "${target.name}" berhasil dihapus.`, 'warning');
    renderSettingsRoomTable();
    if (typeof populateRoomDropdowns === 'function') populateRoomDropdowns();
    if (typeof populateStickerDropdowns === 'function') populateStickerDropdowns();
    if (typeof renderKIRPage === 'function') renderKIRPage();
    if (typeof renderRoomCards === 'function') renderRoomCards();
    if (typeof renderStickerCenter === 'function') renderStickerCenter();
    if (typeof populateDropdowns === 'function') populateDropdowns();
  }
}

function loadSettingsForm() {
  const s = db.getSettings();
  document.getElementById('cfg-instansi-name').value = s.instansiName || '';
  document.getElementById('cfg-instansi-parent').value = s.instansiParent || '';
  document.getElementById('cfg-instansi-address').value = s.instansiAddress || '';
  document.getElementById('cfg-instansi-phone').value = s.instansiPhone || '';
  document.getElementById('cfg-instansi-email').value = s.instansiEmail || '';
  document.getElementById('cfg-leader-title').value = s.leaderTitle || '';
  document.getElementById('cfg-leader-name').value = s.leaderName || '';
  document.getElementById('cfg-leader-nip').value = s.leaderNip || '';
  document.getElementById('cfg-asset-officer-title').value = s.assetOfficerTitle || '';
  document.getElementById('cfg-asset-officer-name').value = s.assetOfficerName || '';
  document.getElementById('cfg-city').value = s.city || '';
  document.getElementById('cfg-use-kop-banner').checked = !!s.useKopBanner;

  temporaryKopBanner = s.kopBannerImage || '';
  temporaryLogo = s.logoImage || '';

  const kopImg = document.getElementById('cfg-kop-preview-img');
  const kopPlaceholder = document.getElementById('cfg-kop-placeholder');
  if (temporaryKopBanner && kopImg && kopPlaceholder) {
    kopImg.src = temporaryKopBanner;
    kopImg.classList.remove('hidden');
    kopPlaceholder.classList.add('hidden');
  }

  const logoImg = document.getElementById('cfg-logo-preview-img');
  const logoPlaceholder = document.getElementById('cfg-logo-placeholder-icon');
  if (temporaryLogo && logoImg && logoPlaceholder) {
    logoImg.src = temporaryLogo;
    logoImg.classList.remove('hidden');
    logoPlaceholder.classList.add('hidden');
  }

  document.getElementById('cfg-depreciation-enabled').checked = s.depreciationEnabled !== false;
  document.getElementById('cfg-residual-rate').value = s.residualRate || 0;

  loadCodeSettingsForm();
}

function handleUploadKopBanner(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    temporaryKopBanner = e.target.result;
    const img = document.getElementById('cfg-kop-preview-img');
    const placeholder = document.getElementById('cfg-kop-placeholder');
    if (img && placeholder) {
      img.src = temporaryKopBanner;
      img.classList.remove('hidden');
      placeholder.classList.add('hidden');
    }
    document.getElementById('cfg-use-kop-banner').checked = true;
    showToast('Banner Kop Surat berhasil dimuat. Klik Simpan Pengaturan.', 'info');
  };
  reader.readAsDataURL(file);
}

function removeKopBanner() {
  temporaryKopBanner = '';
  const img = document.getElementById('cfg-kop-preview-img');
  const placeholder = document.getElementById('cfg-kop-placeholder');
  if (img && placeholder) {
    img.src = '';
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }
  document.getElementById('cfg-use-kop-banner').checked = false;
  saveProfileSettings();
}

function handleUploadLogo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    temporaryLogo = e.target.result;
    const img = document.getElementById('cfg-logo-preview-img');
    const placeholder = document.getElementById('cfg-logo-placeholder-icon');
    if (img && placeholder) {
      img.src = temporaryLogo;
      img.classList.remove('hidden');
      placeholder.classList.add('hidden');
    }
  };
  reader.readAsDataURL(file);
}

function saveDepreciationSettings() {
  const current = db.getSettings();
  const updated = {
    ...current,
    depreciationEnabled: document.getElementById('cfg-depreciation-enabled').checked,
    residualRate: parseFloat(document.getElementById('cfg-residual-rate').value) || 0
  };
  db.saveSettings(updated);
  showToast('Pengaturan penyusutan berhasil disimpan!', 'success');
  renderAssetTable();
  renderDashboard();
  updateNotificationCenter();
}

/**
 * ========================================================
 * PENGATURAN FORMAT KODE ASET
 * ========================================================
 */
function loadCodeSettingsForm() {
  const s = db.getSettings();
  const prefixElem = document.getElementById('cfg-code-prefix');
  const sepElem = document.getElementById('cfg-code-separator');
  const yearElem = document.getElementById('cfg-code-year');
  const catElem = document.getElementById('cfg-code-cat');
  const roomElem = document.getElementById('cfg-code-room');
  const digitsElem = document.getElementById('cfg-code-digits');
  const seqElem = document.getElementById('cfg-code-seq-mode');

  if (prefixElem) prefixElem.value = s.codePrefix !== undefined ? s.codePrefix : '';
  if (sepElem) sepElem.value = s.codeSeparator !== undefined ? s.codeSeparator : '-';
  if (yearElem) yearElem.value = s.codeIncludeYear || 'YYYY';
  if (catElem) catElem.checked = s.codeIncludeCategory !== false;
  if (roomElem) roomElem.checked = s.codeIncludeRoom !== false;
  if (digitsElem) digitsElem.value = s.codeDigits || '3';
  if (seqElem) seqElem.value = s.codeSequenceMode || 'category_room';

  updateCodeSettingsPreview();
}

function updateCodeSettingsPreview() {
  const prefix = (document.getElementById('cfg-code-prefix')?.value || '').trim().toUpperCase();
  const sep = document.getElementById('cfg-code-separator')?.value !== undefined ? document.getElementById('cfg-code-separator').value : '-';
  const yearOpt = document.getElementById('cfg-code-year')?.value || 'YYYY';
  const includeCat = document.getElementById('cfg-code-cat')?.checked;
  const includeRoom = document.getElementById('cfg-code-room')?.checked;
  const digits = parseInt(document.getElementById('cfg-code-digits')?.value) || 3;

  const curYear = new Date().getFullYear().toString();
  let yearPart = '';
  if (yearOpt === 'YYYY') yearPart = curYear;
  else if (yearOpt === 'YY') yearPart = curYear.slice(-2);

  const catCode = includeCat ? 'ELE' : '';
  const roomCode = includeRoom ? 'RUT' : '';
  const numPart = '1'.padStart(digits, '0');

  const parts = [];
  if (prefix) parts.push(prefix);
  if (catCode) parts.push(catCode);
  if (roomCode) parts.push(roomCode);
  if (yearPart) parts.push(yearPart);
  parts.push(numPart);

  const previewCode = parts.join(sep);

  const previewElem = document.getElementById('cfg-code-preview');
  if (previewElem) previewElem.textContent = previewCode;

  // Update breakdown tags
  const prefixTag = document.getElementById('cfg-preview-prefix-tag');
  if (prefixTag) {
    prefixTag.textContent = prefix ? `Prefix: ${prefix}` : 'Tanpa Prefix';
    prefixTag.style.opacity = prefix ? '1' : '0.4';
  }

  const catTag = document.getElementById('cfg-preview-cat-tag');
  if (catTag) {
    catTag.textContent = includeCat ? 'Kategori: ELE' : 'Tanpa Kategori';
    catTag.style.opacity = includeCat ? '1' : '0.4';
  }

  const roomTag = document.getElementById('cfg-preview-room-tag');
  if (roomTag) {
    roomTag.textContent = includeRoom ? 'Lokasi: RUT' : 'Tanpa Lokasi';
    roomTag.style.opacity = includeRoom ? '1' : '0.4';
  }

  const yearTag = document.getElementById('cfg-preview-year-tag');
  if (yearTag) {
    yearTag.textContent = yearPart ? `Tahun: ${yearPart}` : 'Tanpa Tahun';
    yearTag.style.opacity = yearPart ? '1' : '0.4';
  }

  const numTag = document.getElementById('cfg-preview-num-tag');
  if (numTag) {
    numTag.textContent = `Kode/No: ${numPart}`;
  }
}

function applyCodePreset(presetKey) {
  const prefixInput = document.getElementById('cfg-code-prefix');
  const sepInput = document.getElementById('cfg-code-separator');
  const yearInput = document.getElementById('cfg-code-year');
  const catInput = document.getElementById('cfg-code-cat');
  const roomInput = document.getElementById('cfg-code-room');
  const digitsInput = document.getElementById('cfg-code-digits');
  const seqInput = document.getElementById('cfg-code-seq-mode');

  if (!prefixInput || !sepInput || !yearInput || !catInput || !digitsInput || !seqInput) return;

  if (presetKey === 'munzalan' || presetKey === 'standar') {
    prefixInput.value = '';
    sepInput.value = '-';
    yearInput.value = 'YYYY';
    catInput.checked = true;
    if (roomInput) roomInput.checked = true;
    digitsInput.value = '3';
    seqInput.value = 'category_room';
  } else if (presetKey === 'slash') {
    prefixInput.value = '';
    sepInput.value = '/';
    yearInput.value = 'YYYY';
    catInput.checked = true;
    if (roomInput) roomInput.checked = true;
    digitsInput.value = '3';
    seqInput.value = 'category_room';
  } else if (presetKey === 'dot') {
    prefixInput.value = '';
    sepInput.value = '.';
    yearInput.value = 'YYYY';
    catInput.checked = true;
    if (roomInput) roomInput.checked = true;
    digitsInput.value = '3';
    seqInput.value = 'category_room';
  } else if (presetKey === 'noyear') {
    prefixInput.value = '';
    sepInput.value = '-';
    yearInput.value = 'none';
    catInput.checked = true;
    if (roomInput) roomInput.checked = true;
    digitsInput.value = '3';
    seqInput.value = 'category_room';
  } else if (presetKey === 'prefix') {
    prefixInput.value = 'AST';
    sepInput.value = '-';
    yearInput.value = 'YYYY';
    catInput.checked = true;
    if (roomInput) roomInput.checked = true;
    digitsInput.value = '3';
    seqInput.value = 'category_room';
  }

  updateCodeSettingsPreview();
  showToast('Template preset diterapkan. Klik "Simpan Pengaturan" untuk menyimpan permanen.', 'info');
}

function saveCodeSettings() {
  const current = db.getSettings();
  const updated = {
    ...current,
    codePrefix: (document.getElementById('cfg-code-prefix')?.value || '').trim().toUpperCase(),
    codeSeparator: document.getElementById('cfg-code-separator')?.value !== undefined ? document.getElementById('cfg-code-separator').value : '-',
    codeIncludeYear: document.getElementById('cfg-code-year')?.value || 'YYYY',
    codeIncludeCategory: document.getElementById('cfg-code-cat')?.checked !== false,
    codeIncludeRoom: document.getElementById('cfg-code-room')?.checked !== false,
    codeDigits: parseInt(document.getElementById('cfg-code-digits')?.value) || 3,
    codeSequenceMode: document.getElementById('cfg-code-seq-mode')?.value || 'category_room'
  };

  db.saveSettings(updated);
  showToast('✅ Pengaturan format kode aset standar berhasil disimpan!', 'success');
}

function resetCodeSettingsDefault() {
  applyCodePreset('munzalan');
}

/**
 * ========================================================
 * 17. MASTER RUANGAN & KATEGORI CRUD
 * ========================================================
 */
function openModalEditRuangan(roomId) {
  openModalTambahRuangan(roomId);
}

function openEditCurrentRoomModal() {
  if (typeof currentSelectedRoomId !== 'undefined' && currentSelectedRoomId) {
    openModalTambahRuangan(currentSelectedRoomId);
  }
}

function handleDeleteRoom(roomId) {
  deleteRoom(roomId);
}

function renderSettingsCategoryTable() {
  const cats = db.getCategories();
  const tbody = document.getElementById('settings-category-table-body');
  if (!tbody) return;

  tbody.innerHTML = cats.map(c => `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td class="px-4 py-3 font-mono font-bold text-xs text-amber-500">${c.code}</td>
      <td class="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">${c.name}</td>
      <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">${c.lifespan} Tahun</td>
      <td class="px-4 py-3 text-center">
        <button onclick="handleDeleteCategory('${c.id}')" class="p-1 text-rose-500 hover:underline">Hapus</button>
      </td>
    </tr>
  `).join('');
}

function openModalTambahKategori() {
  document.getElementById('form-kategori').reset();
  openModal('modal-kategori');
}

function handleSaveCategory(event) {
  event.preventDefault();
  const code = document.getElementById('cat-code').value.trim().toUpperCase();
  const name = document.getElementById('cat-name').value.trim();
  const lifespan = parseFloat(document.getElementById('cat-lifespan').value) || 4;
  const id = `CAT-${Date.now()}`;

  db.saveCategory({ id, code, name, lifespan });
  closeModal('modal-kategori');
  showToast(`Kategori "${name}" berhasil ditambahkan!`, 'success');

  renderSettingsCategoryTable();
  populateDropdowns();
}

function handleDeleteCategory(catId) {
  if (confirm('Hapus kategori ini?')) {
    db.deleteCategory(catId);
    showToast('Kategori dihapus.', 'info');
    renderSettingsCategoryTable();
    populateDropdowns();
  }
}

/**
 * ========================================================
 * 18. REVALUASI & PENYESUAIAN NILAI
 * ========================================================
 */
function openModalRevaluasi(assetId) {
  const asset = db.getAssetById(assetId);
  if (!asset) return;

  document.getElementById('reval-asset-id').value = asset.id;
  document.getElementById('reval-name-label').textContent = asset.name;
  document.getElementById('reval-initial-price-label').textContent = DepreciationEngine.formatRupiah(asset.price);
  document.getElementById('reval-new-price').value = asset.price;

  openModal('modal-revaluasi');
}

function handleSaveRevaluation(event) {
  event.preventDefault();
  const assetId = document.getElementById('reval-asset-id').value;
  const asset = db.getAssetById(assetId);
  if (!asset) return;

  const newPrice = parseFloat(document.getElementById('reval-new-price').value) || 0;
  const reason = document.getElementById('reval-reason').value;
  const notes = document.getElementById('reval-notes').value.trim();

  const oldPrice = asset.price;
  asset.price = newPrice;
  db.saveAsset(asset);

  db.saveRevaluation({
    id: `REV-${Date.now()}`,
    assetId: asset.id,
    assetCode: asset.code,
    oldPrice,
    newPrice,
    reason,
    notes,
    date: new Date().toISOString()
  });

  closeModal('modal-revaluasi');
  closeModal('modal-detail-aset');
  showToast(`Nilai aset "${asset.name}" berhasil diperbarui menjadi ${DepreciationEngine.formatRupiah(newPrice)}`, 'success');

  renderAssetTable();
  renderDashboard();
  updateNotificationCenter();
}

/**
 * ========================================================
 * 19. BACKUP & RESTORE DATABASE JSON
 * ========================================================
 */
function exportFullDatabaseJSON() {
  const jsonStr = db.exportDatabaseJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_AsetPro_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('File backup database berhasil diunduh!', 'success');
}

function importFullDatabaseJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const success = db.importDatabaseJSON(e.target.result);
    if (success) {
      showToast('Database berhasil dipulihkan dari file backup!', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      showToast('Format file JSON tidak valid.', 'danger');
    }
  };
  reader.readAsText(file);
}

function resetToSampleData() {
  if (confirm('PERINGATAN: Seluruh data akan di-reset ke data bawaan sistem. Lanjutkan?')) {
    db.resetToDefault();
    showToast('Data berhasil di-reset ke awal.', 'info');
    setTimeout(() => window.location.reload(), 800);
  }
}

/**
 * ========================================================
 * 20. BATCH IMPORT DARI EXCEL
 * ========================================================
 */
function openBatchImportModal() {
  const container = document.getElementById('import-scope-info-container');
  const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();
  const divisions = (typeof db !== 'undefined' && db.getDivisions) ? db.getDivisions() : [];
  const branches = (typeof db !== 'undefined' && db.getBranches) ? db.getBranches() : [];

  if (container) {
    if (!isAdmin && user && user.role === 'divisi') {
      container.innerHTML = `
        <div class="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="p-2 rounded-xl bg-blue-500/20 text-blue-500 font-bold">
              <i data-lucide="building-2" class="w-5 h-5"></i>
            </span>
            <div>
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Divisi Pengelola Otomatis</div>
              <div class="text-xs font-bold text-slate-900 dark:text-slate-100">${user.scopeName || user.displayName}</div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400">Seluruh aset yang diimpor akan otomatis dialokasikan ke divisi ini.</div>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 flex items-center gap-1">
            <i data-lucide="lock" class="w-3 h-3"></i> Terkunci Divisi
          </span>
        </div>
      `;
    } else if (!isAdmin && user && user.role === 'wilayah') {
      container.innerHTML = `
        <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="p-2 rounded-xl bg-emerald-500/20 text-emerald-500 font-bold">
              <i data-lucide="map-pin" class="w-5 h-5"></i>
            </span>
            <div>
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Cabang / Wilayah Otomatis</div>
              <div class="text-xs font-bold text-slate-900 dark:text-slate-100">${user.scopeName || user.displayName}</div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400">Seluruh aset yang diimpor akan otomatis dialokasikan ke cabang ini.</div>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <i data-lucide="lock" class="w-3 h-3"></i> Terkunci Wilayah
          </span>
        </div>
      `;
    } else {
      // Admin: show interactive target allocation selector
      container.innerHTML = `
        <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <i data-lucide="crown" class="w-4 h-4"></i>
              <span>Hak Akses Administrator: Target Alokasi Data</span>
            </div>
            <span class="text-[10px] text-slate-400 font-medium">Bebas alokasi semua divisi & cabang</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Divisi Pengelola:</label>
              <select id="import-target-division" class="form-input text-xs font-semibold">
                <option value="">-- Otomatis (Dari Kolom Excel / Ruangan) --</option>
                ${divisions.map(d => `<option value="${d.id}">${d.name} (${d.code || ''})</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Cabang / Wilayah:</label>
              <select id="import-target-branch" class="form-input text-xs font-semibold">
                <option value="">-- Otomatis (Dari Kolom Excel / Ruangan) --</option>
                ${branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      `;
    }
    if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  // Reset file input
  const fileInput = document.getElementById('import-excel-file');
  if (fileInput) fileInput.value = '';

  openModal('modal-import');
}
window.openBatchImportModal = openBatchImportModal;

function downloadExcelTemplate() {
  if (typeof XLSX === 'undefined') return;

  const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
  const isAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();
  
  let sampleDivisi = 'Divisi Riayah & Sarpras';
  let sampleCabang = 'Munzalan Pusat (Kubu Raya / Pontianak)';
  if (!isAdmin && user) {
    if (user.role === 'divisi' && user.scopeName) sampleDivisi = user.scopeName;
    if (user.role === 'wilayah' && user.scopeName) sampleCabang = user.scopeName;
  }

  const templateData = [
    {
      'No Induk': '001/INV-RYH/2026',
      'Kode Aset': 'RYH-ELE-KNTR-2026-001',
      'Nama Barang': 'Laptop Lenovo ThinkBook 14',
      'Kategori': 'Elektronik',
      'Divisi': sampleDivisi,
      'Cabang / Wilayah': sampleCabang,
      'Ruangan': 'Kantor Sekretariat',
      'Merek/Tipe': 'Lenovo / Core i7 RAM 16GB',
      'Jumlah (Qty)': 1,
      'Satuan': 'Unit',
      'No. Seri': 'SN-LNV-882190',
      'Tanggal Beli (YYYY-MM-DD)': '2026-01-15',
      'Harga Perolehan (Angka)': 12500000,
      'Masa Manfaat (Tahun)': 4,
      'Kondisi (Baik/Rusak Ringan/Rusak Berat)': 'Baik',
      'Penanggung Jawab': 'Ahmad Fauzi',
      'Sumber Dana': 'Kas Riayah',
      'Catatan': 'Kelengkapan charger + tas'
    },
    {
      'No Induk': '002/INV-RYH/2026',
      'Kode Aset': 'RYH-PRB-AULA-2026-002',
      'Nama Barang': 'Meja Rapat Kayu Jati 10 Kursi',
      'Kategori': 'Perabot / Mebelair',
      'Divisi': sampleDivisi,
      'Cabang / Wilayah': sampleCabang,
      'Ruangan': 'Aula Pertemuan',
      'Merek/Tipe': 'Informa Executive',
      'Jumlah (Qty)': 1,
      'Satuan': 'Set',
      'No. Seri': '-',
      'Tanggal Beli (YYYY-MM-DD)': '2026-02-10',
      'Harga Perolehan (Angka)': 8500000,
      'Masa Manfaat (Tahun)': 8,
      'Kondisi (Baik/Rusak Ringan/Rusak Berat)': 'Baik',
      'Penanggung Jawab': 'Divisi Riayah',
      'Sumber Dana': 'Wakaf Sarpras',
      'Catatan': 'Kondisi mulus dan terawat'
    },
    {
      'No Induk': '003/INV-RYH/2026',
      'Kode Aset': 'RYH-ELE-UTM-2026-003',
      'Nama Barang': 'AC Inverter 2 PK Ruangan',
      'Kategori': 'Elektronik',
      'Divisi': sampleDivisi,
      'Cabang / Wilayah': sampleCabang,
      'Ruangan': 'Ruang Utama Masjid',
      'Merek/Tipe': 'Daikin Flash Inverter 2PK',
      'Jumlah (Qty)': 2,
      'Satuan': 'Unit',
      'No. Seri': 'DKN-2024-9988',
      'Tanggal Beli (YYYY-MM-DD)': '2026-02-20',
      'Harga Perolehan (Angka)': 7200000,
      'Masa Manfaat (Tahun)': 5,
      'Kondisi (Baik/Rusak Ringan/Rusak Berat)': 'Baik',
      'Penanggung Jawab': 'Tim Sarpras',
      'Sumber Dana': 'Infaq Masjid',
      'Catatan': 'Garansi kompresor 3 tahun'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set Auto-fitted Column Widths agar rapi & tidak terpotong saat dibuka di Excel
  ws['!cols'] = [
    { wch: 18 }, // No Induk
    { wch: 24 }, // Kode Aset
    { wch: 32 }, // Nama Barang
    { wch: 22 }, // Kategori
    { wch: 28 }, // Divisi
    { wch: 36 }, // Cabang / Wilayah
    { wch: 22 }, // Ruangan
    { wch: 28 }, // Merek/Tipe
    { wch: 14 }, // Jumlah (Qty)
    { wch: 12 }, // Satuan
    { wch: 18 }, // No. Seri
    { wch: 26 }, // Tanggal Beli (YYYY-MM-DD)
    { wch: 24 }, // Harga Perolehan (Angka)
    { wch: 22 }, // Masa Manfaat (Tahun)
    { wch: 36 }, // Kondisi (Baik/Rusak Ringan/Rusak Berat)
    { wch: 22 }, // Penanggung Jawab
    { wch: 20 }, // Sumber Dana
    { wch: 32 }  // Catatan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Import');

  // Sheet 2: Panduan & Master Referensi
  const categories = db.getCategories();
  const divisions = db.getDivisions ? db.getDivisions() : [];
  const branches = db.getBranches ? db.getBranches() : [];

  const refData = [
    { 'PANDUAN PENGISIAN': '1. Jangan mengubah nama judul kolom di baris pertama pada Sheet "Template Import".' },
    { 'PANDUAN PENGISIAN': '2. Tanggal diisi dengan format YYYY-MM-DD (contoh: 2026-03-10).' },
    { 'PANDUAN PENGISIAN': '3. Harga Perolehan diisi berupa ANGKA SAJA tanpa titik/koma/simbol Rp (contoh: 5000000).' },
    { 'PANDUAN PENGISIAN': '4. Pilihan Kondisi: Baik / Rusak Ringan / Rusak Berat.' },
    { 'PANDUAN PENGISIAN': '5. Kode Aset boleh dikosongkan jika ingin digenerate otomatis oleh sistem.' },
    { 'PANDUAN PENGISIAN': '--- DAFTAR KATEGORI RESMI ---' },
    ...categories.map(c => ({ 'PANDUAN PENGISIAN': `• ${c.name} (${c.code})` })),
    { 'PANDUAN PENGISIAN': '--- DAFTAR DIVISI RESMI ---' },
    ...divisions.map(d => ({ 'PANDUAN PENGISIAN': `• ${d.name}` })),
    { 'PANDUAN PENGISIAN': '--- DAFTAR CABANG RESMI ---' },
    ...branches.map(b => ({ 'PANDUAN PENGISIAN': `• ${b.name}` }))
  ];

  const wsRef = XLSX.utils.json_to_sheet(refData);
  wsRef['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Panduan & Referensi');

  XLSX.writeFile(wb, 'Template_Import_Aset.xlsx');
}

function processExcelImport() {
  const fileInput = document.getElementById('import-excel-file');
  const file = fileInput?.files[0];
  if (!file) {
    showToast('Silakan pilih file Excel terlebih dahulu.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet);

      if (!rows || rows.length === 0) {
        showToast('File Excel kosong.', 'warning');
        return;
      }

      const rooms = db.getRooms();
      const categories = db.getCategories();
      const divisions = (typeof db !== 'undefined' && db.getDivisions) ? db.getDivisions() : [];
      const branches = (typeof db !== 'undefined' && db.getBranches) ? db.getBranches() : [];
      const allAssets = db.getAssets();
      let importedCount = 0;

      const user = (typeof AuthEngine !== 'undefined') ? AuthEngine.getCurrentUser() : null;
      const isAdmin = (typeof AuthEngine !== 'undefined') && AuthEngine.isAdmin();
      const targetDivFromModal = document.getElementById('import-target-division')?.value || '';
      const targetBranchFromModal = document.getElementById('import-target-branch')?.value || '';

      // Track existing codes and sequence counts
      const existingCodes = new Set(allAssets.map(a => a.code));
      let nextSeq = allAssets.length + 1;

      rows.forEach(r => {
        const name = r['Nama Barang'] || r['nama_barang'] || r['Nama Aset'] || r['Nama'] || r['Barang'];
        if (!name) return;

        const catName = r['Kategori'] || r['kategori'] || 'Elektronik';
        const roomName = r['Ruangan'] || r['ruangan'] || r['Lokasi'] || (rooms[0]?.name || 'Kantor Sekretariat');
        const price = parseFloat(r['Harga Perolehan (Angka)'] || r['Harga Perolehan'] || r['Harga Satuan'] || r['Harga'] || r['harga']) || 0;
        const lifespan = parseFloat(r['Masa Manfaat (Tahun)'] || r['Masa Manfaat'] || r['Umur Ekonomis']) || 5;
        const condition = r['Kondisi (Baik/Rusak Ringan/Rusak Berat)'] || r['Kondisi'] || 'Baik';
        const date = r['Tanggal Beli (YYYY-MM-DD)'] || r['Tanggal Beli'] || r['Tanggal Perolehan'] || r['Tanggal Diterima'] || new Date().toISOString().split('T')[0];
        const dateYear = (date && date.length >= 4) ? date.substring(0, 4) : new Date().getFullYear();

        const matchRoom = rooms.find(rm => rm.name.toLowerCase() === roomName.toLowerCase() || (rm.code && rm.code.toLowerCase() === roomName.toLowerCase())) || rooms[0];
        const matchCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase() || (c.code && c.code.toLowerCase() === catName.toLowerCase())) || categories[0];

        // Determine Division
        let divId = 'DIV-001';
        let divName = 'Divisi Riayah & Sarpras';
        let divCode = 'RIAYAH';

        if (!isAdmin && user && user.role === 'divisi' && user.scopeId) {
          divId = user.scopeId;
          divName = user.scopeName || 'Divisi Riayah & Sarpras';
          const dObj = divisions.find(d => d.id === divId);
          divCode = dObj?.code || 'RIAYAH';
        } else if (isAdmin && targetDivFromModal) {
          divId = targetDivFromModal;
          const dObj = divisions.find(d => d.id === divId);
          divName = dObj?.name || 'Divisi Riayah & Sarpras';
          divCode = dObj?.code || 'RIAYAH';
        } else {
          // Check Excel column
          const excelDiv = r['Divisi'] || r['divisi'] || r['Divisi Pengelola'] || r['Divisi / Unit'];
          if (excelDiv) {
            const cleanD = String(excelDiv).toLowerCase().trim();
            const dObj = divisions.find(d => d.name.toLowerCase() === cleanD || d.id.toLowerCase() === cleanD || (d.code && d.code.toLowerCase() === cleanD));
            if (dObj) {
              divId = dObj.id;
              divName = dObj.name;
              divCode = dObj.code || 'RIAYAH';
            }
          } else if (matchRoom && matchRoom.divisionId) {
            const dObj = divisions.find(d => d.id === matchRoom.divisionId);
            if (dObj) {
              divId = dObj.id;
              divName = dObj.name;
              divCode = dObj.code || 'RIAYAH';
            }
          }
        }

        // Determine Branch / Wilayah
        let branchId = null;
        let branchName = null;

        if (!isAdmin && user && user.role === 'wilayah' && user.scopeId) {
          branchId = user.scopeId;
          branchName = user.scopeName || 'Munzalan Cabang';
        } else if (isAdmin && targetBranchFromModal) {
          branchId = targetBranchFromModal;
          const bObj = branches.find(b => b.id === branchId);
          branchName = bObj?.name || 'Munzalan Cabang';
        } else {
          const excelBranch = r['Cabang / Wilayah'] || r['Cabang'] || r['Wilayah'] || r['cabang'] || r['wilayah'];
          if (excelBranch) {
            const cleanB = String(excelBranch).toLowerCase().trim();
            const bObj = branches.find(b => b.name.toLowerCase() === cleanB || b.id.toLowerCase() === cleanB || (b.code && b.code.toLowerCase() === cleanB));
            if (bObj) {
              branchId = bObj.id;
              branchName = bObj.name;
            }
          } else if (matchRoom && matchRoom.branchId) {
            const bObj = branches.find(b => b.id === matchRoom.branchId);
            if (bObj) {
              branchId = bObj.id;
              branchName = bObj.name;
            }
          }
        }

        // Determine Division Short Tag for Code & No. Induk
        let divShortTag = 'RYH';
        if (divCode === 'RIAYAH') divShortTag = 'RYH';
        else if (divCode === 'PONDOK') divShortTag = 'PDK';
        else if (divCode === 'SEKRET') divShortTag = 'SKR';
        else if (divCode) divShortTag = divCode.substring(0, 3).toUpperCase();

        // 1. Nomor Induk (Auto-generate if missing in spreadsheet)
        let noInduk = r['No Induk'] || r['No. Induk'] || r['Nomor Induk'] || r['no_induk'];
        if (!noInduk) {
          noInduk = `${String(nextSeq).padStart(3, '0')}/INV-${divShortTag}/${dateYear}`;
        }

        // 2. Kode Barang (Auto-generate if missing in spreadsheet)
        let code = r['Kode Aset'] || r['kode_aset'] || r['Kode Barang'] || r['kode_barang'] || r['Kode'];
        if (!code) {
          const catPrefix = matchCat?.code || matchCat?.name?.substring(0, 3)?.toUpperCase() || 'ELE';
          const roomPrefix = matchRoom?.code || matchRoom?.name?.substring(0, 3)?.toUpperCase() || 'RUT';
          let candidateCode = `${divShortTag}-${catPrefix}-${roomPrefix}-${dateYear}-${String(nextSeq).padStart(3, '0')}`;
          let attempt = nextSeq;
          while (existingCodes.has(candidateCode)) {
            attempt++;
            candidateCode = `${divShortTag}-${catPrefix}-${roomPrefix}-${dateYear}-${String(attempt).padStart(3, '0')}`;
          }
          code = candidateCode;
        }
        existingCodes.add(code);

        const newAsset = {
          id: `AST-${Date.now()}-${Math.floor(Math.random()*1000)}-${nextSeq}`,
          noInduk: String(noInduk),
          code: String(code),
          name: String(name),
          namaBarang: String(name),
          categoryId: matchCat ? matchCat.id : 'CAT-ELE',
          categoryName: matchCat ? matchCat.name : catName,
          categoryCode: matchCat ? matchCat.code : 'ELE',
          roomId: matchRoom ? matchRoom.id : 'RM-KNTR',
          roomName: matchRoom ? matchRoom.name : roomName,
          roomCode: matchRoom ? matchRoom.code : 'KNTR',
          divisionId: divId,
          divisionName: divName,
          divisionCode: divCode,
          branchId: branchId || undefined,
          branchName: branchName || undefined,
          brand: String(r['Merek/Tipe'] || r['Merek'] || r['Merk'] || r['Merk/Type'] || ''),
          brandType: String(r['Merek/Tipe'] || r['Merek'] || r['Merk'] || r['Merk/Type'] || ''),
          serial: String(r['No. Seri'] || r['Serial'] || r['No Seri'] || ''),
          serialNumber: String(r['No. Seri'] || r['Serial'] || r['No Seri'] || ''),
          date: String(date),
          tanggalDiterima: String(date),
          price: price,
          hargaJumlah: price,
          unitPrice: price,
          hargaSatuan: price,
          qty: 1,
          jumlahBarang: 1,
          unit: 'Unit',
          satuan: 'Unit',
          lifespan: lifespan,
          condition: condition,
          kondisi: condition,
          status: 'Aktif',
          pic: String(r['Penanggung Jawab'] || r['PIC'] || ''),
          source: String(r['Sumber Dana'] || r['Asal Barang'] || 'Pembelian'),
          asalBarang: String(r['Sumber Dana'] || r['Asal Barang'] || 'Pembelian'),
          image: '',
          notes: String(r['Catatan'] || r['Keterangan'] || ''),
          keterangan: String(r['Catatan'] || r['Keterangan'] || '')
        };

        db.saveAsset(newAsset);
        nextSeq++;
        importedCount++;
      });

      closeModal('modal-import');
      showToast(`Berhasil mengimpor ${importedCount} aset baru dari Excel!`, 'success');

      renderAssetTable();
      renderDashboard();
      renderRoomCards();
      renderStickerGrid();
      updateNotificationCenter();

    } catch (err) {
      console.error('Import error', err);
      showToast('Gagal memproses file Excel. Pastikan format kolom sesuai template.', 'danger');
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * ========================================================
 * 21. MODAL HELPERS & GLOBAL ESCAPE / BACKDROP HANDLERS
 * ========================================================
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
    // If master barang dropdown is open, hide it
    if (typeof hideMasterBarangDropdown === 'function') {
      hideMasterBarangDropdown();
    }
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.exportToExcel = exportToExcel;
window.exportToExcelFiltered = exportToExcelFiltered;

function closeActiveModals() {
  // 1. Hide master catalog dropdown if visible
  const mbDropdown = document.getElementById('master-barang-dropdown');
  if (mbDropdown && !mbDropdown.classList.contains('hidden')) {
    hideMasterBarangDropdown();
    return true;
  }

  // 2. Hide notification panel if visible
  const notifPanel = document.getElementById('notif-panel');
  if (notifPanel && !notifPanel.classList.contains('hidden')) {
    notifPanel.classList.add('hidden');
    return true;
  }

  // 3. Find and close top-most active modal overlay
  const openModals = Array.from(document.querySelectorAll('.modal-overlay:not(.hidden)'));
  if (openModals.length > 0) {
    const topModal = openModals[openModals.length - 1];
    closeModal(topModal.id);
    return true;
  }

  return false;
}

// Global Keyboard Listener: Press 'Escape' (Esc) to close active modal / popup / panel
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
    closeActiveModals();
  }
});

// Global Backdrop Click Listener: Click outside modal card to close
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id);
  }
});

/**
 * ========================================================
 * 23. MODUL BARANG NON-INVENTARIS (BHP & OPERASIONAL) CONTROLLER
 * ========================================================
 */

function populateBHPFilterDropdowns() {
  const cats = db.getBHPCategories();
  const rooms = db.getRooms();

  // Filter Kategori
  const catSelect = document.getElementById('filter-bhp-kategori');
  if (catSelect) {
    const curVal = catSelect.value;
    catSelect.innerHTML = '<option value="">Semua Kategori</option>' +
      cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    catSelect.value = curVal;
  }

  // Filter Ruangan
  const roomSelect = document.getElementById('filter-bhp-ruangan');
  if (roomSelect) {
    const curVal = roomSelect.value;
    roomSelect.innerHTML = '<option value="">Semua Ruangan / Lokasi</option>' +
      rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    roomSelect.value = curVal;
  }
}

function populateBHPFormDropdowns() {
  const cats = db.getBHPCategories();
  const rooms = db.getRooms();

  // Form Kategori
  const formCat = document.getElementById('form-bhp-category');
  if (formCat) {
    formCat.innerHTML = '<option value="">-- Pilih Kategori --</option>' +
      cats.map(c => `<option value="${c.id}" data-code="${c.code}">${c.name}</option>`).join('');
  }

  // Form Ruangan
  const formRoom = document.getElementById('form-bhp-room');
  if (formRoom) {
    formRoom.innerHTML = '<option value="">-- Pilih Ruangan / Lokasi --</option>' +
      rooms.map(r => `<option value="${r.id}">${r.name} (${r.floor || 'Gedung'})</option>`).join('');
  }
}

function renderBHPPage() {
  populateBHPFilterDropdowns();
  populateBHPFormDropdowns();
  renderBHPStats();
  renderBHPTable();
}

function renderBHPStats() {
  const stats = db.getBHPStats();

  const elTotalItems = document.getElementById('bhp-kpi-total-items');
  const elTotalQty = document.getElementById('bhp-kpi-total-qty');
  const elGoodStock = document.getElementById('bhp-kpi-good-stock');
  const elDamagedStock = document.getElementById('bhp-kpi-damaged-stock');

  if (elTotalItems) elTotalItems.textContent = `${stats.totalItems || 0} Item`;
  if (elTotalQty) elTotalQty.textContent = `${(stats.totalQty || 0).toLocaleString('id-ID')} Unit`;
  if (elGoodStock) elGoodStock.textContent = `${stats.goodCount || 0} Item`;
  if (elDamagedStock) elDamagedStock.textContent = `${stats.damagedCount || 0} Item`;
}

function renderBHPTable() {
  const tableBody = document.getElementById('bhp-table-body');
  const emptyState = document.getElementById('bhp-empty-state');
  const countDisplay = document.getElementById('bhp-count-display');
  const totalDisplay = document.getElementById('bhp-total-display');

  if (!tableBody) return;

  const allItems = db.getBHP();
  if (totalDisplay) totalDisplay.textContent = allItems.length;

  const searchQuery = (document.getElementById('filter-bhp-search')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('filter-bhp-kategori')?.value || '';
  const roomFilter = document.getElementById('filter-bhp-ruangan')?.value || '';
  const condFilter = document.getElementById('filter-bhp-kondisi')?.value || '';

  const filtered = allItems.filter(item => {
    // Search match
    if (searchQuery) {
      const matchName = (item.name || '').toLowerCase().includes(searchQuery);
      const matchCode = (item.code || '').toLowerCase().includes(searchQuery);
      const matchBrand = (item.brandType || '').toLowerCase().includes(searchQuery);
      const matchSize = (item.size || '').toLowerCase().includes(searchQuery);
      const matchRoom = (item.roomName || '').toLowerCase().includes(searchQuery);
      const matchLoc = (item.locationDetail || '').toLowerCase().includes(searchQuery);
      const matchNotes = (item.notes || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchCode && !matchBrand && !matchSize && !matchRoom && !matchLoc && !matchNotes) return false;
    }

    // Category match
    if (catFilter && item.categoryId !== catFilter) return false;

    // Room match
    if (roomFilter && item.roomId !== roomFilter) return false;

    // Condition match
    const cond = (item.condition || 'Baik').trim();
    if (condFilter === 'Baik' && cond !== 'Baik' && cond !== 'B') return false;
    if (condFilter === 'Rusak Ringan' && cond !== 'Rusak Ringan' && cond !== 'RR') return false;
    if (condFilter === 'Rusak Berat' && cond !== 'Rusak Berat' && cond !== 'RB') return false;
    if (condFilter === 'Rusak' && (cond === 'Baik' || cond === 'B')) return false;

    return true;
  });

  if (countDisplay) countDisplay.textContent = filtered.length;

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tableBody.innerHTML = filtered.map(item => {
    const qty = Number(item.qty !== undefined ? item.qty : item.stock) || 0;
    const unit = item.unit || 'Unit';

    // Condition badge
    const cond = (item.condition || 'Baik').trim();
    let condBadge = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">🟢 Baik (Bagus)</span>';
    if (cond === 'Rusak Ringan' || cond === 'RR') {
      condBadge = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 whitespace-nowrap">🟡 Rusak Ringan</span>';
    } else if (cond === 'Rusak Berat' || cond === 'RB') {
      condBadge = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 whitespace-nowrap">🔴 Rusak Berat</span>';
    }

    // Sub-info specs
    const specsList = [];
    if (item.brandType) specsList.push(`Merk: ${item.brandType}`);
    if (item.size) specsList.push(item.size);
    if (item.material) specsList.push(item.material);
    if (item.productionYear) specsList.push(`Thn: ${item.productionYear}`);
    const specsString = specsList.length > 0 ? specsList.join(' • ') : (item.notes || '-');

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
        <td class="px-4 py-3.5">
          <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 whitespace-nowrap">${escapeHTML(item.code || '-')}</span>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">${escapeHTML(item.name || '-')}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">${escapeHTML(specsString)}</div>
        </td>
        <td class="px-4 py-3.5">
          <span class="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">${escapeHTML(item.categoryName || 'Non-Inventaris')}</span>
        </td>
        <td class="px-4 py-3.5 text-center whitespace-nowrap">
          <span class="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">${qty.toLocaleString('id-ID')}</span>
          <span class="text-xs text-slate-400 ml-1 font-semibold">${escapeHTML(unit)}</span>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-semibold text-slate-800 dark:text-slate-200 text-xs">${escapeHTML(item.roomName || 'Gudang')}</div>
          ${item.locationDetail ? `<div class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><i data-lucide="map-pin" class="w-3 h-3 text-amber-500"></i> ${escapeHTML(item.locationDetail)}</div>` : ''}
        </td>
        <td class="px-4 py-3.5 text-center">
          ${condBadge}
        </td>
        <td class="px-4 py-3.5 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openModalEditBHP('${item.id}')" class="p-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit Data Barang">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteBHPItem('${item.id}')" class="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus Barang">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function applyBHPFilters() {
  const searchInput = document.getElementById('filter-bhp-search');
  const clearBtn = document.getElementById('btn-clear-bhp-search');
  if (searchInput && clearBtn) {
    if (searchInput.value.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
  renderBHPTable();
}

function clearBHPSearch() {
  const searchInput = document.getElementById('filter-bhp-search');
  if (searchInput) {
    searchInput.value = '';
    applyBHPFilters();
    searchInput.focus();
  }
}

function resetBHPFilters() {
  const search = document.getElementById('filter-bhp-search');
  const cat = document.getElementById('filter-bhp-kategori');
  const room = document.getElementById('filter-bhp-ruangan');
  const cond = document.getElementById('filter-bhp-kondisi');

  if (search) search.value = '';
  if (cat) cat.value = '';
  if (room) room.value = '';
  if (cond) cond.value = '';

  const clearBtn = document.getElementById('btn-clear-bhp-search');
  if (clearBtn) clearBtn.classList.add('hidden');

  renderBHPTable();
}

function generateAutoBHPCode() {
  const catSelect = document.getElementById('form-bhp-category');
  const selectedOption = catSelect ? catSelect.options[catSelect.selectedIndex] : null;
  const catCode = selectedOption && selectedOption.dataset.code ? selectedOption.dataset.code : 'NON';
  const year = new Date().getFullYear();

  const allBhp = db.getBHP();
  const matchingCodes = allBhp.filter(b => b.code && (b.code.startsWith(`NON-${catCode}-`) || b.code.startsWith(`BHP-${catCode}-`)));
  const nextSeq = matchingCodes.length + 1;
  const generatedCode = `NON-${catCode}-${year}-${String(nextSeq).padStart(3, '0')}`;

  const codeInput = document.getElementById('form-bhp-code');
  if (codeInput) codeInput.value = generatedCode;
}

function calculateBHPPriceTotal() {
  const qty = Number(document.getElementById('form-bhp-qty')?.value) || 0;
  const unitPrice = Number(document.getElementById('form-bhp-unit-price')?.value) || 0;
  const total = qty * unitPrice;

  const priceInput = document.getElementById('form-bhp-price');
  if (priceInput) priceInput.value = total;

  const formattedText = document.getElementById('bhp-price-formatted-text');
  const shortBadge = document.getElementById('bhp-price-short-badge');
  const terbilangText = document.getElementById('bhp-price-terbilang-text');

  if (formattedText) formattedText.textContent = DepreciationEngine.formatRupiah(total);
  if (shortBadge) shortBadge.textContent = DepreciationEngine.formatRingkas(total);
  if (terbilangText) terbilangText.textContent = `"${DepreciationEngine.terbilang(total)}"`;
}

function openModalTambahBHP() {
  populateBHPFormDropdowns();
  document.getElementById('modal-bhp-title').textContent = 'Tambah Barang Non-Inventaris Baru';
  document.getElementById('form-bhp-id').value = '';
  document.getElementById('form-bhp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('form-bhp-location-detail').value = '';
  document.getElementById('form-bhp-name').value = '';
  document.getElementById('form-bhp-brand').value = '';
  document.getElementById('form-bhp-size').value = '';
  document.getElementById('form-bhp-material').value = '';
  document.getElementById('form-bhp-production-year').value = new Date().getFullYear();
  document.getElementById('form-bhp-source').value = 'Kas Riayah & Sarpras';
  document.getElementById('form-bhp-qty').value = '1';
  document.getElementById('form-bhp-unit').value = 'Pcs';
  document.getElementById('form-bhp-condition').value = 'Baik';
  if (document.getElementById('form-bhp-unit-price')) document.getElementById('form-bhp-unit-price').value = '0';
  if (document.getElementById('form-bhp-price')) document.getElementById('form-bhp-price').value = '0';
  document.getElementById('form-bhp-notes').value = '';

  const catSelect = document.getElementById('form-bhp-category');
  if (catSelect && catSelect.options.length > 1) {
    catSelect.selectedIndex = 1;
  }

  const roomSelect = document.getElementById('form-bhp-room');
  if (roomSelect && roomSelect.options.length > 1) {
    roomSelect.selectedIndex = 1;
  }

  generateAutoBHPCode();

  const modal = document.getElementById('modal-bhp');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function openModalEditBHP(id) {
  const item = db.getBHPById(id);
  if (!item) return;

  populateBHPFormDropdowns();
  document.getElementById('modal-bhp-title').textContent = 'Edit Data Barang Non-Inventaris';
  document.getElementById('form-bhp-id').value = item.id;
  document.getElementById('form-bhp-room').value = item.roomId || '';
  document.getElementById('form-bhp-location-detail').value = item.locationDetail || '';
  document.getElementById('form-bhp-date').value = item.dateReceived || item.date || new Date().toISOString().split('T')[0];
  document.getElementById('form-bhp-code').value = item.code || '';
  document.getElementById('form-bhp-category').value = item.categoryId || '';
  document.getElementById('form-bhp-name').value = item.name || '';
  document.getElementById('form-bhp-brand').value = item.brandType || item.brand || '';
  document.getElementById('form-bhp-size').value = item.size || '';
  document.getElementById('form-bhp-material').value = item.material || '';
  document.getElementById('form-bhp-production-year').value = item.productionYear || new Date().getFullYear();
  document.getElementById('form-bhp-source').value = item.source || '';
  document.getElementById('form-bhp-qty').value = item.qty !== undefined ? item.qty : item.stock || 1;
  document.getElementById('form-bhp-unit').value = item.unit || 'Pcs';
  document.getElementById('form-bhp-condition').value = item.condition || 'Baik';
  if (document.getElementById('form-bhp-unit-price')) document.getElementById('form-bhp-unit-price').value = item.unitPrice || 0;
  document.getElementById('form-bhp-notes').value = item.notes || '';

  const modal = document.getElementById('modal-bhp');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function saveBHPForm(event) {
  event.preventDefault();

  const id = document.getElementById('form-bhp-id').value || `NON-${Date.now()}`;
  const dateReceived = document.getElementById('form-bhp-date').value;
  const code = document.getElementById('form-bhp-code').value.trim();
  const categoryId = document.getElementById('form-bhp-category').value;
  const name = document.getElementById('form-bhp-name').value.trim();
  const brandType = document.getElementById('form-bhp-brand').value.trim();
  const size = document.getElementById('form-bhp-size').value.trim();
  const material = document.getElementById('form-bhp-material').value.trim();
  const productionYear = Number(document.getElementById('form-bhp-production-year').value) || new Date().getFullYear();
  const source = document.getElementById('form-bhp-source').value.trim();
  const qty = Number(document.getElementById('form-bhp-qty').value) || 0;
  const unit = document.getElementById('form-bhp-unit').value.trim() || 'Unit';
  const condition = document.getElementById('form-bhp-condition').value;
  const unitPrice = Number(document.getElementById('form-bhp-unit-price')?.value) || 0;
  const price = qty * unitPrice;
  const roomId = document.getElementById('form-bhp-room').value;
  const locationDetail = document.getElementById('form-bhp-location-detail').value.trim();
  const notes = document.getElementById('form-bhp-notes').value.trim();

  const category = db.getBHPCategories().find(c => c.id === categoryId);
  const room = db.getRooms().find(r => r.id === roomId);

  const bhpItem = {
    id,
    code,
    dateReceived,
    date: dateReceived,
    name,
    brandType,
    brand: brandType,
    size,
    material,
    productionYear,
    source,
    categoryId,
    categoryName: category ? category.name : 'Non-Inventaris',
    qty,
    stock: qty,
    unit,
    condition,
    unitPrice,
    price,
    totalValue: price,
    roomId,
    roomName: room ? room.name : 'Gudang',
    locationDetail,
    notes,
    updatedAt: new Date().toISOString()
  };

  db.saveBHP(bhpItem);
  closeModal('modal-bhp');
  renderBHPPage();
  showToast('Data Barang Non-Inventaris berhasil disimpan!', 'success');
}

function deleteBHPItem(id) {
  const item = db.getBHPById(id);
  if (!item) return;

  if (confirm(`Apakah Anda yakin ingin menghapus barang "${item.name}" (${item.code})?`)) {
    db.deleteBHP(id);
    renderBHPPage();
    showToast('Barang Non-Inventaris telah dihapus.', 'info');
  }
}

// Export Excel Data BHP / Non-Inventaris
function exportNonInventarisToExcel() {
  const items = db.getBHP();
  if (!items || items.length === 0) {
    showToast('Tidak ada data barang untuk diexport!', 'warning');
    return;
  }

  const rows = items.map((item, index) => {
    const qty = Number(item.qty !== undefined ? item.qty : item.stock) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalValue = Number(item.price) || (qty * unitPrice);

    return {
      'No': index + 1,
      'Kode Barang': item.code || '',
      'Nama Barang': item.name || '',
      'Merk / Tipe': item.brandType || item.brand || '',
      'Ukuran / Kapasitas': item.size || '',
      'Bahan / Material': item.material || '',
      'Tahun Pengadaan': item.productionYear || '',
      'Kategori': item.categoryName || '',
      'Ruangan / Lokasi': item.roomName || '',
      'Posisi Rak / Detail': item.locationDetail || '',
      'Jumlah (Qty)': qty,
      'Satuan': item.unit || 'Unit',
      'Kondisi Fisik': item.condition || 'Baik',
      'Sumber Kas / Asal': item.source || '',
      'Keterangan': item.notes || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Barang Non-Inventaris');
  XLSX.writeFile(workbook, `Pencatatan_Barang_Non_Inventaris_Munzalan_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast('File Excel Barang Non-Inventaris berhasil diunduh!', 'success');
}

// Modal Pemakaian / Distribusi BHP Handlers
function openModalBHPKeluar(bhpId = null) {
  populateBHPFormDropdowns();
  const itemSelect = document.getElementById('form-bhp-keluar-item');
  if (itemSelect && bhpId) {
    itemSelect.value = bhpId;
  }
  document.getElementById('form-bhp-keluar-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('form-bhp-keluar-qty').value = '1';
  document.getElementById('form-bhp-keluar-recipient').value = '';
  document.getElementById('form-bhp-keluar-target-room').value = '';
  document.getElementById('form-bhp-keluar-notes').value = '';

  onBHPKeluarItemChange();

  const modal = document.getElementById('modal-bhp-keluar');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function onBHPKeluarItemChange() {
  const select = document.getElementById('form-bhp-keluar-item');
  const selectedOption = select ? select.options[select.selectedIndex] : null;
  const unitLabel = document.getElementById('form-bhp-keluar-unit-label');
  const currentStockLabel = document.getElementById('form-bhp-keluar-current-stock');

  if (selectedOption && selectedOption.value) {
    const unit = selectedOption.dataset.unit || 'Pcs';
    const stock = Number(selectedOption.dataset.stock) || 0;
    if (unitLabel) unitLabel.textContent = unit;
    if (currentStockLabel) {
      currentStockLabel.textContent = `${stock} ${unit}`;
      if (stock === 0) {
        currentStockLabel.className = 'font-bold font-mono text-rose-500';
      } else {
        currentStockLabel.className = 'font-bold font-mono text-amber-500';
      }
    }
  } else {
    if (unitLabel) unitLabel.textContent = 'Satuan';
    if (currentStockLabel) currentStockLabel.textContent = '0 Pcs';
  }
}

function saveBHPKeluarForm(event) {
  event.preventDefault();

  const bhpId = document.getElementById('form-bhp-keluar-item').value;
  const targetBhp = db.getBHPById(bhpId);
  if (!targetBhp) {
    showToast('Silakan pilih barang yang valid!', 'error');
    return;
  }

  const qty = Number(document.getElementById('form-bhp-keluar-qty').value) || 0;
  if (qty <= 0) {
    showToast('Jumlah pemakaian harus lebih dari 0!', 'warning');
    return;
  }

  if (qty > Number(targetBhp.stock)) {
    if (!confirm(`Peringatan: Jumlah keluar (${qty} ${targetBhp.unit}) melebihi stok yang tercatat (${targetBhp.stock} ${targetBhp.unit}). Tetap lanjutkan?`)) {
      return;
    }
  }

  const date = document.getElementById('form-bhp-keluar-date').value;
  const recipient = document.getElementById('form-bhp-keluar-recipient').value.trim();
  const targetRoom = document.getElementById('form-bhp-keluar-target-room').value.trim();
  const notes = document.getElementById('form-bhp-keluar-notes').value.trim();
  const unitPrice = Number(targetBhp.unitPrice) || 0;

  const tx = {
    id: `TRX-OUT-${Date.now()}`,
    bhpId: targetBhp.id,
    bhpCode: targetBhp.code,
    bhpName: targetBhp.name,
    type: 'keluar',
    date,
    qty,
    unit: targetBhp.unit || 'Pcs',
    unitPrice,
    totalPrice: qty * unitPrice,
    recipient,
    targetRoom,
    notes,
    createdBy: 'Divisi Riayah'
  };

  db.addBHPTransaction(tx);
  closeModal('modal-bhp-keluar');
  renderBHPPage();
  showToast(`Pemakaian ${qty} ${targetBhp.unit} ${targetBhp.name} berhasil dicatat!`, 'success');
}

// Modal Restock / Tambah Masuk Handlers
function openModalBHPMasuk(bhpId = null) {
  populateBHPFormDropdowns();
  const itemSelect = document.getElementById('form-bhp-masuk-item');
  if (itemSelect && bhpId) {
    itemSelect.value = bhpId;
  }
  document.getElementById('form-bhp-masuk-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('form-bhp-masuk-qty').value = '5';
  document.getElementById('form-bhp-masuk-price').value = '';
  document.getElementById('form-bhp-masuk-source').value = 'Kas Riayah Sarpras';
  document.getElementById('form-bhp-masuk-notes').value = 'Restock rutin persediaan';

  onBHPMasukItemChange();

  const modal = document.getElementById('modal-bhp-masuk');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function onBHPMasukItemChange() {
  const select = document.getElementById('form-bhp-masuk-item');
  const selectedOption = select ? select.options[select.selectedIndex] : null;
  const unitLabel = document.getElementById('form-bhp-masuk-unit-label');
  const priceInput = document.getElementById('form-bhp-masuk-price');

  if (selectedOption && selectedOption.value) {
    const unit = selectedOption.dataset.unit || 'Pcs';
    const price = selectedOption.dataset.price || '0';
    if (unitLabel) unitLabel.textContent = unit;
    if (priceInput && !priceInput.value) priceInput.value = price;
  } else {
    if (unitLabel) unitLabel.textContent = 'Satuan';
  }
}

function saveBHPMasukForm(event) {
  event.preventDefault();

  const bhpId = document.getElementById('form-bhp-masuk-item').value;
  const targetBhp = db.getBHPById(bhpId);
  if (!targetBhp) {
    showToast('Silakan pilih barang yang valid!', 'error');
    return;
  }

  const qty = Number(document.getElementById('form-bhp-masuk-qty').value) || 0;
  if (qty <= 0) {
    showToast('Jumlah stok masuk harus lebih dari 0!', 'warning');
    return;
  }

  const date = document.getElementById('form-bhp-masuk-date').value;
  const newPrice = document.getElementById('form-bhp-masuk-price').value;
  const unitPrice = newPrice !== '' ? Number(newPrice) : (Number(targetBhp.unitPrice) || 0);
  const source = document.getElementById('form-bhp-masuk-source').value.trim();
  const notes = document.getElementById('form-bhp-masuk-notes').value.trim();

  // Update unitPrice of item if provided
  if (newPrice !== '') {
    targetBhp.unitPrice = unitPrice;
    db.saveBHP(targetBhp);
  }

  const tx = {
    id: `TRX-IN-${Date.now()}`,
    bhpId: targetBhp.id,
    bhpCode: targetBhp.code,
    bhpName: targetBhp.name,
    type: 'masuk',
    date,
    qty,
    unit: targetBhp.unit || 'Pcs',
    unitPrice,
    totalPrice: qty * unitPrice,
    recipient: source || 'Pengadaan Logistik',
    targetRoom: targetBhp.roomName || 'Gudang',
    notes,
    createdBy: 'Divisi Riayah'
  };

  db.addBHPTransaction(tx);
  closeModal('modal-bhp-masuk');
  renderBHPPage();
  showToast(`Stok ${targetBhp.name} bertambah ${qty} ${targetBhp.unit}!`, 'success');
}

// Modal Log Mutasi Transaksi Handlers
function openModalBHPHistory(filterBhpId = '') {
  populateBHPFormDropdowns();
  const filterItem = document.getElementById('filter-history-bhp-item');
  if (filterItem) filterItem.value = filterBhpId;
  const filterType = document.getElementById('filter-history-bhp-type');
  if (filterType) filterType.value = '';

  renderBHPHistoryTable();

  const modal = document.getElementById('modal-bhp-history');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function renderBHPHistoryTable() {
  const tableBody = document.getElementById('bhp-history-table-body');
  const countLabel = document.getElementById('bhp-history-count');
  if (!tableBody) return;

  const allTxs = db.getBHPTransactions();
  const filterItem = document.getElementById('filter-history-bhp-item')?.value || '';
  const filterType = document.getElementById('filter-history-bhp-type')?.value || '';

  const filtered = allTxs.filter(t => {
    if (filterItem && t.bhpId !== filterItem) return false;
    if (filterType && t.type !== filterType) return false;
    return true;
  });

  if (countLabel) countLabel.textContent = `Menampilkan ${filtered.length} riwayat transaksi mutasi`;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-400">
          Belum ada riwayat transaksi mutasi barang habis pakai yang tercatat.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(t => {
    const isMasuk = t.type === 'masuk';
    const typeBadge = isMasuk
      ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">📥 Masuk (Restock)</span>'
      : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">📤 Keluar (Pemakaian)</span>';

    const qtyDisplay = isMasuk
      ? `<span class="font-bold text-emerald-500">+${t.qty} ${escapeHTML(t.unit || '')}</span>`
      : `<span class="font-bold text-rose-500">-${t.qty} ${escapeHTML(t.unit || '')}</span>`;

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">${escapeHTML(t.date || '-')}</td>
        <td class="px-3.5 py-2.5 whitespace-nowrap">${typeBadge}</td>
        <td class="px-3.5 py-2.5">
          <strong class="text-slate-800 dark:text-slate-200 block">${escapeHTML(t.bhpName || '-')}</strong>
          <span class="font-mono text-[10px] text-slate-400">${escapeHTML(t.bhpCode || '')}</span>
        </td>
        <td class="px-3.5 py-2.5 text-center font-mono whitespace-nowrap">${qtyDisplay}</td>
        <td class="px-3.5 py-2.5 text-slate-700 dark:text-slate-300">${escapeHTML(t.recipient || '-')}</td>
        <td class="px-3.5 py-2.5 text-slate-600 dark:text-slate-400">${escapeHTML(t.targetRoom || '-')}</td>
        <td class="px-3.5 py-2.5 text-slate-500 italic max-w-xs truncate" title="${escapeHTML(t.notes || '')}">${escapeHTML(t.notes || '-')}</td>
        <td class="px-3.5 py-2.5 text-center">
          <button onclick="deleteBHPHistoryItem('${t.id}')" class="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded transition-colors" title="Batalkan / Hapus Log Ini">
            <i data-lucide="trash" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function deleteBHPHistoryItem(txId) {
  if (confirm('Apakah Anda yakin ingin membatalkan transaksi mutasi ini? Stok barang akan dikembalikan secara otomatis.')) {
    db.deleteBHPTransaction(txId);
    renderBHPHistoryTable();
    renderBHPPage();
    showToast('Transaksi mutasi dibatalkan & stok dikembalikan.', 'info');
  }
}

// Export Excel Data BHP
function exportBHPToExcel() {
  const items = db.getBHP();
  if (!items || items.length === 0) {
    showToast('Tidak ada data BHP untuk diexport!', 'warning');
    return;
  }

  const rows = items.map((item, index) => {
    const stock = Number(item.stock) || 0;
    const minStock = Number(item.minStock) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalValue = stock * unitPrice;

    let status = 'Aman';
    if (stock === 0) status = 'Habis';
    else if (stock <= minStock) status = 'Menipis';

    return {
      'No': index + 1,
      'Kode BHP': item.code || '',
      'Nama Barang': item.name || '',
      'Kategori': item.categoryName || '',
      'Lokasi Penyimpanan': item.roomName || '',
      'Posisi Rak / Detail': item.locationDetail || '',
      'Sisa Stok Fisik': stock,
      'Satuan': item.unit || 'Pcs',
      'Batas Min. Stok': minStock,
      'Harga Satuan (Rp)': unitPrice,
      'Total Nilai Stok (Rp)': totalValue,
      'Status Stok': status,
      'Sumber Kas': item.source || '',
      'Keterangan': item.notes || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok BHP');
  XLSX.writeFile(workbook, `Laporan_Stok_Barang_Habis_Pakai_Munzalan_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast('File Excel Stok BHP berhasil diunduh!', 'success');
}

function exportBHPHistoryToExcel() {
  const txs = db.getBHPTransactions();
  if (!txs || txs.length === 0) {
    showToast('Tidak ada data riwayat transaksi untuk diexport!', 'warning');
    return;
  }

  const rows = txs.map((t, index) => ({
    'No': index + 1,
    'Tanggal': t.date || '',
    'Jenis Mutasi': t.type === 'masuk' ? 'Stok Masuk (Restock)' : 'Stok Keluar (Pemakaian)',
    'Kode BHP': t.bhpCode || '',
    'Nama Barang': t.bhpName || '',
    'Jumlah (Qty)': t.qty || 0,
    'Satuan': t.unit || '',
    'Harga Satuan (Rp)': t.unitPrice || 0,
    'Total Nominal (Rp)': t.totalPrice || 0,
    'Penerima / Sumber': t.recipient || '',
    'Ruangan / Tujuan': t.targetRoom || '',
    'Keperluan / Keterangan': t.notes || '',
    'Petugas': t.createdBy || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Mutasi BHP');
  XLSX.writeFile(workbook, `Laporan_Mutasi_BHP_Munzalan_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast('File Excel Riwayat Mutasi BHP berhasil diunduh!', 'success');
}

// Supabase Cloud Storage UI Management Handlers
function loadSupabaseSettingsUI() {
  if (!window.SupabaseEngine) return;
  const cfg = SupabaseEngine.getConfig();
  const urlEl = document.getElementById('cfg-supabase-url');
  const keyEl = document.getElementById('cfg-supabase-key');
  const enEl = document.getElementById('cfg-supabase-enabled');

  if (urlEl) urlEl.value = cfg.url || '';
  if (keyEl) keyEl.value = cfg.key || '';
  if (enEl) enEl.checked = !!cfg.enabled;

  SupabaseEngine.updateStatusBadge();
}

function saveSupabaseSettingsUI() {
  if (!window.SupabaseEngine) return;
  const url = (document.getElementById('cfg-supabase-url')?.value || '').trim();
  const key = (document.getElementById('cfg-supabase-key')?.value || '').trim();
  const enabled = !!document.getElementById('cfg-supabase-enabled')?.checked;

  SupabaseEngine.saveConfig({ url, key, enabled, autoSync: true });
  showToast('Konfigurasi Cloud Supabase berhasil disimpan!', 'success');
}

async function testSupabaseConnectionUI() {
  if (!window.SupabaseEngine) {
    showToast('Modul Supabase Engine belum siap.', 'danger');
    return;
  }
  const url = (document.getElementById('cfg-supabase-url')?.value || '').trim();
  const key = (document.getElementById('cfg-supabase-key')?.value || '').trim();

  if (!url || !key) {
    showToast('Isi Project URL dan Anon Key terlebih dahulu!', 'warning');
    return;
  }

  showToast('Sedang menguji koneksi ke Supabase...', 'info');
  const res = await SupabaseEngine.testConnection(url, key);
  if (res.success) {
    showToast('Koneksi ke Supabase Berhasil Terhubung!', 'success');
  } else {
    showToast(`Koneksi Gagal: ${res.message || 'Periksa URL dan Anon Key.'}`, 'danger');
  }
}

async function pushLocalDataToCloudUI() {
  if (!window.SupabaseEngine || !SupabaseEngine.isConnected()) {
    showToast('Supabase belum terhubung. Simpan konfigurasi & tes koneksi dulu.', 'warning');
    return;
  }
  if (!confirm('Apakah Anda yakin ingin mengupload seluruh data lokal (Aset, Ruangan, Mutasi, BHP, BAST, dll) ke Supabase Cloud? Data yang sama akan diperbarui.')) {
    return;
  }

  showToast('Sedang mengupload seluruh data lokal ke Cloud...', 'info');
  const res = await SupabaseEngine.pushLocalToCloud(true);
  if (res.success) {
    showToast(res.message, 'success');
  } else {
    showToast(`Upload gagal: ${res.message}`, 'danger');
  }
}

async function pullCloudDataToLocalUI() {
  if (!window.SupabaseEngine || !SupabaseEngine.isConnected()) {
    showToast('Supabase belum terhubung. Simpan konfigurasi & tes koneksi dulu.', 'warning');
    return;
  }
  if (!confirm('PERHATIAN: Mengambil data dari Cloud akan memperbarui data lokal Anda dengan versi terbaru di server. Lanjutkan?')) {
    return;
  }

  showToast('Sedang mendownload data dari Supabase Cloud...', 'info');
  const res = await SupabaseEngine.pullCloudToLocal();
  if (res.success) {
    showToast(res.message, 'success');
    // Refresh current UI
    if (typeof renderAssetTable === 'function') renderAssetTable();
    if (typeof renderDashboardStats === 'function') renderDashboardStats();
  } else {
    showToast(`Download gagal: ${res.message}`, 'danger');
  }
}

function copySupabaseSchemaSQL() {
  const sql = `-- AsetPro - Supabase PostgreSQL Schema
-- Buka Supabase Dashboard > SQL Editor > New query, paste dan Run SQL ini

CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  "isPusat" BOOLEAN DEFAULT false,
  pj TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.divisions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  parent TEXT,
  pj TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  prefix TEXT,
  "defaultLifespan" INT DEFAULT 5,
  "depreciationMethod" TEXT DEFAULT 'straight_line',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  branch_id TEXT,
  division_id TEXT,
  pj TEXT,
  floor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  "brandType" TEXT,
  size TEXT,
  material TEXT,
  "productionYear" INT,
  source TEXT,
  documents TEXT,
  qty INT DEFAULT 1,
  unit TEXT DEFAULT 'Unit',
  condition TEXT DEFAULT 'B',
  "unitPrice" NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0,
  "roomId" TEXT,
  "roomName" TEXT,
  "categoryId" TEXT,
  "categoryName" TEXT,
  "divisionId" TEXT,
  "branchId" TEXT,
  status TEXT DEFAULT 'Aktif',
  lifespan INT DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mutations (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "assetId" TEXT,
  "assetCode" TEXT,
  "assetName" TEXT,
  "fromBranchId" TEXT,
  "fromDivisionId" TEXT,
  "fromRoomId" TEXT,
  "fromRoomName" TEXT,
  "toBranchId" TEXT,
  "toDivisionId" TEXT,
  "toRoomId" TEXT,
  "toRoomName" TEXT,
  reason TEXT,
  notes TEXT,
  "picHandover" TEXT,
  "picRecipient" TEXT,
  "letterNumber" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bast (
  id TEXT PRIMARY KEY,
  "letterNumber" TEXT NOT NULL,
  "assetId" TEXT,
  "assetCode" TEXT,
  "assetName" TEXT,
  borrower TEXT,
  department TEXT,
  "borrowDate" TEXT,
  "expectedReturnDate" TEXT,
  "actualReturnDate" TEXT,
  status TEXT DEFAULT 'Aktif',
  purpose TEXT,
  notes TEXT,
  "officerName" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.damage_reports (
  id TEXT PRIMARY KEY,
  "assetId" TEXT,
  "assetCode" TEXT,
  "assetName" TEXT,
  "reportDate" TEXT,
  reporter TEXT,
  division TEXT,
  "damageSeverity" TEXT,
  chronology TEXT,
  "costEstimate" NUMERIC DEFAULT 0,
  action TEXT,
  status TEXT DEFAULT 'Menunggu Verifikasi',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.disposals (
  id TEXT PRIMARY KEY,
  "assetCode" TEXT,
  "assetName" TEXT,
  "roomName" TEXT,
  date TEXT,
  price NUMERIC DEFAULT 0,
  reason TEXT,
  "docNo" TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bhp (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  "brandType" TEXT,
  "categoryId" TEXT,
  "categoryName" TEXT,
  qty INT DEFAULT 0,
  stock INT DEFAULT 0,
  unit TEXT,
  "unitPrice" NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0,
  "roomId" TEXT,
  "roomName" TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bhp_transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  "bhpId" TEXT,
  "bhpCode" TEXT,
  "bhpName" TEXT,
  qty INT DEFAULT 1,
  unit TEXT,
  "unitPrice" NUMERIC DEFAULT 0,
  "totalPrice" NUMERIC DEFAULT 0,
  recipient TEXT,
  "targetRoom" TEXT,
  notes TEXT,
  "createdBy" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public anon full access for this client-side app
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhp_transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "anon_all_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
`;

  navigator.clipboard.writeText(sql).then(() => {
    showToast('SQL Schema berhasil disalin ke Clipboard!', 'success');
  }).catch(() => {
    showToast('Gagal menyalin SQL ke clipboard. Silakan buka file schema.sql secara manual.', 'warning');
  });
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// Window Global Scope Function Exposures
window.onFilterDivisionChange = onFilterDivisionChange;
window.onDashboardScopeChange = onDashboardScopeChange;
window.resetDashboardScope = resetDashboardScope;
window.applyAssetFilters = applyAssetFilters;
window.resetAssetFilters = resetAssetFilters;
window.onKIRScopeChange = onKIRScopeChange;
window.onKIRRoomSelectDropdown = onKIRRoomSelectDropdown;
window.populateKIRRoomDropdown = populateKIRRoomDropdown;
window.resetKIRScope = resetKIRScope;
window.onFilterKIBDivisionChange = onFilterKIBDivisionChange;
window.applyKIBFilters = applyKIBFilters;
window.resetKIBFilters = resetKIBFilters;

// Mutasi Window Exposures
window.populateMutasiFilterDropdowns = populateMutasiFilterDropdowns;
window.renderMutasiTable = renderMutasiTable;
window.onMutasiFilterChange = onMutasiFilterChange;
window.resetMutasiFilter = resetMutasiFilter;
window.openModalMutasiAset = openModalMutasiAset;
window.onMutasiAssetSelectChange = onMutasiAssetSelectChange;
window.onMutasiToScopeChange = onMutasiToScopeChange;
window.onMutasiToRoomChange = onMutasiToRoomChange;
window.submitMutasiForm = submitMutasiForm;
window.printBAMutasi = printBAMutasi;
window.printBAMutasiDirect = printBAMutasiDirect;
window.exportMutasiToExcel = exportMutasiToExcel;
window.deleteMutationItem = deleteMutationItem;

// Supabase Window Exposures
window.loadSupabaseSettingsUI = loadSupabaseSettingsUI;
window.saveSupabaseSettingsUI = saveSupabaseSettingsUI;
window.testSupabaseConnectionUI = testSupabaseConnectionUI;
window.pushLocalDataToCloudUI = pushLocalDataToCloudUI;
window.pullCloudDataToLocalUI = pullCloudDataToLocalUI;
window.copySupabaseSchemaSQL = copySupabaseSchemaSQL;
window.togglePasswordVisibility = togglePasswordVisibility;

// Realtime cross-tab storage synchronizer
window.addEventListener('storage', (e) => {
  if (typeof STORAGE_KEYS !== 'undefined' && e.key) {
    if (e.key === STORAGE_KEYS.ROOMS) {
      if (typeof renderSettingsRoomTable === 'function') renderSettingsRoomTable();
      if (typeof renderRoomCards === 'function') renderRoomCards();
      if (typeof populateDropdowns === 'function') populateDropdowns();
      if (typeof populateRoomDropdowns === 'function') populateRoomDropdowns();
    } else if (e.key === STORAGE_KEYS.ASSETS) {
      if (typeof renderAssetTable === 'function') renderAssetTable();
      if (typeof renderDashboard === 'function') renderDashboard();
    } else if (e.key === STORAGE_KEYS.DIVISIONS || e.key === STORAGE_KEYS.BRANCHES) {
      if (typeof populateDropdowns === 'function') populateDropdowns();
      if (typeof renderSettingsDivisionsTable === 'function') renderSettingsDivisionsTable();
      if (typeof renderSettingsBranchTable === 'function') renderSettingsBranchTable();
    }
  }
});
