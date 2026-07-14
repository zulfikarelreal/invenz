"use strict";

/* ================================================================
   INVENZ DASHBOARD — dashboard.js (FIXED)
   Perbaikan dari versi lama:
   - Hero quick stats (heroStok/heroInvoice/heroJenis) sekarang diisi
   - Line chart "Tren Stok Masuk (7 Hari)" diimplementasi + switchLine()
   - "Top 5 Stok Terbanyak" diimplementasi
   - "Aktivitas Terkini" diimplementasi
   - Grafik "Akumulasi Total Stok Bulanan" pakai DATA ASLI (bukan hardcode),
     dan bug "grafik jadi tinggi banget" diperbaiki dengan menghapus
     `maintainAspectRatio:false` (opsi ini butuh container bertinggi tetap,
     kalau tidak ada, canvas bisa membesar tanpa batas)
   - filterTable() & sortTable() untuk tabel invoice ditambahkan (sebelumnya
     dipanggil dari HTML tapi tidak pernah didefinisikan -> error terus-menerus)
   ================================================================ */

// ===== SHARED STATE =====
let _allInvoices = [];
let _allItems = [];
let _tableSortDesc = true;

let _pieChartInstance = null;
let _barChartInstance = null;
let _lineChartInstance = null;
let _stockTrendChartInstance = null;

// ===== HELPERS =====
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function getMonthLabel(dateStr) {
  const d = new Date(dateStr);
  const bln = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return bln[d.getMonth()] + " " + d.getFullYear();
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

// ================================================================
// ===== LOAD DATA & RENDER SEMUA =====
// ================================================================
(async function init() {
  try {
    const { data: invList, error: invErr } = await sb
      .from("invoices")
      .select("*, invoice_items(*)");
    if (invErr) throw invErr;

    _allInvoices = invList || [];
    _allItems = [];
    _allInvoices.forEach((inv) => {
      (inv.invoice_items || []).forEach((item) => {
        _allItems.push({
          kategori: item.kategori || "Lainnya",
          merk: item.merk || "Lainnya",
          stok: parseInt(item.stok) || 0,
          nama: item.nama || "-",
          tanggal: inv.tanggal,
          invoiceNo: inv.invoice_no,
          supplier: inv.supplier || "-",
        });
      });
    });

    // ===== STATS GRID =====
    const totalStok = _allItems.reduce((s, i) => s + i.stok, 0);
    const uniqueKategori = new Set(_allItems.map((i) => i.kategori.toLowerCase()));
    const uniqueNama = new Set(_allItems.map((i) => i.nama.toLowerCase()));

    setText("statTotalStok", totalStok);
    setText("statKategori", uniqueKategori.size);
    setText("statJenis", uniqueNama.size);
    setText("statInvoice", _allInvoices.length);

    // ===== HERO QUICK STATS (sebelumnya tidak pernah diisi) =====
    setText("heroStok", totalStok);
    setText("heroInvoice", _allInvoices.length);
    setText("heroJenis", uniqueNama.size);

    // ===== CHARTS =====
    renderPieChart(_allItems);
    renderBarChart(_allItems);
    renderLineChart("7d");
    renderStockTrendChart(_allItems);

    // ===== TOP 5 & AKTIVITAS =====
    renderTopItems(_allItems);
    renderActivityFeed(_allInvoices);

    // ===== TABEL INVOICE TERBARU =====
    renderRecentTable();
  } catch (e) {
    console.error("Gagal load dashboard data:", e);
    alert("Gagal load data dashboard: " + e.message);
  }
})();

// ================================================================
// ===== PIE CHART — Barang per Kategori =====
// ================================================================
function renderPieChart(items) {
  const canvas = document.getElementById("pieChart");
  const emptyEl = document.getElementById("pieEmpty");
  const legendEl = document.getElementById("pieLegend");
  const donutTotalEl = document.getElementById("donutTotal");
  if (!canvas) return;

  const kategoriMap = {};
  items.forEach((item) => {
    kategoriMap[item.kategori] = (kategoriMap[item.kategori] || 0) + item.stok;
  });
  const labels = Object.keys(kategoriMap);
  const data = Object.values(kategoriMap);
  const total = data.reduce((a, b) => a + b, 0);
  const colors = ["#00e5e5", "#4F8EF7", "#10D99A", "#FBBC05", "#F05252", "#A78BFA", "#F97316", "#EC4899"];

  if (_pieChartInstance) { _pieChartInstance.destroy(); _pieChartInstance = null; }

  if (!labels.length) {
    canvas.style.display = "none";
    if (emptyEl) emptyEl.style.display = "block";
    if (legendEl) legendEl.innerHTML = "";
    setText("donutCenterVal", 0);
    if (donutTotalEl) donutTotalEl.textContent = "0 item";
    return;
  }

  canvas.style.display = "";
  if (emptyEl) emptyEl.style.display = "none";
  setText("donutCenterVal", total);
  if (donutTotalEl) donutTotalEl.textContent = labels.length + " kategori";

  if (legendEl) {
    legendEl.innerHTML = labels
      .map(
        (l, i) =>
          `<span class="legend-chip"><span class="legend-dot" style="background:${colors[i % colors.length]}"></span>${l}</span>`
      )
      .join("");
  }

  _pieChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: "#161B30" }],
    },
    options: {
      cutout: "68%",
      plugins: { legend: { display: false } },
    },
  });
}

// ================================================================
// ===== BAR CHART — Stok per Merk =====
// ================================================================
function renderBarChart(items) {
  const canvas = document.getElementById("barChart");
  const emptyEl = document.getElementById("barEmpty");
  if (!canvas) return;

  const merkMap = {};
  items.forEach((item) => {
    merkMap[item.merk] = (merkMap[item.merk] || 0) + item.stok;
  });
  const labels = Object.keys(merkMap);
  const data = Object.values(merkMap);

  if (_barChartInstance) { _barChartInstance.destroy(); _barChartInstance = null; }

  if (!labels.length) {
    canvas.style.display = "none";
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }

  canvas.style.display = "";
  if (emptyEl) emptyEl.style.display = "none";

  _barChartInstance = new Chart(canvas, {
    type: "bar",
    data: { labels, datasets: [{ label: "Stok", data, backgroundColor: "#4F8EF7", borderRadius: 6 }] },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#8B97C2" } },
        x: { grid: { display: false }, ticks: { color: "#8B97C2" } },
      },
    },
  });
}

// ================================================================
// ===== LINE CHART — Tren Stok Masuk (7H / 30H / All) =====
// ================================================================
function renderLineChart(range) {
  const canvas = document.getElementById("lineChart");
  const emptyEl = document.getElementById("lineEmpty");
  if (!canvas) return;

  let filtered = _allItems.filter((i) => i.tanggal);
  if (range === "7d") {
    const from = daysAgo(6);
    filtered = filtered.filter((i) => new Date(i.tanggal) >= from);
  } else if (range === "30d") {
    const from = daysAgo(29);
    filtered = filtered.filter((i) => new Date(i.tanggal) >= from);
  }
  // range === "all" -> tidak difilter

  const dayMap = {};
  filtered.forEach((i) => {
    dayMap[i.tanggal] = (dayMap[i.tanggal] || 0) + i.stok;
  });
  const sortedDays = Object.keys(dayMap).sort();
  const labels = sortedDays.map((d) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
  );
  const data = sortedDays.map((d) => dayMap[d]);

  if (_lineChartInstance) { _lineChartInstance.destroy(); _lineChartInstance = null; }

  if (!labels.length) {
    canvas.style.display = "none";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }

  canvas.style.display = "";
  if (emptyEl) emptyEl.style.display = "none";

  _lineChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Qty Masuk",
        data,
        borderColor: "#00e5e5",
        backgroundColor: "rgba(0,229,229,0.1)",
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: "#00e5e5",
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#8B97C2" } },
        x: { grid: { display: false }, ticks: { color: "#8B97C2" } },
      },
    },
  });
}

// Dipanggil dari tombol 7H / 30H / All di HTML (onclick="switchLine(...)")
function switchLine(range, btnEl) {
  document.querySelectorAll(".chart-tabs .chart-tab").forEach((b) => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderLineChart(range);
}
window.switchLine = switchLine;

// ================================================================
// ===== TOP 5 STOK TERBANYAK =====
// ================================================================
function renderTopItems(items) {
  const container = document.getElementById("topItemsList");
  if (!container) return;

  const map = {};
  items.forEach((i) => {
    map[i.nama] = (map[i.nama] || 0) + i.stok;
  });
  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!sorted.length) {
    container.innerHTML = `<div class="empty-state" style="padding:20px 0"><i class="bx bx-box"></i><span>Belum ada data</span></div>`;
    return;
  }

  const maxVal = sorted[0][1];
  const rankClasses = ["gold", "silver", "bronze"];

  container.innerHTML = sorted
    .map(([nama, qty], idx) => {
      const pct = maxVal > 0 ? Math.round((qty / maxVal) * 100) : 0;
      const rankClass = rankClasses[idx] || "";
      return `
        <div class="top-item">
          <span class="top-item-rank ${rankClass}">${idx + 1}</span>
          <span class="top-item-name" title="${nama}">${nama}</span>
          <div class="top-item-bar-wrap"><div class="top-item-bar" style="width:${pct}%"></div></div>
          <span class="top-item-val">${qty}</span>
        </div>`;
    })
    .join("");
}

// ================================================================
// ===== AKTIVITAS TERKINI =====
// ================================================================
function renderActivityFeed(invoices) {
  const container = document.getElementById("activityFeed");
  if (!container) return;

  const sorted = [...invoices].sort(
    (a, b) => new Date(b.created_at || b.tanggal) - new Date(a.created_at || a.tanggal)
  );
  const recent = sorted.slice(0, 6);

  if (!recent.length) {
    container.innerHTML = `<div class="empty-state" style="padding:20px 0"><i class="bx bx-time"></i><span>Belum ada aktivitas</span></div>`;
    return;
  }

  container.innerHTML = recent
    .map((inv) => {
      const totalQty =
        inv.total || (inv.invoice_items || []).reduce((s, it) => s + (parseInt(it.stok) || 0), 0);
      const timeStr = inv.tanggal
        ? new Date(inv.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        : "-";
      return `
        <div class="activity-item">
          <div class="activity-dot-wrap">
            <span class="activity-dot" style="background:#00e5e5"></span>
            <span class="activity-line"></span>
          </div>
          <div class="activity-body">
            <div class="activity-text">Invoice <strong>${inv.invoice_no}</strong> masuk — <strong>${totalQty} unit</strong> dari ${inv.supplier || "-"}</div>
            <div class="activity-time">${timeStr}</div>
          </div>
        </div>`;
    })
    .join("");
}

// ================================================================
// ===== TREN AKUMULASI TOTAL STOK BULANAN (FIXED — data asli) =====
// ================================================================
function renderStockTrendChart(items) {
  const canvas = document.getElementById("stockTrendChart");
  if (!canvas) return;

  const monthMap = {}; // "YYYY-MM" -> { label, qty }
  items.forEach((item) => {
    if (!item.tanggal) return;
    const key = getMonthKey(item.tanggal);
    if (!monthMap[key]) monthMap[key] = { label: getMonthLabel(item.tanggal), qty: 0 };
    monthMap[key].qty += item.stok;
  });

  const sortedKeys = Object.keys(monthMap).sort();
  const lastKeys = sortedKeys.slice(-7); // maksimal 7 bulan terakhir biar tidak padat
  const beforeKeys = sortedKeys.slice(0, Math.max(0, sortedKeys.length - 7));

  let running = 0;
  beforeKeys.forEach((k) => { running += monthMap[k].qty; });

  const labels = lastKeys.map((k) => monthMap[k].label);
  const cumulativeData = lastKeys.map((k) => {
    running += monthMap[k].qty;
    return running;
  });

  if (_stockTrendChartInstance) { _stockTrendChartInstance.destroy(); _stockTrendChartInstance = null; }

  if (!labels.length) {
    setText("trendCurrentVal", 0);
    setText("trendPeakVal", 0);
    setText("stockTrendPct", "+0%");
    return;
  }

  const currentVal = cumulativeData[cumulativeData.length - 1];
  const prevVal = cumulativeData.length > 1 ? cumulativeData[cumulativeData.length - 2] : 0;
  const peakVal = Math.max(...cumulativeData);
  const pct = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : currentVal > 0 ? 100 : 0;

  setText("trendCurrentVal", currentVal);
  setText("trendPeakVal", peakVal);
  const pctEl = document.getElementById("stockTrendPct");
  if (pctEl) pctEl.textContent = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";

  const pillEl = document.getElementById("stockTrendPill");
  if (pillEl) {
    const icon = pillEl.querySelector("i");
    if (pct < 0) {
      pillEl.style.color = "var(--danger)";
      pillEl.style.background = "var(--danger-bg)";
      if (icon) icon.className = "bx bx-down-arrow-alt";
    } else {
      pillEl.style.color = "";
      pillEl.style.background = "";
      if (icon) icon.className = "bx bx-up-arrow-alt";
    }
  }

  // PENTING: TIDAK pakai `maintainAspectRatio:false` di sini.
  // Opsi itu butuh parent container dengan tinggi tetap; karena `.chart-card`
  // tidak punya tinggi tetap, canvas jadi membesar tanpa batas (bug lama).
  // Dengan default (maintainAspectRatio: true) canvas mengikuti atribut
  // height="130" di HTML, sama seperti chart lain di halaman ini.
  _stockTrendChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Total Stok",
        data: cumulativeData,
        borderColor: "#00e5e5",
        backgroundColor: "rgba(0,229,229,0.08)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#0C0F1A",
        pointBorderColor: "#00e5e5",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ctx.raw + " unit" } },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#8B97C2" } },
        x: { grid: { display: false }, ticks: { color: "#8B97C2" } },
      },
    },
  });
}

// ================================================================
// ===== TABEL INVOICE TERBARU (+ search & sort) =====
// ================================================================
function renderRecentTable() {
  const tbody = document.getElementById("recentTableBody");
  if (!tbody) return;

  if (!_allInvoices.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state"><i class="bx bx-receipt"></i><span>Belum ada invoice</span></td></tr>';
    return;
  }

  const sorted = [..._allInvoices].sort((a, b) => {
    const diff = new Date(a.tanggal) - new Date(b.tanggal);
    return _tableSortDesc ? -diff : diff;
  });

  const kw = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  const filtered = kw
    ? sorted.filter(
      (inv) =>
        (inv.invoice_no || "").toLowerCase().includes(kw) ||
        (inv.supplier || "").toLowerCase().includes(kw)
    )
    : sorted;

  if (!filtered.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state"><i class="bx bx-search"></i><span>Tidak ditemukan</span></td></tr>';
    return;
  }

  tbody.innerHTML = "";
  filtered.forEach((inv, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><a href="invoice.html?id=${encodeURIComponent(inv.id)}" style="color:var(--aqua);font-weight:600;text-decoration:none">${inv.invoice_no}</a></td>
      <td>${inv.supplier || "—"}</td>
      <td>${inv.tanggal || "—"}</td>
      <td>${inv.total || 0} unit</td>
      <td><span class="badge badge-green">Masuk</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Dipanggil dari HTML: oninput="filterTable()" dan onclick="sortTable()"
function filterTable() { renderRecentTable(); }
function sortTable() { _tableSortDesc = !_tableSortDesc; renderRecentTable(); }
window.filterTable = filterTable;
window.sortTable = sortTable;