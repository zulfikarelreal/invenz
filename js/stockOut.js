// ===== STOCKOUT.JS — Supabase version =====
"use strict";

// ===== USER INFO =====
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
  if (!customFromSO.value || !customToSO.value) { alert("Pilih tanggal dari dan sampai terlebih dahulu."); return; }
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
    case "today":     return { from: today, to: new Date() };
    case "7d":        return { from: new Date(today - 6 * 864e5), to: new Date() };
    case "thismonth": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date() };
    case "30d":       return { from: new Date(today - 29 * 864e5), to: new Date() };
    case "lastmonth": return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) };
    case "3m":        return { from: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()), to: new Date() };
    case "6m":        return { from: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()), to: new Date() };
    case "ytd":       return { from: new Date(now.getFullYear(), 0, 1), to: new Date() };
    case "1y":        return { from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), to: new Date() };
    case "lastyear":  return { from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59) };
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
// ===== CACHE DATA ============================================
// ============================================================
let _allStockOuts = []; // [{id, invoice_no, tanggal, penerima, telepon, payment_id, payment_nama, items:[]}]
let _payments = [];
let _penerima = [];

async function loadAllData() {
  // Load stock_outs + items
  const { data: soData, error: soErr } = await sb
    .from("stock_outs")
    .select("*, stock_out_items(*)")
    .order("created_at", { ascending: false });

  if (!soErr && soData) {
    _allStockOuts = soData.map((so) => ({
      ...so,
      items: so.stock_out_items || [],
    }));
  }

  // Load payment methods
  const { data: pmData } = await sb.from("payment_methods").select("*").eq("aktif", true).order("nama");
  _payments = pmData || [];

  // Load penerima
  const { data: pnData } = await sb.from("penerima").select("*").order("nama");
  _penerima = pnData || [];
}

// ============================================================
// ===== FORMAT ================================================
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
      const qty = parseInt(it.jumlah_keluar) || 0;
      const harga = parseFloat(it.harga_jual || it.harga_hpp || 0);
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
  const range = getDateRangeSO(filterWaktuSO.value);
  const keyword = searchSO.value.toLowerCase().trim();

  let filtered = _allStockOuts.filter((so) => isInRangeSO(so.tanggal, range));

  if (keyword) {
    filtered = filtered.filter((so) =>
      (so.invoice_no || "").toLowerCase().includes(keyword) ||
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
    const totalItem  = (so.items || []).reduce((s, it) => s + (parseInt(it.jumlah_keluar) || 0), 0);
    const totalHarga = (so.items || []).reduce((s, it) => s + parseFloat(it.harga_jual || it.harga_hpp || 0) * (parseInt(it.jumlah_keluar) || 0), 0);
    const badgeClass = getPaymentBadgeClass(so.payment_id);

    const tr = document.createElement("tr");
    tr.className = "clickable-row";
    tr.dataset.id = so.id;
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><span class="invoice-link">${so.invoice_no}</span></td>
      <td>${formatDate(so.tanggal)}</td>
      <td><strong>${so.penerima || "—"}</strong></td>
      <td>${so.telepon || '<span style="color:#bbb">—</span>'}</td>
      <td><span class="payment-chip ${badgeClass}">${getPaymentIcon(so.payment_id)} ${so.payment_nama || "—"}</span></td>
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
  ddPenerima.setOptions(_penerima.map((p) => p.nama));

  const penerimaInput = document.getElementById("inputPenerima");
  penerimaInput.addEventListener("change", onPenerimaChange);

  renderPaymentOptions();
  document.getElementById("modalOverlay").classList.add("active");
  setTimeout(() => penerimaInput.focus(), 100);
}

function onPenerimaChange(e) {
  const nama = e.target.value.trim();
  const found = _penerima.find((p) => p.nama === nama);
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
  const payments = _payments;
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

function generateInvoiceNumber() {
  let max = 0;
  _allStockOuts.forEach((so) => {
    const m = (so.invoice_no || "").match(/^INV-OUT-(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1]));
  });
  return `INV-OUT-${max + 1}`;
}

async function simpanInvoice() {
  const invoice  = document.getElementById("invoiceAutoPreview").textContent.trim();
  const tanggal  = document.getElementById("inputTanggal").value;
  const penerima = ddPenerima ? ddPenerima.getValue() : document.getElementById("inputPenerima").value.trim();
  const telepon  = document.getElementById("inputTelepon").value.trim();
  const errEl    = document.getElementById("errorMsg");
  const payRadio = document.querySelector('input[name="paymentMethod"]:checked');

  errEl.textContent = "";
  if (!invoice)  { errEl.textContent = "Nomor invoice tidak valid."; return; }
  if (!tanggal)  { errEl.textContent = "Tanggal keluar harus diisi."; return; }
  if (!penerima) { errEl.textContent = "Nama customer harus diisi."; return; }
  if (!payRadio) { errEl.textContent = "Pilih metode pembayaran."; return; }

  // Cek duplikat
  const { data: dup } = await sb.from("stock_outs").select("id").eq("invoice_no", invoice).maybeSingle();
  if (dup) { errEl.textContent = "Nomor invoice sudah ada, coba lagi."; return; }

  // Auto-add penerima ke master
  await autoAddPenerima(penerima, telepon);

  const { data: newSO, error } = await sb.from("stock_outs").insert({
    invoice_no: invoice,
    tanggal: tanggal,
    penerima: penerima,
    telepon: telepon || null,
    payment_id: payRadio.value,
    payment_nama: payRadio.dataset.nama,
  }).select().single();

  if (error) { errEl.textContent = "Gagal menyimpan: " + error.message; return; }

  closeModal();
  window.location.href = `invoiceKeluar.html?id=${newSO.id}`;
}

async function autoAddPenerima(nama, telepon) {
  if (!nama) return;
  const existing = _penerima.find((p) => p.nama.toLowerCase() === nama.toLowerCase());
  if (!existing) {
    await sb.from("penerima").insert({ nama, telepon: telepon || null, keterangan: null });
  } else if (telepon && !existing.telepon) {
    await sb.from("penerima").update({ telepon }).eq("id", existing.id);
  }
}

// ============================================================
// ===== HAPUS ================================================
// ============================================================
let _pendingDeleteId = null;

function openConfirmDelete(id) {
  _pendingDeleteId = id;
  document.getElementById("confirmOverlay").classList.add("active");
}

async function executeDelete() {
  if (!_pendingDeleteId) return;
  // Kembalikan stok ke invoice_items sebelum hapus
  const so = _allStockOuts.find((s) => s.id === _pendingDeleteId);
  if (so && so.items && so.items.length) {
    await kembalikanStok(so.items);
  }
  // Hapus stock_out (cascade ke stock_out_items)
  await sb.from("stock_outs").delete().eq("id", _pendingDeleteId);

  _allStockOuts = _allStockOuts.filter((s) => s.id !== _pendingDeleteId);
  _pendingDeleteId = null;
  document.getElementById("confirmOverlay").classList.remove("active");
  renderTable();
}

async function kembalikanStok(items) {
  for (const item of items) {
    if (!item.invoice_asal) continue;
    // Cari invoice_items berdasarkan invoice_no
    const { data: inv } = await sb
      .from("invoices")
      .select("id")
      .eq("invoice_no", item.invoice_asal)
      .maybeSingle();
    if (!inv) continue;

    const { data: invItems } = await sb
      .from("invoice_items")
      .select("id, stok, sku, nama")
      .eq("invoice_id", inv.id);

    if (!invItems) continue;
    const found = invItems.find((i) =>
      item.sku && item.sku !== "—" ? i.sku === item.sku : i.nama === item.nama
    );
    if (found) {
      await sb.from("invoice_items")
        .update({ stok: (parseInt(found.stok) || 0) + (parseInt(item.jumlah_keluar) || 0) })
        .eq("id", found.id);
    }
  }
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
(async function init() {
  await loadAllData();
  renderTable();
})();