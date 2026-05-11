// AUTH CHECK

if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

// USER INFO

var loggedUser = localStorage.getItem('loggedUser') || 'Admin';

document.getElementById('sidebarUsername').innerHTML = loggedUser;

document.getElementById('sidebarAvatar').innerHTML =
loggedUser.charAt(0).toUpperCase();


// SIDEBAR

var sidebar = document.getElementById('sidebar');
var overlay = document.getElementById('sidebarOverlay');

document.getElementById('hamburger').onclick = function(){

    sidebar.classList.add('open');
    overlay.classList.add('active');

};

document.getElementById('sidebarClose').onclick = closeSidebar;

overlay.onclick = closeSidebar;

function closeSidebar(){

    sidebar.classList.remove('open');
    overlay.classList.remove('active');

}


// LOGOUT

document.getElementById('logoutBtn').onclick = function(){

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedUser');

    window.location.href = 'login.html';

};


// GLOBAL STOK

var allRows = [];

function loadGlobalStok(){

    var invoices =
    JSON.parse(localStorage.getItem('invoices') || '{}');

    var tbody =
    document.getElementById('globalTableBody');

    tbody.innerHTML = '';

    allRows = [];

    var nomor = 1;

    Object.values(invoices).forEach(function(inv){
        
        if(!inv.items || inv.items.length === 0){
            return;
        }

        inv.items.forEach(function(item){

            allRows.push({

                nomor : nomor++,

                // DATA INVOICE
                invoice : inv.invoice || '-',

                // DATA BARANG
                sku : item.sku || '-',

                nama : item.nama || '-',

                merk : item.merk || '-',

                kategori : item.kategori || '-',

                expired : item.expired || '-',

                stok : item.stok || 0,

                // HARGA
                hpp : item.hargaHPP || 0,

                jual : item.hargaJual || 0,

                // LOKASI
                lokasi : item.lokasi || '-'

            });

        });

    });

    // DATA KOSONG

    if(allRows.length === 0){

        tbody.innerHTML =
        '<tr class="empty-row">' +
        '<td colspan="12">' +
        'Belum ada data — tambahkan barang melalui Input Barang' +
        '</td>' +
        '</tr>';

        return;

    }

    renderRows(allRows);

}


// RENDER TABLE

function renderRows(rows){

    var tbody =
    document.getElementById('globalTableBody');

    tbody.innerHTML = '';

    rows.forEach(function(r){

        // ===== EXPIRED CHECK =====

        var expiredClass = 'expired-green';
        var expiredText = r.expired;

        if(r.expired !== '-'){

            var today = new Date();

            today.setHours(0,0,0,0);

            var expDate = new Date(r.expired);

            var diffTime =
            expDate.getTime() - today.getTime();

            var diffDays =
            Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if(diffDays <= 0){

                expiredClass = 'expired-red';

            }
            else if(diffDays <= 30){

                expiredClass = 'expired-yellow';

            }
            else{

                expiredClass = 'expired-green';

            }

        }

        var tr = document.createElement('tr');

        tr.innerHTML =

        // NOMOR
        '<td>' + r.nomor + '</td>' +

        // INVOICE LINK
        '<td>' +

        '<a href="invoice.html?id=' +
        r.invoice +
        '" class="invoice-link">' +

        r.invoice +

        '</a>' +

        '</td>' +

        // SKU BUTTON
        '<td>' +

        '<button class="sku-btn">' + 
    r.sku +
        '</button>' +

        '</td>' +

        // NAMA
        '<td>' + r.nama + '</td>' +

        // MERK
        '<td>' + r.merk + '</td>' +

        // KATEGORI
        '<td>' + r.kategori + '</td>' +

        // EXPIRED
        '<td>' +

        '<span class="expired-badge ' +
        expiredClass +
        '">' +

        expiredText +

        '</span>' +

        '</td>' +

        // STOK
        '<td>' + r.stok + '</td>' +

        // HPP
        '<td>Rp ' +
        Number(r.hpp).toLocaleString('id-ID') +
        '</td>' +

        // JUAL
        '<td>Rp ' +
        Number(r.jual).toLocaleString('id-ID') +
        '</td>' +

        // LOKASI
        '<td>' + r.lokasi + '</td>' +

        // BUTTON BARCODE
        '<td>' +

        '<button class="btn-barcode">' +
        'Barcode' +
        '</button>' +

        '</td>';

        // SKU BUTTON

        tr.querySelector('.sku-btn').onclick =
        function(){

            showBarcodePopup(r);

        };

        // BUTTON BARCODE

        tr.querySelector('.btn-barcode').onclick =
        function(){

            showBarcodePopup(r);

        };

        tbody.appendChild(tr);

    });

}


// SEARCH

document.getElementById('searchInput')
.oninput = function(){

    var keyword = this.value.toLowerCase();

    // RESET

    if(keyword === ''){

        renderRows(allRows);
        return;

    }

    // FILTER

    var filtered = allRows.filter(function(r){

        return (

            r.nama.toLowerCase().includes(keyword) ||

            r.kategori.toLowerCase().includes(keyword) ||

            r.merk.toLowerCase().includes(keyword) ||

            r.invoice.toLowerCase().includes(keyword) ||

            r.lokasi.toLowerCase().includes(keyword) ||

            r.sku.toLowerCase().includes(keyword) ||

            String(r.expired)
            .toLowerCase()
            .includes(keyword) ||

            String(r.hpp)
            .toLowerCase()
            .includes(keyword) ||

            String(r.jual)
            .toLowerCase()
            .includes(keyword)

        );

    });

    // HASIL KOSONG

    if(filtered.length === 0){

        document.getElementById('globalTableBody').innerHTML =

        '<tr class="empty-row">' +
        '<td colspan="12">' +
        'Tidak ada data yang cocok' +
        '</td>' +
        '</tr>';

    }else{

        renderRows(filtered);

    }

};


// ===== BARCODE =====

var barcodeOverlay =
document.getElementById('barcodeOverlay');


// SHOW BARCODE POPUP

function showBarcodePopup(item){

    // SET DATA

    document.getElementById('bcNama').innerHTML =
    item.nama;

    document.getElementById('bcSKU').innerHTML =
    item.sku;

    // GENERATE BARCODE

    JsBarcode('#barcodeCanvas', item.sku, {

        format : 'CODE128',

        lineColor : '#111',

        width : 2,

        height : 70,

        displayValue : true

    });

    // SHOW MODAL

    barcodeOverlay.classList.add('active');

}


// CLOSE BARCODE

document.getElementById('btnCloseBarcode').onclick =
function(){

    barcodeOverlay.classList.remove('active');

};


// CLOSE IF CLICK OUTSIDE

barcodeOverlay.onclick = function(e){

    if(e.target === barcodeOverlay){

        barcodeOverlay.classList.remove('active');

    }

};


// DOWNLOAD PNG

document.getElementById('btnDownloadBarcode').onclick =
function(){

    var svg =
    document.getElementById('barcodeCanvas');

    var serializer =
    new XMLSerializer();

    var svgData =
    serializer.serializeToString(svg);

    var canvas =
    document.createElement('canvas');

    var ctx =
    canvas.getContext('2d');

    var img =
    new Image();

    img.onload = function(){

        canvas.width = img.width;

        canvas.height = img.height;

        ctx.fillStyle = '#ffffff';

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.drawImage(img, 0, 0);

        var a =
        document.createElement('a');

        a.download = 'barcode.png';

        a.href =
        canvas.toDataURL('image/png');

        a.click();

    };

    img.src =
    'data:image/svg+xml;base64,' +
    btoa(svgData);

};


// PRINT BARCODE

document.getElementById('btnPrintBarcode').onclick =
function(){

    var svg =
    document.getElementById('barcodeCanvas')
    .outerHTML;

    var printWindow =
    window.open(
        '',
        '',
        'width=600,height=400'
    );

    printWindow.document.write(

        '<html>' +

        '<head>' +
        '<title>Print Barcode</title>' +
        '</head>' +

        '<body style="' +
        'display:flex;' +
        'justify-content:center;' +
        'align-items:center;' +
        'height:100vh;' +
        '">' +

        svg +

        '</body>' +

        '</html>'

    );

    printWindow.document.close();

    printWindow.focus();

    setTimeout(function(){

        printWindow.print();

    }, 500);

};


// INIT

loadGlobalStok();