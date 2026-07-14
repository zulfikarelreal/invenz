// js/supabaseClient.js
// Inisialisasi koneksi Supabase untuk seluruh halaman INVENZ.
// File ini HARUS dimuat sebelum auth.js dan file js modul halaman lainnya.
//
// Urutan wajib di <head> / sebelum </body> setiap halaman:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="js/supabaseClient.js"></script>
//   <script src="js/auth.js"></script>
//   <script src="js/xxxxx.js"></script>  <-- modul halaman

const SUPABASE_URL = "https://kxfeysiaowaruektwnlm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmV5c2lhb3dhcnVla3R3bmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDg0MTEsImV4cCI6MjA5OTUyNDQxMX0.5zOXuCzPJ9GjHMJ2-uEV73FcFAMbJHa-2GgcglWlD3M";

// window.supabase disediakan oleh CDN <script> sebelum file ini.
// "sb" dipakai sebagai singkatan global di semua file js/*.js lainnya.
let sb;
if (window.supabase) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase CDN failed to load. Using mock client for safety.");
  sb = {
    from: function() {
      const chain = {
        select: function() { return this; },
        eq: function() { return this; },
        neq: function() { return this; },
        neqAll: function() { return this; },
        limit: function() { return this; },
        order: function() { return this; },
        single: async function() { return { data: null, error: new Error("Supabase SDK not loaded") }; },
        maybeSingle: async function() { return { data: null, error: new Error("Supabase SDK not loaded") }; },
        then: function(resolve) { resolve({ data: [], error: new Error("Supabase SDK not loaded") }); },
        insert: async function() { return { data: null, error: new Error("Supabase SDK not loaded") }; },
        update: async function() { return { data: null, error: new Error("Supabase SDK not loaded") }; },
        delete: function() { return this; }
      };
      return chain;
    }
  };
}
window.sb = sb;

// Helper kecil dipakai di banyak file untuk format angka jadi Rupiah.
function formatRp(num) {
  const n = Math.round(Number(num) || 0);
  return "Rp " + n.toLocaleString("id-ID");
}

// Helper: cek apakah tanggal (string "YYYY-MM-DD" atau ISO) ada di dalam range.
function isInRange(dateStr, range) {
  if (!range) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

// Helper: hitung { from, to } Date berdasarkan kode filter waktu yang dipakai
// di banyak halaman (filterWaktu, filterWaktuSO, filterPeriode, dll).
function getDateRange(code, customFrom, customTo) {
  const now = new Date();
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  switch (code) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "7d": {
      const f = new Date(now);
      f.setDate(f.getDate() - 6);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "thismonth":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfDay(now),
      };
    case "30d": {
      const f = new Date(now);
      f.setDate(f.getDate() - 29);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "lastmonth": {
      const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const t = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: f, to: endOfDay(t) };
    }
    case "3m": {
      const f = new Date(now);
      f.setMonth(f.getMonth() - 3);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "6m": {
      const f = new Date(now);
      f.setMonth(f.getMonth() - 6);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "ytd":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) };
    case "1y": {
      const f = new Date(now);
      f.setFullYear(f.getFullYear() - 1);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "lastyear":
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
      };
    case "custom":
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : null,
        to: customTo ? endOfDay(new Date(customTo)) : null,
      };
    case "all":
    default:
      return { from: null, to: null };
  }
}

// ================================================================
// SEARCHABLE DROPDOWN GENERIK (menggantikan customDropdown.js lama)
// Dipakai di banyak halaman untuk elemen .cd-wrapper.
// Panggil: setupSearchableDropdown(wrapperEl, arrayOfStrings, onSelectCallback)
// ================================================================
function setupSearchableDropdown(wrapperEl, items, onSelect) {
  if (!wrapperEl) return { setItems: () => {}, getValue: () => "" };

  const input = wrapperEl.querySelector(".cd-input");
  const dropdown = wrapperEl.querySelector(".cd-dropdown");
  const searchEl = wrapperEl.querySelector(".cd-search");
  const listEl = wrapperEl.querySelector(".cd-list");
  const emptyEl = wrapperEl.querySelector(".cd-empty");

  let currentItems = items || [];

  function renderList(filterText) {
    if (!listEl) return;
    const kw = (filterText || "").toLowerCase();
    const filtered = currentItems.filter((x) => x.toLowerCase().includes(kw));
    listEl.innerHTML = "";
    if (!currentItems.length) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";
    if (!filtered.length) {
      const li = document.createElement("li");
      li.className = "cd-no-result";
      li.textContent = "Tidak ditemukan";
      listEl.appendChild(li);
      return;
    }
    filtered.forEach((val) => {
      const li = document.createElement("li");
      li.textContent = val;
      if (input && input.value === val) li.classList.add("selected");
      li.addEventListener("click", () => {
        input.value = val;
        wrapperEl.classList.remove("open");
        if (typeof onSelect === "function") onSelect(val);
      });
      listEl.appendChild(li);
    });
  }

  if (input) {
    input.addEventListener("focus", () => {
      wrapperEl.classList.add("open");
      renderList(searchEl ? searchEl.value : "");
    });
    input.addEventListener("input", () => {
      if (typeof onSelect === "function") onSelect(input.value);
    });
  }
  if (searchEl) {
    searchEl.addEventListener("input", () => renderList(searchEl.value));
  }
  document.addEventListener("click", (e) => {
    if (!wrapperEl.contains(e.target)) wrapperEl.classList.remove("open");
  });

  renderList("");

  return {
    setItems(newItems) {
      currentItems = newItems || [];
      renderList(searchEl ? searchEl.value : "");
    },
    getValue() {
      return input ? input.value.trim() : "";
    },
    setValue(v) {
      if (input) input.value = v;
    },
  };
}
