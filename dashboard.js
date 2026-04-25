document.addEventListener("DOMContentLoaded", () => {
  const totalBarangEl = document.getElementById("totalBarang");
  const jenisBarangEl = document.getElementById("jenisBarang");
  const chartCanvas = document.getElementById("pieChart");

  const invoices = JSON.parse(localStorage.getItem("invoices") || "{}");
  const allItems = [];

  // Gabungkan semua item dari setiap invoice
  Object.values(invoices).forEach((inv) => {
    if (inv.items && Array.isArray(inv.items)) {
      allItems.push(...inv.items);
    }
  });

  // Hitung total stok
  const totalBarang = allItems.reduce(
    (sum, item) => sum + (parseInt(item.stok) || 0),
    0
  );
  totalBarangEl.textContent = totalBarang;

  // Hitung jumlah jenis barang unik berdasarkan nama
  const uniqueNames = new Set(allItems.map((i) => i.nama.toLowerCase()));
  jenisBarangEl.textContent = uniqueNames.size;

  // Siapkan data untuk pie chart: kategori dan jumlah total per kategori
  const kategoriMap = {};
  allItems.forEach((item) => {
    const kategori = item.kategori || "Lainnya";
    const stok = parseInt(item.stok) || 0;
    kategoriMap[kategori] = (kategoriMap[kategori] || 0) + stok;
  });

  const labels = Object.keys(kategoriMap);
  const data = Object.values(kategoriMap);

  // Pie chart
  new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#16A085",
            "#2980B9",
            "#8E44AD",
            "#F39C12",
            "#E74C3C",
            "#27AE60",
          ],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { family: "Poppins" } },
        },
        title: {
          display: true,
          text: "Distribusi Barang per Kategori",
          font: { size: 14, weight: "bold" },
        },
      },
    },
  });
});

// Tampilkan nama user yang login
const loggedUser = localStorage.getItem('loggedUser');
const userIcon = document.querySelector('.bx-user-circle').closest('i') 
              || document.querySelector('.bx-user-circle');
if (userIcon && loggedUser) {
    userIcon.setAttribute('title', loggedUser);
}