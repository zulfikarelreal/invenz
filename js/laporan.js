"use strict";

// ===== AUTH =====
if (!localStorage.getItem("isLoggedIn")) window.location.href = "login.html";

// ===== USER INFO =====
const loggedUser = localStorage.getItem("loggedUser") || "Admin";
document.getElementById("sidebarUsername").textContent = loggedUser;
document.getElementById("sidebarAvatar").textContent = loggedUser.charAt(0).toUpperCase();

// ===== SIDEBAR =====
const sidebar   = document.getElementById("sidebar");
const sOverlay  = document.getElementById("sidebarOverlay");
document.getElementById("hamburger").addEventListener("click", () => {
  sidebar.classList.add("open"); sOverlay.classList.add("active");
});
document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
sOverlay.addEventListener("click", closeSidebar);
function closeSidebar() { sidebar.classList.remove("open"); sOverlay.classList.remove("active"); }

// ===== LOGOUT =====
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn"); localStorage.removeItem("loggedUser");
  window.location.href = "login.html";
});

// ============================================================
// ===== STORAGE KEYS =========================================
// ============================================================
const STOCKOUT_KEY = "stockOuts_v2";

// ============================================================
// ===== CUSTOM RANGE STATE ===================================
// ============================================================
let customRangeActive = false;
let customRangeFrom   = null;
let customRangeTo     = null;

const filterPeriode      = document.getElementById("filterPeriode");
const customRangePanel   = document.getElementById("customRangePanel");
const customFromEl       = document.getElementById("customFrom");
const customToEl         = document.getElementById("customTo");
const btnApplyRange      = document.getElementById("btnApplyRange");
const rangeBadge         = document.getElementById("rangeBadge");
const rangeBadgeText     = document.getElementById("rangeBadgeText");

function fmtShort(d) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

filterPeriode.addEventListener("change", () => {
  if (filterPeriode.value === "custom") {
    customRangePanel.classList.add("visible");
    if (!customFromEl.value) {
      const now = new Date();
      customFromEl.value = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      customToEl.value   = now.toISOString().split("T")[0];
    }
  } else {
    customRangePanel.classList.remove("visible");
    customRangeActive = false;
    rangeBadge.classList.remove("visible");
    renderAll();
  }
});

btnApplyRange.addEventListener("click", () => {
  if (!customFromEl.value || !customToEl.value) { alert("Pilih tanggal dari dan sampai."); return; }
  const f = new Date(customFromEl.value + "T00:00:00");
  const t = new Date(customToEl.value   + "T23:59:59");
  if (f > t) { alert("Tanggal 'Dari' tidak boleh lebih besar dari 'Sampai'."); return; }
  customRangeFrom = f; customRangeTo = t; customRangeActive = true;
  rangeBadgeText.textContent = fmtShort(f) + " – " + fmtShort(t);
  rangeBadge.classList.add("visible");
  customRangePanel.classList.remove("visible");
  renderAll();
});

rangeBadge.addEventListener("click", () => {
  customRangeActive = false; customRangeFrom = null; customRangeTo = null;
  rangeBadge.classList.remove("visible");
  filterPeriode.value = "all";
  renderAll();
});

// ============================================================
// ===== DATE RANGE HELPER ====================================
// ============================================================
function getDateRange(filter) {
  const now   = new Date();
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
      if (customRangeActive && customRangeFrom && customRangeTo)
        return { from: customRangeFrom, to: customRangeTo };
      return null;
    default: return null;
  }
}

function inRange(dateStr, range) {
  if (!range) return true;
  const d = new Date(dateStr);
  return d >= range.from && d <= range.to;
}

const PERIODE_LABELS = {
  all: "All Time", today: "Hari Ini", "7d": "7 Hari Terakhir",
  thismonth: "Bulan Ini", "30d": "30 Hari Terakhir",
  lastmonth: "Bulan Kemarin", "3m": "3 Bulan Terakhir",
  "6m": "6 Bulan Terakhir", ytd: "YTD (Tahun Ini)",
  "1y": "12 Bulan Terakhir", lastyear: "Tahun Lalu", custom: "Custom Range",
};

// ============================================================
// ===== FORMAT HELPERS =======================================
// ============================================================
function fmtRp(n) {
  if (!n || n === 0) return "Rp 0";
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
function fmtDate(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  const bln = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${parseInt(d)} ${bln[parseInt(m) - 1]} ${y}`;
}
function fmtPct(n) {
  if (!isFinite(n) || isNaN(n)) return "0%";
  return n.toFixed(1) + "%";
}

// ============================================================
// ===== DATA LOADERS =========================================
// ============================================================
function loadInvoices() {
  try { return Object.values(JSON.parse(localStorage.getItem("invoices") || "{}")); }
  catch { return []; }
}

// Fixed Key: Memastikan pemanggilan data stock out konsisten dengan parameter penyimpanan
function loadStockOuts() {
  try { return JSON.parse(localStorage.getItem(STOCKOUT_KEY) || "[]"); }
  catch { return []; }
}

function getPaymentIcon(paymentId) {
  if (paymentId === "pay_default_cash") return "💵";
  if (paymentId === "pay_default_qris") return "📱";
  return "💰";
}

// ============================================================
// ===== CHART INSTANCES ======================================
// ============================================================
let chartRevenue  = null;
let chartKategori = null;
let chartMasuk    = null;
let chartKeluar   = null;
let chartLineRevenue = null;

function destroyCharts() {
  [chartRevenue, chartKategori, chartMasuk, chartKeluar, chartLineRevenue].forEach(c => { if (c) c.destroy(); });
  chartRevenue = chartKategori = chartMasuk = chartKeluar = chartLineRevenue = null;
}

// ============================================================
// ===== MONTH BUCKET HELPERS =================================
// ============================================================
function getMonthLabel(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const bln = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return bln[d.getMonth()] + " " + d.getFullYear();
}

function buildMonthBuckets(items, dateKey, qtyKey) {
  const map = {};
  items.forEach(item => {
    const label = getMonthLabel(item[dateKey]);
    if (!map[label]) map[label] = 0;
    map[label] += parseInt(item[qtyKey]) || 0;
  });
  return map;
}

// ============================================================
// ===== MAIN RENDER ==========================================
// ============================================================
function renderAll() {
  const range   = getDateRange(filterPeriode.value);
  const periodTxt = customRangeActive
    ? (rangeBadgeText.textContent || "Custom Range")
    : (PERIODE_LABELS[filterPeriode.value] || "All Time");
  document.getElementById("periodText").textContent = periodTxt;

  // --- Raw data ---
  const allInvoices   = loadInvoices();
  const allStockOuts  = loadStockOuts();

  // --- Filter by date ---
  const filteredInvoices   = allInvoices.filter(inv => inRange(inv.tanggal, range));
  const filteredStockOuts  = allStockOuts.filter(so  => inRange(so.tanggal, range));

  // --- Compute metrics ---
  // Barang masuk
  let qtyMasuk = 0;
  filteredInvoices.forEach(inv => {
    (inv.items || []).forEach(item => { qtyMasuk += parseInt(item.stok) || 0; });
  });

  // Stock out aggregates
  let qtyKeluar   = 0;
  let totalRevenue = 0;
  let totalHPP    = 0;

  // Product map for top products
  const prodMap = {};
  // Month bucket for keluar chart
  const keluarMonthMap = {};
  // Kategori map for pie chart
  const kategoriMap = {};
  // Customer set
  const customerSet = new Set();

  filteredStockOuts.forEach(so => {
    const label = getMonthLabel(so.tanggal);
    if (!keluarMonthMap[label]) keluarMonthMap[label] = 0;
    if (so.penerima) customerSet.add(so.penerima.toLowerCase());

    (so.items || []).forEach(item => {
      const qty   = parseInt(item.jumlahKeluar) || 0;
      const jual  = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hpp   = parseFloat(item.hargaHPP  || 0);
      const rev   = jual * qty;
      const hppTot = hpp * qty;

      qtyKeluar    += qty;
      totalRevenue += rev;
      totalHPP     += hppTot;

      keluarMonthMap[label] += qty;

      // kategori
      const kat = item.kategori || "Lainnya";
      if (!kategoriMap[kat]) kategoriMap[kat] = { revenue: 0, qty: 0 };
      kategoriMap[kat].revenue += rev;
      kategoriMap[kat].qty     += qty;

      // produk
      const key = item.nama || "—";
      if (!prodMap[key]) {
        prodMap[key] = { nama: key, kategori: item.kategori || "—", qty: 0, revenue: 0, hpp: 0 };
      }
      prodMap[key].qty     += qty;
      prodMap[key].revenue += rev;
      prodMap[key].hpp     += hppTot;
    });
  });

  const totalProfit = totalRevenue - totalHPP;
  const marginPct   = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Stok sisa (all time dari invoices)
  let stokSisa = 0;
  allInvoices.forEach(inv => {
    (inv.items || []).forEach(item => { stokSisa += parseInt(item.stok) || 0; });
  });

  // ============================================================
  // ===== RENDER KPI ===========================================
  // ============================================================
  document.getElementById("kpiRevenue").textContent = fmtRp(totalRevenue);
  document.getElementById("kpiRevenueSub").textContent = `dari ${filteredStockOuts.length} transaksi`;
  document.getElementById("kpiHPP").textContent = fmtRp(totalHPP);
  document.getElementById("kpiHPPSub").textContent = "harga pokok penjualan";
  document.getElementById("kpiProfit").textContent = fmtRp(totalProfit);
  document.getElementById("kpiProfitSub").textContent = totalRevenue > 0 ? "dari total penjualan" : "belum ada penjualan";
  document.getElementById("kpiMargin").textContent = fmtPct(marginPct);
  document.getElementById("kpiMarginSub").textContent = "persentase keuntungan";

  // Color profit
  const profitEl = document.getElementById("kpiProfit");
  profitEl.style.color = totalProfit >= 0 ? "rgb(16,44,168)" : "#cc2222";

  // ============================================================
  // ===== RENDER INVENTORY SUMMARY =============================
  // ============================================================
  document.getElementById("invMasukQty").textContent   = qtyMasuk + " pcs";
  document.getElementById("invMasukInv").textContent   = "dari " + filteredInvoices.length + " invoice";
  document.getElementById("invKeluarQty").textContent  = qtyKeluar + " pcs";
  document.getElementById("invKeluarInv").textContent  = "dari " + filteredStockOuts.length + " transaksi";
  document.getElementById("invTransaksi").textContent  = filteredStockOuts.length;
  document.getElementById("invTransaksiSub").textContent = "invoice keluar";
  document.getElementById("invPenjualan").textContent  = fmtRp(totalRevenue);
  document.getElementById("invPenjualanSub").textContent = "nilai stock out";
  document.getElementById("invStokSisa").textContent   = stokSisa + " pcs";
  document.getElementById("invStokSub").textContent    = "di gudang saat ini";
  document.getElementById("invCustomer").textContent   = customerSet.size;
  document.getElementById("invCustomerSub").textContent = "pelanggan unik";

  // ============================================================
  // ===== RENDER CHARTS ========================================
  // ============================================================
  destroyCharts();
  renderChartRevenue(filteredStockOuts);
  renderChartKategori(kategoriMap);
  renderChartMasuk(filteredInvoices);
  renderChartKeluar(keluarMonthMap);
  renderChartLineRevenue(filteredStockOuts);

  // ============================================================
  // ===== RENDER TABLES ========================================
  // ============================================================
  renderTableTopProduk(prodMap);
  renderTableTransaksi(filteredStockOuts);
  renderTableBarangMasuk(filteredInvoices);
}

// ============================================================
// ===== CHART: REVENUE / HPP / PROFIT per bulan ==============
// ============================================================
function renderChartRevenue(stockOuts) {
  const monthMap = {};

  stockOuts.forEach(so => {
    const label = getMonthLabel(so.tanggal);
    if (!monthMap[label]) monthMap[label] = { revenue: 0, hpp: 0 };
    (so.items || []).forEach(item => {
      const qty  = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hpp  = parseFloat(item.hargaHPP  || 0);
      monthMap[label].revenue += jual * qty;
      monthMap[label].hpp     += hpp  * qty;
    });
  });

  const labels  = Object.keys(monthMap);
  const revenues = labels.map(l => monthMap[l].revenue);
  const hpps     = labels.map(l => monthMap[l].hpp);
  const profits  = labels.map((l, i) => revenues[i] - hpps[i]);

  const empty = labels.length === 0;
  document.getElementById("emptyRevenue").classList.toggle("hidden", !empty);

  const ctx = document.getElementById("chartRevenue");
  if (empty) { ctx.style.display = "none"; return; }
  ctx.style.display = "";

  chartRevenue = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Revenue", data: revenues, backgroundColor: "rgba(16,185,129,0.7)", borderColor: "#10B981", borderWidth: 1.5, borderRadius: 4 },
        { label: "HPP",     data: hpps,    backgroundColor: "rgba(245,158,11,0.7)",  borderColor: "#F59E0B", borderWidth: 1.5, borderRadius: 4 },
        { label: "Profit",  data: profits, backgroundColor: "rgba(59,130,246,0.7)",  borderColor: "#3B82F6", borderWidth: 1.5, borderRadius: 4, type: "line", tension: 0.3, pointRadius: 4, fill: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { font: { family: "Poppins", size: 11 } } } },
      scales: {
        x: { ticks: { font: { family: "Poppins", size: 10 } } },
        y: { beginAtZero: true, ticks: { font: { family: "Poppins", size: 10 }, callback: v => "Rp " + (v / 1000000).toFixed(1) + "jt" } },
      },
    },
  });
}

// ============================================================
// ===== CHART: PENJUALAN PER KATEGORI (Doughnut) =============
// ============================================================
function renderChartKategori(kategoriMap) {
  const labels = Object.keys(kategoriMap);
  const data   = labels.map(k => kategoriMap[k].revenue);
  const colors = ["#10B981","#3B82F6","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316","#6366F1","#84CC16"];

  const empty = labels.length === 0;
  document.getElementById("emptyKategori").classList.toggle("hidden", !empty);
  const ctx = document.getElementById("chartKategori");
  if (empty) { ctx.style.display = "none"; return; }
  ctx.style.display = "";

  chartKategori = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: "#111", borderWidth: 1.5, hoverOffset: 12,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { font: { family: "Poppins", size: 11 }, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => " " + ctx.label + ": " + fmtRp(ctx.parsed) } },
      },
    },
  });
}

// ============================================================
// ===== CHART: BARANG MASUK per bulan ========================
// ============================================================
function renderChartMasuk(invoices) {
  const monthMap = {};
  invoices.forEach(inv => {
    const label = getMonthLabel(inv.tanggal);
    if (!monthMap[label]) monthMap[label] = 0;
    (inv.items || []).forEach(item => { monthMap[label] += parseInt(item.stok) || 0; });
  });

  const labels = Object.keys(monthMap);
  const data   = labels.map(l => monthMap[l]);

  const empty = labels.length === 0;
  document.getElementById("emptyMasuk").classList.toggle("hidden", !empty);
  const ctx = document.getElementById("chartMasuk");
  if (empty) { ctx.style.display = "none"; return; }
  ctx.style.display = "";

  chartMasuk = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Qty Masuk",
        data,
        backgroundColor: "rgba(16,44,168,0.6)",
        borderColor: "rgb(16,44,168)",
        borderWidth: 1.5, borderRadius: 5,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { family: "Poppins", size: 10 } } },
        y: { beginAtZero: true, ticks: { font: { family: "Poppins", size: 10 } } },
      },
    },
  });
}

// ============================================================
// ===== CHART: BARANG KELUAR per bulan =======================
// ============================================================
function renderChartKeluar(keluarMonthMap) {
  const labels = Object.keys(keluarMonthMap);
  const data   = labels.map(l => keluarMonthMap[l]);

  const empty = labels.length === 0;
  document.getElementById("emptyKeluar").classList.toggle("hidden", !empty);
  const ctx = document.getElementById("chartKeluar");
  if (empty) { ctx.style.display = "none"; return; }
  ctx.style.display = "";

  chartKeluar = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Qty Keluar",
        data,
        backgroundColor: "rgba(239,68,68,0.65)",
        borderColor: "#EF4444",
        borderWidth: 1.5, borderRadius: 5,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { family: "Poppins", size: 10 } } },
        y: { beginAtZero: true, ticks: { font: { family: "Poppins", size: 10 } } },
      },
    },
  });
}

// ============================================================
// ===== CHART: LINE REVENUE HARIAN ===========================
// ============================================================
function renderChartLineRevenue(stockOuts) {
  const dailyMap = {};

  stockOuts.forEach(so => {
    const tanggal = so.tanggal;
    if (!dailyMap[tanggal]) dailyMap[tanggal] = 0;
    
    (so.items || []).forEach(item => {
      const qty  = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      dailyMap[tanggal] += jual * qty;
    });
  });

  const sortedDates = Object.keys(dailyMap).sort();
  const labels = sortedDates.map(d => fmtDate(d));
  const revenues = sortedDates.map(d => dailyMap[d]);

  const movingAvg = [];
  const windowSize = 7;
  for (let i = 0; i < revenues.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = revenues.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    movingAvg.push(avg);
  }

  const empty = labels.length === 0;
  document.getElementById("emptyLineRevenue").classList.toggle("hidden", !empty);

  const ctx = document.getElementById("chartLineRevenue");
  if (empty) { ctx.style.display = "none"; return; }
  ctx.style.display = "";

  chartLineRevenue = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue Harian",
          data: revenues,
          backgroundColor: "rgba(16,185,129,0.1)",
          borderColor: "#10B981",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#10B981",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
        {
          label: "Moving Average (7 hari)",
          data: movingAvg,
          backgroundColor: "transparent",
          borderColor: "#3B82F6",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: "top", labels: { font: { family: "Poppins", size: 11 }, usePointStyle: true, padding: 15 } },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleFont: { family: "Poppins", size: 12, weight: "600" },
          bodyFont: { family: "Poppins", size: 11 },
          padding: 12, cornerRadius: 8,
          callbacks: { label: ctx => (ctx.dataset.label || '') + ': ' + fmtRp(ctx.parsed.y) }
        },
      },
      scales: {
        x: { ticks: { font: { family: "Poppins", size: 10 }, maxRotation: 45, minRotation: 45 }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { font: { family: "Poppins", size: 10 }, callback: v => v >= 1e6 ? "Rp " + (v / 1e6).toFixed(1) + "jt" : v >= 1e3 ? "Rp " + (v / 1e3).toFixed(0) + "rb" : "Rp " + v }, grid: { color: "rgba(0,0,0,0.05)" } },
      },
    },
  });
}

// ============================================================
// ===== TABLE: TOP 10 PRODUK =================================
// ============================================================
function renderTableTopProduk(prodMap) {
  const tbody = document.getElementById("tableTopProduk");
  const sorted = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  if (!sorted.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Belum ada data penjualan pada periode ini</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  sorted.forEach((p, idx) => {
    const profit = p.revenue - p.hpp;
    const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
    const profitClass = profit >= 0 ? "profit-pos" : "profit-neg";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td style="text-align:left;font-weight:600">${p.nama}</td>
      <td><span class="badge badge-blue">${p.kategori}</span></td>
      <td><strong>${p.qty}</strong> pcs</td>
      <td class="harga-cell">${fmtRp(p.revenue)}</td>
      <td style="color:#856404;font-weight:600">${fmtRp(p.hpp)}</td>
      <td class="${profitClass}">${fmtRp(profit)}</td>
      <td><span class="badge ${margin >= 0 ? 'badge-green' : 'badge-orange'}">${fmtPct(margin)}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
// ===== TABLE: RIWAYAT TRANSAKSI =============================
// ============================================================
function renderTableTransaksi(stockOuts) {
  const tbody = document.getElementById("tableTransaksi");

  if (!stockOuts.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">Belum ada transaksi pada periode ini</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  [...stockOuts].reverse().forEach((so, idx) => {
    let revenue = 0, hpp = 0, totalQty = 0;
    (so.items || []).forEach(item => {
      const qty  = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hppU = parseFloat(item.hargaHPP || 0);
      revenue  += jual * qty;
      hpp      += hppU * qty;
      totalQty += qty;
    });
    const profit = revenue - hpp;
    const profitClass = profit >= 0 ? "profit-pos" : "profit-neg";
    const payIcon = getPaymentIcon(so.paymentId);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td style="font-weight:700;color:rgb(16,44,168)">${so.invoice}</td>
      <td>${fmtDate(so.tanggal)}</td>
      <td style="font-weight:600">${so.penerima || "—"}</td>
      <td>${payIcon} ${so.paymentNama || "—"}</td>
      <td>${totalQty} pcs</td>
      <td class="harga-cell">${fmtRp(revenue)}</td>
      <td style="color:#856404;font-weight:600">${fmtRp(hpp)}</td>
      <td class="${profitClass}">${fmtRp(profit)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
// ===== TABLE: BARANG MASUK ==================================
// ============================================================
function renderTableBarangMasuk(invoices) {
  const tbody = document.getElementById("tableBarangMasuk");

  if (!invoices.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Belum ada barang masuk pada periode ini</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  [...invoices].reverse().forEach((inv, idx) => {
    const totalQty = (inv.items || []).reduce((s, i) => s + (parseInt(i.stok) || 0), 0);
    const jenisSet = new Set((inv.items || []).map(i => i.nama?.toLowerCase()).filter(Boolean));
    const nilaiHPP = (inv.items || []).reduce((s, i) => s + (parseFloat(i.hargaHPP || 0) * (parseInt(i.stok) || 0)), 0);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td style="font-weight:700;color:rgb(16,44,168)">${inv.invoice}</td>
      <td>${fmtDate(inv.tanggal)}</td>
      <td style="font-weight:600">${inv.supplier || "—"}</td>
      <td><strong>${totalQty}</strong> pcs</td>
      <td>${jenisSet.size} jenis</td>
      <td class="harga-cell">${fmtRp(nilaiHPP)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
// ===== EXPORT EXCEL =========================================
// ============================================================

document.getElementById("btnExportExcel").addEventListener("click", exportExcel);

function exportExcel() {
  const range  = getDateRange(filterPeriode.value);
  const period = document.getElementById("periodText").textContent;
  const printedAt = new Date().toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  // ── RAW DATA ──────────────────────────────────────────────
  const allInvoices = loadInvoices().filter(inv => inRange(inv.tanggal, range));
  const allSOs      = loadStockOuts().filter(so  => inRange(so.tanggal, range));

  // ── HITUNG RINGKASAN ─────────────────────────────────────
  let totalRevenue = 0, totalHPP = 0, qtyMasuk = 0, qtyKeluar = 0;
  const prodMap = {};
  const kategoriMap = {};
  const customerSet = new Set();

  allInvoices.forEach(inv =>
    (inv.items || []).forEach(i => { qtyMasuk += parseInt(i.stok) || 0; })
  );

  allSOs.forEach(so => {
    if (so.penerima) customerSet.add(so.penerima.toLowerCase());
    (so.items || []).forEach(item => {
      const qty  = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hpp  = parseFloat(item.hargaHPP || 0);
      const rev  = jual * qty;
      const hppT = hpp * qty;
      totalRevenue += rev;
      totalHPP     += hppT;
      qtyKeluar    += qty;

      const kat = item.kategori || "Lainnya";
      if (!kategoriMap[kat]) kategoriMap[kat] = { revenue: 0, qty: 0 };
      kategoriMap[kat].revenue += rev;
      kategoriMap[kat].qty     += qty;

      const key = item.nama || "—";
      if (!prodMap[key]) prodMap[key] = { nama: key, kategori: item.kategori || "—", qty: 0, revenue: 0, hpp: 0 };
      prodMap[key].qty     += qty;
      prodMap[key].revenue += rev;
      prodMap[key].hpp     += hppT;
    });
  });

  const totalProfit = totalRevenue - totalHPP;
  const marginPct   = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const wb = XLSX.utils.book_new();

  // ════════════════════════════════════════════════════════
  // SHEET 1 — RINGKASAN / COVER
  // ════════════════════════════════════════════════════════
  const ws1 = XLSX.utils.aoa_to_sheet([]);

  const s1Data = [
    /* 1  */ ["LAPORAN KEUANGAN & INVENTORI"],
    /* 2  */ ["INVENZ — Sistem Manajemen Inventori"],
    /* 3  */ [],
    /* 4  */ ["Periode Laporan", period],
    /* 5  */ ["Dicetak oleh",    loggedUser],
    /* 6  */ ["Tanggal cetak",   printedAt],
    /* 7  */ [],
    /* 8  */ ["━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"],
    /* 9  */ ["NERACA KEUANGAN"],
    /* 10 */ ["━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"],
    /* 11 */ ["Keterangan", "Nilai (Rp)", "Catatan"],
    /* 12 */ ["Revenue / Pendapatan Kotor", totalRevenue, "Total penjualan pada periode ini"],
    /* 13 */ ["Total HPP / Harga Pokok Penjualan", totalHPP, "Modal yang dikeluarkan"],
    /* 14 */ ["Profit / Laba Bersih", totalProfit, totalProfit >= 0 ? "Positif ✔" : "Negatif ✘"],
    /* 15 */ ["Profit Margin (%)", marginPct / 100, "Persentase keuntungan dari revenue"],
    /* 16 */ [],
    /* 17 */ ["━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"],
    /* 18 */ ["RINGKASAN INVENTORI & TRANSAKSI"],
    /* 19 */ ["━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"],
    /* 20 */ ["Keterangan", "Nilai", "Satuan"],
    /* 21 */ ["Total Barang Masuk",  qtyMasuk,          "pcs"],
    /* 22 */ ["Total Invoice Masuk", allInvoices.length, "invoice"],
    /* 23 */ ["Total Barang Keluar", qtyKeluar,          "pcs"],
    /* 24 */ ["Total Transaksi Keluar", allSOs.length,   "transaksi"],
    /* 25 */ ["Total Customer Unik",  customerSet.size,  "pelanggan"],
    /* 26 */ [],
    /* 27 */ ["━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"],
    /* 28 */ ["DISTRIBUSI PER KATEGORI"],
    /* 29 */ ["━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"],
    /* 30 */ ["Kategori", "Total Revenue (Rp)", "Total Qty", "Kontribusi (%)"],
  ];

  // Tambahkan baris kategori
  Object.entries(kategoriMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .forEach(([kat, data]) => {
      const kontribusi = totalRevenue > 0 ? data.revenue / totalRevenue : 0;
      s1Data.push([kat, data.revenue, data.qty, kontribusi]);
    });

  XLSX.utils.sheet_add_aoa(ws1, s1Data, { origin: "A1" });

  // ── COLUMN WIDTHS ─────────────────────────────────────
  ws1["!cols"] = [{ wch: 38 }, { wch: 22 }, { wch: 30 }, { wch: 20 }];

  // ── MERGES ───────────────────────────────────────────
  ws1["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Judul utama
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Sub-judul
    { s: { r: 7, c: 0 }, e: { r: 7, c: 3 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 3 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } },
    { s: { r: 16, c: 0 }, e: { r: 16, c: 3 } },
    { s: { r: 17, c: 0 }, e: { r: 17, c: 3 } },
    { s: { r: 18, c: 0 }, e: { r: 18, c: 3 } },
    { s: { r: 26, c: 0 }, e: { r: 26, c: 3 } },
    { s: { r: 27, c: 0 }, e: { r: 27, c: 3 } },
    { s: { r: 28, c: 0 }, e: { r: 28, c: 3 } },
  ];

  // ── CELL STYLES ──────────────────────────────────────
  // Judul utama
  applyExcelStyle(ws1, "A1", {
    font: { name: "Arial", bold: true, sz: 16, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "102CA8" } },
    alignment: { horizontal: "center", vertical: "center" },
  });
  // Sub-judul
  applyExcelStyle(ws1, "A2", {
    font: { name: "Arial", bold: true, sz: 11, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1E3FB8" } },
    alignment: { horizontal: "center", vertical: "center" },
  });
  // Meta info labels (baris 4–6 col A)
  ["A4","A5","A6"].forEach(cell => applyExcelStyle(ws1, cell, {
    font: { name: "Arial", bold: true, sz: 10 },
    fill: { fgColor: { rgb: "EEF2FF" } },
  }));
  ["B4","B5","B6"].forEach(cell => applyExcelStyle(ws1, cell, {
    font: { name: "Arial", sz: 10 },
    fill: { fgColor: { rgb: "EEF2FF" } },
  }));

  // Section headers
  ["A9","A18","A28"].forEach(cell => applyExcelStyle(ws1, cell, {
    font: { name: "Arial", bold: true, sz: 11, color: { rgb: "102CA8" } },
    alignment: { horizontal: "center" },
  }));

  // Tabel Neraca — header baris 11
  ["A11","B11","C11"].forEach(cell => applyExcelStyle(ws1, cell, {
    font: { name: "Arial", bold: true, sz: 10, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "102CA8" } },
    alignment: { horizontal: "center" },
    border: { bottom: { style: "medium", color: { rgb: "000000" } } },
  }));

  // Baris data neraca (12–15)
  for (let r = 11; r <= 14; r++) {
    const addr = String.fromCharCode(65) + (r + 1);  // A12..A15
    applyExcelStyle(ws1, `A${r+1}`, { font: { name: "Arial", sz: 10 }, fill: { fgColor: { rgb: r % 2 === 1 ? "F0F4FF" : "FFFFFF" } } });
    applyExcelStyle(ws1, `B${r+1}`, { font: { name: "Arial", sz: 10, bold: true }, fill: { fgColor: { rgb: r % 2 === 1 ? "F0F4FF" : "FFFFFF" } }, alignment: { horizontal: "right" }, numFmt: '#,##0' });
    applyExcelStyle(ws1, `C${r+1}`, { font: { name: "Arial", sz: 10, italic: true, color: { rgb: "666666" } }, fill: { fgColor: { rgb: r % 2 === 1 ? "F0F4FF" : "FFFFFF" } } });
  }
  // Margin row (baris 15) — format persen
  applyExcelStyle(ws1, "B15", { font: { name: "Arial", sz: 10, bold: true }, alignment: { horizontal: "right" }, numFmt: '0.00%' });

  // Profit baris — warna sesuai nilai
  if (totalProfit >= 0) {
    applyExcelStyle(ws1, "A14", { font: { name: "Arial", bold: true, sz: 10, color: { rgb: "0A6640" } } });
    applyExcelStyle(ws1, "B14", { font: { name: "Arial", bold: true, sz: 10, color: { rgb: "0A6640" } }, alignment: { horizontal: "right" }, numFmt: '#,##0' });
  } else {
    applyExcelStyle(ws1, "A14", { font: { name: "Arial", bold: true, sz: 10, color: { rgb: "CC2222" } } });
    applyExcelStyle(ws1, "B14", { font: { name: "Arial", bold: true, sz: 10, color: { rgb: "CC2222" } }, alignment: { horizontal: "right" }, numFmt: '#,##0' });
  }

  // Tabel Inventori — header baris 20
  ["A20","B20","C20"].forEach(cell => applyExcelStyle(ws1, cell, {
    font: { name: "Arial", bold: true, sz: 10, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "102CA8" } },
    alignment: { horizontal: "center" },
  }));
  for (let r = 20; r <= 24; r++) {
    applyExcelStyle(ws1, `A${r+1}`, { font: { name: "Arial", sz: 10 }, fill: { fgColor: { rgb: r % 2 === 0 ? "F0F4FF" : "FFFFFF" } } });
    applyExcelStyle(ws1, `B${r+1}`, { font: { name: "Arial", bold: true, sz: 10 }, fill: { fgColor: { rgb: r % 2 === 0 ? "F0F4FF" : "FFFFFF" } }, alignment: { horizontal: "right" }, numFmt: '#,##0' });
    applyExcelStyle(ws1, `C${r+1}`, { font: { name: "Arial", sz: 10, color: { rgb: "888888" } }, fill: { fgColor: { rgb: r % 2 === 0 ? "F0F4FF" : "FFFFFF" } } });
  }

  // Kategori header — baris 30
  ["A30","B30","C30","D30"].forEach(cell => applyExcelStyle(ws1, cell, {
    font: { name: "Arial", bold: true, sz: 10, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "102CA8" } },
    alignment: { horizontal: "center" },
  }));
  const katStartRow = 31;
  Object.entries(kategoriMap).forEach(([_, __], idx) => {
    const r = katStartRow + idx;
    applyExcelStyle(ws1, `A${r}`, { font: { name: "Arial", sz: 10 }, fill: { fgColor: { rgb: idx % 2 === 0 ? "F0F4FF" : "FFFFFF" } } });
    applyExcelStyle(ws1, `B${r}`, { font: { name: "Arial", bold: true, sz: 10 }, fill: { fgColor: { rgb: idx % 2 === 0 ? "F0F4FF" : "FFFFFF" } }, alignment: { horizontal: "right" }, numFmt: '#,##0' });
    applyExcelStyle(ws1, `C${r}`, { font: { name: "Arial", sz: 10 }, fill: { fgColor: { rgb: idx % 2 === 0 ? "F0F4FF" : "FFFFFF" } }, alignment: { horizontal: "right" } });
    applyExcelStyle(ws1, `D${r}`, { font: { name: "Arial", sz: 10 }, fill: { fgColor: { rgb: idx % 2 === 0 ? "F0F4FF" : "FFFFFF" } }, alignment: { horizontal: "right" }, numFmt: '0.00%' });
  });

  ws1["!rowheights"] = [{ hpt: 28 }, { hpt: 18 }]; // Baris 1 & 2 lebih tinggi
  XLSX.utils.book_append_sheet(wb, ws1, "📊 Ringkasan");


  // ════════════════════════════════════════════════════════
  // SHEET 2 — TRANSAKSI STOCK OUT
  // ════════════════════════════════════════════════════════
  const ws2 = XLSX.utils.aoa_to_sheet([]);

  const so_header = ["#", "No. Invoice", "Tanggal", "Customer / Penerima", "Metode Pembayaran", "Total Item (pcs)", "Revenue (Rp)", "HPP (Rp)", "Profit (Rp)", "Margin (%)"];
  const so_rows = [
    [`TRANSAKSI STOCK OUT — ${period}`],
    [],
    so_header,
  ];

  let so_totalRev = 0, so_totalHPP = 0, so_totalQty = 0;

  allSOs.forEach((so, i) => {
    let rev = 0, h = 0, qty = 0;
    (so.items || []).forEach(item => {
      const q = parseInt(item.jumlahKeluar) || 0;
      rev += parseFloat(item.hargaJual || item.hargaHPP || 0) * q;
      h   += parseFloat(item.hargaHPP || 0) * q;
      qty += q;
    });
    const profit = rev - h;
    const margin = rev > 0 ? profit / rev : 0;
    so_totalRev += rev; so_totalHPP += h; so_totalQty += qty;
    so_rows.push([i + 1, so.invoice, so.tanggal, so.penerima || "—", so.paymentNama || "—", qty, rev, h, profit, margin]);
  });

  // Baris total
  so_rows.push([]);
  so_rows.push(["TOTAL", "", "", "", "", so_totalQty, so_totalRev, so_totalHPP, so_totalRev - so_totalHPP, so_totalRev > 0 ? (so_totalRev - so_totalHPP) / so_totalRev : 0]);

  XLSX.utils.sheet_add_aoa(ws2, so_rows, { origin: "A1" });
  ws2["!cols"] = [
    { wch: 5 }, { wch: 22 }, { wch: 14 }, { wch: 26 }, { wch: 20 },
    { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 13 }
  ];
  ws2["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

  // Style sheet 2
  applyExcelStyle(ws2, "A1", {
    font: { name: "Arial", bold: true, sz: 13, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "102CA8" } },
    alignment: { horizontal: "center", vertical: "center" },
  });

  so_header.forEach((_, ci) => {
    const cell = XLSX.utils.encode_cell({ r: 2, c: ci });
    applyExcelStyle(ws2, cell, {
      font: { name: "Arial", bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E3FB8" } },
      alignment: { horizontal: "center" },
      border: { bottom: { style: "medium", color: { rgb: "000000" } } },
    });
  });

  for (let ri = 3; ri < 3 + allSOs.length; ri++) {
    const isEven = (ri - 3) % 2 === 0;
    const bg = isEven ? "F0F4FF" : "FFFFFF";
    for (let ci = 0; ci < 10; ci++) {
      const cell = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (!ws2[cell]) continue;
      const numFmt = ci === 6 || ci === 7 || ci === 8 ? '#,##0' : ci === 9 ? '0.00%' : null;
      applyExcelStyle(ws2, cell, {
        font: { name: "Arial", sz: 10, bold: ci === 6 || ci === 9, color: ci === 8 ? { rgb: ws2[cell].v >= 0 ? "0A6640" : "CC2222" } : undefined },
        fill: { fgColor: { rgb: bg } },
        alignment: { horizontal: ci >= 5 ? "right" : ci === 0 ? "center" : "left" },
        numFmt,
      });
    }
  }

  // Style baris TOTAL
  const totalRowIdx = 3 + allSOs.length + 1;
  for (let ci = 0; ci < 10; ci++) {
    const cell = XLSX.utils.encode_cell({ r: totalRowIdx, c: ci });
    if (!ws2[cell]) continue;
    const numFmt = ci === 6 || ci === 7 || ci === 8 ? '#,##0' : ci === 9 ? '0.00%' : null;
    applyExcelStyle(ws2, cell, {
      font: { name: "Arial", bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "102CA8" } },
      alignment: { horizontal: ci >= 5 ? "right" : "center" },
      numFmt,
      border: { top: { style: "medium", color: { rgb: "000000" } } },
    });
  }

  XLSX.utils.book_append_sheet(wb, ws2, "📦 Transaksi Stock Out");


  // ════════════════════════════════════════════════════════
  // SHEET 3 — BARANG MASUK
  // ════════════════════════════════════════════════════════
  const ws3 = XLSX.utils.aoa_to_sheet([]);

  const inv_header = ["#", "No. Invoice", "Tanggal", "Supplier", "Total Qty (pcs)", "Jenis Barang", "Nilai HPP (Rp)"];
  const inv_rows = [
    [`RIWAYAT BARANG MASUK — ${period}`],
    [],
    inv_header,
  ];

  let inv_totalQty = 0, inv_totalNilai = 0;

  allInvoices.forEach((inv, i) => {
    const qty   = (inv.items || []).reduce((s, it) => s + (parseInt(it.stok) || 0), 0);
    const jenis = new Set((inv.items || []).map(it => it.nama).filter(Boolean)).size;
    const nilai = (inv.items || []).reduce((s, it) => s + (parseFloat(it.hargaHPP || 0) * (parseInt(it.stok) || 0)), 0);
    inv_totalQty   += qty;
    inv_totalNilai += nilai;
    inv_rows.push([i + 1, inv.invoice, inv.tanggal, inv.supplier || "—", qty, jenis, nilai]);
  });

  inv_rows.push([]);
  inv_rows.push(["TOTAL", "", "", "", inv_totalQty, "", inv_totalNilai]);

  XLSX.utils.sheet_add_aoa(ws3, inv_rows, { origin: "A1" });
  ws3["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 14 }, { wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 20 }];
  ws3["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

  applyExcelStyle(ws3, "A1", {
    font: { name: "Arial", bold: true, sz: 13, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "0A6640" } },
    alignment: { horizontal: "center" },
  });

  inv_header.forEach((_, ci) => {
    const cell = XLSX.utils.encode_cell({ r: 2, c: ci });
    applyExcelStyle(ws3, cell, {
      font: { name: "Arial", bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "16A34A" } },
      alignment: { horizontal: "center" },
      border: { bottom: { style: "medium", color: { rgb: "000000" } } },
    });
  });

  for (let ri = 3; ri < 3 + allInvoices.length; ri++) {
    const bg = (ri - 3) % 2 === 0 ? "F0FFF4" : "FFFFFF";
    for (let ci = 0; ci < 7; ci++) {
      const cell = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (!ws3[cell]) continue;
      applyExcelStyle(ws3, cell, {
        font: { name: "Arial", sz: 10, bold: ci === 6 },
        fill: { fgColor: { rgb: bg } },
        alignment: { horizontal: ci >= 4 ? "right" : ci === 0 ? "center" : "left" },
        numFmt: ci === 6 ? '#,##0' : null,
      });
    }
  }

  const inv_totalRowIdx = 3 + allInvoices.length + 1;
  for (let ci = 0; ci < 7; ci++) {
    const cell = XLSX.utils.encode_cell({ r: inv_totalRowIdx, c: ci });
    if (!ws3[cell]) continue;
    applyExcelStyle(ws3, cell, {
      font: { name: "Arial", bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "0A6640" } },
      alignment: { horizontal: ci >= 4 ? "right" : "center" },
      numFmt: ci === 6 ? '#,##0' : null,
      border: { top: { style: "medium", color: { rgb: "000000" } } },
    });
  }

  XLSX.utils.book_append_sheet(wb, ws3, "🚚 Barang Masuk");


  // ════════════════════════════════════════════════════════
  // SHEET 4 — TOP 10 PRODUK TERLARIS
  // ════════════════════════════════════════════════════════
  const ws4 = XLSX.utils.aoa_to_sheet([]);

  const top_header = ["#", "Nama Produk", "Kategori", "Qty Terjual (pcs)", "Revenue (Rp)", "HPP (Rp)", "Profit (Rp)", "Margin (%)"];
  const top_rows = [
    [`TOP 10 PRODUK TERLARIS — ${period}`],
    [],
    top_header,
  ];

  const sortedProds = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 10);
  sortedProds.forEach((p, i) => {
    const profit = p.revenue - p.hpp;
    const margin = p.revenue > 0 ? profit / p.revenue : 0;
    top_rows.push([i + 1, p.nama, p.kategori, p.qty, p.revenue, p.hpp, profit, margin]);
  });

  XLSX.utils.sheet_add_aoa(ws4, top_rows, { origin: "A1" });
  ws4["!cols"] = [{ wch: 5 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 13 }];
  ws4["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

  applyExcelStyle(ws4, "A1", {
    font: { name: "Arial", bold: true, sz: 13, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "5B21B6" } },
    alignment: { horizontal: "center" },
  });

  top_header.forEach((_, ci) => {
    const cell = XLSX.utils.encode_cell({ r: 2, c: ci });
    applyExcelStyle(ws4, cell, {
      font: { name: "Arial", bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "7C3AED" } },
      alignment: { horizontal: "center" },
      border: { bottom: { style: "medium", color: { rgb: "000000" } } },
    });
  });

  sortedProds.forEach((p, idx) => {
    const ri = 3 + idx;
    const bg = idx % 2 === 0 ? "F5F3FF" : "FFFFFF";
    const profit = p.revenue - p.hpp;
    for (let ci = 0; ci < 8; ci++) {
      const cell = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (!ws4[cell]) continue;
      const numFmt = ci === 4 || ci === 5 || ci === 6 ? '#,##0' : ci === 7 ? '0.00%' : null;
      applyExcelStyle(ws4, cell, {
        font: {
          name: "Arial", sz: 10, bold: ci === 1 || ci === 6,
          color: ci === 6 ? { rgb: profit >= 0 ? "0A6640" : "CC2222" } : undefined,
        },
        fill: { fgColor: { rgb: bg } },
        alignment: { horizontal: ci >= 3 ? "right" : ci === 0 ? "center" : "left" },
        numFmt,
      });
    }
    // Nomor urut dengan rank medal effect (Top 3)
    if (idx < 3) {
      const colors = ["FFD700", "C0C0C0", "CD7F32"]; // Emas, Perak, Perunggu
      applyExcelStyle(ws4, `A${ri + 1}`, {
        font: { name: "Arial", bold: true, sz: 11, color: { rgb: colors[idx] } },
        fill: { fgColor: { rgb: bg } },
        alignment: { horizontal: "center" },
      });
    }
  });

  XLSX.utils.book_append_sheet(wb, ws4, "🏆 Top 10 Produk");


  // ════════════════════════════════════════════════════════
  // SHEET 5 — DETAIL ITEM PER TRANSAKSI
  // ════════════════════════════════════════════════════════
  const ws5 = XLSX.utils.aoa_to_sheet([]);

  const detail_header = ["#", "No. Invoice", "Tanggal", "Customer", "Nama Produk", "Kategori", "Qty (pcs)", "Harga Jual (Rp)", "HPP/Unit (Rp)", "Subtotal Revenue (Rp)", "Subtotal HPP (Rp)", "Subtotal Profit (Rp)"];
  const detail_rows = [
    [`DETAIL ITEM TRANSAKSI — ${period}`],
    [],
    detail_header,
  ];

  let rowCount = 0;
  allSOs.forEach(so => {
    (so.items || []).forEach(item => {
      const qty  = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hpp  = parseFloat(item.hargaHPP || 0);
      rowCount++;
      detail_rows.push([
        rowCount, so.invoice, so.tanggal, so.penerima || "—",
        item.nama || "—", item.kategori || "—",
        qty, jual, hpp,
        jual * qty, hpp * qty, (jual - hpp) * qty,
      ]);
    });
  });

  XLSX.utils.sheet_add_aoa(ws5, detail_rows, { origin: "A1" });
  ws5["!cols"] = [
    { wch: 5 }, { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 25 }, { wch: 15 },
    { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 18 }
  ];
  ws5["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }];

  applyExcelStyle(ws5, "A1", {
    font: { name: "Arial", bold: true, sz: 13, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "856404" } },
    alignment: { horizontal: "center" },
  });

  detail_header.forEach((_, ci) => {
    const cell = XLSX.utils.encode_cell({ r: 2, c: ci });
    applyExcelStyle(ws5, cell, {
      font: { name: "Arial", bold: true, sz: 9, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "B45309" } },
      alignment: { horizontal: "center", wrapText: true },
      border: { bottom: { style: "medium", color: { rgb: "000000" } } },
    });
  });

  for (let ri = 3; ri < 3 + rowCount; ri++) {
    const bg = (ri - 3) % 2 === 0 ? "FFFBEB" : "FFFFFF";
    for (let ci = 0; ci < 12; ci++) {
      const cell = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (!ws5[cell]) continue;
      const numFmt = [7, 8, 9, 10, 11].includes(ci) ? '#,##0' : null;
      applyExcelStyle(ws5, cell, {
        font: { name: "Arial", sz: 9, bold: [9, 11].includes(ci) },
        fill: { fgColor: { rgb: bg } },
        alignment: { horizontal: ci >= 6 ? "right" : ci === 0 ? "center" : "left" },
        numFmt,
      });
    }
  }

  XLSX.utils.book_append_sheet(wb, ws5, "📋 Detail Item");


  // ════════════════════════════════════════════════════════
  // SAVE FILE
  // ════════════════════════════════════════════════════════
  const safePeriod = period.replace(/[\/\\?%*:|"<>]/g, "_").replace(/ /g, "_");
  XLSX.writeFile(wb, `Laporan_Invenz_${safePeriod}.xlsx`, {
    bookType: "xlsx",
    compression: true,
  });
}


// ============================================================
// ===== HELPER: APPLY CELL STYLE (SheetJS cell-level) ========
// ============================================================
// SheetJS Community Edition tidak mendukung styling secara native.
// Fungsi ini meng-inject properti `s` ke cell object agar style
// terbaca oleh file xlsx yang dibuka di Excel / LibreOffice Calc.
// Catatan: Untuk fungsionalitas styling penuh, pertimbangkan upgrade
// ke SheetJS Pro atau gunakan exceljs sebagai alternatif.

function applyExcelStyle(ws, cellAddr, style) {
  if (!ws[cellAddr]) {
    // Buat cell kosong jika belum ada agar style bisa diterapkan
    ws[cellAddr] = { t: "z", v: undefined };
  }
  // Gabungkan style yang sudah ada dengan style baru
  ws[cellAddr].s = Object.assign(ws[cellAddr].s || {}, {
    font:      style.font      || {},
    fill:      style.fill      ? { patternType: "solid", ...style.fill } : undefined,
    alignment: style.alignment || {},
    border:    style.border    || {},
    numFmt:    style.numFmt    || undefined,
  });
  // Bersihkan undefined keys
  Object.keys(ws[cellAddr].s).forEach(k => {
    if (ws[cellAddr].s[k] === undefined) delete ws[cellAddr].s[k];
  });
}

// ============================================================
// ===== REVISI FITUR PRINT (MEMPERBAIKI PAGE KOSONG) =========
// ============================================================
document.getElementById("btnPrint").addEventListener("click", () => {
  const reportContent = document.getElementById("reportContent");
  const printArea = document.getElementById("printArea");

  if (!reportContent || !printArea) {
    alert("Elemen laporan tidak ditemukan.");
    return;
  }

  // 1. Salin seluruh markup HTML dari kontainer laporan ke area cetak
  printArea.innerHTML = reportContent.innerHTML;

  // 2. Hilangkan filter-bar di dalam area print agar tidak ikut tercetak di kertas
  const innerFilter = printArea.querySelector("#filterBar");
  if (innerFilter) innerFilter.remove();

  // 3. Eksekusi perintah cetak browser
  window.print();

  // 4. Bersihkan kembali area cetak setelah selesai agar menghemat memory halaman
  printArea.innerHTML = "";
});

// ===== INITIAL START =====
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
});