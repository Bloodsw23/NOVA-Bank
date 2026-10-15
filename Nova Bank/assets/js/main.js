/* Спільні взаємодії: тема, мова, шапка, меню, анімації, таби, FAQ, палітра команд, 3D-картки. */

(function () {
  const root = document.documentElement;
  const t = (key) => window.t(key);

  /* ---------- Тема ---------- */
  const themeBtn = document.querySelector(".theme-toggle");
  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeBtn) themeBtn.setAttribute("aria-label", t(theme === "dark" ? "Увімкнути світлу тему" : "Увімкнути темну тему"));
  }
  applyTheme(root.dataset.theme || "light");

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("nova-theme", next);
      window.dispatchEvent(new CustomEvent("nova:theme", { detail: next }));
      window.showToast(next === "dark" ? t("Темну тему увімкнено") : t("Світлу тему увімкнено"));
    });
  }

  /* ---------- Мова ---------- */
  const langSwitch = document.querySelector(".lang-switch");
  function paintLangButtons() {
    if (!langSwitch) return;
    langSwitch.querySelectorAll("[data-lang]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.lang === root.dataset.lang));
    });
  }
  if (langSwitch) {
    langSwitch.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lang]");
      if (btn) window.setLang(btn.dataset.lang);
    });
  }
  paintLangButtons();

  /* ---------- Шапка ---------- */
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
      }
    });
  }

  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav > a").forEach((a) => {
    if (a.getAttribute("href") === current) a.classList.add("is-active");
  });
  document.querySelectorAll(".mega a[data-tab]").forEach((a) =>
    a.addEventListener("click", () => sessionStorage.setItem("nova-tab", a.dataset.tab))
  );

  /* ---------- Заповнення доріжки повзунків ---------- */
  document.querySelectorAll('input[type="range"]').forEach((el) => {
    const paint = () => {
      const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
      el.style.background = `linear-gradient(90deg, var(--violet) 0%, var(--fuchsia) ${pct}%, var(--track) ${pct}%)`;
    };
    el.addEventListener("input", paint);
    paint();
  });

  /* ---------- Появлення при скролі ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Лічильники ---------- */
  const counters = [];
  document.querySelectorAll("[data-count]").forEach((el) => {
    const c = { el, target: parseFloat(el.dataset.count), value: 0, decimals: (el.dataset.count.split(".")[1] || "").length };
    counters.push(c);
    let started = false;
    const paint = () => {
      c.el.textContent = window.formatNum(c.value, c.decimals) + el.dataset.suffix;
    };
    c.paint = paint;
    const run = () => {
      const dur = 1400;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        c.value = c.target * (1 - Math.pow(1 - p, 3));
        paint();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !started) {
            started = true;
            run();
            io.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      io.observe(el);
    } else {
      started = true;
      run();
    }
  });

  /* ---------- Таби ---------- */
  document.querySelectorAll("[data-tabs]").forEach((wrap) => {
    const tabs = wrap.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((x) => {
          x.classList.toggle("is-active", x === tab);
          x.setAttribute("aria-selected", String(x === tab));
        });
        wrap.querySelectorAll(".panel").forEach((p) => {
          p.hidden = p.dataset.panel !== tab.dataset.tab;
        });
      });
    });
  });

  /* ---------- FAQ ---------- */
  document.querySelectorAll(".faq").forEach((faq) => {
    faq.querySelectorAll(".faq__item").forEach((item) => {
      const q = item.querySelector(".faq__q");
      const a = item.querySelector(".faq__a");
      q.addEventListener("click", () => {
        const open = item.classList.toggle("is-open");
        q.setAttribute("aria-expanded", String(open));
        a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
      });
    });
  });

  /* ---------- Номер картки ---------- */
  document.querySelectorAll("[data-hidden-number]").forEach((card) => {
    const toggle = card.querySelector(".reveal-toggle");
    if (!toggle) return;
    const numberEl = card.querySelector("[data-number]");
    const real = numberEl.dataset.number;
    const masked = "•••• •••• •••• ";
    let shown = false;
    numberEl.textContent = masked;
    const paintLabel = () => toggle.setAttribute("aria-label", t(shown ? "Приховати номер картки" : "Показати номер картки"));
    paintLabel();
    toggle.addEventListener("click", () => {
      shown = !shown;
      numberEl.textContent = shown ? real : masked;
      paintLabel();
    });
  });

  /* ---------- Підписка ---------- */
  const form = document.querySelector("[data-subscribe]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(input.value.trim())) {
        window.showToast(t("Перевірте коректність e-mail"));
        return;
      }
      input.value = "";
      window.showToast(t("Дякуємо! Напишемо вам про нові пропозиції."));
    });
  }

  /* ---------- 3D-нахил банківських карток ---------- */
  const canHover = window.matchMedia("(hover: hover)").matches;
  if (canHover) {
    document.querySelectorAll(".bankcard").forEach((card) => {
      if (!card.closest(".cardstage")) return;
      const glare = document.createElement("span");
      glare.className = "bankcard__glare";
      card.appendChild(glare);
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        card.classList.add("is-tilt");
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        card.style.transform = `rotateY(${(px - 0.5) * 22}deg) rotateX(${(0.5 - py) * 18}deg) translateZ(18px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.classList.remove("is-tilt");
        card.style.transform = "";
      });
    });

    /* Підсвітка плиток за курсором */
    document.querySelectorAll(".tile").forEach((tile) => {
      tile.addEventListener("mousemove", (e) => {
        const rect = tile.getBoundingClientRect();
        tile.style.setProperty("--mx", e.clientX - rect.left + "px");
        tile.style.setProperty("--my", e.clientY - rect.top + "px");
      });
    });
  }

  /* ---------- Тікер котирувань ---------- */
  const tickerTrack = document.querySelector(".ticker__track");
  const QUOTES = [
    { name: "USD", val: 41.8, step: 0.12 },
    { name: "EUR", val: 48.6, step: 0.15 },
    { name: "PLN", val: 11.24, step: 0.05 },
    { name: "Золото, 1 г", val: 4320, step: 26, fixed: 0 },
    { name: "Нафта Brent", val: 78.42, step: 0.9 },
    { name: "BTC", val: 1782400, step: 18000, fixed: 0 },
    { name: "Облікова ставка НБУ", val: 13, step: 0, fixed: 1, lock: true },
    { name: "Індекс UX", val: 624.4, step: 3.4, fixed: 1 },
  ];
  const dec = (q) => q.fixed ?? 2;
  const quoteNum = (q, v) => window.formatNum(v, dec(q)) + (q.lock || q.fixed ? "" : " ₴");
  const quoteChg = (q, delta) => {
    if (q.lock) return t("без змін");
    return (delta >= 0 ? "▲ " : "▼ ") + window.formatNum(Math.abs(delta), dec(q));
  };

  function buildTicker() {
    if (!tickerTrack) return;
    const html = QUOTES.map((q, i) => {
      const chg = q.lock ? 0 : (Math.random() - 0.45) * q.step;
      return `<span class="ticker__item" data-i="${i}">
        <span class="ticker__name">${t(q.name)}</span>
        <span class="ticker__val">${quoteNum(q, q.val)}</span>
        <span class="ticker__chg ${q.lock ? "ticker__chg--flat" : chg >= 0 ? "ticker__chg--up" : "ticker__chg--down"}">${quoteChg(q, chg)}</span>
      </span>`;
    }).join("");
    tickerTrack.innerHTML = html + html;
  }
  buildTicker();

  if (tickerTrack) {
    setInterval(() => {
      const i = Math.floor(Math.random() * QUOTES.length);
      const q = QUOTES[i];
      if (q.lock) return;
      const delta = (Math.random() - 0.5) * q.step;
      q.val = Math.max(0, q.val + delta);
      document.querySelectorAll(`.ticker__item[data-i="${i}"]`).forEach((node) => {
        node.querySelector(".ticker__val").textContent = quoteNum(q, q.val);
        const chgEl = node.querySelector(".ticker__chg");
        chgEl.className = "ticker__chg " + (delta >= 0 ? "ticker__chg--up" : "ticker__chg--down");
        chgEl.textContent = quoteChg(q, delta);
      });
    }, 2400);
  }

  /* ---------- Командна палітра (Ctrl+K) ---------- */
  const BASE_COMMANDS = [
    { group: "Сторінки", label: "Головна", hint: "index", to: "index.html" },
    { group: "Сторінки", label: "Продукти та тарифи", hint: "products", to: "products.html" },
    { group: "Сторінки", label: "Картки", hint: "products", to: "products.html", tab: "cards" },
    { group: "Сторінки", label: "Депозити", hint: "products", to: "products.html", tab: "deposit" },
    { group: "Сторінки", label: "Кредити", hint: "products", to: "products.html", tab: "credit" },
    { group: "Сторінки", label: "Інвестиції", hint: "products", to: "products.html", tab: "invest" },
    { group: "Сторінки", label: "Про банк і реквізити", hint: "about", to: "about.html" },
    { group: "Сторінки", label: "Допомога та FAQ", hint: "help", to: "help.html" },
    { group: "Дії", label: "Увійти в інтернет-банк", hint: "login", to: "login.html" },
    { group: "Дії", label: "Особистий кабінет", hint: "dashboard", to: "dashboard.html" },
    {
      group: "Дії",
      label: "Темна / світла тема",
      hint: "theme",
      run: () => document.querySelector(".theme-toggle")?.click(),
    },
    {
      group: "Дії",
      label: "Українська / English",
      hint: "lang",
      run: () => window.setLang(root.dataset.lang === "en" ? "uk" : "en"),
    },
  ];

  const allCommands = () => BASE_COMMANDS.concat(window.NOVA_COMMANDS || []);

  const palette = document.createElement("div");
  palette.className = "palette";
  palette.dataset.i18nSkip = "";
  document.body.appendChild(palette);

  function renderPaletteShell() {
    palette.innerHTML = `
      <div class="palette__box">
        <input class="palette__input" type="text" placeholder="${t("Куди перейти або що зробити…")}" aria-label="${t("Пошук команд")}">
        <ul class="palette__list"></ul>
        <div class="palette__foot"><span><kbd>↑</kbd> <kbd>↓</kbd> ${t("навігація")}</span><span><kbd>Enter</kbd> ${t("відкрити")}</span><span><kbd>Esc</kbd> ${t("закрити")}</span></div>
      </div>`;
  }
  renderPaletteShell();

  const pInput = () => palette.querySelector(".palette__input");
  const pList = () => palette.querySelector(".palette__list");
  let pItems = [];
  let pActive = 0;

  function renderPalette(query = "") {
    const q = query.trim().toLowerCase();
    pItems = allCommands().filter((c) => !q || t(c.label).toLowerCase().includes(q) || t(c.group).toLowerCase().includes(q));
    let html = "";
    let lastGroup = "";
    pItems.forEach((c, i) => {
      if (c.group !== lastGroup) {
        html += `<li class="palette__group">${t(c.group)}</li>`;
        lastGroup = c.group;
      }
      html += `<li class="palette__item${i === pActive ? " is-active" : ""}" data-i="${i}">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
        <span>${t(c.label)}</span><small>${c.hint}</small></li>`;
    });
    pList().innerHTML = html || `<li class="palette__group">${t("Нічого не знайдено")}</li>`;
    pActive = Math.min(pActive, Math.max(0, pItems.length - 1));
  }

  function openPalette() {
    palette.classList.add("is-open");
    pActive = 0;
    renderPalette();
    pInput().focus();
  }

  function closePalette() {
    palette.classList.remove("is-open");
  }

  function runPalette(c) {
    if (!c) return;
    closePalette();
    if (c.run) return c.run();
    if (c.to) {
      if (c.tab) sessionStorage.setItem("nova-tab", c.tab);
      location.href = c.to;
    }
  }

  document.querySelectorAll("[data-open-palette]").forEach((b) => b.addEventListener("click", openPalette));

  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.classList.contains("is-open") ? closePalette() : openPalette();
      return;
    }
    if (!palette.classList.contains("is-open")) return;
    if (e.key === "Escape") return closePalette();
    if (e.key === "ArrowDown") { e.preventDefault(); pActive = Math.min(pActive + 1, pItems.length - 1); renderPalette(pInput().value); }
    if (e.key === "ArrowUp") { e.preventDefault(); pActive = Math.max(pActive - 1, 0); renderPalette(pInput().value); }
    if (e.key === "Enter" && !typing) { e.preventDefault(); runPalette(pItems[pActive]); }
  });

  palette.addEventListener("input", (e) => {
    if (e.target.classList.contains("palette__input")) {
      pActive = 0;
      renderPalette(e.target.value);
    }
  });

  palette.addEventListener("click", (e) => {
    if (e.target === palette) return closePalette();
    const item = e.target.closest(".palette__item");
    if (item) runPalette(pItems[+item.dataset.i]);
  });

  /* ---------- Переклад усіх динамічних блоків ---------- */
  window.addEventListener("nova:lang", () => {
    applyTheme(root.dataset.theme);
    paintLangButtons();
    buildTicker();
    renderPaletteShell();
    counters.forEach((c) => c.paint());
    document.querySelectorAll("[data-open-palette]").forEach((b) => {
      b.setAttribute("aria-label", t(b.dataset.paletteLabel));
    });
  });

  document.querySelectorAll("[data-open-palette]").forEach((b) => {
    b.dataset.paletteLabel = b.getAttribute("aria-label") || "Пошук за командами";
  });

  /* ---------- Відновлення вкладки продуктів ---------- */
  const tab = sessionStorage.getItem("nova-tab");
  if (tab) {
    sessionStorage.removeItem("nova-tab");
    const btn = document.querySelector(`.tab[data-tab="${tab}"]`);
    if (btn) btn.click();
  }
})();

window.showToast = function (text) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add("is-show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("is-show"), 2600);
};
