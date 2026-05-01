<<<<<<< HEAD:invenz/inputBarang.js
// ===== GUARD: pastikan loggedUser tidak undefined =====
// Ambil dari localStorage jika auth.js tidak mendefinisikannya sebagai variabel global

=======
// ===== GUARD =====
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
const loggedUser =
  (typeof window.loggedUser !== "undefined" && window.loggedUser) ||
  localStorage.getItem("loggedUser") ||
  "Admin";

<<<<<<< HEAD:invenz/inputBarang.js
// Kalau belum login sama sekali, redirect ke login
=======
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
if (!localStorage.getItem("isLoggedIn")) {
  window.location.href = "login.html";
}

// ===== INIT VARIABEL =====
<<<<<<< HEAD:invenz/inputBarang.js
let rowCount = 0;
=======
let rowCount    = 0;
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
let rowToDelete = null;

const modalOverlay   = document.getElementById("modalOverlay");
const confirmOverlay = document.getElementById("confirmOverlay");
const tableBody      = document.getElementById("tableBody");
const errorMsg       = document.getElementById("errorMsg");
const openModalBtn   = document.getElementById("openModalBtn");
const batalBtn       = document.getElementById("batalBtn");
const simpanBtn      = document.getElementById("simpanBtn");
const confirmYes     = document.getElementById("confirmYes");
const confirmNo      = document.getElementById("confirmNo");
const inputInvoice   = document.getElementById("inputInvoice");
const inputTanggal   = document.getElementById("inputTanggal");

<<<<<<< HEAD:invenz/inputBarang.js
const inputInvoice = document.getElementById("inputInvoice");
const inputTanggal = document.getElementById("inputTanggal");
const inputSupplier = document.getElementById("inputSupplier");
const totalBarang = document.getElementById("totalBarang");

// Set info user di sidebar
document.getElementById("sidebarUsername").textContent = loggedUser;
document.getElementById("sidebarAvatar").textContent = loggedUser
  .charAt(0)
  .toUpperCase();

=======
// ===== USER INFO =====
document.getElementById("sidebarUsername").textContent = loggedUser;
document.getElementById("sidebarAvatar").textContent   = loggedUser.charAt(0).toUpperCase();

>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
// ===== SIDEBAR =====
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");

document.getElementById("hamburger").addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("active");
});
<<<<<<< HEAD:invenz/inputBarang.js

=======
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
}

// ===== LOGOUT =====
<<<<<<< HEAD:invenz/inputBarang.js
function doLogout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("loggedUser");
  window.location.href = "login.html";
}
document.getElementById("logoutBtn").addEventListener("click", doLogout);

// ===== MODAL INPUT BARANG =====
=======
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("loggedUser");
  window.location.href = "login.html";
});

// ===== INIT CUSTOM DROPDOWN =====
// CustomDropdown didefinisikan di js/customDropdown.js
const ddSupplier = new CustomDropdown("cdSupplier", "supplier", { icon: "bx-store" });

// ===== MODAL =====
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
openModalBtn.addEventListener("click", () => {
  ddSupplier.refresh();
  modalOverlay.classList.add("active");
});

batalBtn.addEventListener("click", tutupModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) tutupModal();
});
<<<<<<< HEAD:invenz/inputBarang.js

simpanBtn.addEventListener("click", simpanData);

// ===== MODAL KONFIRMASI HAPUS =====
=======
simpanBtn.addEventListener("click", simpanData);

// ===== KONFIRMASI HAPUS =====
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
confirmYes.addEventListener("click", () => {
  if (rowToDelete) {
    const invoiceId = rowToDelete.dataset.invoiceId;
    rowToDelete.remove();
    updateNomor();
<<<<<<< HEAD:invenz/inputBarang.js

=======
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
    const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
    delete invoices[invoiceId];
    localStorage.setItem("invoices", JSON.stringify(invoices));
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

// ===== FUNGSI MODAL =====
function tutupModal() {
  modalOverlay.classList.remove("active");
  clearForm();
}

function clearForm() {
  inputInvoice.value   = "";
  inputTanggal.value   = "";
  ddSupplier.clear();
  errorMsg.textContent = "";
}

function simpanData() {
  const invoice  = inputInvoice.value.trim();
  const tanggal  = inputTanggal.value;
  const supplier = ddSupplier.getValue();

  if (!invoice || !tanggal || !supplier) {
    errorMsg.textContent = "Semua field harus diisi!";
    return;
  }

  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  if (invoices[invoice]) {
    errorMsg.textContent = "Invoice sudah ada!";
    return;
  }

<<<<<<< HEAD:invenz/inputBarang.js
=======
  // Auto-add supplier ke linkedData jika belum ada
  autoAddToLinkedData("supplier", supplier);

>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
  invoices[invoice] = { invoice, tanggal, supplier, total: 0, items: [] };
  localStorage.setItem("invoices", JSON.stringify(invoices));

  const emptyRow = tableBody.querySelector(".empty-row");
  if (emptyRow) emptyRow.remove();

  rowCount++;
  buatBaris({ invoice, tanggal, supplier, total: 0 });
  tutupModal();
}

<<<<<<< HEAD:invenz/inputBarang.js
// ===== BUAT BARIS TABEL =====
=======
// ===== BUAT BARIS =====
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
function buatBaris(data) {
  const tr = document.createElement("tr");
  tr.dataset.invoiceId = data.invoice;
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td><a class="invoice-link" href="invoice.html?id=${encodeURIComponent(data.invoice)}">${data.invoice}</a></td>
    <td>${data.tanggal}</td>
    <td>${data.supplier}</td>
    <td class="col-total">${data.total}</td>
    <td><button class="btn-hapus"><i class="bx bx-trash"></i> Hapus</button></td>
  `;
<<<<<<< HEAD:invenz/inputBarang.js

=======
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
  tr.querySelector(".btn-hapus").addEventListener("click", () => {
    rowToDelete = tr;
    confirmOverlay.classList.add("active");
  });
  tableBody.appendChild(tr);
}

<<<<<<< HEAD:invenz/inputBarang.js
// ===== UPDATE NOMOR URUT =====
=======
// ===== UPDATE NOMOR =====
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
function updateNomor() {
  const rows = tableBody.querySelectorAll("tr:not(.empty-row)");
  if (rows.length === 0) {
    const emptyTr = document.createElement("tr");
    emptyTr.className = "empty-row";
    emptyTr.innerHTML = '<td colspan="6">Belum ada data — klik "Input Barang" untuk menambah</td>';
    tableBody.appendChild(emptyTr);
    rowCount = 0;
  } else {
    rows.forEach((r, i) => { r.cells[0].textContent = i + 1; });
    rowCount = rows.length;
  }
}

<<<<<<< HEAD:invenz/inputBarang.js
// ===== INIT: render dari localStorage =====
=======
// ===== INIT =====
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
function init() {
  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  const list = Object.values(invoices);
  if (list.length === 0) return;
  const emptyRow = tableBody.querySelector(".empty-row");
  if (emptyRow) emptyRow.remove();
  list.forEach((data) => {
    rowCount++;
    buatBaris(data);
  });
}

<<<<<<< HEAD:invenz/inputBarang.js
// ===== SYNC total dari invoice.js =====
=======
// ===== SYNC TOTAL =====
>>>>>>> ed5c9b1874bf418228128e199a985eb8b302bb6b:inputBarang.js
window.addEventListener("focus", syncTotals);
function syncTotals() {
  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  tableBody.querySelectorAll("tr:not(.empty-row)").forEach((tr) => {
    const id = tr.dataset.invoiceId;
    if (invoices[id]) {
      tr.querySelector(".col-total").textContent = invoices[id].total;
    }
  });
}

init();