// ===== INPUTBARANG.JS — Supabase version =====
"use strict";

// ===== USER INFO (session dari localStorage via INVENZ) =====
const loggedUser = INVENZ.user;

document.getElementById("sidebarUsername").textContent = loggedUser;
document.getElementById("sidebarAvatar").textContent = loggedUser.charAt(0).toUpperCase();

// ===== SIDEBAR =====
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
document.getElementById("hamburger").addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("active");
});
document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
}

// ===== LOGOUT =====
document.getElementById("logoutBtn").addEventListener("click", () => INVENZ.logout());

// ===== STATE =====
let allInvoices = [];
let rowToDelete = null;
let currentTab = "manual";

// ===== CUSTOM RANGE STATE =====
let customRangeActive = false;
let customRangeFrom = null;
let customRangeTo = null;

// ===== ELEMEN CUSTOM RANGE =====
const filterWaktu = document.getElementById("filterWaktu");
const customRangePanel = document.getElementById("customRangePanel");
const customFromEl = document.getElementById("customFrom");
const customToEl = document.getElementById("customTo");
const btnApplyRange = document.getElementById("btnApplyRange");
const rangeBadge = document.getElementById("rangeBadge");
const rangeBadgeText = document.getElementById("rangeBadgeText");

// ========================================================
// ===== SCANNER STATE ====================================
// ========================================================
const INV_SCAN = { stream: null, reader: null, active: false, done: false };

let zxingLoadPromise = null;
function loadZXing() {
  if (window.ZXing) return Promise.resolve();
  if (zxingLoadPromise) return zxingLoadPromise;
  zxingLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
    s.onload = resolve;
    s.onerror = () => {
      zxingLoadPromise = null;
      reject(new Error("ZXing gagal dimuat"));
    };
    document.head.appendChild(s);
  });
  return zxingLoadPromise;
}

function stopInvScanner() {
  INV_SCAN.active = false;
  INV_SCAN.done = false;
  if (INV_SCAN.reader) {
    try { INV_SCAN.reader.reset(); } catch (_) { }
    INV_SCAN.reader = null;
  }
  if (INV_SCAN.stream) {
    try { INV_SCAN.stream.getTracks().forEach((t) => t.stop()); } catch (_) { }
    INV_SCAN.stream = null;
  }
  const video = document.getElementById("cameraStream");
  if (video) {
    try { video.pause(); video.srcObject = null; } catch (_) { }
  }
  const ph = document.getElementById("scanPlaceholder");
  if (ph) ph.style.display = "flex";
  setScanStatus("");
}

// ===== ELEMEN =====
const modalOverlay = document.getElementById("modalOverlay");
const confirmOverlay = document.getElementById("confirmOverlay");
const tableBody = document.getElementById("tableBody");
const errorMsg = document.getElementById("errorMsg");

// ===== CUSTOM DROPDOWN =====
const ddSupplier = new CustomDropdown("cdSupplier", "supplier", { icon: "bx-store" });
const ddSupplierScan = new CustomDropdown("cdSupplierScan", "supplier", { icon: "bx-store" });

// ===== FORMAT =====
function formatRp(num) {
  if (!num || num === 0) return "Rp 0";
  return "Rp " + parseInt(num).toLocaleString("id-ID");
}

// ========================================================
// ===== SUPABASE DATA LOADERS ============================
// ========================================================

async function loadMasterData() {
  const { data, error } = await sb.from("supplier").select("nama").order("nama");
  if (!error && data) {
    const namaList = data.map((s) => s.nama);
    ddSupplier.setOptions(namaList);
    ddSupplierScan.setOptions(namaList);
  }
}

async function loadAllInvoices() {
  const { data: invData, error: invErr } = await sb
    .from("invoices")
    .select("id, invoice_no, tanggal, supplier, total, total_harga, invoice_items(nama)")
    .order("created_at", { ascending: false });

  if (invErr) {
    console.error("Error loading invoices:", invErr.message);
    allInvoices = [];
    return;
  }
  allInvoices = invData || [];
}

// ===== AUTO-ADD SUPPLIER ke Supabase =====
async function autoAddSupplier(nama) {
  if (!nama || !nama.trim()) return;
  const trimmed = nama.trim();

  try {
    // Cek dulu apakah supplier dengan nama ini sudah ada (case-insensitive)
    const { data: existing, error: findErr } = await sb
      .from("supplier")
      .select("id")
      .ilike("nama", trimmed)
      .maybeSingle();

    if (findErr) {
      console.error("Gagal cek supplier existing:", findErr.message);
      return;
    }

    if (!existing) {
      const { error: insErr } = await sb.from("supplier").insert({ nama: trimmed });
      if (insErr) {
        console.error("Gagal menambahkan supplier baru:", insErr.message);
      }
    }
  } catch (e) {
    console.error("autoAddSupplier error:", e.message);
  }
}

// ========================================================
// ===== DATE FILTER ======================================
// ========================================================
function getDateRange(filter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filter) {
    case "today": return { from: today, to: new Date() };
    case "7d": return { from: new Date(today - 6 * 864e5), to: new Date() };
    case "thismonth": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date() };
    case "30d": return { from: new Date(today - 29 * 864e5), to: new Date() };
    case "lastmonth": return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) };
    case "3m": return { from: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()), to: new Date() };
    case "6m": return { from: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()), to: new Date() };
    case "ytd": return { from: new Date(now.getFullYear(), 0, 1), to: new Date() };
    case "1y": return { from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), to: new Date() };
    case "lastyear": return { from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59) };
    case "custom":
      if (customRangeActive && customRangeFrom && customRangeTo) return { from: customRangeFrom, to: customRangeTo };
      return null;
    default: return null;
  }
}

function isInRange(tanggalStr, range) {
  if (!range) return true;
  const d = new Date(tanggalStr);
  return d >= range.from && d <= range.to;
}

function formatDateShort(date) {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ===== CUSTOM RANGE PANEL =====
filterWaktu.addEventListener("change", () => {
  if (filterWaktu.value === "custom") {
    customRangePanel.classList.add("visible");
    if (!customFromEl.value) {
      const now = new Date();
      customFromEl.value = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      customToEl.value = now.toISOString().split("T")[0];
    }
  } else {
    customRangePanel.classList.remove("visible");
    customRangeActive = false;
    rangeBadge.classList.remove("visible");
    renderTable();
  }
});

btnApplyRange.addEventListener("click", () => {
  const fromVal = customFromEl.value;
  const toVal = customToEl.value;
  if (!fromVal || !toVal) { alert("Pilih tanggal dari dan sampai terlebih dahulu."); return; }
  const fromDate = new Date(fromVal + "T00:00:00");
  const toDate = new Date(toVal + "T23:59:59");
  if (fromDate > toDate) { alert("Tanggal 'Dari' tidak boleh lebih besar dari 'Sampai'."); return; }
  customRangeFrom = fromDate;
  customRangeTo = toDate;
  customRangeActive = true;
  rangeBadgeText.textContent = `${formatDateShort(fromDate)} – ${formatDateShort(toDate)}`;
  rangeBadge.classList.add("visible");
  customRangePanel.classList.remove("visible");
  renderTable();
});

rangeBadge.addEventListener("click", () => {
  customRangeActive = false;
  customRangeFrom = null;
  customRangeTo = null;
  rangeBadge.classList.remove("visible");
  filterWaktu.value = "all";
  renderTable();
});

// ========================================================
// ===== HITUNG TOTAL HARGA ===============================
// ========================================================
function hitungTotalHarga(inv) {
  return parseFloat(inv.total_harga) || 0;
}

// ===== RENDER TABLE =====
function renderTable() {
  const range = getDateRange(filterWaktu.value);
  const filtered = allInvoices.filter((inv) => isInRange(inv.tanggal, range));

  document.getElementById("sumTransaksi").textContent = filtered.length;
  document.getElementById("sumBarang").textContent = filtered.reduce((s, inv) => s + (parseInt(inv.total) || 0), 0);

  // Hitung jenis barang unik (berdasarkan nama) dari semua item di invoice yang difilter
  const jenisSet = new Set();
  filtered.forEach((inv) => {
    (inv.invoice_items || []).forEach((item) => {
      if (item.nama) jenisSet.add(item.nama.toLowerCase().trim());
    });
  });
  document.getElementById("sumJenis").textContent = jenisSet.size;

  document.getElementById("sumHarga").textContent = formatRp(
    filtered.reduce((s, inv) => s + hitungTotalHarga(inv), 0)
  );

  // ... sisanya tetap sama

  tableBody.innerHTML = "";
  if (!filtered.length) {
    tableBody.innerHTML = `<tr class="empty-row"><td colspan="7">Tidak ada data untuk periode ini</td></tr>`;
    return;
  }
  filtered.forEach((data, idx) => {
    const tr = document.createElement("tr");
    tr.dataset.invoiceId = data.id;
    tr.dataset.invoiceNo = data.invoice_no;
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><a class="invoice-link" href="invoice.html?id=${encodeURIComponent(data.id)}">${data.invoice_no}</a></td>
      <td>${data.tanggal}</td>
      <td>${data.supplier || "—"}</td>
      <td class="col-total">${data.total || 0}</td>
      <td class="col-harga">${formatRp(hitungTotalHarga(data))}</td>
      <td><button class="btn-hapus"><i class="bx bx-trash"></i> Hapus</button></td>
    `;
    tr.querySelector(".btn-hapus").addEventListener("click", () => {
      rowToDelete = tr;
      confirmOverlay.classList.add("active");
    });
    tableBody.appendChild(tr);
  });
}

// ===== BUKA MODAL =====
document.getElementById("openModalBtn").addEventListener("click", async () => {
  await loadMasterData();
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("inputTanggal").value = today;
  document.getElementById("inputTanggalScan").value = today;
  errorMsg.textContent = "";
  modalOverlay.classList.add("active");
  switchTab("manual");
});

document.getElementById("modalCloseX").addEventListener("click", tutupModal);
document.getElementById("batalBtn").addEventListener("click", tutupModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) tutupModal(); });

// ===== TAB SWITCH =====
window.switchTab = function (tab) {
  currentTab = tab;
  document.getElementById("panelManual").classList.toggle("hidden", tab !== "manual");
  document.getElementById("panelScan").classList.toggle("hidden", tab !== "scan");
  document.getElementById("tabManual").classList.toggle("active", tab === "manual");
  document.getElementById("tabScan").classList.toggle("active", tab === "scan");
  if (tab !== "scan") stopInvScanner();
};

// ===== KAMERA — ZXing =====
document.getElementById("btnOpenCam").addEventListener("click", async () => {
  stopInvScanner();
  setScanStatus("loading", "Memuat scanner...");
  try {
    await loadZXing();
    const reader = new ZXing.BrowserMultiFormatReader();
    INV_SCAN.reader = reader;
    INV_SCAN.done = false;
    const video = document.getElementById("cameraStream");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    INV_SCAN.stream = stream;
    INV_SCAN.active = true;
    video.srcObject = stream;
    document.getElementById("scanPlaceholder").style.display = "none";
    setScanStatus("scanning", "Arahkan ke barcode invoice...");
    reader.decodeFromStream(stream, video, (result) => {
      if (INV_SCAN.done || !INV_SCAN.active) return;
      if (result) {
        INV_SCAN.done = true;
        showScanResult(result.getText());
        stopInvScanner();
      }
    });
  } catch (err) {
    stopInvScanner();
    const msg = err.message.includes("Permission") || err.message.includes("getUserMedia")
      ? "Izin kamera ditolak."
      : "Kamera gagal: " + err.message;
    setScanStatus("error", msg);
  }
});

document.getElementById("galleryInput").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  this.value = "";
  setScanStatus("loading", "Membaca barcode dari gambar...");
  try {
    await loadZXing();
    const reader = new ZXing.BrowserMultiFormatReader();
    const url = URL.createObjectURL(file);
    try {
      const result = await reader.decodeFromImageUrl(url);
      showScanResult(result.getText());
      setScanStatus("");
    } catch (_) {
      setScanStatus("error", "Barcode tidak terbaca. Coba gambar lebih jelas.");
    } finally {
      try { reader.reset(); } catch (_) { }
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    setScanStatus("error", "Error: " + err.message);
  }
});

function showScanResult(value) {
  document.getElementById("scanResultVal").textContent = value;
  document.getElementById("scanResult").style.display = "flex";
}

document.getElementById("btnUseScan").addEventListener("click", () => {
  const val = document.getElementById("scanResultVal").textContent;
  document.getElementById("inputInvoiceScan").value = val;
  document.getElementById("scanResult").style.display = "none";
  setScanStatus("");
});

function setScanStatus(state, msg = "") {
  let el = document.getElementById("scanStatusInvoice");
  if (!el) {
    el = document.createElement("div");
    el.id = "scanStatusInvoice";
    el.className = "scan-status-bar";
    const scanActions = document.querySelector("#panelScan .scan-actions");
    if (scanActions) scanActions.insertAdjacentElement("afterend", el);
    else return;
  }
  if (!state) { el.style.display = "none"; return; }
  el.style.display = "flex";
  el.setAttribute("data-state", state);
  el.innerHTML = state === "loading"
    ? `<span class="spin"></span><span>${msg}</span>`
    : state === "scanning"
      ? `<i class="bx bx-barcode-reader"></i><span>${msg}</span>`
      : `<i class="bx bx-error-circle"></i><span>${msg}</span>`;
}

// ===== SIMPAN ke Supabase =====
document.getElementById("simpanBtn").addEventListener("click", simpanData);

async function simpanData() {
  let invoice, tanggal, supplier;
  if (currentTab === "manual") {
    invoice = document.getElementById("inputInvoice").value.trim();
    tanggal = document.getElementById("inputTanggal").value;
    supplier = ddSupplier.getValue();
  } else {
    invoice = document.getElementById("inputInvoiceScan").value.trim();
    tanggal = document.getElementById("inputTanggalScan").value;
    supplier = ddSupplierScan.getValue();
  }

  if (!invoice || !tanggal || !supplier) {
    errorMsg.textContent = "Semua field harus diisi!";
    return;
  }

  // Cek duplikat invoice_no
  const { data: dup } = await sb.from("invoices").select("id").eq("invoice_no", invoice).maybeSingle();
  if (dup) {
    errorMsg.textContent = "Invoice sudah ada!";
    return;
  }

  // Auto-add supplier jika belum ada
  await autoAddSupplier(supplier);

  const { error } = await sb.from("invoices").insert({
    invoice_no: invoice,
    tanggal: tanggal,
    supplier: supplier,
    total: 0,
    total_harga: 0,
  });

  if (error) {
    errorMsg.textContent = "Gagal menyimpan: " + error.message;
    return;
  }

  tutupModal();
  await loadAllInvoices();
  renderTable();
}

// ===== HAPUS =====
document.getElementById("confirmYes").addEventListener("click", async () => {
  if (rowToDelete) {
    const id = rowToDelete.dataset.invoiceId;
    // Hapus invoice (cascade ke invoice_items via FK)
    const { error } = await sb.from("invoices").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
    } else {
      allInvoices = allInvoices.filter((inv) => inv.id !== id);
      rowToDelete = null;
      renderTable();
    }
  }
  confirmOverlay.classList.remove("active");
});

document.getElementById("confirmNo").addEventListener("click", () => {
  rowToDelete = null;
  confirmOverlay.classList.remove("active");
});
confirmOverlay.addEventListener("click", (e) => {
  if (e.target === confirmOverlay) {
    rowToDelete = null;
    confirmOverlay.classList.remove("active");
  }
});

// ===== TUTUP MODAL =====
function tutupModal() {
  stopInvScanner();
  modalOverlay.classList.remove("active");
  errorMsg.textContent = "";
  document.getElementById("inputInvoice").value = "";
  document.getElementById("inputTanggal").value = "";
  document.getElementById("inputInvoiceScan").value = "";
  document.getElementById("inputTanggalScan").value = "";
  document.getElementById("scanResult").style.display = "none";
  ddSupplier.clear();
  ddSupplierScan.clear();
}

// ===== SYNC saat tab kembali aktif =====
window.addEventListener("focus", async () => {
  await loadAllInvoices();
  renderTable();
});

// ===== SAFETY NET =====
window.addEventListener("beforeunload", () => stopInvScanner());
window.addEventListener("pagehide", () => stopInvScanner());
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") stopInvScanner();
});

// ===== INIT =====
(async function init() {
  await loadAllInvoices();
  renderTable();
})();
