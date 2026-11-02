/* =========================================================
   SWEET CRUMBS BAKERY – script.js
   Works across index.html, about.html, product.html,
   contacts.html, and enquiry.html
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- 1. ACTIVE NAV LINK (auto-detect current page) ---------- */
  const currentFile = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("header nav a").forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentFile) {
      link.setAttribute("aria-current", "page");
      link.classList.add("active");
    }
  });

  /* ---------- 2. DARK MODE TOGGLE (all pages, persisted) ---------- */
  const header = document.querySelector("header");

  const themeBtn = document.createElement("button");
  themeBtn.id = "themeToggle";
  themeBtn.type = "button";
  themeBtn.setAttribute("aria-label", "Toggle dark mode");
  themeBtn.textContent = "🌙";
  header.appendChild(themeBtn);

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️";
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeBtn.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  /* ---------- 3. SCROLL-TO-TOP BUTTON (all pages) ---------- */
  const topBtn = document.createElement("button");
  topBtn.id = "scrollTop";
  topBtn.type = "button";
  topBtn.setAttribute("aria-label", "Scroll to top");
  topBtn.textContent = "↑";
  topBtn.hidden = true;
  document.body.appendChild(topBtn);

  window.addEventListener("scroll", () => {
    topBtn.hidden = window.scrollY < 300;
  });
  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* =====================================================
     4. PRODUCT PAGE – LIVE SEARCH + PRICE FILTER
     ===================================================== */
  const productGrid = document.querySelector(".product-grid");
  if (productGrid) {
    // --- Build search/filter UI ---
    const controls = document.createElement("div");
    controls.className = "product-controls";
    controls.innerHTML = `
      <input type="search" id="productSearch"
             placeholder="Search products…" aria-label="Search products">
      <select id="priceFilter" aria-label="Filter by price">
        <option value="all">All prices</option>
        <option value="low">Under R100</option>
        <option value="mid">R100 – R300</option>
        <option value="high">Over R300</option>
      </select>
    `;
    productGrid.parentElement.insertBefore(controls, productGrid);

    const searchInput = document.getElementById("productSearch");
    const priceFilter = document.getElementById("priceFilter");
    const cards = Array.from(productGrid.querySelectorAll(".product-card"));

    // Extract numeric price from each card (uses first number found)
    cards.forEach(card => {
      const priceText = card.querySelector(".price")?.textContent || "";
      const match = priceText.match(/\d+/);
      card.dataset.price = match ? Number(match[0]) : 0;
      card.dataset.name = card.querySelector("h3")?.textContent.toLowerCase() || "";
      card.dataset.text = card.textContent.toLowerCase();
    });

    const noResults = document.createElement("p");
    noResults.id = "noResults";
    noResults.textContent = "No products match your search.";
    noResults.hidden = true;
    productGrid.parentElement.appendChild(noResults);

    function filterProducts() {
      const q = searchInput.value.trim().toLowerCase();
      const range = priceFilter.value;
      let visible = 0;

      cards.forEach(card => {
        const price = Number(card.dataset.price);
        const matchesText =
          q === "" ||
          card.dataset.name.includes(q) ||
          card.dataset.text.includes(q);

        let matchesPrice = true;
        if (range === "low")  matchesPrice = price < 100;
        if (range === "mid")  matchesPrice = price >= 100 && price <= 300;
        if (range === "high") matchesPrice = price > 300;

        const show = matchesText && matchesPrice;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });

      noResults.hidden = visible !== 0;
    }

    searchInput.addEventListener("input", filterProducts);
    priceFilter.addEventListener("change", filterProducts);

    // --- Click-to-expand product details ---
    cards.forEach(card => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "order-btn";
      btn.textContent = "Order this →";
      btn.addEventListener("click", () => {
        const name = card.querySelector("h3").textContent;
        sessionStorage.setItem("selectedProduct", name);
        window.location.href = "enquiry.html";
      });
      card.appendChild(btn);
    });
  }

  /* =====================================================
     5. ENQUIRY PAGE – FORM VALIDATION
     ===================================================== */
  const enquiryForm = document.querySelector(".enquiry-form");
  if (enquiryForm) {
    // Prefill cake details with the product user clicked (from product.html)
    const picked = sessionStorage.getItem("selectedProduct");
    const detailsField = document.getElementById("cake-details");
    if (picked && detailsField && !detailsField.value) {
      detailsField.value = `I'm interested in: ${picked}\n\nDetails: `;
      sessionStorage.removeItem("selectedProduct");
    }

    // Inject error spans after each input/select/textarea
    const fields = ["name", "email", "phone", "event-type", "event-date", "cake-details"];
    fields.forEach(id => {
      const field = document.getElementById(id);
      if (!field) return;
      const err = document.createElement("span");
      err.className = "error";
      err.id = id + "Error";
      field.insertAdjacentElement("afterend", err);
    });

    // Inline success message
    const successMsg = document.createElement("p");
    successMsg.className = "success";
    successMsg.hidden = true;
    successMsg.textContent = "✅ Thank you! We'll contact you within 24 hours.";
    enquiryForm.appendChild(successMsg);

    // Validation rules
    const rules = {
      name: v =>
        v.trim().length >= 2 ? "" : "Please enter your full name (min 2 characters).",
      email: v =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address.",
      phone: v =>
        /^(\+27|0)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}$/.test(v.replace(/\s/g, ""))
          ? ""
          : "Enter a valid SA phone number (e.g. 071 234 5678).",
      "cake-details": v =>
        v.trim().length >= 10 ? "" : "Please describe your cake (min 10 characters)."
    };

    function validate(id) {
      const field = document.getElementById(id);
      const err = document.getElementById(id + "Error");
      if (!field || !err || !rules[id]) return true;
      const msg = rules[id](field.value);
      err.textContent = msg;
      field.classList.toggle("invalid", !!msg);
      return !msg;
    }

    // Live validation
    Object.keys(rules).forEach(id => {
      const field = document.getElementById(id);
      if (!field) return;
      field.addEventListener("blur", () => validate(id));
      field.addEventListener("input", () => {
        if (field.classList.contains("invalid")) validate(id);
      });
    });

    // Submit
    enquiryForm.addEventListener("submit", e => {
      e.preventDefault();

      // Required-field check for select and date (extra)
      const eventType = document.getElementById("event-type");
      const eventDate = document.getElementById("event-date");

      const allValid = Object.keys(rules).map(validate).every(Boolean);

      if (!allValid) {
        // Focus first invalid field
        const firstErr = enquiryForm.querySelector(".invalid");
        firstErr?.focus();
        return;
      }

      // Demo submission — replace with fetch() to Formspree / Netlify Forms
      const data = Object.fromEntries(new FormData(enquiryForm));
      console.log("Enquiry submitted:", data);

      successMsg.hidden = false;
      enquiryForm.reset();
      setTimeout(() => (successMsg.hidden = true), 6000);
    });
  }

  /* =====================================================
     6. CONTACT PAGE – COPY-TO-CLIPBOARD + OPENING HOURS STATUS
     ===================================================== */
  const contactInfo = document.querySelector(".contact-info");
  if (contactInfo) {
    // Add "copy" button to phone / WhatsApp / email links
    contactInfo.querySelectorAll('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me"]').forEach(link => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "📋 Copy";
      btn.setAttribute("aria-label", "Copy to clipboard");
      btn.addEventListener("click", async () => {
        const raw =
          link.href.startsWith("tel:")   ? link.textContent :
          link.href.startsWith("mailto:") ? link.textContent :
          link.textContent; // wa.me → use visible number
        try {
          await navigator.clipboard.writeText(raw.trim());
          btn.textContent = "✅ Copied";
          setTimeout(() => (btn.textContent = "📋 Copy"), 1500);
        } catch {
          btn.textContent = "❌ Failed";
          setTimeout(() => (btn.textContent = "📋 Copy"), 1500);
        }
      });
      link.insertAdjacentElement("afterend", btn);
    });

    // Show OPEN / CLOSED status
    const hoursMap = { 0: [null], 1: [7, 18], 2: [7, 18], 3: [7, 18], 4: [7, 18], 5: [7, 18], 6: [7, 16] };
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours() + now.getMinutes() / 60;
    const [open, close] = hoursMap[day] || [null];
    const isOpen = open !== null && hour >= open && hour < close;

    const status = document.createElement("p");
    status.className = "open-status " + (isOpen ? "open" : "closed");
    status.textContent = isOpen
      ? "🟢 We're OPEN now — come say hi!"
      : "🔴 We're CLOSED — please order via the Enquiry form.";
    contactInfo.querySelector("h3").insertAdjacentElement("afterend", status);
  }

  /* =====================================================
     7. ABOUT PAGE – AUTO YEAR + RANDOM BAKERY FACT
     ===================================================== */
  const aboutMain = document.querySelector(".about-container");
  if (aboutMain) {
    const facts = [
      "🍞 Our sourdough starter is older than the bakery itself!",
      "🎂 We've baked over 500 custom celebration cakes since 2020.",
      "🥐 Our croissants are hand-rolled every morning at 4 AM.",
      "🍰 Red Velvet is our #1 best-selling cake flavour.",
      "🌾 We source wheat from Limpopo farmers whenever possible."
    ];
    const factBox = document.createElement("p");
    factBox.className = "bakery-fact";
    factBox.innerHTML =
      `<strong>Did you know?</strong> ${facts[Math.floor(Math.random() * facts.length)]}`;
    aboutMain.appendChild(factBox);
  }

  /* ---------- 8. AUTO UPDATE FOOTER YEAR (all pages) ---------- */
  const footerP = document.querySelector("footer p");
  if (footerP) {
    footerP.innerHTML = footerP.innerHTML.replace(/©\s*\d{4}/, `© ${new Date().getFullYear()}`);
  }

});