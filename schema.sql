-- ========================================================
-- SKRIP DATABASE SUPABASE POSTGRESQL - ASETPRO MUNZALAN
-- Cara Pakai: Buka dashboard Supabase -> SQL Editor -> New Query -> Paste skrip ini -> Klik RUN
-- ========================================================

-- 1. TABEL DIVISI & UNIT
CREATE TABLE IF NOT EXISTS divisions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  parent TEXT DEFAULT 'Masjid Munzalan Mubarakan',
  logo TEXT DEFAULT 'logo-munzalan.png',
  pj TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL CABANG & WILAYAH
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  is_pusat BOOLEAN DEFAULT FALSE,
  pj TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL KATEGORI BARANG
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  lifespan NUMERIC DEFAULT 5,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL RUANGAN & LOKASI
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  floor TEXT,
  pj TEXT,
  pj_nip TEXT,
  division_id TEXT REFERENCES divisions(id) ON DELETE SET NULL,
  division_name TEXT,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL UTAMA BUKU INDUK BARANG / ASET INVENTARIS
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  no_induk TEXT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  brand_type TEXT,
  size TEXT DEFAULT '-',
  material TEXT DEFAULT '-',
  production_year INT,
  source TEXT DEFAULT 'Pembelian',
  documents TEXT DEFAULT 'Lengkap',
  qty INT DEFAULT 1,
  unit TEXT DEFAULT 'Unit',
  condition TEXT DEFAULT 'B',
  unit_price NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Aktif',
  lifespan NUMERIC DEFAULT 5,
  pic TEXT,
  used_by TEXT,
  notes TEXT,
  
  -- Relasi Kategori, Ruangan, Divisi, Cabang
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT,
  category_code TEXT,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  room_name TEXT,
  room_code TEXT,
  division_id TEXT REFERENCES divisions(id) ON DELETE SET NULL,
  division_name TEXT,
  division_code TEXT,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  branch_name TEXT,

  -- Kolom Spesifik Elektronik & Kendaraan
  serial_number TEXT,
  imei TEXT,
  tech_specs TEXT,
  nopol TEXT,
  no_rangka TEXT,
  no_mesin TEXT,
  no_bpkb TEXT,

  -- Foto & BAST
  image TEXT,
  image_front TEXT,
  bast_id TEXT,
  is_under_disposal_request BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL BERITA ACARA SERAH TERIMA (BAST)
CREATE TABLE IF NOT EXISTS bast (
  id TEXT PRIMARY KEY,
  doc_no TEXT UNIQUE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  recipient_name TEXT NOT NULL,
  stambuk TEXT,
  amanah TEXT,
  institution TEXT,
  phone TEXT,
  is_pusat BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Aktif',
  asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
  asset_code TEXT,
  asset_name TEXT,
  officer_name TEXT,
  witness_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL MUTASI & PEMINDAHAN BARANG
CREATE TABLE IF NOT EXISTS mutations (
  id TEXT PRIMARY KEY,
  doc_no TEXT UNIQUE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  qty INT DEFAULT 1,
  
  from_room_id TEXT,
  from_room_name TEXT,
  to_room_id TEXT,
  to_room_name TEXT,

  from_division_id TEXT,
  from_division_name TEXT,
  to_division_id TEXT,
  to_division_name TEXT,

  from_branch_id TEXT,
  from_branch_name TEXT,
  to_branch_id TEXT,
  to_branch_name TEXT,

  reason TEXT,
  officer_name TEXT,
  recipient_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL BERITA ACARA KERUSAKAN
CREATE TABLE IF NOT EXISTS damage_reports (
  id TEXT PRIMARY KEY,
  doc_no TEXT UNIQUE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  category_name TEXT,
  room_name TEXT,
  damage_type TEXT,
  severity TEXT DEFAULT 'Rusak Berat',
  chronology TEXT,
  recommendation TEXT,
  inspector_name TEXT,
  status TEXT DEFAULT 'BA Kerusakan Terbit',
  repaired_at DATE,
  repair_notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL USULAN PENGHAPUSAN (DISPOSAL REQUESTS) & LOG PENGHAPUSAN
CREATE TABLE IF NOT EXISTS disposal_requests (
  id TEXT PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  category_name TEXT,
  room_name TEXT,
  price NUMERIC DEFAULT 0,
  book_value NUMERIC DEFAULT 0,
  reason TEXT,
  proposed_by TEXT,
  status TEXT DEFAULT 'Menunggu Persetujuan',
  approval_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disposals (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  asset_id TEXT,
  asset_code TEXT,
  asset_name TEXT,
  category_name TEXT,
  room_name TEXT,
  price NUMERIC DEFAULT 0,
  book_value NUMERIC DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  doc_no TEXT,
  notes TEXT,
  proposed_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL BARANG HABIS PAKAI (BHP) & TRANSAKSI STOK
CREATE TABLE IF NOT EXISTS bhp (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT,
  category_name TEXT,
  division_id TEXT REFERENCES divisions(id) ON DELETE SET NULL,
  division_name TEXT,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 5,
  unit TEXT DEFAULT 'Pcs',
  unit_price NUMERIC DEFAULT 0,
  room_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bhp_transactions (
  id TEXT PRIMARY KEY,
  bhp_id TEXT REFERENCES bhp(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'IN' atau 'OUT'
  qty INT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  recipient_name TEXT,
  division_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABEL PENGATURAN INSTANSI & KOP
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Berikan Akses Anon
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bast ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bhp ENABLE ROW LEVEL SECURITY;
ALTER TABLE bhp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy Akses Publik untuk Anon Key (Read & Write)
DO $$
BEGIN
  CREATE POLICY "Allow anon all on divisions" ON divisions FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on branches" ON branches FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on categories" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on rooms" ON rooms FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on assets" ON assets FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on bast" ON bast FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on mutations" ON mutations FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on damage_reports" ON damage_reports FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on disposal_requests" ON disposal_requests FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on disposals" ON disposals FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on bhp" ON bhp FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on bhp_transactions" ON bhp_transactions FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on app_settings" ON app_settings FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
