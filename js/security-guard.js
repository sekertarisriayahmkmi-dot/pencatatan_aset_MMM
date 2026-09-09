/**
 * ============================================================================
 * SECURITY GUARD ENGINE - MASJID KAPAL MUNZALAN MUBARAKAN
 * Proteksi Frontend: Anti-Inspect, Anti-F12, Anti-RightClick & Console Defense
 * ============================================================================
 */

(function () {
  'use strict';

  // 1. Tampilkan Banner Peringatan di Console
  const showConsoleWarning = () => {
    try {
      console.clear();
      console.log(
        '%c🕌 SISTEM MANAJEMEN ASET MASJID MUNZALAN MUBARAKAN 🕌',
        'color: #10b981; font-size: 20px; font-weight: 900; background: #064e3b; padding: 8px 16px; border-radius: 8px;'
      );
      console.log(
        '%c⚠️ PERINGATAN KEAMANAN TINGKAT TINGGI!',
        'color: #ef4444; font-size: 16px; font-weight: 800; margin-top: 6px;'
      );
      console.log(
        '%cHalaman ini dan seluruh data aset dilindungi oleh sistem keamanan terenkripsi. Segala bentuk modifikasi lokal tidak akan berpengaruh pada database pusat dan dapat dicatat dalam audit trail sistem.',
        'color: #f59e0b; font-size: 13px; line-height: 1.5;'
      );
    } catch (e) {}
  };

  showConsoleWarning();
  setInterval(showConsoleWarning, 15000);

  // Helper untuk menampilkan notifikasi toast keamanan
  const triggerSecurityToast = (pesan) => {
    if (typeof showToast === 'function') {
      showToast(pesan || 'Aksi ini dibatasi demi keamanan data sistem.', 'warning');
    }
  };

  // 2. Blokir Klik Kanan (Context Menu)
  document.addEventListener('contextmenu', function (e) {
    // Izinkan klik kanan jika pada input text atau textarea agar user tetap bisa copy-paste teks miliknya
    const targetTag = e.target.tagName.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
      return;
    }
    e.preventDefault();
    triggerSecurityToast('Fitur Klik Kanan (Inspect) dinonaktifkan.');
    return false;
  }, { passive: false });

  // 3. Blokir Shortcut Keyboard Terkait Inspect Element
  document.addEventListener('keydown', function (e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      triggerSecurityToast('Shortcut F12 (Developer Tools) dinonaktifkan.');
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Developer Tools / Console / Inspector)
    if (ctrlOrCmd && e.shiftKey && (
      e.key === 'I' || e.key === 'i' || e.keyCode === 73 ||
      e.key === 'J' || e.key === 'j' || e.keyCode === 74 ||
      e.key === 'C' || e.key === 'c' || e.keyCode === 67
    )) {
      e.preventDefault();
      e.stopPropagation();
      triggerSecurityToast('Shortcut Inspect Element dinonaktifkan.');
      return false;
    }

    // Ctrl+U (View Page Source)
    if (ctrlOrCmd && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      triggerSecurityToast('View Source dinonaktifkan.');
      return false;
    }

    // Ctrl+S (Save Webpage)
    if (ctrlOrCmd && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 4. Cegah Dragging Gambar / Aset Sensitif
  document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.tagName.toLowerCase() === 'img') {
      e.preventDefault();
    }
  });

  // 5. Anti Debugger Loop (Jika DevTools tetap dipaksa buka di browser)
  let devtoolsOpen = false;
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function () {
      devtoolsOpen = true;
    }
  });

  // Log status aman
  window.SecurityGuard = {
    status: 'ACTIVE',
    version: '1.0.0',
    institution: 'Masjid Munzalan Mubarakan'
  };
})();
