/**
 * REPORTS.JS - Multi-Format Report Generator & Sheet Engine
 * Supports A4 / F4 (Folio), dynamic Kop Surat (Banner/Text), KIR, Excel export.
 */

let currentPaperSize = 'a4'; // 'a4' or 'f4'

const ReportEngine = {

  /**
   * Set paper size (A4 / F4)
   * @param {string} size 'a4' or 'f4'
   */
  setPaper(size) {
    currentPaperSize = size;
    const btnA4 = document.getElementById('btn-paper-a4');
    const btnF4 = document.getElementById('btn-paper-f4');
    const sheet = document.getElementById('report-preview-sheet');

    if (btnA4 && btnF4 && sheet) {
      if (size === 'a4') {
        btnA4.classList.add('active');
        btnF4.classList.remove('active');
        sheet.className = 'paper-sheet paper-a4 bg-white shadow-2xl p-8 text-slate-900 font-serif';
      } else {
        btnF4.classList.add('active');
        btnA4.classList.remove('active');
        sheet.className = 'paper-sheet paper-f4 bg-white shadow-2xl p-8 text-slate-900 font-serif';
      }
    }
  },

  /**
   * Generate Kop Surat Header HTML (Banner Image or Official Text)
   * @param {Object} settings
   * @returns {string} HTML
   */
  renderKopSuratHTML(settings) {
    if (!settings) settings = (typeof db !== 'undefined' && db.getScopeSettings) ? db.getScopeSettings() : db.getSettings();

    // If user uploaded a Banner Kop image and chose to use it
    if (settings.useKopBanner && settings.kopBannerImage) {
      return `
        <div style="margin-bottom: 20px; text-align: center; border-bottom: 3px double #000; padding-bottom: 8px;">
          <img src="${settings.kopBannerImage}" alt="Kop Surat Resmi" style="max-width: 100%; max-height: 120px; object-fit: contain; margin: 0 auto;">
        </div>
      `;
    }

    // Default text-based official Kop Surat
    const logoHTML = settings.logoImage 
      ? `<img src="${settings.logoImage}" class="official-kop-logo" alt="Logo">`
      : '';

    return `
      <div class="official-kop-text" style="position: relative; text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px;">
        ${logoHTML}
        <div style="padding-left: ${settings.logoImage ? '75px' : '0'}; padding-right: ${settings.logoImage ? '75px' : '0'};">
          <p style="font-size: 11pt; font-weight: bold; margin: 0; text-transform: uppercase;">${settings.instansiParent || 'PEMERINTAH DAERAH / YAYASAN PENGELOLA'}</p>
          <h2 style="font-size: 15pt; font-weight: bold; margin: 2px 0; text-transform: uppercase;">${settings.instansiName || 'NAMA INSTANSI / LEMBAGA'}</h2>
          <p style="font-size: 9pt; margin: 2px 0 0; line-height: 1.3;">${settings.instansiAddress || 'Alamat Lengkap Instansi'}</p>
          <p style="font-size: 8.5pt; margin: 2px 0 0;">Telp: ${settings.instansiPhone || '-'} | Email: ${settings.instansiEmail || '-'}</p>
        </div>
      </div>
    `;
  },

  /**
   * Generate Signature Section HTML
   * @param {Object} settings
   * @param {string} leftTitle (e.g., Penanggung Jawab Ruangan or Pengurus Barang)
   * @param {string} leftName
   * @param {string} leftNip
   * @returns {string} HTML
   */
  renderSignaturesHTML(settings, leftTitle = null, leftName = null, leftNip = null) {
    if (!settings) settings = (typeof db !== 'undefined' && db.getScopeSettings) ? db.getScopeSettings() : db.getSettings();
    const todayStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

    const titleLeft = leftTitle || settings.assetOfficerTitle || 'Pengurus Barang';
    const nameLeft = leftName || settings.assetOfficerName || '( ................................... )';
    const nipLeft = leftNip ? `NIP. ${leftNip}` : '';

    return `
      <div class="doc-signatures" style="margin-top: 35px; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 10pt;">
        <div class="sig-block" style="text-align: center; width: 220px;">
          <p>Mengetahui / Menyetujui,</p>
          <p style="font-weight: bold;">${titleLeft}</p>
          <div class="sig-space" style="height: 60px;"></div>
          <p style="font-weight: bold; text-decoration: underline;">${nameLeft}</p>
          <p style="font-size: 9pt;">${nipLeft}</p>
        </div>

        <div class="sig-block" style="text-align: center; width: 220px;">
          <p>${settings.city || 'Jakarta'}, ${todayStr}</p>
          <p style="font-weight: bold;">${settings.leaderTitle || 'Kepala Instansi'}</p>
          <div class="sig-space" style="height: 60px;"></div>
          <p style="font-weight: bold; text-decoration: underline;">${settings.leaderName || '( ................................... )'}</p>
          <p style="font-size: 9pt;">${settings.leaderNip ? 'NIP. ' + settings.leaderNip : ''}</p>
        </div>
      </div>
    `;
  },

  /**
   * 1. Generate Buku Induk Rekapitulasi Semua Aset
   */
  generateBukuIndukHTML(filteredAssets, settings) {
    let totalNominal = 0;
    let totalBuku = 0;

    let rowsHTML = '';
    filteredAssets.forEach((a, idx) => {
      const calc = DepreciationEngine.calculateCurrentValue(a, settings);
      totalNominal += (parseFloat(a.price) || 0);
      totalBuku += calc.bookValue;

      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; font-size: 8.5pt;">${a.code}</td>
          <td><strong>${a.name}</strong><br><small style="color: #475569;">${a.brand || '-'}</small></td>
          <td>${a.categoryName || '-'}</td>
          <td style="text-align: center; font-weight: bold; color: #047857;">${a.qty || 1} ${a.unit || 'Unit'}</td>
          <td>${a.roomName || '-'}</td>
          <td style="text-align: center;">${a.date ? a.date.split('-')[0] : '-'}</td>
          <td style="text-align: center;">${a.condition}</td>
          <td style="text-align: right;">${DepreciationEngine.formatRupiah(a.price)}</td>
          <td style="text-align: right; font-weight: bold;">${DepreciationEngine.formatRupiah(calc.bookValue)}</td>
        </tr>
      `;
    });

    return `
      ${this.renderKopSuratHTML(settings)}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0;">BUKU INDUK INVENTARIS BARANG (REKAPITULASI ASET)</h3>
        <p style="font-size: 9pt; color: #475569; margin-top: 3px;">Tahun Anggaran ${new Date().getFullYear()} - Ukuran Kertas: ${currentPaperSize.toUpperCase()}</p>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Kode Aset</th>
            <th>Nama Barang & Merek</th>
            <th>Kategori</th>
            <th style="width: 60px;">Jumlah</th>
            <th>Ruangan</th>
            <th>Tahun</th>
            <th>Kondisi</th>
            <th>Harga Beli (Rp)</th>
            <th>Nilai Buku (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || '<tr><td colspan="10" style="text-align: center; padding: 20px;">Tidak ada data aset yang sesuai filter</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="8" style="text-align: right; padding-right: 10px;">TOTAL VALUASI ASET:</td>
            <td style="text-align: right;">${DepreciationEngine.formatRupiah(totalNominal)}</td>
            <td style="text-align: right; color: #047857;">${DepreciationEngine.formatRupiah(totalBuku)}</td>
          </tr>
        </tfoot>
      </table>

      ${this.renderSignaturesHTML(settings)}
    `;
  },

  /**
   * 2. Generate Kartu Inventaris Ruangan (KIR) - Format Standar Kuning
   */
  generateKIRHTML(roomId, settings) {
    const rooms = db.getRooms();
    const room = rooms.find(r => r.id === roomId) || { name: 'Semua Ruangan', floor: 'Gedung Utama', pj: '-', pjNip: '-' };
    
    const assets = db.getAssets();
    const roomAssets = roomId ? assets.filter(a => a.roomId === roomId || a.roomName === room.name) : assets;

    let totalNominal = 0;
    let totalQty = 0;
    let countB = 0;
    let countRR = 0;
    let countRB = 0;

    let rowsHTML = '';

    roomAssets.forEach((a, idx) => {
      const qty = a.qty || 1;
      totalQty += qty;
      const unitPrice = a.unitPrice || (a.qty ? (a.price / a.qty) : a.price) || 0;
      const itemTotal = a.price || (unitPrice * qty);
      totalNominal += itemTotal;

      let cond = a.condition || 'B';
      if (cond === 'Baik') cond = 'B';
      else if (cond === 'Rusak Ringan') cond = 'RR';
      else if (cond === 'Rusak Berat') cond = 'RB';

      if (cond === 'B') countB += qty;
      else if (cond === 'RR') countRR += qty;
      else if (cond === 'RB') countRB += qty;

      const year = a.productionYear || a.tahunPembuatan || (a.date ? a.date.split('-')[0] : '-');

      rowsHTML += `
        <tr>
          <td style="text-align: center; padding: 4px; border: 1px solid #444;">${idx + 1}</td>
          <td style="padding: 4px; border: 1px solid #444; font-weight: 600;">${a.name}</td>
          <td style="padding: 4px; border: 1px solid #444; font-family: monospace; font-weight: bold;">${a.code}</td>
          <td style="padding: 4px; border: 1px solid #444;">${a.brandType || a.brand || '-'}</td>
          <td style="padding: 4px; border: 1px solid #444;">${a.size || a.ukuran || '-'}</td>
          <td style="padding: 4px; border: 1px solid #444;">${a.material || a.bahan || '-'}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #444;">${year}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #444; font-weight: bold;">${qty}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #444;">${a.unit || 'Unit'}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #444; font-weight: bold; background-color: ${cond === 'B' ? '#dcfce7' : '#fff'};">${cond === 'B' ? '✓' : '-'}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #444; font-weight: bold; background-color: ${cond === 'RR' ? '#fef3c7' : '#fff'};">${cond === 'RR' ? '✓' : '-'}</td>
          <td style="text-align: center; padding: 4px; border: 1px solid #444; font-weight: bold; background-color: ${cond === 'RB' ? '#fee2e2' : '#fff'};">${cond === 'RB' ? '✓' : '-'}</td>
          <td style="padding: 4px; border: 1px solid #444;">${a.notes || a.keterangan || '-'}</td>
        </tr>
      `;
    });

    const division = (room && room.divisionId) ? db.getDivisionById(room.divisionId) : null;
    const roomSettings = division ? {
      ...settings,
      instansiName: division.name,
      instansiParent: division.parent || settings.instansiParent,
      logoImage: division.logo || settings.logoImage
    } : settings;

    return `
      ${this.renderKopSuratHTML(roomSettings)}
      
      <div style="text-align: center; margin-bottom: 12px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0; color: #b45309; letter-spacing: 0.5px;">KARTU INVENTARIS RUANGAN (KIR)</h3>
        <p style="font-size: 8.5pt; color: #475569; margin: 2px 0 0;">Standar Format Inventarisasi Sarana & Prasarana Ruangan</p>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 8px; background: #fffbeb; padding: 8px 12px; border-radius: 6px; border: 1px solid #fde68a;">
        <div>
          <div>Ruangan / Lokasi : <strong>${room.name}</strong></div>
          <div>Gedung / Lantai : ${room.floor || 'Gedung Utama'}</div>
          ${division ? `<div style="color: #b45309; font-weight: bold; margin-top: 2px;">Divisi Pengelola : ${division.name}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div>Penanggung Jawab : <strong>${room.pj || '-'}</strong></div>
          <div>NIP / ID : ${room.pjNip || '-'}</div>
        </div>
      </div>

      <table class="doc-table" style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 6px;">
        <thead>
          <tr style="background-color: #fbbf24; color: #000; font-weight: bold; text-transform: uppercase; font-size: 8pt;">
            <th rowspan="2" style="width: 25px; border: 1px solid #333; text-align: center;">No. Urut</th>
            <th rowspan="2" style="border: 1px solid #333; min-width: 130px;">Nama/Jenis Barang</th>
            <th rowspan="2" style="border: 1px solid #333; min-width: 90px;">No. Kode Barang</th>
            <th rowspan="2" style="border: 1px solid #333;">Merk/Type</th>
            <th rowspan="2" style="border: 1px solid #333;">Ukuran</th>
            <th rowspan="2" style="border: 1px solid #333;">Bahan</th>
            <th rowspan="2" style="width: 40px; border: 1px solid #333; text-align: center;">Tahun Perolehan</th>
            <th rowspan="2" style="width: 35px; border: 1px solid #333; text-align: center;">Jumlah Barang</th>
            <th rowspan="2" style="width: 35px; border: 1px solid #333; text-align: center;">Satuan</th>
            <th colspan="3" style="border: 1px solid #333; text-align: center; background-color: #f59e0b;">Kondisi</th>
            <th rowspan="2" style="border: 1px solid #333; min-width: 90px;">Keterangan</th>
          </tr>
          <tr style="background-color: #fde68a; color: #000; font-size: 7.5pt; font-weight: bold; text-align: center;">
            <th style="width: 28px; border: 1px solid #333; background-color: #86efac;" title="Baik">B</th>
            <th style="width: 28px; border: 1px solid #333; background-color: #fde047;" title="Rusak Ringan">RR</th>
            <th style="width: 28px; border: 1px solid #333; background-color: #fca5a5;" title="Rusak Berat">RB</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || '<tr><td colspan="13" style="text-align: center; padding: 15px; border: 1px solid #333;">Belum ada barang di ruangan ini</td></tr>'}
          <tr style="background: #fef3c7; font-weight: bold; border-top: 2px solid #333;">
            <td colspan="7" style="text-align: right; padding: 5px; border: 1px solid #333;">REKAP JUMLAH UNIT & KONDISI:</td>
            <td style="text-align: center; padding: 5px; border: 1px solid #333; font-size: 9pt;">${totalQty}</td>
            <td style="text-align: center; padding: 5px; border: 1px solid #333;">Unit</td>
            <td style="text-align: center; padding: 5px; border: 1px solid #333; background: #86efac;">${countB}</td>
            <td style="text-align: center; padding: 5px; border: 1px solid #333; background: #fde047;">${countRR}</td>
            <td style="text-align: center; padding: 5px; border: 1px solid #333; background: #fca5a5;">${countRB}</td>
            <td style="border: 1px solid #333;"></td>
          </tr>
        </tbody>
      </table>

      ${this.renderSignaturesHTML(settings, 'Penanggung Jawab Ruangan', room.pj, room.pjNip)}
    `;
  },

  /**
   * Export KIR Current Room to Excel (.XLSX) - Format Standar Kuning
   */
  exportKIRCurrentRoomToExcel(roomId = null, filename = null) {
    if (typeof XLSX === 'undefined') {
      showToast('SheetJS belum siap. Silakan coba lagi.', 'danger');
      return;
    }

    const targetRoomId = roomId || currentSelectedRoomId;
    const rooms = db.getRooms();
    const targetRoom = rooms.find(r => r.id === targetRoomId) || rooms[0];
    const roomName = targetRoom ? targetRoom.name : 'Semua Ruangan';
    const assets = db.getAssets().filter(a => a.roomId === targetRoomId || (targetRoom && a.roomName === targetRoom.name));

    const finalFilename = filename || `KIR_${roomName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

    const excelRows = assets.map((a, idx) => {
      let cond = a.condition || 'B';
      if (cond === 'Baik') cond = 'B';
      else if (cond === 'Rusak Ringan') cond = 'RR';
      else if (cond === 'Rusak Berat') cond = 'RB';

      const year = a.productionYear || a.tahunPembuatan || (a.date ? a.date.split('-')[0] : '-');

      return {
        'No. Urut': idx + 1,
        'Nama/Jenis Barang': a.name || '-',
        'No. Kode Barang': a.code || '-',
        'Merk/Type': a.brandType || a.brand || '-',
        'Ukuran': a.size || a.ukuran || '-',
        'Bahan': a.material || a.bahan || '-',
        'Tahun Perolehan': year,
        'Jumlah Barang': a.qty || 1,
        'Satuan': a.unit || 'Unit',
        'Kondisi - B (Baik)': cond === 'B' ? (a.qty || 1) : '',
        'Kondisi - RR (Rusak Ringan)': cond === 'RR' ? (a.qty || 1) : '',
        'Kondisi - RB (Rusak Berat)': cond === 'RB' ? (a.qty || 1) : '',
        'Keterangan': a.notes || a.keterangan || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KIR');
    XLSX.writeFile(workbook, finalFilename);
    showToast(`File Excel KIR Ruangan "${roomName}" berhasil diunduh!`, 'success');
  },

  /**
   * 3. Generate Laporan Aset Rusak & Perlu Servis
   */
  generateDamagedAssetsHTML(settings) {
    const assets = db.getAssets().filter(a => a.condition === 'Rusak Ringan' || a.condition === 'Rusak Berat');

    let rowsHTML = '';
    assets.forEach((a, idx) => {
      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace;">${a.code}</td>
          <td><strong>${a.name}</strong> (${a.brand || '-'})</td>
          <td>${a.roomName}</td>
          <td style="font-weight: bold; color: ${a.condition === 'Rusak Berat' ? '#b91c1c' : '#b45309'}; text-align: center;">${a.condition}</td>
          <td style="text-align: right;">${DepreciationEngine.formatRupiah(a.price)}</td>
          <td>${a.notes || 'Perlu tindakan perbaikan'}</td>
        </tr>
      `;
    });

    return `
      ${this.renderKopSuratHTML(settings)}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0;">LAPORAN BARANG INVENTARIS RUSAK / PERLU PERBAIKAN</h3>
        <p style="font-size: 9pt; color: #475569; margin-top: 3px;">Daftar Rekomendasi Pemeliharaan & Tindakan Teknis</p>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Kode Aset</th>
            <th>Nama Barang</th>
            <th>Ruangan Asal</th>
            <th>Kondisi Kerusakan</th>
            <th>Harga Perolehan</th>
            <th>Keterangan / Diagnosa Kerusakan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || '<tr><td colspan="7" style="text-align: center; padding: 20px;">Semua aset dalam kondisi Baik</td></tr>'}
        </tbody>
      </table>

      ${this.renderSignaturesHTML(settings)}
    `;
  },

  /**
   * 4. Generate Berita Acara Penghapusan Aset (Disposal)
   */
  generateDisposalReportHTML(settings) {
    const disposals = db.getDisposals();
    let totalNominal = 0;

    let rowsHTML = '';
    disposals.forEach((d, idx) => {
      totalNominal += (parseFloat(d.price) || 0);
      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${d.date || '-'}</td>
          <td style="font-family: monospace;">${d.assetCode}</td>
          <td><strong>${d.assetName}</strong></td>
          <td>${d.roomName || '-'}</td>
          <td style="font-weight: bold;">${d.reason}</td>
          <td>${d.docNo || '-'}</td>
          <td style="text-align: right;">${DepreciationEngine.formatRupiah(d.price)}</td>
        </tr>
      `;
    });

    return `
      ${this.renderKopSuratHTML(settings)}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0;">BERITA ACARA & REKAPITULASI PENGHAPUSAN ASET (PEMUTIHAN)</h3>
        <p style="font-size: 9pt; color: #475569; margin-top: 3px;">Daftar Barang Inventaris yang Telah Dihapusbukukan dari Buku Induk</p>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Tgl Hapus</th>
            <th>Kode Aset</th>
            <th>Nama Barang</th>
            <th>Ruangan Asal</th>
            <th>Alasan Penghapusan</th>
            <th>No. Dokumen / BA</th>
            <th>Nilai Perolehan (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || '<tr><td colspan="8" style="text-align: center; padding: 20px;">Belum ada data penghapusan aset</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="7" style="text-align: right; padding-right: 10px;">TOTAL NILAI ASET DIHAPUSKAN:</td>
            <td style="text-align: right; color: #b91c1c;">${DepreciationEngine.formatRupiah(totalNominal)}</td>
          </tr>
        </tfoot>
      </table>

      ${this.renderSignaturesHTML(settings)}
    `;
  },

  /**
   * 4b. Generate Surat Berita Acara Penghapusan Aset Tunggal (Per Unit Resmi)
   */
  generateSingleDisposalBAHTML(record, settings) {
    if (!settings) settings = db.getSettings();
    const instansi = settings.instansiName || 'MASJID KAPAL MUNZALAN MUBARAKAN';
    const city = settings.city || 'Kubu Raya';
    const baNumber = record.docNo || record.baNumber || `BA.${Math.floor(10 + Math.random() * 90)}/DISP/${new Date().getFullYear()}`;
    const dateFormatted = record.date ? new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const photoHTML = (record.photos && record.photos.length > 0) ? `
      <div style="margin-top: 15px; page-break-inside: avoid;">
        <p style="font-size: 9.5pt; font-weight: bold; margin-bottom: 6px;">Lampiran Foto Bukti Kondisi Fisik / Kerusakan Barang:</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${record.photos.map((p, i) => `
            <div style="border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px; text-align: center; background: #f8fafc;">
              <img src="${p}" style="max-width: 190px; max-height: 140px; object-fit: cover; border-radius: 4px; display: block;" alt="Foto Bukti ${i+1}">
              <span style="font-size: 8pt; color: #64748b; margin-top: 3px; display: block;">Dokumentasi #${i+1}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ((record.evidenceImage) ? `
      <div style="margin-top: 15px; page-break-inside: avoid;">
        <p style="font-size: 9.5pt; font-weight: bold; margin-bottom: 6px;">Lampiran Foto Bukti Fisik Barang:</p>
        <div style="border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px; display: inline-block; background: #f8fafc;">
          <img src="${record.evidenceImage}" style="max-width: 220px; max-height: 150px; object-fit: cover; border-radius: 4px;" alt="Bukti Fisik">
        </div>
      </div>
    ` : '');

    return `
      ${this.renderKopSuratHTML(settings)}
      
      <div style="text-align: center; margin: 15px 0 20px 0;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; text-decoration: underline;">BERITA ACARA PENGHAPUSAN BARANG INVENTARIS</h3>
        <p style="font-size: 9.5pt; font-weight: 600; color: #334155; margin-top: 4px;">Nomor: ${baNumber}</p>
      </div>

      <div style="font-size: 9.5pt; line-height: 1.6; color: #1e293b; text-align: justify; margin-bottom: 12px;">
        Pada hari ini, <strong>${dateFormatted}</strong>, bertempat di lingkungan <strong>${instansi}</strong>, telah dilaksanakan pemeriksaan dan verifikasi fisik terhadap barang inventaris yang diajukan untuk dihapusbukukan dari Daftar Induk Barang dengan rincian data sebagai berikut:
      </div>

      <table class="doc-table" style="margin-bottom: 15px;">
        <tbody>
          <tr>
            <td style="width: 28%; font-weight: bold; background: #f8fafc;">Kode Aset / Barcode</td>
            <td style="font-family: monospace; font-weight: bold; color: #b91c1c;">${record.assetCode || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Nama Barang Inventaris</td>
            <td style="font-weight: bold; font-size: 10pt;">${record.assetName || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Kategori & Lokasi Ruang</td>
            <td>${record.categoryName || '-'} &nbsp;•&nbsp; <strong>${record.roomName || '-'}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Alasan Penghapusan</td>
            <td style="font-weight: bold; color: #b91c1c;">${record.reason || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Nilai Perolehan Awal</td>
            <td><strong>${DepreciationEngine.formatRupiah(record.price || 0)}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Nilai Buku Saat Dihapus</td>
            <td style="color: #047857; font-weight: bold;">${DepreciationEngine.formatRupiah(record.bookValue || 0)}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Keterangan & Kronologi</td>
            <td>${record.notes || 'Telah diverifikasi tidak lagi memiliki fungsi operasional yang layak dan disetujui untuk dihapuskan.'}</td>
          </tr>
        </tbody>
      </table>

      ${photoHTML}

      <div style="font-size: 9pt; line-height: 1.5; color: #334155; margin-top: 14px; text-align: justify;">
        Demikian Berita Acara Penghapusan Barang ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dapat dipergunakan sebagaimana mestinya sebagai dasar pembukuan dan penghapusan aset dari catatan inventaris.
      </div>

      <div style="margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center; font-size: 9pt; page-break-inside: avoid;">
        <div>
          <p style="margin: 0; color: #64748b;">Diajukan Oleh,</p>
          <p style="margin: 0; font-weight: bold; margin-bottom: 50px;">Petugas / Pengelola</p>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${record.proposedBy || 'Petugas Ruangan'}</p>
          <p style="margin: 0; font-size: 8pt; color: #64748b;">Pengurus Sarpras</p>
        </div>

        <div>
          <p style="margin: 0; color: #64748b;">Diperiksa & Saksi,</p>
          <p style="margin: 0; font-weight: bold; margin-bottom: 50px;">${record.witnessTitle || 'Kepala Bagian Sarpras'}</p>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${record.witnessName || settings.assetOfficerName || 'Tim Verifikasi'}</p>
          <p style="margin: 0; font-size: 8pt; color: #64748b;">Divisi Riayah</p>
        </div>

        <div>
          <p style="margin: 0; color: #64748b;">${city}, ${dateFormatted}</p>
          <p style="margin: 0; font-weight: bold; margin-bottom: 50px;">Menyetujui & Mengesahkan,</p>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${record.approvedBy || settings.leaderName || 'Pimpinan Lembaga'}</p>
          <p style="margin: 0; font-size: 8pt; color: #64748b;">${record.approverTitle || settings.leaderTitle || 'Pimpinan Yayasan'}</p>
        </div>
      </div>
    `;
  },

  /**
   * 4c. Generate Berita Acara Pemeriksaan Fisik & Kerusakan Barang
   */
  generateDamageInspectionBAHTML(report, settings) {
    if (!settings) settings = db.getSettings();
    const instansi = settings.instansiName || 'MASJID KAPAL MUNZALAN MUBARAKAN';
    const city = settings.city || 'Kubu Raya';
    const docNo = report.docNo || `BA.01/RSK-SARPRAS/${new Date().getFullYear()}`;
    const dateFormatted = report.date ? new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const photoHTML = (report.photos && report.photos.length > 0) ? `
      <div style="margin-top: 15px; page-break-inside: avoid;">
        <p style="font-size: 9.5pt; font-weight: bold; margin-bottom: 6px;">Lampiran Foto Dokumentasi Fisik Kerusakan:</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${report.photos.map((p, i) => `
            <div style="border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px; text-align: center; background: #f8fafc;">
              <img src="${p}" style="max-width: 190px; max-height: 140px; object-fit: cover; border-radius: 4px; display: block;" alt="Foto Kerusakan ${i+1}">
              <span style="font-size: 8pt; color: #64748b; margin-top: 3px; display: block;">Foto Kerusakan #${i+1}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    return `
      ${this.renderKopSuratHTML(settings)}
      
      <div style="text-align: center; margin: 15px 0 20px 0;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; text-decoration: underline;">BERITA ACARA PEMERIKSAAN FISIK & KERUSAKAN BARANG</h3>
        <p style="font-size: 9.5pt; font-weight: 600; color: #334155; margin-top: 4px;">Nomor: ${docNo}</p>
      </div>

      <div style="font-size: 9.5pt; line-height: 1.6; color: #1e293b; text-align: justify; margin-bottom: 12px;">
        Pada hari ini, <strong>${dateFormatted}</strong>, telah dilakukan pemeriksaan fisik, uji fungsi, dan verifikasi teknis terhadap barang inventaris yang mengalami kerusakan di lingkungan <strong>${instansi}</strong> dengan rincian sebagai berikut:
      </div>

      <table class="doc-table" style="margin-bottom: 15px;">
        <tbody>
          <tr>
            <td style="width: 28%; font-weight: bold; background: #f8fafc;">Kode Barang / Barcode</td>
            <td style="font-family: monospace; font-weight: bold; color: #b91c1c;">${report.assetCode || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Nama Barang & Spesifikasi</td>
            <td style="font-weight: bold; font-size: 10pt;">${report.assetName || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Kategori & Lokasi Ruang</td>
            <td>${report.categoryName || '-'} &nbsp;•&nbsp; <strong>${report.roomName || '-'}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Tingkat Kerusakan</td>
            <td style="font-weight: bold; color: #b91c1c;">${report.severity || 'Rusak Berat'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Uraian / Kronologi Kerusakan</td>
            <td style="font-style: italic;">${report.damageDescription || report.notes || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Rekomendasi Hasil Pemeriksaan</td>
            <td style="font-weight: bold; color: #047857;">${report.recommendation || 'Usulkan Penghapusan (Pemutihan Aset)'}</td>
          </tr>
        </tbody>
      </table>

      ${photoHTML}

      <div style="font-size: 9pt; line-height: 1.5; color: #334155; margin-top: 14px; text-align: justify;">
        Demikian Berita Acara Pemeriksaan Fisik & Kerusakan Barang ini dibuat berdasarkan hasil pengecekan nyata di lapangan untuk dapat dipergunakan sebagai dokumen pendukung dalam proses perbaikan atau pengajuan penghapusan aset inventaris.
      </div>

      <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: center; font-size: 9pt; page-break-inside: avoid;">
        <div>
          <p style="margin: 0; color: #64748b;">Tim Pemeriksa / Teknisi,</p>
          <div style="height: 55px;"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${report.inspectorName || settings.assetOfficerName || 'Petugas Sarpras'}</p>
          <p style="margin: 0; font-size: 8pt; color: #64748b;">${report.inspectorTitle || 'Divisi Riayah & Sarpras'}</p>
        </div>

        <div>
          <p style="margin: 0; color: #64748b;">${city}, ${dateFormatted}</p>
          <p style="margin: 0; color: #64748b;">Mengetahui Penanggung Jawab,</p>
          <div style="height: 55px;"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${settings.leaderName || 'Pimpinan Lembaga'}</p>
          <p style="margin: 0; font-size: 8pt; color: #64748b;">${settings.leaderTitle || 'Pimpinan Yayasan'}</p>
        </div>
      </div>
    `;
  },

  /**
   * 5. Generate Laporan Penyusutan & Nilai Buku
   */
  generateDepreciationReportHTML(settings) {
    const assets = db.getAssets();
    let totalNominal = 0;
    let totalAkumulasi = 0;
    let totalBuku = 0;

    let rowsHTML = '';
    assets.forEach((a, idx) => {
      const calc = DepreciationEngine.calculateCurrentValue(a, settings);
      totalNominal += (parseFloat(a.price) || 0);
      totalAkumulasi += calc.accumulatedDepreciation;
      totalBuku += calc.bookValue;

      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace;">${a.code}</td>
          <td><strong>${a.name}</strong></td>
          <td style="text-align: center;">${a.date}</td>
          <td style="text-align: center;">${a.lifespan} th</td>
          <td style="text-align: center;">${calc.ageInYears} th</td>
          <td style="text-align: right;">${DepreciationEngine.formatRupiah(a.price)}</td>
          <td style="text-align: right; color: #b45309;">${DepreciationEngine.formatRupiah(calc.accumulatedDepreciation)}</td>
          <td style="text-align: right; font-weight: bold; color: #047857;">${DepreciationEngine.formatRupiah(calc.bookValue)}</td>
        </tr>
      `;
    });

    return `
      ${this.renderKopSuratHTML(settings)}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0;">LAPORAN PENYUSUTAN & NILAI BUKU ASET TETAP</h3>
        <p style="font-size: 9pt; color: #475569; margin-top: 3px;">Metode Garis Lurus (Straight-Line Method) per ${new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Kode Aset</th>
            <th>Nama Barang</th>
            <th>Tgl Perolehan</th>
            <th>Masa Manfaat</th>
            <th>Usia Saat Ini</th>
            <th>Harga Perolehan</th>
            <th>Akumulasi Penyusutan</th>
            <th>Nilai Buku Terkini</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || '<tr><td colspan="9" style="text-align: center; padding: 20px;">Tidak ada data aset</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="6" style="text-align: right; padding-right: 10px;">TOTAL KESELURUHAN:</td>
            <td style="text-align: right;">${DepreciationEngine.formatRupiah(totalNominal)}</td>
            <td style="text-align: right; color: #b45309;">${DepreciationEngine.formatRupiah(totalAkumulasi)}</td>
            <td style="text-align: right; color: #047857;">${DepreciationEngine.formatRupiah(totalBuku)}</td>
          </tr>
        </tfoot>
      </table>

      ${this.renderSignaturesHTML(settings)}
    `;
  },

  /**
   * 6. Generate Laporan Rekapitulasi Nilai & Dana per Kategori
   */
  generateCategoryFinancialReportHTML(settings) {
    const assets = db.getAssets();
    const categories = db.getCategories();
    
    // Group by category
    const catMap = {};
    categories.forEach(c => {
      catMap[c.name] = {
        code: c.code || '-',
        name: c.name,
        count: 0,
        nominal: 0,
        akumulasi: 0,
        buku: 0
      };
    });

    let grandNominal = 0;
    let grandAkumulasi = 0;
    let grandBuku = 0;
    let grandCount = 0;

    assets.forEach(a => {
      const calc = DepreciationEngine.calculateCurrentValue(a, settings);
      const price = parseFloat(a.price) || 0;
      const cName = a.categoryName || 'Lainnya';

      if (!catMap[cName]) {
        catMap[cName] = {
          code: '-',
          name: cName,
          count: 0,
          nominal: 0,
          akumulasi: 0,
          buku: 0
        };
      }

      const qty = parseInt(a.qty) || 1;
      catMap[cName].count += qty;
      catMap[cName].nominal += price;
      catMap[cName].akumulasi += calc.accumulatedDepreciation;
      catMap[cName].buku += calc.bookValue;

      grandNominal += price;
      grandAkumulasi += calc.accumulatedDepreciation;
      grandBuku += calc.bookValue;
      grandCount += qty;
    });

    const entries = Object.values(catMap).filter(c => c.count > 0);
    // Sort by Highest Item Quantity first, then Nominal
    entries.sort((a, b) => (b.count - a.count) || (b.nominal - a.nominal));

    let rowsHTML = '';
    entries.forEach((c, idx) => {
      const qtyPct = grandCount > 0 ? ((c.count / grandCount) * 100).toFixed(0) : '0';
      const danaPct = grandNominal > 0 ? ((c.nominal / grandNominal) * 100).toFixed(1) : '0';
      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; text-align: center;">${c.code}</td>
          <td><strong>${c.name}</strong></td>
          <td style="text-align: center; font-weight: bold; color: #047857;">${c.count} Unit (${qtyPct}%)</td>
          <td style="text-align: right; font-weight: bold;">${DepreciationEngine.formatRupiah(c.nominal)}</td>
          <td style="text-align: right; color: #b45309;">${DepreciationEngine.formatRupiah(c.akumulasi)}</td>
          <td style="text-align: right; font-weight: bold; color: #047857;">${DepreciationEngine.formatRupiah(c.buku)}</td>
          <td style="text-align: center; font-weight: bold; color: #1d4ed8;">${danaPct}%</td>
        </tr>
      `;
    });

    return `
      ${this.renderKopSuratHTML(settings)}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0;">REKAPITULASI INVENTARIS ASET BERDASARKAN KATEGORI</h3>
        <p style="font-size: 9pt; color: #475569; margin-top: 3px;">Rekapitulasi Jumlah Barang Saat Ini, Alokasi Dana & Nilai Buku per ${new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th style="width: 70px;">Kode</th>
            <th>Kategori Barang</th>
            <th style="width: 100px;">Jumlah Barang Saat Ini</th>
            <th>Harga Perolehan (Dana Beli)</th>
            <th>Akumulasi Penyusutan</th>
            <th>Nilai Buku Terkini</th>
            <th style="width: 60px;">Porsi Dana (%)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || '<tr><td colspan="8" style="text-align: center; padding: 20px;">Belum ada data kategori aset</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #0f172a; border-bottom: 3px double #0f172a;">
            <td colspan="3" style="text-align: right; padding-right: 10px; font-weight: 900;">GRAND TOTAL REKAPITULASI:</td>
            <td style="text-align: center; font-weight: 900; color: #047857; font-size: 10.5pt;">${grandCount} Unit (100%)</td>
            <td style="text-align: right; font-weight: 900; color: #b45309;">${DepreciationEngine.formatRupiah(grandNominal)}</td>
            <td style="text-align: right; font-weight: 900; color: #b45309;">${DepreciationEngine.formatRupiah(grandAkumulasi)}</td>
            <td style="text-align: right; font-weight: 900; color: #047857;">${DepreciationEngine.formatRupiah(grandBuku)}</td>
            <td style="text-align: center; font-weight: 900; color: #1d4ed8;">100%</td>
          </tr>
        </tfoot>
      </table>

      ${this.renderSignaturesHTML(settings)}
    `;
  },

  /**
   * Export Assets to formatted Excel Spreadsheet (.XLSX)
   */
  exportAssetsToExcel(customAssets = null, filename = 'Laporan_Inventaris_Aset.xlsx') {
    if (typeof XLSX === 'undefined') {
      showToast('SheetJS belum siap. Silakan coba lagi.', 'danger');
      return;
    }

    try {
      const assets = customAssets || db.getAssets() || [];
      const settings = db.getSettings() || {};

      let excelRows = [];
      if (!assets || assets.length === 0) {
        excelRows = [{
          'No': 1,
          'Tanggal Diterima': new Date().toISOString().split('T')[0],
          'No Induk': '-',
          'Kode Barang': 'CONTOH-001',
          'Nama/Jenis Barang': 'Contoh Nama Aset',
          'Merk/Type': '-',
          'Ukuran': '-',
          'Bahan': '-',
          'Tahun Pembuatan': new Date().getFullYear(),
          'Asal Barang': 'Pembelian',
          'Kelengkapan Dokumen': 'Lengkap',
          'Jumlah Barang': 1,
          'Satuan': 'Unit',
          'Kondisi (B/RR/RB)': 'B',
          'Harga Satuan (Rp)': 0,
          'Harga Jumlah': 0,
          'Keterangan': 'Template Excel Buku Induk (Belum ada data)'
        }];
      } else {
        excelRows = assets.map((a, idx) => {
          const unitPrice = a.unitPrice || (a.qty ? (a.price / a.qty) : a.price) || 0;
          const totalPrice = a.price || (unitPrice * (a.qty || 1));
          let cond = a.condition || 'B';
          if (cond === 'Baik') cond = 'B';
          else if (cond === 'Rusak Ringan') cond = 'RR';
          else if (cond === 'Rusak Berat') cond = 'RB';

          return {
            'No': idx + 1,
            'Tanggal Diterima': a.date || a.tanggalDiterima || '-',
            'No Induk': a.noInduk || '-',
            'Kode Barang': a.code || a.kodeBarang || '-',
            'Nama/Jenis Barang': a.name || a.namaBarang || '-',
            'Merk/Type': a.brandType || a.merkType || a.brand || '-',
            'Ukuran': a.size || a.ukuran || '-',
            'Bahan': a.material || a.bahan || '-',
            'Tahun Pembuatan': a.productionYear || a.tahunPembuatan || '-',
            'Asal Barang': a.source || a.asalBarang || '-',
            'Kelengkapan Dokumen': a.documents || a.kelengkapanDokumen || '-',
            'Jumlah Barang': a.qty || 1,
            'Satuan': a.unit || 'Unit',
            'Kondisi (B/RR/RB)': cond,
            'Harga Satuan (Rp)': unitPrice,
            'Harga Jumlah': totalPrice,
            'Keterangan': a.notes || a.keterangan || '-'
          };
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Induk Barang');
      XLSX.writeFile(workbook, filename);
      showToast(`File Excel Buku Induk "${filename}" berhasil diunduh!`, 'success');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      showToast('Gagal mengekspor Excel: ' + (err.message || err), 'danger');
    }
  },

  /**
   * Export KIB (Kartu Inventaris Barang) to Excel (.XLSX) - 15 Kolom Standar
   */
  exportKIBToExcel(customAssets = null, filename = 'Kartu_Inventaris_Barang_KIB.xlsx') {
    if (typeof XLSX === 'undefined') {
      showToast('SheetJS belum siap. Silakan coba lagi.', 'danger');
      return;
    }

    const assets = customAssets || db.getAssets();

    const excelRows = assets.map((a, idx) => {
      const unitPrice = a.unitPrice || (a.qty ? (a.price / a.qty) : a.price) || 0;
      const totalPrice = a.price || (unitPrice * (a.qty || 1));
      let cond = a.condition || 'B';
      if (cond === 'Baik') cond = 'B';
      else if (cond === 'Rusak Ringan') cond = 'RR';
      else if (cond === 'Rusak Berat') cond = 'RB';

      const year = a.productionYear || a.tahunPembuatan || (a.date ? a.date.split('-')[0] : '-');
      const usedBy = a.usedBy || a.dipergunakanOleh || a.roomName || a.pic || '-';

      return {
        'No. Urut': idx + 1,
        'No Induk': a.noInduk || '-',
        'Nama/Jenis Barang': a.name || '-',
        'Kode Barang': a.code || '-',
        'Merk/Type': a.brandType || a.merkType || a.brand || '-',
        'Ukuran/Kapasitas': a.size || a.ukuran || '-',
        'Tahun Pengadaan': year,
        'Asal Perolehan': a.source || a.asalBarang || '-',
        'Jumlah Barang': a.qty || 1,
        'Satuan': a.unit || 'Unit',
        'Kondisi (B/RR/RB)': cond,
        'Harga Satuan (Rp)': unitPrice,
        'Harga Jumlah': totalPrice,
        'Dipergunakan Oleh/Di': usedBy,
        'Keterangan': a.notes || a.keterangan || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KIB');
    XLSX.writeFile(workbook, filename);
    showToast(`File Excel KIB "${filename}" berhasil diunduh!`, 'success');
  },

  /**
   * Export Category Financial Recap to Excel (.XLSX)
   */
  exportCategoryFinancialToExcel(filename = 'Rekapitulasi_Dana_per_Kategori.xlsx') {
    if (typeof XLSX === 'undefined') {
      showToast('SheetJS belum siap. Silakan coba lagi.', 'danger');
      return;
    }

    const assets = db.getAssets();
    const categories = db.getCategories();
    const settings = db.getSettings();

    const catMap = {};
    categories.forEach(c => {
      catMap[c.name] = {
        'Kode': c.code || '-',
        'Kategori': c.name,
        'Jumlah Unit': 0,
        'Total Harga Perolehan (Rp)': 0,
        'Akumulasi Penyusutan (Rp)': 0,
        'Nilai Buku Terkini (Rp)': 0
      };
    });

    let grandNominal = 0;
    let grandAkumulasi = 0;
    let grandBuku = 0;
    let grandCount = 0;

    assets.forEach(a => {
      const calc = DepreciationEngine.calculateCurrentValue(a, settings);
      const price = parseFloat(a.price) || 0;
      const cName = a.categoryName || 'Lainnya';

      if (!catMap[cName]) {
        catMap[cName] = {
          'Kode': '-',
          'Kategori': cName,
          'Jumlah Unit': 0,
          'Total Harga Perolehan (Rp)': 0,
          'Akumulasi Penyusutan (Rp)': 0,
          'Nilai Buku Terkini (Rp)': 0
        };
      }

      const qty = parseInt(a.qty) || 1;
      catMap[cName]['Jumlah Unit'] += qty;
      catMap[cName]['Total Harga Perolehan (Rp)'] += price;
      catMap[cName]['Akumulasi Penyusutan (Rp)'] += calc.accumulatedDepreciation;
      catMap[cName]['Nilai Buku Terkini (Rp)'] += calc.bookValue;

      grandNominal += price;
      grandAkumulasi += calc.accumulatedDepreciation;
      grandBuku += calc.bookValue;
      grandCount += qty;
    });

    const rows = Object.values(catMap).filter(c => c['Jumlah Unit'] > 0);
    rows.sort((a, b) => b['Total Harga Perolehan (Rp)'] - a['Total Harga Perolehan (Rp)']);

    // Add Grand Total row
    rows.push({
      'Kode': 'TOTAL',
      'Kategori': 'GRAND TOTAL KESELURUHAN',
      'Jumlah Unit': grandCount,
      'Total Harga Perolehan (Rp)': grandNominal,
      'Akumulasi Penyusutan (Rp)': grandAkumulasi,
      'Nilai Buku Terkini (Rp)': grandBuku
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Dana Kategori');
    XLSX.writeFile(workbook, filename);
    showToast(`File Excel "${filename}" berhasil diunduh!`, 'success');
  },

  /**
   * 7. Generate Laporan Stok & Persediaan Barang Habis Pakai (BHP)
   */
  generateBHPStockReportHTML(settings) {
    if (!settings) settings = db.getSettings();
    const items = db.getBHP();
    let totalNominal = 0;
    let totalUnits = 0;

    let rowsHTML = '';
    items.forEach((item, idx) => {
      const stock = Number(item.stock) || 0;
      const minStock = Number(item.minStock) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalVal = stock * unitPrice;
      totalNominal += totalVal;
      totalUnits += stock;

      let statusStr = 'Aman';
      let statusColor = '#047857';
      if (stock === 0) {
        statusStr = 'Habis';
        statusColor = '#b91c1c';
      } else if (stock <= minStock) {
        statusStr = 'Menipis';
        statusColor = '#d97706';
      }

      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; font-size: 8.5pt;">${item.code || '-'}</td>
          <td><strong>${item.name || '-'}</strong><br><small style="color: #64748b;">${item.locationDetail || item.notes || '-'}</small></td>
          <td>${item.categoryName || '-'}</td>
          <td>${item.roomName || '-'}</td>
          <td style="text-align: center; font-weight: bold; font-family: monospace;">${stock.toLocaleString('id-ID')} ${item.unit || 'Pcs'}</td>
          <td style="text-align: center; color: #64748b; font-size: 8.5pt;">${minStock} ${item.unit || 'Pcs'}</td>
          <td style="text-align: right; font-family: monospace;">${DepreciationEngine.formatRupiah(unitPrice)}</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace; color: #047857;">${DepreciationEngine.formatRupiah(totalVal)}</td>
          <td style="text-align: center; font-weight: bold; color: ${statusColor};">${statusStr}</td>
        </tr>
      `;
    });

    return `
      ${this.renderKopSuratHTML(settings)}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0;">LAPORAN STOK & PERSEDIAAN BARANG HABIS PAKAI (BHP)</h3>
        <p style="font-size: 9pt; color: #475569; margin-top: 3px;">Rekapitulasi Saldo Persediaan & Logistik Operasional per ${new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Kode BHP</th>
            <th>Nama Barang & Spesifikasi</th>
            <th>Kategori</th>
            <th>Gudang/Ruang</th>
            <th style="width: 70px;">Sisa Stok</th>
            <th style="width: 60px;">Min. Stok</th>
            <th>Harga Satuan</th>
            <th>Total Nilai Stok</th>
            <th style="width: 60px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || '<tr><td colspan="10" style="text-align: center; padding: 20px;">Tidak ada data barang habis pakai</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="5" style="text-align: right; padding-right: 10px;">TOTAL PERSEDIAAN:</td>
            <td style="text-align: center; color: #047857;">${totalUnits.toLocaleString('id-ID')} Item</td>
            <td colspan="2" style="text-align: right; padding-right: 10px;">TOTAL NILAI SALDO:</td>
            <td style="text-align: right; color: #047857;">${DepreciationEngine.formatRupiah(totalNominal)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      ${this.renderSignaturesHTML(settings, 'Penanggung Jawab Logistik & Riayah', 'Petugas Logistik BHP', '')}
    `;
  },

  /**
   * 8. Generate Laporan Mutasi Pemakaian & Pengeluaran BHP
   */
  generateBHPMutasiReportHTML(settings) {
    if (!settings) settings = db.getSettings();
    const txs = db.getBHPTransactions();
    let totalNominalKeluar = 0;
    let totalNominalMasuk = 0;

    let rowsHTML = '';
    txs.forEach((t, idx) => {
      const isMasuk = t.type === 'masuk';
      const total = Number(t.totalPrice) || 0;
      if (isMasuk) totalNominalMasuk += total;
      else totalNominalKeluar += total;

      const typeLabel = isMasuk ? 'Masuk (Restock)' : 'Keluar (Pakai)';
      const typeColor = isMasuk ? '#047857' : '#b45309';

      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; font-size: 8.5pt; text-align: center;">${t.date || '-'}</td>
          <td style="font-weight: bold; color: ${typeColor}; text-align: center;">${typeLabel}</td>
          <td style="font-family: monospace; font-size: 8.5pt;">${t.bhpCode || '-'}</td>
          <td><strong>${t.bhpName || '-'}</strong></td>
          <td style="text-align: center; font-weight: bold; font-family: monospace;">${t.qty || 0} ${t.unit || 'Pcs'}</td>
          <td style="text-align: right; font-family: monospace;">${DepreciationEngine.formatRupiah(total)}</td>
          <td>${t.recipient || '-'}</td>
          <td>${t.targetRoom || '-'}</td>
          <td style="font-size: 8.5pt; color: #64748b;">${t.notes || '-'}</td>
        </tr>
      `;
    });

    return `
      ${this.renderKopSuratHTML(settings)}
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0;">LAPORAN BUKU MUTASI BARANG HABIS PAKAI (BHP)</h3>
        <p style="font-size: 9pt; color: #475569; margin-top: 3px;">Rekapitulasi Penerimaan (Restock) & Pengeluaran Distribusi Pemakaian per ${new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Tanggal</th>
            <th>Jenis Mutasi</th>
            <th>Kode</th>
            <th>Nama Barang</th>
            <th style="width: 60px;">Jumlah</th>
            <th>Nominal</th>
            <th>Penerima / Sumber</th>
            <th>Tujuan / Ruang</th>
            <th>Keperluan / Catatan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || '<tr><td colspan="10" style="text-align: center; padding: 20px;">Belum ada riwayat mutasi transaksi</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="6" style="text-align: right; padding-right: 10px;">TOTAL BIAYA PEMAKAIAN (PENGELUARAN):</td>
            <td style="text-align: right; color: #b45309;">${DepreciationEngine.formatRupiah(totalNominalKeluar)}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>

      ${this.renderSignaturesHTML(settings, 'Pengurus Logistik / Riayah', 'Petugas Distribusi', '')}
    `;
  }

};
