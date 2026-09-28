/**
 * Telas de contexto.
 *
 * São as coisas que já estão acontecendo na tela quando alguém precisa
 * escrever: código, uma planilha, uma reunião. Desenhadas em HTML, e não
 * capturadas, para escalar com a caixa onde são colocadas: o tamanho base de
 * cada uma está em `cqw` (a largura do espaço que a recebe) e o resto em `em`.
 *
 * Os textos vêm de `i18n.js`: a mesma tela serve às duas páginas do site.
 * As fotografias em images/ e os vídeos em video/ são provisórios.
 *
 * São decorativas. Quem não as vê não perde informação: o texto ao redor diz o
 * que cada uma representa.
 */

import { icon } from "./icons.js";
import { L, ROOT } from "./i18n.js";

const h = (html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const img = (name, cls = "", pos = "50% 50%") =>
  `<img class="ctx-img ${cls}" src="${ROOT}images/${name}" alt="" loading="lazy" decoding="async" style="object-position:${pos}">`;

/** Imagem por caminho inteiro (as miniaturas dos vídeos servem de foto). */
const raw = (src, pos = "50% 50%") =>
  `<img class="ctx-img" src="${ROOT}${src}" alt="" loading="lazy" decoding="async" style="object-position:${pos}">`;

/**
 * Vídeo de contexto.
 *
 * Só começa a baixar quando a cena se aproxima da tela, e pausa quando ela
 * sai: um site sobre não disputar atenção não deixa três vídeos rodando fora
 * de vista. Com movimento reduzido, fica no quadro parado — o `poster` já
 * conta a mesma coisa.
 */
const video = (name, pos = "50% 50%") =>
  `<video class="ctx-img" data-src="${ROOT}video/${name}.mp4" poster="${ROOT}video/${name}.jpg" muted loop playsinline
    preload="metadata" tabindex="-1" aria-hidden="true" style="object-position:${pos}"></video>`;

const reduced = matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Tenta tocar, e não desiste no primeiro não.
 *
 * `play()` pode ser recusado por três motivos comuns: os dados ainda não
 * chegaram, a janela estava escondida, ou o navegador exige um gesto antes de
 * qualquer vídeo. Sem isto, o quadro do `poster` ficava parado para sempre e
 * parecia uma imagem — que é exatamente o contrário do que a cena diz.
 */
function keepPlaying(v) {
  if (reduced.matches || !v.isConnected) return;
  if (!v.src) v.src = v.dataset.src;
  const tryPlay = () => v.play().catch(() => {});
  tryPlay();
  v.addEventListener("canplay", tryPlay, { once: true });
  v.addEventListener("loadeddata", tryPlay, { once: true });
}

const visible = new Set();

const videoWatcher = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) {
        visible.add(v);
        keepPlaying(v);
      } else {
        visible.delete(v);
        v.pause?.();
      }
    }
  },
  { rootMargin: "600px 0px" }
);

/* A janela volta, a aba volta: o que está à vista volta a andar. */
const resumeVisible = () => {
  if (document.visibilityState !== "visible") return;
  for (const v of visible) keepPlaying(v);
};

document.addEventListener("visibilitychange", resumeVisible);
addEventListener("focus", resumeVisible);

/* Navegador que só libera vídeo depois de um gesto: o primeiro clique, toque
   ou rolagem serve de gesto. */
for (const ev of ["pointerdown", "keydown", "wheel", "touchstart"]) {
  addEventListener(ev, resumeVisible, { once: true, passive: true });
}

const winControls = `<span class="win-ctl" aria-hidden="true"><i></i><i></i><i></i></span>`;

/* Um pseudoaleatório fixo: as ondas de áudio e os gráficos saem sempre iguais. */
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/* --- Python com cores ------------------------------------------------------ */

const PY_KW = new Set(
  "from import as class def async await return for in if else elif and or not is None True False with yield lambda raise try except finally pass".split(" ")
);
const PY_BUILTIN = new Set("list tuple len abs zip float int str dict set sum max min sorted property field self".split(" "));

function highlightPython(src) {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@\w+)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/gm;
  let out = "";
  let last = 0;
  let nextIsName = "";
  for (const m of src.matchAll(re)) {
    out += esc(src.slice(last, m.index));
    last = m.index + m[0].length;
    const t = esc(m[0]);
    if (m[1]) out += `<span class="c">${t}</span>`;
    else if (m[2]) out += `<span class="s">${t}</span>`;
    else if (m[3]) out += `<span class="d">${t}</span>`;
    else if (m[4]) out += `<span class="n">${t}</span>`;
    else {
      const w = m[5];
      if (nextIsName) {
        out += `<span class="${nextIsName}">${t}</span>`;
        nextIsName = "";
      } else if (PY_KW.has(w)) {
        out += `<span class="k">${t}</span>`;
        if (w === "def") nextIsName = "f";
        if (w === "class") nextIsName = "t";
      } else if (PY_BUILTIN.has(w)) out += `<span class="b">${t}</span>`;
      else if (/^[A-Z]/.test(w)) out += `<span class="t">${t}</span>`;
      else if (src[last] === "(") out += `<span class="f">${t}</span>`;
      else out += t;
    }
  }
  return out + esc(src.slice(last));
}

/* --- Peças ----------------------------------------------------------------- */

function waveform(seed, n = 90) {
  const r = rng(seed);
  let d = "";
  for (let i = 0; i < n; i++) {
    const env = 0.35 + 0.65 * Math.abs(Math.sin(i / 7 + seed));
    const a = (0.15 + r() * 0.85) * env * 9;
    d += `M${i * 2 + 1} ${10 - a}V${10 + a}`;
  }
  return `<svg class="wave" viewBox="0 0 ${n * 2} 20" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}

function histogram() {
  const curve = (seed, shift) => {
    const r = rng(seed);
    let d = "M0 60";
    for (let x = 0; x <= 100; x += 2) {
      const base = Math.exp(-Math.pow((x - shift) / 22, 2)) * 44 + Math.exp(-Math.pow((x - 82) / 9, 2)) * 18;
      d += ` L${x} ${60 - base - r() * 4}`;
    }
    return d + " L100 60Z";
  };
  return `<svg class="histo" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="${curve(3, 38)}" fill="rgba(255,90,90,.45)"/>
    <path d="${curve(7, 46)}" fill="rgba(90,220,120,.4)"/>
    <path d="${curve(11, 54)}" fill="rgba(90,140,255,.45)"/>
  </svg>`;
}

/* --- Contextos ------------------------------------------------------------- */

const builders = {
  /* Um editor de código com projeto aberto. */
  code: () => {
    const t = L.code;
    const lines = t.source.split("\n");
    return h(`<div class="ctx ctx--code">
      <div class="ide-title"><span class="ide-menu">${t.menu}</span><span class="ide-search">${icon("magnifying-glass")}${t.search}</span>${winControls}</div>
      <div class="ide">
        <nav class="ide-act">${icon("document-duplicate", "on")}${icon("magnifying-glass")}${icon("squares-2x2")}${icon("play")}${icon("puzzle-piece")}<span></span>${icon("cog-6-tooth")}</nav>
        <aside class="ide-tree">
          <p>${t.explorer}</p>
          <b>${icon("chevron-down-20")}${t.project}</b>
          <span class="d1">${icon("chevron-down-20")}src</span>
          ${t.files.map((f, i) => `<span class="d2 f-py${i === 0 ? " on" : ""}">${f}</span>`).join("")}
          <span class="d1">${icon("chevron-right-20")}${t.tests}</span>
          <span class="d1 f-toml">pyproject.toml</span>
          <span class="d1 f-md">README.md</span>
        </aside>
        <div class="ide-main">
          <div class="ide-tabs">${t.tabs
            .map((n, i) => `<span${i === 0 ? ' class="on"' : ""}>${n}${i === 0 ? "<i></i>" : ""}</span>`)
            .join("")}</div>
          <div class="ide-crumbs">${t.crumbs}</div>
          <div class="ide-body">
            <ol class="ide-gutter">${lines.map((_, i) => `<li${i === 26 ? ' class="on"' : ""}>${i + 1}</li>`).join("")}</ol>
            <pre class="ide-code">${highlightPython(t.source)}</pre>
            <div class="ide-mini">${lines.map((l) => `<i style="--w:${Math.min(100, l.length * 1.25)}%;--x:${(l.length - l.trimStart().length) * 1.2}%"></i>`).join("")}</div>
          </div>
        </div>
      </div>
      <div class="ide-status"><span>⎇ ${t.branch}</span><span>⚠ 2</span><span class="sp"></span><span>${t.position}</span><span>UTF-8</span><span>Python 3.12</span></div>
    </div>`);
  },

  /* Uma fotografia sozinha. */
  photo: () => h(`<div class="ctx ctx--photo">${img("surf.jpg")}</div>`),

  /* Um programa 3D aberto (captura provisória). */
  "3d": () => h(`<div class="ctx ctx--shot">${img("blender.jpg", "", "50% 0%")}</div>`),

  /* Revelação de fotografia. */
  editor: () => {
    const t = L.editor;
    const strip = [
      ["surf.jpg", "50% 50%"],
      ["ipanema.jpg", "50% 45%"],
      ["rio.jpg", "50% 40%"],
      ["istambul.jpg", "50% 45%"],
      ["ponte.jpg", "50% 50%"],
      ["estrada.jpg", "60% 50%"],
      ["surf.jpg", "80% 40%"],
    ];
    return h(`<div class="ctx ctx--editor">
      <div class="e-top"><span class="e-mods">${t.modules
        .map((m, i) => (i === 0 ? `<b>${m}</b>` : `<span>${m}</span>`))
        .join("")}</span><span>${t.file}</span></div>
      <div class="e-main">
        <aside class="e-left">
          <p>${t.navigator}</p>
          <div class="e-nav">${img("surf.jpg")}<i></i></div>
          <p>${t.presets}</p>
          ${t.presetList.map((p, i) => `<span${i === 1 ? ' class="on"' : ""}>${p}</span>`).join("")}
        </aside>
        <div class="e-canvas"><div class="e-img">${img("surf.jpg")}<div class="e-thirds"></div><div class="e-crop"></div></div></div>
        <aside class="e-panel">
          <p>${t.histogram}</p>
          ${histogram()}
          <p class="e-meta">${t.meta}</p>
          <p>${t.basic}</p>
          ${t.sliders
            .map(([n, v, val]) => `<div class="e-slider"><span>${n}</span><b>${val}</b><em style="--v:${v}"></em></div>`)
            .join("")}
        </aside>
      </div>
      <div class="e-strip">${strip.map(([f, p], i) => `<span class="${i === 0 ? "on" : ""}">${img(f, "", p)}</span>`).join("")}</div>
    </div>`);
  },

  /* Uma planilha de fechamento, com fórmulas, abas e formatação. */
  sheet: () => {
    const t = L.sheet;
    const body = t.rows
      .map((r, i) => {
        const n = i + 4;
        const sel = i === 3;
        const pct = r[7];
        const bar = Math.min(100, Math.abs(pct) * 3.4);
        return `<tr class="${sel ? "is-flag" : ""}"><th>${n}</th>
          <td class="l">${r[0]}</td><td class="l dim">${r[1]}</td>
          <td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td>
          <td class="${r[6].startsWith("−") && r[6] !== "−0" ? "neg" : ""}${sel ? " is-sel" : ""}">${r[6]}</td>
          <td class="pct ${pct < 0 ? "neg" : ""}"><i style="--b:${bar}%"></i>${pct.toFixed(1).replace(".", t.decimal)}%</td>
          <td class="l"><span class="st st--${r[8]}">${t.status[r[8]]}</span></td></tr>`;
      })
      .join("");
    return h(`<div class="ctx ctx--sheet">
      <div class="s-title"><span>${t.file}</span><span class="s-saved">${t.saved}</span>${winControls}</div>
      <div class="s-ribbon-tabs">${t.ribbonTabs
        .map((n, i) => (i === 1 ? `<b>${n}</b>` : `<span>${n}</span>`))
        .join("")}</div>
      <div class="s-ribbon">
        ${icon("arrow-uturn-left")}${icon("arrow-uturn-right")}<i class="sep"></i>
        <span class="s-font">Inter</span><span class="s-size">10</span><b>${t.bold}</b><em>${t.italic}</em><u>${t.underline}</u><i class="sep"></i>
        ${icon("paint-brush")}${icon("funnel")}${icon("table-cells")}${icon("chart-bar")}<i class="sep"></i>
        ${t.formats.map((f) => `<span class="s-fmt">${f}</span>`).join("")}
      </div>
      <div class="s-formula"><b>G7</b><span class="fx">fx</span><span>=F7-E7</span></div>
      <div class="s-wrap">
      <table class="s-grid">
        <colgroup><col class="c0"><col class="c1"><col class="c2"><col><col><col><col><col class="c7"><col class="c8"><col class="c9"></colgroup>
        <thead><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th><th>I</th></tr></thead>
        <tbody>
          <tr class="s-head"><th>1</th><td class="l" colspan="9">${t.title}</td></tr>
          <tr class="s-cols"><th>2</th>${t.columns
            .map((c, i) => `<td class="${i < 2 || i === 8 ? "l" : ""}">${c}</td>`)
            .join("")}</tr>
          <tr><th>3</th><td colspan="9"></td></tr>
          ${body}
          <tr class="s-total"><th>14</th><td class="l">${t.total[0]}</td><td></td><td>${t.total[1]}</td><td>${t.total[2]}</td><td>${t.total[3]}</td><td>${t.total[4]}</td><td class="neg">${t.total[5]}</td><td class="pct neg"><i style="--b:34%"></i>${t.total[6]}</td><td></td></tr>
        </tbody>
      </table>
      </div>
      <div class="s-sheets">${t.sheets
        .map((n, i) => (i === 1 ? `<b>${n}</b>` : `<span>${n}</span>`))
        .join("")}<span>+</span><span class="sp"></span><span>${t.sum}</span><span>100%</span></div>
    </div>`);
  },

  /* Uma apresentação em tela cheia. */
  slides: () => {
    const t = L.slides;
    const r = rng(5);
    const pts = (base, drift, seed) =>
      Array.from({ length: 12 }, (_, i) => [i * (100 / 11), base - i * drift - Math.sin(i + seed) * 3 - r() * 2]);
    const a = pts(62, 1.6, 1);
    const b = pts(58, 3.2, 3);
    b[8][1] = 17;
    const path = (p) => p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    return h(`<div class="ctx ctx--slides">
      <div class="sl-page">
        <div class="sl-head"><p class="sl-kicker">${t.kicker}</p><p class="sl-n">07</p></div>
        <p class="sl-title">${t.title}</p>
        <div class="sl-body">
          <div class="sl-chart">
            <svg viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
              ${[10, 25, 40, 55].map((y) => `<line x1="0" x2="100" y1="${y}" y2="${y}" class="grid"/>`).join("")}
              <path d="${path(a)}" class="ln a"/>
              <path d="${path(b)}" class="ln b"/>
              <circle cx="${b[8][0]}" cy="17" r="1.8" class="dot" data-flag/>
            </svg>
            <div class="sl-legend"><span><i class="a"></i>${t.legend[0]}</span><span><i class="b"></i>${t.legend[1]}</span></div>
            <span class="sl-callout" style="left:${b[8][0]}%;top:${(17 / 70) * 100}%">${t.callout}</span>
          </div>
          <div class="sl-kpis">${t.kpis.map(([n, d]) => `<div><b>${n}</b><span>${d}</span></div>`).join("")}</div>
        </div>
        <p class="sl-foot"><span>${t.source}</span><span>7 / 18</span></p>
      </div>
    </div>`);
  },

  /* Um vídeo sendo assistido. */
  video: () =>
    h(`<div class="ctx ctx--video">
      ${video("montanha")}
      <div class="v-bar">
        <span class="v-track"><em style="--v:.28"></em><i style="--x:.12"></i><i style="--x:.44"></i><i style="--x:.71"></i></span>
        <div class="v-row">${icon("play")}${icon("speaker-wave")}<span class="v-time">01:42 / 06:10</span><span class="v-chap">${L.video.chapter}</span><span class="sp"></span>${icon("cog-6-tooth")}${icon("arrows-pointing-out")}</div>
      </div>
    </div>`),

  /* Um editor de vídeo, com trilhas. */
  timeline: () => {
    const t = L.timeline;
    const clips = [
      ["video/galeria.jpg", 0, 17, "50% 40%"],
      ["images/estrada.jpg", 17.4, 14, "40% 50%"],
      ["video/roda.jpg", 31.8, 21, "70% 30%"],
      ["images/ipanema.jpg", 53.2, 12, "50% 60%"],
      ["video/montanha.jpg", 65.6, 18, "80% 50%"],
      ["images/vlog.jpg", 84, 16, "30% 50%"],
    ];
    return h(`<div class="ctx ctx--timeline">
      <div class="t-top">
        <div class="t-bin">
          <p>${t.bin} <span>${t.items}</span></p>
          <div class="t-grid">${["video/galeria.jpg", "video/roda.jpg", "images/vlog.jpg", "video/montanha.jpg", "images/estrada.jpg", "images/rio.jpg"]
            .map((f, i) => `<span>${raw(f, `${30 + i * 8}% 50%`)}<b>C00${i + 12}.MP4</b></span>`)
            .join("")}</div>
        </div>
        <div class="t-viewer">${video("galeria", "50% 40%")}<span class="t-tc">00:01:42:08</span><div class="t-transport">${icon("arrow-uturn-left")}${icon("play")}${icon("arrow-uturn-right")}</div></div>
      </div>
      <div class="t-tools">${icon("scissors")}${icon("squares-2x2")}${icon("film")}${icon("musical-note")}<span class="sp"></span><span>${t.sequence}</span></div>
      <div class="t-tl">
        <div class="t-ruler">${["00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00"].map((x) => `<span>${x}</span>`).join("")}</div>
        <div class="t-track"><b class="lbl">V2</b><div class="lane"><i class="title" style="--x:4;--w:12">${t.titles[0]}</i><i class="title" style="--x:58;--w:10">${t.titles[1]}</i></div></div>
        <div class="t-track tall"><b class="lbl">V1</b><div class="lane">${clips
          .map(([f, x, w, p]) => `<i class="clip" style="--x:${x};--w:${w}">${raw(f, p)}</i>`)
          .join("")}</div></div>
        <div class="t-track"><b class="lbl">A1</b><div class="lane"><i class="audio" style="--x:0;--w:52">${waveform(2)}</i><i class="audio" style="--x:53.2;--w:46.8">${waveform(9)}</i></div></div>
        <div class="t-track"><b class="lbl">A2</b><div class="lane"><i class="audio music" style="--x:0;--w:100">${waveform(4, 140)}</i></div></div>
        <span class="t-head" style="--x:41"></span>
        <span class="t-mark" style="--x:28"></span><span class="t-mark" style="--x:66"></span>
      </div>
    </div>`);
  },

  /* Um documento sendo lido. */
  text: () => {
    const t = L.doc;
    return h(`<div class="ctx ctx--text">
      <div class="d-bar">${icon("arrow-uturn-left")}${icon("arrow-uturn-right")}<span>${t.style}</span><b>${L.sheet.bold}</b><em>${L.sheet.italic}</em><span class="sp"></span><span>${t.comments}</span></div>
      <div class="d-scroll">
        <div class="d-page">
          <p class="d-h">${t.title}</p>
          <p class="d-sub">${t.sub}</p>
          ${t.clauses.map(([n, body]) => `<p><b>${n}</b> ${body}</p>`).join("")}
        </div>
        <div class="d-note"><b>${t.note[0]}</b>${t.note[1]}</div>
      </div>
    </div>`);
  },

  /* Um painel de cobrança num navegador. */
  browser: () => {
    const t = L.browser;
    const navIcons = ["home", "chart-bar", "users", "credit-card", "cog-6-tooth"];
    return h(`<div class="ctx ctx--browser">
      <div class="b-chrome">
        ${t.tabs.map((n, i) => `<span class="b-tab${i === 0 ? " on" : ""}">${n}</span>`).join("")}
        ${winControls}
      </div>
      <div class="b-bar"><span class="b-nav">‹ › ${icon("arrow-path")}</span><span class="b-url">${icon("lock-closed")}${t.url}</span><span class="b-ext"></span></div>
      <div class="b-app">
        <nav class="b-side">
          <span class="b-logo"><i></i>${t.brand}</span>
          ${t.nav.map((n, i) => `<span${i === 3 ? ' class="on"' : ""}>${icon(navIcons[i])}${n}</span>`).join("")}
        </nav>
        <div class="b-main">
          <div class="b-head"><div><p class="b-h">${t.heading}</p><p class="b-sub">${t.sub}</p></div><span class="b-user">${icon("bell")}<i>MC</i></span></div>
          <div class="b-plans">
            ${t.plans
              .map(
                ([nome, preco, itens], i) =>
                  `<div class="b-plan${i === 1 ? " on" : ""}"><p>${nome}${i === 1 ? ` <em>${t.current}</em>` : ""}</p><b>${preco}</b>${itens
                    .map((x) => `<span>${x}</span>`)
                    .join("")}${i === 2 ? `<span class="b-btn" data-flag>${t.upgrade}</span>` : ""}</div>`
              )
              .join("")}
          </div>
          <div class="b-usage">
            <p>${t.usage}</p>
            ${t.usageRows
              .map(([n, v, val]) => `<div><span>${n}</span><em style="--v:${v}"></em><b>${val}</b></div>`)
              .join("")}
          </div>
          <table class="b-table">
            <tr>${t.tableHead.map((c) => `<th>${c}</th>`).join("")}</tr>
            ${t.invoices
              .map(
                ([d, desc, val]) =>
                  `<tr><td>${d}</td><td>${desc}</td><td>${val}</td><td><span class="ok">${t.paid}</span></td></tr>`
              )
              .join("")}
          </table>
        </div>
      </div>
    </div>`);
  },

  /* Uma chamada de vídeo. */
  meeting: () => {
    const t = L.meeting;
    const faces = ["pessoa-3.jpg", "pessoa-1.jpg", "pessoa-6.jpg", "pessoa-4.jpg", "pessoa-5.jpg", "pessoa-2.jpg"];
    return h(`<div class="ctx ctx--meeting">
      <div class="m-top"><span class="m-rec"><i></i>${t.recording}</span><b>${t.title}</b><span class="sp"></span><span>${icon("users")}7</span><span>32:14</span></div>
      <div class="m-grid">${t.people
        .map(
          (n, i) =>
            `<div class="m-tile ${i === 0 ? "is-speaking" : ""}">${img(faces[i], "", "50% 35%")}<span>${i === 0 ? icon("speaker-wave") : ""}${n}</span></div>`
        )
        .join("")}</div>
      <div class="m-bar">
        <span>${icon("microphone")}</span><span>${icon("video-camera")}</span><span>${icon("computer-desktop")}</span><span>${icon("hand-raised")}</span><span>${icon("face-smile")}</span><span>${icon("chat-bubble-left-right")}</span><span>${icon("ellipsis-horizontal")}</span><span class="m-leave">${icon("phone-x-mark")}</span>
      </div>
    </div>`);
  },

  /* O que a webcam vê. */
  camera: () =>
    h(`<div class="ctx ctx--camera">
      ${img("pessoa-3.jpg", "", "50% 30%")}
      <span class="cam-rec"><i></i>REC <b class="cam-time">00:12</b></span>
      <span class="cam-meta">${L.camera.meta}</span>
    </div>`),

  /* Uma resposta sendo avaliada, num assistente de texto qualquer. */
  answer: () => {
    const t = L.answer;
    return h(`<div class="ctx ctx--answer">
      <aside class="a-side">
        <span class="a-new">${icon("plus")}${t.newChat}</span>
        <p>${t.today}</p>${t.history[0].map((n, i) => `<span${i === 0 ? ' class="on"' : ""}>${n}</span>`).join("")}
        <p>${t.yesterday}</p>${t.history[1].map((n) => `<span>${n}</span>`).join("")}
      </aside>
      <div class="a-main">
        <div class="a-msg a-user">${t.ask}</div>
        <div class="a-msg a-bot">
          <p><b>${t.title}</b></p>
          <p>${t.lead}</p>
          <ul>${t.bullets.map(([b, rest]) => `<li><b>${b}</b> ${rest}</li>`).join("")}</ul>
          <p class="a-tools">${icon("document-duplicate")}${icon("arrow-path")}</p>
        </div>
        <div class="a-input"><span>${t.placeholder}</span>${icon("paper-airplane")}</div>
      </div>
    </div>`);
  },
};

export function buildContext(type) {
  const make = builders[type];
  if (!make) throw new Error(`Contexto desconhecido: ${type}`);
  const el = make();
  el.setAttribute("aria-hidden", "true");
  for (const v of el.querySelectorAll("video")) videoWatcher.observe(v);
  return el;
}

/** Preenche todo elemento com `data-ctx` com o contexto correspondente. */
export function fillContexts(root = document) {
  for (const slot of root.querySelectorAll("[data-ctx]")) {
    if (slot.firstElementChild) continue;
    slot.appendChild(buildContext(slot.dataset.ctx));
  }
}
