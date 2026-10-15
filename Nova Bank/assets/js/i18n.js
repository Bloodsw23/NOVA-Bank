/* Двомовність: uk — мова-джерело, en — словник у assets/js/i18n-en.js.
   Текст бере з текстових вузлів і атрибутів, тому HTML не потребує data-ключів. */

(function () {
  const root = document.documentElement;
  const DICT = window.NOVA_EN || {};
  const ATTRS = ["placeholder", "aria-label", "title", "data-suffix", "content"];

  window.LOCALE = () => (root.dataset.lang === "en" ? "en-GB" : "uk-UA");

  window.t = (key) => {
    if (root.dataset.lang !== "en" || !key) return key;
    return DICT[String(key).trim()] || key;
  };

  window.formatNum = (n, decimals) => {
    const d = decimals || 0;
    return Number(n).toLocaleString(window.LOCALE(), { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  window.formatMoney = (n) => {
    const v = window.formatNum(Math.round(n));
    return root.dataset.lang === "en" ? "₴" + v : v + " ₴";
  };

  /*  Форми української (1 / 2-4 / решта) та англійської (1 / решта). */
  window.unit = (n, uk, en) => {
    if (root.dataset.lang === "en") return n + " " + (Math.abs(n) === 1 ? en[0] : en[1]);
    const m10 = n % 10, m100 = n % 100;
    const i = m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? 1 : 2;
    return n + " " + uk[i];
  };

  window.maskPhone = (raw) => {
    let d = String(raw).replace(/\D/g, "");
    if (d.startsWith("8")) d = d.slice(1);
    if (d.startsWith("380")) d = d.slice(3);
    else if (d.startsWith("0")) d = d.slice(1);
    else if (d.startsWith("7")) d = d.slice(1);
    d = d.slice(0, 9);
    const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
    return groups.length ? "+380 " + groups.join(" ") : "";
  };

  window.isPhoneReady = (value) => window.maskPhone(value).replace(/\D/g, "").length === 12;

  /* ---------- Збір і застосування перекладів ---------- */
  const textRecs = [];
  const attrRecs = [];
  const seenText = new WeakSet();
  const seenEl = new WeakSet();
  let titleSrc = "";
  let descSrc = "";

  function skip(node) {
    const el = node.parentElement;
    return !el || el.closest("[data-i18n-skip]") || el.closest("script,style,textarea");
  }

  function translate(src) {
    const body = src.trim();
    if (!body) return src;
    const hit = root.dataset.lang === "en" ? DICT[body] : null;
    if (!hit) return src;
    const at = src.indexOf(body);
    return src.slice(0, at) + hit + src.slice(at + body.length);
  }

  function scan() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (skip(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      if (seenText.has(node)) continue;
      seenText.add(node);
      textRecs.push({ node, src: node.nodeValue, out: node.nodeValue });
    }

    document.body.querySelectorAll("*").forEach((el) => {
      if (seenEl.has(el)) return;
      seenEl.add(el);
      if (el.closest("[data-i18n-skip]")) return;
      ATTRS.forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value && value.trim()) attrRecs.push({ el, attr, src: value, out: value });
      });
    });

    if (!titleSrc) titleSrc = document.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && !descSrc) descSrc = desc.getAttribute("content") || "";
  }

  function apply() {
    scan();

    for (let i = textRecs.length - 1; i >= 0; i--) {
      const rec = textRecs[i];
      if (!rec.node.isConnected) {
        textRecs.splice(i, 1);
        continue;
      }
      if (rec.node.nodeValue !== rec.out) rec.src = rec.node.nodeValue;
      rec.out = translate(rec.src);
      if (rec.node.nodeValue !== rec.out) rec.node.nodeValue = rec.out;
    }

    for (let i = attrRecs.length - 1; i >= 0; i--) {
      const rec = attrRecs[i];
      if (!rec.el.isConnected) {
        attrRecs.splice(i, 1);
        continue;
      }
      const now = rec.el.getAttribute(rec.attr);
      if (now !== rec.out) rec.src = now;
      rec.out = translate(rec.src);
      if (rec.out && now !== rec.out) rec.el.setAttribute(rec.attr, rec.out);
    }

    document.title = root.dataset.lang === "en" ? DICT[titleSrc.trim()] || titleSrc : titleSrc;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && descSrc) desc.setAttribute("content", window.t(descSrc));
    root.lang = root.dataset.lang === "en" ? "en" : "uk";
  }

  window.applyLang = apply;

  window.setLang = (code) => {
    if (code === root.dataset.lang) return;
    root.dataset.lang = code;
    localStorage.setItem("nova-lang", code);
    apply();
    window.dispatchEvent(new CustomEvent("nova:lang", { detail: code }));
    window.showToast(code === "en" ? "English interface switched on" : "Українську мову увімкнено");
  };

  if (!root.dataset.lang) root.dataset.lang = "uk";
  apply();
})();
