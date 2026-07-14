// js/seedSampleData.js
// Seeding sample data ke Supabase — v2 (diperbaiki)
//
// Perubahan dari versi lama:
// - Setiap langkah insert/upsert sekarang DICEK errornya (dulu banyak yang
//   diabaikan diam-diam kalau gagal -> data "hilang" tanpa pesan jelas).
// - Total invoice / total_harga & jumlah keluar / sisa_stok dihitung
//   otomatis dari item yang benar-benar disimpan, bukan angka hardcode
//   yang bisa meleset dari isi aslinya.
// - Data sample jauh lebih lengkap: 6 invoice barang masuk (macam-macam
//   kategori & bulan berbeda) + 5 transaksi stock out, supaya dashboard,
//   laporan, dan grafik tren tidak kosong/datar.
// - Idempotent: aman dijalankan berulang kali (invoice_items di-reset dulu
//   ke stok penuh sebelum stock_out mengurangi stoknya lagi), jadi tidak
//   dobel-kurang tiap kali tombol "Seed" diklik ulang.
// - Menambah 3 akun demo (kepala_toko, kasir, gudang) supaya semua role
//   bisa dicoba login, selain 3 akun builtin (owner/admin/invenz).

"use strict";

// Hash sederhana (sama seperti di auth.js & login.html)
function _hashPw(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  }
  return "h_" + Math.abs(h).toString(36);
}

function _daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ── Helper upsert dengan pengecekan error + log yang jelas ──
async function _upsert(table, rows, opts, label) {
  const { error } = await sb.from(table).upsert(rows, opts);
  if (error) {
    console.error(`[seed] Gagal upsert "${label || table}":`, error.message, rows);
    throw new Error(`Gagal menyimpan ${label || table}: ${error.message}`);
  }
}

async function seedSupabaseData() {
  console.log("=== [seed] Memulai seeding data ke Supabase ===");

  // ============================================================
  // 0. USERS — builtin + demo untuk tiap role
  // ============================================================
  console.log("[seed] (1/9) Users...");
  const defaultUsers = [
    { username: "owner", nama: "Owner INVENZ", role: "owner", password: "owner123", is_builtin: true },
    { username: "admin", nama: "Administrator", role: "admin", password: "admin123", is_builtin: true },
    { username: "invenz", nama: "Invenz Demo", role: "admin", password: "invenz123", is_builtin: true },
    { username: "kepala", nama: "Kepala Toko Demo", role: "kepala_toko", password: "kepala123", is_builtin: false },
    { username: "kasir", nama: "Kasir Demo", role: "kasir", password: "kasir123", is_builtin: false },
    { username: "gudang", nama: "Staf Gudang Demo", role: "gudang", password: "gudang123", is_builtin: false },
  ];
  for (const u of defaultUsers) {
    await _upsert(
      "app_users",
      {
        username: u.username,
        nama: u.nama,
        role: u.role,
        password_hash: _hashPw(u.password),
        aktif: true,
        is_builtin: u.is_builtin,
      },
      { onConflict: "username" },
      "app_users"
    );
  }

  // ============================================================
  // 1. KATEGORI
  // ============================================================
  console.log("[seed] (2/9) Kategori...");
  const kategoriList = [
    "Susu", "Parfum", "Mie Instan", "Elektronik", "Pakaian",
    "Makanan", "Minuman", "Peralatan", "Kosmetik", "Aksesoris",
  ];
  for (const nama of kategoriList) {
    await _upsert("kategori", { nama }, { onConflict: "nama" }, "kategori");
  }

  // ============================================================
  // 2. MERK
  // ============================================================
  console.log("[seed] (3/9) Merk...");
  const merkList = [
    "Indomilk", "Frisian Flag", "Ultra Milk", "Casablanca", "Vitalis",
    "Kahf", "HMNS", "Samsung", "Unilever", "Indofood", "Nike", "Philips",
    "Garnier", "Sedaap", "Le Minerale", "Adidas",
  ];
  for (const nama of merkList) {
    await _upsert("merk", { nama }, { onConflict: "nama" }, "merk");
  }

  // ============================================================
  // 3. LOKASI
  // ============================================================
  console.log("[seed] (4/9) Lokasi...");
  const lokasiList = ["Gudang A", "Gudang B", "Rak Utama", "Rak Display"];
  for (const nama of lokasiList) {
    await _upsert("lokasi", { nama }, { onConflict: "nama" }, "lokasi");
  }

  // ============================================================
  // 4. SUPPLIER
  // ============================================================
  console.log("[seed] (5/9) Supplier...");
  const supplierList = [
    { nama: "PT Maju Jaya", kontak: "0812-3456-7890", alamat: "Jakarta", keterangan: "Supplier Utama" },
    { nama: "CV Sentosa", kontak: "0812-9876-5432", alamat: "Bandung", keterangan: "Supplier Cabang" },
    { nama: "UD Sumber Rejeki", kontak: "0813-1111-2222", alamat: "Surabaya", keterangan: "Supplier Elektronik" },
    { nama: "PT Cahaya Abadi", kontak: "0857-4444-5555", alamat: "Semarang", keterangan: "Supplier Kosmetik & Parfum" },
  ];
  for (const s of supplierList) {
    await _upsert("supplier", s, { onConflict: "nama" }, "supplier");
  }

  // ============================================================
  // 5. PENERIMA / CUSTOMER
  // ============================================================
  console.log("[seed] (6/9) Customer...");
  const penerimaList = [
    { nama: "Toko Utama", telepon: "0811-2233-4455", keterangan: "Staf Toko" },
    { nama: "Pelanggan Umum", telepon: "-", keterangan: "Retail" },
    { nama: "Budi Santoso", telepon: "0821-5566-7788", keterangan: "Pelanggan tetap" },
    { nama: "Rina Wijaya", telepon: "0857-9988-1122", keterangan: "Pelanggan tetap" },
  ];
  for (const p of penerimaList) {
    await _upsert("penerima", p, { onConflict: "nama" }, "penerima");
  }

  // ============================================================
  // 6. PAYMENT METHODS
  // ============================================================
  console.log("[seed] (7/9) Payment Methods...");
  await _upsert(
    "payment_methods",
    { id: "pay_default_cash", nama: "Cash", keterangan: "Pembayaran tunai", aktif: true, is_default: true },
    { onConflict: "id" },
    "payment_methods (cash)"
  );
  await _upsert(
    "payment_methods",
    { id: "pay_default_qris", nama: "QRIS", keterangan: "Scan QR Code", aktif: true, is_default: true },
    { onConflict: "id" },
    "payment_methods (qris)"
  );
  await _upsert(
    "payment_methods",
    { id: "pay_transfer", nama: "Transfer Bank", keterangan: "BCA / Mandiri", aktif: true, is_default: false },
    { onConflict: "id" },
    "payment_methods (transfer)"
  );

  // ============================================================
  // 7. BARANG (katalog SKU)
  // ============================================================
  console.log("[seed] (8/9) Barang...");
  const barangList = [
    { sku: "SKU-SUSU-001", nama: "Indomilk Cokelat 190ml", merk: "Indomilk", kategori: "Susu" },
    { sku: "SKU-SUSU-002", nama: "Ultra Milk Full Cream 1L", merk: "Ultra Milk", kategori: "Susu" },
    { sku: "SKU-MIE-001", nama: "Indomie Goreng Aceh 90g", merk: "Indofood", kategori: "Mie Instan" },
    { sku: "SKU-MIE-002", nama: "Mie Sedaap Soto 75g", merk: "Sedaap", kategori: "Mie Instan" },
    { sku: "SKU-PARFUM-001", nama: "Kahf Revered Oud 100ml", merk: "Kahf", kategori: "Parfum" },
    { sku: "SKU-PARFUM-002", nama: "Casablanca Parfum 100ml", merk: "Casablanca", kategori: "Parfum" },
    { sku: "SKU-ELEC-001", nama: "Samsung Monitor 24 inch", merk: "Samsung", kategori: "Elektronik" },
    { sku: "SKU-ELEC-002", nama: "Philips Setrika Uap", merk: "Philips", kategori: "Elektronik" },
    { sku: "SKU-KOS-001", nama: "Garnier Serum Vitamin C", merk: "Garnier", kategori: "Kosmetik" },
    { sku: "SKU-PAK-001", nama: "Kaos Polo Nike XL", merk: "Nike", kategori: "Pakaian" },
    { sku: "SKU-PAK-002", nama: "Kaos Kaki Adidas", merk: "Adidas", kategori: "Aksesoris" },
    { sku: "SKU-MIN-001", nama: "Le Minerale 600ml", merk: "Le Minerale", kategori: "Minuman" },
  ];
  for (const b of barangList) {
    await _upsert("barang", b, { onConflict: "sku" }, "barang");
  }

  // ============================================================
  // 8. INVOICES (barang masuk) — tersebar beberapa bulan terakhir
  // ============================================================
  console.log("[seed] (9/9) Invoice masuk & Stock Out...");

  const invoicesPlan = [
    {
      no: "INV-2026-001", hari: 60, supplier: "PT Maju Jaya",
      items: [
        { sku: "SKU-SUSU-001", nama: "Indomilk Cokelat 190ml", merk: "Indomilk", kategori: "Susu", lokasi: "Gudang A", expired: _daysAgo(-300), hpp: 5000, jual: 7000, stok: 60 },
        { sku: "SKU-SUSU-002", nama: "Ultra Milk Full Cream 1L", merk: "Ultra Milk", kategori: "Susu", lokasi: "Gudang A", expired: _daysAgo(-45), hpp: 15000, jual: 18000, stok: 50 },
      ],
    },
    {
      no: "INV-2026-002", hari: 50, supplier: "CV Sentosa",
      items: [
        { sku: "SKU-MIE-001", nama: "Indomie Goreng Aceh 90g", merk: "Indofood", kategori: "Mie Instan", lokasi: "Rak Utama", expired: _daysAgo(-220), hpp: 2500, jual: 3500, stok: 100 },
        { sku: "SKU-MIE-002", nama: "Mie Sedaap Soto 75g", merk: "Sedaap", kategori: "Mie Instan", lokasi: "Rak Utama", expired: _daysAgo(-15), hpp: 2300, jual: 3200, stok: 80 },
      ],
    },
    {
      no: "INV-2026-003", hari: 35, supplier: "PT Cahaya Abadi",
      items: [
        { sku: "SKU-PARFUM-001", nama: "Kahf Revered Oud 100ml", merk: "Kahf", kategori: "Parfum", lokasi: "Rak Display", expired: _daysAgo(-900), hpp: 55000, jual: 75000, stok: 30 },
        { sku: "SKU-PARFUM-002", nama: "Casablanca Parfum 100ml", merk: "Casablanca", kategori: "Parfum", lokasi: "Rak Display", expired: _daysAgo(-900), hpp: 40000, jual: 58000, stok: 25 },
        { sku: "SKU-KOS-001", nama: "Garnier Serum Vitamin C", merk: "Garnier", kategori: "Kosmetik", lokasi: "Rak Display", expired: _daysAgo(-500), hpp: 22000, jual: 32000, stok: 40 },
      ],
    },
    {
      no: "INV-2026-004", hari: 20, supplier: "UD Sumber Rejeki",
      items: [
        { sku: "SKU-ELEC-001", nama: "Samsung Monitor 24 inch", merk: "Samsung", kategori: "Elektronik", lokasi: "Gudang B", expired: null, hpp: 1200000, jual: 1500000, stok: 10 },
        { sku: "SKU-ELEC-002", nama: "Philips Setrika Uap", merk: "Philips", kategori: "Elektronik", lokasi: "Gudang B", expired: null, hpp: 180000, jual: 250000, stok: 15 },
      ],
    },
    {
      no: "INV-2026-005", hari: 10, supplier: "PT Maju Jaya",
      items: [
        { sku: "SKU-PAK-001", nama: "Kaos Polo Nike XL", merk: "Nike", kategori: "Pakaian", lokasi: "Rak Display", expired: null, hpp: 85000, jual: 130000, stok: 20 },
        { sku: "SKU-PAK-002", nama: "Kaos Kaki Adidas", merk: "Adidas", kategori: "Aksesoris", lokasi: "Rak Display", expired: null, hpp: 15000, jual: 25000, stok: 40 },
      ],
    },
    {
      no: "INV-2026-006", hari: 3, supplier: "CV Sentosa",
      items: [
        { sku: "SKU-MIN-001", nama: "Le Minerale 600ml", merk: "Le Minerale", kategori: "Minuman", lokasi: "Rak Utama", expired: _daysAgo(-180), hpp: 2000, jual: 3000, stok: 120 },
        { sku: "SKU-SUSU-001", nama: "Indomilk Cokelat 190ml", merk: "Indomilk", kategori: "Susu", lokasi: "Gudang A", expired: _daysAgo(-330), hpp: 5000, jual: 7000, stok: 40 },
      ],
    },
  ];

  const invoiceIdMap = {}; // invoice_no -> id (dipakai saat seeding stock out)

  for (const inv of invoicesPlan) {
    const total = inv.items.reduce((s, i) => s + i.stok, 0);
    const totalHarga = inv.items.reduce((s, i) => s + i.hpp * i.stok, 0);

    const { data: dbInv, error: invErr } = await sb
      .from("invoices")
      .upsert(
        { invoice_no: inv.no, tanggal: _daysAgo(inv.hari), supplier: inv.supplier, total, total_harga: totalHarga },
        { onConflict: "invoice_no" }
      )
      .select("id")
      .single();

    if (invErr || !dbInv) {
      console.error(`[seed] Gagal seed invoice ${inv.no}:`, invErr && invErr.message);
      throw new Error(`Gagal menyimpan invoice ${inv.no}: ${invErr ? invErr.message : "unknown error"}`);
    }
    invoiceIdMap[inv.no] = dbInv.id;

    // Reset item invoice ini ke kondisi awal (stok penuh) supaya seeding aman diulang
    const { error: delErr } = await sb.from("invoice_items").delete().eq("invoice_id", dbInv.id);
    if (delErr) console.error(`[seed] Gagal reset item invoice ${inv.no}:`, delErr.message);

    const { error: itemErr } = await sb.from("invoice_items").insert(
      inv.items.map((i) => ({
        invoice_id: dbInv.id,
        sku: i.sku,
        nama: i.nama,
        merk: i.merk,
        kategori: i.kategori,
        lokasi: i.lokasi,
        expired: i.expired,
        harga_hpp: i.hpp,
        harga_jual: i.jual,
        stok: i.stok,
      }))
    );
    if (itemErr) {
      console.error(`[seed] Gagal seed item invoice ${inv.no}:`, itemErr.message);
      throw new Error(`Gagal menyimpan item invoice ${inv.no}: ${itemErr.message}`);
    }
  }

  // ============================================================
  // 9. STOCK OUT (barang keluar) — mengurangi stok invoice terkait
  // ============================================================
  const stockOutsPlan = [
    {
      no: "INV-OUT-001", hari: 40, penerima: "Pelanggan Umum", telepon: "-",
      payment_id: "pay_default_cash", payment_nama: "Cash",
      items: [
        { invoice_asal: "INV-2026-001", sku: "SKU-SUSU-001", qty: 10 },
        { invoice_asal: "INV-2026-002", sku: "SKU-MIE-002", qty: 20 },
      ],
    },
    {
      no: "INV-OUT-002", hari: 25, penerima: "Budi Santoso", telepon: "0821-5566-7788",
      payment_id: "pay_default_qris", payment_nama: "QRIS",
      items: [
        { invoice_asal: "INV-2026-003", sku: "SKU-PARFUM-001", qty: 5 },
        { invoice_asal: "INV-2026-003", sku: "SKU-KOS-001", qty: 8 },
      ],
    },
    {
      no: "INV-OUT-003", hari: 15, penerima: "Toko Utama", telepon: "0811-2233-4455",
      payment_id: "pay_transfer", payment_nama: "Transfer Bank",
      items: [
        { invoice_asal: "INV-2026-004", sku: "SKU-ELEC-001", qty: 2 },
        { invoice_asal: "INV-2026-004", sku: "SKU-ELEC-002", qty: 4 },
      ],
    },
    {
      no: "INV-OUT-004", hari: 6, penerima: "Rina Wijaya", telepon: "0857-9988-1122",
      payment_id: "pay_default_cash", payment_nama: "Cash",
      items: [
        { invoice_asal: "INV-2026-005", sku: "SKU-PAK-001", qty: 6 },
        { invoice_asal: "INV-2026-006", sku: "SKU-MIN-001", qty: 30 },
      ],
    },
    {
      no: "INV-OUT-005", hari: 1, penerima: "Pelanggan Umum", telepon: "-",
      payment_id: "pay_default_qris", payment_nama: "QRIS",
      items: [
        { invoice_asal: "INV-2026-002", sku: "SKU-MIE-001", qty: 15 },
        { invoice_asal: "INV-2026-006", sku: "SKU-SUSU-001", qty: 5 },
      ],
    },
  ];

  for (const so of stockOutsPlan) {
    const { data: dbSO, error: soErr } = await sb
      .from("stock_outs")
      .upsert(
        {
          invoice_no: so.no,
          tanggal: _daysAgo(so.hari),
          penerima: so.penerima,
          telepon: so.telepon,
          payment_id: so.payment_id,
          payment_nama: so.payment_nama,
        },
        { onConflict: "invoice_no" }
      )
      .select("id")
      .single();

    if (soErr || !dbSO) {
      console.error(`[seed] Gagal seed stock out ${so.no}:`, soErr && soErr.message);
      throw new Error(`Gagal menyimpan stock out ${so.no}: ${soErr ? soErr.message : "unknown error"}`);
    }

    const { error: delErr } = await sb.from("stock_out_items").delete().eq("stock_out_id", dbSO.id);
    if (delErr) console.error(`[seed] Gagal reset item stock out ${so.no}:`, delErr.message);

    const soItemRows = [];
    for (const item of so.items) {
      const invId = invoiceIdMap[item.invoice_asal];
      if (!invId) {
        console.warn(`[seed] Lewati item stock out: invoice asal ${item.invoice_asal} tidak ditemukan`);
        continue;
      }

      const { data: invItem, error: findErr } = await sb
        .from("invoice_items")
        .select("id, nama, kategori, merk, lokasi, harga_hpp, harga_jual, stok")
        .eq("invoice_id", invId)
        .eq("sku", item.sku)
        .maybeSingle();

      if (findErr || !invItem) {
        console.warn(`[seed] Item SKU ${item.sku} pada invoice ${item.invoice_asal} tidak ditemukan, dilewati.`);
        continue;
      }

      const qty = Math.min(item.qty, invItem.stok);
      if (qty <= 0) continue;
      const sisa = invItem.stok - qty;

      soItemRows.push({
        stock_out_id: dbSO.id,
        invoice_asal: item.invoice_asal,
        sku: item.sku,
        nama: invItem.nama,
        kategori: invItem.kategori,
        merk: invItem.merk,
        lokasi: invItem.lokasi,
        harga_hpp: invItem.harga_hpp,
        harga_jual: invItem.harga_jual,
        jumlah_keluar: qty,
        sisa_stok: sisa,
      });

      const { error: updErr } = await sb.from("invoice_items").update({ stok: sisa }).eq("id", invItem.id);
      if (updErr) console.error(`[seed] Gagal update stok invoice_items untuk SKU ${item.sku}:`, updErr.message);
    }

    if (soItemRows.length) {
      const { error: soItemErr } = await sb.from("stock_out_items").insert(soItemRows);
      if (soItemErr) {
        console.error(`[seed] Gagal seed item stock out ${so.no}:`, soItemErr.message);
        throw new Error(`Gagal menyimpan item stock out ${so.no}: ${soItemErr.message}`);
      }
    } else {
      console.warn(`[seed] Tidak ada item valid untuk stock out ${so.no}, dilewati.`);
    }
  }

  console.log("=== [seed] Seeding data berhasil diselesaikan! ===");
}

async function clearSupabaseData() {
  console.log("=== [seed] Membersihkan data Supabase ===");
  const steps = [
    ["retur_items", "id"],
    ["stock_out_items", "id"],
    ["stock_outs", "id"],
    ["invoice_items", "id"],
    ["invoices", "id"],
    ["barang", "id"],
    ["penerima", "id"],
    ["supplier", "id"],
    ["lokasi", "id"],
    ["merk", "id"],
    ["kategori", "id"],
    ["payment_methods", "id"],
  ];

  for (const [table] of steps) {
    const { error } = await sb.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error && table !== "payment_methods") {
      // payment_methods pakai id non-uuid ("pay_..."), jadi coba fallback hapus semua
      console.warn(`[seed] Peringatan saat hapus ${table}:`, error.message);
    }
  }
  // payment_methods pakai id string custom, hapus terpisah dengan aman
  const { error: payErr } = await sb.from("payment_methods").delete().neq("id", "___none___");
  if (payErr) console.warn("[seed] Peringatan saat hapus payment_methods:", payErr.message);

  // Hapus hanya user non-builtin agar akun utama tetap ada
  const { error: userErr } = await sb.from("app_users").delete().eq("is_builtin", false);
  if (userErr) console.warn("[seed] Peringatan saat hapus app_users non-builtin:", userErr.message);

  console.log("=== [seed] Data Supabase berhasil dibersihkan ===");
}