/**
 * DEPRECIATION.JS - Valuation & Notification Engine
 * Straight-line depreciation calculation and smart system alerts
 */

const DepreciationEngine = {
  
  /**
   * Format number to Indonesian Rupiah currency string
   * @param {number} amount
   * @returns {string} e.g. "Rp 12.500.000"
   */
  formatRupiah(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Format nominal into compact Indonesian magnitude badge (e.g. 2,8 Juta, 150 Ribu, 1,5 Miliar)
   * @param {number} amount
   * @returns {string}
   */
  formatRingkas(amount) {
    const n = Math.round(Number(amount) || 0);
    if (n <= 0) return '0 Rupiah';
    if (n >= 1000000000000) {
      const val = (n / 1000000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
      return `${val} Triliun`;
    }
    if (n >= 1000000000) {
      const val = (n / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
      return `${val} Miliar`;
    }
    if (n >= 1000000) {
      const val = (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
      return `${val} Juta`;
    }
    if (n >= 1000) {
      const val = (n / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
      return `${val} Ribu`;
    }
    return `Rp ${n.toLocaleString('id-ID')}`;
  },

  /**
   * Convert number to Indonesian written words (Terbilang)
   * e.g. 2800000 -> "Dua Juta Delapan Ratus Ribu Rupiah"
   * @param {number} amount
   * @returns {string}
   */
  terbilang(amount) {
    const n = Math.floor(Math.abs(Number(amount) || 0));
    if (n === 0) return 'Nol Rupiah';

    const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

    function convert(num) {
      if (num < 12) return bilangan[num];
      if (num < 20) return convert(num - 10) + ' Belas';
      if (num < 100) return convert(Math.floor(num / 10)) + ' Puluh' + (num % 10 !== 0 ? ' ' + convert(num % 10) : '');
      if (num < 200) return 'Seratus' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
      if (num < 1000) return convert(Math.floor(num / 100)) + ' Ratus' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
      if (num < 2000) return 'Seribu' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
      if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
      if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 !== 0 ? ' ' + convert(num % 1000000) : '');
      if (num < 1000000000000) return convert(Math.floor(num / 1000000000)) + ' Miliar' + (num % 1000000000 !== 0 ? ' ' + convert(num % 1000000000) : '');
      return convert(Math.floor(num / 1000000000000)) + ' Triliun' + (num % 1000000000000 !== 0 ? ' ' + convert(num % 1000000000000) : '');
    }

    return convert(n) + ' Rupiah';
  },

  /**
   * Calculate current book value of an asset using Straight-Line Depreciation
   * @param {Object} asset 
   * @param {Object} settings
   * @returns {Object} { bookValue, accumulatedDepreciation, ageInYears, isExpired, depreciationRatePerYear }
   */
  calculateCurrentValue(asset, settings = null) {
    if (!settings) settings = db.getSettings();

    const initialPrice = parseFloat(asset.price) || 0;
    const lifespan = parseFloat(asset.lifespan) || 4; // in years
    const residualRate = (parseFloat(settings.residualRate) || 0) / 100;
    const residualValue = initialPrice * residualRate;

    if (!settings.depreciationEnabled || lifespan <= 0 || initialPrice <= 0) {
      return {
        bookValue: initialPrice,
        accumulatedDepreciation: 0,
        ageInYears: 0,
        ageInMonths: 0,
        isExpired: false,
        depreciationPercentage: 0,
        annualDepreciation: 0
      };
    }

    const purchaseDate = new Date(asset.date || new Date());
    const currentDate = new Date();

    // Difference in milliseconds
    const diffTime = Math.max(0, currentDate - purchaseDate);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const ageInYears = diffDays / 365.25;
    const ageInMonths = Math.floor(diffDays / 30.44);

    const depreciableBase = initialPrice - residualValue;
    const annualDepreciation = depreciableBase / lifespan;
    const dailyDepreciation = annualDepreciation / 365.25;

    let accumulatedDepreciation = dailyDepreciation * diffDays;
    
    if (accumulatedDepreciation > depreciableBase) {
      accumulatedDepreciation = depreciableBase;
    }

    const bookValue = Math.max(residualValue, initialPrice - accumulatedDepreciation);
    const isExpired = ageInYears >= lifespan;
    const depreciationPercentage = Math.min(100, Math.round((accumulatedDepreciation / initialPrice) * 100));

    return {
      bookValue: Math.round(bookValue),
      accumulatedDepreciation: Math.round(accumulatedDepreciation),
      ageInYears: Number(ageInYears.toFixed(1)),
      ageInMonths: ageInMonths,
      isExpired: isExpired,
      depreciationPercentage: depreciationPercentage,
      annualDepreciation: Math.round(annualDepreciation)
    };
  },

  /**
   * Scan entire database and generate actionable notifications
   * @returns {Array} List of notification objects
   */
  generateNotifications() {
    const assets = db.getAssets();
    const lendings = db.getLendings();
    const settings = db.getSettings();
    const notifications = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Check for Assets reaching/exceeding economic lifespan
    assets.forEach(asset => {
      const calc = this.calculateCurrentValue(asset, settings);
      if (calc.isExpired) {
        notifications.push({
          id: `notif-exp-${asset.id}`,
          type: 'warning',
          icon: 'alert-triangle',
          title: 'Aset Habis Masa Manfaat',
          message: `Barang "${asset.name}" (${asset.code}) di ${asset.roomName} telah berusia ${calc.ageInYears} tahun (Masa manfaat: ${asset.lifespan} th). Nilai buku tersisa ${this.formatRupiah(calc.bookValue)}.`,
          actionType: 'view_asset',
          targetId: asset.id
        });
      }
    });

    // 2. Check for Damaged Assets needing repair
    assets.forEach(asset => {
      if (asset.condition === 'Rusak Berat') {
        notifications.push({
          id: `notif-dmg-heavy-${asset.id}`,
          type: 'danger',
          icon: 'flame',
          title: 'Aset Rusak Berat',
          message: `"${asset.name}" (${asset.code}) di ${asset.roomName} dalam kondisi Rusak Berat. Pertimbangkan perbaikan atau pemutihan/penghapusan.`,
          actionType: 'view_asset',
          targetId: asset.id
        });
      } else if (asset.condition === 'Rusak Ringan') {
        notifications.push({
          id: `notif-dmg-light-${asset.id}`,
          type: 'info',
          icon: 'wrench',
          title: 'Aset Memerlukan Servis',
          message: `"${asset.name}" (${asset.code}) berstatus Rusak Ringan. Perlu perawatan teknis berkala.`,
          actionType: 'view_asset',
          targetId: asset.id
        });
      }
    });

    // 3. Check for Overdue Lendings
    lendings.forEach(l => {
      if (l.status === 'Dipinjam' && l.returnDate && l.returnDate < today) {
        notifications.push({
          id: `notif-lend-overdue-${l.id}`,
          type: 'danger',
          icon: 'clock',
          title: 'Peminjaman Melebihi Batas Waktu!',
          message: `Barang "${l.assetName}" yang dipinjam oleh ${l.borrower} telah melewati batas pengembalian (${l.returnDate}).`,
          actionType: 'view_lending',
          targetId: l.id
        });
      }
    });

    return notifications;
  }

};
