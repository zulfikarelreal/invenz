const params = new URLSearchParams(window.location.search);
const invoiceId = params.get("id");
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
let cameraStreamSKU = null;
let cameraStreamExpired = null;
let scanLoopSKU = null;
let scanLoopExpired = null;

// ========================================================
// ===== LOAD ZXING (lazy) ================================
// ========================================================
let ZXingReader = null;
async function getZXingReader() {
  if (ZXingReader) return ZXingReader;
  if (!window.ZXing) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Gagal memuat ZXing"));
      document.head.appendChild(s);
    });
  }
  ZXingReader = new ZXing.BrowserMultiFormatReader();
  return ZXingReader;
}

// ========================================================
// ===== LOAD TESSERACT (lazy) ============================
// ========================================================
let tesseractReady = false;
async function loadTesseract() {
  if (tesseractReady) return;
  if (!window.Tesseract) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Gagal memuat Tesseract"));
      document.head.appendChild(s);
    });
  }
  tesseractReady = true;
}

// ===== DROPDOWNS =====
const ddNama = new CustomDropdown("cdNama", "barang", { icon: "bx-package" });
const ddKategori = new CustomDropdown("cdKategori", "kategori", {
  icon: "bx-category",
});
const ddMerk = new CustomDropdown("cdMerk", "merk", {
  icon: "bx-purchase-tag",
});

// ===== FORMAT RP =====
function formatRp(num) {
  if (!num || num === 0) return "Rp 0";
  return "Rp " + parseInt(num).toLocaleString("id-ID");
}

// ===== LINKED DATA HELPERS =====
function getLinkedData() {
  try {
    const d = JSON.parse(localStorage.getItem("linkedData") || "{}");
    return {
      supplier: d.supplier || [],
      barang: d.barang || [],
      kategori: d.kategori || [],
      merk: d.merk || [],
      lokasi: d.lokasi || [],
      penerima: d.penerima || [],
      sku: d.sku || [],
    };
  } catch {
    return {
      supplier: [],
      barang: [],
      kategori: [],
      merk: [],
      lokasi: [],
      penerima: [],
      sku: [],
    };
  }
}

function autoAddToLinkedData(key, value) {
  if (!value || value === "-") return;
  const existing = JSON.parse(localStorage.getItem("linkedData") || "{}");
  if (!existing[key]) existing[key] = [];
  if (!existing[key].includes(value)) {
    existing[key].push(value);
    localStorage.setItem("linkedData", JSON.stringify(existing));
  }
}

function autoAddSKUToLinkedData(skuObj) {
  const existing = JSON.parse(localStorage.getItem("linkedData") || "{}");
  if (!existing.sku) existing.sku = [];
  const idx = existing.sku.findIndex((s) => s.sku === skuObj.sku);
  if (idx === -1) existing.sku.push(skuObj);
  else existing.sku[idx] = skuObj;
  localStorage.setItem("linkedData", JSON.stringify(existing));
}

function findSKUInLinkedData(sku) {
  return (getLinkedData().sku || []).find((s) => s.sku === sku) || null;
}

// ===== GLOBAL STOCK SYNC =====
function syncToGlobalStock(item) {
  const gs = JSON.parse(localStorage.getItem("globalStock") || "{}");
  const key = item.sku || item.nama;
  if (!gs[key]) {
    gs[key] = {
      sku: item.sku || "",
      nama: item.nama,
      merk: item.merk,
      kategori: item.kategori,
      hargaHPP: item.hargaHPP,
      hargaJual: item.hargaJual,
      totalStok: parseInt(item.stok) || 0,
    };
  } else {
    gs[key].hargaHPP = item.hargaHPP;
    gs[key].hargaJual = item.hargaJual;
    gs[key].totalStok =
      (parseInt(gs[key].totalStok) || 0) + (parseInt(item.stok) || 0);
  }
  localStorage.setItem("globalStock", JSON.stringify(gs));
}

function removeFromGlobalStock(item) {
  const gs = JSON.parse(localStorage.getItem("globalStock") || "{}");
  const key = item.sku || item.nama;
  if (gs[key]) {
    gs[key].totalStok = Math.max(
      0,
      (parseInt(gs[key].totalStok) || 0) - (parseInt(item.stok) || 0),
    );
    localStorage.setItem("globalStock", JSON.stringify(gs));
  }
}

// ===== PREVIEW SUBTOTAL =====
function updateSubtotalPreview() {
  subtotalVal.textContent = formatRp(
    (parseInt(inputStok.value) || 0) * (parseFloat(inputHargaHPP.value) || 0),
  );
}
inputStok.addEventListener("input", updateSubtotalPreview);
inputHargaHPP.addEventListener("input", updateSubtotalPreview);

// ===== SKU AUTOFILL =====
document.getElementById("inputSKU").addEventListener("blur", function () {
  handleSKULookup(this.value.trim());
});
document.getElementById("inputSKU").addEventListener("keydown", function (e) {
  if (e.key === "Enter") handleSKULookup(this.value.trim());
});

function handleSKULookup(sku) {
  if (!sku) return;
  const found = findSKUInLinkedData(sku);
  if (found) {
    document.getElementById("inputNama").value = found.nama || "";
    document.getElementById("inputMerk").value = found.merk || "";
    document.getElementById("inputKategori").value = found.kategori || "";
    if (ddNama.setValue) ddNama.setValue(found.nama || "");
    if (ddMerk.setValue) ddMerk.setValue(found.merk || "");
    if (ddKategori.setValue) ddKategori.setValue(found.kategori || "");
    autofillNotice.classList.remove("hidden");
    inputStok.focus();
  } else {
    autofillNotice.classList.add("hidden");
  }
}

// ========================================================
// ===== SCANNER SKU — ZXing ==============================
// ========================================================

document.getElementById("btnScanSKU").addEventListener("click", () => {
  document.getElementById("scannerSKUPanel").classList.toggle("hidden");
});
document
  .getElementById("btnCloseScannerSKU")
  .addEventListener("click", () => closeScanner("SKU"));

document
  .getElementById("btnOpenCamSKU")
  .addEventListener("click", () => startCameraBarcode("SKU"));

document
  .getElementById("galleryInputSKU")
  .addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    await decodeImageBarcode(file, "SKU");
    this.value = "";
  });

document.getElementById("btnUseScanSKU").addEventListener("click", () => {
  const val = document.getElementById("scanResultValSKU").textContent;
  document.getElementById("inputSKU").value = val;
  document.getElementById("scanResultSKU").classList.add("hidden");
  closeScanner("SKU");
  handleSKULookup(val);
});

// ========================================================
// ===== SCANNER EXPIRED — ZXing + Tesseract ==============
// ========================================================

document.getElementById("btnScanExpired").addEventListener("click", () => {
  document.getElementById("scannerExpiredPanel").classList.toggle("hidden");
});
document
  .getElementById("btnCloseScannerExpired")
  .addEventListener("click", () => closeScanner("Expired"));

document
  .getElementById("btnOpenCamExpired")
  .addEventListener("click", () => startCameraExpired());

document
  .getElementById("galleryInputExpired")
  .addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    await decodeImageExpired(file);
    this.value = "";
  });

document.getElementById("btnUseScanExpired").addEventListener("click", () => {
  const val = document.getElementById("scanResultValExpired").textContent;
  const parsed = parseExpiredDate(val);
  if (parsed) {
    document.getElementById("inputExpired").value = parsed;
  } else {
    alert(`Tanggal terdeteksi: "${val}"\nSilakan koreksi manual jika perlu.`);
  }
  document.getElementById("scanResultExpired").classList.add("hidden");
  closeScanner("Expired");
});

// ========================================================
// ===== KAMERA + ZXing continuous decode =================
// ========================================================

async function startCameraBarcode(type) {
  setScanStatus(type, "loading", "Memuat scanner...");
  try {
    const reader = await getZXingReader();
    const video = document.getElementById(`cameraStream${type}`);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    video.srcObject = stream;
    if (type === "SKU") cameraStreamSKU = stream;
    else cameraStreamExpired = stream;
    document.getElementById(`scanPlaceholder${type}`).style.display = "none";
    setScanStatus(type, "scanning", "Arahkan ke barcode...");

    // ZXing terus-menerus decode dari stream
    reader.decodeFromStream(stream, video, (result, err) => {
      if (result) {
        showScanResult(type, result.getText());
        stopScanLoop(type);
        stopCamera(type);
        setScanStatus(type, "");
      }
      // NotFoundException diabaikan — normal saat belum ada barcode di frame
    });
    if (type === "SKU") scanLoopSKU = reader;
    else scanLoopExpired = reader;
  } catch (err) {
    setScanStatus(type, "error", "Kamera gagal: " + err.message);
  }
}

async function startCameraExpired() {
  setScanStatus("Expired", "loading", "Memuat scanner...");
  try {
    const reader = await getZXingReader();
    const video = document.getElementById("cameraStreamExpired");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    video.srcObject = stream;
    cameraStreamExpired = stream;
    document.getElementById("scanPlaceholderExpired").style.display = "none";
    setScanStatus(
      "Expired",
      "scanning",
      "Arahkan ke barcode expired, atau ambil gambar untuk OCR...",
    );

    // Coba decode barcode yang memuat tanggal
    reader.decodeFromStream(stream, video, (result, err) => {
      if (result) {
        const parsed =
          parseExpiredDate(result.getText()) ||
          extractExpiredFromOCR(result.getText());
        if (parsed) {
          showScanResult("Expired", parsed);
          stopScanLoop("Expired");
          stopCamera("Expired");
          setScanStatus("Expired", "");
          removeCaptureBtn();
        }
      }
    });
    scanLoopExpired = reader;

    // Tambahkan tombol capture untuk OCR
    addCaptureBtn(stream, video);
  } catch (err) {
    setScanStatus("Expired", "error", "Kamera gagal: " + err.message);
  }
}

// Tombol ambil gambar lalu OCR
function addCaptureBtn(stream, video) {
  removeCaptureBtn();
  const btn = document.createElement("button");
  btn.id = "btnCaptureOCR";
  btn.className = "btn-cam";
  btn.style.cssText = "margin-top:6px; width:100%;";
  btn.innerHTML = '<i class="bx bx-camera"></i> Ambil Gambar & Baca Expired';
  btn.onclick = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", 0.95),
    );
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    await decodeImageExpired(file);
  };
  const panel = document.getElementById("scannerExpiredPanel");
  panel.querySelector(".scan-actions").insertAdjacentElement("afterend", btn);
}

function removeCaptureBtn() {
  const b = document.getElementById("btnCaptureOCR");
  if (b) b.remove();
}

// ========================================================
// ===== DECODE DARI GAMBAR (Gallery upload) ==============
// ========================================================

async function decodeImageBarcode(file, type) {
  setScanStatus(type, "loading", "Membaca barcode dari gambar...");
  try {
    const reader = await getZXingReader();
    const url = URL.createObjectURL(file);
    try {
      const result = await reader.decodeFromImageUrl(url);
      showScanResult(type, result.getText());
      setScanStatus(type, "");
    } catch {
      setScanStatus(
        type,
        "error",
        "Barcode tidak terbaca. Coba gambar lebih jelas.",
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    setScanStatus(type, "error", "Error: " + err.message);
  }
}

async function decodeImageExpired(file) {
  setScanStatus("Expired", "loading", "Membaca dari gambar...");
  const url = URL.createObjectURL(file);
  let found = false;

  // 1. Coba ZXing barcode decode
  try {
    const reader = await getZXingReader();
    const result = await reader.decodeFromImageUrl(url);
    const text = result.getText();
    const parsed = parseExpiredDate(text) || extractExpiredFromOCR(text);
    if (parsed) {
      showScanResult("Expired", parsed);
      setScanStatus("Expired", "");
      found = true;
    }
  } catch {
    /* tidak ada barcode — lanjut ke OCR */
  }

  // 2. Fallback Tesseract OCR
  if (!found) {
    const blob = await fetch(url).then((r) => r.blob());
    await ocrExpiredFromBlob(blob);
  }

  URL.revokeObjectURL(url);
}

// ========================================================
// ===== OCR dengan Tesseract.js ==========================
// ========================================================

async function ocrExpiredFromBlob(blob) {
  setScanStatus("Expired", "loading", "OCR — membaca teks tanggal...");
  try {
    await loadTesseract();

    const worker = await Tesseract.createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const pct = Math.round((m.progress || 0) * 100);
          setScanStatus("Expired", "loading", `OCR ${pct}%...`);
        }
      },
    });

    // Set whitelist karakter agar lebih akurat & cepat
    await worker.setParameters({
      tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/-.() ",
    });

    const {
      data: { text },
    } = await worker.recognize(blob);
    await worker.terminate();

    const parsed = extractExpiredFromOCR(text);
    if (parsed) {
      showScanResult("Expired", parsed);
      setScanStatus("Expired", "");
    } else {
      const clean = text
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);
      setScanStatus("Expired", "error", `Teks: "${clean}"`);
      showScanResult("Expired", clean || "Tidak terbaca");
    }
  } catch (err) {
    setScanStatus("Expired", "error", "OCR gagal: " + err.message);
  }
}

// ========================================================
// ===== EKSTRAK TANGGAL DARI TEKS OCR ====================
// ========================================================

function extractExpiredFromOCR(raw) {
  if (!raw) return null;
  // Normalisasi noise OCR
  const text = raw
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/\s+/g, " ")
    .toUpperCase();

  // Bulan lookup
  const MONTHS = {
    JAN: 1,
    FEB: 2,
    MAR: 3,
    APR: 4,
    MAY: 5,
    MEI: 5,
    JUN: 6,
    JUL: 7,
    AGU: 8,
    AUG: 8,
    SEP: 9,
    OKT: 10,
    OCT: 10,
    NOV: 11,
    DES: 12,
    DEC: 12,
  };
  const MON_RE =
    "JAN|FEB|MAR|APR|MAY|MEI|JUN|JUL|AGU|AUG|SEP|OKT|OCT|NOV|DES|DEC";

  let m;

  // 1. Keyword EXP / BEST BEFORE / BB / ED / KADALUARSA + tanggal
  m = text.match(
    new RegExp(
      `(?:EXP(?:IRY|IRED|[\\.:])?|BEST\\s*BEFORE|B\\.?B\\.?|USE\\s+BY|ED|KADALUARSA|EXP\\.?DATE)[\\s:]*([0-9]{1,2}[/\\-\\.][0-9]{2}[/\\-\\.][0-9]{2,4})`,
    ),
  );
  if (m) return parseExpiredDate(m[1]);

  // 2. DD/MM/YYYY
  m = text.match(/\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // 3. DD/MM/YY
  m = text.match(/\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})\b/);
  if (m) return `20${m[3]}-${m[2]}-${m[1]}`;

  // 4. MM/YYYY
  m = text.match(/\b(\d{2})[\/\-](\d{4})\b/);
  if (m) return `${m[2]}-${m[1]}-01`;

  // 5. ISO YYYY-MM-DD
  m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // 6. DD MON YYYY atau DD MON YY
  m = text.match(new RegExp(`\\b(\\d{1,2})\\s*(${MON_RE})\\s*(\\d{2,4})\\b`));
  if (m) {
    const y = m[3].length === 2 ? "20" + m[3] : m[3];
    const mo = String(MONTHS[m[2].slice(0, 3)] || 1).padStart(2, "0");
    return `${y}-${mo}-${String(m[1]).padStart(2, "0")}`;
  }

  // 7. MON YYYY atau MON YY
  m = text.match(new RegExp(`\\b(${MON_RE})\\s*(\\d{2,4})\\b`));
  if (m) {
    const y = m[2].length === 2 ? "20" + m[2] : m[2];
    const mo = String(MONTHS[m[1].slice(0, 3)] || 1).padStart(2, "0");
    return `${y}-${mo}-01`;
  }

  return null;
}

// ===== PARSE EXPIRED DATE DARI STRING SINGKAT ===========
function parseExpiredDate(val) {
  if (!val) return null;
  val = val.trim().replace(/[Oo]/g, "0");

  // ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  // DD/MM/YYYY
  let m = val.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // DD/MM/YY
  m = val.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
  if (m) return `20${m[3]}-${m[2]}-${m[1]}`;

  // DDMMYYYY
  if (/^\d{8}$/.test(val))
    return `${val.slice(4)}-${val.slice(2, 4)}-${val.slice(0, 2)}`;

  // MM/YYYY
  m = val.match(/^(\d{2})[\/\-](\d{4})$/);
  if (m) return `${m[2]}-${m[1]}-01`;

  // MMYYYY
  if (/^\d{6}$/.test(val)) return `20${val.slice(4)}-${val.slice(0, 2)}-01`;

  return null;
}

// ========================================================
// ===== SCANNER HELPERS ==================================
// ========================================================

function stopScanLoop(type) {
  const loop = type === "SKU" ? scanLoopSKU : scanLoopExpired;
  if (loop) {
    try {
      loop.reset();
    } catch {}
  }
  if (type === "SKU") scanLoopSKU = null;
  else scanLoopExpired = null;
}

function stopCamera(type) {
  const stream = type === "SKU" ? cameraStreamSKU : cameraStreamExpired;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    if (type === "SKU") cameraStreamSKU = null;
    else cameraStreamExpired = null;
    const video = document.getElementById(`cameraStream${type}`);
    if (video) video.srcObject = null;
  }
}

function closeScanner(type) {
  stopScanLoop(type);
  stopCamera(type);
  const panel = document.getElementById(`scanner${type}Panel`);
  if (panel) panel.classList.add("hidden");
  const ph = document.getElementById(`scanPlaceholder${type}`);
  if (ph) ph.style.display = "flex";
  setScanStatus(type, "");
  if (type === "Expired") removeCaptureBtn();
}

function showScanResult(type, value) {
  document.getElementById(`scanResultVal${type}`).textContent = value;
  document.getElementById(`scanResult${type}`).classList.remove("hidden");
}

function setScanStatus(type, state, msg = "") {
  const panelId = `scanner${type}Panel`;
  const statusId = `scanStatus${type}`;
  let el = document.getElementById(statusId);
  if (!el) {
    el = document.createElement("div");
    el.id = statusId;
    el.className = "scan-status";
    const panel = document.getElementById(panelId);
    if (panel) panel.appendChild(el);
    else return;
  }
  if (!state) {
    el.style.display = "none";
    return;
  }
  el.style.display = "flex";
  el.setAttribute("data-state", state);
  el.innerHTML =
    state === "loading"
      ? `<span class="spin"></span><span>${msg}</span>`
      : state === "scanning"
        ? `<i class="bx bx-scan"></i><span>${msg}</span>`
        : `<i class="bx bx-error-circle"></i><span>${msg}</span>`;
}

// ========================================================
// ===== INIT & RENDER ====================================
// ========================================================

function init() {
  if (!invoiceId) {
    invoiceInfo.innerHTML = '<p style="color:red">Invoice tidak ditemukan.</p>';
    return;
  }
  navInvoiceId.textContent = invoiceId;
  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  const data = invoices[invoiceId];
  if (data) {
    renderInfo(data);
    if (data.items && data.items.length > 0) {
      itemTableBody.querySelector(".empty-row")?.remove();
      data.items.forEach((item) => tambahBaris(item, false));
    }
  } else {
    invoiceInfo.innerHTML = `<div class="info-item"><span class="info-label">Invoice</span><span class="info-value">${invoiceId}</span></div>`;
  }
  updateTotalHargaDisplay();
}

function renderInfo(data) {
  invoiceInfo.innerHTML = `
    <div class="info-item"><span class="info-label">Invoice</span><span class="info-value">${data.invoice}</span></div>
    <div class="info-item"><span class="info-label">Tanggal Masuk</span><span class="info-value">${data.tanggal}</span></div>
    <div class="info-item"><span class="info-label">Nama Supplier</span><span class="info-value">${data.supplier}</span></div>
    <div class="info-item"><span class="info-label">Total Qty</span><span class="info-value" id="infoTotal">${data.total || 0}</span></div>
    <div class="info-item"><span class="info-label">Total Harga</span><span class="info-value" id="infoHarga" style="color:#1a6b2a">${formatRp(data.totalHarga || 0)}</span></div>
  `;
}

function updateTotal() {
  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  if (!invoices[invoiceId]) return;
  const items = invoices[invoiceId].items;
  const total = items.reduce((s, i) => s + (parseInt(i.stok) || 0), 0);
  const totalH = items.reduce(
    (s, i) => s + (parseFloat(i.hargaHPP) || 0) * (parseInt(i.stok) || 0),
    0,
  );
  invoices[invoiceId].total = total;
  invoices[invoiceId].totalHarga = totalH;
  localStorage.setItem("invoices", JSON.stringify(invoices));
  const t = document.getElementById("infoTotal");
  if (t) t.textContent = total;
  const h = document.getElementById("infoHarga");
  if (h) h.textContent = formatRp(totalH);
  updateTotalHargaDisplay();
}

function updateTotalHargaDisplay() {
  const data = (JSON.parse(localStorage.getItem("invoices") || "{}") || {})[
    invoiceId
  ];
  if (!data) return;
  totalHargaDisplay.textContent = formatRp(
    (data.items || []).reduce(
      (s, i) => s + (parseFloat(i.hargaHPP) || 0) * (parseInt(i.stok) || 0),
      0,
    ),
  );
}

// ===== MODAL =====
openTambahBtn.addEventListener("click", () => {
  ddNama.refresh();
  ddKategori.refresh();
  ddMerk.refresh();
  subtotalVal.textContent = "Rp 0";
  autofillNotice.classList.add("hidden");
  modalOverlay.classList.add("active");
});
document.getElementById("modalCloseX").addEventListener("click", tutupModal);
batalBtn.addEventListener("click", tutupModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) tutupModal();
});
simpanBtn.addEventListener("click", simpanItem);

function tutupModal() {
  modalOverlay.classList.remove("active");
  clearForm();
  closeScanner("SKU");
  closeScanner("Expired");
}

function clearForm() {
  ["inputSKU", "inputExpired", "inputHargaHPP", "inputHargaJual"].forEach(
    (id) => {
      document.getElementById(id).value = "";
    },
  );
  inputStok.value = "";
  subtotalVal.textContent = "Rp 0";
  errorMsg.textContent = "";
  autofillNotice.classList.add("hidden");
  ddNama.clear();
  ddKategori.clear();
  ddMerk.clear();
  document.getElementById("scanResultSKU").classList.add("hidden");
  document.getElementById("scanResultExpired").classList.add("hidden");
  removeCaptureBtn();
}

function simpanItem() {
  const sku = document.getElementById("inputSKU").value.trim();
  const nama =
    ddNama.getValue() || document.getElementById("inputNama").value.trim();
  const merk =
    ddMerk.getValue() || document.getElementById("inputMerk").value.trim();
  const kategori =
    ddKategori.getValue() ||
    document.getElementById("inputKategori").value.trim();
  const expired = document.getElementById("inputExpired").value || "-";
  const hargaHPP = document.getElementById("inputHargaHPP").value.trim();
  const hargaJual =
    document.getElementById("inputHargaJual").value.trim() || "0";
  const stok = inputStok.value.trim();

  if (!sku || !nama || !merk || !kategori || !stok || !hargaHPP) {
    errorMsg.textContent = "Field bertanda * wajib diisi!";
    return;
  }

  autoAddToLinkedData("barang", nama);
  autoAddToLinkedData("kategori", kategori);
  autoAddToLinkedData("merk", merk);
  autoAddSKUToLinkedData({ sku, nama, merk, kategori });

  const item = {
    sku,
    nama,
    merk,
    kategori,
    expired,
    hargaHPP,
    hargaJual,
    stok,
  };

  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  if (!invoices[invoiceId])
    invoices[invoiceId] = { invoice: invoiceId, items: [] };
  invoices[invoiceId].items.push(item);
  localStorage.setItem("invoices", JSON.stringify(invoices));

  syncToGlobalStock(item);
  updateTotal();
  tambahBaris(item, true);
  tutupModal();
}

function tambahBaris(item, removeEmpty = true) {
  if (removeEmpty) itemTableBody.querySelector(".empty-row")?.remove();
  rowCount++;
  const subtotal =
    (parseFloat(item.hargaHPP) || 0) * (parseInt(item.stok) || 0);
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td><span class="sku-badge">${item.sku || "-"}</span></td>
    <td>${item.nama}</td>
    <td>${item.merk}</td>
    <td>${item.kategori}</td>
    <td>${item.expired && item.expired !== "-" ? item.expired : '<span class="no-expired">—</span>'}</td>
    <td>${formatRp(item.hargaHPP || 0)}</td>
    <td>${formatRp(item.hargaJual || 0)}</td>
    <td>${item.stok}</td>
    <td style="font-weight:700;color:#1a6b2a">${formatRp(subtotal)}</td>
    <td><button class="btn-hapus"><i class="bx bx-trash"></i> Hapus</button></td>
  `;
  tr.querySelector(".btn-hapus").addEventListener("click", () => {
    rowToDelete = tr;
    confirmOverlay.classList.add("active");
  });
  itemTableBody.appendChild(tr);
}

// ===== HAPUS =====
confirmYes.addEventListener("click", () => {
  if (rowToDelete) {
    const rows = Array.from(
      itemTableBody.querySelectorAll("tr:not(.empty-row)"),
    );
    const idx = rows.indexOf(rowToDelete);
    const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
    if (invoices[invoiceId]?.items?.[idx]) {
      removeFromGlobalStock(invoices[invoiceId].items[idx]);
      invoices[invoiceId].items.splice(idx, 1);
      localStorage.setItem("invoices", JSON.stringify(invoices));
    }
    rowToDelete.remove();
    updateTotal();
    updateNomor();
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

function updateNomor() {
  const rows = itemTableBody.querySelectorAll("tr:not(.empty-row)");
  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    tr.innerHTML =
      '<td colspan="11">Belum ada barang — klik "+ Tambah Barang" untuk menambah</td>';
    itemTableBody.appendChild(tr);
    rowCount = 0;
  } else {
    rows.forEach((r, i) => {
      r.cells[0].textContent = i + 1;
    });
    rowCount = rows.length;
  }
}

backBtn.addEventListener("click", () => {
  window.location.href = "inputBarang.html";
});

init();
