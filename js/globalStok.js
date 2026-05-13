// AUTH CHECK
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

// USER INFO
var loggedUser = localStorage.getItem('loggedUser') || 'Admin';
document.getElementById('sidebarUsername').innerHTML = loggedUser;
document.getElementById('sidebarAvatar').innerHTML = loggedUser.charAt(0).toUpperCase();

// SIDEBAR
var sidebar = document.getElementById('sidebar');
var overlay = document.getElementById('sidebarOverlay');
document.getElementById('hamburger').onclick = function () {
    sidebar.classList.add('open');
    overlay.classList.add('active');
};
document.getElementById('sidebarClose').onclick = closeSidebar;
overlay.onclick = closeSidebar;
function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

// LOGOUT
document.getElementById('logoutBtn').onclick = function () {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedUser');
    window.location.href = 'login.html';
};

// ===== DATE RANGE HELPER =====
function getDateRange(filter) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
        case 'today':
            return { from: today, to: new Date() };
        case '7d':
            return { from: new Date(today - 6 * 864e5), to: new Date() };
        case 'thismonth':
            return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date() };
        case '30d':
            return { from: new Date(today - 29 * 864e5), to: new Date() };
        case 'lastmonth':
            return {
                from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                to: new Date(now.getFullYear(), now.getMonth(), 0)
            };
        case '3m':
            return { from: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()), to: new Date() };
        case '6m':
            return { from: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()), to: new Date() };
        case 'ytd':
            return { from: new Date(now.getFullYear(), 0, 1), to: new Date() };
        case '1y':
            return { from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), to: new Date() };
        default:
            return null; // all time
    }
}

function isInRange(tanggalStr, range) {
    if (!range) return true;
    var d = new Date(tanggalStr);
    return d >= range.from && d <= range.to;
}

// ===== STATE =====
var allRows = [];

// ===== LOAD DATA =====
function loadGlobalStok() {
    var invoices = JSON.parse(localStorage.getItem('invoices') || '{}');
    allRows = [];
    var nomor = 1;

    Object.values(invoices).forEach(function (inv) {
        if (!inv.items || inv.items.length === 0) return;
        inv.items.forEach(function (item) {
            allRows.push({
                nomor: nomor++,
                invoice: inv.invoice || '-',
                tanggal: inv.tanggal || '',
                sku: item.sku || '-',
                nama: item.nama || '-',
                merk: item.merk || '-',
                kategori: item.kategori || '-',
                expired: item.expired || '-',
                stok: item.stok || 0,
                hpp: item.hargaHPP || 0,
                jual: item.hargaJual || 0,
                lokasi: item.lokasi || '-'
            });
        });
    });

    applyFilterAndRender();
}

// ===== APPLY FILTER + SEARCH LALU RENDER =====
function applyFilterAndRender() {
    var filter = document.getElementById('filterWaktu').value;
    var keyword = document.getElementById('searchInput').value.toLowerCase();
    var range = getDateRange(filter);

    // Filter tanggal invoice masuk
    var filtered = allRows.filter(function (r) {
        return isInRange(r.tanggal, range);
    });

    // Filter search
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

    renderRows(filtered);
}

// ===== RENDER =====
function renderRows(rows) {
    var tbody = document.getElementById('globalTableBody');
    tbody.innerHTML = '';

    if (rows.length === 0) {
        tbody.innerHTML =
            '<tr class="empty-row"><td colspan="12">Tidak ada data yang cocok</td></tr>';
        return;
    }

    // Renomor sesuai hasil filter
    rows.forEach(function (r, idx) {

        // ===== EXPIRED STATUS =====
        var expiredClass = '';
        var expiredText = r.expired;

        if (r.expired && r.expired !== '-') {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var expDate = new Date(r.expired);
            var diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
                expiredClass = 'expired-red';
            } else if (diffDays <= 30) {
                expiredClass = 'expired-yellow';
            } else {
                expiredClass = 'expired-green';
            }
        }

        var tr = document.createElement('tr');

        tr.innerHTML =
            '<td>' + (idx + 1) + '</td>' +

            // INVOICE — klik ke halaman invoice
            '<td><a href="invoice.html?id=' + encodeURIComponent(r.invoice) +
            '" class="invoice-link">' + r.invoice + '</a></td>' +

            // SKU — klik popup barcode
            '<td><button class="sku-btn">' + r.sku + '</button></td>' +

            '<td>' + r.nama + '</td>' +
            '<td>' + r.merk + '</td>' +
            '<td>' + r.kategori + '</td>' +

            // EXPIRED BADGE
            '<td>' +
            (expiredClass
                ? '<span class="expired-badge ' + expiredClass + '">' + expiredText + '</span>'
                : '<span style="color:#aaa">—</span>') +
            '</td>' +

            '<td>' + r.stok + '</td>' +

            '<td>Rp ' + Number(r.hpp).toLocaleString('id-ID') + '</td>' +
            '<td>Rp ' + Number(r.jual).toLocaleString('id-ID') + '</td>' +
            '<td>' + r.lokasi + '</td>' +

            // TOMBOL BARCODE
            '<td><button class="btn-barcode"><i class="bx bx-barcode"></i> Barcode</button></td>';

        // Event SKU button
        tr.querySelector('.sku-btn').onclick = function () {
            showBarcodePopup(r);
        };

        // Event Barcode button
        tr.querySelector('.btn-barcode').onclick = function () {
            showBarcodePopup(r);
        };

        tbody.appendChild(tr);
    });
}

// ===== FILTER & SEARCH EVENTS =====
document.getElementById('filterWaktu').onchange = function () {
    applyFilterAndRender();
};

document.getElementById('searchInput').oninput = function () {
    applyFilterAndRender();
};

// ===== BARCODE POPUP =====
var barcodeOverlay = document.getElementById('barcodeOverlay');
var currentBarcodeItem = null;

function showBarcodePopup(item) {
    currentBarcodeItem = item;
    document.getElementById('bcNama').innerHTML = item.nama;
    document.getElementById('bcSKU').innerHTML = item.sku;

    try {
        JsBarcode('#barcodeCanvas', item.sku, {
            format: 'CODE128',
            lineColor: '#111',
            width: 2,
            height: 70,
            displayValue: true,
            fontSize: 14,
            margin: 12,
            background: '#ffffff'
        });
    } catch (e) {
        document.getElementById('barcodeCanvas').innerHTML =
            '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="red" font-size="12">SKU tidak valid untuk barcode</text>';
    }

    barcodeOverlay.classList.add('active');
}

document.getElementById('btnCloseBarcode').onclick = function () {
    barcodeOverlay.classList.remove('active');
    currentBarcodeItem = null;
};

barcodeOverlay.onclick = function (e) {
    if (e.target === barcodeOverlay) {
        barcodeOverlay.classList.remove('active');
        currentBarcodeItem = null;
    }
};

// DOWNLOAD PNG
document.getElementById('btnDownloadBarcode').onclick = function () {
    if (!currentBarcodeItem) return;
    var svg = document.getElementById('barcodeCanvas');
    var svgData = new XMLSerializer().serializeToString(svg);
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function () {
        canvas.width = img.width || 300;
        canvas.height = img.height || 150;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        var a = document.createElement('a');
        a.download = 'SKU_' + currentBarcodeItem.sku + '.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
};

// PRINT
document.getElementById('btnPrintBarcode').onclick = function () {
    if (!currentBarcodeItem) return;
    var svg = document.getElementById('barcodeCanvas');
    var svgStr = new XMLSerializer().serializeToString(svg);
    var item = currentBarcodeItem;
    var win = window.open('', '_blank', 'width=420,height=320');
    win.document.write(
        '<!DOCTYPE html><html><head><title>Print Barcode — ' + item.sku + '</title>' +
        '<style>body{margin:0;padding:24px;font-family:"Poppins",sans-serif;display:flex;flex-direction:column;align-items:center;}' +
        '.print-nama{font-size:15px;font-weight:700;text-align:center;margin-bottom:4px;}' +
        '.print-meta{font-size:12px;color:#555;text-align:center;margin-bottom:12px;}' +
        'img{max-width:320px;}' +
        '@media print{body{padding:8px;}}' +
        '</style></head><body>' +
        '<div class="print-nama">' + item.nama + '</div>' +
        '<div class="print-meta">SKU: ' + item.sku + '</div>' +
        '<img src="data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr))) + '" />' +
        '<script>window.onload=function(){window.print();window.close();}<\/script>' +
        '</body></html>'
    );
    win.document.close();
};

// ===== INIT =====
loadGlobalStok();