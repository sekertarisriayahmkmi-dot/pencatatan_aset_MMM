/**
 * DB.JS - Local Database & Storage Engine for AsetPro
 * Manages LocalStorage, initial seed data, export/import JSON
 */

const STORAGE_KEYS = {
  ASSETS: 'asetpro_assets_v2',
  ROOMS: 'asetpro_rooms_v2',
  CATEGORIES: 'asetpro_categories_v2',
  DISPOSALS: 'asetpro_disposals_v2',
  DISPOSAL_REQUESTS: 'asetpro_disposal_requests_v2',
  LENDINGS: 'asetpro_lendings_v2',
  SETTINGS: 'asetpro_settings_v2',
  REVALUATIONS: 'asetpro_revaluations_v2',
  BAST: 'asetpro_bast_v2',
  DIVISIONS: 'asetpro_divisions_v2',
  BRANCHES: 'asetpro_branches_v2',
  BHP: 'asetpro_bhp_v2',
  BHP_TRANSACTIONS: 'asetpro_bhp_transactions_v2',
  BHP_CATEGORIES: 'asetpro_bhp_categories_v2',
  DAMAGE_REPORTS: 'asetpro_damage_reports_v2',
  MUTATIONS: 'asetpro_mutations_v2'
};

// Initial Sample Branches / Cabang Wilayah
const DEFAULT_BRANCHES = [
  { id: 'BR-001', name: 'Munzalan Pusat (Kubu Raya / Pontianak)', code: 'PST-KBR', isPusat: true, pj: 'Kantor Pusat Riayah', phone: '0812-5555-9900', address: 'Jl. Sungai Raya Dalam Gg. Imaduddin, Kubu Raya' },
  { id: 'BR-002', name: 'Munzalan Cabang Sambas', code: 'CBG-SBS', isPusat: false, pj: 'Pengurus Cabang Sambas', phone: '0852-9988-7766', address: 'Kabupaten Sambas, Kalimantan Barat' },
  { id: 'BR-003', name: 'Munzalan Cabang Singkawang', code: 'CBG-SKW', isPusat: false, pj: 'Pengurus Cabang Singkawang', phone: '0813-1122-3344', address: 'Kota Singkawang, Kalimantan Barat' },
  { id: 'BR-004', name: 'Munzalan Cabang Sintang', code: 'CBG-STG', isPusat: false, pj: 'Pengurus Cabang Sintang', phone: '0821-5566-7788', address: 'Kabupaten Sintang, Kalimantan Barat' },
  { id: 'BR-005', name: 'Munzalan Cabang Mempawah', code: 'CBG-MPW', isPusat: false, pj: 'Pengurus Cabang Mempawah', phone: '0812-7788-9900', address: 'Kabupaten Mempawah, Kalimantan Barat' },
  { id: 'BR-006', name: 'Munzalan Cabang Ketapang', code: 'CBG-KTP', isPusat: false, pj: 'Pengurus Cabang Ketapang', phone: '0853-4455-6677', address: 'Kabupaten Ketapang, Kalimantan Barat' }
];

// Initial Sample Divisions / Units
const DEFAULT_DIVISIONS = [
  { id: 'DIV-001', name: 'Divisi Riayah & Sarpras', parent: 'Masjid Munzalan Mubarakan', logo: 'logo-munzalan.png', code: 'RIAYAH', pj: 'Divisi Riayah' },
  { id: 'DIV-002', name: 'Pondok & Pendidikan Santri', parent: 'Yayasan Munzalan', logo: 'logo-munzalan.png', code: 'PONDOK', pj: 'Biro Pendidikan' },
  { id: 'DIV-003', name: 'Kantor Sekretariat & Humas', parent: 'Masjid Munzalan Mubarakan', logo: 'logo-munzalan.png', code: 'SEKRET', pj: 'Sekretariat' }
];

// Default System Settings
const DEFAULT_SETTINGS = {
  instansiName: 'MASJID MUNZALAN MUBARAKAN',
  instansiParent: 'PENCATATAN ASET & INVENTARIS RIAYAH',
  instansiAddress: 'Jl. Sungai Raya Dalam Gg. Imaduddin, Kubu Raya / Pontianak, Kalimantan Barat',
  instansiPhone: '0812-5555-9900 / (0561) 789100',
  instansiEmail: 'inventaris@munzalan.or.id',
  leaderTitle: 'Pimpinan Yayasan & DKM',
  leaderName: 'Ust. H. Luqmanulhakim, M.Pd.',
  leaderNip: '-',
  assetOfficerTitle: 'Pengurus Inventaris & Sarana Prasarana (Riayah)',
  assetOfficerName: 'Divisi Riayah Munzalan',
  city: 'Kubu Raya',
  kopBannerImage: '', // Base64 or URL
  useKopBanner: false,
  logoImage: 'logo-munzalan.png',
  paperSize: 'a4', // 'a4' or 'f4'
  depreciationEnabled: true,
  residualRate: 0, // percentage
  // Format Kode Aset Otomatis
  codePrefix: '',
  codeSeparator: '-', // '-', '/', '.', '_', ''
  codeIncludeCategory: true,
  codeIncludeRoom: true,
  codeIncludeYear: 'YYYY', // 'YYYY', 'YY', 'none'
  codeDigits: 3, // 3, 4, 5, 6
  codeSequenceMode: 'category_room' // 'category_room', 'category', 'room', 'global'
};

// Master Lokasi / Ruangan Resmi (Mulai dari kosongan untuk input data mandiri)
const DEFAULT_ROOMS = [];

// Master 11 Kategori Resmi Standar Munzalan
const DEFAULT_CATEGORIES = [
  { id: 'CAT-ELE', code: 'ELE', name: 'Elektronik', lifespan: 5, description: 'TV, Proyektor, Sound System, Komputer, Kipas Angin, AC' },
  { id: 'CAT-PRB', code: 'PRB', name: 'Perabot / Mebelair', lifespan: 8, description: 'Meja, Kursi, Lemari, Rak Buku, Mimbar, Karpet, Meja Prasmanan, Rehal' },
  { id: 'CAT-ALB', code: 'ALB', name: 'Alat Bersih', lifespan: 3, description: 'Vacuum Cleaner, Alat Pel, Ember, Sapu, Kain Lap' },
  { id: 'CAT-PER', code: 'PER', name: 'Peralatan Dapur / Konsumsi', lifespan: 5, description: 'Panci, Kompor, Dispenser, Kulkas, Gelas, Piring, Microwave, Pisau' },
  { id: 'CAT-KNT', code: 'KNT', name: 'Kantor', lifespan: 5, description: 'Printer, Mesin Fotokopi, File Folder, Alat Tulis, Brankas, Papan Reklame, Mesin Penghitung Uang' },
  { id: 'CAT-OLH', code: 'OLH', name: 'Olahraga & Rekreasi', lifespan: 4, description: 'Bola, Raket, Alat Fitness, Tenis Meja, dll' },
  { id: 'CAT-KND', code: 'KND', name: 'Kendaraan', lifespan: 10, description: 'Mobil Operasional, Motor, Sepeda' },
  { id: 'CAT-PKJ', code: 'PKJ', name: 'Perkakas / Perbaikan', lifespan: 5, description: 'Bor, Tang, Obeng, Kunci Inggris, Gergaji, Box Container' },
  { id: 'CAT-AGN', code: 'AGN', name: 'Alat Bangunan', lifespan: 7, description: 'Genset, Pompa Air, Tangga, Alat Keselamatan (APAR)' },
  { id: 'CAT-ADM', code: 'ADM', name: 'Administrasi', lifespan: 4, description: 'Buku Besar, Stempel, Kotak Arsip (untuk fisik dokumen)' },
  { id: 'CAT-LNN', code: 'LNN', name: 'Lain-lain', lifespan: 5, description: 'Barang yang tidak masuk kategori di atas' }
];

// Initial Sample Assets
const DEFAULT_ASSETS = [
  {
    id: 'ELE-KNTR-2024-001',
    date: '2024-02-15',
    tanggalDiterima: '2024-02-15',
    noInduk: '001/INV/2024',
    code: 'ELE-KNTR-2024-001',
    kodeBarang: 'ELE-KNTR-2024-001',
    name: 'PC All-in-One Core i5 16GB',
    namaBarang: 'PC All-in-One Core i5 16GB',
    brandType: 'Lenovo IdeaCentre AIO 3',
    merkType: 'Lenovo IdeaCentre AIO 3',
    brand: 'Lenovo IdeaCentre',
    size: '23.8 Inci',
    ukuran: '23.8 Inci',
    material: 'Plastik & Logam',
    bahan: 'Plastik & Logam',
    productionYear: 2023,
    tahunPembuatan: 2023,
    source: 'Dana Wakaf Produktif 2024',
    asalBarang: 'Dana Wakaf Produktif 2024',
    documents: 'Kuitansi & BAST Resmi',
    kelengkapanDokumen: 'Kuitansi & BAST Resmi',
    qty: 1,
    jumlahBarang: 1,
    unit: 'Unit',
    satuan: 'Unit',
    condition: 'B',
    kondisi: 'B',
    unitPrice: 11500000,
    hargaSatuan: 11500000,
    price: 11500000,
    hargaJumlah: 11500000,
    notes: 'Unit komputer operasional sekretariat & database aset',
    keterangan: 'Unit komputer operasional sekretariat & database aset',
    roomId: 'RM-KNTR',
    roomName: 'Kantor Sekretariat',
    roomCode: 'KNTR',
    categoryId: 'CAT-ELE',
    categoryName: 'Elektronik',
    categoryCode: 'ELE',
    status: 'Aktif',
    lifespan: 5
  },
  {
    id: 'ELE-AULA-2024-001',
    date: '2024-03-10',
    tanggalDiterima: '2024-03-10',
    noInduk: '002/INV/2024',
    code: 'ELE-AULA-2024-001',
    kodeBarang: 'ELE-AULA-2024-001',
    name: 'Proyektor Laser Full HD 4000 Lumens',
    namaBarang: 'Proyektor Laser Full HD 4000 Lumens',
    brandType: 'Epson EB-FH52',
    merkType: 'Epson EB-FH52',
    brand: 'Epson',
    size: 'Full HD 1080p',
    ukuran: 'Full HD 1080p',
    material: 'Plastik ABS',
    bahan: 'Plastik ABS',
    productionYear: 2024,
    tahunPembuatan: 2024,
    source: 'Kas Riayah Munzalan',
    asalBarang: 'Kas Riayah Munzalan',
    documents: 'Faktur Resmi & Kartu Garansi',
    kelengkapanDokumen: 'Faktur Resmi & Kartu Garansi',
    qty: 1,
    jumlahBarang: 1,
    unit: 'Unit',
    satuan: 'Unit',
    condition: 'B',
    kondisi: 'B',
    unitPrice: 14800000,
    hargaSatuan: 14800000,
    price: 14800000,
    hargaJumlah: 14800000,
    notes: 'Proyektor utama panggung aula tabligh akbar & kajian santri',
    keterangan: 'Proyektor utama panggung aula tabligh akbar & kajian santri',
    roomId: 'RM-AULA',
    roomName: 'Aula / Ruang Serbaguna',
    roomCode: 'AULA',
    categoryId: 'CAT-ELE',
    categoryName: 'Elektronik',
    categoryCode: 'ELE',
    status: 'Aktif',
    lifespan: 5
  },
  {
    id: 'PRB-KNTR-2023-001',
    date: '2023-01-12',
    tanggalDiterima: '2023-01-12',
    noInduk: '003/INV/2023',
    code: 'PRB-KNTR-2023-001',
    kodeBarang: 'PRB-KNTR-2023-001',
    name: 'Meja Rapat Kayu Jati 10 Kursi',
    namaBarang: 'Meja Rapat Kayu Jati 10 Kursi',
    brandType: 'Custom Jepara Solid Teak',
    merkType: 'Custom Jepara Solid Teak',
    brand: 'Custom Jepara',
    size: '300 x 120 cm',
    ukuran: '300 x 120 cm',
    material: 'Kayu Jati Solid Grade A',
    bahan: 'Kayu Jati Solid Grade A',
    productionYear: 2022,
    tahunPembuatan: 2022,
    source: 'Wakaf Pengusaha Pontianak',
    asalBarang: 'Wakaf Pengusaha Pontianak',
    documents: 'Akta Ikrar Wakaf Barang',
    kelengkapanDokumen: 'Akta Ikrar Wakaf Barang',
    qty: 1,
    jumlahBarang: 1,
    unit: 'Set',
    satuan: 'Set',
    condition: 'B',
    kondisi: 'B',
    unitPrice: 18500000,
    hargaSatuan: 18500000,
    price: 18500000,
    hargaJumlah: 18500000,
    notes: 'Meja musyawarah pengurus & dewan pimpinan munzalan',
    keterangan: 'Meja musyawarah pengurus & dewan pimpinan munzalan',
    roomId: 'RM-KNTR',
    roomName: 'Kantor Sekretariat',
    roomCode: 'KNTR',
    categoryId: 'CAT-PRB',
    categoryName: 'Perabot / Mebelair',
    categoryCode: 'PRB',
    status: 'Aktif',
    lifespan: 8
  },
  {
    id: 'AGN-PKRN-2022-001',
    date: '2022-05-18',
    tanggalDiterima: '2022-05-18',
    noInduk: '004/INV/2022',
    code: 'AGN-PKRN-2022-001',
    kodeBarang: 'AGN-PKRN-2022-001',
    name: 'Mesin Genset Silent Diesel 10 kVA',
    namaBarang: 'Mesin Genset Silent Diesel 10 kVA',
    brandType: 'Yanmar Silent Diesel 10kVA',
    merkType: 'Yanmar Silent Diesel 10kVA',
    brand: 'Yanmar',
    size: '10 kVA / 8000 Watt',
    ukuran: '10 kVA / 8000 Watt',
    material: 'Baja Enclosure Silent',
    bahan: 'Baja Enclosure Silent',
    productionYear: 2022,
    tahunPembuatan: 2022,
    source: 'Pengadaan Sarpras Munzalan',
    asalBarang: 'Pengadaan Sarpras Munzalan',
    documents: 'Faktur & Buku Garansi Mesin',
    kelengkapanDokumen: 'Faktur & Buku Garansi Mesin',
    qty: 1,
    jumlahBarang: 1,
    unit: 'Unit',
    satuan: 'Unit',
    condition: 'B',
    kondisi: 'B',
    unitPrice: 42000000,
    hargaSatuan: 42000000,
    price: 42000000,
    hargaJumlah: 42000000,
    notes: 'Cadangan darurat listrik masjid utama & asrama santri',
    keterangan: 'Cadangan darurat listrik masjid utama & asrama santri',
    roomId: 'RM-PKRN',
    roomName: 'Pekarangan / Halaman',
    roomCode: 'PKRN',
    categoryId: 'CAT-AGN',
    categoryName: 'Alat Bangunan',
    categoryCode: 'AGN',
    status: 'Aktif',
    lifespan: 7
  }
];

// Initial Sample Disposals (Log Pemutihan)
const DEFAULT_DISPOSALS = [
  {
    id: 'DSP-001',
    assetCode: 'AST-2019-ELK-099',
    assetName: 'Printer Dot Matrix LX-310 (Lama)',
    roomName: 'Ruang Tata Usaha',
    date: '2025-11-20',
    price: 2800000,
    reason: 'Rusak Berat / Rusak Total',
    docNo: 'BA.01/DISP/SMAN1/XI/2025',
    notes: 'Mainboard terbakar dan jarum cetak patah'
  }
];

// Initial Sample Lendings
const DEFAULT_LENDINGS = [
  {
    id: 'LND-001',
    assetId: 'AST-2024-ELK-002',
    assetCode: 'AST-2024-ELK-002',
    assetName: 'Proyektor Laser Full HD 4000 Lumens',
    borrower: 'Panitia LDKS Siswa (Hendra)',
    date: '2026-08-28',
    returnDate: '2026-09-02',
    status: 'Dipinjam',
    purpose: 'Presentasi materi kepemimpinan OSIS di Ruang Multimedia'
  }
];

// Initial Sample BAST & Pemegang Aset
const DEFAULT_BAST = [
  {
    id: 'BAST-2026-001',
    docNo: 'BAST/RIAYAH/2026/001',
    recipientName: 'Ust. Hendra Gunawan, S.Pd.',
    stambuk: 'STB-2021-089',
    amanah: 'Koordinator Penyaluran Beras & Logistik Riayah',
    region: 'Munzalan Pusat (Kubu Raya / Pontianak)',
    isPusat: true,
    phone: '0813-4567-8901',
    date: '2026-01-15',
    assetId: 'AST-2022-MSN-005',
    assetCode: 'AST-2022-MSN-005',
    assetName: 'Mesin Genset Silent Diesel 10 kVA',
    assetCategory: 'Mesin & Peralatan Kantor',
    assetSerial: 'GS-2022-DSL-9921',
    accessories: 'Kunci Kontak (2 set), Manual Book, Kabel Output Power 50m, Toolkit Servis',
    condition: 'Sangat Baik / Mulus & Terawat',
    commitmentClause: 'Sanggup menjaga, merawat, dan mengelola aset amanah dakwah ini dengan penuh tanggung jawab, tidak memindahtangankan tanpa izin tertulis, serta siap mengembalikan saat purna tugas.',
    status: 'Aktif',
    notes: 'Diserahkan langsung di Kantor Riayah Pusat untuk operasional penunjang dakwah.'
  },
  {
    id: 'BAST-2026-002',
    docNo: 'BAST/RIAYAH/2026/002',
    recipientName: 'Rahmat Hidayatullah',
    stambuk: 'STB-2023-142',
    amanah: 'Tim Creative Media & Publikasi Dakwah',
    region: 'Munzalan Cabang Sambas',
    isPusat: false,
    phone: '0852-9988-7766',
    date: '2026-02-10',
    assetId: 'AST-2024-ELK-001',
    assetCode: 'AST-2024-ELK-001',
    assetName: 'PC All-in-One Core i5 16GB',
    assetCategory: 'Elektronik & Komputer',
    assetSerial: 'AIO-883921-2024',
    accessories: 'Unit PC All-in-One, Keyboard & Mouse Wireless, Adaptor Power Original, Box',
    condition: 'Baik Normal',
    commitmentClause: 'Sanggup menjaga, merawat, dan mengelola aset amanah dakwah ini dengan penuh tanggung jawab, tidak memindahtangankan tanpa izin tertulis, serta siap mengembalikan saat purna tugas.',
    status: 'Aktif',
    notes: 'Penyerahan aset operasional pembuatan konten video & siaran dakwah daerah.'
  }
];

// Initial Sample Berita Acara Kerusakan / Pemeriksaan Fisik Barang Rusak
const DEFAULT_DAMAGE_REPORTS = [
  {
    id: 'BA-RSK-2026-001',
    docNo: 'BA.01/RSK-SARPRAS/2026',
    assetId: 'AST-2024-ELK-002',
    assetCode: 'AST-2024-ELK-002',
    assetName: 'Proyektor Laser Full HD 4000 Lumens',
    categoryName: 'Elektronik',
    roomName: 'Aula / Ruang Serbaguna',
    date: '2026-03-01',
    inspectorName: 'Ust. Syahril & Teknisi Proyektor',
    inspectorTitle: 'Tim Verifikasi Sarpras',
    severity: 'Rusak Berat',
    damageDescription: 'Lampu laser proyektor mati total dan optik dalam mengalami panas berlebih (overheat). Biaya penggantian optik tidak ekonomis dibanding pengadaan unit baru.',
    recommendation: 'Usulkan Penghapusan (Pemutihan Aset)',
    status: 'Menunggu Usulan Penghapusan',
    photos: [],
    suratDoc: null,
    createdAt: '2026-03-01T10:00:00.000Z'
  }
];

// Initial Sample Mutasi & Pemindahan Aset
const DEFAULT_MUTATIONS = [
  {
    id: 'MUT-2026-001',
    docNo: 'BA-MUT/MKMM/2026/08/001',
    date: '2026-08-15',
    assetId: 'AST-2024-ELK-001',
    assetCode: 'AST-2024-ELK-001',
    assetName: 'PC All-in-One Core i5 16GB',
    categoryName: 'Elektronik & Komputer',
    brandType: 'HP Pavilion 24',
    qty: 1,
    unit: 'Unit',
    fromBranchId: 'BR-001',
    fromBranchName: 'Munzalan Pusat (Kubu Raya / Pontianak)',
    fromDivisionId: 'DIV-001',
    fromDivisionName: 'Divisi Riayah & Sarpras',
    fromRoomId: 'RM-001',
    fromRoomName: 'Ruang Sekretariat Utama',
    fromPj: 'Ust. Hendra Gunawan',
    fromPjNip: '19880112-2020-01',
    toBranchId: 'BR-002',
    toBranchName: 'Munzalan Cabang Sambas',
    toDivisionId: 'DIV-001',
    toDivisionName: 'Divisi Riayah & Sarpras',
    toRoomId: 'RM-004',
    toRoomName: 'Ruang Operasional Cabang',
    toPj: 'Rahmat Hidayatullah',
    toPjNip: '19950320-2023-04',
    reason: 'Pemindahan unit PC untuk mendukung operasional dakwah dan administrasi kantor Cabang Sambas.',
    condition: 'Baik',
    notes: 'Disertai keyboard mouse wireless dan kabel power asli.',
    operator: 'Administrator',
    status: 'Selesai',
    createdAt: '2026-08-15T09:30:00.000Z'
  },
  {
    id: 'MUT-2026-002',
    docNo: 'BA-MUT/MKMM/2026/09/002',
    date: '2026-09-02',
    assetId: 'AST-2024-ELK-002',
    assetCode: 'AST-2024-ELK-002',
    assetName: 'Proyektor Laser Full HD 4000 Lumens',
    categoryName: 'Elektronik & Komputer',
    brandType: 'Epson EB-L200F',
    qty: 1,
    unit: 'Unit',
    fromBranchId: 'BR-001',
    fromBranchName: 'Munzalan Pusat (Kubu Raya / Pontianak)',
    fromDivisionId: 'DIV-001',
    fromDivisionName: 'Divisi Riayah & Sarpras',
    fromRoomId: 'RM-002',
    fromRoomName: 'Gudang Sarpras & Perlengkapan',
    fromPj: 'Marbot Ridwan',
    fromPjNip: '-',
    toBranchId: 'BR-001',
    toBranchName: 'Munzalan Pusat (Kubu Raya / Pontianak)',
    toDivisionId: 'DIV-002',
    toDivisionName: 'Pondok & Pendidikan Santri',
    toRoomId: 'RM-003',
    toRoomName: 'Aula Serbaguna Utama',
    toPj: 'Ust. Ahmad Fauzi, S.Pd.I',
    toPjNip: '19900814-2021-02',
    reason: 'Pemasangan proyektor permanen di Aula Serbaguna untuk pembelajaran santri & kajian rutin.',
    condition: 'Baik',
    notes: 'Termasuk bracket gantung dan remote control.',
    operator: 'Administrator',
    status: 'Selesai',
    createdAt: '2026-09-02T14:15:00.000Z'
  }
];

// Master Kategori Standar Barang Habis Pakai (BHP / Non-Aset)
const DEFAULT_BHP_CATEGORIES = [
  { id: 'BHP-CAT-ATK', code: 'ATK', name: 'Alat Tulis & Kantor (ATK)', description: 'Kertas HVS, Tinta, Spidol, Pulpen, Map, Binder, Steples' },
  { id: 'BHP-CAT-KBR', code: 'KBR', name: 'Kebersihan & Sanitasi', description: 'Sabun Cuci, Pembersih Lantai, Tisu Wudhu/Toilet, Kantong Sampah, Karbol' },
  { id: 'BHP-CAT-KNS', code: 'KNS', name: 'Konsumsi & Dapur', description: 'Kopi, Teh, Gula, Air Mineral Galon/Dus, Snack Pengajian, Cup Kertas' },
  { id: 'BHP-CAT-PRW', code: 'PRW', name: 'Perawatan & Kelistrikan / Lampu', description: 'Lampu LED Cadangan, Baterai Mic Wireless, Oli Genset, Filter Air' },
  { id: 'BHP-CAT-MDS', code: 'MDS', name: 'Medis & P3K', description: 'Obat-obatan umum, Perban, Betadine, Minyak Kayu Putih, Masker' },
  { id: 'BHP-CAT-LNN', code: 'LNN', name: 'Lain-lain / Perlengkapan Khusus', description: 'Bahan habis pakai lainnya untuk operasional rutin' }
];

// Initial Sample Data Barang Habis Pakai / Non-Inventaris (Format Identik Data Aset)
const DEFAULT_BHP_ITEMS = [
  {
    id: 'NON-ATK-2024-001',
    code: 'NON-ATK-2024-001',
    name: 'Kertas HVS A4 75gr PaperOne',
    brandType: 'PaperOne All Purpose',
    size: 'A4 (210 x 297 mm)',
    material: 'Kertas Woodfree 75 GSM',
    productionYear: 2024,
    source: 'Kas Riayah & Sarpras',
    documents: 'Struk Toko Buku & Nota Resmi',
    categoryId: 'BHP-CAT-ATK',
    categoryName: 'Alat Tulis & Kantor (ATK)',
    qty: 15,
    stock: 15,
    unit: 'Rim',
    condition: 'Baik',
    unitPrice: 48000,
    price: 720000,
    totalValue: 720000,
    roomId: 'RM-KNTR',
    roomName: 'Kantor Sekretariat',
    locationDetail: 'Lemari ATK Sekretariat - Rak 1',
    dateReceived: '2024-03-01',
    notes: 'Persediaan operasional pencetakan surat & administrasi kantor'
  },
  {
    id: 'NON-ATK-2024-002',
    code: 'NON-ATK-2024-002',
    name: 'Spidol Whiteboard Snowman Boardmarker Hitam',
    brandType: 'Snowman BG-12',
    size: 'Bullet Tip 2.0 mm',
    material: 'Plastik & Tinta Alkohol',
    productionYear: 2024,
    source: 'Kas Riayah & Sarpras',
    documents: 'Nota Pembelian',
    categoryId: 'BHP-CAT-ATK',
    categoryName: 'Alat Tulis & Kantor (ATK)',
    qty: 24,
    stock: 24,
    unit: 'Pcs',
    condition: 'Baik',
    unitPrice: 8500,
    price: 204000,
    totalValue: 204000,
    roomId: 'RM-KNTR',
    roomName: 'Kantor Sekretariat',
    locationDetail: 'Laci Administrasi Pengurus',
    dateReceived: '2024-03-05',
    notes: 'Untuk papan pengumuman & jadwal taklim santri'
  },
  {
    id: 'NON-ATK-2024-003',
    code: 'NON-ATK-2024-003',
    name: 'Tinta Printer Epson 003 Black Original',
    brandType: 'Epson T00V100 Black 65ml',
    size: '65 ml',
    material: 'Tinta Dye Base',
    productionYear: 2024,
    source: 'Kas Riayah & Sarpras',
    documents: 'Kuitansi Resmi Toko Komputer',
    categoryId: 'BHP-CAT-ATK',
    categoryName: 'Alat Tulis & Kantor (ATK)',
    qty: 4,
    stock: 4,
    unit: 'Botol',
    condition: 'Baik',
    unitPrice: 92000,
    price: 368000,
    totalValue: 368000,
    roomId: 'RM-KNTR',
    roomName: 'Kantor Sekretariat',
    locationDetail: 'Lemari Brankas Khusus Tinta',
    dateReceived: '2024-02-20',
    notes: 'Tinta printer EcoTank L3110/L3210 sekretariat'
  },
  {
    id: 'NON-KBR-2024-001',
    code: 'NON-KBR-2024-001',
    name: 'Cairan Pembersih Lantai Wipol Karbol Wangi 750ml',
    brandType: 'Wipol Karbol Cemara',
    size: '750 ml Pouch',
    material: 'Desinfektan Pine Oil',
    productionYear: 2024,
    source: 'Infaq Kebersihan Jamaah',
    documents: 'Nota Belanja Bulanan',
    categoryId: 'BHP-CAT-KBR',
    categoryName: 'Kebersihan & Sanitasi',
    qty: 12,
    stock: 12,
    unit: 'Pouch',
    condition: 'Baik',
    unitPrice: 18500,
    price: 222000,
    totalValue: 222000,
    roomId: 'RM-GUD',
    roomName: 'Gudang',
    locationDetail: 'Rak Perlengkapan Kebersihan',
    dateReceived: '2024-03-02',
    notes: 'Pembersih lantai ruang utama sholat & serambi'
  },
  {
    id: 'NON-KBR-2024-002',
    code: 'NON-KBR-2024-002',
    name: 'Sabun Cuci Tangan Hand Soap 4 Liter',
    brandType: 'Yuri / SOS Antiseptik',
    size: 'Jerigen 4 Liter',
    material: 'Liquid Soap Antiseptic',
    productionYear: 2024,
    source: 'Infaq Kebersihan Jamaah',
    documents: 'Kuitansi Belanja Grosir',
    categoryId: 'BHP-CAT-KBR',
    categoryName: 'Kebersihan & Sanitasi',
    qty: 3,
    stock: 3,
    unit: 'Jerigen',
    condition: 'Baik',
    unitPrice: 45000,
    price: 135000,
    totalValue: 135000,
    roomId: 'RM-TOI',
    roomName: 'Toilet / Kamar Mandi',
    locationDetail: 'Gudang Riayah Bawah / Toilet Wudhu',
    dateReceived: '2024-03-01',
    notes: 'Isi ulang dispenser sabun wudhu ikhwan & akhwat'
  },
  {
    id: 'NON-PRW-2024-001',
    code: 'NON-PRW-2024-001',
    name: 'Lampu LED Philips 14 Watt Putih E27',
    brandType: 'Philips MyCare LED 14W Cool Daylight',
    size: '14 Watt / 1800 Lumens',
    material: 'Plastik & LED SMD',
    productionYear: 2024,
    source: 'Kas Riayah Sarpras',
    documents: 'Nota Toko Listrik',
    categoryId: 'BHP-CAT-PRW',
    categoryName: 'Perawatan & Kelistrikan / Lampu',
    qty: 14,
    stock: 14,
    unit: 'Pcs',
    condition: 'Baik',
    unitPrice: 42000,
    price: 588000,
    totalValue: 588000,
    roomId: 'RM-GUD',
    roomName: 'Gudang',
    locationDetail: 'Lemari Perlengkapan Listrik',
    dateReceived: '2024-02-28',
    notes: 'Cadangan lampu ruang utama sholat & selasar'
  },
  {
    id: 'NON-PRW-2024-002',
    code: 'NON-PRW-2024-002',
    name: 'Baterai Alkaline AA (Mic Wireless) Isi 2',
    brandType: 'ABC Alkaline Millennium Power AA',
    size: '1.5V Size AA',
    material: 'Alkaline Manganese Dioxide',
    productionYear: 2024,
    source: 'Kas Riayah Sarpras',
    documents: 'Nota Pembelian',
    categoryId: 'BHP-CAT-PRW',
    categoryName: 'Perawatan & Kelistrikan / Lampu',
    qty: 18,
    stock: 18,
    unit: 'Pack',
    condition: 'Baik',
    unitPrice: 16000,
    price: 288000,
    totalValue: 288000,
    roomId: 'RM-RUT',
    roomName: 'Ruang Utama',
    locationDetail: 'Kotak Audio & Sound System Mimbar',
    dateReceived: '2024-03-02',
    notes: 'Baterai mic wireless imam sholat & kajian subuh'
  },
  {
    id: 'NON-KNS-2024-001',
    code: 'NON-KNS-2024-001',
    name: 'Dispenser Pompa Galon Manual',
    brandType: 'Maspion Hand Pump',
    size: 'Standar Galon 19L',
    material: 'Plastik Food Grade',
    productionYear: 2023,
    source: 'Infaq Dapur',
    documents: 'Kuitansi',
    categoryId: 'BHP-CAT-KNS',
    categoryName: 'Konsumsi & Dapur',
    qty: 2,
    stock: 2,
    unit: 'Unit',
    condition: 'Rusak Ringan',
    unitPrice: 35000,
    price: 70000,
    totalValue: 70000,
    roomId: 'RM-DPR',
    roomName: 'Dapur',
    locationDetail: 'Meja Saji Dapur Belakang',
    dateReceived: '2023-11-10',
    notes: 'Pompa agak longgar pada seal karet penutup, masih bisa dipakai cadangan'
  },
  {
    id: 'NON-PRW-2024-003',
    code: 'NON-PRW-2024-003',
    name: 'Kabel Roll Terminal 4 Lubang 10 Meter',
    brandType: 'Uticon Extension Cable',
    size: '10 Meter / 4 Socket',
    material: 'Kabel Tembaga & Plastik',
    productionYear: 2023,
    source: 'Kas Sarpras',
    documents: 'Nota',
    categoryId: 'BHP-CAT-PRW',
    categoryName: 'Perawatan & Kelistrikan / Lampu',
    qty: 1,
    stock: 1,
    unit: 'Unit',
    condition: 'Rusak Ringan',
    unitPrice: 95000,
    price: 95000,
    totalValue: 95000,
    roomId: 'RM-AULA',
    roomName: 'Aula / Ruang Serbaguna',
    locationDetail: 'Pojok Panggung Aula',
    dateReceived: '2023-08-15',
    notes: '1 lubang colokan agak kendor, butuh diservis baut dalamnya'
  }
];

// Sample Initial Mutasi Pemakaian BHP
const DEFAULT_BHP_TRANSACTIONS = [
  {
    id: 'TRX-BHP-2024-001',
    bhpId: 'BHP-ATK-001',
    bhpCode: 'BHP-ATK-001',
    bhpName: 'Kertas HVS A4 75gr PaperOne',
    type: 'keluar', // 'masuk' atau 'keluar'
    date: '2024-03-03',
    qty: 2,
    unit: 'Rim',
    unitPrice: 48000,
    totalPrice: 96000,
    recipient: 'Ust. Syahril (Pendidikan Santri)',
    targetRoom: 'Kantor Sekretariat',
    notes: 'Pencetakan modul silabus kajian santri',
    createdBy: 'Divisi Riayah'
  },
  {
    id: 'TRX-BHP-2024-002',
    bhpId: 'BHP-KBR-001',
    bhpCode: 'BHP-KBR-001',
    bhpName: 'Cairan Pembersih Lantai Wipol Karbol Wangi 750ml',
    type: 'keluar',
    date: '2024-03-04',
    qty: 3,
    unit: 'Pouch',
    unitPrice: 18500,
    totalPrice: 55500,
    recipient: 'M. Ridwan (Marbot)',
    targetRoom: 'Ruang Utama & Serambi',
    notes: 'Pembersihan mingguan karpet & lantai masjid',
    createdBy: 'Divisi Riayah'
  },
  {
    id: 'TRX-BHP-2024-003',
    bhpId: 'BHP-PRW-002',
    bhpCode: 'BHP-PRW-002',
    bhpName: 'Baterai Alkaline AA (Mic Wireless) Isi 2',
    type: 'keluar',
    date: '2024-03-05',
    qty: 2,
    unit: 'Pack',
    unitPrice: 16000,
    totalPrice: 32000,
    recipient: 'Soundman / Petugas Audio',
    targetRoom: 'Ruang Utama',
    notes: 'Penggantian baterai mic imam & khutbah jumat',
    createdBy: 'Divisi Riayah'
  }
];

// Storage Engine Class
class AssetDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.save(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    } else {
      const curSettings = this.get(STORAGE_KEYS.SETTINGS) || {};
      if (curSettings.codeIncludeRoom === undefined) {
        this.save(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...curSettings, codeIncludeRoom: true, codeSequenceMode: 'category_room' });
      }
    }

    // Ruangan master dimulai dari data tersimpan atau array kosong
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
      this.save(STORAGE_KEYS.ROOMS, DEFAULT_ROOMS);
    }

    // Auto-migrate / sync standard 11 categories
    const existingCats = this.get(STORAGE_KEYS.CATEGORIES);
    if (!existingCats || existingCats.length < 6 || !existingCats.some(c => c.code === 'ELE')) {
      this.save(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }

    if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
      this.save(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
    }

    // Auto-backfill division metadata onto assets if missing
    try {
      const assets = this.get(STORAGE_KEYS.ASSETS);
      if (assets && assets.length > 0) {
        const rooms = this.get(STORAGE_KEYS.ROOMS) || DEFAULT_ROOMS;
        const divisions = this.get(STORAGE_KEYS.DIVISIONS) || DEFAULT_DIVISIONS;
        let updated = false;
        assets.forEach(a => {
          if (!a.divisionId) {
            const rm = rooms.find(r => r.id === a.roomId || r.name === a.roomName);
            if (rm && rm.divisionId) {
              a.divisionId = rm.divisionId;
              const dObj = divisions.find(d => d.id === rm.divisionId);
              a.divisionName = rm.divisionName || dObj?.name || 'Divisi Riayah & Sarpras';
              a.divisionCode = dObj?.code || 'RIAYAH';
              updated = true;
            } else {
              a.divisionId = 'DIV-001';
              a.divisionName = 'Divisi Riayah & Sarpras';
              a.divisionCode = 'RIAYAH';
              updated = true;
            }
          }
        });
        if (updated) {
          this.save(STORAGE_KEYS.ASSETS, assets);
        }
      }
    } catch (e) {
      console.warn('Error migrating asset divisions', e);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DISPOSALS)) {
      this.save(STORAGE_KEYS.DISPOSALS, DEFAULT_DISPOSALS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LENDINGS)) {
      this.save(STORAGE_KEYS.LENDINGS, DEFAULT_LENDINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVALUATIONS)) {
      this.save(STORAGE_KEYS.REVALUATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BAST)) {
      this.save(STORAGE_KEYS.BAST, DEFAULT_BAST);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DIVISIONS)) {
      this.save(STORAGE_KEYS.DIVISIONS, DEFAULT_DIVISIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
      this.save(STORAGE_KEYS.BRANCHES, DEFAULT_BRANCHES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BHP_CATEGORIES)) {
      this.save(STORAGE_KEYS.BHP_CATEGORIES, DEFAULT_BHP_CATEGORIES);
    }
    const existingBHP = this.get(STORAGE_KEYS.BHP);
    if (!existingBHP || existingBHP.length === 0 || !existingBHP.some(i => i.condition)) {
      this.save(STORAGE_KEYS.BHP, DEFAULT_BHP_ITEMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BHP_TRANSACTIONS)) {
      this.save(STORAGE_KEYS.BHP_TRANSACTIONS, DEFAULT_BHP_TRANSACTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DAMAGE_REPORTS)) {
      this.save(STORAGE_KEYS.DAMAGE_REPORTS, DEFAULT_DAMAGE_REPORTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MUTATIONS)) {
      this.save(STORAGE_KEYS.MUTATIONS, DEFAULT_MUTATIONS);
    }
  }

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading localStorage key: ' + key, e);
      return null;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving localStorage key: ' + key, e);
    }
  }

  // Assets CRUD
  getAssets() {
    return this.get(STORAGE_KEYS.ASSETS) || [];
  }

  getAssetById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const assets = this.getAssets();
    
    // 1. Direct match with id or code
    let found = assets.find(a => a.id === cleanId || a.code === cleanId);
    if (found) return found;

    // 2. Case-insensitive match
    found = assets.find(a => (a.id && a.id.toLowerCase() === cleanId.toLowerCase()) || (a.code && a.code.toLowerCase() === cleanId.toLowerCase()));
    if (found) return found;

    // 3. Substring / extracted match (e.g. from formatted text or URL)
    for (const a of assets) {
      if (a.code && cleanId.includes(a.code)) return a;
      if (a.id && cleanId.includes(a.id)) return a;
    }

    return null;
  }

  saveAsset(asset) {
    const assets = this.getAssets();
    const existingIndex = assets.findIndex(a => a.id === asset.id);
    if (existingIndex >= 0) {
      assets[existingIndex] = { ...assets[existingIndex], ...asset };
    } else {
      assets.unshift(asset);
    }
    this.save(STORAGE_KEYS.ASSETS, assets);
  }

  deleteAssetPermanently(id) {
    let assets = this.getAssets();
    assets = assets.filter(a => a.id !== id);
    this.save(STORAGE_KEYS.ASSETS, assets);
  }

  // Move Asset to Disposal Log (Penghapusan Sah)
  disposeAsset(disposalRecord) {
    const assets = this.getAssets();
    const targetAsset = assets.find(a => a.id === disposalRecord.assetId || a.code === disposalRecord.assetCode);
    if (targetAsset) {
      targetAsset.status = 'Dihapuskan';
      this.save(STORAGE_KEYS.ASSETS, assets.filter(a => a.id !== targetAsset.id));
    }

    const disposals = this.getDisposals();
    disposals.unshift(disposalRecord);
    this.save(STORAGE_KEYS.DISPOSALS, disposals);
  }

  // Disposals Log CRUD
  getDisposals() {
    return this.get(STORAGE_KEYS.DISPOSALS) || [];
  }

  // Disposal Requests (Permohonan & Approval Workflow) CRUD
  getDisposalRequests() {
    return this.get(STORAGE_KEYS.DISPOSAL_REQUESTS) || [];
  }

  getDisposalRequestById(id) {
    const requests = this.getDisposalRequests();
    return requests.find(r => r.id === id);
  }

  saveDisposalRequest(request) {
    const requests = this.getDisposalRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    if (existingIndex >= 0) {
      requests[existingIndex] = { ...requests[existingIndex], ...request };
    } else {
      requests.unshift(request);
    }
    this.save(STORAGE_KEYS.DISPOSAL_REQUESTS, requests);

    // Update asset under-disposal flag in master list
    if (request.assetId) {
      const assets = this.getAssets();
      const asset = assets.find(a => a.id === request.assetId);
      if (asset) {
        asset.isUnderDisposalRequest = request.status === 'Menunggu Persetujuan';
        this.save(STORAGE_KEYS.ASSETS, assets);
      }
    }
    return request;
  }

  approveDisposalRequest(requestId, approvalData) {
    const request = this.getDisposalRequestById(requestId);
    if (!request) return false;

    request.status = 'Disetujui';
    request.approvalData = {
      approvedAt: approvalData.approvedAt || new Date().toISOString().split('T')[0],
      approvedBy: approvalData.approvedBy || '-',
      approverTitle: approvalData.approverTitle || 'Pimpinan Lembaga',
      witnessName: approvalData.witnessName || '-',
      witnessTitle: approvalData.witnessTitle || 'Petugas Sarpras',
      baNumber: approvalData.baNumber || `BA.${Math.floor(10 + Math.random() * 90)}/DISP/${new Date().getFullYear()}`,
      notes: approvalData.notes || ''
    };
    this.saveDisposalRequest(request);

    // Create Disposal Log Record
    const disposalRecord = {
      id: `DISP-${Date.now()}`,
      requestId: request.id,
      assetId: request.assetId,
      assetCode: request.assetCode,
      assetName: request.assetName,
      categoryName: request.categoryName || '-',
      roomName: request.roomName || '-',
      price: parseFloat(request.price) || 0,
      bookValue: parseFloat(request.bookValue) || 0,
      date: request.approvalData.approvedAt,
      reason: request.reason,
      docNo: request.approvalData.baNumber,
      notes: request.notes || '',
      proposedBy: request.proposedBy || '-',
      approvedBy: request.approvalData.approvedBy,
      approverTitle: request.approvalData.approverTitle,
      witnessName: request.approvalData.witnessName,
      witnessTitle: request.approvalData.witnessTitle,
      photos: request.photos || [],
      evidenceImage: (request.photos && request.photos.length > 0) ? request.photos[0] : (request.evidenceImage || '')
    };

    this.disposeAsset(disposalRecord);
    return true;
  }

  rejectDisposalRequest(requestId, rejectData) {
    const request = this.getDisposalRequestById(requestId);
    if (!request) return false;

    request.status = 'Ditolak';
    request.rejectReason = rejectData.reason || 'Tidak disetujui';
    request.rejectedBy = rejectData.rejectedBy || 'Pimpinan';
    request.rejectedAt = new Date().toISOString().split('T')[0];
    this.saveDisposalRequest(request);

    // Release asset under-disposal flag
    if (request.assetId) {
      const assets = this.getAssets();
      const asset = assets.find(a => a.id === request.assetId);
      if (asset) {
        asset.isUnderDisposalRequest = false;
        this.save(STORAGE_KEYS.ASSETS, assets);
      }
    }
    return true;
  }

  deleteDisposalRequest(id) {
    let requests = this.getDisposalRequests();
    const req = requests.find(r => r.id === id);
    if (req && req.assetId) {
      const assets = this.getAssets();
      const asset = assets.find(a => a.id === req.assetId);
      if (asset) {
        asset.isUnderDisposalRequest = false;
        this.save(STORAGE_KEYS.ASSETS, assets);
      }
    }
    requests = requests.filter(r => r.id !== id);
    this.save(STORAGE_KEYS.DISPOSAL_REQUESTS, requests);
  }

  // Damage Reports / Berita Acara Kerusakan CRUD
  getDamageReports() {
    return this.get(STORAGE_KEYS.DAMAGE_REPORTS) || DEFAULT_DAMAGE_REPORTS;
  }

  getDamageReportById(id) {
    if (!id) return null;
    const list = this.getDamageReports();
    return list.find(r => r.id === id || r.docNo === id) || null;
  }

  getDamageReportByAssetId(assetId) {
    if (!assetId) return null;
    const list = this.getDamageReports();
    return list.find(r => r.assetId === assetId || r.assetCode === assetId) || null;
  }

  saveDamageReport(report) {
    const list = this.getDamageReports();
    const existingIndex = list.findIndex(r => r.id === report.id || (report.assetId && r.assetId === report.assetId));
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...report };
    } else {
      list.unshift(report);
    }
    this.save(STORAGE_KEYS.DAMAGE_REPORTS, list);

    // Also update asset condition to damaged if not yet
    if (report.assetId) {
      const asset = this.getAssetById(report.assetId);
      if (asset) {
        const severity = report.severity || 'Rusak Berat';
        asset.condition = severity === 'Rusak Ringan' ? 'RR' : 'RB';
        asset.kondisi = asset.condition;
        this.saveAsset(asset);
      }
    }
    return report;
  }

  deleteDamageReport(id) {
    let list = this.getDamageReports();
    list = list.filter(r => r.id !== id);
    this.save(STORAGE_KEYS.DAMAGE_REPORTS, list);
  }

  markAssetRepaired(assetId, repairNotes = '') {
    const asset = this.getAssetById(assetId);
    if (asset) {
      asset.condition = 'B';
      asset.kondisi = 'B';
      if (repairNotes) {
        asset.notes = (asset.notes ? asset.notes + ' | ' : '') + `[Perbaikan ${new Date().toISOString().split('T')[0]}]: ${repairNotes}`;
      }
      this.saveAsset(asset);
    }
    // Update damage report status if exists
    const report = this.getDamageReportByAssetId(assetId);
    if (report) {
      report.status = 'Selesai Diperbaiki';
      report.repairedAt = new Date().toISOString().split('T')[0];
      report.repairNotes = repairNotes;
      this.saveDamageReport(report);
    }
    return true;
  }

  // Aggregated Damaged Items (Assets with condition RR/RB/Rusak + Damage Reports)
  getDamagedItems() {
    const assets = this.getAssets().filter(a => a.status !== 'Dihapuskan');
    const reports = this.getDamageReports();
    const requests = this.getDisposalRequests();

    const damagedAssets = assets.filter(a => {
      const cond = (a.condition || '').trim();
      return cond === 'RR' || cond === 'RB' || cond === 'Rusak Ringan' || cond === 'Rusak Berat' || cond === 'Rusak';
    });

    return damagedAssets.map(a => {
      const report = reports.find(r => r.assetId === a.id || r.assetCode === a.code) || null;
      const activeRequest = requests.find(r => (r.assetId === a.id || r.assetCode === a.code) && r.status === 'Menunggu Persetujuan') || null;

      let severity = 'Rusak Berat';
      if (a.condition === 'RR' || a.condition === 'Rusak Ringan') severity = 'Rusak Ringan';
      if (report && report.severity) severity = report.severity;

      let status = 'Perlu Diperiksa / Buat BA';
      if (report) status = report.recommendation || 'BA Kerusakan Terbit';
      if (activeRequest) status = 'Sedang Diajukan Penghapusan';

      return {
        id: a.id,
        assetId: a.id,
        code: a.code,
        noInduk: a.noInduk || '-',
        name: a.name,
        brand: a.brandType || a.brand || '-',
        categoryName: a.categoryName || '-',
        roomName: a.roomName || 'Tanpa Ruangan',
        qty: a.qty || 1,
        unit: a.unit || 'Unit',
        price: a.price || 0,
        condition: a.condition,
        severity,
        dateRecorded: a.date || a.tanggalDiterima || '-',
        damageReport: report,
        hasBA: !!report,
        baNumber: report ? report.docNo : '',
        baDate: report ? report.date : '',
        inspector: report ? report.inspectorName : '',
        recommendation: report ? report.recommendation : '',
        photos: report && report.photos ? report.photos : (a.image ? [a.image] : []),
        suratDoc: report ? report.suratDoc : null,
        activeRequest,
        isUnderDisposal: !!activeRequest
      };
    });
  }

  // Rooms CRUD
  getRooms() {
    return this.get(STORAGE_KEYS.ROOMS) || [];
  }

  saveRoom(room) {
    const rooms = this.getRooms();
    const existingIndex = rooms.findIndex(r => r.id === room.id);
    if (existingIndex >= 0) {
      rooms[existingIndex] = { ...rooms[existingIndex], ...room };
    } else {
      rooms.push(room);
    }
    this.save(STORAGE_KEYS.ROOMS, rooms);
  }

  deleteRoom(id) {
    let rooms = this.getRooms();
    rooms = rooms.filter(r => r.id !== id);
    this.save(STORAGE_KEYS.ROOMS, rooms);
  }

  // Categories CRUD
  getCategories() {
    return this.get(STORAGE_KEYS.CATEGORIES) || [];
  }

  saveCategory(category) {
    const cats = this.getCategories();
    const existingIndex = cats.findIndex(c => c.id === category.id);
    if (existingIndex >= 0) {
      cats[existingIndex] = { ...cats[existingIndex], ...category };
    } else {
      cats.push(category);
    }
    this.save(STORAGE_KEYS.CATEGORIES, cats);
  }

  deleteCategory(id) {
    let cats = this.getCategories();
    cats = cats.filter(c => c.id !== id);
    this.save(STORAGE_KEYS.CATEGORIES, cats);
  }

  // Settings
  getSettings() {
    const saved = this.get(STORAGE_KEYS.SETTINGS) || {};
    // If it's the old default school name, auto-migrate to Masjid Kapal Munzalan Mubarakan
    if (!saved.instansiName || saved.instansiName === 'SMAN 1 TELADAN NUSANTARA') {
      saved.instansiName = DEFAULT_SETTINGS.instansiName;
      saved.instansiParent = DEFAULT_SETTINGS.instansiParent;
      saved.instansiAddress = DEFAULT_SETTINGS.instansiAddress;
      saved.instansiPhone = DEFAULT_SETTINGS.instansiPhone;
      saved.instansiEmail = DEFAULT_SETTINGS.instansiEmail;
      saved.leaderTitle = DEFAULT_SETTINGS.leaderTitle;
      saved.leaderName = DEFAULT_SETTINGS.leaderName;
      saved.leaderNip = DEFAULT_SETTINGS.leaderNip;
      saved.assetOfficerTitle = DEFAULT_SETTINGS.assetOfficerTitle;
      saved.assetOfficerName = DEFAULT_SETTINGS.assetOfficerName;
      saved.city = DEFAULT_SETTINGS.city;
      saved.logoImage = 'logo-munzalan.png';
      this.save(STORAGE_KEYS.SETTINGS, saved);
    }
    if (!saved.logoImage) {
      saved.logoImage = 'logo-munzalan.png';
      this.save(STORAGE_KEYS.SETTINGS, saved);
    }
    return { ...DEFAULT_SETTINGS, ...saved };
  }

  saveSettings(settings) {
    this.save(STORAGE_KEYS.SETTINGS, settings);
  }

  getScopeSettings(scope = null) {
    const globalSettings = this.getSettings();
    if (!scope && typeof AuthEngine !== 'undefined') {
      scope = AuthEngine.getScope();
    }
    if (!scope || scope.role === 'admin' || !scope.id) {
      return globalSettings;
    }

    if (scope.role === 'divisi') {
      const d = this.getDivisionById(scope.id);
      if (!d) return globalSettings;
      return {
        ...globalSettings,
        instansiName: d.name || globalSettings.instansiName,
        instansiParent: d.parent || globalSettings.instansiParent,
        logoImage: d.logo || globalSettings.logoImage,
        kopBannerImage: d.kopBannerImage || '',
        useKopBanner: d.useKopBanner !== undefined ? d.useKopBanner : (!!d.kopBannerImage),
        instansiAddress: d.address || globalSettings.instansiAddress,
        instansiPhone: d.phone || globalSettings.instansiPhone,
        instansiEmail: d.email || globalSettings.instansiEmail,
        leaderTitle: d.leaderTitle || 'Pimpinan Divisi',
        leaderName: d.leaderName || d.pj || globalSettings.leaderName,
        leaderNip: d.leaderNip || '-',
        assetOfficerTitle: d.assetOfficerTitle || 'Pengurus Sarpras Divisi',
        assetOfficerName: d.assetOfficerName || d.pj || globalSettings.assetOfficerName,
        city: d.city || globalSettings.city,
        scopeType: 'divisi',
        scopeId: d.id,
        scopeName: d.name
      };
    }

    if (scope.role === 'wilayah') {
      const b = this.getBranchById(scope.id);
      if (!b) return globalSettings;
      return {
        ...globalSettings,
        instansiName: b.name || globalSettings.instansiName,
        instansiParent: b.parent || 'MASJID KAPAL MUNZALAN MUBARAKAN',
        logoImage: b.logo || globalSettings.logoImage,
        kopBannerImage: b.kopBannerImage || '',
        useKopBanner: b.useKopBanner !== undefined ? b.useKopBanner : (!!b.kopBannerImage),
        instansiAddress: b.address || globalSettings.instansiAddress,
        instansiPhone: b.phone || globalSettings.instansiPhone,
        instansiEmail: b.email || globalSettings.instansiEmail,
        leaderTitle: b.leaderTitle || 'Pimpinan Cabang',
        leaderName: b.leaderName || b.pj || globalSettings.leaderName,
        leaderNip: b.leaderNip || '-',
        assetOfficerTitle: b.assetOfficerTitle || 'Pengurus Aset Cabang',
        assetOfficerName: b.assetOfficerName || globalSettings.assetOfficerName,
        city: b.city || b.name?.replace(/Munzalan\s*(Cabang)?\s*/i, '') || globalSettings.city,
        scopeType: 'wilayah',
        scopeId: b.id,
        scopeName: b.name
      };
    }

    return globalSettings;
  }

  saveScopeSettings(scope, data) {
    if (!scope && typeof AuthEngine !== 'undefined') {
      scope = AuthEngine.getScope();
    }
    if (!scope || scope.role === 'admin' || !scope.id) {
      const current = this.getSettings();
      this.saveSettings({ ...current, ...data });
      return;
    }

    if (scope.role === 'divisi') {
      let divs = this.getDivisions();
      const idx = divs.findIndex(d => d.id === scope.id);
      if (idx !== -1) {
        divs[idx] = { ...divs[idx], ...data };
        this.saveDivisions(divs);
      }
      return;
    }

    if (scope.role === 'wilayah') {
      let branches = this.getBranches();
      const idx = branches.findIndex(b => b.id === scope.id);
      if (idx !== -1) {
        branches[idx] = { ...branches[idx], ...data };
        this.saveBranches(branches);
      }
      return;
    }
  }

  // Lendings CRUD
  getLendings() {
    return this.get(STORAGE_KEYS.LENDINGS) || [];
  }

  saveLending(lending) {
    const lendings = this.getLendings();
    lendings.unshift(lending);
    this.save(STORAGE_KEYS.LENDINGS, lendings);
  }

  returnLending(id) {
    const lendings = this.getLendings();
    const target = lendings.find(l => l.id === id);
    if (target) {
      target.status = 'Dikembalikan';
      target.actualReturnDate = new Date().toISOString().split('T')[0];
      this.save(STORAGE_KEYS.LENDINGS, lendings);
    }
  }

  // Revaluation Logs
  getRevaluations() {
    return this.get(STORAGE_KEYS.REVALUATIONS) || [];
  }

  saveRevaluation(reval) {
    const revals = this.getRevaluations();
    revals.unshift(reval);
    this.save(STORAGE_KEYS.REVALUATIONS, revals);
  }

  // BAST & Pemegang Amanah Aset CRUD
  getBASTList() {
    return this.get(STORAGE_KEYS.BAST) || [];
  }

  getBASTById(id) {
    const list = this.getBASTList();
    return list.find(b => b.id === id) || null;
  }

  saveBAST(bast) {
    let list = this.getBASTList();
    const existingIndex = list.findIndex(b => b.id === bast.id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...bast };
    } else {
      list.unshift(bast);
    }
    this.save(STORAGE_KEYS.BAST, list);
  }

  returnBAST(id, returnNotes = '') {
    let list = this.getBASTList();
    const target = list.find(b => b.id === id);
    if (target) {
      target.status = 'Dikembalikan';
      target.actualReturnDate = new Date().toISOString().split('T')[0];
      target.returnNotes = returnNotes || 'Aset telah dikembalikan ke Bagian Riayah dalam kondisi baik.';
      this.save(STORAGE_KEYS.BAST, list);
    }
  }

  deleteBAST(id) {
    let list = this.getBASTList();
    list = list.filter(b => b.id !== id);
    this.save(STORAGE_KEYS.BAST, list);
  }

  // Master Divisi & Logo Methods
  getDivisions() {
    return this.get(STORAGE_KEYS.DIVISIONS) || DEFAULT_DIVISIONS;
  }

  saveDivisions(divisions) {
    this.save(STORAGE_KEYS.DIVISIONS, divisions);
  }

  addDivision(div) {
    const list = this.getDivisions();
    list.push(div);
    this.saveDivisions(list);
  }

  updateDivision(div) {
    let list = this.getDivisions();
    const idx = list.findIndex(d => d.id === div.id);
    if (idx !== -1) {
      list[idx] = div;
      this.saveDivisions(list);
    }
  }

  deleteDivision(id) {
    let list = this.getDivisions();
    list = list.filter(d => d.id !== id);
    this.saveDivisions(list);
  }

  getDivisionById(id) {
    const list = this.getDivisions();
    return list.find(d => d.id === id);
  }

  // Master Cabang & Wilayah Methods
  getBranches() {
    return this.get(STORAGE_KEYS.BRANCHES) || DEFAULT_BRANCHES;
  }

  saveBranches(branches) {
    this.save(STORAGE_KEYS.BRANCHES, branches);
  }

  addBranch(branch) {
    const list = this.getBranches();
    list.push(branch);
    this.saveBranches(list);
  }

  updateBranch(branch) {
    let list = this.getBranches();
    const idx = list.findIndex(b => b.id === branch.id);
    if (idx !== -1) {
      list[idx] = branch;
      this.saveBranches(list);
    }
  }

  deleteBranch(id) {
    let list = this.getBranches();
    list = list.filter(b => b.id !== id);
    this.saveBranches(list);
  }

  getBranchById(id) {
    const list = this.getBranches();
    return list.find(b => b.id === id);
  }

  // Master Barang Habis Pakai (BHP / Non-Aset) CRUD Methods
  getBHP() {
    return this.get(STORAGE_KEYS.BHP) || DEFAULT_BHP_ITEMS;
  }

  saveBHPList(items) {
    this.save(STORAGE_KEYS.BHP, items);
  }

  getBHPById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const list = this.getBHP();
    return list.find(item => item.id === cleanId || item.code === cleanId);
  }

  saveBHP(item) {
    const list = this.getBHP();
    const idx = list.findIndex(i => i.id === item.id || (item.code && i.code === item.code));
    
    // Normalize fields matching asset standard
    const qty = Number(item.qty !== undefined ? item.qty : item.stock) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    item.qty = qty;
    item.stock = qty;
    item.unitPrice = unitPrice;
    item.price = Number(item.price) || (qty * unitPrice);
    item.totalValue = item.price;
    item.condition = item.condition || 'Baik';

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.unshift(item);
    }
    this.saveBHPList(list);
    return item;
  }

  deleteBHP(id) {
    let list = this.getBHP();
    list = list.filter(i => i.id !== id);
    this.saveBHPList(list);
  }

  // BHP Transactions (Mutasi Stok Masuk / Keluar / Distribusi)
  getBHPTransactions() {
    return this.get(STORAGE_KEYS.BHP_TRANSACTIONS) || DEFAULT_BHP_TRANSACTIONS;
  }

  saveBHPTransactions(txs) {
    this.save(STORAGE_KEYS.BHP_TRANSACTIONS, txs);
  }

  addBHPTransaction(tx) {
    const txs = this.getBHPTransactions();
    txs.unshift(tx);
    this.saveBHPTransactions(txs);

    // Otomatis sinkronisasi stok item BHP
    const bhpList = this.getBHP();
    const targetBhp = bhpList.find(b => b.id === tx.bhpId || b.code === tx.bhpCode);
    if (targetBhp) {
      const qtyChange = Number(tx.qty) || 0;
      let curQty = Number(targetBhp.qty !== undefined ? targetBhp.qty : targetBhp.stock) || 0;
      if (tx.type === 'masuk') {
        curQty += qtyChange;
      } else if (tx.type === 'keluar') {
        curQty = Math.max(0, curQty - qtyChange);
      }
      targetBhp.qty = curQty;
      targetBhp.stock = curQty;
      targetBhp.price = curQty * (Number(targetBhp.unitPrice) || 0);
      targetBhp.totalValue = targetBhp.price;
      this.saveBHPList(bhpList);
    }
    return tx;
  }

  deleteBHPTransaction(txId) {
    let txs = this.getBHPTransactions();
    const targetTx = txs.find(t => t.id === txId);
    if (targetTx) {
      // Revert stock change
      const bhpList = this.getBHP();
      const targetBhp = bhpList.find(b => b.id === targetTx.bhpId || b.code === targetTx.bhpCode);
      if (targetBhp) {
        const qty = Number(targetTx.qty) || 0;
        let curQty = Number(targetBhp.qty !== undefined ? targetBhp.qty : targetBhp.stock) || 0;
        if (targetTx.type === 'masuk') {
          curQty = Math.max(0, curQty - qty);
        } else if (targetTx.type === 'keluar') {
          curQty += qty;
        }
        targetBhp.qty = curQty;
        targetBhp.stock = curQty;
        targetBhp.price = curQty * (Number(targetBhp.unitPrice) || 0);
        targetBhp.totalValue = targetBhp.price;
        this.saveBHPList(bhpList);
      }
      txs = txs.filter(t => t.id !== txId);
      this.saveBHPTransactions(txs);
    }
  }

  // Master Kategori BHP
  getBHPCategories() {
    return this.get(STORAGE_KEYS.BHP_CATEGORIES) || DEFAULT_BHP_CATEGORIES;
  }

  saveBHPCategories(cats) {
    this.save(STORAGE_KEYS.BHP_CATEGORIES, cats);
  }

  // Statistics calculation for BHP / Non-Inventaris
  getBHPStats() {
    const items = this.getBHP();
    const transactions = this.getBHPTransactions();

    let totalItems = items.length;
    let totalQty = 0;
    let totalNominalValue = 0;
    let goodCount = 0;
    let damagedCount = 0;

    items.forEach(item => {
      const qty = Number(item.qty !== undefined ? item.qty : item.stock) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const itemPrice = Number(item.price) || (qty * unitPrice);
      
      totalQty += qty;
      totalNominalValue += itemPrice;

      const cond = (item.condition || 'Baik').trim();
      if (cond === 'Baik' || cond === 'B') {
        goodCount++;
      } else {
        damagedCount++;
      }
    });

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let thisMonthExpenses = 0;
    let thisMonthUsageCount = 0;

    transactions.forEach(t => {
      if (t.type === 'keluar' && t.date && t.date.startsWith(currentYearMonth)) {
        thisMonthExpenses += Number(t.totalPrice) || 0;
        thisMonthUsageCount += Number(t.qty) || 0;
      }
    });

    return {
      totalItems,
      totalStockQty: totalQty,
      totalQty,
      totalNominalValue,
      goodCount,
      damagedCount,
      thisMonthExpenses,
      thisMonthUsageCount
    };
  }

  // ─── MUTATIONS CRUD ──────────────────────────────────────────
  getMutations() {
    return this.get(STORAGE_KEYS.MUTATIONS) || [];
  }

  getMutationById(id) {
    const list = this.getMutations();
    return list.find(m => m.id === id);
  }

  saveMutations(mutations) {
    this.save(STORAGE_KEYS.MUTATIONS, mutations);
  }

  addMutation(mutData) {
    const list = this.getMutations();
    const newMut = {
      id: mutData.id || `MUT-${Date.now()}`,
      docNo: mutData.docNo || `BA-MUT/MKMM/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(list.length + 1).padStart(3, '0')}`,
      date: mutData.date || new Date().toISOString().split('T')[0],
      assetId: mutData.assetId,
      assetCode: mutData.assetCode,
      assetName: mutData.assetName,
      categoryName: mutData.categoryName || '-',
      brandType: mutData.brandType || '-',
      qty: parseInt(mutData.qty) || 1,
      unit: mutData.unit || 'Unit',

      // Asal
      fromBranchId: mutData.fromBranchId || '',
      fromBranchName: mutData.fromBranchName || 'Pusat',
      fromDivisionId: mutData.fromDivisionId || '',
      fromDivisionName: mutData.fromDivisionName || 'Umum',
      fromRoomId: mutData.fromRoomId || '',
      fromRoomName: mutData.fromRoomName || '-',
      fromPj: mutData.fromPj || '-',
      fromPjNip: mutData.fromPjNip || '',

      // Tujuan
      toBranchId: mutData.toBranchId || '',
      toBranchName: mutData.toBranchName || 'Pusat',
      toDivisionId: mutData.toDivisionId || '',
      toDivisionName: mutData.toDivisionName || 'Umum',
      toRoomId: mutData.toRoomId || '',
      toRoomName: mutData.toRoomName || '-',
      toPj: mutData.toPj || '-',
      toPjNip: mutData.toPjNip || '',

      reason: mutData.reason || 'Perpindahan penempatan barang inventaris operasional',
      condition: mutData.condition || 'Baik',
      notes: mutData.notes || '',
      operator: mutData.operator || 'Administrator',
      status: 'Selesai',
      createdAt: new Date().toISOString()
    };

    list.unshift(newMut);
    this.save(STORAGE_KEYS.MUTATIONS, list);

    // Update target asset's current location & pj in master assets
    if (newMut.assetId) {
      const assets = this.getAssets();
      const asset = assets.find(a => a.id === newMut.assetId || a.code === newMut.assetCode);
      if (asset) {
        if (newMut.toBranchId) asset.branchId = newMut.toBranchId;
        if (newMut.toBranchName) asset.branchName = newMut.toBranchName;
        if (newMut.toDivisionId) asset.divisionId = newMut.toDivisionId;
        if (newMut.toDivisionName) asset.divisionName = newMut.toDivisionName;
        if (newMut.toRoomId) asset.roomId = newMut.toRoomId;
        if (newMut.toRoomName) asset.roomName = newMut.toRoomName;
        if (newMut.toPj && newMut.toPj !== '-') {
          asset.pic = newMut.toPj;
          asset.pj = newMut.toPj;
        }
        if (newMut.condition) {
          asset.condition = newMut.condition;
        }
        this.save(STORAGE_KEYS.ASSETS, assets);
      }
    }

    return newMut;
  }

  deleteMutation(id) {
    let list = this.getMutations();
    list = list.filter(m => m.id !== id);
    this.save(STORAGE_KEYS.MUTATIONS, list);
    return true;
  }

  // ─── Export & Import ────────────────────────────────────────────
  exportDatabaseJSON() {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.5',
      settings: this.getSettings(),
      rooms: this.getRooms(),
      categories: this.getCategories(),
      assets: this.getAssets(),
      disposals: this.getDisposals(),
      disposalRequests: this.getDisposalRequests(),
      lendings: this.getLendings(),
      revaluations: this.getRevaluations(),
      bast: this.getBASTList(),
      divisions: this.getDivisions(),
      branches: this.getBranches(),
      bhp: this.getBHP(),
      bhpTransactions: this.getBHPTransactions(),
      bhpCategories: this.getBHPCategories(),
      damageReports: this.getDamageReports(),
      mutations: this.getMutations()
    };
    return JSON.stringify(backup, null, 2);
  }

  importDatabaseJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.assets) this.save(STORAGE_KEYS.ASSETS, data.assets);
      if (data.rooms) this.save(STORAGE_KEYS.ROOMS, data.rooms);
      if (data.categories) this.save(STORAGE_KEYS.CATEGORIES, data.categories);
      if (data.disposals) this.save(STORAGE_KEYS.DISPOSALS, data.disposals);
      if (data.disposalRequests) this.save(STORAGE_KEYS.DISPOSAL_REQUESTS, data.disposalRequests);
      if (data.lendings) this.save(STORAGE_KEYS.LENDINGS, data.lendings);
      if (data.settings) this.save(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.revaluations) this.save(STORAGE_KEYS.REVALUATIONS, data.revaluations);
      if (data.bast) this.save(STORAGE_KEYS.BAST, data.bast);
      if (data.divisions) this.save(STORAGE_KEYS.DIVISIONS, data.divisions);
      if (data.branches) this.save(STORAGE_KEYS.BRANCHES, data.branches);
      if (data.bhp) this.save(STORAGE_KEYS.BHP, data.bhp);
      if (data.bhpTransactions) this.save(STORAGE_KEYS.BHP_TRANSACTIONS, data.bhpTransactions);
      if (data.bhpCategories) this.save(STORAGE_KEYS.BHP_CATEGORIES, data.bhpCategories);
      if (data.damageReports) this.save(STORAGE_KEYS.DAMAGE_REPORTS, data.damageReports);
      if (data.mutations) this.save(STORAGE_KEYS.MUTATIONS, data.mutations);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  resetToDefault() {
    localStorage.clear();
    this.init();
  }
}

// Global DB instance
window.db = new AssetDatabase();
var db = window.db;
