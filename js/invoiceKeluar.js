"use strict";

// ===== AUTH =====
if (!localStorage.getItem("isLoggedIn")) window.location.href = "login.html";

const loggedUser = localStorage.getItem("loggedUser") || "Admin";
document.getElementById("sidebarUsername").textContent = loggedUser;
document.getElementById("sidebarAvatar").textContent = loggedUser.charAt(0).toUpperCase();

// ===== AMBIL ID DARI URL =====
const params = new URLSearchParams(window.location.search);
const invoiceId = params.get("id");
if (!invoiceId) window.location.href = "stockOut.html";

// ===== STORAGE KEY =====
const STOCKOUT_KEY = "stockOuts_v2";

function loadStockOuts() {
  try { return JSON.parse(localStorage.getItem(STOCKOUT_KEY) || "[]"); }
  catch { return []; }
}
function saveStockOuts(list) {
  localStorage.setItem(STOCKOUT_KEY, JSON.stringify(list));
}
function getThisInvoice() {
  return loadStockOuts().find((s) => s.id === invoiceId) || null;
}

const invoiceData = getThisInvoice();
if (!invoiceData) window.location.href = "stockOut.html";

// ===== SIDEBAR =====
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);
function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}

// ===== LOGOUT =====
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("loggedUser");
  window.location.href = "login.html";
});

// ===== BACK =====
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "stockOut.html";
});

// ===== FORMAT HELPERS =====
function formatRp(num) {
  if (!num || num === 0) return "Rp 0";
  return "Rp " + parseInt(num).toLocaleString("id-ID");
}
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${parseInt(d)} ${bulan[parseInt(m) - 1]} ${y}`;
}

// ===== PAYMENT BADGE =====
function paymentBadgeHtml(paymentId, paymentNama) {
  const map = {
    pay_default_cash: { icon: "💵", cls: "pay-cash" },
    pay_default_qris: { icon: "📱", cls: "pay-qris" },
  };
  const cfg = map[paymentId] || { icon: "💰", cls: "pay-other" };
  return `<span class="info-payment-badge ${cfg.cls}">${cfg.icon} ${paymentNama || "—"}</span>`;
}

// ===== RENDER INFO BAR =====
function renderInfo() {
  const data = getThisInvoice();
  if (!data) return;
  document.getElementById("navTitle").textContent = data.invoice;
  const totalItem = (data.items || []).reduce((s, i) => s + (parseInt(i.jumlahKeluar) || 0), 0);
  const totalHarga = (data.items || []).reduce((s, i) => s + parseFloat(i.hargaJual || i.hargaHPP || 0) * (parseInt(i.jumlahKeluar) || 0), 0);
  document.getElementById("invoiceInfo").innerHTML = `
    <div class="info-item">
      <span class="info-label">Invoice</span>
      <span class="info-val"><strong>${data.invoice}</strong></span>
    </div>
    <div class="info-item">
      <span class="info-label">Tanggal</span>
      <span class="info-val">${formatDate(data.tanggal)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Customer</span>
      <span class="info-val"><strong>${data.penerima || "—"}</strong></span>
    </div>
    <div class="info-item">
      <span class="info-label">No. Telepon</span>
      <span class="info-val">${data.telepon || '<span style="color:#bbb">—</span>'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Metode Bayar</span>
      <span class="info-val">${paymentBadgeHtml(data.paymentId, data.paymentNama)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Total Barang</span>
      <span class="info-val" id="infoTotal"><strong>${totalItem}</strong> item</span>
    </div>
    <div class="info-item">
      <span class="info-label">Total Nilai</span>
      <span class="info-val" id="infoHarga" style="color:#1a6b2a;font-weight:700">${formatRp(totalHarga)}</span>
    </div>
  `;
}

// ===== UPDATE SUMMARY BAR =====
function updateSummaryBar() {
  const data = getThisInvoice();
  if (!data) return;
  const totalItem = (data.items || []).reduce((s, i) => s + (parseInt(i.jumlahKeluar) || 0), 0);
  const totalHarga = (data.items || []).reduce((s, i) => s + parseFloat(i.hargaJual || i.hargaHPP || 0) * (parseInt(i.jumlahKeluar) || 0), 0);
  document.getElementById("summaryTotal").textContent = totalItem;
  document.getElementById("summaryHarga").textContent = formatRp(totalHarga);
}

// ============================================================
// ===== PRINT NOTA ===========================================
// ============================================================
function printNota() {
  const data = getThisInvoice();
  if (!data) return;

  const totalItem = (data.items || []).reduce((s, i) => s + (parseInt(i.jumlahKeluar) || 0), 0);
  const totalHarga = (data.items || []).reduce((s, i) => s + parseFloat(i.hargaJual || i.hargaHPP || 0) * (parseInt(i.jumlahKeluar) || 0), 0);

  const itemRows = (data.items || []).map((item, idx) => {
    const qty = parseInt(item.jumlahKeluar) || 0;
    const harga = parseFloat(item.hargaJual || item.hargaHPP || 0);
    const subtotal = qty * harga;
    return `
      <tr>
        <td style="padding:3px 0;vertical-align:top">${idx + 1}. ${item.nama}</td>
        <td style="padding:3px 0;text-align:right;white-space:nowrap;padding-left:8px">${qty} x ${formatRp(harga)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:0 0 5px 0;text-align:right;font-weight:700;color:#111">${formatRp(subtotal)}</td>
      </tr>
    `;
  }).join("");

  const notaHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Nota — ${data.invoice}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    width: 80mm;
    padding: 8px;
    background: white;
    color: #111;
  }
  .header { text-align: center; margin-bottom: 8px; }
  .store-name { font-size: 16px; font-weight: 700; letter-spacing: 2px; }
  .store-sub { font-size: 10px; color: #555; margin-top: 2px; }
  .divider { border: none; border-top: 1px dashed #999; margin: 6px 0; }
  .divider-solid { border: none; border-top: 1px solid #111; margin: 6px 0; }
  .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
  .info-label { color: #666; }
  .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 11px; }
  .total-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; margin: 4px 0; }
  .payment-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
  .footer { text-align: center; font-size: 10px; color: #888; margin-top: 10px; line-height: 1.6; }
  .big-total { font-size: 15px; font-weight: 700; }
  @media print {
    body { width: 80mm; padding: 4px; }
    @page { margin: 0; size: 80mm auto; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="store-name">INVENZ</div>
  <div class="store-sub">Sistem Manajemen Inventori</div>
</div>
<hr class="divider-solid">
<div class="info-row"><span class="info-label">Invoice</span><span><strong>${data.invoice}</strong></span></div>
<div class="info-row"><span class="info-label">Tanggal</span><span>${formatDate(data.tanggal)}</span></div>
<div class="info-row"><span class="info-label">Customer</span><span><strong>${data.penerima || "—"}</strong></span></div>
${data.telepon ? `<div class="info-row"><span class="info-label">Telepon</span><span>${data.telepon}</span></div>` : ""}
<div class="info-row"><span class="info-label">Pembayaran</span><span>${data.paymentNama || "—"}</span></div>
<hr class="divider">
<table class="items-table">
  <tbody>
    ${itemRows}
  </tbody>
</table>
<hr class="divider">
<div class="total-row">
  <span>TOTAL (${totalItem} item)</span>
  <span class="big-total">${formatRp(totalHarga)}</span>
</div>
<hr class="divider-solid">
<div class="footer">
  <div>Terima kasih atas pembelian Anda!</div>
  <div>Barang yang sudah dibeli</div>
  <div>tidak dapat dikembalikan.</div>
  <div style="margin-top:6px;color:#bbb">— INVENZ —</div>
</div>
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1000);
  };
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=340,height=600");
  win.document.write(notaHTML);
  win.document.close();
}

// ============================================================
// ===== TABEL ITEMS ==========================================
// ============================================================
const tableBody = document.getElementById("tableBody");
let rowCount = 0;
let rowToDelete = null;
let selectedBarang = null;

function renderTableItems() {
  tableBody.innerHTML = "";
  rowCount = 0;
  const data = getThisInvoice();
  if (!data || !data.items || !data.items.length) {
    tableBody.innerHTML = `<tr class="empty-row">
      <td colspan="11">Belum ada barang — klik "Stock Out Barang" untuk memilih barang dari stok</td>
    </tr>`;
    return;
  }
  data.items.forEach((item, idx) => {
    rowCount++;
    tambahBarisTabel(item, idx, false);
  });
}

function tambahBarisTabel(item, idx, prepend = false) {
  const hargaJual = parseFloat(item.hargaJual || item.hargaHPP || 0);
  const jumlah = parseInt(item.jumlahKeluar) || 0;
  const subtotal = hargaJual * jumlah;
  const sisaClass = item.sisaStok <= 5 ? "stok-sisa-low" : "stok-sisa-ok";

  if (prepend) {
    const emptyRow = tableBody.querySelector(".empty-row");
    if (emptyRow) emptyRow.remove();
    rowCount++;
  }

  const tr = document.createElement("tr");
  tr.dataset.idx = idx;
  tr.innerHTML = `
    <td>${idx + 1}</td>
    <td><strong>${item.nama}</strong></td>
    <td><span class="badge badge-blue">${item.kategori || "—"}</span></td>
    <td>${item.merk || "—"}</td>
    <td>${item.lokasi || "—"}</td>
    <td><span class="badge badge-orange">${item.invoiceAsal || "—"}</span></td>
    <td class="col-harga-item">${formatRp(hargaJual)}</td>
    <td><strong>${jumlah}</strong></td>
    <td class="col-harga-item">${formatRp(subtotal)}</td>
    <td class="${sisaClass}">${item.sisaStok}</td>
    <td>
      <button class="btn-hapus btn-kembalikan">
        <i class="bx bx-undo"></i> Kembalikan
      </button>
    </td>
  `;
  tr.querySelector(".btn-kembalikan").addEventListener("click", () => {
    rowToDelete = idx;
    document.getElementById("confirmOverlay").classList.add("active");
  });
  tableBody.appendChild(tr);
}

// ============================================================
// ===== PILIH BARANG — MODAL =================================
// ============================================================
let allGlobalStok = [];

document.getElementById("btnAddItem").addEventListener("click", () => {
  buildStokList();
  document.getElementById("searchBarang").value = "";
  document.getElementById("modalOverlay").classList.add("active");
  // Reset scan area
  closeSKUScanPanel();
  document.getElementById("inputSKUScan").value = "";
});

document.getElementById("batalBtn").addEventListener("click", () => {
  document.getElementById("modalOverlay").classList.remove("active");
  closeSKUScanPanel();
});
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("modalOverlay")) {
    document.getElementById("modalOverlay").classList.remove("active");
    closeSKUScanPanel();
  }
});

// Search teks
document.getElementById("searchBarang").addEventListener("input", function () {
  const kw = this.value.toLowerCase();
  const filtered = kw
    ? allGlobalStok.filter((b) =>
        b.nama.toLowerCase().includes(kw) ||
        (b.kategori || "").toLowerCase().includes(kw) ||
        (b.merk || "").toLowerCase().includes(kw) ||
        (b.invoiceAsal || "").toLowerCase().includes(kw) ||
        (b.lokasi || "").toLowerCase().includes(kw) ||
        (b.sku || "").toLowerCase().includes(kw)
      )
    : allGlobalStok;
  renderStokList(filtered);
});

function buildStokList() {
  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  allGlobalStok = [];
  Object.values(invoices).forEach((inv) => {
    if (!inv.items) return;
    inv.items.forEach((item) => {
      allGlobalStok.push({
        invoiceAsal: inv.invoice,
        nama: item.nama,
        kategori: item.kategori || "—",
        merk: item.merk || "—",
        lokasi: item.lokasi || "—",
        sku: item.sku || "—",
        hargaHPP: item.hargaHPP || 0,
        hargaJual: item.hargaJual || 0,
        stok: parseInt(item.stok) || 0,
      });
    });
  });
  renderStokList(allGlobalStok);
}

function renderStokList(list) {
  const stokList = document.getElementById("stokList");
  stokList.innerHTML = "";
  if (!list.length) {
    stokList.innerHTML = `<div class="stok-empty-msg">Tidak ada barang yang ditemukan</div>`;
    return;
  }
  list.forEach((barang) => {
    const isEmpty = barang.stok <= 0;
    const isLow = barang.stok > 0 && barang.stok <= 5;
    const badgeClass = isEmpty ? "stok-badge-empty" : isLow ? "stok-badge-low" : "stok-badge-ok";
    const badgeLabel = isEmpty ? "Habis" : isLow ? `Stok: ${barang.stok} ⚠️` : `Stok: ${barang.stok}`;
    const div = document.createElement("div");
    div.className = "stok-item";
    div.innerHTML = `
      <div class="stok-item-info">
        <div class="stok-item-name">${barang.nama}</div>
        <div class="stok-item-meta">
          <span>📂 ${barang.kategori}</span>
          <span>🏷️ ${barang.merk}</span>
          <span>📍 ${barang.lokasi}</span>
          <span>🧾 ${barang.invoiceAsal}</span>
          <span style="color:#1a6b2a;font-weight:600">💰 ${formatRp(barang.hargaJual || barang.hargaHPP)}</span>
        </div>
      </div>
      <div class="stok-item-right">
        <span class="stok-badge ${badgeClass}">${badgeLabel}</span>
        <button class="btn-pilih" ${isEmpty ? "disabled" : ""}>Pilih</button>
      </div>
    `;
    if (!isEmpty) {
      div.querySelector(".btn-pilih").addEventListener("click", () => bukaModalJumlah(barang));
    }
    stokList.appendChild(div);
  });
}

// ============================================================
// ===== SCAN BARCODE SKU — Di modal pilih barang =============
// ============================================================
let zxingLoadPromise = null;
function loadZXing() {
  if (window.ZXing) return Promise.resolve();
  if (zxingLoadPromise) return zxingLoadPromise;
  zxingLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
    s.onload = resolve;
    s.onerror = () => { zxingLoadPromise = null; reject(new Error("ZXing gagal dimuat")); };
    document.head.appendChild(s);
  });
  return zxingLoadPromise;
}

const SKU_SCAN = { stream: null, reader: null, active: false, done: false };

function stopSKUScan() {
  SKU_SCAN.active = false;
  SKU_SCAN.done = false;
  if (SKU_SCAN.reader) { try { SKU_SCAN.reader.reset(); } catch (_) {} SKU_SCAN.reader = null; }
  if (SKU_SCAN.stream) { try { SKU_SCAN.stream.getTracks().forEach(t => t.stop()); } catch (_) {} SKU_SCAN.stream = null; }
  const video = document.getElementById("scanCamKeluar");
  if (video) { try { video.pause(); video.srcObject = null; } catch (_) {} }
  const ph = document.getElementById("scanPhKeluar");
  if (ph) ph.style.display = "flex";
  setSKUScanStatus("");
}

function closeSKUScanPanel() {
  stopSKUScan();
  const panel = document.getElementById("skuScanPanelKeluar");
  if (panel) panel.classList.add("hidden");
  const resultEl = document.getElementById("skuScanResultKeluar");
  if (resultEl) resultEl.classList.add("hidden");
}

function setSKUScanStatus(state, msg = "") {
  let el = document.getElementById("skuScanStatusKeluar");
  if (!el) {
    el = document.createElement("div");
    el.id = "skuScanStatusKeluar";
    el.className = "scan-status";
    const panel = document.getElementById("skuScanPanelKeluar");
    if (panel) panel.appendChild(el);
    else return;
  }
  if (!state) { el.style.display = "none"; return; }
  el.style.display = "flex";
  el.setAttribute("data-state", state);
  el.innerHTML = state === "loading" ? `<span class="spin"></span><span>${msg}</span>`
    : state === "scanning" ? `<i class="bx bx-barcode-reader"></i><span>${msg}</span>`
    : `<i class="bx bx-error-circle"></i><span>${msg}</span>`;
}

// Toggle panel scan
document.getElementById("btnScanSKUKeluar").addEventListener("click", () => {
  const panel = document.getElementById("skuScanPanelKeluar");
  if (panel.classList.contains("hidden")) panel.classList.remove("hidden");
  else closeSKUScanPanel();
});
document.getElementById("btnCloseScanKeluar").addEventListener("click", closeSKUScanPanel);

// Buka kamera
document.getElementById("btnOpenCamKeluar").addEventListener("click", async () => {
  stopSKUScan();
  setSKUScanStatus("loading", "Memuat scanner...");
  try {
    await loadZXing();
    const reader = new ZXing.BrowserMultiFormatReader();
    SKU_SCAN.reader = reader;
    SKU_SCAN.done = false;
    const video = document.getElementById("scanCamKeluar");
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
    SKU_SCAN.stream = stream;
    SKU_SCAN.active = true;
    video.srcObject = stream;
    document.getElementById("scanPhKeluar").style.display = "none";
    setSKUScanStatus("scanning", "Arahkan ke barcode SKU barang...");
    reader.decodeFromStream(stream, video, (result) => {
      if (SKU_SCAN.done || !SKU_SCAN.active) return;
      if (result) {
        SKU_SCAN.done = true;
        const val = result.getText();
        handleSKUScanResult(val);
        stopSKUScan();
      }
    });
  } catch (err) {
    stopSKUScan();
    setSKUScanStatus("error", err.message.includes("Permission") ? "Izin kamera ditolak." : "Kamera gagal: " + err.message);
  }
});

// Upload galeri
document.getElementById("galeriSKUKeluar").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  this.value = "";
  setSKUScanStatus("loading", "Membaca barcode...");
  try {
    await loadZXing();
    const reader = new ZXing.BrowserMultiFormatReader();
    const url = URL.createObjectURL(file);
    try {
      const result = await reader.decodeFromImageUrl(url);
      handleSKUScanResult(result.getText());
      setSKUScanStatus("");
    } catch (_) { setSKUScanStatus("error", "Barcode tidak terbaca."); }
    finally { try { reader.reset(); } catch (_) {} URL.revokeObjectURL(url); }
  } catch (err) { setSKUScanStatus("error", "Error: " + err.message); }
});

function handleSKUScanResult(val) {
  document.getElementById("skuScanValKeluar").textContent = val;
  document.getElementById("skuScanResultKeluar").classList.remove("hidden");
  setSKUScanStatus("");
  // Auto-cari barang berdasar SKU
  autoFindBySKU(val);
}

// Gunakan hasil scan → isi field + filter
document.getElementById("btnUseSKUScanKeluar").addEventListener("click", () => {
  const val = document.getElementById("skuScanValKeluar").textContent;
  document.getElementById("inputSKUScan").value = val;
  document.getElementById("skuScanResultKeluar").classList.add("hidden");
  closeSKUScanPanel();
  autoFindBySKU(val);
});

// Cari barang berdasar SKU yang discan
function autoFindBySKU(sku) {
  if (!sku) return;
  const found = allGlobalStok.find(b => (b.sku || "").toLowerCase() === sku.toLowerCase());
  if (found) {
    if (found.stok > 0) {
      // Langsung buka modal jumlah
      document.getElementById("searchBarang").value = found.nama;
      renderStokList([found]);
      bukaModalJumlah(found);
    } else {
      // Tampilkan pesan stok habis
      renderStokList([found]);
      alert(`Barang "${found.nama}" ditemukan tapi stoknya HABIS.`);
    }
  } else {
    // Filter berdasar SKU di search
    document.getElementById("searchBarang").value = sku;
    const filtered = allGlobalStok.filter(b => (b.sku || "").toLowerCase().includes(sku.toLowerCase()));
    renderStokList(filtered);
    if (!filtered.length) alert(`Tidak ada barang dengan SKU "${sku}".`);
  }
}

// Input SKU manual → cari
document.getElementById("inputSKUScan").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    buildStokList();
    autoFindBySKU(this.value.trim());
  }
});
document.getElementById("btnCariSKU").addEventListener("click", () => {
  buildStokList();
  autoFindBySKU(document.getElementById("inputSKUScan").value.trim());
});

// ============================================================
// ===== MODAL JUMLAH =========================================
// ============================================================
function bukaModalJumlah(barang) {
  selectedBarang = barang;
  document.getElementById("inputJumlah").value = 1;
  document.getElementById("inputJumlah").max = barang.stok;
  document.getElementById("errorMsgJumlah").textContent = "";
  document.getElementById("barangPreview").innerHTML = `
    <strong>${barang.nama}</strong><br>
    Kategori: ${barang.kategori} &nbsp;|&nbsp; Merk: ${barang.merk}<br>
    Lokasi: ${barang.lokasi} &nbsp;|&nbsp; Invoice Asal: ${barang.invoiceAsal}<br>
    SKU: ${barang.sku}<br>
    <span style="color:#1a6b2a;font-weight:700">Harga Jual: ${formatRp(barang.hargaJual || barang.hargaHPP)}</span>
  `;
  document.getElementById("stokInfo").textContent = `Stok tersedia: ${barang.stok} item`;
  document.getElementById("modalOverlay").classList.remove("active");
  document.getElementById("jumlahOverlay").classList.add("active");
}

document.getElementById("qtyMinus").addEventListener("click", () => {
  const val = parseInt(document.getElementById("inputJumlah").value) || 1;
  if (val > 1) document.getElementById("inputJumlah").value = val - 1;
});
document.getElementById("qtyPlus").addEventListener("click", () => {
  const val = parseInt(document.getElementById("inputJumlah").value) || 1;
  if (selectedBarang && val < selectedBarang.stok) document.getElementById("inputJumlah").value = val + 1;
});

document.getElementById("batalJumlahBtn").addEventListener("click", () => {
  document.getElementById("jumlahOverlay").classList.remove("active");
  selectedBarang = null;
  document.getElementById("modalOverlay").classList.add("active");
});
document.getElementById("jumlahOverlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("jumlahOverlay")) {
    document.getElementById("jumlahOverlay").classList.remove("active");
    selectedBarang = null;
  }
});

// ============================================================
// ===== KONFIRMASI OUT =======================================
// ============================================================
document.getElementById("konfirmasiOutBtn").addEventListener("click", () => {
  const jumlah = parseInt(document.getElementById("inputJumlah").value);
  const errEl = document.getElementById("errorMsgJumlah");
  if (!jumlah || jumlah < 1) { errEl.textContent = "Jumlah harus minimal 1!"; return; }
  if (jumlah > selectedBarang.stok) { errEl.textContent = `Melebihi stok tersedia (${selectedBarang.stok})!`; return; }

  kurangiStokInvoice(selectedBarang.invoiceAsal, selectedBarang.nama, selectedBarang.kategori, jumlah);

  const newItem = {
    invoiceAsal: selectedBarang.invoiceAsal,
    nama: selectedBarang.nama,
    kategori: selectedBarang.kategori,
    merk: selectedBarang.merk,
    lokasi: selectedBarang.lokasi,
    sku: selectedBarang.sku,
    hargaHPP: selectedBarang.hargaHPP,
    hargaJual: selectedBarang.hargaJual || selectedBarang.hargaHPP,
    jumlahKeluar: jumlah,
    sisaStok: selectedBarang.stok - jumlah,
  };

  const list = loadStockOuts();
  const soIdx = list.findIndex((s) => s.id === invoiceId);
  if (soIdx === -1) { window.location.href = "stockOut.html"; return; }
  if (!list[soIdx].items) list[soIdx].items = [];
  list[soIdx].items.push(newItem);
  saveStockOuts(list);

  renderTableItems();
  renderInfo();
  updateSummaryBar();

  document.getElementById("jumlahOverlay").classList.remove("active");
  selectedBarang = null;
});

function kurangiStokInvoice(invoiceAsal, namaBarang, kategori, jumlah) {
  try {
    const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
    if (!invoices[invoiceAsal]) return;
    const found = invoices[invoiceAsal].items.find(i => i.nama === namaBarang && i.kategori === kategori);
    if (found) found.stok = Math.max(0, parseInt(found.stok) - jumlah);
    localStorage.setItem("invoices", JSON.stringify(invoices));
  } catch (e) { /* ignore */ }
}

// ============================================================
// ===== KEMBALIKAN (Hapus Item) ==============================
// ============================================================
document.getElementById("confirmYes").addEventListener("click", () => {
  if (rowToDelete === null) return;
  const list = loadStockOuts();
  const soIdx = list.findIndex((s) => s.id === invoiceId);
  if (soIdx === -1) { window.location.href = "stockOut.html"; return; }
  const items = list[soIdx].items || [];
  const item = items[rowToDelete];
  if (item) {
    try {
      const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
      if (invoices[item.invoiceAsal]) {
        const found = invoices[item.invoiceAsal].items.find(i => i.nama === item.nama && i.kategori === item.kategori);
        if (found) found.stok = (parseInt(found.stok) || 0) + (parseInt(item.jumlahKeluar) || 0);
        localStorage.setItem("invoices", JSON.stringify(invoices));
      }
    } catch (e) { /* ignore */ }
    items.splice(rowToDelete, 1);
    list[soIdx].items = items;
    saveStockOuts(list);
  }
  rowToDelete = null;
  document.getElementById("confirmOverlay").classList.remove("active");
  renderTableItems();
  renderInfo();
  updateSummaryBar();
});

document.getElementById("confirmNo").addEventListener("click", () => {
  rowToDelete = null;
  document.getElementById("confirmOverlay").classList.remove("active");
});
document.getElementById("confirmOverlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("confirmOverlay")) {
    rowToDelete = null;
    document.getElementById("confirmOverlay").classList.remove("active");
  }
});

// ===== PRINT NOTA BUTTON =====
document.getElementById("btnPrintNota").addEventListener("click", printNota);

// ===== SAFETY NET =====
window.addEventListener("beforeunload", () => stopSKUScan());
window.addEventListener("pagehide", () => stopSKUScan());
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") stopSKUScan();
});

// ============================================================
// ===== INIT =================================================
// ============================================================
renderInfo();
renderTableItems();
updateSummaryBar();