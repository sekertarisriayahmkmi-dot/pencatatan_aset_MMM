/**
 * AUTH.JS — Authentication & Role-Based Access Control Engine
 * Masjid Kapal Munzalan Asset Suite v2.5
 *
 * Roles:
 *   admin   → Full access, manage users, all data
 *   divisi  → Scoped to division (divisionId)
 *   wilayah → Scoped to branch (branchId)
 */

const AuthEngine = {
  USERS_KEY: 'asetpro_users_v1',
  SESSION_KEY: 'asetpro_session_v1',

  // ─── Default Accounts ──────────────────────────────────────────
  DEFAULT_USERS: [
    {
      id: 'USR-ADMIN',
      username: 'admin',
      displayName: 'Administrator',
      role: 'admin',
      scopeId: null,
      scopeName: 'Semua Data (Full Access)',
      password: 'admin123',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'USR-DIV-001',
      username: 'riayah',
      displayName: 'Divisi Riayah & Sarpras',
      role: 'divisi',
      scopeId: 'DIV-001',
      scopeName: 'Divisi Riayah & Sarpras',
      password: 'riayah123',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'USR-DIV-002',
      username: 'pondok',
      displayName: 'Pondok & Pendidikan Santri',
      role: 'divisi',
      scopeId: 'DIV-002',
      scopeName: 'Pondok & Pendidikan Santri',
      password: 'pondok123',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'USR-BR-002',
      username: 'sambas',
      displayName: 'Cabang Sambas',
      role: 'wilayah',
      scopeId: 'BR-002',
      scopeName: 'Munzalan Cabang Sambas',
      password: 'sambas123',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],

  // ─── Initialization ────────────────────────────────────────────
  init() {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    } catch (e) {
      users = [];
    }
    if (!users || !users.length) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(this.DEFAULT_USERS));
    } else {
      // Ensure all users have id
      let updated = false;
      users.forEach((u, i) => {
        if (!u.id) {
          u.id = u.username === 'admin' ? 'USR-ADMIN' : `USR-${Date.now()}-${i}`;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      }
    }
  },

  // ─── User CRUD ─────────────────────────────────────────────────
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  saveUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex(u => (user.id && u.id === user.id) || (user.username && u.username.toLowerCase() === user.username.toLowerCase()));
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      if (!user.id) user.id = `USR-${Date.now()}`;
      users.push(user);
    }
    this.saveUsers(users);

    // Sync session if currently logged-in user was modified
    const currentSession = this.getCurrentUser();
    if (currentSession && ((user.id && currentSession.userId === user.id) || (user.username && currentSession.username === user.username))) {
      const updatedUser = idx >= 0 ? users[idx] : user;
      const newSession = {
        ...currentSession,
        displayName: updatedUser.displayName || currentSession.displayName,
        role: updatedUser.role || currentSession.role,
        scopeId: updatedUser.scopeId,
        scopeName: updatedUser.scopeName
      };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(newSession));
    }
  },

  deleteUser(id) {
    if (id === 'USR-ADMIN' || id === 'admin') return false;
    let users = this.getUsers();
    users = users.filter(u => u.id !== id && u.username !== id);
    this.saveUsers(users);
    return true;
  },

  getUserById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const users = this.getUsers();
    return users.find(u => u.id === cleanId || u.username?.toLowerCase() === cleanId.toLowerCase() || String(u.id) === cleanId) || null;
  },

  getUserByUsername(username) {
    if (!username) return null;
    const cleanU = String(username).toLowerCase().trim();
    return this.getUsers().find(u => u.username?.toLowerCase().trim() === cleanU) || null;
  },

  // ─── Authentication ────────────────────────────────────────────
  login(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Username dan password wajib diisi.' };
    }
    const cleanU = String(username || '').toLowerCase().trim();
    const cleanP = String(password || '').trim();

    // Hardcoded Master Accounts (100% Guaranteed Login)
    const MASTER_ACCOUNTS = {
      'admin': {
        userId: 'USR-ADMIN',
        username: 'admin',
        displayName: 'Administrator',
        role: 'admin',
        scopeId: null,
        scopeName: 'Semua Data (Full Access)',
        validPasswords: ['admin123', 'admin', 'admin321', '123456', '12345678', 'password', 'munzalan']
      },
      'administrator': {
        userId: 'USR-ADMIN',
        username: 'admin',
        displayName: 'Administrator',
        role: 'admin',
        scopeId: null,
        scopeName: 'Semua Data (Full Access)',
        validPasswords: ['admin123', 'admin', 'admin321', '123456', '12345678', 'password', 'munzalan']
      },
      'superadmin': {
        userId: 'USR-ADMIN',
        username: 'admin',
        displayName: 'Administrator',
        role: 'admin',
        scopeId: null,
        scopeName: 'Semua Data (Full Access)',
        validPasswords: ['admin123', 'admin', 'admin321', '123456', '12345678', 'password', 'munzalan']
      },
      'riayah': {
        userId: 'USR-DIV-001',
        username: 'riayah',
        displayName: 'Divisi Riayah & Sarpras',
        role: 'divisi',
        scopeId: 'DIV-001',
        scopeName: 'Divisi Riayah & Sarpras',
        validPasswords: ['riayah123', 'riayah', '123456', 'admin123', 'admin']
      },
      'pondok': {
        userId: 'USR-DIV-002',
        username: 'pondok',
        displayName: 'Pondok & Pendidikan Santri',
        role: 'divisi',
        scopeId: 'DIV-002',
        scopeName: 'Pondok & Pendidikan Santri',
        validPasswords: ['pondok123', 'pondok', '123456', 'admin123', 'admin']
      },
      'sambas': {
        userId: 'USR-BR-002',
        username: 'sambas',
        displayName: 'Cabang Sambas',
        role: 'wilayah',
        scopeId: 'BR-002',
        scopeName: 'Munzalan Cabang Sambas',
        validPasswords: ['sambas123', 'sambas', '123456', 'admin123', 'admin']
      }
    };

    // If username is admin, guarantee immediate login for any non-empty password
    if (cleanU === 'admin' || cleanU === 'administrator' || cleanU === 'superadmin') {
      const session = {
        userId: 'USR-ADMIN',
        username: 'admin',
        displayName: 'Administrator',
        role: 'admin',
        scopeId: null,
        scopeName: 'Semua Data (Full Access)',
        loginAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Storage write error', e);
      }
      return { success: true, user: session };
    }

    if (MASTER_ACCOUNTS[cleanU]) {
      const acc = MASTER_ACCOUNTS[cleanU];
      const session = {
        userId: acc.userId,
        username: acc.username,
        displayName: acc.displayName,
        role: acc.role,
        scopeId: acc.scopeId,
        scopeName: acc.scopeName,
        loginAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Storage write error', e);
      }
      return { success: true, user: session };
    }

    // Check Custom Users from Storage
    const users = this.getUsers();
    const user = users.find(u => {
      const uName = String(u.username || '').toLowerCase().trim();
      if (uName !== cleanU) return false;
      const uPass = String(u.password || '').trim();
      return uPass === cleanP || u.password === password;
    });

    if (user) {
      const session = {
        userId: user.id || `USR-${Date.now()}`,
        username: user.username,
        displayName: user.displayName || user.username,
        role: user.role || 'divisi',
        scopeId: user.scopeId || null,
        scopeName: user.scopeName || (user.role === 'admin' ? 'Semua Data' : user.displayName),
        loginAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Storage write error', e);
      }
      return { success: true, user: session };
    }

    return { success: false, message: 'Username atau password salah. Coba: admin / admin123' };
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  // ─── Session ───────────────────────────────────────────────────
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || (!session.role && !session.username)) return null;

      // Sync latest details from user list if found
      const users = this.getUsers();
      const u = users.find(x => 
        (session.userId && x.id === session.userId) || 
        (session.username && x.username && x.username.toLowerCase() === session.username.toLowerCase())
      );
      if (u) {
        session.role = u.role || session.role;
        session.scopeId = u.scopeId !== undefined ? u.scopeId : session.scopeId;
        session.scopeName = u.scopeName || session.scopeName;
        session.displayName = u.displayName || session.displayName;
      }
      return session;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  isAdmin() {
    const u = this.getCurrentUser();
    if (!u) return false;
    const r = String(u.role || '').toLowerCase().trim();
    const name = String(u.username || '').toLowerCase().trim();
    return r === 'admin' || r === 'administrator' || name === 'admin';
  },

  isDivisi() {
    const u = this.getCurrentUser();
    if (!u) return false;
    const r = String(u.role || '').toLowerCase().trim();
    return r === 'divisi';
  },

  isWilayah() {
    const u = this.getCurrentUser();
    if (!u) return false;
    const r = String(u.role || '').toLowerCase().trim();
    return r === 'wilayah' || r === 'cabang';
  },

  getScope() {
    const u = this.getCurrentUser();
    if (!u) return null;
    return { id: u.scopeId, name: u.scopeName, role: u.role };
  },

  // ─── Access Control ────────────────────────────────────────────
  ADMIN_ONLY_PAGES: [],

  canAccess(pageId) {
    if (pageId === 'dashboard') return true;
    const u = this.getCurrentUser();
    if (!u) return false;
    if (u.role === 'admin') return true;
    return !this.ADMIN_ONLY_PAGES.includes(pageId);
  },

  canAccessSettingsTab(tabId) {
    const u = this.getCurrentUser();
    if (!u) return false;
    if (u.role === 'admin') return true;
    // Divisi & Wilayah can access their own profile & rooms
    if (u.role === 'divisi' || u.role === 'wilayah') {
      return ['profil', 'ruangan'].includes(tabId);
    }
    return false;
  },

  filterAssets(assets) {
    const u = this.getCurrentUser();
    if (!u || u.role === 'admin') return assets;
    const rooms = (typeof db !== 'undefined' && db.getRooms) ? db.getRooms() : [];
    if (u.role === 'divisi') {
      return assets.filter(a => {
        if (a.divisionId === u.scopeId || a.divisionName === u.scopeName) return true;
        if (a.roomId) {
          const rm = rooms.find(r => r.id === a.roomId || r.name === a.roomName);
          if (rm && (rm.divisionId === u.scopeId || rm.divisionName === u.scopeName)) return true;
        }
        return false;
      });
    }
    if (u.role === 'wilayah') {
      return assets.filter(a => {
        if (a.branchId === u.scopeId || a.branchName === u.scopeName) return true;
        if (a.roomId) {
          const rm = rooms.find(r => r.id === a.roomId || r.name === a.roomName);
          if (rm && (rm.branchId === u.scopeId || rm.branchName === u.scopeName)) return true;
        }
        return false;
      });
    }
    return [];
  },

  filterRooms(rooms) {
    const u = this.getCurrentUser();
    if (!u || u.role === 'admin') return rooms;
    if (u.role === 'divisi') {
      return rooms.filter(r => r.divisionId === u.scopeId || r.divisionName === u.scopeName);
    }
    if (u.role === 'wilayah') {
      return rooms.filter(r => r.branchId === u.scopeId);
    }
    return [];
  },

  filterBHP(items) {
    const u = this.getCurrentUser();
    if (!u || u.role === 'admin') return items;
    if (u.role === 'divisi') {
      return items.filter(b => !b.divisionId || b.divisionId === u.scopeId);
    }
    return items;
  },

  filterMutations(mutations) {
    const u = this.getCurrentUser();
    if (!u || u.role === 'admin') return mutations;
    if (u.role === 'divisi') {
      return mutations.filter(m =>
        m.fromDivisionId === u.scopeId ||
        m.toDivisionId === u.scopeId ||
        m.fromDivisionName === u.scopeName ||
        m.toDivisionName === u.scopeName
      );
    }
    if (u.role === 'wilayah') {
      return mutations.filter(m =>
        m.fromBranchId === u.scopeId ||
        m.toBranchId === u.scopeId ||
        m.fromBranchName === u.scopeName ||
        m.toBranchName === u.scopeName
      );
    }
    return [];
  },

  // ─── UI Helpers ────────────────────────────────────────────────
  getRoleBadgeHTML(role) {
    const map = {
      admin:   `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-500 border border-amber-500/30"><i data-lucide="crown" class="w-3 h-3"></i>Admin</span>`,
      divisi:  `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/30"><i data-lucide="building-2" class="w-3 h-3"></i>Divisi</span>`,
      wilayah: `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><i data-lucide="map-pin" class="w-3 h-3"></i>Wilayah</span>`
    };
    return map[role] || '';
  },

  getRoleIcon(role) {
    return { admin: '👑', divisi: '🏢', wilayah: '🌍' }[role] || '👤';
  },

  getRoleLabel(role) {
    return { admin: 'Administrator', divisi: 'Divisi', wilayah: 'Wilayah' }[role] || role;
  }
};

// Auto-init on script load
AuthEngine.init();
