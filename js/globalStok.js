"use strict";
const RETUR_KEY_GS = "invenz_retur_items";

function loadReturSetGS() {
  try {
    return new Set(JSON.parse(localStorage.getItem(RETUR_KEY_GS) || "[]"));
  } catch {
    return new Set();
  }
}

function itemReturKeyGS(invoiceId, sku, nama) {
  return `${invoiceId}::${sku}::${nama}`;
}

// ============================================================
// ===== AUTH CHECK ===========================================
// ============================================================
if (!localStorage.getItem("isLoggedIn")) {
  window.location.href = "login.html";
}

// ============================================================
// ===== USER & ROLE SETUP ====================================
// ============================================================
const loggedUser = localStorage.getItem("loggedUser") || "Admin";
const loggedRole = localStorage.getItem("loggedRole") || "owner";

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Administrator",
  kepala_toko: "Kepala Toko",
  kasir: "Kasir",
  gudang: "Staf Gudang",
};
const ROLE_CLASSES = {
  owner: "role-owner",
  admin: "role-admin",
  kepala_toko: "role-kepala",
  kasir: "role-kasir",
  gudang: "role-gudang",
};

document.getElementById("sidebarUsername").textContent = loggedUser;
document.getElementById("sidebarAvatar").textContent = loggedUser
  .charAt(0)
  .toUpperCase();
document.getElementById("navAvatar").textContent = loggedUser
  .charAt(0)
  .toUpperCase();
document.getElementById("navAvatar").title = loggedUser;

const roleLabel = ROLE_LABELS[loggedRole] || loggedRole;
const roleClass = ROLE_CLASSES[loggedRole] || "role-admin";
const sidebarRole = document.getElementById("sidebarRole");
if (sidebarRole) {
  sidebarRole.innerHTML = `<span class="role-badge ${roleClass}">${roleLabel}</span>`;
}

// Tampilkan menu admin hanya untuk owner & admin
const menuUserMgmt = document.getElementById("menuUserMgmt");
if (menuUserMgmt && (loggedRole === "owner" || loggedRole === "admin")) {
  menuUserMgmt.style.display = "";
}

// ============================================================
// ===== SIDEBAR TOGGLE =======================================
// ============================================================
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");

document.getElementById("hamburger").addEventListener("click", function () {
  sidebar.classList.add("open");
  overlay.classList.add("active");
});
document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
}

// ============================================================
// ===== LOGOUT ===============================================
// ============================================================
document.getElementById("logoutBtn").addEventListener("click", function () {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("loggedUser");
  localStorage.removeItem("loggedRole");
  window.location.href = "login.html";
});

// ============================================================
// ===== CUSTOM RANGE STATE ===================================
// ============================================================
var customRangeActive = false;
var customRangeFrom = null;
var customRangeTo = null;

var filterWaktuEl = document.getElementById("filterWaktu");
var customRangeWrap = document.getElementById("customRangeWrap");
var customFromEl = document.getElementById("customFrom");
var customToEl = document.getElementById("customTo");
var btnApplyRange = document.getElementById("btnApplyRange");
var rangeBadge = document.getElementById("rangeBadge");
var rangeBadgeText = document.getElementById("rangeBadgeText");

function formatDateShort(d) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

filterWaktuEl.addEventListener("change", function () {
  if (filterWaktuEl.value === "custom") {
    customRangeWrap.classList.add("visible");
    if (!customFromEl.value) {
      var now = new Date();
      customFromEl.value = new Date(now.getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0];
      customToEl.value = now.toISOString().split("T")[0];
    }
  } else {
    customRangeWrap.classList.remove("visible");
    customRangeActive = false;
    rangeBadge.classList.remove("visible");
    applyFilterAndRender();
  }
});

btnApplyRange.addEventListener("click", function () {
  if (!customFromEl.value || !customToEl.value) {
    alert("Pilih tanggal dari dan sampai terlebih dahulu.");
    return;
  }
  var f = new Date(customFromEl.value + "T00:00:00");
  var t = new Date(customToEl.value + "T23:59:59");
  if (f > t) {
    alert("Tanggal 'Dari' tidak boleh lebih besar dari 'Sampai'.");
    return;
  }
  customRangeFrom = f;
  customRangeTo = t;
  customRangeActive = true;
  rangeBadgeText.textContent = formatDateShort(f) + " – " + formatDateShort(t);
  rangeBadge.classList.add("visible");
  customRangeWrap.classList.remove("visible");
  applyFilterAndRender();
});

rangeBadge.addEventListener("click", function () {
  customRangeActive = false;
  customRangeFrom = null;
  customRangeTo = null;
  rangeBadge.classList.remove("visible");
  filterWaktuEl.value = "all";
  applyFilterAndRender();
});

// ============================================================
// ===== DATE RANGE HELPER ====================================
// ============================================================
function getDateRange(filter) {
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

function isInRange(tanggalStr, range) {
  if (!range) return true;
  var d = new Date(tanggalStr);
  return d >= range.from && d <= range.to;
}

// ============================================================
// ===== DATA LOADING =========================================
// ============================================================
var allRows = [];

function loadGlobalStok() {
  var invoices = {};
  try {
    invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  } catch (e) {}

  allRows = [];

  var returSet = loadReturSetGS();
 
  Object.values(invoices).forEach(function (inv) {
    if (!inv.items || inv.items.length === 0) return;
    inv.items.forEach(function (item) {
 
      // Sembunyikan item yang di-retur
      var rk = itemReturKeyGS(inv.invoice, item.sku || item.nama, item.nama);
      if (returSet.has(rk)) return;
 
      allRows.push({
        invoice  : inv.invoice   || "—",
        tanggal  : inv.tanggal   || "",
        supplier : inv.supplier  || "—",
        sku      : item.sku      || "—",
        nama     : item.nama     || "—",
        merk     : item.merk     || "—",
        kategori : item.kategori || "—",
        expired  : item.expired  || "—",
        stok     : item.stok     || 0,
        hpp      : item.hargaHPP  || 0,
        jual     : item.hargaJual || 0,
        lokasi   : item.lokasi    || "—",
      });
    });
  });

  applyFilterAndRender();
}

// ============================================================
// ===== FILTER + SEARCH + RENDER =============================
// ============================================================
function applyFilterAndRender() {
  var filter = filterWaktuEl.value;
  var keyword = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  var range = getDateRange(filter);

  var filtered = allRows.filter(function (r) {
    return isInRange(r.tanggal, range);
  });

  if (keyword) {
    filtered = filtered.filter(function (r) {
      return (
        r.nama.toLowerCase().includes(keyword) ||
        r.kategori.toLowerCase().includes(keyword) ||
        r.merk.toLowerCase().includes(keyword) ||
        r.invoice.toLowerCase().includes(keyword) ||
        r.lokasi.toLowerCase().includes(keyword) ||
        r.sku.toLowerCase().includes(keyword) ||
        String(r.expired).toLowerCase().includes(keyword)
      );
    });
  }

  updateSummary(filtered);
  renderRows(filtered);
}

// ============================================================
// ===== UPDATE SUMMARY STRIP =================================
// ============================================================
function updateSummary(rows) {
  var totalQty = rows.reduce(function (s, r) {
    return s + (parseInt(r.stok) || 0);
  }, 0);
  var invoiceSet = new Set(
    rows.map(function (r) {
      return r.invoice;
    }),
  );
  var kategoriSet = new Set(
    rows.map(function (r) {
      return r.kategori;
    }),
  );

  document.getElementById("statTotalBarang").textContent = rows.length;
  document.getElementById("statTotalQty").textContent = totalQty;
  document.getElementById("statKategori").textContent = kategoriSet.size;
  document.getElementById("statInvoice").textContent = invoiceSet.size;
}

// ============================================================
// ===== RENDER ROWS ==========================================
// ============================================================
function renderRows(rows) {
  var tbody = document.getElementById("globalTableBody");
  tbody.innerHTML = "";

  if (rows.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="11">Tidak ada data yang cocok dengan filter ini</td></tr>';
    return;
  }

  rows.forEach(function (r, idx) {
    var expiredClass = "";
    if (r.expired && r.expired !== "—" && r.expired !== "-") {
      var todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      var expDate = new Date(r.expired);
      var diffDays = Math.ceil((expDate - todayDate) / (1000 * 60 * 60 * 24));
      expiredClass =
        diffDays <= 0
          ? "expired-red"
          : diffDays <= 30
            ? "expired-yellow"
            : "expired-green";
    }

    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" +
      (idx + 1) +
      "</td>" +
      '<td><a href="invoice.html?id=' +
      encodeURIComponent(r.invoice) +
      '" class="invoice-link">' +
      r.invoice +
      "</a></td>" +
      '<td><button class="sku-btn"><i class="bx bx-barcode" style="font-size:13px;vertical-align:-2px;margin-right:3px"></i>' +
      r.sku +
      "</button></td>" +
      "<td style='text-align:left;color:var(--text)'><strong>" +
      r.nama +
      "</strong></td>" +
      "<td>" +
      r.merk +
      "</td>" +
      "<td>" +
      r.kategori +
      "</td>" +
      "<td>" +
      (expiredClass
        ? '<span class="expired-badge ' +
          expiredClass +
          '">' +
          r.expired +
          "</span>"
        : '<span style="color:var(--text3)">—</span>') +
      "</td>" +
      "<td><strong style='color:var(--text)'>" +
      r.stok +
      "</strong></td>" +
      '<td style="color:var(--success);font-family:var(--font-mono);font-size:12px">Rp ' +
      Number(r.hpp).toLocaleString("id-ID") +
      "</td>" +
      '<td style="color:var(--brand);font-family:var(--font-mono);font-size:12px">Rp ' +
      Number(r.jual).toLocaleString("id-ID") +
      "</td>" +
      "<td>" +
      r.lokasi +
      "</td>";

    tr.querySelector(".sku-btn").addEventListener("click", function () {
      showBarcodePopup(r);
    });
    tbody.appendChild(tr);
  });
}

// ============================================================
// ===== FILTER & SEARCH EVENTS ===============================
// ============================================================
filterWaktuEl.addEventListener("change", function () {
  if (filterWaktuEl.value !== "custom") applyFilterAndRender();
});

document
  .getElementById("searchInput")
  .addEventListener("input", applyFilterAndRender);

// ============================================================
// ===== BARCODE POPUP ========================================
// ============================================================
var barcodeOverlay = document.getElementById("barcodeOverlay");
var currentBarcodeItem = null;

function showBarcodePopup(item) {
  currentBarcodeItem = item;
  document.getElementById("bcNama").textContent = item.nama;
  document.getElementById("bcSKU").textContent = item.sku;

  try {
    JsBarcode("#barcodeCanvas", item.sku, {
      format: "CODE128",
      lineColor: "#111",
      width: 2,
      height: 70,
      displayValue: true,
      fontSize: 14,
      margin: 12,
      background: "#ffffff",
    });
  } catch (e) {
    document.getElementById("barcodeCanvas").innerHTML =
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="red" font-size="12">SKU tidak valid untuk barcode</text>';
  }

  barcodeOverlay.classList.add("active");
}

document
  .getElementById("btnCloseBarcode")
  .addEventListener("click", function () {
    barcodeOverlay.classList.remove("active");
    currentBarcodeItem = null;
  });

barcodeOverlay.addEventListener("click", function (e) {
  if (e.target === barcodeOverlay) {
    barcodeOverlay.classList.remove("active");
    currentBarcodeItem = null;
  }
});

// ===== Download PNG =====
document
  .getElementById("btnDownloadBarcode")
  .addEventListener("click", function () {
    if (!currentBarcodeItem) return;
    var svg = document.getElementById("barcodeCanvas");
    var svgData = new XMLSerializer().serializeToString(svg);
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var img = new Image();
    img.onload = function () {
      canvas.width = img.width || 300;
      canvas.height = img.height || 150;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      var a = document.createElement("a");
      a.download = "SKU_" + currentBarcodeItem.sku + ".png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  });

// ===== Print =====
document
  .getElementById("btnPrintBarcode")
  .addEventListener("click", function () {
    if (!currentBarcodeItem) return;
    var svg = document.getElementById("barcodeCanvas");
    var svgStr = new XMLSerializer().serializeToString(svg);
    var item = currentBarcodeItem;
    var win = window.open("", "_blank", "width=420,height=320");
    win.document.write(
      "<!DOCTYPE html><html><head><title>Print Barcode — " +
        item.sku +
        "</title>" +
        '<style>body{margin:0;padding:24px;font-family:"DM Sans",sans-serif;display:flex;flex-direction:column;align-items:center}' +
        ".n{font-size:15px;font-weight:700;text-align:center;margin-bottom:4px}" +
        ".m{font-size:12px;color:#555;text-align:center;margin-bottom:12px}" +
        "img{max-width:320px}@media print{body{padding:8px}}</style></head><body>" +
        '<div class="n">' +
        item.nama +
        "</div>" +
        '<div class="m">SKU: ' +
        item.sku +
        "</div>" +
        '<img src="data:image/svg+xml;base64,' +
        btoa(unescape(encodeURIComponent(svgStr))) +
        '" />' +
        "<script>window.onload=function(){window.print();window.close();}<\/script></body></html>",
    );
    win.document.close();
  });

// ============================================================
// ===== AUTO-REFRESH SAAT TAB KEMBALI AKTIF ==================
// ============================================================
window.addEventListener("focus", function () {
  loadGlobalStok();
});

// ============================================================
// ===== INIT =================================================
// ============================================================
loadGlobalStok();
