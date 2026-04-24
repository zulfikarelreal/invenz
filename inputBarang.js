let rowCount = 0;

const modalOverlay = document.getElementById("modalOverlay");
const tableBody = document.getElementById("tableBody");
const errorMsg = document.getElementById("errorMsg");
const openModalBtn = document.getElementById("openModalBtn");
const batalBtn = document.getElementById("batalBtn");
const simpanBtn = document.getElementById("simpanBtn");

const inputInvoice = document.getElementById("inputInvoice");
const inputTanggal = document.getElementById("inputTanggal");
const inputSupplier = document.getElementById("inputSupplier");
const inputTotal = document.getElementById("inputTotal");

// Buka modal
openModalBtn.addEventListener("click", () => {
  modalOverlay.classList.add("active");
});

// Tutup modal
batalBtn.addEventListener("click", tutupModal);

// Tutup modal kalo klik di luar
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) tutupModal();
});

// Simpan data
simpanBtn.addEventListener("click", simpanData);

function tutupModal() {
  modalOverlay.classList.remove("active");
  clearForm();
}

function clearForm() {
  inputInvoice.value = "";
  inputTanggal.value = "";
  inputSupplier.value = "";
  inputTotal.value = "";
  errorMsg.textContent = "";
}

function simpanData() {
  const invoice = inputInvoice.value.trim();
  const tanggal = inputTanggal.value;
  const supplier = inputSupplier.value.trim();
  const total = inputTotal.value.trim();

  if (!invoice || !tanggal || !supplier || !total) {
    errorMsg.textContent = "Semua field harus diisi!";
    return;
  }

  // Hapus baris kosong jika ada
  const emptyRow = tableBody.querySelector(".empty-row");
  if (emptyRow) emptyRow.remove();

  rowCount++;

  const tr = document.createElement("tr");
  tr.innerHTML = `
        <td>${rowCount}</td>
        <td>${invoice}</td>
        <td>${tanggal}</td>
        <td>${supplier}</td>
        <td>${total}</td>
        <td><button class="btn-hapus">Hapus</button></td>
    `;

  // Event hapus per baris
  tr.querySelector(".btn-hapus").addEventListener("click", () => {
    hapusBaris(tr);
  });

  tableBody.appendChild(tr);
  tutupModal();
}

function hapusBaris(row) {
  row.remove();

  const rows = tableBody.querySelectorAll("tr:not(.empty-row)");

  if (rows.length === 0) {
    // Kembalikan baris kosong
    const emptyTr = document.createElement("tr");
    emptyTr.className = "empty-row";
    emptyTr.innerHTML =
      '<td colspan="6">Belum ada data — klik "Input Barang" untuk menambah</td>';
    tableBody.appendChild(emptyTr);
    rowCount = 0;
  } else {
    // Update nomor urut
    rows.forEach((r, i) => {
      r.cells[0].textContent = i + 1;
    });
    rowCount = rows.length;
  }
}
