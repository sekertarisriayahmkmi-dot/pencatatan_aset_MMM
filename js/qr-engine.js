/**
 * QR-ENGINE.JS - QR Code Generator & Camera Scanner Engine
 * Handles dynamic QR generation, sticker tags, camera scan, and image file scan.
 */

let html5QrScannerInstance = null;
let isCameraRunning = false;

const QREngine = {

  /**
   * Generate QR Code on a container element
   * @param {string|HTMLElement} containerIdOrElem
   * @param {string} text
   * @param {number} size
   */
  generateQR(containerIdOrElem, text, size = 128) {
    const container = typeof containerIdOrElem === 'string' 
      ? document.getElementById(containerIdOrElem) 
      : containerIdOrElem;

    if (!container) return;
    container.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
      new QRCode(container, {
        text: text,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      container.innerHTML = `<span class="text-xs font-mono">${text}</span>`;
    }
  },

  /**
   * Render single asset sticker tag HTML
   * @param {Object} asset
   * @param {Object} settings
   * @returns {string} HTML markup
   */
  generateStickerHTML(asset, settings = null) {
    if (!settings) settings = db.getSettings();
    const instansiName = settings.instansiName || 'INVENTARIS ASET';
    const qrContainerId = `qr-stk-${Math.random().toString(36).substr(2, 9)}`;

    setTimeout(() => {
      this.generateQR(qrContainerId, asset.code, 80);
    }, 50);

    return `
      <div class="asset-sticker-card">
        <div class="sticker-qr-box" id="${qrContainerId}"></div>
        <div class="sticker-info">
          <div class="sticker-instansi">${instansiName}</div>
          <div class="sticker-name" title="${asset.name}">${asset.name}</div>
          <div class="sticker-code">${asset.code}</div>
          <div class="sticker-room"><i data-lucide="map-pin" class="inline w-3 h-3"></i> ${asset.roomName || '-'}</div>
          <div class="text-[8px] text-slate-400 mt-1">Beli: ${asset.date || '-'} | ${asset.condition || 'Baik'}</div>
        </div>
      </div>
    `;
  },

  /**
   * Start or Stop Live Camera QR Scanner
   */
  async toggleCamera() {
    const btn = document.getElementById('btn-toggle-camera');
    const placeholder = document.getElementById('camera-idle-placeholder');

    if (isCameraRunning) {
      this.stopCamera();
      if (btn) btn.innerHTML = `<i data-lucide="video" class="w-4 h-4"></i> Mulai Kamera`;
      if (placeholder) placeholder.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
      return;
    }

    try {
      if (!html5QrScannerInstance) {
        html5QrScannerInstance = new Html5Qrcode('qr-reader');
      }

      if (placeholder) placeholder.classList.add('hidden');
      if (btn) btn.innerHTML = `<i data-lucide="video-off" class="w-4 h-4"></i> Matikan Kamera`;
      if (window.lucide) lucide.createIcons();

      const config = { fps: 15, qrbox: { width: 260, height: 260 } };

      await html5QrScannerInstance.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          this.onScanSuccess(decodedText);
        },
        () => {
          // Frame error (ignore)
        }
      );

      isCameraRunning = true;
      showToast('📸 Kamera aktif! Arahkan kamera tepat ke QR Code stiker.', 'info');
    } catch (err) {
      console.error('Failed to start camera scanner', err);
      showToast('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.', 'danger');
      if (btn) btn.innerHTML = `<i data-lucide="video" class="w-4 h-4"></i> Mulai Kamera`;
      if (placeholder) placeholder.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
      isCameraRunning = false;
    }
  },

  /**
   * Stop running camera
   */
  stopCamera() {
    if (html5QrScannerInstance && isCameraRunning) {
      html5QrScannerInstance.stop().then(() => {
        isCameraRunning = false;
      }).catch(err => {
        console.error('Stop error', err);
        isCameraRunning = false;
      });
    }
  },

  /**
   * Handler when QR scan succeeds
   * @param {string} decodedText
   */
  onScanSuccess(decodedText) {
    if (navigator.vibrate) navigator.vibrate(100);

    const asset = db.getAssetById(decodedText);
    const resultContainer = document.getElementById('scan-result-card');
    if (!resultContainer) return;

    if (typeof confetti === 'function') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }

    if (asset) {
      showToast(`✅ Aset Ditemukan: ${asset.name}`, 'success');
      this.renderScannedAssetDetail(asset, resultContainer);
    } else {
      showToast(`QR terbaca "${decodedText}", belum terdaftar dalam inventaris.`, 'warning');
      resultContainer.innerHTML = `
        <div class="p-6 text-center bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <i data-lucide="alert-triangle" class="w-6 h-6"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 dark:text-slate-100 text-base">Aset Tidak Ditemukan</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Isi QR Code Terbaca:</p>
            <div class="inline-block mt-1 px-3 py-1 font-mono font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-amber-600 dark:text-amber-400 max-w-full truncate">${decodedText}</div>
          </div>
          <p class="text-xs text-slate-400">Kode atau nomor inventaris ini belum tersimpan di database.</p>
          <div class="pt-2">
            <button onclick="openModalTambahAsetWithCode('${decodedText}')" class="btn-primary text-xs">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> Daftarkan Sebagai Aset Baru
            </button>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  },

  /**
   * Scan QR Code from uploaded image file
   */
  async scanFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      this.onScanSuccess(decodedText);
    } catch (err) {
      console.error('File scan error', err);
      showToast('Tidak dapat mendeteksi QR Code dari gambar yang dipilih.', 'danger');
    }
  },

  /**
   * Render scanned asset card (Comprehensive Passport Inspection Card)
   */
  renderScannedAssetDetail(asset, container) {
    const calc = DepreciationEngine.calculateCurrentValue(asset);
    const formattedPrice = DepreciationEngine.formatRupiah(asset.price);
    const formattedBook = DepreciationEngine.formatRupiah(calc.bookValue);
    const formattedDeprec = DepreciationEngine.formatRupiah(calc.accumulatedDepreciation);

    let conditionBadge = '<span class="badge badge-success">Kondisi Baik</span>';
    if (asset.condition === 'Rusak Ringan') conditionBadge = '<span class="badge badge-warning">Rusak Ringan</span>';
    if (asset.condition === 'Rusak Berat') conditionBadge = '<span class="badge badge-danger">Rusak Berat</span>';

    // Check if asset is assigned in BAST
    const bastList = typeof db.getBASTList === 'function' ? db.getBASTList() : [];
    const activeBAST = bastList.find(b => (b.assetId === asset.id || b.assetCode === asset.code) && b.status === 'Aktif');

    // Check if asset is currently lent
    const lendings = db.getLendings();
    const activeLending = lendings.find(l => (l.assetId === asset.id || l.assetCode === asset.code) && l.status === 'Dipinjam');

    const qrId = `qr-scan-preview-${asset.id}`;

    container.innerHTML = `
      <div class="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4 shadow-sm animate-fadeIn">
        
        <!-- Header Info & Status -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div class="flex items-center gap-3 min-w-0">
            ${asset.image ? `
              <div class="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex-shrink-0 shadow-sm">
                <img src="${asset.image}" alt="${asset.name}" class="w-full h-full object-cover">
              </div>
            ` : `
              <div class="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center flex-shrink-0">
                <i data-lucide="package" class="w-7 h-7"></i>
              </div>
            `}
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">${asset.code}</span>
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${asset.categoryName || '-'}</span>
              </div>
              <h4 class="text-base font-bold text-slate-900 dark:text-slate-100 font-heading truncate mt-0.5">${asset.name}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">${asset.brand || 'Tanpa Merek'} ${asset.serial ? '• No. Seri: ' + asset.serial : ''}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            ${conditionBadge}
            <span class="badge badge-info">${asset.qty || 1} ${asset.unit || 'Unit'}</span>
          </div>
        </div>

        <!-- BAST or Lending Alert Banner (If Applicable) -->
        ${activeBAST ? `
          <div class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-blue-700 dark:text-blue-300">
            <div class="flex items-center gap-2">
              <i data-lucide="file-signature" class="w-4 h-4 text-blue-500 flex-shrink-0"></i>
              <div>
                <strong>Dipegang Melalui BAST:</strong> ${activeBAST.recipientName} (${activeBAST.amanah} - ${activeBAST.region})
              </div>
            </div>
            <button onclick="openModalDetailBAST('${activeBAST.id}')" class="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0">Lihat BAST</button>
          </div>
        ` : ''}

        ${activeLending ? `
          <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300">
            <div class="flex items-center gap-2">
              <i data-lucide="arrow-left-right" class="w-4 h-4 text-amber-500 flex-shrink-0"></i>
              <div>
                <strong>Status Peminjaman:</strong> Sedang dipinjam oleh <strong>${activeLending.borrower}</strong> s/d ${activeLending.returnDate}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 4 Grid Key Info Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span class="text-[11px] text-slate-400 block">Ruangan:</span>
            <strong class="text-slate-800 dark:text-slate-200 font-semibold truncate block mt-0.5">${asset.roomName || '-'}</strong>
          </div>
          <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span class="text-[11px] text-slate-400 block">Penanggung Jawab:</span>
            <strong class="text-slate-800 dark:text-slate-200 font-semibold truncate block mt-0.5">${asset.pic || '-'}</strong>
          </div>
          <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span class="text-[11px] text-slate-400 block">Harga Beli Awal:</span>
            <strong class="text-slate-800 dark:text-slate-200 font-bold truncate block mt-0.5">${formattedPrice}</strong>
          </div>
          <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30">
            <span class="text-[11px] text-slate-400 block">Nilai Buku Terkini:</span>
            <strong class="text-emerald-600 dark:text-emerald-400 font-extrabold truncate block mt-0.5">${formattedBook}</strong>
          </div>
        </div>

        <!-- Depreciation Progress Info -->
        <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
          <div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Penyusutan Nilai (${calc.depreciationPercentage}%): <strong class="text-rose-500">-${formattedDeprec}</strong></span>
            <span>Masa Manfaat: <strong>${asset.lifespan || 4} Tahun</strong></span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-amber-500 h-2 rounded-full" style="width: ${calc.depreciationPercentage}%"></div>
          </div>
          <div class="flex justify-between text-[11px] text-slate-400">
            <span>Tgl Perolehan: ${asset.date || '-'} (${calc.ageInMonths} Bulan Pakai)</span>
            <span>${calc.isExpired ? '⚠️ Masa Manfaat Habis' : `Sisa ${Math.max(0, (asset.lifespan || 4) - (calc.ageInYears)).toFixed(1)} Tahun`}</span>
          </div>
        </div>

        ${asset.notes ? `
          <div class="text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span class="text-slate-400 block mb-0.5 font-semibold">Catatan / Spesifikasi:</span>
            <p class="text-slate-700 dark:text-slate-300 italic">${asset.notes}</p>
          </div>
        ` : ''}

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div class="flex items-center gap-2">
            <button onclick="openModalEditAset('${asset.id}')" class="btn-primary text-xs">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Masuk Form Penginputan (Edit)
            </button>
            <button onclick="openModalDetailAset('${asset.id}')" class="btn-secondary text-xs">
              <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i> Buku Induk 16 Kolom
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="openModalTambahBAST(); setTimeout(function(){ document.getElementById('bast-asset-select').value='${asset.id}'; onBASTAssetSelectChange(); }, 100);" class="btn-secondary text-xs">
              <i data-lucide="file-signature" class="w-3.5 h-3.5 text-blue-500"></i> Buat BAST
            </button>
            <button onclick="printSingleSticker('${asset.id}')" class="btn-secondary text-xs">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i> Cetak Stiker
            </button>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

};
