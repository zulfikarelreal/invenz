"use strict";

// ===== AUTH =====
if (!localStorage.getItem("isLoggedIn")) window.location.href = "login.html";

// ===== USER INFO =====
const loggedUser = localStorage.getItem("loggedUser") || "Admin";
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
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("loggedUser");
  window.location.href = "login.html";
});

// ============================================================
// ===== STORAGE KEY ==========================================
// ============================================================
const STOCKOUT_KEY = "stockOuts_v2";

// ============================================================
// ===== CUSTOM RANGE STATE ===================================
// ============================================================
let soCustomRangeActive = false;
let soCustomRangeFrom = null;
let soCustomRangeTo = null;

const filterWaktuSO = document.getElementById("filterWaktuSO");
const customRangePanelSO = document.getElementById("customRangePanelSO");
const customFromSO = document.getElementById("customFromSO");
const customToSO = document.getElementById("customToSO");
const btnApplyRangeSO = document.getElementById("btnApplyRangeSO");
const rangeBadgeSO = document.getElementById("rangeBadgeSO");
const rangeBadgeTextSO = document.getElementById("rangeBadgeTextSO");
const searchSO = document.getElementById("searchSO");

function formatDateShortSO(d) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

filterWaktuSO.addEventListener("change", () => {
  if (filterWaktuSO.value === "custom") {
    customRangePanelSO.classList.add("visible");
    if (!customFromSO.value) {
      const now = new Date();
      customFromSO.value = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      customToSO.value = now.toISOString().split("T")[0];
    }
  } else {
    customRangePanelSO.classList.remove("visible");
    soCustomRangeActive = false;
    rangeBadgeSO.classList.remove("visible");
    renderTable();
  }
});

btnApplyRangeSO.addEventListener("click", () => {
  if (!customFromSO.value || !customToSO.value) {
    alert("Pilih tanggal dari dan sampai terlebih dahulu.");
    return;
  }
  const f = new Date(customFromSO.value + "T00:00:00");
  const t = new Date(customToSO.value + "T23:59:59");
  if (f > t) { alert("Tanggal 'Dari' tidak boleh lebih besar dari 'Sampai'."); return; }
  soCustomRangeFrom = f;
  soCustomRangeTo = t;
  soCustomRangeActive = true;
  rangeBadgeTextSO.textContent = formatDateShortSO(f) + " – " + formatDateShortSO(t);
  rangeBadgeSO.classList.add("visible");
  customRangePanelSO.classList.remove("visible");
  renderTable();
});

rangeBadgeSO.addEventListener("click", () => {
  soCustomRangeActive = false;
  soCustomRangeFrom = null;
  soCustomRangeTo = null;
  rangeBadgeSO.classList.remove("visible");
  filterWaktuSO.value = "all";
  renderTable();
});

searchSO.addEventListener("input", () => renderTable());

// ============================================================
// ===== DATE RANGE HELPER ====================================
// ============================================================
function getDateRangeSO(filter) {
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
      if (soCustomRangeActive && soCustomRangeFrom && soCustomRangeTo) return { from: soCustomRangeFrom, to: soCustomRangeTo };
      return null;
    default: return null;
  }
}

function isInRangeSO(tanggalStr, range) {
  if (!range) return true;
  const d = new Date(tanggalStr);
  return d >= range.from && d <= range.to;
}

// ============================================================
// ===== HELPERS ==============================================
// ============================================================
function getPenerima() {
  try {
    const d = JSON.parse(localStorage.getItem("linkedData") || "{}");
    return d.penerima || [];
  } catch { return []; }
}

function getPenerimaByNama(nama) {
  return getPenerima().find((p) => p.nama === nama) || null;
}

function getPayments() {
  const DEFAULT = [
    { id: "pay_default_cash", nama: "Cash", aktif: true, isDefault: true },
    { id: "pay_default_qris", nama: "QRIS", aktif: true, isDefault: true },
  ];
  try {
    const raw = localStorage.getItem("invenz_payment_methods");
    const list = raw ? JSON.parse(raw) : DEFAULT;
    return list.filter((p) => p.aktif);
  } catch { return DEFAULT; }
}

function generateInvoiceNumber() {
  const list = loadStockOuts();
  let max = 0;
  list.forEach((so) => {
    const m = (so.invoice || "").match(/^INV-OUT-(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1]));
  });
  return `INV-OUT-${max + 1}`;
}

// ============================================================
// ===== STORAGE ==============================================
// ============================================================
function loadStockOuts() {
  try { return JSON.parse(localStorage.getItem(STOCKOUT_KEY) || "[]"); }
  catch { return []; }
}
function saveStockOuts(list) {
  localStorage.setItem(STOCKOUT_KEY, JSON.stringify(list));
}

// ============================================================
// ===== FORMAT ===============================================
// ============================================================
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

// ============================================================
// ===== UPDATE STATS =========================================
// ============================================================
function updateStats(filteredList) {
  let totalBarang = 0;
  let totalNilai = 0;
  const namaSet = new Set();

  filteredList.forEach((so) => {
    (so.items || []).forEach((it) => {
      const qty = parseInt(it.jumlahKeluar) || 0;
      const harga = parseFloat(it.hargaJual || it.hargaHPP || 0);
      totalBarang += qty;
      totalNilai += harga * qty;
      if (it.nama) namaSet.add(it.nama.toLowerCase());
    });
  });

  document.getElementById("statInvoiceOut").textContent = filteredList.length;
  document.getElementById("statBarangOut").textContent = totalBarang;
  document.getElementById("statJenisOut").textContent = namaSet.size;
  document.getElementById("statNilaiOut").textContent = formatRp(totalNilai);
}

// ============================================================
// ===== RENDER TABLE =========================================
// ============================================================
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const allList = loadStockOuts();
  const range = getDateRangeSO(filterWaktuSO.value);
  const keyword = searchSO.value.toLowerCase().trim();

  let filtered = allList.filter((so) => isInRangeSO(so.tanggal, range));

  if (keyword) {
    filtered = filtered.filter((so) =>
      (so.invoice || "").toLowerCase().includes(keyword) ||
      (so.penerima || "").toLowerCase().includes(keyword) ||
      (so.telepon || "").toLowerCase().includes(keyword)
    );
  }

  updateStats(filtered);

  if (!filtered.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">Tidak ada data untuk filter ini</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  filtered.forEach((so, i) => {
    const totalItem = (so.items || []).reduce((s, it) => s + (parseInt(it.jumlahKeluar) || 0), 0);
    const totalHarga = (so.items || []).reduce((s, it) => s + parseFloat(it.hargaJual || it.hargaHPP || 0) * (parseInt(it.jumlahKeluar) || 0), 0);
    const badgeClass = getPaymentBadgeClass(so.paymentId);

    const tr = document.createElement("tr");
    tr.className = "clickable-row";
    tr.dataset.id = so.id;
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><span class="invoice-link">${so.invoice}</span></td>
      <td>${formatDate(so.tanggal)}</td>
      <td><strong>${so.penerima || "—"}</strong></td>
      <td>${so.telepon || '<span style="color:#bbb">—</span>'}</td>
      <td><span class="payment-chip ${badgeClass}">${getPaymentIcon(so.paymentId)} ${so.paymentNama || "—"}</span></td>
      <td>${totalItem} item</td>
      <td class="col-harga">${formatRp(totalHarga)}</td>
      <td>
        <button class="btn-hapus btn-hapus-so" data-id="${so.id}">
          <i class="bx bx-trash"></i> Hapus
        </button>
      </td>
    `;

    tr.addEventListener("click", (e) => {
      if (e.target.closest(".btn-hapus-so")) return;
      window.location.href = `invoiceKeluar.html?id=${so.id}`;
    });

    tr.querySelector(".btn-hapus-so").addEventListener("click", (e) => {
      e.stopPropagation();
      openConfirmDelete(so.id);
    });

    tbody.appendChild(tr);
  });
}

function getPaymentBadgeClass(paymentId) {
  if (!paymentId) return "chip-default";
  if (paymentId === "pay_default_cash") return "chip-cash";
  if (paymentId === "pay_default_qris") return "chip-qris";
  return "chip-other";
}
function getPaymentIcon(paymentId) {
  if (paymentId === "pay_default_cash") return "💵";
  if (paymentId === "pay_default_qris") return "📱";
  return "💰";
}

// ============================================================
// ===== MODAL ================================================
// ============================================================
let ddPenerima = null;

function openModal() {
  const autoInv = generateInvoiceNumber();
  document.getElementById("invoiceAutoPreview").textContent = autoInv;
  document.getElementById("inputTanggal").value = new Date().toISOString().split("T")[0];
  document.getElementById("inputTelepon").value = "";
  document.getElementById("phonAutofillHint").style.display = "none";
  document.getElementById("errorMsg").textContent = "";

  if (ddPenerima) {
    const wrapper = document.getElementById("cdPenerima");
    wrapper.classList.remove("open");
  }
  ddPenerima = new CustomDropdown("cdPenerima", "penerima", { icon: "bx-user" });

  const penerimaInput = document.getElementById("inputPenerima");
  penerimaInput.addEventListener("change", onPenerimaChange);

  renderPaymentOptions();
  document.getElementById("modalOverlay").classList.add("active");
  setTimeout(() => penerimaInput.focus(), 100);
}

function onPenerimaChange(e) {
  const nama = e.target.value.trim();
  const found = getPenerimaByNama(nama);
  const hintEl = document.getElementById("phonAutofillHint");
  const telEl = document.getElementById("inputTelepon");
  if (found && found.telepon) {
    telEl.value = found.telepon;
    hintEl.style.display = "flex";
  } else {
    hintEl.style.display = "none";
  }
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("active");
  const inp = document.getElementById("inputPenerima");
  inp.removeEventListener("change", onPenerimaChange);
}

function renderPaymentOptions() {
  const container = document.getElementById("paymentOptions");
  const emptyHint = document.getElementById("paymentEmptyHint");
  const payments = getPayments();
  if (!payments.length) {
    container.innerHTML = "";
    emptyHint.style.display = "flex";
    return;
  }
  emptyHint.style.display = "none";
  container.innerHTML = payments.map((p, i) => `
    <label class="payment-pill ${i === 0 ? "selected" : ""}" for="pay_${p.id}">
      <input type="radio" name="paymentMethod" id="pay_${p.id}" value="${p.id}" data-nama="${p.nama}" ${i === 0 ? "checked" : ""}>
      <span class="pill-icon">${getPaymentIcon(p.id)}</span>
      <span class="pill-label">${p.nama}</span>
    </label>
  `).join("");
  container.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      container.querySelectorAll(".payment-pill").forEach((l) => l.classList.remove("selected"));
      radio.closest(".payment-pill").classList.add("selected");
    });
  });
}

function simpanInvoice() {
  const invoice = document.getElementById("invoiceAutoPreview").textContent.trim();
  const tanggal = document.getElementById("inputTanggal").value;
  const penerima = ddPenerima ? ddPenerima.getValue() : document.getElementById("inputPenerima").value.trim();
  const telepon = document.getElementById("inputTelepon").value.trim();
  const errEl = document.getElementById("errorMsg");
  const payRadio = document.querySelector('input[name="paymentMethod"]:checked');

  errEl.textContent = "";
  if (!invoice) { errEl.textContent = "Nomor invoice tidak valid."; return; }
  if (!tanggal) { errEl.textContent = "Tanggal keluar harus diisi."; return; }
  if (!penerima) { errEl.textContent = "Nama customer harus diisi."; return; }
  if (!payRadio) { errEl.textContent = "Pilih metode pembayaran."; return; }

  const existing = loadStockOuts();
  if (existing.find((s) => s.invoice === invoice)) { errEl.textContent = "Nomor invoice sudah ada, coba lagi."; return; }

  autoAddPenerima(penerima, telepon);

  const newSO = {
    id: "so_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    invoice,
    tanggal,
    penerima,
    telepon: telepon || "",
    paymentId: payRadio.value,
    paymentNama: payRadio.dataset.nama,
    items: [],
    createdAt: new Date().toISOString(),
  };

  existing.push(newSO);
  saveStockOuts(existing);
  closeModal();
  window.location.href = `invoiceKeluar.html?id=${newSO.id}`;
}

function autoAddPenerima(nama, telepon) {
  if (!nama) return;
  try {
    const ld = JSON.parse(localStorage.getItem("linkedData") || "{}");
    if (!ld.penerima) ld.penerima = [];
    const idx = ld.penerima.findIndex((p) => p.nama.toLowerCase() === nama.toLowerCase());
    if (idx === -1) {
      ld.penerima.push({ nama, keterangan: "", telepon: telepon || "" });
    } else if (telepon && !ld.penerima[idx].telepon) {
      ld.penerima[idx].telepon = telepon;
    }
    localStorage.setItem("linkedData", JSON.stringify(ld));
  } catch (e) { /* ignore */ }
}

// ============================================================
// ===== HAPUS ================================================
// ============================================================
let _pendingDeleteId = null;

function openConfirmDelete(id) {
  _pendingDeleteId = id;
  document.getElementById("confirmOverlay").classList.add("active");
}

function executeDelete() {
  if (!_pendingDeleteId) return;
  let list = loadStockOuts();
  const so = list.find((s) => s.id === _pendingDeleteId);
  if (so && so.items && so.items.length) { kembalikanStok(so.items); }
  list = list.filter((s) => s.id !== _pendingDeleteId);
  saveStockOuts(list);
  _pendingDeleteId = null;
  document.getElementById("confirmOverlay").classList.remove("active");
  renderTable();
}

function kembalikanStok(items) {
  try {
    const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
    items.forEach((item) => {
      if (!item.invoiceAsal) return;
      const inv = invoices[item.invoiceAsal];
      if (!inv || !inv.items) return;
      const found = inv.items.find((i) => i.nama === item.nama && i.kategori === item.kategori);
      if (found) { found.stok = (parseInt(found.stok) || 0) + (parseInt(item.jumlahKeluar) || 0); }
    });
    localStorage.setItem("invoices", JSON.stringify(invoices));
  } catch (e) { /* ignore */ }
}

// ============================================================
// ===== EVENT BINDINGS =======================================
// ============================================================
document.getElementById("openModalBtn").addEventListener("click", openModal);
document.getElementById("modalCloseX").addEventListener("click", closeModal);
document.getElementById("batalBtn").addEventListener("click", closeModal);
document.getElementById("modalOverlay").addEventListener("click", function (e) { if (e.target === this) closeModal(); });
document.getElementById("simpanBtn").addEventListener("click", simpanInvoice);
document.getElementById("inputTanggal").addEventListener("keydown", (e) => { if (e.key === "Enter") simpanInvoice(); });
document.getElementById("confirmYes").addEventListener("click", executeDelete);
document.getElementById("confirmNo").addEventListener("click", () => {
  _pendingDeleteId = null;
  document.getElementById("confirmOverlay").classList.remove("active");
});
document.getElementById("confirmOverlay").addEventListener("click", function (e) {
  if (e.target === this) { _pendingDeleteId = null; this.classList.remove("active"); }
});

// ===== INIT =====
renderTable();