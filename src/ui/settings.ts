/**
 * Painel de configurações (Ctrl+,).
 *
 * Só o que muda a experiência de escrever: idioma, fonte, tamanho do texto e o
 * esmaecimento automático. O resto se configura onde é usado — opacidade pelo
 * teclado, conteúdo da barra no menu dela, atalhos no painel de atalhos. Um
 * painel que reúne tudo só porque é um painel vira lista que ninguém lê.
 *
 * O esmaecimento está aqui, e não só na barra, porque o controle dele é clicar
 * na opacidade — que agora pode estar escondida.
 */

import { FONTS, FONT_SIZE_MAX, FONT_SIZE_MIN, loadAllFonts, type FontId } from "../core/fonts";
import { LANGUAGES, t, type Lang } from "../core/i18n";
import type { Finish, WindowStyle } from "../core/store";
import { ACCENTS, effectiveTheme, type AccentId, type Theme } from "../core/theme";

export interface SettingsValues {
  lang: Lang;
  font: FontId;
  fontSize: number;
  idleFade: boolean;
  theme: Theme;
  finish: Finish;
  style: WindowStyle;
  accent: AccentId;
  /** Abre com o Windows, escondido na bandeja. Vem do proprio Windows. */
  autostart: boolean;
  update: UpdateSection;
}

/** O que a seção de atualização precisa saber para se desenhar. */
export interface UpdateSection {
  /** Versão em uso. */
  current: string;
  /** Versão encontrada, ou null enquanto não houver nenhuma. */
  available: { version: string; notes?: string } | null;
  /** Fração baixada (0 a 1) enquanto a instalação acontece. */
  progress: number | null;
  /** Procurando agora, a pedido da pessoa. */
  checking: boolean;
  /** Como terminou a última busca pedida, para a resposta ficar na tela. */
  lastCheck: "none" | "failed" | null;
}

export interface SettingsPanel {
  isOpen(): boolean;
  open(): void;
  close(): void;
  toggle(): void;
  /** Redesenha com valores novos (usado quando o idioma muda). */
  refresh(): void;
  /** Redesenha só a seção de atualização, sem tocar no resto do painel. */
  refreshUpdate(): void;
  /** Atualiza so os marcadores de selecao, sem redesenhar o painel. */
  sync(): void;
}

export interface SettingsHandlers {
  values: () => SettingsValues;
  onLang: (lang: Lang) => void;
  onFont: (font: FontId) => void;
  onFontSize: (size: number) => void;
  onIdleFade: (value: boolean) => void;
  onTheme: (theme: Theme) => void;
  onFinish: (finish: Finish) => void;
  onStyle: (style: WindowStyle) => void;
  onAccent: (accent: AccentId) => void;
  onAutostart: (value: boolean) => void;
  onUpdate: () => void;
  onCheckUpdate: () => void;
}

/**
 * Conteúdo da seção de atualização.
 *
 * Fica separado do resto porque é a única parte do painel que muda sozinha: o
 * download avança sem ninguém clicar, e redesenhar o painel inteiro a cada
 * porcentagem faria a janela piscar.
 */
function updateBox(update: UpdateSection): string {
  if (update.progress !== null) {
    return `<p class="gp-sheet__note">${t("update.installing", {
      n: Math.round(update.progress * 100),
    })}</p>`;
  }

  if (!update.available) {
    // O botão existe porque a busca automática é rara de propósito (a primeira
    // meia hora depois de abrir, e de seis em seis horas). Quem acabou de saber
    // que saiu uma versão não devia ter de esperar o relógio do app.
    const resposta =
      update.lastCheck === "failed"
        ? t("update.check.failed")
        : update.lastCheck === "none"
          ? t("update.check.none")
          : t("update.none");
    return `
      <p class="gp-sheet__note">${t("update.current", { v: update.current })}</p>
      <p class="gp-sheet__note gp-sheet__note--faint">${resposta}</p>
      <div class="gp-options">
        <button class="gp-option" data-check-update ${update.checking ? "disabled" : ""}>
          ${t(update.checking ? "update.check.doing" : "update.check")}
        </button>
      </div>`;
  }

  // O aviso do reinício vem ANTES do botão, e não depois de clicar: quem está
  // no meio de uma anotação precisa saber o que vai acontecer para escolher a
  // hora, e não ser informado quando já não dá para voltar atrás.
  return `
    <p class="gp-sheet__note">${t("update.available", { v: update.available.version })}</p>
    ${update.available.notes ? `<p class="gp-sheet__note gp-sheet__note--faint">${escape(update.available.notes)}</p>` : ""}
    <p class="gp-sheet__note gp-sheet__note--faint">${t("update.restart")}</p>
    <div class="gp-options">
      <button class="gp-option gp-option--accent" data-update>${t("update.action")}</button>
    </div>`;
}

/** As notas de versão vêm de fora do app; nunca entram como HTML. */
function escape(text: string): string {
  const node = document.createElement("div");
  node.textContent = text;
  return node.innerHTML;
}

/**
 * Trilhos de escolha: a opcao atual ganha uma pilula na cor de destaque, que
 * desliza ate a opcao clicada em vez de aparecer nela.
 *
 * A pilula e um elemento so por trilho, movido por `transform`: trocar o fundo
 * de cada botao piscaria, e deslizar diz "isto mudou para ali" sem precisar de
 * palavra nenhuma. So anima quando a pessoa escolhe — ao abrir o painel, ela ja
 * nasce no lugar.
 */
function posicionarTrilhos(host: HTMLElement, animar: boolean): void {
  for (const trilho of host.querySelectorAll<HTMLElement>(".gp-seg")) {
    let pilula = trilho.querySelector<HTMLElement>(".gp-seg__thumb");
    if (!pilula) {
      pilula = document.createElement("span");
      pilula.className = "gp-seg__thumb";
      pilula.setAttribute("aria-hidden", "true");
      trilho.prepend(pilula);
    }
    const atual = trilho.querySelector<HTMLElement>('.gp-option[data-on="true"]');
    pilula.dataset.animate = String(animar);
    pilula.hidden = !atual;
    if (!atual) continue;
    pilula.style.transform = `translateX(${atual.offsetLeft}px)`;
    pilula.style.width = `${atual.offsetWidth}px`;
  }
}

export function createSettingsPanel(host: HTMLElement, handlers: SettingsHandlers): SettingsPanel {
  const render = () => {
    const { lang, font, fontSize, idleFade, theme, finish, style, accent, autostart, update } =
      handlers.values();

    const idiomas = LANGUAGES.map(
      (item) => `
        <button class="gp-option" data-lang="${item.id}" data-on="${item.id === lang}">
          ${item.label}
        </button>`,
    ).join("");

    // Cada nome aparece na própria fonte: é a forma mais direta de escolher.
    // As aspas dos nomes de fonte ("DM Serif Text") fechavam o atributo no meio:
    // o estilo saia vazio e toda a lista aparecia na mesma fonte. Escapadas,
    // cada nome aparece na propria fonte.
    const fontes = FONTS.map(
      (item) => `
        <button
          class="gp-option gp-option--font"
          data-font="${item.id}"
          data-on="${item.id === font}"
          style="font-family: ${item.stack.replace(/"/g, "&quot;")}"
        >
          ${item.label || t("settings.font.system")}
        </button>`,
    ).join("");

    const temas = (["system", "light", "dark"] as Theme[])
      .map(
        (item) => `
        <button class="gp-option" data-theme-option="${item}" data-on="${item === theme}">
          ${t(`theme.${item}` as "theme.system")}
        </button>`,
      )
      .join("");

    const estilos = (["harp", "minimal", "aura"] as WindowStyle[])
      .map(
        (item) => `
        <button class="gp-option" data-style-option="${item}" data-on="${item === style}">
          ${t(`settings.style.${item}` as "settings.style.harp")}
        </button>`,
      )
      .join("");

    const acabamentos = (["smooth", "glass", "solid"] as Finish[])
      .map(
        (item) => `
        <button class="gp-option" data-finish-option="${item}" data-on="${item === finish}">
          ${t(`settings.finish.${item}` as "settings.finish.smooth")}
        </button>`,
      )
      .join("");

    // O botão é a própria cor: nomear seis tons daria uma lista para ler em vez
    // de uma escolha para ver. O nome fica na dica, para quem precisar dele.
    // A amostra mostra o tom que vai valer no tema atual, e não uma cor fixa:
    // escolher por uma amostra que não é a cor final seria enganoso.
    const tonalidade = effectiveTheme(theme);
    const cores = ACCENTS.map(
      (item) => `
        <button
          class="gp-swatch"
          data-accent="${item.id}"
          data-on="${item.id === accent}"
          style="background: rgb(${item[tonalidade]}); color: rgb(${item[tonalidade]})"
          title="${t(`accent.${item.id}` as "accent.mint")}"
          aria-label="${t(`accent.${item.id}` as "accent.mint")}"
        ></button>`,
    ).join("");

    host.innerHTML = `
      <div class="gp-sheet__card" role="dialog" aria-label="${t("settings.title")}">
        <header class="gp-sheet__header">
          <span>${t("settings.title")}</span>
          <span class="gp-sheet__hint"><button class="gp-sheet__close" data-close aria-label="${t("settings.close")}">✕</button>
          </span>
        </header>

        <section class="gp-sheet__section">
          <h2>${t("settings.language")}</h2>
          <div class="gp-options gp-seg">${idiomas}</div>
        </section>

        <section class="gp-sheet__section">
          <h2>${t("settings.theme")}</h2>
          <div class="gp-options gp-seg">${temas}</div>
        </section>

        <section class="gp-sheet__section">
          <h2>${t("settings.style")}</h2>
          <div class="gp-options gp-seg">${estilos}</div>
          <p class="gp-sheet__note gp-sheet__note--faint" data-hint="style"></p>
        </section>

        <section class="gp-sheet__section">
          <h2>${t("settings.finish")}</h2>
          <div class="gp-options gp-seg">${acabamentos}</div>
          <p class="gp-sheet__note gp-sheet__note--faint" data-hint="finish"></p>
        </section>

        <section class="gp-sheet__section">
          <h2>${t("settings.accent")}</h2>
          <div class="gp-options">${cores}</div>
        </section>

        <section class="gp-sheet__section">
          <h2>${t("settings.font")}</h2>
          <div class="gp-options gp-options--stack">${fontes}</div>
        </section>

        <section class="gp-sheet__section">
          <h2>${t("settings.fontSize")}</h2>
          <div class="gp-options">
            <button class="gp-option" data-size="-1" ${fontSize <= FONT_SIZE_MIN ? "disabled" : ""}>−</button>
            <span class="gp-options__value">${t("settings.fontSize.value", { n: fontSize })}</span>
            <button class="gp-option" data-size="1" ${fontSize >= FONT_SIZE_MAX ? "disabled" : ""}>+</button>
          </div>
        </section>

        <section class="gp-sheet__section">
          <h2>${t("settings.idleFade")}</h2>
          <div class="gp-options gp-seg">
            <button class="gp-option" data-idle="on" data-on="${idleFade}">${t("settings.on")}</button>
            <button class="gp-option" data-idle="off" data-on="${!idleFade}">${t("settings.off")}</button>
          </div>
        </section>

        <section class="gp-sheet__section">
          <h2>${t("settings.autostart")}</h2>
          <div class="gp-options gp-seg">
            <button class="gp-option" data-autostart="on" data-on="${autostart}">${t("settings.on")}</button>
            <button class="gp-option" data-autostart="off" data-on="${!autostart}">${t("settings.off")}</button>
          </div>
          <p class="gp-sheet__note gp-sheet__note--faint">${t("settings.autostart.hint")}</p>
        </section>

        <!-- Por ultimo: e a unica secao que nao muda a experiencia de escrever. -->
        <section class="gp-sheet__section">
          <h2>${t("settings.update")}</h2>
          <div data-update-box>${updateBox(update)}</div>
        </section>

      </div>`;
    syncState(false);
  };

  /**
   * Atualiza só os marcadores de seleção.
   *
   * Refazer o painel inteiro a cada clique reiniciava a animação de entrada, o
   * que aparecia como uma piscada a cada escolha.
   */
  const syncState = (animar = true) => {
    const { lang, font, fontSize, idleFade, theme, finish, style, accent, autostart } = handlers.values();

    // A chave vai explicita: a ordem dos atributos de um elemento nao e
    // garantida, entao ler "o primeiro" daria certo por acaso.
    const marcar = (chave: string, atual: string) => {
      for (const node of host.querySelectorAll<HTMLElement>(`[data-${chave}]`)) {
        node.dataset.on = String(node.getAttribute(`data-${chave}`) === atual);
      }
    };

    marcar("lang", lang);
    marcar("font", font);
    marcar("theme-option", theme);
    marcar("finish-option", finish);
    marcar("style-option", style);

    // A nota embaixo de estilo e acabamento descreve a opcao escolhida, e nao
    // todas: tres frases para ler a cada abertura viram ruido.
    const dica = (qual: string, chave: string) => {
      const node = host.querySelector<HTMLElement>(`[data-hint="${qual}"]`);
      if (node) node.textContent = t(chave as "settings.finish.hint.smooth");
    };
    dica("finish", `settings.finish.hint.${finish}`);
    dica("style", `settings.style.hint.${style}`);

    marcar("accent", accent);

    for (const node of host.querySelectorAll<HTMLElement>("[data-idle]")) {
      node.dataset.on = String((node.dataset.idle === "on") === idleFade);
    }
    for (const node of host.querySelectorAll<HTMLElement>("[data-autostart]")) {
      node.dataset.on = String((node.dataset.autostart === "on") === autostart);
    }

    // Por ultimo, depois de TODAS as marcas: posicionada antes de esmaecer e
    // iniciar com o Windows serem marcados, a pilula ia para a escolha anterior
    // e so chegava na certa no clique seguinte. Medir botao de painel escondido
    // da largura zero; quem abre o painel posiciona.
    if (!host.hidden) posicionarTrilhos(host, animar);

    const valor = host.querySelector<HTMLElement>(".gp-options__value");
    if (valor) valor.textContent = t("settings.fontSize.value", { n: fontSize });

    const menor = host.querySelector<HTMLButtonElement>('[data-size="-1"]');
    const maior = host.querySelector<HTMLButtonElement>('[data-size="1"]');
    if (menor) menor.disabled = fontSize <= FONT_SIZE_MIN;
    if (maior) maior.disabled = fontSize >= FONT_SIZE_MAX;
  };

  const panel: SettingsPanel = {
    isOpen: () => !host.hidden,
    open() {
      void loadAllFonts();
      render();
      host.hidden = false;
      posicionarTrilhos(host, false);
      // A animação de entrada vale para a abertura, não para cada clique.
      host.classList.add("gp-sheet--enter");
      host.addEventListener("animationend", () => host.classList.remove("gp-sheet--enter"), {
        once: true,
      });
    },
    close() {
      host.hidden = true;
    },
    toggle() {
      if (panel.isOpen()) panel.close();
      else panel.open();
    },
    refresh() {
      if (panel.isOpen()) render();
    },
    sync() {
      if (panel.isOpen()) syncState();
    },
    refreshUpdate() {
      const caixa = host.querySelector<HTMLElement>("[data-update-box]");
      if (caixa) caixa.innerHTML = updateBox(handlers.values().update);
    },
  };

  host.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    const lang = target.closest<HTMLElement>("[data-lang]")?.dataset.lang;
    if (lang) {
      handlers.onLang(lang as Lang);
      render();
      return;
    }

    const font = target.closest<HTMLElement>("[data-font]")?.dataset.font;
    if (font) {
      handlers.onFont(font as FontId);
      syncState();
      return;
    }

    const size = target.closest<HTMLElement>("[data-size]")?.dataset.size;
    if (size) {
      handlers.onFontSize(handlers.values().fontSize + Number(size));
      syncState();
      return;
    }

    const estilo = target.closest<HTMLElement>("[data-style-option]")?.dataset.styleOption;
    if (estilo) {
      handlers.onStyle(estilo as WindowStyle);
      syncState();
      return;
    }

    const acabamento = target.closest<HTMLElement>("[data-finish-option]")?.dataset.finishOption;
    if (acabamento) {
      handlers.onFinish(acabamento as Finish);
      syncState();
      return;
    }

    const tema = target.closest<HTMLElement>("[data-theme-option]")?.dataset.themeOption;
    if (tema) {
      handlers.onTheme(tema as Theme);
      syncState();
      return;
    }

    const cor = target.closest<HTMLElement>("[data-accent]")?.dataset.accent;
    if (cor) {
      handlers.onAccent(cor as AccentId);
      syncState();
      return;
    }

    if (target.closest("[data-check-update]")) {
      handlers.onCheckUpdate();
      return;
    }

    if (target.closest("[data-update]")) {
      handlers.onUpdate();
      return;
    }

    const inicio = target.closest<HTMLElement>("[data-autostart]")?.dataset.autostart;
    if (inicio) {
      handlers.onAutostart(inicio === "on");
      return;
    }

    const idle = target.closest<HTMLElement>("[data-idle]")?.dataset.idle;
    if (idle) {
      handlers.onIdleFade(idle === "on");
      syncState();
      return;
    }

    if (target === host || target.closest("[data-close]")) panel.close();
  });

  return panel;
}
