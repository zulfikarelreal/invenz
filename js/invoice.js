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
const inputHarga = document.getElementById("inputHarga");
const subtotalVal = document.getElementById("subtotalVal");
const totalHargaDisplay = document.getElementById("totalHargaDisplay");

let rowCount = 0;
let rowToDelete = null;

// ===== DROPDOWNS =====
const ddNama = new CustomDropdown("cdNama", "barang", { icon: "bx-package" });
const ddKategori = new CustomDropdown("cdKategori", "kategori", {
  icon: "bx-category",
});
const ddMerk = new CustomDropdown("cdMerk", "merk", {
  icon: "bx-purchase-tag",
});
const ddLokasi = new CustomDropdown("cdLokasi", "lokasi", {
  icon: "bx-map-pin",
});

// ===== FORMAT RP =====
function formatRp(num) {
  if (!num || num === 0) return "Rp 0";
  return "Rp " + parseInt(num).toLocaleString("id-ID");
}

// ===== PREVIEW SUBTOTAL =====
function updateSubtotalPreview() {
  const stok = parseInt(inputStok.value) || 0;
  const harga = parseFloat(inputHarga.value) || 0;
  subtotalVal.textContent = formatRp(stok * harga);
}
inputStok.addEventListener("input", updateSubtotalPreview);
inputHarga.addEventListener("input", updateSubtotalPreview);

// ===== INIT =====
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
      const emptyRow = itemTableBody.querySelector(".empty-row");
      if (emptyRow) emptyRow.remove();
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
    <div class="info-item"><span class="info-label">Total Stok</span><span class="info-value" id="infoTotal">${data.total}</span></div>
    <div class="info-item"><span class="info-label">Total Harga</span><span class="info-value" id="infoHarga" style="color:#1a6b2a">${formatRp(data.totalHarga || 0)}</span></div>
  `;
}

// ===== UPDATE TOTAL STOK & HARGA =====
function updateTotal() {
  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  if (!invoices[invoiceId]) return;
  const total = invoices[invoiceId].items.reduce(
    (s, i) => s + (parseInt(i.stok) || 0),
    0,
  );
  const totalH = invoices[invoiceId].items.reduce(
    (s, i) => s + (parseFloat(i.harga) || 0) * (parseInt(i.stok) || 0),
    0,
  );
  invoices[invoiceId].total = total;
  invoices[invoiceId].totalHarga = totalH;
  localStorage.setItem("invoices", JSON.stringify(invoices));
  const infoTotal = document.getElementById("infoTotal");
  const infoHarga = document.getElementById("infoHarga");
  if (infoTotal) infoTotal.textContent = total;
  if (infoHarga) infoHarga.textContent = formatRp(totalH);
  updateTotalHargaDisplay();
}

function updateTotalHargaDisplay() {
  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  const data = invoices[invoiceId];
  if (!data) return;
  const totalH = data.items
    ? data.items.reduce(
        (s, i) => s + (parseFloat(i.harga) || 0) * (parseInt(i.stok) || 0),
        0,
      )
    : 0;
  totalHargaDisplay.textContent = formatRp(totalH);
}

// ===== MODAL =====
openTambahBtn.addEventListener("click", () => {
  ddNama.refresh();
  ddKategori.refresh();
  ddMerk.refresh();
  ddLokasi.refresh();
  subtotalVal.textContent = "Rp 0";
  modalOverlay.classList.add("active");
});
batalBtn.addEventListener("click", tutupModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) tutupModal();
});
simpanBtn.addEventListener("click", simpanItem);

function tutupModal() {
  modalOverlay.classList.remove("active");
  clearForm();
}

function clearForm() {
  ddNama.clear();
  ddKategori.clear();
  ddMerk.clear();
  ddLokasi.clear();
  inputStok.value = "";
  inputHarga.value = "";
  subtotalVal.textContent = "Rp 0";
  errorMsg.textContent = "";
}

function simpanItem() {
  const nama = ddNama.getValue();
  const kategori = ddKategori.getValue();
  const merk = ddMerk.getValue();
  const stok = inputStok.value.trim();
  const harga = inputHarga.value.trim();
  const lokasi = ddLokasi.getValue();

  if (!nama || !kategori || !merk || !stok || !lokasi) {
    errorMsg.textContent = "Semua field harus diisi! (Harga boleh 0)";
    return;
  }

  autoAddToLinkedData("barang", nama);
  autoAddToLinkedData("kategori", kategori);
  autoAddToLinkedData("merk", merk);
  autoAddToLinkedData("lokasi", lokasi);

  const item = { nama, kategori, merk, stok, harga: harga || "0", lokasi };

  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  if (!invoices[invoiceId])
    invoices[invoiceId] = { invoice: invoiceId, items: [] };
  invoices[invoiceId].items.push(item);
  localStorage.setItem("invoices", JSON.stringify(invoices));

  updateTotal();
  tambahBaris(item, true);
  tutupModal();
}

// ===== TAMBAH BARIS =====
function tambahBaris(item, removeEmpty = true) {
  if (removeEmpty) {
    const emptyRow = itemTableBody.querySelector(".empty-row");
    if (emptyRow) emptyRow.remove();
  }
  rowCount++;
  const subtotal = (parseFloat(item.harga) || 0) * (parseInt(item.stok) || 0);
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td>${item.nama}</td>
    <td>${item.kategori}</td>
    <td>${item.merk}</td>
    <td>${item.stok}</td>
    <td>${formatRp(item.harga || 0)}</td>
    <td style="font-weight:700;color:#1a6b2a">${formatRp(subtotal)}</td>
    <td>${item.lokasi}</td>
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
    const rowIndex = rows.indexOf(rowToDelete);
    rowToDelete.remove();
    const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
    if (invoices[invoiceId]?.items) {
      invoices[invoiceId].items.splice(rowIndex, 1);
      localStorage.setItem("invoices", JSON.stringify(invoices));
    }
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
    const emptyTr = document.createElement("tr");
    emptyTr.className = "empty-row";
    emptyTr.innerHTML =
      '<td colspan="9">Belum ada barang — klik "+ Tambah Barang" untuk menambah</td>';
    itemTableBody.appendChild(emptyTr);
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
