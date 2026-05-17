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
let chartLineRevenue = null; // TAMBAHAN BARU

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
  renderChartLineRevenue(filteredStockOuts); // TAMBAHAN BARU

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
  const monthMap = {}; // label → { revenue, hpp }

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
  const dailyMap = {}; // tanggal → revenue

  stockOuts.forEach(so => {
    const tanggal = so.tanggal; // format YYYY-MM-DD
    if (!dailyMap[tanggal]) dailyMap[tanggal] = 0;
    
    (so.items || []).forEach(item => {
      const qty  = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      dailyMap[tanggal] += jual * qty;
    });
  });

  // Sort by date
  const sortedDates = Object.keys(dailyMap).sort();
  const labels = sortedDates.map(d => fmtDate(d)); // Format tanggal untuk label
  const revenues = sortedDates.map(d => dailyMap[d]);

  // Calculate moving average (7-day)
  const movingAvg = [];
  const window = 7;
  for (let i = 0; i < revenues.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = revenues.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    movingAvg.push(avg);
  }

  const empty = labels.length === 0;
  document.getElementById("emptyLineRevenue").classList.toggle("hidden", !empty);

  const ctx = document.getElementById("chartLineRevenue");
  if (empty) { 
    ctx.style.display = "none"; 
    return; 
  }
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
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { family: "Poppins", size: 11 },
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleFont: { family: "Poppins", size: 12, weight: "600" },
          bodyFont: { family: "Poppins", size: 11 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              label += fmtRp(context.parsed.y);
              return label;
            }
          }
        },
      },
      scales: {
        x: {
          ticks: {
            font: { family: "Poppins", size: 10 },
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: "Poppins", size: 10 },
            callback: v => {
              if (v >= 1000000) return "Rp " + (v / 1000000).toFixed(1) + "jt";
              if (v >= 1000) return "Rp " + (v / 1000).toFixed(0) + "rb";
              return "Rp " + v;
            },
          },
          grid: {
            color: "rgba(0,0,0,0.05)",
          },
        },
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
    const nilaiHPP = (inv.items || []).reduce((s, i) =>
      s + (parseFloat(i.hargaHPP || 0) * (parseInt(i.stok) || 0)), 0);

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

  const allInvoices  = loadInvoices().filter(inv => inRange(inv.tanggal, range));
  const allSOs       = loadStockOuts().filter(so  => inRange(so.tanggal, range));

  const wb = XLSX.utils.book_new();

  // ===== SHEET 1: RINGKASAN =====
  let revenue = 0, hpp = 0, qtyMasuk = 0, qtyKeluar = 0;
  allInvoices.forEach(inv => (inv.items || []).forEach(i => { qtyMasuk += parseInt(i.stok) || 0; }));
  allSOs.forEach(so => (so.items || []).forEach(i => {
    const qty = parseInt(i.jumlahKeluar) || 0;
    revenue += parseFloat(i.hargaJual || i.hargaHPP || 0) * qty;
    hpp     += parseFloat(i.hargaHPP || 0) * qty;
    qtyKeluar += qty;
  }));
  const profit = revenue - hpp;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

  const summaryData = [
    ["LAPORAN INVENZ — " + period],
    ["Dicetak oleh:", loggedUser],
    ["Tanggal cetak:", new Date().toLocaleString("id-ID")],
    [],
    ["NERACA KEUANGAN"],
    ["Keterangan", "Nilai"],
    ["Revenue / Pendapatan", revenue],
    ["Total HPP / Modal", hpp],
    ["Profit / Keuntungan", profit],
    ["Profit Margin (%)", parseFloat(margin)],
    [],
    ["RINGKASAN INVENTORI"],
    ["Total Barang Masuk (qty)", qtyMasuk],
    ["Total Barang Keluar (qty)", qtyKeluar],
    ["Total Transaksi (invoice keluar)", allSOs.length],
    ["Total Invoice Masuk", allInvoices.length],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan");

  // ===== SHEET 2: TRANSAKSI STOCK OUT =====
  const soRows = [["#","Invoice","Tanggal","Customer","Metode Bayar","Total Qty","Revenue","HPP","Profit"]];
  allSOs.forEach((so, i) => {
    let rev = 0, h = 0, qty = 0;
    (so.items || []).forEach(item => {
      const q = parseInt(item.jumlahKeluar) || 0;
      rev += parseFloat(item.hargaJual || item.hargaHPP || 0) * q;
      h   += parseFloat(item.hargaHPP || 0) * q;
      qty += q;
    });
    soRows.push([i+1, so.invoice, so.tanggal, so.penerima || "—", so.paymentNama || "—", qty, rev, h, rev - h]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(soRows);
  ws2["!cols"] = [{ wch: 4 },{ wch: 20 },{ wch: 14 },{ wch: 22 },{ wch: 14 },{ wch: 12 },{ wch: 18 },{ wch: 18 },{ wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Transaksi Stock Out");

  // ===== SHEET 3: BARANG MASUK =====
  const invRows = [["#","Invoice","Tanggal","Supplier","Total Qty","Jenis Barang","Nilai HPP"]];
  allInvoices.forEach((inv, i) => {
    const qty   = (inv.items || []).reduce((s, it) => s + (parseInt(it.stok) || 0), 0);
    const jenis = new Set((inv.items || []).map(it => it.nama)).size;
    const nilai = (inv.items || []).reduce((s, it) => s + (parseFloat(it.hargaHPP || 0) * (parseInt(it.stok) || 0)), 0);
    invRows.push([i+1, inv.invoice, inv.tanggal, inv.supplier || "—", qty, jenis, nilai]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(invRows);
  ws3["!cols"] = [{ wch: 4 },{ wch: 20 },{ wch: 14 },{ wch: 22 },{ wch: 12 },{ wch: 14 },{ wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Barang Masuk");

  // ===== SHEET 4: TOP PRODUK =====
  const prodMap = {};
  allSOs.forEach(so => (so.items || []).forEach(item => {
    const key = item.nama || "—";
    if (!prodMap[key]) prodMap[key] = { nama: key, kategori: item.kategori || "—", qty: 0, revenue: 0, hpp: 0 };
    const qty = parseInt(item.jumlahKeluar) || 0;
    prodMap[key].qty     += qty;
    prodMap[key].revenue += parseFloat(item.hargaJual || item.hargaHPP || 0) * qty;
    prodMap[key].hpp     += parseFloat(item.hargaHPP || 0) * qty;
  }));
  const prodRows = [["#","Nama Produk","Kategori","Qty Terjual","Revenue","HPP","Profit","Margin (%)"]];
  Object.values(prodMap).sort((a,b) => b.qty - a.qty).forEach((p, i) => {
    const proft = p.revenue - p.hpp;
    const marg  = p.revenue > 0 ? ((proft / p.revenue) * 100).toFixed(2) : 0;
    prodRows.push([i+1, p.nama, p.kategori, p.qty, p.revenue, p.hpp, proft, parseFloat(marg)]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(prodRows);
  ws4["!cols"] = [{ wch: 4 },{ wch: 30 },{ wch: 16 },{ wch: 14 },{ wch: 18 },{ wch: 18 },{ wch: 18 },{ wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Top Produk");

  // ===== SHEET 5: REVENUE HARIAN ===== (TAMBAHAN BARU)
  const dailyMap = {};
  allSOs.forEach(so => {
    const tanggal = so.tanggal;
    if (!dailyMap[tanggal]) dailyMap[tanggal] = 0;
    (so.items || []).forEach(item => {
      const qty = parseInt(item.jumlahKeluar) || 0;
      dailyMap[tanggal] += parseFloat(item.hargaJual || item.hargaHPP || 0) * qty;
    });
  });

  const dailyRows = [["Tanggal", "Revenue"]];
  Object.keys(dailyMap).sort().forEach(date => {
    dailyRows.push([date, dailyMap[date]]);
  });

  const ws5 = XLSX.utils.aoa_to_sheet(dailyRows);
  ws5["!cols"] = [{ wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws5, "Revenue Harian");

  // Download
  const fname = "Laporan_INVENZ_" + period.replace(/\s+/g, "_") + "_" + new Date().toISOString().slice(0,10) + ".xlsx";
  XLSX.writeFile(wb, fname);
}

// ============================================================
// ===== EXPORT PDF ===========================================
// ============================================================
document.getElementById("btnExportPDF").addEventListener("click", exportPDF);

function exportPDF() {
  const period = document.getElementById("periodText").textContent;
  const range  = getDateRange(filterPeriode.value);

  const allInvoices = loadInvoices().filter(inv => inRange(inv.tanggal, range));
  const allSOs      = loadStockOuts().filter(so  => inRange(so.tanggal, range));

  let revenue = 0, hpp = 0, qtyMasuk = 0, qtyKeluar = 0;
  allInvoices.forEach(inv => (inv.items || []).forEach(i => { qtyMasuk += parseInt(i.stok) || 0; }));
  allSOs.forEach(so => (so.items || []).forEach(i => {
    const qty = parseInt(i.jumlahKeluar) || 0;
    revenue  += parseFloat(i.hargaJual || i.hargaHPP || 0) * qty;
    hpp      += parseFloat(i.hargaHPP || 0) * qty;
    qtyKeluar += qty;
  }));
  const profit = revenue - hpp;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

  const prodMap = {};
  const customerSet = new Set();
  allSOs.forEach(so => {
    if (so.penerima) customerSet.add(so.penerima);
    (so.items || []).forEach(item => {
      const key = item.nama || "—";
      if (!prodMap[key]) prodMap[key] = { nama: key, kategori: item.kategori || "—", qty: 0, revenue: 0, hpp: 0 };
      const qty = parseInt(item.jumlahKeluar) || 0;
      prodMap[key].qty     += qty;
      prodMap[key].revenue += parseFloat(item.hargaJual || item.hargaHPP || 0) * qty;
      prodMap[key].hpp     += parseFloat(item.hargaHPP || 0) * qty;
    });
  });

  const topProduk = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  const topRows = topProduk.map((p, i) => {
    const proft = p.revenue - p.hpp;
    const marg  = p.revenue > 0 ? ((proft / p.revenue) * 100).toFixed(1) : 0;
    return `<tr>
      <td>${i + 1}</td>
      <td>${p.nama}</td>
      <td>${p.kategori}</td>
      <td>${p.qty} pcs</td>
      <td>${fmtRp(p.revenue)}</td>
      <td>${fmtRp(p.hpp)}</td>
      <td style="color:${proft >= 0 ? '#0a6640' : '#cc2222'}">${fmtRp(proft)}</td>
      <td>${marg}%</td>
    </tr>`;
  }).join("");

  const soRows = [...allSOs].reverse().slice(0, 30).map((so, i) => {
    let rev = 0, h = 0, qty = 0;
    (so.items || []).forEach(item => {
      const q = parseInt(item.jumlahKeluar) || 0;
      rev += parseFloat(item.hargaJual || item.hargaHPP || 0) * q;
      h   += parseFloat(item.hargaHPP || 0) * q;
      qty += q;
    });
    return `<tr>
      <td>${i + 1}</td>
      <td>${so.invoice}</td>
      <td>${fmtDate(so.tanggal)}</td>
      <td>${so.penerima || "—"}</td>
      <td>${so.paymentNama || "—"}</td>
      <td>${qty} pcs</td>
      <td>${fmtRp(rev)}</td>
      <td style="color:${(rev-h) >= 0 ? '#0a6640' : '#cc2222'}">${fmtRp(rev - h)}</td>
    </tr>`;
  }).join("");

  // TAMBAHAN: Daily revenue for PDF
  const dailyRevMap = {};
  allSOs.forEach(so => {
    const tanggal = so.tanggal;
    if (!dailyRevMap[tanggal]) dailyRevMap[tanggal] = 0;
    (so.items || []).forEach(item => {
      const qty = parseInt(item.jumlahKeluar) || 0;
      dailyRevMap[tanggal] += parseFloat(item.hargaJual || item.hargaHPP || 0) * qty;
    });
  });

  const dailyRevenueRows = Object.keys(dailyRevMap)
    .sort()
    .reverse()
    .slice(0, 10)
    .map((date, i) => `<tr>
      <td>${i + 1}</td>
      <td>${fmtDate(date)}</td>
      <td style="font-weight:700;color:#0a6640">${fmtRp(dailyRevMap[date])}</td>
    </tr>`)
    .join("");

  const now = new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const win = window.open("", "_blank", "width=900,height=700");
  win.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan INVENZ — ${period}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Poppins","Segoe UI",sans-serif; font-size: 11px; color: #111; background: #fff; padding: 24px; }
  .header { text-align: center; border-bottom: 3px solid #111; padding-bottom: 14px; margin-bottom: 18px; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
  .header .sub { font-size: 12px; color: #555; margin-top: 4px; }
  .header .period { display: inline-block; background: rgb(16,44,168); color: white; padding: 3px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 6px; }
  .meta { font-size: 11px; color: #888; margin-top: 6px; }

  .section { margin-bottom: 18px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgb(16,44,168); border-left: 3px solid rgb(16,44,168); padding-left: 8px; margin-bottom: 8px; }

  .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 8px; }
  .kpi { background: #f8f9fc; border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; }
  .kpi .label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; }
  .kpi .value { font-size: 15px; font-weight: 800; color: #111; }
  .kpi.revenue .value { color: #0a6640; }
  .kpi.profit  .value { color: rgb(16,44,168); }

  .inv-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
  .inv { background: #f8f9fc; border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; }
  .inv .label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; }
  .inv .value { font-size: 14px; font-weight: 800; color: #111; }

  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead { background: #0b2ca8; color: white; }
  th { padding: 6px 8px; text-align: center; font-weight: 600; }
  td { padding: 5px 8px; text-align: center; border-bottom: 0.5px solid #eee; }
  tr:nth-child(even) { background: #f0f4ff; }

  .footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 10px; color: #aaa; }
  .print-btn { display: block; width: 100%; margin: 16px 0 0; padding: 10px; background: rgb(16,44,168); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
  @media print { .print-btn { display: none; } body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <h1>INVENZ</h1>
  <div class="sub">Sistem Manajemen Inventori — Laporan Keuangan & Inventori</div>
  <div class="period">${period}</div>
  <div class="meta">Dicetak: ${now} &nbsp;·&nbsp; Operator: ${loggedUser}</div>
</div>

<div class="section">
  <div class="section-title">Neraca Keuangan</div>
  <div class="kpi-grid">
    <div class="kpi revenue"><div class="label">Revenue</div><div class="value">${fmtRp(revenue)}</div></div>
    <div class="kpi"><div class="label">HPP / Modal</div><div class="value">${fmtRp(hpp)}</div></div>
    <div class="kpi profit"><div class="label">Profit</div><div class="value">${fmtRp(profit)}</div></div>
    <div class="kpi"><div class="label">Margin</div><div class="value">${margin}%</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Ringkasan Inventori & Transaksi</div>
  <div class="inv-grid">
    <div class="inv"><div class="label">Barang Masuk</div><div class="value">${qtyMasuk} pcs</div></div>
    <div class="inv"><div class="label">Barang Keluar</div><div class="value">${qtyKeluar} pcs</div></div>
    <div class="inv"><div class="label">Total Transaksi</div><div class="value">${allSOs.length}</div></div>
    <div class="inv"><div class="label">Total Invoice Masuk</div><div class="value">${allInvoices.length}</div></div>
    <div class="inv"><div class="label">Total Penjualan</div><div class="value">${fmtRp(revenue)}</div></div>
    <div class="inv"><div class="label">Customer Unik</div><div class="value">${customerSet.size}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Top 10 Produk Terlaris</div>
  <table>
    <thead><tr><th>#</th><th>Produk</th><th>Kategori</th><th>Qty</th><th>Revenue</th><th>HPP</th><th>Profit</th><th>Margin</th></tr></thead>
    <tbody>${topRows || '<tr><td colspan="8" style="color:#aaa;font-style:italic;padding:16px">Belum ada data</td></tr>'}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Trend Revenue Harian (10 Hari Terakhir)</div>
  <table>
    <thead><tr><th>#</th><th>Tanggal</th><th>Revenue</th></tr></thead>
    <tbody>${dailyRevenueRows || '<tr><td colspan="3" style="color:#aaa;font-style:italic;padding:16px">Belum ada data</td></tr>'}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Riwayat Transaksi Stock Out ${allSOs.length > 30 ? "(30 Terbaru)" : ""}</div>
  <table>
    <thead><tr><th>#</th><th>Invoice</th><th>Tanggal</th><th>Customer</th><th>Pembayaran</th><th>Qty</th><th>Revenue</th><th>Profit</th></tr></thead>
    <tbody>${soRows || '<tr><td colspan="8" style="color:#aaa;font-style:italic;padding:16px">Belum ada data</td></tr>'}</tbody>
  </table>
</div>

<div class="footer">
  Laporan dibuat secara otomatis oleh sistem INVENZ<br>
  Data bersumber dari pencatatan lokal — ${now}
</div>

<button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
</body>
</html>
  `);
  win.document.close();
}

// ============================================================
// ===== PRINT ================================================
// ============================================================
document.getElementById("btnPrint").addEventListener("click", () => {
  document.body.classList.add("printing");
  window.print();
  setTimeout(() => document.body.classList.remove("printing"), 500);
});

// ============================================================
// ===== INIT =================================================
// ============================================================
// Set default to thismonth
filterPeriode.value = "thismonth";
renderAll();

// Auto-refresh on focus
window.addEventListener("focus", renderAll);