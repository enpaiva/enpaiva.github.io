/* Think Paraguayo · blog de Enrique Paiva
   Un solo script para todas las páginas: arma el panel lateral y la barra superior,
   maneja el tema, la portada (búsqueda, temas, lista/tablero, "Ver más") y las pestañas de los posts.
   Cada página declara en <body>: data-root (ruta hasta la raíz del sitio) y data-page ("home" o "post"). */

/* ---------- datos del perfil: editar aquí ---------- */
const SITE = {
  name: "Enrique Paiva",
  org: "Think Paraguayo",
  orgFlag: "🇵🇾",
  bio: "Profesor de inteligencia artificial desde hace 8 años. Publico mis experimentos con modelos de lenguaje, con demos interactivas.",
  initials: "EP",
  photo: "assets/1664666241569.jpg",                     /* ej. "assets/foto.jpg" (cuadrada, 400 × 400 px o más) */
  socials: {                     /* dejar "" para ocultar un botón */
    github: "https://github.com/EnPaiva93",
    linkedin: "",
    x: "",
    email: ""                    /* solo la dirección, sin "mailto:" */
  }
};

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ROOT = document.body.dataset.root || "";
  const PAGE = document.body.dataset.page || "home";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nf = (x, d) => x.toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (x) => nf(x * 100, 1) + "%";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- kit para los paneles interactivos de los posts (.demo, .rows, .ctl) ---------- */
  function makeRows(host, labels) {
    return labels.map((t) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = '<span class="tk"></span><span class="track"><span class="fill"></span><span class="mark" hidden></span></span><span class="val"></span>';
      row.querySelector(".tk").textContent = t;
      host.appendChild(row);
      return { row, fill: row.querySelector(".fill"), mark: row.querySelector(".mark"), val: row.querySelector(".val") };
    });
  }
  function bindRange(input, out, d, fn) {
    const upd = () => { out.textContent = nf(+input.value, d); fn(+input.value); };
    input.addEventListener("input", upd);
    upd();
    return upd;
  }
  function copyButton(btn, pre) {
    btn.addEventListener("click", () => {
      const done = (msg) => { btn.textContent = msg; setTimeout(() => { btn.textContent = "Copiar"; }, 1600); };
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done("Seleccionado"); };
      try { navigator.clipboard.writeText(pre.textContent).then(() => done("Copiado"), fallback); } catch (e) { fallback(); }
    });
  }
  window.KIT = { makeRows, bindRange, copyButton, nf, pct, reduce };

  /* ---------- miniaturas generativas: un motivo por tema, coloreado con el tema ---------- */
  function rng(seed) { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; }
  function art(kind, seed) {
    const r = rng(seed * 7919 + 13), W = 320, H = 200;
    let g = '<rect class="th-bg" width="' + W + '" height="' + H + '"/>';
    for (let y = 40; y < H; y += 40) g += '<path class="th-g" d="M0 ' + y + "H" + W + '"/>';
    if (kind === "bars") {
      const p = [0.36, 0.26, 0.2, 0.09, 0.06, 0.03, 0.01, 0.005], bw = 26, gap = 10, x0 = (W - (bw + gap) * 8 + gap) / 2;
      p.forEach((v, i) => { const hh = 20 + v * 380; g += '<rect class="' + (i ? "th-b" : "th-a") + '" x="' + (x0 + i * (bw + gap)) + '" y="' + (170 - hh) + '" width="' + bw + '" height="' + hh + '" rx="4"/>'; });
    } else if (kind === "curve") {
      let d = "", d2 = "";
      for (let i = 0; i <= 40; i++) { const x = 20 + i * 7, y = 40 + 120 * Math.exp(-i / 9) + r() * 8, y2 = 52 + 112 * Math.exp(-i / 13) + r() * 6; d += (i ? "L" : "M") + x + " " + (200 - y); d2 += (i ? "L" : "M") + x + " " + (200 - y2); }
      g += '<path class="th-s" d="' + d2 + '"/><path class="th-l" d="' + d + '"/>';
    } else if (kind === "dots") {
      const C = [[95, 70], [210, 120], [130, 150]];
      for (let i = 0; i < 90; i++) { const c = C[i % 3], a = r() * 6.28, rr = r() * 34; g += '<circle class="' + (i % 3 === 0 ? "th-a" : "th-b") + '" cx="' + (c[0] + Math.cos(a) * rr * 1.4) + '" cy="' + (c[1] + Math.sin(a) * rr) + '" r="' + (3 + r() * 3) + '"/>'; }
    } else if (kind === "stack") {
      for (let i = 0; i < 4; i++) { const x = 70 + i * 22, y = 34 + i * 18; g += '<rect class="' + (i === 3 ? "th-a" : "th-b") + '" x="' + x + '" y="' + y + '" width="120" height="96" rx="8"/>'; }
      g += '<path class="th-l" d="M270 60 V150"/><path class="th-l" d="M255 135 L270 150 L285 135"/>';
    } else if (kind === "grid") {
      for (let y = 0; y < 6; y++) for (let x = 0; x < 11; x++) { const w = 18 + Math.floor(r() * 3) * 8; if (x * 26 + w > 290) continue; g += '<rect class="' + (r() < 0.18 ? "th-a" : "th-b") + '" x="' + (22 + x * 26) + '" y="' + (26 + y * 26) + '" width="' + Math.min(w, 22) + '" height="18" rx="4"/>'; }
    } else if (kind === "nodes") {
      const N = [[60, 100], [140, 50], [140, 150], [220, 100], [280, 60], [280, 140]], E2 = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]];
      E2.forEach(([a, b]) => { g += '<path class="th-s" d="M' + N[a][0] + " " + N[a][1] + "L" + N[b][0] + " " + N[b][1] + '"/>'; });
      N.forEach((n, i) => { g += '<circle class="' + (i === 3 ? "th-a" : "th-b") + '" cx="' + n[0] + '" cy="' + n[1] + '" r="' + (i === 3 ? 18 : 12) + '"/>'; });
    } else {
      g += '<rect class="th-dash" x="90" y="38" width="140" height="124" rx="10"/>';
      [[112, 66, 70], [112, 90, 96], [112, 114, 84]].forEach(([x, y, w]) => { g += '<rect class="th-b" x="' + x + '" y="' + y + '" width="' + w + '" height="10" rx="5"/>'; });
      g += '<circle class="th-a" cx="230" cy="38" r="9"/>';
    }
    return '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + g + "</svg>";
  }
  window.blogArt = art;

  /* ---------- panel lateral ---------- */
  const ICON = {
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>'
  };
  const LABEL = { github: "GitHub", linkedin: "LinkedIn", x: "X", email: "Correo" };
  function renderSide() {
    const side = $("side");
    if (!side) return;
    const photo = SITE.photo ? '<img src="' + esc(ROOT + SITE.photo) + '" alt="' + esc(SITE.name) + '">' : "<span>" + esc(SITE.initials) + "</span>";
    const socials = Object.keys(ICON).filter((k) => SITE.socials[k]).map((k) => {
      const href = k === "email" ? "mailto:" + SITE.socials[k] : SITE.socials[k];
      return '<a class="soc" href="' + esc(href) + '" aria-label="' + LABEL[k] + '" title="' + LABEL[k] + '"' + (k === "email" ? "" : ' target="_blank" rel="noopener noreferrer"') + ">" + ICON[k] + "</a>";
    }).join("");
    side.innerHTML =
      '<div class="side-in">' +
        '<a class="photo" href="' + ROOT + 'index.html" aria-label="Inicio">' + photo + "</a>" +
        '<div class="who"><p class="fullname">' + esc(SITE.name) + "</p>" +
          '<p class="org">' + esc(SITE.org) + (SITE.orgFlag ? ' <span role="img" aria-label="Paraguay">' + SITE.orgFlag + "</span>" : "") + "</p>" +
          '<p class="bio">' + esc(SITE.bio) + "</p></div>" +
        (socials ? '<nav class="socials" aria-label="Redes sociales">' + socials + "</nav>" : "") +
        '<nav class="side-nav" aria-label="Secciones">' +
          '<a href="' + ROOT + 'index.html" id="all-posts" class="on">Todos los posts <span id="side-count"></span></a>' +
          '<div class="side-tags" id="side-tags" hidden><span class="lbl">Temas</span><div id="tag-list"></div></div>' +
        "</nav>" +
        '<p class="side-foot">© ' + new Date().getFullYear() + " " + esc(SITE.name) + "</p>" +
      "</div>";
  }

  /* ---------- barra superior ---------- */
  function renderToolbar() {
    const tb = $("toolbar");
    if (!tb) return;
    const left = PAGE === "home"
      ? '<div class="views" role="group" aria-label="Vista">' +
          '<button type="button" class="ib" id="v-list" aria-label="Vista de lista" title="Lista"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3.5" width="5" height="4" rx="1.2"/><rect x="2" y="12.5" width="5" height="4" rx="1.2"/><path d="M9.5 5.5h8.5M9.5 14.5h8.5"/></svg></button>' +
          '<button type="button" class="ib" id="v-grid" aria-label="Vista de tablero" title="Tablero"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5"/><rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5"/><rect x="11" y="11" width="6.5" height="6.5" rx="1.5"/></svg></button>' +
        "</div>"
      : '<a class="tb-back" href="' + ROOT + 'index.html">← Posts</a>';
    tb.innerHTML =
      '<div class="tb-left">' + left + "</div>" +
      '<form class="search" id="search" role="search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg>' +
        '<input type="search" id="q" name="q" placeholder="Buscar posts" autocomplete="off" aria-label="Buscar posts"></form>' +
      '<button type="button" class="ib theme" id="theme" aria-label="Cambiar tema"><svg viewBox="0 0 20 20" aria-hidden="true" id="theme-ico"></svg></button>';
    /* en un post, buscar lleva a la portada con la búsqueda hecha */
    $("search").addEventListener("submit", (e) => {
      e.preventDefault();
      if (PAGE !== "home") location.href = ROOT + "index.html?q=" + encodeURIComponent($("q").value.trim());
    });
  }

  /* ---------- tema claro u oscuro (el valor inicial lo pone el script del <head>) ---------- */
  function setupTheme() {
    const root = document.documentElement, mq = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : mq.matches;
    function icon() {
      const dark = isDark();
      $("theme-ico").innerHTML = dark
        ? '<circle cx="10" cy="10" r="3.6"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"/>'
        : '<path d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9z"/>';
      $("theme").setAttribute("aria-label", dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
      $("theme").title = dark ? "Tema claro" : "Tema oscuro";
    }
    $("theme").addEventListener("click", () => { root.dataset.theme = isDark() ? "light" : "dark"; store.set("tema", root.dataset.theme); icon(); });
    if (mq.addEventListener) mq.addEventListener("change", icon);
    icon();
  }

  /* ---------- temas del panel lateral, a partir de las etiquetas ---------- */
  function renderTags(posts, active, onPick) {
    $("side-count").textContent = String(posts.length);
    const counts = {};
    posts.forEach((p) => (p.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    const names = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, "es"));
    $("side-tags").hidden = names.length === 0;
    $("tag-list").innerHTML = names.map((t) => onPick
      ? '<button type="button" data-tag="' + esc(t) + '" aria-pressed="' + (t === active) + '">' + esc(t) + "<span>" + counts[t] + "</span></button>"
      : '<a href="' + ROOT + "index.html?tema=" + encodeURIComponent(t) + '">' + esc(t) + "<span>" + counts[t] + "</span></a>").join("");
    $("all-posts").classList.toggle("on", PAGE === "home" && !active);
  }
  const loadPosts = () => fetch(ROOT + "posts.json", { cache: "no-cache" }).then((r) => r.json()).catch(() => []);

  /* ---------- portada ---------- */
  function setupHome() {
    const host = $("posts"), q = $("q"), more = $("more");
    const PAGE_SIZE = { list: 10, grid: 9 }, ALL_UNDER = 12;
    const params = new URLSearchParams(location.search);
    let POSTS = [], view = "list", tag = params.get("tema") || "", shown = 0;
    q.value = params.get("q") || "";
    $("blank-art").innerHTML = art("blank", 1);

    function matches(p) {
      const term = q.value.trim().toLowerCase();
      if (tag && !(p.tags || []).includes(tag)) return false;
      return !term || (p.title + " " + p.sum + " " + (p.tags || []).join(" ")).toLowerCase().includes(term);
    }
    function render() {
      const list = POSTS.filter(matches), searching = q.value.trim() !== "";
      if (!shown) shown = PAGE_SIZE[view];
      const limit = searching || list.length <= ALL_UNDER ? list.length : shown;
      host.innerHTML = list.slice(0, limit).map((p) =>
        '<a class="card" href="' + ROOT + "posts/" + encodeURIComponent(p.id) + '/">' +
          '<span class="thumb">' + art(p.art, POSTS.length - POSTS.indexOf(p)) + "</span>" +
          '<span class="txt"><h3>' + esc(p.title) + '</h3><p class="sum">' + esc(p.sum) + "</p>" +
          '<span class="info"><span>' + esc(p.date) + "</span><span>" + esc(p.read || "") + "</span><span>" + esc((p.tags || []).join(" · ")) + "</span></span></span></a>"
      ).join("");
      more.hidden = limit >= list.length;
      $("blank").hidden = POSTS.length > 0;
      $("empty").hidden = POSTS.length === 0 || list.length > 0;
      $("empty-q").textContent = tag && !searching ? "tema: " + tag : q.value.trim();
      $("count").textContent = list.length + (list.length === 1 ? " post" : " posts");
    }
    function setTag(t) { tag = t; shown = 0; renderTags(POSTS, tag, true); render(); }
    function setView(v) {
      view = v; shown = 0;
      host.classList.toggle("list", v === "list"); host.classList.toggle("grid", v === "grid");
      $("v-list").setAttribute("aria-pressed", String(v === "list")); $("v-grid").setAttribute("aria-pressed", String(v === "grid"));
      store.set("vista", v);
      render();
    }
    more.addEventListener("click", () => { shown += PAGE_SIZE[view]; render(); });
    q.addEventListener("input", render);
    $("v-list").addEventListener("click", () => setView("list"));
    $("v-grid").addEventListener("click", () => setView("grid"));
    $("tag-list").addEventListener("click", (e) => { const b = e.target.closest("button[data-tag]"); if (b) setTag(b.dataset.tag === tag ? "" : b.dataset.tag); });
    $("all-posts").addEventListener("click", (e) => { e.preventDefault(); q.value = ""; setTag(""); });
    setView(store.get("vista") === "grid" ? "grid" : "list");
    loadPosts().then((list) => { POSTS = Array.isArray(list) ? list : []; renderTags(POSTS, tag, true); render(); });
  }

  /* ---------- post: pestañas por #nombre y barra de progreso ---------- */
  function setupPost() {
    loadPosts().then((list) => renderTags(Array.isArray(list) ? list : [], "", false));
    const art = document.querySelector("article"), panels = art ? Array.from(art.querySelectorAll(".tab-panel")) : [];
    const tabsBar = art && art.querySelector(".tabs"), bar = $("progress");
    const tbH = () => $("toolbar").offsetHeight;
    const setTbH = () => document.documentElement.style.setProperty("--tb-h", tbH() + "px");
    let first = true;
    function showTab() {
      if (!panels.length) return;
      const want = location.hash.slice(1), tab = panels.some((p) => p.dataset.tab === want) ? want : panels[0].dataset.tab;
      panels.forEach((p) => { p.hidden = p.dataset.tab !== tab; });
      art.querySelectorAll(".tabs a").forEach((a) => { if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      /* al cambiar de pestaña, subir solo hasta la barra si quedó arriba */
      const top = tabsBar ? tabsBar.getBoundingClientRect().top + scrollY - tbH() : 0;
      if (!first && scrollY > top) window.scrollTo(0, top);
      if (first && want) window.scrollTo(0, 0);
      first = false;
      onScroll();
    }
    function onScroll() {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? Math.min(1, scrollY / max) * 100 : 0) + "%";
    }
    bar.hidden = false;
    addEventListener("hashchange", showTab);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", setTbH);
    setTbH();
    showTab();
  }

  renderSide();
  renderToolbar();
  setupTheme();
  if (PAGE === "home") setupHome(); else setupPost();
})();
