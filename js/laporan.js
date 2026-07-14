"use strict";

// ===== USER INFO =====
const loggedUser = INVENZ.user;
document.getElementById("sidebarUsername").textContent = loggedUser;
document.getElementById("sidebarAvatar").textContent = loggedUser
  .charAt(0)
  .toUpperCase();

// ===== SIDEBAR =====
const sidebar = document.getElementById("sidebar");
const sOverlay = document.getElementById("sidebarOverlay");
document.getElementById("hamburger").addEventListener("click", () => {
  sidebar.classList.add("open");
  sOverlay.classList.add("active");
});
document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
sOverlay.addEventListener("click", closeSidebar);
function closeSidebar() {
  sidebar.classList.remove("open");
  sOverlay.classList.remove("active");
}

// ===== LOGOUT =====
document.getElementById("logoutBtn").addEventListener("click", () => INVENZ.logout());


// ============================================================
// ===== CUSTOM RANGE STATE ===================================
// ============================================================
let customRangeActive = false;
let customRangeFrom = null;
let customRangeTo = null;

const filterPeriode = document.getElementById("filterPeriode");
const customRangePanel = document.getElementById("customRangePanel");
const customFromEl = document.getElementById("customFrom");
const customToEl = document.getElementById("customTo");
const btnApplyRange = document.getElementById("btnApplyRange");
const rangeBadge = document.getElementById("rangeBadge");
const rangeBadgeText = document.getElementById("rangeBadgeText");

function fmtShort(d) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

filterPeriode.addEventListener("change", () => {
  if (filterPeriode.value === "custom") {
    customRangePanel.classList.add("visible");
    if (!customFromEl.value) {
      const now = new Date();
      customFromEl.value = new Date(now.getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0];
      customToEl.value = now.toISOString().split("T")[0];
    }
  } else {
    customRangePanel.classList.remove("visible");
    customRangeActive = false;
    rangeBadge.classList.remove("visible");
    renderAll();
  }
});

btnApplyRange.addEventListener("click", () => {
  if (!customFromEl.value || !customToEl.value) {
    alert("Pilih tanggal dari dan sampai.");
    return;
  }
  const f = new Date(customFromEl.value + "T00:00:00");
  const t = new Date(customToEl.value + "T23:59:59");
  if (f > t) {
    alert("Tanggal 'Dari' tidak boleh lebih besar dari 'Sampai'.");
    return;
  }
  customRangeFrom = f;
  customRangeTo = t;
  customRangeActive = true;
  rangeBadgeText.textContent = fmtShort(f) + " – " + fmtShort(t);
  rangeBadge.classList.add("visible");
  customRangePanel.classList.remove("visible");
  renderAll();
});

rangeBadge.addEventListener("click", () => {
  customRangeActive = false;
  customRangeFrom = null;
  customRangeTo = null;
  rangeBadge.classList.remove("visible");
  filterPeriode.value = "all";
  renderAll();
});

// ============================================================
// ===== DATE RANGE HELPER ====================================
// ============================================================
function getDateRange(filter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filter) {
    case "today":
      return { from: today, to: new Date() };
    case "7d":
      return { from: new Date(today - 6 * 864e5), to: new Date() };
    case "thismonth":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(),
      };
    case "30d":
      return { from: new Date(today - 29 * 864e5), to: new Date() };
    case "lastmonth":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    case "3m":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
        to: new Date(),
      };
    case "6m":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
        to: new Date(),
      };
    case "ytd":
      return { from: new Date(now.getFullYear(), 0, 1), to: new Date() };
    case "1y":
      return {
        from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
        to: new Date(),
      };
    case "lastyear":
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
      };
    case "custom":
      if (customRangeActive && customRangeFrom && customRangeTo)
        return { from: customRangeFrom, to: customRangeTo };
      return null;
    default:
      return null;
  }
}

function inRange(dateStr, range) {
  if (!range) return true;
  const d = new Date(dateStr);
  return d >= range.from && d <= range.to;
}

const PERIODE_LABELS = {
  all: "All Time",
  today: "Hari Ini",
  "7d": "7 Hari Terakhir",
  thismonth: "Bulan Ini",
  "30d": "30 Hari Terakhir",
  lastmonth: "Bulan Kemarin",
  "3m": "3 Bulan Terakhir",
  "6m": "6 Bulan Terakhir",
  ytd: "YTD (Tahun Ini)",
  "1y": "12 Bulan Terakhir",
  lastyear: "Tahun Lalu",
  custom: "Custom Range",
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
  const bln = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${parseInt(d)} ${bln[parseInt(m) - 1]} ${y}`;
}
function fmtPct(n) {
  if (!isFinite(n) || isNaN(n)) return "0%";
  return n.toFixed(1) + "%";
}

// ============================================================
// ===== DATA LOADERS =========================================
// ============================================================
async function loadInvoices() {
  try {
    const { data, error } = await sb.from("invoices").select("*, invoice_items(*)");
    if (error) throw error;
    return (data || []).map(inv => ({
      invoice: inv.invoice_no,
      tanggal: inv.tanggal,
      supplier: inv.supplier || "—",
      total: inv.total || 0,
      totalHarga: parseFloat(inv.total_harga) || 0,
      items: (inv.invoice_items || []).map(item => ({
        sku: item.sku || "—",
        nama: item.nama || "—",
        merk: item.merk || "—",
        kategori: item.kategori || "—",
        lokasi: item.lokasi || "—",
        expired: item.expired || "—",
        hargaHPP: parseFloat(item.harga_hpp) || 0,
        hargaJual: parseFloat(item.harga_jual) || 0,
        stok: parseInt(item.stok) || 0
      }))
    }));
  } catch (e) {
    console.error("Gagal load invoices di laporan:", e);
    return [];
  }
}

async function loadStockOuts() {
  try {
    const { data, error } = await sb.from("stock_outs").select("*, stock_out_items(*)");
    if (error) throw error;
    return (data || []).map(so => ({
      id: so.id,
      invoice: so.invoice_no,
      tanggal: so.tanggal,
      penerima: so.penerima,
      telepon: so.telepon || "",
      paymentId: so.payment_id,
      paymentNama: so.payment_nama || "",
      items: (so.stock_out_items || []).map(item => ({
        invoiceAsal: item.invoice_asal,
        sku: item.sku || "—",
        nama: item.nama || "—",
        kategori: item.kategori || "—",
        merk: item.merk || "—",
        lokasi: item.lokasi || "—",
        hargaHPP: parseFloat(item.harga_hpp) || 0,
        hargaJual: parseFloat(item.harga_jual) || 0,
        jumlahKeluar: parseInt(item.jumlah_keluar) || 0,
        sisaStok: parseInt(item.sisa_stok) || 0
      }))
    }));
  } catch (e) {
    console.error("Gagal load stock_outs di laporan:", e);
    return [];
  }
}

function getPaymentIcon(paymentId) {
  if (paymentId === "pay_default_cash") return "💵";
  if (paymentId === "pay_default_qris") return "📱";
  return "💰";
}

// ============================================================
// ===== CHART INSTANCES ======================================
// ============================================================
let chartRevenue = null;
let chartKategori = null;
let chartMasuk = null;
let chartKeluar = null;
let chartLineRevenue = null;

function destroyCharts() {
  [
    chartRevenue,
    chartKategori,
    chartMasuk,
    chartKeluar,
    chartLineRevenue,
  ].forEach((c) => {
    if (c) c.destroy();
  });
  chartRevenue =
    chartKategori =
    chartMasuk =
    chartKeluar =
    chartLineRevenue =
      null;
}

// ============================================================
// ===== MONTH BUCKET HELPERS =================================
// ============================================================
function getMonthLabel(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const bln = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return bln[d.getMonth()] + " " + d.getFullYear();
}

// ============================================================
// ===== MAIN DATA COMPUTATION ================================
// ============================================================
// Store computed data globally for PDF/Print use
let _computedData = null;

async function computeData(range) {
  const allInvoices = await loadInvoices();
  const allStockOuts = await loadStockOuts();

  const filteredInvoices = allInvoices.filter((inv) =>
    inRange(inv.tanggal, range),
  );
  const filteredStockOuts = allStockOuts.filter((so) =>
    inRange(so.tanggal, range),
  );

  let qtyMasuk = 0;
  filteredInvoices.forEach((inv) => {
    (inv.items || []).forEach((item) => {
      qtyMasuk += parseInt(item.stok) || 0;
    });
  });

  let qtyKeluar = 0;
  let totalRevenue = 0;
  let totalHPP = 0;

  const prodMap = {};
  const keluarMonthMap = {};
  const kategoriMap = {};
  const customerSet = new Set();

  filteredStockOuts.forEach((so) => {
    const label = getMonthLabel(so.tanggal);
    if (!keluarMonthMap[label]) keluarMonthMap[label] = 0;
    if (so.penerima) customerSet.add(so.penerima.toLowerCase());

    (so.items || []).forEach((item) => {
      const qty = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hpp = parseFloat(item.hargaHPP || 0);
      const rev = jual * qty;
      const hppTot = hpp * qty;

      qtyKeluar += qty;
      totalRevenue += rev;
      totalHPP += hppTot;
      keluarMonthMap[label] += qty;

      const kat = item.kategori || "Lainnya";
      if (!kategoriMap[kat]) kategoriMap[kat] = { revenue: 0, qty: 0 };
      kategoriMap[kat].revenue += rev;
      kategoriMap[kat].qty += qty;

      const key = item.nama || "—";
      if (!prodMap[key]) {
        prodMap[key] = {
          nama: key,
          kategori: item.kategori || "—",
          qty: 0,
          revenue: 0,
          hpp: 0,
        };
      }
      prodMap[key].qty += qty;
      prodMap[key].revenue += rev;
      prodMap[key].hpp += hppTot;
    });
  });

  const totalProfit = totalRevenue - totalHPP;
  const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  let stokSisa = 0;
  allInvoices.forEach((inv) => {
    (inv.items || []).forEach((item) => {
      stokSisa += parseInt(item.stok) || 0;
    });
  });

  return {
    filteredInvoices,
    filteredStockOuts,
    qtyMasuk,
    qtyKeluar,
    totalRevenue,
    totalHPP,
    totalProfit,
    marginPct,
    stokSisa,
    customerSet,
    prodMap,
    keluarMonthMap,
    kategoriMap,
  };
}

// ============================================================
// ===== MAIN RENDER ==========================================
// ============================================================
async function renderAll() {
  const range = getDateRange(filterPeriode.value);
  const periodTxt = customRangeActive
    ? rangeBadgeText.textContent || "Custom Range"
    : PERIODE_LABELS[filterPeriode.value] || "All Time";
  document.getElementById("periodText").textContent = periodTxt;

  const d = await computeData(range);
  _computedData = { ...d, periodTxt, range };

  const {
    filteredInvoices,
    filteredStockOuts,
    qtyMasuk,
    qtyKeluar,
    totalRevenue,
    totalHPP,
    totalProfit,
    marginPct,
    stokSisa,
    customerSet,
    prodMap,
    keluarMonthMap,
    kategoriMap,
  } = d;

  // ===== KPI =====
  document.getElementById("kpiRevenue").textContent = fmtRp(totalRevenue);
  document.getElementById("kpiRevenueSub").textContent =
    `dari ${filteredStockOuts.length} transaksi`;
  document.getElementById("kpiHPP").textContent = fmtRp(totalHPP);
  document.getElementById("kpiHPPSub").textContent = "harga pokok penjualan";
  document.getElementById("kpiProfit").textContent = fmtRp(totalProfit);
  document.getElementById("kpiProfitSub").textContent =
    totalRevenue > 0 ? "dari total penjualan" : "belum ada penjualan";
  document.getElementById("kpiMargin").textContent = fmtPct(marginPct);
  document.getElementById("kpiMarginSub").textContent = "persentase keuntungan";

  const profitEl = document.getElementById("kpiProfit");
  profitEl.style.color = totalProfit >= 0 ? "rgb(16,44,168)" : "#cc2222";

  // ===== INVENTORY SUMMARY =====
  document.getElementById("invMasukQty").textContent = qtyMasuk + " pcs";
  document.getElementById("invMasukInv").textContent =
    "dari " + filteredInvoices.length + " invoice";
  document.getElementById("invKeluarQty").textContent = qtyKeluar + " pcs";
  document.getElementById("invKeluarInv").textContent =
    "dari " + filteredStockOuts.length + " transaksi";
  document.getElementById("invTransaksi").textContent =
    filteredStockOuts.length;
  document.getElementById("invTransaksiSub").textContent = "invoice keluar";
  document.getElementById("invPenjualan").textContent = fmtRp(totalRevenue);
  document.getElementById("invPenjualanSub").textContent = "nilai stock out";
  document.getElementById("invStokSisa").textContent = stokSisa + " pcs";
  document.getElementById("invStokSub").textContent = "di gudang saat ini";
  document.getElementById("invCustomer").textContent = customerSet.size;
  document.getElementById("invCustomerSub").textContent = "pelanggan unik";

  // ===== CHARTS =====
  destroyCharts();
  renderChartRevenue(filteredStockOuts);
  renderChartKategori(kategoriMap);
  renderChartMasuk(filteredInvoices);
  renderChartKeluar(keluarMonthMap);
  renderChartLineRevenue(filteredStockOuts);

  // ===== TABLES =====
  renderTableTopProduk(prodMap);
  renderTableTransaksi(filteredStockOuts);
  renderTableBarangMasuk(filteredInvoices);
}

// ============================================================
// ===== CHART: REVENUE / HPP / PROFIT per bulan ==============
// ============================================================
function renderChartRevenue(stockOuts) {
  const monthMap = {};
  stockOuts.forEach((so) => {
    const label = getMonthLabel(so.tanggal);
    if (!monthMap[label]) monthMap[label] = { revenue: 0, hpp: 0 };
    (so.items || []).forEach((item) => {
      const qty = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hpp = parseFloat(item.hargaHPP || 0);
      monthMap[label].revenue += jual * qty;
      monthMap[label].hpp += hpp * qty;
    });
  });

  const labels = Object.keys(monthMap);
  const revenues = labels.map((l) => monthMap[l].revenue);
  const hpps = labels.map((l) => monthMap[l].hpp);
  const profits = labels.map((l, i) => revenues[i] - hpps[i]);

  const empty = labels.length === 0;
  document.getElementById("emptyRevenue").classList.toggle("hidden", !empty);

  const ctx = document.getElementById("chartRevenue");
  if (empty) {
    ctx.style.display = "none";
    return;
  }
  ctx.style.display = "";

  chartRevenue = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenues,
          backgroundColor: "rgba(16,185,129,0.7)",
          borderColor: "#10B981",
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: "HPP",
          data: hpps,
          backgroundColor: "rgba(245,158,11,0.7)",
          borderColor: "#F59E0B",
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: "Profit",
          data: profits,
          backgroundColor: "rgba(59,130,246,0.7)",
          borderColor: "#3B82F6",
          borderWidth: 1.5,
          borderRadius: 4,
          type: "line",
          tension: 0.3,
          pointRadius: 4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { font: { family: "Poppins", size: 11 } },
        },
      },
      scales: {
        x: { ticks: { font: { family: "Poppins", size: 10 } } },
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: "Poppins", size: 10 },
            callback: (v) => "Rp " + (v / 1000000).toFixed(1) + "jt",
          },
        },
      },
    },
  });
}

function renderChartKategori(kategoriMap) {
  const labels = Object.keys(kategoriMap);
  const data = labels.map((k) => kategoriMap[k].revenue);
  const colors = [
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#84CC16",
  ];

  const empty = labels.length === 0;
  document.getElementById("emptyKategori").classList.toggle("hidden", !empty);
  const ctx = document.getElementById("chartKategori");
  if (empty) {
    ctx.style.display = "none";
    return;
  }
  ctx.style.display = "";

  chartKategori = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: "#111",
          borderWidth: 1.5,
          hoverOffset: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { family: "Poppins", size: 11 }, boxWidth: 12 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => " " + ctx.label + ": " + fmtRp(ctx.parsed),
          },
        },
      },
    },
  });
}

function renderChartMasuk(invoices) {
  const monthMap = {};
  invoices.forEach((inv) => {
    const label = getMonthLabel(inv.tanggal);
    if (!monthMap[label]) monthMap[label] = 0;
    (inv.items || []).forEach((item) => {
      monthMap[label] += parseInt(item.stok) || 0;
    });
  });

  const labels = Object.keys(monthMap);
  const data = labels.map((l) => monthMap[l]);

  const empty = labels.length === 0;
  document.getElementById("emptyMasuk").classList.toggle("hidden", !empty);
  const ctx = document.getElementById("chartMasuk");
  if (empty) {
    ctx.style.display = "none";
    return;
  }
  ctx.style.display = "";

  chartMasuk = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Qty Masuk",
          data,
          backgroundColor: "rgba(16,44,168,0.6)",
          borderColor: "rgb(16,44,168)",
          borderWidth: 1.5,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { family: "Poppins", size: 10 } } },
        y: {
          beginAtZero: true,
          ticks: { font: { family: "Poppins", size: 10 } },
        },
      },
    },
  });
}

function renderChartKeluar(keluarMonthMap) {
  const labels = Object.keys(keluarMonthMap);
  const data = labels.map((l) => keluarMonthMap[l]);

  const empty = labels.length === 0;
  document.getElementById("emptyKeluar").classList.toggle("hidden", !empty);
  const ctx = document.getElementById("chartKeluar");
  if (empty) {
    ctx.style.display = "none";
    return;
  }
  ctx.style.display = "";

  chartKeluar = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Qty Keluar",
          data,
          backgroundColor: "rgba(239,68,68,0.65)",
          borderColor: "#EF4444",
          borderWidth: 1.5,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { family: "Poppins", size: 10 } } },
        y: {
          beginAtZero: true,
          ticks: { font: { family: "Poppins", size: 10 } },
        },
      },
    },
  });
}

function renderChartLineRevenue(stockOuts) {
  const dailyMap = {};
  stockOuts.forEach((so) => {
    const tanggal = so.tanggal;
    if (!dailyMap[tanggal]) dailyMap[tanggal] = 0;
    (so.items || []).forEach((item) => {
      const qty = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      dailyMap[tanggal] += jual * qty;
    });
  });

  const sortedDates = Object.keys(dailyMap).sort();
  const labels = sortedDates.map((d) => fmtDate(d));
  const revenues = sortedDates.map((d) => dailyMap[d]);

  const movingAvg = [];
  const windowSize = 7;
  for (let i = 0; i < revenues.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = revenues.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    movingAvg.push(avg);
  }

  const empty = labels.length === 0;
  document
    .getElementById("emptyLineRevenue")
    .classList.toggle("hidden", !empty);

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
      interaction: { mode: "index", intersect: false },
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
          callbacks: {
            label: (ctx) =>
              (ctx.dataset.label || "") + ": " + fmtRp(ctx.parsed.y),
          },
        },
      },
      scales: {
        x: {
          ticks: {
            font: { family: "Poppins", size: 10 },
            maxRotation: 45,
            minRotation: 45,
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: "Poppins", size: 10 },
            callback: (v) =>
              v >= 1e6
                ? "Rp " + (v / 1e6).toFixed(1) + "jt"
                : v >= 1e3
                  ? "Rp " + (v / 1e3).toFixed(0) + "rb"
                  : "Rp " + v,
          },
          grid: { color: "rgba(0,0,0,0.05)" },
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
  const sorted = Object.values(prodMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

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
      <td><span class="badge ${margin >= 0 ? "badge-green" : "badge-orange"}">${fmtPct(margin)}</span></td>
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
    let revenue = 0,
      hpp = 0,
      totalQty = 0;
    (so.items || []).forEach((item) => {
      const qty = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hppU = parseFloat(item.hargaHPP || 0);
      revenue += jual * qty;
      hpp += hppU * qty;
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
    const totalQty = (inv.items || []).reduce(
      (s, i) => s + (parseInt(i.stok) || 0),
      0,
    );
    const jenisSet = new Set(
      (inv.items || []).map((i) => i.nama?.toLowerCase()).filter(Boolean),
    );
    const nilaiHPP = (inv.items || []).reduce(
      (s, i) => s + parseFloat(i.hargaHPP || 0) * (parseInt(i.stok) || 0),
      0,
    );

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
// ===== BUILD PRINT / PDF HTML ===============================
// ============================================================
function buildPrintHTML(periodTxt, data) {
  const {
    filteredInvoices,
    filteredStockOuts,
    qtyMasuk,
    qtyKeluar,
    totalRevenue,
    totalHPP,
    totalProfit,
    marginPct,
    stokSisa,
    customerSet,
    prodMap,
    kategoriMap,
  } = data;

  const printedAt = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ─── Top produk rows ───
  const sortedProds = Object.values(prodMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);
  const topProdRows =
    sortedProds
      .map((p, i) => {
        const profit = p.revenue - p.hpp;
        const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
        return `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:600">${p.nama}</td>
      <td>${p.kategori}</td>
      <td style="text-align:right">${p.qty} pcs</td>
      <td style="text-align:right;color:#0a6640;font-weight:700">${fmtRp(p.revenue)}</td>
      <td style="text-align:right;color:#856404">${fmtRp(p.hpp)}</td>
      <td style="text-align:right;font-weight:700;color:${profit >= 0 ? "#0a6640" : "#cc2222"}">${fmtRp(profit)}</td>
      <td style="text-align:center">${fmtPct(margin)}</td>
    </tr>`;
      })
      .join("") ||
    `<tr><td colspan="8" style="text-align:center;color:#aaa;font-style:italic">Belum ada data</td></tr>`;

  // ─── Transaksi rows ───
  const transaksiRows =
    [...filteredStockOuts]
      .reverse()
      .slice(0, 30)
      .map((so, i) => {
        let revenue = 0,
          hpp = 0,
          totalQty = 0;
        (so.items || []).forEach((item) => {
          const qty = parseInt(item.jumlahKeluar) || 0;
          const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
          const hppU = parseFloat(item.hargaHPP || 0);
          revenue += jual * qty;
          hpp += hppU * qty;
          totalQty += qty;
        });
        const profit = revenue - hpp;
        return `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:700;color:#102ca8">${so.invoice}</td>
      <td>${fmtDate(so.tanggal)}</td>
      <td>${so.penerima || "—"}</td>
      <td>${so.paymentNama || "—"}</td>
      <td style="text-align:right">${totalQty} pcs</td>
      <td style="text-align:right;color:#0a6640;font-weight:600">${fmtRp(revenue)}</td>
      <td style="text-align:right;font-weight:700;color:${profit >= 0 ? "#0a6640" : "#cc2222"}">${fmtRp(profit)}</td>
    </tr>`;
      })
      .join("") ||
    `<tr><td colspan="8" style="text-align:center;color:#aaa;font-style:italic">Belum ada data</td></tr>`;

  // ─── Barang masuk rows ───
  const masukRows =
    [...filteredInvoices]
      .reverse()
      .slice(0, 30)
      .map((inv, i) => {
        const totalQty = (inv.items || []).reduce(
          (s, it) => s + (parseInt(it.stok) || 0),
          0,
        );
        const jenis = new Set(
          (inv.items || []).map((it) => it.nama).filter(Boolean),
        ).size;
        const nilai = (inv.items || []).reduce(
          (s, it) =>
            s + parseFloat(it.hargaHPP || 0) * (parseInt(it.stok) || 0),
          0,
        );
        return `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:700;color:#102ca8">${inv.invoice}</td>
      <td>${fmtDate(inv.tanggal)}</td>
      <td>${inv.supplier || "—"}</td>
      <td style="text-align:right">${totalQty} pcs</td>
      <td style="text-align:center">${jenis} jenis</td>
      <td style="text-align:right;color:#0a6640;font-weight:600">${fmtRp(nilai)}</td>
    </tr>`;
      })
      .join("") ||
    `<tr><td colspan="7" style="text-align:center;color:#aaa;font-style:italic">Belum ada data</td></tr>`;

  // ─── Kategori distribution ───
  const kategoriRows =
    Object.entries(kategoriMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([kat, d]) => {
        const kontrib =
          totalRevenue > 0
            ? ((d.revenue / totalRevenue) * 100).toFixed(1)
            : "0.0";
        return `<tr>
        <td style="font-weight:600">${kat}</td>
        <td style="text-align:right;color:#0a6640;font-weight:700">${fmtRp(d.revenue)}</td>
        <td style="text-align:right">${d.qty} pcs</td>
        <td style="text-align:center">${kontrib}%</td>
      </tr>`;
      })
      .join("") ||
    `<tr><td colspan="4" style="text-align:center;color:#aaa;font-style:italic">Belum ada data</td></tr>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Laporan INVENZ — ${periodTxt}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Poppins', sans-serif;
    font-size: 11px;
    color: #1a1a2e;
    background: #fff;
    padding: 0;
  }

  /* ─── COVER PAGE ─── */
  .cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #0a0e2e 0%, #102ca8 50%, #1e40af 100%);
    color: white;
    text-align: center;
    padding: 60px 40px;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }

  .cover::before {
    content: '';
    position: absolute;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    top: -150px; right: -150px;
  }

  .cover::after {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: rgba(0,229,196,0.08);
    bottom: -80px; left: -80px;
  }

  .cover-logo {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 6px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .cover-title {
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1.1;
    margin-bottom: 10px;
  }

  .cover-title span {
    background: linear-gradient(135deg, #00e5c4, #60a5fa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .cover-subtitle {
    font-size: 15px;
    color: rgba(255,255,255,0.65);
    margin-bottom: 50px;
    font-weight: 400;
  }

  .cover-period-box {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 16px;
    padding: 24px 48px;
    margin-bottom: 50px;
  }

  .cover-period-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: rgba(255,255,255,0.5);
    margin-bottom: 8px;
  }

  .cover-period-val {
    font-size: 22px;
    font-weight: 700;
    color: #00e5c4;
  }

  .cover-meta {
    display: flex;
    gap: 60px;
    justify-content: center;
    font-size: 12px;
  }

  .cover-meta-item { text-align: center; }
  .cover-meta-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.4);
    margin-bottom: 4px;
  }
  .cover-meta-val { font-weight: 600; color: rgba(255,255,255,0.85); }

  .cover-footer {
    position: absolute;
    bottom: 30px;
    font-size: 10px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 1px;
  }

  /* ─── PAGE LAYOUT ─── */
  .page {
    padding: 24px 28px;
    page-break-after: always;
  }
  .page:last-child { page-break-after: avoid; }

  /* ─── PAGE HEADER ─── */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #f8f9ff;
    border-radius: 8px;
    border-left: 4px solid #102ca8;
    margin-bottom: 20px;
  }

  .page-header-left { }
  .page-header-brand {
    font-size: 14px;
    font-weight: 800;
    color: #102ca8;
    letter-spacing: 2px;
  }
  .page-header-period {
    font-size: 10px;
    color: #888;
    margin-top: 2px;
  }
  .page-header-right {
    text-align: right;
    font-size: 10px;
    color: #aaa;
  }

  /* ─── SECTION TITLE ─── */
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #102ca8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 20px 0 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e5e7ef;
  }

  /* ─── KPI GRID ─── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .kpi-card {
    border-radius: 10px;
    padding: 14px 16px;
    border: 1px solid #e5e7ef;
    position: relative;
    overflow: hidden;
  }

  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 10px 10px 0 0;
  }

  .kpi-revenue::before { background: linear-gradient(90deg, #10B981, #34d399); }
  .kpi-hpp::before     { background: linear-gradient(90deg, #F59E0B, #fbbf24); }
  .kpi-profit::before  { background: linear-gradient(90deg, #3B82F6, #60a5fa); }
  .kpi-margin::before  { background: linear-gradient(90deg, #8B5CF6, #a78bfa); }

  .kpi-label {
    font-size: 9px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .kpi-value {
    font-size: 16px;
    font-weight: 800;
    color: #1a1a2e;
    line-height: 1.1;
  }

  .kpi-revenue .kpi-value { color: #0a6640; }
  .kpi-hpp .kpi-value     { color: #856404; }
  .kpi-profit .kpi-value  { color: #1e3a8a; }
  .kpi-margin .kpi-value  { color: #5b21b6; }

  .kpi-sub {
    font-size: 9px;
    color: #aaa;
    margin-top: 3px;
  }

  /* ─── INVENTORY GRID ─── */
  .inv-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .inv-card {
    border: 1px solid #e5e7ef;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .inv-label {
    font-size: 9px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .inv-value {
    font-size: 15px;
    font-weight: 800;
    color: #1a1a2e;
  }

  .inv-sub { font-size: 9px; color: #aaa; }

  /* ─── TABLES ─── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
    margin-bottom: 12px;
  }

  thead tr {
    background: #102ca8;
    color: white;
  }

  thead th {
    padding: 8px 10px;
    font-weight: 600;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    white-space: nowrap;
  }

  tbody tr:nth-child(even) { background: #f0f4ff; }
  tbody tr:nth-child(odd)  { background: #ffffff; }

  tbody td {
    padding: 7px 10px;
    border-bottom: 0.5px solid #e5e7ef;
    color: #333;
    vertical-align: middle;
  }

  tbody tr:last-child td { border-bottom: none; }

  .tfoot-row td {
    padding: 9px 10px;
    background: #1e3a8a !important;
    color: white !important;
    font-weight: 700;
    font-size: 11px;
  }

  /* ─── PRINT CONTROLS ─── */
  .print-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 9999;
  }

  .btn-print-pdf {
    padding: 12px 22px;
    background: #102ca8;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    box-shadow: 0 4px 14px rgba(16,44,168,0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }
  .btn-print-pdf:hover { background: #1e40af; transform: translateY(-1px); }

  .btn-close-pdf {
    padding: 12px 18px;
    background: #eee;
    color: #333;
    border: 1px solid #ccc;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
  }
  .btn-close-pdf:hover { background: #ddd; }

  /* ─── DISTRIBUTION TABLE ─── */
  .dist-table td:first-child { font-weight: 600; }

  /* ─── PRINT MEDIA ─── */
  @media print {
    .print-controls { display: none !important; }
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .kpi-card::before { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tbody tr:nth-child(even) { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .tfoot-row td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    @page {
      margin: 15mm 12mm;
      size: A4;
    }
    body { font-size: 9.5px; }
    .cover { min-height: auto; padding: 40px; }
    .cover-title { font-size: 32px; }
  }
</style>
</head>
<body>

<!-- Print Controls (hidden on print) -->
<div class="print-controls">
  <button class="btn-print-pdf" onclick="window.print()">
    🖨️ Simpan sebagai PDF / Print
  </button>
  <button class="btn-close-pdf" onclick="window.close()">✕ Tutup</button>
</div>

<!-- ══════════════════════════════════════════
     COVER PAGE
══════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-logo">INVENZ — Sistem Manajemen Inventori</div>
  <div class="cover-title">
    Laporan<br><span>Keuangan & Inventori</span>
  </div>
  <div class="cover-subtitle">Analisis performa penjualan, inventori, dan keuangan bisnis</div>

  <div class="cover-period-box">
    <div class="cover-period-label">Periode Laporan</div>
    <div class="cover-period-val">${periodTxt}</div>
  </div>

  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="cover-meta-label">Dicetak oleh</div>
      <div class="cover-meta-val">${loggedUser}</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Tanggal & Waktu</div>
      <div class="cover-meta-val">${printedAt}</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Total Transaksi</div>
      <div class="cover-meta-val">${filteredStockOuts.length} transaksi</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Invoice Masuk</div>
      <div class="cover-meta-val">${filteredInvoices.length} invoice</div>
    </div>
  </div>

  <div class="cover-footer">INVENZ &bull; Laporan ini dibuat secara otomatis</div>
</div>

<!-- ══════════════════════════════════════════
     PAGE 1 — KPI & RINGKASAN
══════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-header-brand">INVENZ</div>
      <div class="page-header-period">Periode: ${periodTxt}</div>
    </div>
    <div class="page-header-right">
      Dicetak: ${printedAt}<br>
      Oleh: ${loggedUser}
    </div>
  </div>

  <div class="section-title">Neraca Keuangan</div>
  <div class="kpi-grid">
    <div class="kpi-card kpi-revenue">
      <div class="kpi-label">Revenue / Pendapatan</div>
      <div class="kpi-value">${fmtRp(totalRevenue)}</div>
      <div class="kpi-sub">dari ${filteredStockOuts.length} transaksi</div>
    </div>
    <div class="kpi-card kpi-hpp">
      <div class="kpi-label">Total HPP / Modal</div>
      <div class="kpi-value">${fmtRp(totalHPP)}</div>
      <div class="kpi-sub">harga pokok penjualan</div>
    </div>
    <div class="kpi-card kpi-profit">
      <div class="kpi-label">Profit / Keuntungan</div>
      <div class="kpi-value" style="color:${totalProfit >= 0 ? "#0a6640" : "#cc2222"}">${fmtRp(totalProfit)}</div>
      <div class="kpi-sub">${totalRevenue > 0 ? "dari total penjualan" : "belum ada penjualan"}</div>
    </div>
    <div class="kpi-card kpi-margin">
      <div class="kpi-label">Profit Margin</div>
      <div class="kpi-value">${fmtPct(marginPct)}</div>
      <div class="kpi-sub">persentase keuntungan</div>
    </div>
  </div>

  <div class="section-title">Ringkasan Inventori & Transaksi</div>
  <div class="inv-grid">
    <div class="inv-card">
      <div class="inv-label">Total Barang Masuk</div>
      <div class="inv-value">${qtyMasuk} pcs</div>
      <div class="inv-sub">dari ${filteredInvoices.length} invoice</div>
    </div>
    <div class="inv-card">
      <div class="inv-label">Total Barang Keluar</div>
      <div class="inv-value">${qtyKeluar} pcs</div>
      <div class="inv-sub">dari ${filteredStockOuts.length} transaksi</div>
    </div>
    <div class="inv-card">
      <div class="inv-label">Total Transaksi Keluar</div>
      <div class="inv-value">${filteredStockOuts.length}</div>
      <div class="inv-sub">invoice keluar</div>
    </div>
    <div class="inv-card">
      <div class="inv-label">Total Nilai Penjualan</div>
      <div class="inv-value" style="color:#0a6640">${fmtRp(totalRevenue)}</div>
      <div class="inv-sub">nilai stock out</div>
    </div>
    <div class="inv-card">
      <div class="inv-label">Stok Tersisa</div>
      <div class="inv-value">${stokSisa} pcs</div>
      <div class="inv-sub">di gudang saat ini</div>
    </div>
    <div class="inv-card">
      <div class="inv-label">Total Customer</div>
      <div class="inv-value">${customerSet.size}</div>
      <div class="inv-sub">pelanggan unik</div>
    </div>
  </div>

  <div class="section-title">Distribusi per Kategori</div>
  <table class="dist-table">
    <thead>
      <tr>
        <th>Kategori</th>
        <th style="text-align:right">Revenue</th>
        <th style="text-align:right">Total Qty</th>
        <th style="text-align:center">Kontribusi</th>
      </tr>
    </thead>
    <tbody>
      ${kategoriRows}
    </tbody>
  </table>
</div>

<!-- ══════════════════════════════════════════
     PAGE 2 — TOP PRODUK TERLARIS
══════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-header-brand">INVENZ</div>
      <div class="page-header-period">Periode: ${periodTxt}</div>
    </div>
    <div class="page-header-right">Dicetak: ${printedAt}</div>
  </div>

  <div class="section-title">Top 10 Produk Terlaris</div>
  <table>
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th>Nama Produk</th>
        <th>Kategori</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Revenue</th>
        <th style="text-align:right">HPP</th>
        <th style="text-align:right">Profit</th>
        <th style="text-align:center">Margin</th>
      </tr>
    </thead>
    <tbody>${topProdRows}</tbody>
  </table>
</div>

<!-- ══════════════════════════════════════════
     PAGE 3 — RIWAYAT TRANSAKSI STOCK OUT
══════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-header-brand">INVENZ</div>
      <div class="page-header-period">Periode: ${periodTxt}</div>
    </div>
    <div class="page-header-right">Dicetak: ${printedAt}</div>
  </div>

  <div class="section-title">Riwayat Transaksi Stock Out ${filteredStockOuts.length > 30 ? "(30 terbaru dari " + filteredStockOuts.length + " total)" : ""}</div>
  <table>
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th>Invoice</th>
        <th>Tanggal</th>
        <th>Customer</th>
        <th>Metode Bayar</th>
        <th style="text-align:right">Total Item</th>
        <th style="text-align:right">Revenue</th>
        <th style="text-align:right">Profit</th>
      </tr>
    </thead>
    <tbody>${transaksiRows}</tbody>
  </table>
</div>

<!-- ══════════════════════════════════════════
     PAGE 4 — RIWAYAT BARANG MASUK
══════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-header-brand">INVENZ</div>
      <div class="page-header-period">Periode: ${periodTxt}</div>
    </div>
    <div class="page-header-right">Dicetak: ${printedAt}</div>
  </div>

  <div class="section-title">Riwayat Barang Masuk ${filteredInvoices.length > 30 ? "(30 terbaru dari " + filteredInvoices.length + " total)" : ""}</div>
  <table>
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th>Invoice</th>
        <th>Tanggal</th>
        <th>Supplier</th>
        <th style="text-align:right">Total Qty</th>
        <th style="text-align:center">Jenis Barang</th>
        <th style="text-align:right">Nilai HPP</th>
      </tr>
    </thead>
    <tbody>${masukRows}</tbody>
  </table>
</div>

</body>
</html>`;
}

// ============================================================
// ===== EXPORT PDF (BUKA WINDOW BARU) ========================
// ============================================================
document.getElementById("btnExportPDF").addEventListener("click", () => {
  if (!_computedData) {
    alert("Data laporan belum termuat. Harap tunggu sebentar lalu coba lagi.");
    return;
  }

  const { periodTxt } = _computedData;
  const html = buildPrintHTML(periodTxt, _computedData);

  // Buka window baru dengan HTML laporan
  const win = window.open(
    "",
    "_blank",
    "width=900,height=700,scrollbars=yes,resizable=yes",
  );
  if (!win) {
    alert(
      "Popup diblokir oleh browser. Mohon izinkan popup untuk situs ini dan coba lagi.",
    );
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
});

// ============================================================
// ===== PRINT (Buka window khusus, rapi) =====================
// ============================================================
document.getElementById("btnPrint").addEventListener("click", () => {
  if (!_computedData) {
    alert("Data laporan belum termuat. Harap tunggu sebentar lalu coba lagi.");
    return;
  }

  const { periodTxt } = _computedData;
  const html = buildPrintHTML(periodTxt, _computedData);

  const win = window.open(
    "",
    "_blank",
    "width=900,height=700,scrollbars=yes,resizable=yes",
  );
  if (!win) {
    alert(
      "Popup diblokir oleh browser. Mohon izinkan popup untuk situs ini dan coba lagi.",
    );
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Auto-trigger print setelah halaman sepenuhnya dimuat
  win.onload = () => {
    setTimeout(() => win.print(), 600);
  };
});

// ============================================================
// ===== EXPORT EXCEL =========================================
// ============================================================
document
  .getElementById("btnExportExcel")
  .addEventListener("click", exportExcel);

function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("Library SheetJS belum dimuat. Harap refresh halaman dan coba lagi.");
    return;
  }

  const range = getDateRange(filterPeriode.value);
  const period = document.getElementById("periodText").textContent;
  const printedAt = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const allInvoices = loadInvoices().filter((inv) =>
    inRange(inv.tanggal, range),
  );
  const allSOs = loadStockOuts().filter((so) => inRange(so.tanggal, range));

  let totalRevenue = 0,
    totalHPP = 0,
    qtyMasuk = 0,
    qtyKeluar = 0;
  const prodMap = {};
  const kategoriMap = {};
  const customerSet = new Set();

  allInvoices.forEach((inv) =>
    (inv.items || []).forEach((i) => {
      qtyMasuk += parseInt(i.stok) || 0;
    }),
  );

  allSOs.forEach((so) => {
    if (so.penerima) customerSet.add(so.penerima.toLowerCase());
    (so.items || []).forEach((item) => {
      const qty = parseInt(item.jumlahKeluar) || 0;
      const jual = parseFloat(item.hargaJual || item.hargaHPP || 0);
      const hpp = parseFloat(item.hargaHPP || 0);
      const rev = jual * qty;
      const hppT = hpp * qty;
      totalRevenue += rev;
      totalHPP += hppT;
      qtyKeluar += qty;

      const kat = item.kategori || "Lainnya";
      if (!kategoriMap[kat]) kategoriMap[kat] = { revenue: 0, qty: 0 };
      kategoriMap[kat].revenue += rev;
      kategoriMap[kat].qty += qty;

      const key = item.nama || "—";
      if (!prodMap[key])
        prodMap[key] = {
          nama: key,
          kategori: item.kategori || "—",
          qty: 0,
          revenue: 0,
          hpp: 0,
        };
      prodMap[key].qty += qty;
      prodMap[key].revenue += rev;
      prodMap[key].hpp += hppT;
    });
  });

  const totalProfit = totalRevenue - totalHPP;
  const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const wb = XLSX.utils.book_new();

  // ── SHEET 1: RINGKASAN ──
  const ws1Data = [
    ["LAPORAN KEUANGAN & INVENTORI — INVENZ"],
    [],
    ["Periode", period],
    ["Dicetak oleh", loggedUser],
    ["Tanggal cetak", printedAt],
    [],
    ["NERACA KEUANGAN"],
    ["Keterangan", "Nilai (Rp)"],
    ["Revenue / Pendapatan", totalRevenue],
    ["Total HPP / Modal", totalHPP],
    ["Profit / Keuntungan", totalProfit],
    ["Profit Margin (%)", marginPct / 100],
    [],
    ["RINGKASAN INVENTORI"],
    ["Keterangan", "Nilai"],
    ["Total Barang Masuk", qtyMasuk],
    ["Total Invoice Masuk", allInvoices.length],
    ["Total Barang Keluar", qtyKeluar],
    ["Total Transaksi Keluar", allSOs.length],
    ["Total Customer Unik", customerSet.size],
    [],
    ["DISTRIBUSI PER KATEGORI"],
    ["Kategori", "Revenue (Rp)", "Qty", "Kontribusi (%)"],
    ...Object.entries(kategoriMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([kat, d]) => [
        kat,
        d.revenue,
        d.qty,
        totalRevenue > 0 ? d.revenue / totalRevenue : 0,
      ]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  ws1["!cols"] = [{ wch: 36 }, { wch: 22 }, { wch: 20 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan");

  // ── SHEET 2: TRANSAKSI STOCK OUT ──
  const ws2Data = [
    [`TRANSAKSI STOCK OUT — ${period}`],
    [],
    [
      "#",
      "Invoice",
      "Tanggal",
      "Customer",
      "Metode Bayar",
      "Total Item",
      "Revenue (Rp)",
      "HPP (Rp)",
      "Profit (Rp)",
    ],
  ];
  let so_totalRev = 0,
    so_totalHPP = 0,
    so_totalQty = 0;
  allSOs.forEach((so, i) => {
    let rev = 0,
      h = 0,
      qty = 0;
    (so.items || []).forEach((item) => {
      const q = parseInt(item.jumlahKeluar) || 0;
      rev += parseFloat(item.hargaJual || item.hargaHPP || 0) * q;
      h += parseFloat(item.hargaHPP || 0) * q;
      qty += q;
    });
    const profit = rev - h;
    so_totalRev += rev;
    so_totalHPP += h;
    so_totalQty += qty;
    ws2Data.push([
      i + 1,
      so.invoice,
      so.tanggal,
      so.penerima || "—",
      so.paymentNama || "—",
      qty,
      rev,
      h,
      profit,
    ]);
  });
  ws2Data.push(
    [],
    [
      "TOTAL",
      "",
      "",
      "",
      "",
      so_totalQty,
      so_totalRev,
      so_totalHPP,
      so_totalRev - so_totalHPP,
    ],
  );
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2["!cols"] = [
    { wch: 5 },
    { wch: 22 },
    { wch: 14 },
    { wch: 26 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Stock Out");

  // ── SHEET 3: BARANG MASUK ──
  const ws3Data = [
    [`BARANG MASUK — ${period}`],
    [],
    [
      "#",
      "Invoice",
      "Tanggal",
      "Supplier",
      "Total Qty",
      "Jenis Barang",
      "Nilai HPP (Rp)",
    ],
  ];
  let inv_totalQty = 0,
    inv_totalNilai = 0;
  allInvoices.forEach((inv, i) => {
    const qty = (inv.items || []).reduce(
      (s, it) => s + (parseInt(it.stok) || 0),
      0,
    );
    const jenis = new Set(
      (inv.items || []).map((it) => it.nama).filter(Boolean),
    ).size;
    const nilai = (inv.items || []).reduce(
      (s, it) => s + parseFloat(it.hargaHPP || 0) * (parseInt(it.stok) || 0),
      0,
    );
    inv_totalQty += qty;
    inv_totalNilai += nilai;
    ws3Data.push([
      i + 1,
      inv.invoice,
      inv.tanggal,
      inv.supplier || "—",
      qty,
      jenis,
      nilai,
    ]);
  });
  ws3Data.push([], ["TOTAL", "", "", "", inv_totalQty, "", inv_totalNilai]);
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
  ws3["!cols"] = [
    { wch: 5 },
    { wch: 22 },
    { wch: 14 },
    { wch: 26 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Barang Masuk");

  // ── SHEET 4: TOP PRODUK ──
  const ws4Data = [
    [`TOP 10 PRODUK TERLARIS — ${period}`],
    [],
    [
      "#",
      "Nama Produk",
      "Kategori",
      "Qty Terjual",
      "Revenue (Rp)",
      "HPP (Rp)",
      "Profit (Rp)",
      "Margin (%)",
    ],
  ];
  Object.values(prodMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)
    .forEach((p, i) => {
      const profit = p.revenue - p.hpp;
      const margin = p.revenue > 0 ? profit / p.revenue : 0;
      ws4Data.push([
        i + 1,
        p.nama,
        p.kategori,
        p.qty,
        p.revenue,
        p.hpp,
        profit,
        margin,
      ]);
    });
  const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
  ws4["!cols"] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, "Top Produk");

  // ── DOWNLOAD ──
  const safePeriod = period.replace(/[\/\\?%*:|"<>]/g, "_").replace(/ /g, "_");
  XLSX.writeFile(wb, `Laporan_Invenz_${safePeriod}.xlsx`);
}

// ============================================================
// ===== INITIAL RENDER =======================================
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
});
if (document.readyState !== "loading") renderAll();
