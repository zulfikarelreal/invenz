// ===== INVOICE.JS — Supabase version =====
"use strict";

const params = new URLSearchParams(window.location.search);
const invoiceId = params.get("id"); // ini adalah UUID dari tabel invoices
const backBtn = document.getElementById("backBtn");
const navInvoiceId = document.getElementById("navInvoiceId");
const invoiceInfo = document.getElementById("invoiceInfo");
const itemTableBody = document.getElementById("itemTableBody");
const openTambahBtn = document.getElementById("openTambahBtn");
const modalOverlay = document.getElementById("modalOverlay");
const confirmOverlay = document.getElementById("confirmOverlay");
const batalBtn = document.getElementById("batalBtn");
const simpanBtn = document.getElementById("simpanBtn");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const errorMsg = document.getElementById("errorMsg");
const inputStok = document.getElementById("inputStok");
const inputHargaHPP = document.getElementById("inputHargaHPP");
const inputHargaJual = document.getElementById("inputHargaJual");
const subtotalVal = document.getElementById("subtotalVal");
const totalHargaDisplay = document.getElementById("totalHargaDisplay");
const autofillNotice = document.getElementById("autofillNotice");

let rowCount = 0;
let rowToDelete = null;
let editRowIndex = null; // index dalam _currentItems
let _invoiceData = null; // data invoice header
let _currentItems = [];  // items dari Supabase

// ========================================================
// ===== SCANNER STATE ====================================
// ========================================================
const SKU_SCAN = { stream: null, reader: null, active: false, done: false };

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

function stopSKUScanner() {
  SKU_SCAN.active = false;
  SKU_SCAN.done = false;
  if (SKU_SCAN.reader) { try { SKU_SCAN.reader.reset(); } catch (_) { } SKU_SCAN.reader = null; }
  if (SKU_SCAN.stream) { try { SKU_SCAN.stream.getTracks().forEach((t) => t.stop()); } catch (_) { } SKU_SCAN.stream = null; }
  const video = document.getElementById("cameraStreamSKU");
  if (video) { try { video.pause(); video.srcObject = null; } catch (_) { } }
  const ph = document.getElementById("scanPlaceholderSKU");
  if (ph) ph.style.display = "flex";
  setSKUScanStatus("");
}

function closeSKUPanel() {
  stopSKUScanner();
  document.getElementById("scannerSKUPanel")?.classList.add("hidden");
  document.getElementById("scanResultSKU")?.classList.add("hidden");
}

function setSKUScanStatus(state, msg = "") {
  let el = document.getElementById("skuScanStatus");
  if (!el) {
    el = document.createElement("div");
    el.id = "skuScanStatus";
    el.className = "scan-status";
    const panel = document.getElementById("scannerSKUPanel");
    if (panel) panel.appendChild(el);
    else return;
  }
  if (!state) { el.style.display = "none"; return; }
  el.style.display = "flex";
  el.setAttribute("data-state", state);
  el.innerHTML = state === "loading"
    ? `<span class="spin"></span><span>${msg}</span>`
    : state === "scanning"
      ? `<i class="bx bx-scan"></i><span>${msg}</span>`
      : `<i class="bx bx-error-circle"></i><span>${msg}</span>`;
}

// ========================================================
// ===== CUSTOM DROPDOWNS =================================
// ========================================================
const ddNama = new CustomDropdown("cdNama", "barang", { icon: "bx-package" });
const ddKategori = new CustomDropdown("cdKategori", "kategori", { icon: "bx-category" });
const ddMerk = new CustomDropdown("cdMerk", "merk", { icon: "bx-purchase-tag" });
const ddLokasi = new CustomDropdown("cdLokasi", "lokasi", { icon: "bx-map" });

// ========================================================
// ===== HELPERS ==========================================
// ========================================================
function formatRp(num) {
  if (!num || num === 0) return "Rp 0";
  return "Rp " + parseInt(num).toLocaleString("id-ID");
}

// ========================================================
// ===== SUPABASE DATA LOADERS ============================
// ========================================================
async function loadMasterData() {
  const [barang, kategori, merk, lokasi] = await Promise.all([
    sb.from("barang").select("nama").order("nama"),
    sb.from("kategori").select("nama").order("nama"),
    sb.from("merk").select("nama").order("nama"),
    sb.from("lokasi").select("nama").order("nama"),
  ]);
  ddNama.setOptions((barang.data || []).map(x => x.nama));
  ddKategori.setOptions((kategori.data || []).map(x => x.nama));
  ddMerk.setOptions((merk.data || []).map(x => x.nama));
  ddLokasi.setOptions((lokasi.data || []).map(x => x.nama));
}

async function loadInvoiceItems() {
  const { data, error } = await sb
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("id");
  if (error) { console.error(error); return []; }
  return data || [];
}

async function findSKUInSupabase(sku) {
  if (!sku) return null;
  const { data } = await sb.from("barang").select("*").eq("sku", sku).maybeSingle();
  return data;
}

async function upsertBarang(item) {
  if (!item.sku || !item.nama) return;
  // Upsert ke barang (katalog SKU)
  await sb.from("barang").upsert(
    { sku: item.sku, nama: item.nama, merk: item.merk || null, kategori: item.kategori || null },
    { onConflict: "sku" }
  );
  // Upsert merk & kategori ke master
  if (item.merk) await sb.from("merk").upsert({ nama: item.merk }, { onConflict: "nama", ignoreDuplicates: true });
  if (item.kategori) await sb.from("kategori").upsert({ nama: item.kategori }, { onConflict: "nama", ignoreDuplicates: true });
  if (item.lokasi) await sb.from("lokasi").upsert({ nama: item.lokasi }, { onConflict: "nama", ignoreDuplicates: true });
}

async function updateInvoiceTotals() {
  const items = _currentItems;
  const total = items.reduce((s, i) => s + (parseInt(i.stok) || 0), 0);
  const totalHarga = items.reduce((s, i) => s + (parseFloat(i.harga_hpp) || 0) * (parseInt(i.stok) || 0), 0);
  await sb.from("invoices").update({ total, total_harga: totalHarga }).eq("id", invoiceId);
  // Update UI
  const t = document.getElementById("infoTotal");
  if (t) t.textContent = total;
  const h = document.getElementById("infoHarga");
  if (h) h.textContent = formatRp(totalHarga);
  updateTotalHargaDisplay();
  updateStatJenis();
}

// ========================================================
// ===== SUBTOTAL PREVIEW =================================
// ========================================================
function updateSubtotalPreview() {
  subtotalVal.textContent = formatRp(
    (parseInt(inputStok.value) || 0) * (parseFloat(inputHargaHPP.value) || 0)
  );
}
inputStok.addEventListener("input", updateSubtotalPreview);
inputHargaHPP.addEventListener("input", updateSubtotalPreview);

// ========================================================
// ===== SKU AUTOFILL =====================================
// ========================================================
async function handleSKULookup(sku) {
  if (!sku) return;
  const found = await findSKUInSupabase(sku);
  if (found) {
    ddNama.setValue(found.nama || "");
    ddMerk.setValue(found.merk || "");
    ddKategori.setValue(found.kategori || "");
    autofillNotice.classList.remove("hidden");
    inputStok.focus();
  } else {
    autofillNotice.classList.add("hidden");
  }
}

document.getElementById("inputSKU").addEventListener("blur", function () {
  handleSKULookup(this.value.trim());
});
document.getElementById("inputSKU").addEventListener("keydown", function (e) {
  if (e.key === "Enter") handleSKULookup(this.value.trim());
});

// ========================================================
// ===== SCANNER EVENTS ===================================
// ========================================================
document.getElementById("btnScanSKU").addEventListener("click", () => {
  const panel = document.getElementById("scannerSKUPanel");
  panel.classList.contains("hidden") ? panel.classList.remove("hidden") : closeSKUPanel();
});
document.getElementById("btnCloseScannerSKU").addEventListener("click", closeSKUPanel);

document.getElementById("btnOpenCamSKU").addEventListener("click", async () => {
  stopSKUScanner();
  setSKUScanStatus("loading", "Memuat scanner...");
  try {
    await loadZXing();
    const reader = new ZXing.BrowserMultiFormatReader();
    SKU_SCAN.reader = reader;
    SKU_SCAN.done = false;
    const video = document.getElementById("cameraStreamSKU");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    SKU_SCAN.stream = stream;
    SKU_SCAN.active = true;
    video.srcObject = stream;
    document.getElementById("scanPlaceholderSKU").style.display = "none";
    setSKUScanStatus("scanning", "Arahkan ke barcode SKU produk...");
    reader.decodeFromStream(stream, video, (result) => {
      if (SKU_SCAN.done || !SKU_SCAN.active) return;
      if (result) {
        SKU_SCAN.done = true;
        const text = result.getText();
        document.getElementById("scanResultValSKU").textContent = text;
        document.getElementById("scanResultSKU").classList.remove("hidden");
        setSKUScanStatus("");
        stopSKUScanner();
      }
    });
  } catch (err) {
    stopSKUScanner();
    setSKUScanStatus("error",
      err.message.includes("getUserMedia") || err.message.includes("Permission")
        ? "Izin kamera ditolak."
        : "Kamera gagal: " + err.message
    );
  }
});

document.getElementById("galleryInputSKU").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  this.value = "";
  setSKUScanStatus("loading", "Membaca barcode dari gambar...");
  try {
    await loadZXing();
    const reader = new ZXing.BrowserMultiFormatReader();
    const url = URL.createObjectURL(file);
    try {
      const result = await reader.decodeFromImageUrl(url);
      document.getElementById("scanResultValSKU").textContent = result.getText();
      document.getElementById("scanResultSKU").classList.remove("hidden");
      setSKUScanStatus("");
    } catch (_) {
      setSKUScanStatus("error", "Barcode tidak terbaca. Coba foto lebih dekat & kontras.");
    } finally {
      try { reader.reset(); } catch (_) { }
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    setSKUScanStatus("error", "Error: " + err.message);
  }
});

document.getElementById("btnUseScanSKU").addEventListener("click", () => {
  const val = document.getElementById("scanResultValSKU").textContent;
  document.getElementById("inputSKU").value = val;
  document.getElementById("scanResultSKU").classList.add("hidden");
  closeSKUPanel();
  handleSKULookup(val);
});

// ========================================================
// ===== INIT =============================================
// ========================================================
async function init() {
  if (!invoiceId) {
    invoiceInfo.innerHTML = '<p style="color:red">Invoice tidak ditemukan.</p>';
    return;
  }

  // Load invoice header
  const { data: invData, error: invErr } = await sb
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invErr || !invData) {
    invoiceInfo.innerHTML = `<div class="info-item"><span class="info-label">Invoice</span><span class="info-value">Tidak ditemukan</span></div>`;
    return;
  }

  _invoiceData = invData;
  navInvoiceId.textContent = invData.invoice_no;
  renderInfo(invData);

  // Load items
  _currentItems = await loadInvoiceItems();
  renderSemuaBaris();
  updateTotalHargaDisplay();
  updateStatJenis();

  // Load master data untuk dropdown
  await loadMasterData();
}

function renderInfo(data) {
  invoiceInfo.innerHTML = `
    <div class="info-item"><span class="info-label">Invoice</span><span class="info-value">${data.invoice_no}</span></div>
    <div class="info-item"><span class="info-label">Tanggal Masuk</span><span class="info-value">${data.tanggal}</span></div>
    <div class="info-item"><span class="info-label">Nama Supplier</span><span class="info-value">${data.supplier || "—"}</span></div>
    <div class="info-item"><span class="info-label">Total Qty</span><span class="info-value" id="infoTotal">${data.total || 0}</span></div>
    <div class="info-item"><span class="info-label">Jenis Barang</span><span class="info-value" id="infoJenis">0</span></div>
    <div class="info-item"><span class="info-label">Total Harga</span><span class="info-value" id="infoHarga" style="color:skyblue">${formatRp(data.total_harga || 0)}</span></div>
  `;
}

function updateStatJenis() {
  const namaSet = new Set();
  _currentItems.forEach((item) => { if (item.nama) namaSet.add(item.nama.toLowerCase()); });
  const el = document.getElementById("infoJenis");
  if (el) el.textContent = namaSet.size;
}

function updateTotalHargaDisplay() {
  const totalH = _currentItems.reduce(
    (s, i) => s + (parseFloat(i.harga_hpp) || 0) * (parseInt(i.stok) || 0), 0
  );
  totalHargaDisplay.textContent = formatRp(totalH);
}

// ========================================================
// ===== MODAL TAMBAH / EDIT BARANG =======================
// ========================================================
openTambahBtn.addEventListener("click", () => {
  editRowIndex = null;
  bukaModal();
});

function bukaModal(item = null) {
  subtotalVal.textContent = "Rp 0";
  autofillNotice.classList.add("hidden");
  errorMsg.textContent = "";

  const modalTitle = document.querySelector(".modal-top-bar h3");
  if (modalTitle)
    modalTitle.innerHTML = item
      ? '<i class="bx bx-edit"></i> Edit Barang'
      : '<i class="bx bx-package"></i> Tambah Barang';
  const btnLabel = document.getElementById("simpanBtn");
  if (btnLabel)
    btnLabel.innerHTML = item
      ? '<i class="bx bx-save"></i> Update'
      : '<i class="bx bx-save"></i> Simpan';

  if (item) {
    document.getElementById("inputSKU").value = item.sku || "";
    ddNama.setValue(item.nama || "");
    ddMerk.setValue(item.merk || "");
    ddKategori.setValue(item.kategori || "");
    ddLokasi.setValue(item.lokasi || "");
    document.getElementById("inputExpired").value = item.expired && item.expired !== "-" ? item.expired : "";
    inputHargaHPP.value = item.harga_hpp || "";
    inputHargaJual.value = item.harga_jual || "";
    inputStok.value = item.stok || "";
    updateSubtotalPreview();
  } else {
    clearForm();
  }

  modalOverlay.classList.add("active");
}

document.getElementById("modalCloseX").addEventListener("click", tutupModal);
batalBtn.addEventListener("click", tutupModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) tutupModal(); });
simpanBtn.addEventListener("click", simpanItem);

function tutupModal() {
  closeSKUPanel();
  modalOverlay.classList.remove("active");
  editRowIndex = null;
  clearForm();
}

function clearForm() {
  ["inputSKU", "inputExpired", "inputHargaHPP", "inputHargaJual"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  inputStok.value = "";
  subtotalVal.textContent = "Rp 0";
  errorMsg.textContent = "";
  autofillNotice.classList.add("hidden");
  ddNama.clear();
  ddKategori.clear();
  ddMerk.clear();
  ddLokasi.clear();
}

async function simpanItem() {
  const sku = document.getElementById("inputSKU").value.trim();
  const nama = ddNama.getValue();
  const merk = ddMerk.getValue();
  const kategori = ddKategori.getValue();
  const lokasi = ddLokasi.getValue();
  const expired = document.getElementById("inputExpired").value || null;
  const harga_hpp = parseFloat(inputHargaHPP.value.trim()) || 0;
  const harga_jual = parseFloat(inputHargaJual.value.trim()) || 0;
  const stok = parseInt(inputStok.value.trim()) || 0;

  if (!sku || !nama || !merk || !kategori || !lokasi || !stok || !harga_hpp) {
    errorMsg.textContent = "Semua field bertanda * wajib diisi, termasuk Lokasi Inventori!";
    return;
  }
  if (stok < 1) {
    errorMsg.textContent = "Stok minimal 1!";
    return;
  }

  const itemPayload = {
    invoice_id: invoiceId,
    sku: sku || null,
    nama,
    merk,
    kategori,
    lokasi,
    expired: expired || null,
    harga_hpp,
    harga_jual,
    stok,
  };

  // Upsert ke katalog barang & master data
  await upsertBarang({ sku, nama, merk, kategori, lokasi });

  if (editRowIndex !== null) {
    // EDIT: jangan update stok_awal, biarkan tetap seperti histori awal
    const itemId = _currentItems[editRowIndex].id;
    const { error } = await sb.from("invoice_items").update(itemPayload).eq("id", itemId);
    if (error) { errorMsg.textContent = "Gagal update: " + error.message; return; }
    _currentItems[editRowIndex] = { ..._currentItems[editRowIndex], ...itemPayload };
  } else {
    // TAMBAH BARU: stok_awal = stok yang diinput sekarang
    const { data: newItem, error } = await sb
      .from("invoice_items")
      .insert({ ...itemPayload, stok_awal: stok })
      .select()
      .single();
    if (error) { errorMsg.textContent = "Gagal simpan: " + error.message; return; }
    _currentItems.push(newItem);
  }

  await updateInvoiceTotals();
  renderSemuaBaris();
  tutupModal();
}

// ========================================================
// ===== RENDER ULANG SELURUH TABEL =======================
// ========================================================
function renderSemuaBaris() {
  itemTableBody.innerHTML = "";
  rowCount = 0;
  if (!_currentItems || _currentItems.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    tr.innerHTML = '<td colspan="12">Belum ada barang — klik "+ Tambah Barang" untuk menambah</td>';
    itemTableBody.appendChild(tr);
    return;
  }
  _currentItems.forEach((item, idx) => tambahBaris(item, false, idx));
}

// ========================================================
// ===== RENDER BARIS TABEL ===============================
// ========================================================
function tambahBaris(item, removeEmpty = true, itemIndex) {
  if (removeEmpty) itemTableBody.querySelector(".empty-row")?.remove();
  rowCount++;
  const subtotal = (parseFloat(item.harga_hpp) || 0) * (parseInt(item.stok) || 0);
  const stokAwal = item.stok_awal ?? item.stok; // fallback kalau data lama belum ada stok_awal
  const tr = document.createElement("tr");
  tr.dataset.itemIndex = itemIndex;

  tr.innerHTML = `
    <td>${rowCount}</td>
    <td>
      <button class="sku-badge sku-badge-btn" title="Lihat Barcode SKU" data-sku="${item.sku || "-"}">
        <i class="bx bx-barcode" style="font-size:13px;vertical-align:middle;margin-right:3px"></i>${item.sku || "-"}
      </button>
    </td>
    <td>${item.nama}</td>
    <td>${item.merk || "—"}</td>
    <td>${item.kategori || "—"}</td>
    <td>${item.lokasi || "-"}</td>
    <td>${item.expired && item.expired !== "-" ? item.expired : '<span class="no-expired">—</span>'}</td>
    <td>${formatRp(item.harga_hpp || 0)}</td>
    <td>${formatRp(item.harga_jual || 0)}</td>
    <td style="color:var(--text2);font-weight:600">${stokAwal}</td>
    <td style="font-weight:700;color:${item.stok < stokAwal ? 'var(--warning)' : 'var(--text)'}">${item.stok}</td>
    <td style="font-weight:700;color:skyblue">${formatRp(subtotal)}</td>
    <td>
      <div style="display:flex;gap:4px;justify-content:center;align-items:center">
        <button class="btn-edit-item" title="Edit"><i class="bx bx-edit"></i></button>
        <button class="btn-hapus"     title="Hapus"><i class="bx bx-trash"></i></button>
      </div>
    </td>
  `;
  // ... sisanya tetap sama (event listener sku-badge-btn, btn-edit-item, btn-hapus)

  tr.querySelector(".sku-badge-btn").addEventListener("click", () => {
    openBarcodePopup({ sku: item.sku, nama: item.nama, merk: item.merk, kategori: item.kategori });
  });

  tr.querySelector(".btn-edit-item").addEventListener("click", () => {
    editRowIndex = parseInt(tr.dataset.itemIndex);
    const currentItem = _currentItems[editRowIndex];
    if (currentItem) bukaModal(currentItem);
  });

  tr.querySelector(".btn-hapus").addEventListener("click", () => {
    rowToDelete = tr;
    confirmOverlay.classList.add("active");
  });

  itemTableBody.appendChild(tr);
}

// ========================================================
// ===== BARCODE POPUP ====================================
// ========================================================
(function injectBarcodeOverlay() {
  if (document.getElementById("invoiceBarcodOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "invoiceBarcodOverlay";
  overlay.style.cssText =
    "display:none;position:fixed;inset:0;background:rgba(5,8,20,0.82);backdrop-filter:blur(8px);z-index:9999;justify-content:center;align-items:center;padding:20px";
  overlay.innerHTML = `
    <div style="background:#131929;border:1px solid rgba(255,255,255,0.10);border-radius:18px;
                box-shadow:0 24px 64px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.04);
                padding:0;width:min(400px,100%);display:flex;flex-direction:column;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:center;position:relative;
                  padding:18px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.07)">
        <div style="display:flex;align-items:center;gap:9px">
          <i class="bx bx-barcode" style="font-size:22px;color:#4F8EF7"></i>
          <span style="font-size:16px;font-weight:700;color:#E8ECFF;letter-spacing:0.2px">Barcode SKU</span>
        </div>
        <button id="invBcClose"
          style="position:absolute;right:16px;top:50%;transform:translateY(-50%);
                 background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
                 border-radius:8px;cursor:pointer;width:30px;height:30px;
                 display:flex;align-items:center;justify-content:center;color:#8B97C2">
          <i class="bx bx-x" style="font-size:18px"></i>
        </button>
      </div>
      <div id="invBcInfo" style="margin:16px 20px 0;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden"></div>
      <div style="margin:16px 20px 0;background:#ffffff;border-radius:10px;padding:18px 16px;display:flex;justify-content:center;align-items:center;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.3)">
        <svg id="invBcSvg" style="max-width:100%;height:auto;display:block"></svg>
      </div>
      <div style="display:flex;gap:10px;padding:16px 20px 20px">
        <button id="invBcDownload" style="flex:1;padding:10px 12px;font-size:13px;font-weight:600;border-radius:9px;border:none;background:linear-gradient(135deg,#4F8EF7,#2563EB);color:#fff;box-shadow:0 4px 16px rgba(79,142,247,0.35);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;font-family:inherit">
          <i class="bx bx-download" style="font-size:17px"></i> Download PNG
        </button>
        <button id="invBcPrint" style="flex:1;padding:10px 12px;font-size:13px;font-weight:600;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);color:#E8ECFF;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;font-family:inherit">
          <i class="bx bx-printer" style="font-size:17px"></i> Print
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById("invBcClose").addEventListener("click", closeInvBarcodePopup);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeInvBarcodePopup(); });

  document.getElementById("invBcDownload").addEventListener("click", () => {
    const svg = document.getElementById("invBcSvg");
    const item = overlay._currentItem;
    if (!item) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const img = new Image();
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      canvas.width = img.width || 300;
      canvas.height = img.height || 150;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `SKU_${item.sku}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  });

  document.getElementById("invBcPrint").addEventListener("click", () => {
    if (!overlay._currentItem) return;
    const svg = document.getElementById("invBcSvg");
    const item = overlay._currentItem;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const win = window.open("", "_blank", "width=420,height=320");
    win.document.write(`<!DOCTYPE html><html><head><title>Print Barcode — ${item.sku}</title>
      <style>body{margin:0;padding:24px;font-family:Poppins,sans-serif;display:flex;flex-direction:column;align-items:center}
      .n{font-size:15px;font-weight:700;text-align:center;margin-bottom:4px}
      .m{font-size:12px;color:#555;text-align:center;margin-bottom:12px}
      img{max-width:320px}@media print{body{padding:8px}}</style></head><body>
      <div class="n">${item.nama}</div>
      <div class="m">SKU: ${item.sku}${item.merk ? " · " + item.merk : ""}</div>
      <img src="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}"/>
      <script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
    win.document.close();
  });
})();

let _jsBarcodePending = false;
function ensureJsBarcode(cb) {
  if (window.JsBarcode) { cb(); return; }
  if (_jsBarcodePending) { setTimeout(() => ensureJsBarcode(cb), 200); return; }
  _jsBarcodePending = true;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
  s.onload = () => { _jsBarcodePending = false; cb(); };
  s.onerror = () => { _jsBarcodePending = false; };
  document.head.appendChild(s);
}

function openBarcodePopup(item) {
  const overlay = document.getElementById("invoiceBarcodOverlay");
  overlay._currentItem = item;

  const rows = [
    { label: "NAMA", value: item.nama || "—", isSku: false },
    { label: "SKU", value: item.sku || "—", isSku: true },
    { label: "MERK", value: item.merk || "—", isSku: false },
    { label: "KATEGORI", value: item.kategori || "—", isSku: false },
  ];

  document.getElementById("invBcInfo").innerHTML = rows.map((r, i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;${i < rows.length - 1 ? "border-bottom:1px solid rgba(255,255,255,0.06)" : ""}">
      <span style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:#4D5A80;min-width:64px;text-transform:uppercase;font-family:'DM Mono',monospace">${r.label}</span>
      ${r.isSku
      ? `<span style="font-size:13px;font-weight:700;color:#4F8EF7;background:rgba(79,142,247,0.15);border:1px solid rgba(79,142,247,0.35);padding:2px 10px;border-radius:6px;font-family:'DM Mono',monospace;letter-spacing:0.5px">${r.value}</span>`
      : `<span style="font-size:13px;font-weight:500;color:#E8ECFF">${r.value}</span>`}
    </div>`).join("");

  overlay.style.display = "flex";

  ensureJsBarcode(() => {
    try {
      JsBarcode("#invBcSvg", item.sku, {
        format: "CODE128", width: 2, height: 80, displayValue: true,
        fontSize: 14, margin: 12, background: "#ffffff", lineColor: "#000000", fontOptions: "bold",
      });
    } catch (_) {
      document.getElementById("invBcSvg").innerHTML =
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="red" font-size="12">SKU tidak valid untuk barcode</text>';
    }
  });
}

function closeInvBarcodePopup() {
  const overlay = document.getElementById("invoiceBarcodOverlay");
  overlay.style.display = "none";
  overlay._currentItem = null;
}

// ========================================================
// ===== HAPUS BARIS ======================================
// ========================================================
confirmYes.addEventListener("click", async () => {
  if (rowToDelete) {
    const idx = parseInt(rowToDelete.dataset.itemIndex);
    const itemId = _currentItems[idx]?.id;
    if (itemId) {
      const { error } = await sb.from("invoice_items").delete().eq("id", itemId);
      if (error) { alert("Gagal hapus: " + error.message); }
      else {
        _currentItems.splice(idx, 1);
        await updateInvoiceTotals();
        renderSemuaBaris();
      }
    }
    rowToDelete = null;
  }
  confirmOverlay.classList.remove("active");
});

confirmNo.addEventListener("click", () => {
  rowToDelete = null;
  confirmOverlay.classList.remove("active");
});
confirmOverlay.addEventListener("click", (e) => {
  if (e.target === confirmOverlay) {
    rowToDelete = null;
    confirmOverlay.classList.remove("active");
  }
});

// ========================================================
// ===== NAVIGASI & SAFETY NET ============================
// ========================================================
backBtn.addEventListener("click", () => {
  stopSKUScanner();
  window.location.href = "inputBarang.html";
});
window.addEventListener("beforeunload", () => stopSKUScanner());
window.addEventListener("pagehide", () => stopSKUScanner());
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") stopSKUScanner();
});

init();
