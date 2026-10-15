/* Логіка демо-кабінету: перегляди, операції, перекази, аналітика, налаштування. */

(function () {
  const t = window.t;
  const user = JSON.parse(sessionStorage.getItem("nova_user") || "null");
  if (user) {
    document.getElementById("user-phone").textContent = window.maskPhone(user.phone);
    document.getElementById("exit").href = "index.html";
  }

  const fmt = window.formatMoney;
  const views = document.querySelectorAll(".view");
  const navButtons = document.querySelectorAll("#view-nav button");

  function showView(name) {
    views.forEach((v) => (v.hidden = v.dataset.view !== name));
    navButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.view === name));
    if (name === "analytics") { drawChart(); animateSplits(); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  navButtons.forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
  document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.goto)));

  window.NOVA_COMMANDS = [
    { group: "Кабінет", label: "Огляд і баланс", hint: "розділ", run: () => showView("overview") },
    { group: "Кабінет", label: "Історія операцій", hint: "розділ", run: () => showView("operations") },
    { group: "Кабінет", label: "Переказати кошти", hint: "розділ", run: () => showView("transfer") },
    { group: "Кабінет", label: "Аналітика витрат", hint: "розділ", run: () => showView("analytics") },
    { group: "Кабінет", label: "Налаштування й ліміти", hint: "розділ", run: () => showView("settings") },
    { group: "Кабінет", label: "Сховати або показати суми", hint: "вигляд", run: () => document.getElementById("hide-amounts").click() },
  ];

  /* ---- Дати ---- */
  function renderToday() {
    const s = new Date().toLocaleDateString(window.LOCALE(), {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    document.getElementById("today").textContent = s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ---- Приховування сум ---- */
  const amounts = document.querySelectorAll("[data-amount]");
  let hidden = false;
  function renderAmounts() {
    document.getElementById("hide-amounts").textContent = hidden ? t("Показати суми") : t("Сховати суми");
    amounts.forEach((el) => { el.textContent = hidden ? "••••••" : fmt(+el.dataset.amount); });
  }
  document.getElementById("hide-amounts").addEventListener("click", () => {
    hidden = !hidden;
    renderAmounts();
  });

  /* ---- Дані ---- */
  const transactions = [
    { t: "Зарплата", d: "Сьогодні", time: "09:12", cat: "Надходження", sum: 145000, in: true, icon: "💼" },
    { t: "Сільпо", d: "Сьогодні", time: "08:34", cat: "Продукти", sum: 1284, icon: "🛒" },
    { t: "Uklon", d: "Вчора", time: "21:40", cat: "Транспорт", sum: 412, icon: "🚕" },
    { t: "Rozetka", d: "Вчора", time: "15:02", cat: "Маркетплейси", sum: 6390, icon: "📦" },
    { t: "Кешбек за вересень", d: "3 жовтня", cat: "Нарахування", sum: 3420, in: true, icon: "🎁" },
    { t: "McDonald's", d: "2 жовтня", time: "13:20", cat: "Кафе", sum: 745, icon: "🍔" },
    { t: "Комунальні платежі", d: "1 жовтня", cat: "Комунальні", sum: 1450, icon: "🧾" },
    { t: "Переказ від Дмитра Соколова", d: "30 вересня", cat: "НМКС", sum: 8000, in: true, icon: "💸" },
    { t: "АТБ", d: "29 вересня", cat: "Продукти", sum: 4218, icon: "🛒" },
    { t: "Кінотеатр «Жовтень»", d: "28 вересня", cat: "Розваги", sum: 1100, icon: "🎬" },
    { t: "Аптека 9-1-1", d: "27 вересня", cat: "Здоров'я", sum: 2260, icon: "💊" },
    { t: "Київстар", d: "25 вересня", cat: "Зв'язок", sum: 800, icon: "📶" },
  ];

  const rowHtml = (tx) => `
    <div class="tx__row">
      <div class="tx__ico">${tx.icon}</div>
      <div><div class="tx__title">${t(tx.t)}${tx.to ? " " + tx.to : ""}</div><div class="tx__meta">${t(tx.d)}${tx.time ? ", " + tx.time : ""} · ${t(tx.cat)}</div></div>
      <div class="tx__sum ${tx.in ? "tx__sum--in" : ""}">${tx.in ? "+" : "−"} ${fmt(tx.sum)}</div>
    </div>`;

  function renderTx() {
    document.getElementById("tx-recent").innerHTML = transactions.slice(0, 5).map(rowHtml).join("");
    const q = document.getElementById("tx-search").value.trim().toLowerCase();
    const f = document.getElementById("tx-filter").value;
    const rows = transactions.filter((tx) => {
      const haystack = (tx.t + " " + (tx.to || "") + " " + tx.d + " " + tx.cat).toLowerCase();
      const inLang = (t(tx.t) + " " + t(tx.d) + " " + t(tx.cat)).toLowerCase();
      const matchesText = !q || haystack.includes(q) || inLang.includes(q);
      const matchesType = f === "all" || (f === "in" && tx.in) || (f === "out" && !tx.in);
      return matchesText && matchesType;
    });
    document.getElementById("tx-full").innerHTML = rows.map(rowHtml).join("");
    document.getElementById("tx-empty").hidden = rows.length > 0;
  }
  document.getElementById("tx-search").addEventListener("input", renderTx);
  document.getElementById("tx-filter").addEventListener("change", renderTx);

  /* ---- Цілі ---- */
  const goals = [
    { name: "Фінансова подушка", have: 180000, need: 300000 },
    { name: "Подорож Карпатами", have: 96000, need: 150000 },
    { name: "Новий ноутбук", have: 41000, need: 120000 },
  ];
  function renderGoals() {
    document.getElementById("targets").innerHTML = goals.map((g) => {
      const p = Math.round((g.have / g.need) * 100);
      return `<div class="target">
        <div class="target__name">${t(g.name)}</div>
        <div class="split__top"><span>${fmt(g.have)}</span><span style="color:var(--violet-2)">${p}%</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div>
        <div class="target__sums">${t("Ціль")}: ${fmt(g.need)}</div>
      </div>`;
    }).join("");
  }

  /* ---- Часті отримувачі ---- */
  const payers = [
    { name: "Дмитро Соколов", phone: "+380 67 442 18 30" },
    { name: "Мама", phone: "+380 50 118 77 24" },
    { name: "Анатолій Кушнір", phone: "+380 93 550 92 11" },
  ];
  const initials = (name) => name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  function renderPayers() {
    document.getElementById("payers").innerHTML = payers
      .map(
        (p) => `<div class="tx__row">
          <div class="tx__ico" style="font-size:13px;font-weight:700;background:var(--grad);border:0;color:#fff">${initials(t(p.name))}</div>
          <div><div class="tx__title">${t(p.name)}</div><div class="tx__meta">${p.phone}</div></div>
          <button class="btn btn--ghost btn--sm" data-payee="${p.phone}">${t("Переказати")}</button>
        </div>`
      )
      .join("");
  }
  document.getElementById("payers").addEventListener("click", (e) => {
    const b = e.target.closest("[data-payee]");
    if (!b) return;
    document.getElementById("tr-phone").value = b.dataset.payee;
    openModal(t("Переказ"), t("Отримувача вибрано:") + ` <strong>${b.dataset.payee}</strong>. ` + t("Введіть суму у формі ліворуч — вона вже відкрита."));
    document.getElementById("modal-ok").style.display = "none";
  });

  /* ---- Швидкі дії та модалка ---- */
  const modal = document.getElementById("modal");
  function openModal(title, html) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = html;
    document.getElementById("modal-ok").style.display = "";
    modal.classList.add("is-open");
  }
  function closeModal() {
    modal.classList.remove("is-open");
  }
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target.hasAttribute("data-close")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  document.getElementById("modal-ok").addEventListener("click", () => {
    closeModal();
    window.showToast(t("Готово. Демодію виконано."));
  });

  document.querySelectorAll("[data-action]").forEach((b) =>
    b.addEventListener("click", () => openModal(t(b.dataset.action), t("У демоверсії ця дія імітується. Натисніть «Підтвердити», щоб продовжити.")))
  );
  document.querySelectorAll("[data-pay]").forEach((b) =>
    b.addEventListener("click", () =>
      openModal(t("Платіж") + ": " + t(b.dataset.pay), `<div class="field"><label>${t("Особовий рахунок")}</label><input class="input" placeholder="${t("10 цифр")}"></div><div class="field"><label>${t("Сума, ₴")}</label><input class="input" type="number" placeholder="5 000"></div>`)
    )
  );
  document.querySelectorAll('[data-open="transfer"]').forEach((b) =>
    b.addEventListener("click", () => showView("transfer"))
  );

  /* ---- Форма переказу ---- */
  const trForm = document.getElementById("transfer-form");
  const trPhone = document.getElementById("tr-phone");
  trPhone.addEventListener("input", () => { trPhone.value = window.maskPhone(trPhone.value); });
  trForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const phone = trPhone.value.trim();
    const sum = +document.getElementById("tr-sum").value;
    const account = document.getElementById("tr-account");
    const option = account.selectedOptions[0];
    const hint = document.getElementById("tr-hint");
    const balance = Number(option.dataset.balance);
    if (!window.isPhoneReady(phone)) { hint.textContent = t("Введіть номер отримувача повністю"); return; }
    if (!(sum >= 10)) { hint.textContent = t("Мінімальна сума переказу — 10 ₴"); return; }
    if (sum > balance) { hint.textContent = t("На обраному рахунку недостатньо коштів"); return; }
    hint.textContent = "";
    option.dataset.balance = String(balance - sum);
    option.text = t(option.dataset.label) + " (" + fmt(balance - sum) + ")";
    transactions.unshift({ t: "Переказ на", to: phone, d: "Сьогодні", cat: "НМКС", sum, icon: "💸" });
    renderTx();
    trForm.reset();
    openModal(t("Переказ виконано"), `<p style="margin:0">${t("Кошти надійшли на номер")} <strong>${phone}</strong>. ${t("Комісія — 0 ₴, зарахування миттєве.")}</p>`);
  });

  /* ---- Графік ---- */
  const months = [
    { m: "Тра", i: 152, o: 96 }, { m: "Чер", i: 149, o: 118 }, { m: "Лип", i: 160, o: 88 },
    { m: "Сер", i: 143, o: 101 }, { m: "Вер", i: 168, o: 94 }, { m: "Жов", i: 172, o: 79 },
  ];
  function drawChart() {
    const svg = document.getElementById("chart");
    if (!svg) return;
    const W = 620, H = 210, pad = { l: 8, r: 8, t: 12, b: 26 };
    const max = Math.max(...months.map((d) => d.i));
    const bw = (W - pad.l - pad.r) / months.length;
    let out = svg.querySelector("defs").outerHTML;
    months.forEach((d, i) => {
      const x = pad.l + i * bw;
      const hi = ((d.i / max) * (H - pad.t - pad.b)).toFixed(1);
      const ho = ((d.o / max) * (H - pad.t - pad.b)).toFixed(1);
      out += `<rect class="bar" x="${x + bw * 0.16}" y="${H - pad.b - hi}" width="${bw * 0.3}" height="${hi}" rx="4"><title>${t(d.m)}: ${t("дохід")} ${d.i} ${t("тис. ₴")}</title></rect>`;
      out += `<rect class="bar bar--out" x="${x + bw * 0.52}" y="${H - pad.b - ho}" width="${bw * 0.3}" height="${ho}" rx="4"><title>${t(d.m)}: ${t("витрати")} ${d.o} ${t("тис. ₴")}</title></rect>`;
      out += `<text class="tick" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${t(d.m)}</text>`;
    });
    out += `<line class="axis" x1="0" y1="${H - pad.b}" x2="${W}" y2="${H - pad.b}"/>`;
    svg.innerHTML = out;
  }

  /* ---- Структура витрат ---- */
  const splits = [
    { name: "Продукти та кафе", share: 32, sum: 30140 },
    { name: "Транспорт", share: 19, sum: 17890 },
    { name: "Маркетплейси", share: 17, sum: 16010 },
    { name: "Комунальні й зв'язок", share: 13, sum: 12240 },
    { name: "Здоров'я", share: 11, sum: 10360 },
    { name: "Розваги", share: 8, sum: 7540 },
  ];
  function renderSplits() {
    document.getElementById("splits").innerHTML = splits
      .map(
        (s) => `<div class="split__row">
          <div class="split__top"><span>${t(s.name)}</span><span>${fmt(s.sum)} · ${s.share}%</span></div>
          <div class="bar-track"><div class="bar-fill" data-w="${s.share}"></div></div>
        </div>`
      )
      .join("");
  }
  function animateSplits() {
    document.querySelectorAll("#splits .bar-fill").forEach((b, i) => {
      b.style.width = "0";
      setTimeout(() => (b.style.width = b.dataset.w + "%"), 60 + i * 90);
    });
  }

  /* ---- Налаштування ---- */
  const switches = [
    { name: "Вхід за Face ID", on: true },
    { name: "Push-сповіщення про кожну операцію", on: true },
    { name: "Блокувати онлайн-покупки понад 50 000 ₴", on: false },
    { name: "Заборона переказів новим отримувачам", on: false },
    { name: "Автонакопичення 1% від покупок", on: true },
  ];
  function renderSwitches() {
    document.getElementById("switches").innerHTML = switches
      .map(
        (s, i) => `<div class="switch-row" role="switch" tabindex="0" aria-checked="${s.on}" data-sw="${i}">
          <span>${t(s.name)}</span>
          <span class="sw${s.on ? " is-on" : ""}"></span>
        </div>`
      )
      .join("");
  }

  const switchWrap = document.getElementById("switches");
  function flipSwitch(row) {
    const sw = row.querySelector(".sw");
    const on = !sw.classList.contains("is-on");
    sw.classList.toggle("is-on", on);
    row.setAttribute("aria-checked", String(on));
    window.showToast(t(switches[+row.dataset.sw].name) + ": " + (on ? t("увімкнено") : t("вимкнено")));
  }
  switchWrap.addEventListener("click", (e) => {
    const row = e.target.closest(".switch-row");
    if (row) flipSwitch(row);
  });
  switchWrap.addEventListener("keydown", (e) => {
    if (e.key !== " " && e.key !== "Enter") return;
    const row = e.target.closest(".switch-row");
    if (row) { e.preventDefault(); flipSwitch(row); }
  });

  [["l-day", "l-day-out"], ["l-transfer", "l-transfer-out"], ["l-online", "l-online-out"]].forEach(([id, out]) => {
    const el = document.getElementById(id);
    el.addEventListener("input", () => (document.getElementById(out).textContent = fmt(+el.value)));
  });

  /* ---- Перше малювання та зміна мови ---- */
  function renderAll() {
    renderToday();
    renderAmounts();
    renderTx();
    renderGoals();
    renderPayers();
    renderSplits();
    renderSwitches();
    drawChart();
    document.querySelectorAll('[id^="l-"][type="range"]').forEach((el) => {
      document.getElementById(el.id + "-out").textContent = fmt(+el.value);
    });
  }
  renderAll();
  window.addEventListener("nova:lang", renderAll);
})();
