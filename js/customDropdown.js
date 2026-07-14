/* ============================================================
   CUSTOM DROPDOWN — customDropdown.js
   Versi Supabase: tidak lagi membaca/menulis localStorage.

   Cara pakai:
     const dd = new CustomDropdown("cdSupplier", { icon: "bx-store" });
     dd.setOptions(["PT ABC", "PT XYZ"]);  // inject dari Supabase
     dd.getValue();   // ambil nilai yang diketik / dipilih
     dd.setValue("PT ABC"); // set nilai dari luar
     dd.clear();      // reset
   ============================================================ */

class CustomDropdown {
  /**
   * @param {string} wrapperId  - id dari .cd-wrapper element
   * @param {string|object} linkedTypeOrOpts - (legacy: string type) atau opts object
   * @param {object} [opts]
   * @param {string} [opts.icon] - boxicon class untuk tiap item
   */
  constructor(wrapperId, linkedTypeOrOpts, opts = {}) {
    this.wrapper = document.getElementById(wrapperId);

    // Backward-compatible: dulu dipanggil (wrapperId, linkedType, opts)
    // Sekarang linkedType diabaikan (data diinjek via setOptions)
    if (typeof linkedTypeOrOpts === "string") {
      this.icon = (opts && opts.icon) || "bx-circle";
    } else if (typeof linkedTypeOrOpts === "object" && linkedTypeOrOpts !== null) {
      this.icon = linkedTypeOrOpts.icon || "bx-circle";
    } else {
      this.icon = "bx-circle";
    }

    if (!this.wrapper) {
      console.warn(`CustomDropdown: wrapper #${wrapperId} tidak ditemukan`);
      return;
    }

    this.inputRow  = this.wrapper.querySelector(".cd-input-row");
    this.mainInput = this.wrapper.querySelector(".cd-input");
    this.arrow     = this.wrapper.querySelector(".cd-arrow");
    this.dropdown  = this.wrapper.querySelector(".cd-dropdown");
    this.searchEl  = this.wrapper.querySelector(".cd-search");
    this.list      = this.wrapper.querySelector(".cd-list");
    this.emptyEl   = this.wrapper.querySelector(".cd-empty");

    this._allOptions = [];
    this._open = false;

    this._bindEvents();
  }

  // ===== PUBLIC =====

  /** Inject array of strings sebagai opsi dropdown. */
  setOptions(arr) {
    this._allOptions = (arr || []).map((x) =>
      typeof x === "string" ? x : (x.nama || "")
    ).filter(Boolean);
    this._renderList(this._allOptions);
  }

  /** Alias lama agar kode lama yang memanggil .refresh() tidak error. */
  refresh() {
    // no-op: data harus diset via setOptions() dari luar
  }

  getValue() {
    return this.mainInput ? this.mainInput.value.trim() : "";
  }

  setValue(val) {
    if (this.mainInput) this.mainInput.value = val;
    this._highlightSelected(val);
  }

  clear() {
    if (this.mainInput) this.mainInput.value = "";
    if (this.searchEl)  this.searchEl.value  = "";
    this._renderList(this._allOptions);
    this.close();
  }

  open() {
    this.wrapper.classList.add("open");
    this._open = true;
    if (this.searchEl) {
      this.searchEl.value = "";
      this._renderList(this._allOptions);
      setTimeout(() => this.searchEl.focus(), 50);
    }
  }

  close() {
    this.wrapper.classList.remove("open");
    this._open = false;
    if (this.searchEl) this.searchEl.value = "";
  }

  // ===== PRIVATE =====

  _bindEvents() {
    this.inputRow.addEventListener("click", (e) => {
      if (e.target === this.mainInput) {
        if (!this._open) this.open();
        return;
      }
      this._open ? this.close() : this.open();
    });

    this.mainInput.addEventListener("input", () => {
      const q = this.mainInput.value.trim().toLowerCase();
      const filtered = this._allOptions.filter((o) =>
        o.toLowerCase().includes(q)
      );
      if (!this._open) this.open();
      this._renderList(filtered, q);
    });

    this.searchEl.addEventListener("input", () => {
      const q = this.searchEl.value.trim().toLowerCase();
      const filtered = this._allOptions.filter((o) =>
        o.toLowerCase().includes(q)
      );
      this._renderList(filtered, q);
    });

    document.addEventListener("click", (e) => {
      if (this._open && !this.wrapper.contains(e.target)) {
        this.close();
      }
    });

    this.mainInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
  }

  _renderList(options, highlight = "") {
    this.list.innerHTML = "";

    if (options.length === 0) {
      if (this._allOptions.length === 0) {
        this.emptyEl.style.display = "block";
      } else {
        this.emptyEl.style.display = "none";
        const noResult = document.createElement("li");
        noResult.className = "cd-no-result";
        noResult.textContent = "Tidak ditemukan. Ketik manual lalu simpan.";
        this.list.appendChild(noResult);
      }
      return;
    }

    this.emptyEl.style.display = "none";

    const currentVal = this.mainInput.value.trim().toLowerCase();
    options.forEach((opt) => {
      const li = document.createElement("li");

      if (highlight) {
        const idx = opt.toLowerCase().indexOf(highlight);
        if (idx >= 0) {
          const before = opt.slice(0, idx);
          const match  = opt.slice(idx, idx + highlight.length);
          const after  = opt.slice(idx + highlight.length);
          li.innerHTML = `<i class='bx ${this.icon}'></i>${before}<strong>${match}</strong>${after}`;
        } else {
          li.innerHTML = `<i class='bx ${this.icon}'></i>${opt}`;
        }
      } else {
        li.innerHTML = `<i class='bx ${this.icon}'></i>${opt}`;
      }

      if (opt.toLowerCase() === currentVal) {
        li.classList.add("selected");
      }

      li.addEventListener("click", () => {
        this.mainInput.value = opt;
        this._highlightSelected(opt);
        this.close();
        this.mainInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      this.list.appendChild(li);
    });
  }

  _highlightSelected(val) {
    this.list.querySelectorAll("li").forEach((li) => {
      li.classList.toggle(
        "selected",
        li.textContent.trim().toLowerCase() === val.toLowerCase()
      );
    });
  }
}
