/* ============================================================
   INVENZ — SEED SAMPLE DATA (untuk presentasi/demo)
   Taruh di: js/seedSampleData.js

   Isi 3 kategori: Susu, Parfum, Mie Instan — pakai brand &
   perusahaan Indonesia asli. Otomatis mengisi:
     - linkedData (kategori, merk, supplier, barang, lokasi, penerima)
     - invoices (barang masuk)
     - stockOuts_v2 (contoh transaksi keluar)
     - invenz_payment_methods (default: Cash & QRIS)

   CARA PAKAI (paling gampang):
   1. Taruh file ini di folder js/
   2. Buka salah satu halaman INVENZ (misal dashboard.html) di browser
   3. Buka Console (F12 / klik kanan → Inspect → tab Console)
   4. Ketik/paste:
        var s = document.createElement('script');
        s.src = 'js/seedSampleData.js';
        document.head.appendChild(s);
   5. Tunggu muncul log "✅ Sample data berhasil dimuat!" di console
   6. Refresh halaman (F5) — data langsung muncul di semua modul

   ATAU lebih gampang lagi: pakai file seed.html yang disediakan
   terpisah, tinggal klik 1 tombol.

   ⚠️ Ini akan MENIMPA data invoices, linkedData, dan stockOuts_v2
   yang sudah ada di browser saat ini. Kalau ada data penting,
   backup dulu manual (Export dari halaman terkait kalau ada, atau
   copy dari localStorage) sebelum menjalankan ini.
   ============================================================ */

(function seedInvenzSampleData() {
  // ============================================================
  // 1. LINKED DATA — master kategori, merk, supplier, lokasi
  // ============================================================
  const linkedData = {
    kategori: [{ nama: "Susu" }, { nama: "Parfum" }, { nama: "Mie Instan" }],
    merk: [
      { nama: "Indomilk" },
      { nama: "Frisian Flag" },
      { nama: "Ultra Milk" },
      { nama: "Casablanca" },
      { nama: "Vitalis" },
      { nama: "Kahf" },
      { nama: "HMNS" },
      { nama: "Indomie" },
      { nama: "Sarimi" },
      { nama: "Supermi" },
      { nama: "Mie Sedaap" },
    ],
    supplier: [
      {
        nama: "PT Indolakto",
        kontak: "021-8990111",
        alamat: "Jl. Raya Bekasi KM 28, Bekasi",
        keterangan: "Distributor produk susu Indomilk",
      },
      {
        nama: "PT Frisian Flag Indonesia",
        kontak: "021-3841919",
        alamat: "Jl. Raya Bogor KM 26, Jakarta Timur",
        keterangan: "Produsen susu Frisian Flag",
      },
      {
        nama: "PT Ultra Jaya Milk Industry Tbk",
        kontak: "022-6031000",
        alamat: "Jl. Raya Cimareme No. 131, Bandung Barat",
        keterangan: "Produsen susu Ultra Milk",
      },
      {
        nama: "PT Eagle Indo Pharma",
        kontak: "021-6191919",
        alamat: "Jl. Daan Mogot Km 14, Jakarta Barat",
        keterangan: "Produsen Casablanca & Vitalis",
      },
      {
        nama: "PT Paragon Technology and Innovation",
        kontak: "021-7563000",
        alamat: "Jl. Swadarma Raya No. 33, Jakarta Selatan",
        keterangan: "Produsen Kahf",
      },
      {
        nama: "PT HMNS Grooming Indonesia",
        kontak: "021-5091234",
        alamat: "Jakarta Selatan",
        keterangan: "Produsen parfum lokal HMNS",
      },
      {
        nama: "PT Indofood CBP Sukses Makmur Tbk",
        kontak: "021-57958822",
        alamat: "Sudirman Plaza, Jakarta Selatan",
        keterangan: "Produsen Indomie, Sarimi, Supermi",
      },
      {
        nama: "PT Sayap Mas Utama (Wings Food)",
        kontak: "021-6190108",
        alamat: "Jl. Kapuk Kamal Raya, Jakarta Utara",
        keterangan: "Produsen Mie Sedaap",
      },
    ],
    lokasi: [
      { nama: "Rak Minuman" },
      { nama: "Rak Makanan" },
      { nama: "Rak Pendingin" },
      { nama: "Rak Kosmetik" },
    ],
    penerima: [
      {
        nama: "Toko Berkah Jaya",
        telepon: "081234567890",
        keterangan: "Pelanggan reguler, ambil mingguan",
      },
      {
        nama: "Minimarket Sumber Rezeki",
        telepon: "081298765432",
        keterangan: "Grosir area Bekasi",
      },
      {
        nama: "Divisi Retail",
        telepon: "",
        keterangan: "Transfer internal antar cabang",
      },
    ],
    barang: [], // diisi otomatis dari daftar item di bawah
    sku: [], // diisi otomatis (duplikat barang, sesuai skema app)
  };

  // ============================================================
  // 2. DAFTAR ITEM (dipakai untuk generate invoice + linkedData.barang)
  //    Tanggal "hari ini" acuan demo: 2026-07-04
  // ============================================================
  const ITEMS = {
    susu: [
      {
        sku: "SKU-SUSU-001",
        nama: "Indomilk Susu Kental Manis Cokelat 370g",
        merk: "Indomilk",
        kategori: "Susu",
        lokasi: "Rak Minuman",
        expired: "2027-01-15",
        hargaHPP: 9000,
        hargaJual: 12000,
        stokAwal: 200,
      },
      {
        sku: "SKU-SUSU-002",
        nama: "Indomilk Susu Kental Manis Putih 370g",
        merk: "Indomilk",
        kategori: "Susu",
        lokasi: "Rak Minuman",
        expired: "2026-07-15",
        hargaHPP: 8800,
        hargaJual: 11500,
        stokAwal: 150,
      },
      {
        sku: "SKU-SUSU-003",
        nama: "Frisian Flag Susu UHT Full Cream 1L",
        merk: "Frisian Flag",
        kategori: "Susu",
        lokasi: "Rak Pendingin",
        expired: "2026-12-01",
        hargaHPP: 15000,
        hargaJual: 19000,
        stokAwal: 120,
      },
      {
        sku: "SKU-SUSU-004",
        nama: "Frisian Flag Susu UHT Cokelat 1L",
        merk: "Frisian Flag",
        kategori: "Susu",
        lokasi: "Rak Pendingin",
        expired: "2026-06-20",
        hargaHPP: 15000,
        hargaJual: 19000,
        stokAwal: 100,
      },
      {
        sku: "SKU-SUSU-005",
        nama: "Ultra Milk Susu UHT Cokelat 250ml",
        merk: "Ultra Milk",
        kategori: "Susu",
        lokasi: "Rak Pendingin",
        expired: "2026-11-01",
        hargaHPP: 4500,
        hargaJual: 6000,
        stokAwal: 300,
      },
      {
        sku: "SKU-SUSU-006",
        nama: "Ultra Milk Susu UHT Full Cream 250ml",
        merk: "Ultra Milk",
        kategori: "Susu",
        lokasi: "Rak Pendingin",
        expired: "2026-08-01",
        hargaHPP: 4500,
        hargaJual: 6000,
        stokAwal: 250,
      },
    ],
    parfum: [
      {
        sku: "SKU-PARF-001",
        nama: "Casablanca Eau de Cologne Ocean 100ml",
        merk: "Casablanca",
        kategori: "Parfum",
        lokasi: "Rak Kosmetik",
        expired: "2028-01-01",
        hargaHPP: 18000,
        hargaJual: 25000,
        stokAwal: 60,
      },
      {
        sku: "SKU-PARF-002",
        nama: "Vitalis Fragrance Mist Pink Blossom 100ml",
        merk: "Vitalis",
        kategori: "Parfum",
        lokasi: "Rak Kosmetik",
        expired: "2027-06-01",
        hargaHPP: 15000,
        hargaJual: 21000,
        stokAwal: 80,
      },
      {
        sku: "SKU-PARF-003",
        nama: "Kahf Perfume Dailies Sport 20ml",
        merk: "Kahf",
        kategori: "Parfum",
        lokasi: "Rak Kosmetik",
        expired: "2028-03-01",
        hargaHPP: 25000,
        hargaJual: 35000,
        stokAwal: 50,
      },
      {
        sku: "SKU-PARF-004",
        nama: "Kahf Perfume Dailies Fresh 20ml",
        merk: "Kahf",
        kategori: "Parfum",
        lokasi: "Rak Kosmetik",
        expired: "2028-03-01",
        hargaHPP: 25000,
        hargaJual: 35000,
        stokAwal: 40,
      },
      {
        sku: "SKU-PARF-005",
        nama: "HMNS Eau de Parfum Alpha 50ml",
        merk: "HMNS",
        kategori: "Parfum",
        lokasi: "Rak Kosmetik",
        expired: "2028-01-01",
        hargaHPP: 95000,
        hargaJual: 135000,
        stokAwal: 25,
      },
      {
        sku: "SKU-PARF-006",
        nama: "HMNS Eau de Parfum Nomad 50ml",
        merk: "HMNS",
        kategori: "Parfum",
        lokasi: "Rak Kosmetik",
        expired: "2028-01-01",
        hargaHPP: 95000,
        hargaJual: 135000,
        stokAwal: 20,
      },
    ],
    mie: [
      {
        sku: "SKU-MIE-001",
        nama: "Indomie Goreng Original 85g",
        merk: "Indomie",
        kategori: "Mie Instan",
        lokasi: "Rak Makanan",
        expired: "2027-03-01",
        hargaHPP: 2800,
        hargaJual: 3500,
        stokAwal: 500,
      },
      {
        sku: "SKU-MIE-002",
        nama: "Indomie Kuah Ayam Bawang 75g",
        merk: "Indomie",
        kategori: "Mie Instan",
        lokasi: "Rak Makanan",
        expired: "2027-02-01",
        hargaHPP: 2700,
        hargaJual: 3300,
        stokAwal: 400,
      },
      {
        sku: "SKU-MIE-003",
        nama: "Sarimi Ayam Bawang 70g",
        merk: "Sarimi",
        kategori: "Mie Instan",
        lokasi: "Rak Makanan",
        expired: "2026-07-10",
        hargaHPP: 2400,
        hargaJual: 3000,
        stokAwal: 300,
      },
      {
        sku: "SKU-MIE-004",
        nama: "Supermi Ayam Bawang 75g",
        merk: "Supermi",
        kategori: "Mie Instan",
        lokasi: "Rak Makanan",
        expired: "2027-01-01",
        hargaHPP: 2400,
        hargaJual: 3000,
        stokAwal: 250,
      },
      {
        sku: "SKU-MIE-005",
        nama: "Mie Sedaap Goreng Original 82g",
        merk: "Mie Sedaap",
        kategori: "Mie Instan",
        lokasi: "Rak Makanan",
        expired: "2027-04-01",
        hargaHPP: 2600,
        hargaJual: 3200,
        stokAwal: 350,
      },
      {
        sku: "SKU-MIE-006",
        nama: "Mie Sedaap Soto 75g",
        merk: "Mie Sedaap",
        kategori: "Mie Instan",
        lokasi: "Rak Makanan",
        expired: "2026-05-01",
        hargaHPP: 2600,
        hargaJual: 3200,
        stokAwal: 200,
      },
    ],
  };

  // ============================================================
  // 3. INVOICE MASUK — dikelompokkan per supplier
  //    stok di sini = SISA stok SETELAH sample stock-out (lihat bag. 4)
  // ============================================================
  const invoices = {
    "INV-2025-101": {
      invoice: "INV-2025-101",
      tanggal: "2026-05-10",
      supplier: "PT Indolakto",
      items: [itemOf("SKU-SUSU-001", 200), itemOf("SKU-SUSU-002", 150)],
    },
    "INV-2025-102": {
      invoice: "INV-2025-102",
      tanggal: "2026-05-12",
      supplier: "PT Frisian Flag Indonesia",
      items: [
        itemOf("SKU-SUSU-003", 100), // 120 - 20 terjual di SO-2
        itemOf("SKU-SUSU-004", 100),
      ],
    },
    "INV-2025-103": {
      invoice: "INV-2025-103",
      tanggal: "2026-05-15",
      supplier: "PT Ultra Jaya Milk Industry Tbk",
      items: [itemOf("SKU-SUSU-005", 300), itemOf("SKU-SUSU-006", 250)],
    },
    "INV-2025-201": {
      invoice: "INV-2025-201",
      tanggal: "2026-05-20",
      supplier: "PT Eagle Indo Pharma",
      items: [
        itemOf("SKU-PARF-001", 50), // 60 - 10 terjual di SO-2
        itemOf("SKU-PARF-002", 80),
      ],
    },
    "INV-2025-202": {
      invoice: "INV-2025-202",
      tanggal: "2026-05-22",
      supplier: "PT Paragon Technology and Innovation",
      items: [itemOf("SKU-PARF-003", 50), itemOf("SKU-PARF-004", 40)],
    },
    "INV-2025-203": {
      invoice: "INV-2025-203",
      tanggal: "2026-05-25",
      supplier: "PT HMNS Grooming Indonesia",
      items: [itemOf("SKU-PARF-005", 25), itemOf("SKU-PARF-006", 20)],
    },
    "INV-2025-301": {
      invoice: "INV-2025-301",
      tanggal: "2026-06-01",
      supplier: "PT Indofood CBP Sukses Makmur Tbk",
      items: [
        itemOf("SKU-MIE-001", 450), // 500 - 50 terjual di SO-1
        itemOf("SKU-MIE-002", 400),
        itemOf("SKU-MIE-003", 300),
        itemOf("SKU-MIE-004", 250),
      ],
    },
    "INV-2025-302": {
      invoice: "INV-2025-302",
      tanggal: "2026-06-03",
      supplier: "PT Sayap Mas Utama (Wings Food)",
      items: [
        itemOf("SKU-MIE-005", 320), // 350 - 30 terjual di SO-1
        itemOf("SKU-MIE-006", 200),
      ],
    },
  };

  // Hitung total & totalHarga tiap invoice (mengikuti kalkulasi asli app)
  Object.values(invoices).forEach((inv) => {
    inv.total = inv.items.reduce((s, i) => s + (parseInt(i.stok) || 0), 0);
    inv.totalHarga = inv.items.reduce(
      (s, i) => s + (parseFloat(i.hargaHPP) || 0) * (parseInt(i.stok) || 0),
      0,
    );
  });

  // ============================================================
  // 4. STOCK OUT — contoh transaksi keluar (stok di invoice di
  //    atas sudah dikurangi sesuai transaksi ini)
  // ============================================================
  const stockOuts = [
    {
      id: "so_seed_1",
      invoice: "INV-OUT-1",
      tanggal: "2026-06-20",
      penerima: "Toko Berkah Jaya",
      telepon: "081234567890",
      paymentId: "pay_default_cash",
      paymentNama: "Cash",
      items: [
        {
          invoiceAsal: "INV-2025-301",
          sku: "SKU-MIE-001",
          nama: "Indomie Goreng Original 85g",
          kategori: "Mie Instan",
          merk: "Indomie",
          lokasi: "Rak Makanan",
          hargaHPP: 2800,
          hargaJual: 3500,
          jumlahKeluar: 50,
          sisaStok: 450,
        },
        {
          invoiceAsal: "INV-2025-302",
          sku: "SKU-MIE-005",
          nama: "Mie Sedaap Goreng Original 82g",
          kategori: "Mie Instan",
          merk: "Mie Sedaap",
          lokasi: "Rak Makanan",
          hargaHPP: 2600,
          hargaJual: 3200,
          jumlahKeluar: 30,
          sisaStok: 320,
        },
      ],
      createdAt: new Date("2026-06-20").toISOString(),
    },
    {
      id: "so_seed_2",
      invoice: "INV-OUT-2",
      tanggal: "2026-06-25",
      penerima: "Minimarket Sumber Rezeki",
      telepon: "081298765432",
      paymentId: "pay_default_qris",
      paymentNama: "QRIS",
      items: [
        {
          invoiceAsal: "INV-2025-201",
          sku: "SKU-PARF-001",
          nama: "Casablanca Eau de Cologne Ocean 100ml",
          kategori: "Parfum",
          merk: "Casablanca",
          lokasi: "Rak Kosmetik",
          hargaHPP: 18000,
          hargaJual: 25000,
          jumlahKeluar: 10,
          sisaStok: 50,
        },
        {
          invoiceAsal: "INV-2025-102",
          sku: "SKU-SUSU-003",
          nama: "Frisian Flag Susu UHT Full Cream 1L",
          kategori: "Susu",
          merk: "Frisian Flag",
          lokasi: "Rak Pendingin",
          hargaHPP: 15000,
          hargaJual: 19000,
          jumlahKeluar: 20,
          sisaStok: 100,
        },
      ],
      createdAt: new Date("2026-06-25").toISOString(),
    },
  ];

  // ============================================================
  // 5. PAYMENT METHODS (default)
  // ============================================================
  const paymentMethods = [
    {
      id: "pay_default_cash",
      nama: "Cash",
      keterangan: "Pembayaran tunai",
      aktif: true,
      isDefault: true,
    },
    {
      id: "pay_default_qris",
      nama: "QRIS",
      keterangan: "Scan QR Code (GoPay, OVO, Dana, ShopeePay, dll.)",
      aktif: true,
      isDefault: true,
    },
  ];

  // ============================================================
  // HELPER — bikin object item invoice dari daftar ITEMS di atas
  // ============================================================
  function itemOf(sku, stokSisa) {
    const all = [...ITEMS.susu, ...ITEMS.parfum, ...ITEMS.mie];
    const found = all.find((i) => i.sku === sku);
    if (!found) throw new Error("SKU tidak ditemukan di ITEMS: " + sku);
    return {
      sku: found.sku,
      nama: found.nama,
      merk: found.merk,
      kategori: found.kategori,
      lokasi: found.lokasi,
      expired: found.expired,
      hargaHPP: found.hargaHPP,
      hargaJual: found.hargaJual,
      stok: stokSisa,
    };
  }

  // Isi linkedData.barang & linkedData.sku dari semua item
  [...ITEMS.susu, ...ITEMS.parfum, ...ITEMS.mie].forEach((it) => {
    const entry = {
      sku: it.sku,
      nama: it.nama,
      merk: it.merk,
      kategori: it.kategori,
    };
    linkedData.barang.push(entry);
    linkedData.sku.push({ ...entry });
  });

  // ============================================================
  // TULIS SEMUA KE localStorage
  // ============================================================
  localStorage.setItem("invoices", JSON.stringify(invoices));
  localStorage.setItem("linkedData", JSON.stringify(linkedData));
  localStorage.setItem("stockOuts_v2", JSON.stringify(stockOuts));
  localStorage.setItem(
    "invenz_payment_methods",
    JSON.stringify(paymentMethods),
  );

  console.log("✅ Sample data berhasil dimuat!");
  console.log("   - " + Object.keys(invoices).length + " invoice barang masuk");
  console.log("   - " + stockOuts.length + " transaksi stock out");
  console.log(
    "   - " +
      linkedData.barang.length +
      " jenis barang (Susu, Parfum, Mie Instan)",
  );
  console.log("👉 Refresh halaman untuk melihat perubahan.");
})();
