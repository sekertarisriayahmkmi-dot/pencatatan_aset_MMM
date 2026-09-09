/**
 * SUPABASE-CLIENT.JS — Cloud Database Connector & Sync Engine
 * Masjid Kapal Munzalan Asset Suite
 *
 * Provides a hybrid offline/cloud synchronization layer for Supabase PostgreSQL.
 */

const SupabaseEngine = {
  CONFIG_KEY: 'asetpro_supabase_config_v1',
  DEFAULT_URL: 'https://tikgejeayivswhkzvgdl.supabase.co',
  DEFAULT_KEY: 'sb_publishable_qlcq5BbA5SvsdNoAyBU9Pg_nsHGRFCH',
  client: null,

  // ─── Get Stored Credentials ─────────────────────────────────────
  getConfig() {
    try {
      const raw = localStorage.getItem(this.CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          url: parsed.url || this.DEFAULT_URL,
          key: parsed.key || this.DEFAULT_KEY,
          enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          autoSync: parsed.autoSync !== undefined ? parsed.autoSync : true
        };
      }
      return { 
        url: this.DEFAULT_URL, 
        key: this.DEFAULT_KEY, 
        enabled: true, 
        autoSync: true 
      };
    } catch (e) {
      return { 
        url: this.DEFAULT_URL, 
        key: this.DEFAULT_KEY, 
        enabled: true, 
        autoSync: true 
      };
    }
  },

  saveConfig(cfg) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg));
    this.init();
  },

  // ─── Initialize Supabase Client ─────────────────────────────────
  init() {
    const cfg = this.getConfig();
    if (cfg.enabled && cfg.url && cfg.key && typeof supabase !== 'undefined' && supabase.createClient) {
      try {
        this.client = supabase.createClient(cfg.url.trim(), cfg.key.trim());
        console.log('🟢 Supabase Engine Initialized successfully.');
      } catch (err) {
        console.warn('⚠️ Gagal inisialisasi Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
    this.updateStatusBadge();
  },

  isReady() {
    return !!this.client;
  },

  // ─── Test Connection ────────────────────────────────────────────
  async testConnection(url, key) {
    const targetUrl = url || this.getConfig().url;
    const targetKey = key || this.getConfig().key;

    if (!targetUrl || !targetKey) {
      return { success: false, message: 'URL Project dan Anon Key wajib diisi!' };
    }

    if (typeof supabase === 'undefined' || !supabase.createClient) {
      return { success: false, message: 'Library Supabase JS belum termuat di browser.' };
    }

    try {
      const tempClient = supabase.createClient(targetUrl.trim(), targetKey.trim());
      // Test query to divisions or assets table
      const { data, error } = await tempClient.from('divisions').select('id').limit(1);
      
      if (error) {
        // Check if table doesn't exist yet
        if (error.code === '42P01' || (error.message && error.message.includes('relation "divisions" does not exist'))) {
          return {
            success: true,
            warning: true,
            message: 'Koneksi ke Supabase berhasil! Namun tabel database belum dibuat. Silakan jalankan file schema.sql di Supabase SQL Editor.'
          };
        }
        return { success: false, message: `Gagal query: ${error.message} (${error.code || ''})` };
      }

      return { success: true, message: 'Koneksi ke database cloud Supabase BERHASIL dan tabel siap digunakan!' };
    } catch (err) {
      return { success: false, message: `Koneksi gagal: ${err.message}` };
    }
  },

  // ─── Push Local Data to Cloud ───────────────────────────────────
  async pushLocalToCloud() {
    if (!this.isReady()) {
      return { success: false, message: 'Koneksi Supabase belum aktif atau belum dikonfigurasi.' };
    }

    try {
      const c = this.client;
      let totalRecords = 0;

      // 1. Divisions
      const divisions = db.getDivisions ? db.getDivisions() : [];
      if (divisions.length > 0) {
        const rows = divisions.map(d => ({
          id: d.id,
          name: d.name,
          code: d.code || '',
          parent: d.parent || 'Masjid Munzalan Mubarakan',
          logo: d.logo || 'logo-munzalan.png',
          pj: d.pj || '',
          phone: d.phone || ''
        }));
        await c.from('divisions').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 2. Branches
      const branches = db.getBranches ? db.getBranches() : [];
      if (branches.length > 0) {
        const rows = branches.map(b => ({
          id: b.id,
          name: b.name,
          code: b.code || '',
          is_pusat: !!b.isPusat,
          pj: b.pj || '',
          phone: b.phone || '',
          address: b.address || ''
        }));
        await c.from('branches').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 3. Categories
      const categories = db.getCategories ? db.getCategories() : [];
      if (categories.length > 0) {
        const rows = categories.map(cat => ({
          id: cat.id,
          code: cat.code,
          name: cat.name,
          lifespan: cat.lifespan || 5,
          description: cat.description || ''
        }));
        await c.from('categories').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 4. Rooms
      const rooms = db.getRooms ? db.getRooms() : [];
      if (rooms.length > 0) {
        const rows = rooms.map(r => ({
          id: r.id,
          code: r.code,
          name: r.name,
          floor: r.floor || '',
          pj: r.pj || '',
          pj_nip: r.pjNip || '',
          division_id: r.divisionId || null,
          division_name: r.divisionName || '',
          branch_id: r.branchId || null
        }));
        await c.from('rooms').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 5. Assets
      const assets = db.getAssets ? db.getAssets() : [];
      if (assets.length > 0) {
        const rows = assets.map(a => ({
          id: a.id,
          no_induk: a.noInduk || '',
          code: a.code,
          name: a.name || a.namaBarang || '',
          brand: a.brand || '',
          brand_type: a.brandType || a.merkType || '',
          size: a.size || a.ukuran || '-',
          material: a.material || a.bahan || '-',
          production_year: parseInt(a.productionYear || a.tahunPembuatan) || null,
          source: a.source || a.asalBarang || 'Pembelian',
          documents: a.documents || a.kelengkapanDokumen || 'Lengkap',
          qty: parseInt(a.qty || a.jumlahBarang) || 1,
          unit: a.unit || a.satuan || 'Unit',
          condition: a.condition || a.kondisi || 'B',
          unit_price: parseFloat(a.unitPrice || a.hargaSatuan) || 0,
          price: parseFloat(a.price || a.hargaJumlah) || 0,
          date: (a.date || a.tanggalDiterima || new Date().toISOString().split('T')[0]).substring(0, 10),
          status: a.status || 'Aktif',
          lifespan: parseFloat(a.lifespan) || 5,
          pic: a.pic || '',
          used_by: a.usedBy || a.dipergunakanOleh || '',
          notes: a.notes || a.keterangan || '',
          category_id: a.categoryId || null,
          category_name: a.categoryName || '',
          category_code: a.categoryCode || '',
          room_id: a.roomId || null,
          room_name: a.roomName || '',
          room_code: a.roomCode || '',
          division_id: a.divisionId || null,
          division_name: a.divisionName || '',
          division_code: a.divisionCode || '',
          branch_id: a.branchId || null,
          branch_name: a.branchName || '',
          serial_number: a.serialNumber || a.noSeri || '',
          imei: a.imei || '',
          tech_specs: a.techSpecs || a.spesifikasi || '',
          nopol: a.nopol || a.noPolisi || '',
          no_rangka: a.noRangka || a.nomorRangka || '',
          no_mesin: a.noMesin || a.nomorMesin || '',
          no_bpkb: a.noBpkb || a.nomorBpkb || '',
          image: a.image || '',
          image_front: a.imageFront || '',
          bast_id: a.bastId || null,
          is_under_disposal_request: !!a.isUnderDisposalRequest
        }));
        await c.from('assets').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 6. BAST
      const bastList = db.getBASTList ? db.getBASTList() : [];
      if (bastList.length > 0) {
        const rows = bastList.map(b => ({
          id: b.id,
          doc_no: b.docNo || b.noBa || b.id,
          date: b.date || b.tanggal || new Date().toISOString().split('T')[0],
          recipient_name: b.recipientName || b.namaPenerima || '-',
          stambuk: b.stambuk || '',
          amanah: b.amanah || '',
          institution: b.institution || '',
          phone: b.phone || '',
          is_pusat: !!b.isPusat,
          status: b.status || 'Aktif',
          asset_id: b.assetId || null,
          asset_code: b.assetCode || '',
          asset_name: b.assetName || '',
          officer_name: b.officerName || '',
          witness_name: b.witnessName || '',
          notes: b.notes || ''
        }));
        await c.from('bast').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 7. Mutations
      const mutations = db.getMutations ? db.getMutations() : [];
      if (mutations.length > 0) {
        const rows = mutations.map(m => ({
          id: m.id,
          doc_no: m.docNo || m.noMutasi || m.id,
          date: m.date || new Date().toISOString().split('T')[0],
          asset_id: m.assetId || null,
          asset_code: m.assetCode || '',
          asset_name: m.assetName || '',
          qty: parseInt(m.qty) || 1,
          from_room_id: m.fromRoomId || null,
          from_room_name: m.fromRoomName || '',
          to_room_id: m.toRoomId || null,
          to_room_name: m.toRoomName || '',
          from_division_id: m.fromDivisionId || null,
          from_division_name: m.fromDivisionName || '',
          to_division_id: m.toDivisionId || null,
          to_division_name: m.toDivisionName || '',
          from_branch_id: m.fromBranchId || null,
          from_branch_name: m.fromBranchName || '',
          to_branch_id: m.toBranchId || null,
          to_branch_name: m.toBranchName || '',
          reason: m.reason || '',
          officer_name: m.officerName || '',
          recipient_name: m.recipientName || ''
        }));
        await c.from('mutations').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 8. Damage Reports
      const damageReports = db.getDamageReports ? db.getDamageReports() : [];
      if (damageReports.length > 0) {
        const rows = damageReports.map(d => ({
          id: d.id,
          doc_no: d.docNo || d.id,
          date: d.date || new Date().toISOString().split('T')[0],
          asset_id: d.assetId || null,
          asset_code: d.assetCode || '',
          asset_name: d.assetName || '',
          category_name: d.categoryName || '',
          room_name: d.roomName || '',
          damage_type: d.damageType || '',
          severity: d.severity || 'Rusak Berat',
          chronology: d.chronology || '',
          recommendation: d.recommendation || '',
          inspector_name: d.inspectorName || '',
          status: d.status || 'BA Kerusakan Terbit',
          repaired_at: d.repairedAt || null,
          repair_notes: d.repairNotes || '',
          photos: d.photos || []
        }));
        await c.from('damage_reports').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 9. Disposal Requests
      const disposalRequests = db.getDisposalRequests ? db.getDisposalRequests() : [];
      if (disposalRequests.length > 0) {
        const rows = disposalRequests.map(dr => ({
          id: dr.id,
          date: dr.date || new Date().toISOString().split('T')[0],
          asset_id: dr.assetId || null,
          asset_code: dr.assetCode || '',
          asset_name: dr.assetName || '',
          category_name: dr.categoryName || '',
          room_name: dr.roomName || '',
          price: parseFloat(dr.price) || 0,
          book_value: parseFloat(dr.bookValue) || 0,
          reason: dr.reason || '',
          proposed_by: dr.proposedBy || '',
          status: dr.status || 'Menunggu Persetujuan',
          approval_data: dr.approvalData || null
        }));
        await c.from('disposal_requests').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 10. Disposals
      const disposals = db.getDisposals ? db.getDisposals() : [];
      if (disposals.length > 0) {
        const rows = disposals.map(d => ({
          id: d.id,
          request_id: d.requestId || null,
          asset_id: d.assetId || null,
          asset_code: d.assetCode || '',
          asset_name: d.assetName || '',
          category_name: d.categoryName || '',
          room_name: d.roomName || '',
          price: parseFloat(d.price) || 0,
          book_value: parseFloat(d.bookValue) || 0,
          date: d.date || new Date().toISOString().split('T')[0],
          reason: d.reason || '',
          doc_no: d.docNo || '',
          notes: d.notes || '',
          proposed_by: d.proposedBy || '',
          approved_by: d.approvedBy || ''
        }));
        await c.from('disposals').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 11. BHP & Transactions
      const bhpItems = db.getBHP ? db.getBHP() : [];
      if (bhpItems.length > 0) {
        const rows = bhpItems.map(b => ({
          id: b.id,
          code: b.code,
          name: b.name,
          brand_type: b.brandType || '',
          category_id: b.categoryId || null,
          category_name: b.categoryName || '',
          qty: parseInt(b.qty) || 0,
          stock: parseInt(b.stock !== undefined ? b.stock : b.qty) || 0,
          unit: b.unit || 'Pcs',
          unit_price: parseFloat(b.unitPrice) || 0,
          price: parseFloat(b.price) || 0,
          room_id: b.roomId || null,
          room_name: b.roomName || '',
          notes: b.notes || ''
        }));
        await c.from('bhp').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      const bhpTrans = db.getBHPTransactions ? db.getBHPTransactions() : [];
      if (bhpTrans.length > 0) {
        const rows = bhpTrans.map(t => ({
          id: t.id,
          date: t.date || new Date().toISOString().split('T')[0],
          type: t.type || 'out',
          bhp_id: t.bhpId || null,
          bhp_code: t.bhpCode || '',
          bhp_name: t.bhpName || '',
          qty: parseInt(t.qty) || 1,
          unit: t.unit || 'Pcs',
          unit_price: parseFloat(t.unitPrice) || 0,
          total_price: parseFloat(t.totalPrice) || 0,
          recipient: t.recipient || '',
          target_room: t.targetRoom || '',
          notes: t.notes || '',
          created_by: t.createdBy || ''
        }));
        await c.from('bhp_transactions').upsert(rows, { onConflict: 'id' });
        totalRecords += rows.length;
      }

      // 12. Settings
      const settings = db.getSettings ? db.getSettings() : {};
      await c.from('app_settings').upsert({ id: 'main_settings', data: settings }, { onConflict: 'id' });

      return {
        success: true,
        count: totalRecords,
        message: `Berhasil sinkronisasi ${totalRecords} data (Aset, Penghapusan, BAST, Mutasi, BHP) ke Supabase Cloud!`
      };
    } catch (err) {
      console.error('Push error:', err);
      return { success: false, message: `Gagal sinkronisasi data ke cloud: ${err.message}` };
    }
  },

  // ─── Pull Data from Cloud to Local ──────────────────────────────
  async pullCloudToLocal() {
    if (!this.isReady()) {
      return { success: false, message: 'Koneksi Supabase belum aktif atau belum dikonfigurasi.' };
    }

    try {
      const c = this.client;

      // 1. Fetch Divisions
      const { data: dbDivisions } = await c.from('divisions').select('*');
      if (dbDivisions && dbDivisions.length > 0) {
        db.save(STORAGE_KEYS.DIVISIONS, dbDivisions);
      }

      // 2. Fetch Branches
      const { data: dbBranches } = await c.from('branches').select('*');
      if (dbBranches && dbBranches.length > 0) {
        const mapped = dbBranches.map(b => ({
          ...b,
          isPusat: b.is_pusat
        }));
        db.save(STORAGE_KEYS.BRANCHES, mapped);
      }

      // 3. Fetch Categories
      const { data: dbCats } = await c.from('categories').select('*');
      if (dbCats && dbCats.length > 0) {
        db.save(STORAGE_KEYS.CATEGORIES, dbCats);
      }

      // 4. Fetch Rooms
      const { data: dbRooms } = await c.from('rooms').select('*');
      if (dbRooms && dbRooms.length > 0) {
        const mapped = dbRooms.map(r => ({
          ...r,
          pjNip: r.pj_nip,
          divisionId: r.division_id,
          divisionName: r.division_name,
          branchId: r.branch_id
        }));
        db.save(STORAGE_KEYS.ROOMS, mapped);
      }

      // 5. Fetch Assets
      const { data: dbAssets, error: assetErr } = await c.from('assets').select('*');
      if (assetErr) throw assetErr;
      if (dbAssets && dbAssets.length > 0) {
        const mapped = dbAssets.map(a => ({
          id: a.id,
          noInduk: a.no_induk,
          code: a.code,
          name: a.name,
          namaBarang: a.name,
          brand: a.brand,
          brandType: a.brand_type,
          merkType: a.brand_type,
          size: a.size,
          ukuran: a.size,
          material: a.material,
          bahan: a.material,
          productionYear: a.production_year,
          tahunPembuatan: a.production_year,
          source: a.source,
          asalBarang: a.source,
          documents: a.documents,
          kelengkapanDokumen: a.documents,
          qty: a.qty,
          jumlahBarang: a.qty,
          unit: a.unit,
          satuan: a.unit,
          condition: a.condition,
          kondisi: a.condition,
          unitPrice: parseFloat(a.unit_price) || 0,
          hargaSatuan: parseFloat(a.unit_price) || 0,
          price: parseFloat(a.price) || 0,
          hargaJumlah: parseFloat(a.price) || 0,
          date: a.date,
          tanggalDiterima: a.date,
          status: a.status,
          lifespan: a.lifespan,
          pic: a.pic,
          usedBy: a.used_by,
          dipergunakanOleh: a.used_by,
          notes: a.notes,
          keterangan: a.notes,
          categoryId: a.category_id,
          categoryName: a.category_name,
          categoryCode: a.category_code,
          roomId: a.room_id,
          roomName: a.room_name,
          roomCode: a.room_code,
          divisionId: a.division_id,
          divisionName: a.division_name,
          divisionCode: a.division_code,
          branchId: a.branch_id,
          branchName: a.branch_name,
          serialNumber: a.serial_number,
          noSeri: a.serial_number,
          imei: a.imei,
          techSpecs: a.tech_specs,
          spesifikasi: a.tech_specs,
          nopol: a.nopol,
          noPolisi: a.nopol,
          noRangka: a.no_rangka,
          nomorRangka: a.no_rangka,
          noMesin: a.no_mesin,
          nomorMesin: a.no_mesin,
          noBpkb: a.no_bpkb,
          nomorBpkb: a.no_bpkb,
          image: a.image,
          imageFront: a.image_front,
          bastId: a.bast_id,
          isUnderDisposalRequest: a.is_under_disposal_request
        }));
        db.save(STORAGE_KEYS.ASSETS, mapped);
      }

      // 6. Fetch Disposals & Disposal Requests
      const { data: dbDisposals } = await c.from('disposals').select('*');
      if (dbDisposals && dbDisposals.length > 0) {
        const mapped = dbDisposals.map(d => ({
          id: d.id,
          requestId: d.request_id,
          assetId: d.asset_id,
          assetCode: d.asset_code,
          assetName: d.asset_name,
          categoryName: d.category_name,
          roomName: d.room_name,
          price: parseFloat(d.price) || 0,
          bookValue: parseFloat(d.book_value) || 0,
          date: d.date,
          reason: d.reason,
          docNo: d.doc_no,
          notes: d.notes,
          proposedBy: d.proposed_by,
          approvedBy: d.approved_by
        }));
        db.save(STORAGE_KEYS.DISPOSALS, mapped);
      }

      const { data: dbDisposalRequests } = await c.from('disposal_requests').select('*');
      if (dbDisposalRequests && dbDisposalRequests.length > 0) {
        const mapped = dbDisposalRequests.map(dr => ({
          id: dr.id,
          date: dr.date,
          assetId: dr.asset_id,
          assetCode: dr.asset_code,
          assetName: dr.asset_name,
          categoryName: dr.category_name,
          roomName: dr.room_name,
          price: parseFloat(dr.price) || 0,
          bookValue: parseFloat(dr.book_value) || 0,
          reason: dr.reason,
          proposedBy: dr.proposed_by,
          status: dr.status,
          approvalData: dr.approval_data
        }));
        db.save(STORAGE_KEYS.DISPOSAL_REQUESTS, mapped);
      }

      // 7. Fetch BAST
      const { data: dbBAST } = await c.from('bast').select('*');
      if (dbBAST && dbBAST.length > 0) {
        const mapped = dbBAST.map(b => ({
          id: b.id,
          docNo: b.doc_no,
          date: b.date,
          recipientName: b.recipient_name,
          stambuk: b.stambuk,
          amanah: b.amanah,
          institution: b.institution,
          phone: b.phone,
          isPusat: b.is_pusat,
          status: b.status,
          assetId: b.asset_id,
          assetCode: b.asset_code,
          assetName: b.asset_name,
          officerName: b.officer_name,
          witnessName: b.witness_name,
          notes: b.notes
        }));
        db.save(STORAGE_KEYS.BAST, mapped);
      }

      // 8. Fetch Mutations
      const { data: dbMutations } = await c.from('mutations').select('*');
      if (dbMutations && dbMutations.length > 0) {
        const mapped = dbMutations.map(m => ({
          id: m.id,
          docNo: m.doc_no,
          date: m.date,
          assetId: m.asset_id,
          assetCode: m.asset_code,
          assetName: m.asset_name,
          qty: m.qty,
          fromRoomId: m.from_room_id,
          fromRoomName: m.from_room_name,
          toRoomId: m.to_room_id,
          toRoomName: m.to_room_name,
          fromDivisionId: m.from_division_id,
          fromDivisionName: m.from_division_name,
          toDivisionId: m.to_division_id,
          toDivisionName: m.to_division_name,
          fromBranchId: m.from_branch_id,
          fromBranchName: m.from_branch_name,
          toBranchId: m.to_branch_id,
          toBranchName: m.to_branch_name,
          reason: m.reason,
          officerName: m.officer_name,
          recipientName: m.recipient_name
        }));
        db.save(STORAGE_KEYS.MUTATIONS, mapped);
      }

      // 9. Fetch Damage Reports
      const { data: dbDamage } = await c.from('damage_reports').select('*');
      if (dbDamage && dbDamage.length > 0) {
        const mapped = dbDamage.map(d => ({
          id: d.id,
          docNo: d.doc_no,
          date: d.date,
          assetId: d.asset_id,
          assetCode: d.asset_code,
          assetName: d.asset_name,
          categoryName: d.category_name,
          roomName: d.room_name,
          damageType: d.damage_type,
          severity: d.severity,
          chronology: d.chronology,
          recommendation: d.recommendation,
          inspectorName: d.inspector_name,
          status: d.status,
          repairedAt: d.repaired_at,
          repairNotes: d.repair_notes,
          photos: d.photos
        }));
        db.save(STORAGE_KEYS.DAMAGE_REPORTS, mapped);
      }

      // 10. Fetch BHP
      const { data: dbBhp } = await c.from('bhp').select('*');
      if (dbBhp && dbBhp.length > 0) {
        const mapped = dbBhp.map(b => ({
          id: b.id,
          code: b.code,
          name: b.name,
          brandType: b.brand_type,
          categoryId: b.category_id,
          categoryName: b.category_name,
          qty: b.qty,
          stock: b.stock,
          unit: b.unit,
          unitPrice: parseFloat(b.unit_price) || 0,
          price: parseFloat(b.price) || 0,
          roomId: b.room_id,
          roomName: b.room_name,
          notes: b.notes
        }));
        db.save(STORAGE_KEYS.BHP, mapped);
      }

      const { data: dbBhpTrans } = await c.from('bhp_transactions').select('*');
      if (dbBhpTrans && dbBhpTrans.length > 0) {
        const mapped = dbBhpTrans.map(t => ({
          id: t.id,
          date: t.date,
          type: t.type,
          bhpId: t.bhp_id,
          bhpCode: t.bhp_code,
          bhpName: t.bhp_name,
          qty: t.qty,
          unit: t.unit,
          unitPrice: parseFloat(t.unit_price) || 0,
          totalPrice: parseFloat(t.total_price) || 0,
          recipient: t.recipient,
          targetRoom: t.target_room,
          notes: t.notes,
          createdBy: t.created_by
        }));
        db.save(STORAGE_KEYS.BHP_TRANSACTIONS, mapped);
      }

      // 6. Fetch Settings
      const { data: dbSettings } = await c.from('app_settings').select('*').eq('id', 'main_settings').single();
      if (dbSettings && dbSettings.data) {
        db.save(STORAGE_KEYS.SETTINGS, dbSettings.data);
      }

      return {
        success: true,
        count: dbAssets?.length || 0,
        message: `Berhasil menarik ${dbAssets?.length || 0} aset & data terbaru dari Supabase Cloud!`
      };
    } catch (err) {
      console.error('Pull error:', err);
      return { success: false, message: `Gagal menarik data dari cloud: ${err.message}` };
    }
  },

  // ─── Background Sync on Asset Save ──────────────────────────────
  async syncAssetToCloud(asset) {
    if (!this.isReady() || !asset) return;
    try {
      const row = {
        id: asset.id,
        no_induk: asset.noInduk || '',
        code: asset.code,
        name: asset.name || asset.namaBarang || '',
        brand: asset.brand || '',
        brand_type: asset.brandType || asset.merkType || '',
        size: asset.size || asset.ukuran || '-',
        material: asset.material || asset.bahan || '-',
        production_year: parseInt(asset.productionYear || asset.tahunPembuatan) || null,
        source: asset.source || asset.asalBarang || 'Pembelian',
        documents: asset.documents || asset.kelengkapanDokumen || 'Lengkap',
        qty: parseInt(asset.qty || asset.jumlahBarang) || 1,
        unit: asset.unit || asset.satuan || 'Unit',
        condition: asset.condition || asset.kondisi || 'B',
        unit_price: parseFloat(asset.unitPrice || asset.hargaSatuan) || 0,
        price: parseFloat(asset.price || asset.hargaJumlah) || 0,
        date: (asset.date || asset.tanggalDiterima || new Date().toISOString().split('T')[0]).substring(0, 10),
        status: asset.status || 'Aktif',
        lifespan: parseFloat(asset.lifespan) || 5,
        pic: asset.pic || '',
        used_by: asset.usedBy || asset.dipergunakanOleh || '',
        notes: asset.notes || asset.keterangan || '',
        category_id: asset.categoryId || null,
        category_name: asset.categoryName || '',
        category_code: asset.categoryCode || '',
        room_id: asset.roomId || null,
        room_name: asset.roomName || '',
        room_code: asset.roomCode || '',
        division_id: asset.divisionId || null,
        division_name: asset.divisionName || '',
        division_code: asset.divisionCode || '',
        branch_id: asset.branchId || null,
        branch_name: asset.branchName || '',
        serial_number: asset.serialNumber || asset.noSeri || '',
        imei: asset.imei || '',
        tech_specs: asset.techSpecs || asset.spesifikasi || '',
        nopol: asset.nopol || asset.noPolisi || '',
        no_rangka: asset.noRangka || asset.nomorRangka || '',
        no_mesin: asset.noMesin || asset.nomorMesin || '',
        no_bpkb: asset.noBpkb || asset.nomorBpkb || '',
        image: asset.image || '',
        image_front: asset.imageFront || '',
        bast_id: asset.bastId || null,
        is_under_disposal_request: !!asset.isUnderDisposalRequest,
        updated_at: new Date().toISOString()
      };
      await this.client.from('assets').upsert(row, { onConflict: 'id' });
    } catch (err) {
      console.warn('Background Supabase asset sync failed:', err);
    }
  },

  async deleteAssetFromCloud(assetId) {
    if (!this.isReady() || !assetId) return;
    try {
      await this.client.from('assets').delete().eq('id', assetId);
    } catch (err) {
      console.warn('Background Supabase asset delete failed:', err);
    }
  },

  // ─── UI Status Badge ────────────────────────────────────────────
  updateStatusBadge() {
    const badge = document.getElementById('supabase-status-badge');
    const text = document.getElementById('supabase-status-text');
    const card = document.getElementById('supabase-connection-card');
    const isConnected = this.isReady();

    if (badge) {
      if (isConnected) {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>🟢 Cloud Terhubung (Supabase)';
      } else {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span>🟡 Mode Lokal (Offline)';
      }
    }

    if (text) {
      text.textContent = isConnected 
        ? 'Database Supabase PostgreSQL aktif. Perubahan data tersinkronisasi otomatis ke cloud.'
        : 'Penyimpanan berjalan di LocalStorage browser. Hubungkan ke Supabase agar data bisa diakses bersamaan oleh semua divisi & cabang.';
    }

    if (card) {
      if (isConnected) {
        card.classList.add('border-emerald-500/40', 'bg-emerald-500/5');
        card.classList.remove('border-amber-500/30', 'bg-amber-500/5');
      } else {
        card.classList.remove('border-emerald-500/40', 'bg-emerald-500/5');
        card.classList.add('border-amber-500/30', 'bg-amber-500/5');
      }
    }
  }
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  SupabaseEngine.init();
});
