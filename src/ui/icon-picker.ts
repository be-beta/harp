/**
 * Seletor de icone de uma aba.
 *
 * Um popover preso a aba, e nao um modal: escolher um icone e um gesto de meio
 * segundo, e um modal transformaria isso numa tarefa. Tres grupos, do mais
 * provavel para o mais completo — sugeridos pelo texto, os que a pessoa mais
 * usa, e os 30.
 */

import { t } from "../core/i18n";
import { ICON_IDS, type IconId } from "./icon-catalog";
import { suggestIcons } from "./icon-suggest";
import { iconSvg } from "./tab-icons";

export interface IconPickerHandlers {
  /** Texto da aba, para as sugestoes. So e pedido quando o seletor abre. */
  textFor: (slot: number) => Promise<string>;
  current: (slot: number) => IconId | undefined;
  /** Os mais usados, do mais para o menos. */
  recents: () => IconId[];
  /** `null` remove o icone. */
  onPick: (slot: number, icon: IconId | null) => void;
  /** Chamado ao fechar, para o foco voltar ao texto. */
  onClose: () => void;
}

export interface IconPicker {
  open(anchor: HTMLElement, slot: number): Promise<void>;
  close(): void;
  isOpen(): boolean;
  /** Aberto para esta aba: clicar de novo no icone dela fecha. */
  isOpenFor(slot: number): boolean;
}

export function iconLabel(id: IconId): string {
  return t(`icon.${id}` as "icon.image");
}

export function createIconPicker(host: HTMLElement, handlers: IconPickerHandlers): IconPicker {
  let slot = 0;
  let legendaPadrao = "";
  let ancora: HTMLElement | null = null;

  /**
   * O nome do icone sob o mouse, sempre a vista no rodape.
   *
   * A dica nativa (`title`) saiu: numa grade, ela demora a aparecer e nao volta
   * enquanto o mouse anda, entao uns icones pareciam ter nome e outros nao. O
   * rodape responde na hora, e tambem ao navegar pelo teclado. O `aria-label`
   * fica, para quem usa leitor de tela.
   */
  const legendar = (event: Event) => {
    const legenda = host.querySelector<HTMLElement>("[data-caption]");
    if (!legenda) return;
    const id = (event.target as HTMLElement).closest<HTMLElement>("[data-pick]")?.dataset.pick;
    legenda.textContent = id ? iconLabel(id as IconId) : legendaPadrao;
  };
  host.addEventListener("mouseover", legendar);
  host.addEventListener("focusin", legendar);
  host.addEventListener("mouseleave", () => {
    const legenda = host.querySelector<HTMLElement>("[data-caption]");
    if (legenda) legenda.textContent = legendaPadrao;
  });

  const botao = (id: IconId, atual: IconId | undefined) =>
    `<button class="gp-picker__icon" data-pick="${id}" data-on="${id === atual}"
       aria-label="${iconLabel(id)}">${iconSvg(id)}</button>`;

  const grupo = (titulo: string, ids: IconId[], atual: IconId | undefined) =>
    ids.length === 0
      ? ""
      : `<div class="gp-picker__group">
           <span class="gp-picker__title">${titulo}</span>
           <div class="gp-picker__row">${ids.map((id) => botao(id, atual)).join("")}</div>
         </div>`;

  const CELULA = 32; // lado do botao de icone
  const VAO = 3; // espaco entre botoes
  const MOLDURA = 16; // o padding do popover, somados os dois lados
  const FOLGA = 8; // respiro ate a borda da janela

  const colunar = (colunas: number) => {
    host.style.setProperty("--gp-picker-cols", String(colunas));
    host.style.width = `${colunas * (CELULA + VAO) - VAO + MOLDURA}px`;
  };

  /**
   * A grade segue o formato da janela.
   *
   * Cinco colunas fixas davam seis linhas de icones, que nao cabiam numa janela
   * baixa — e a lista simplesmente saia pela borda. Agora, quando falta altura,
   * a grade se espalha para os lados ate onde a largura deixar; numa janela alta
   * e estreita ela volta a ser vertical. O que ainda nao couber rola.
   */
  const ajustar = (espaco: number) => {
    const maximo = Math.max(
      4,
      Math.min(10, Math.floor((window.innerWidth - FOLGA * 2 - MOLDURA + VAO) / (CELULA + VAO))),
    );
    for (let colunas = 5; colunas <= maximo; colunas += 1) {
      colunar(colunas);
      if (host.scrollHeight <= espaco) return;
    }
    // Nem na largura toda coube: fica no maximo possivel e rola.
    colunar(maximo);
  };

  const posicionar = (anchor: HTMLElement) => {
    const alvo = anchor.getBoundingClientRect();
    const abaixo = window.innerHeight - alvo.bottom - FOLGA * 2;
    const acima = alvo.top - FOLGA * 2;

    ajustar(Math.max(abaixo, acima));

    // Abaixo da aba por padrao; acima quando la embaixo nao cabe e em cima sobra
    // mais espaco. O resto rola dentro do proprio popover.
    const paraCima = host.scrollHeight > abaixo && acima > abaixo;
    const espaco = Math.max(120, paraCima ? acima : abaixo);
    host.style.maxHeight = `${espaco}px`;

    const altura = Math.min(host.scrollHeight, espaco);
    const caixa = host.getBoundingClientRect();
    // Sem sair da janela: numa janela estreita, a ultima aba fica perto da borda.
    const x = Math.min(Math.max(FOLGA, alvo.left - 6), window.innerWidth - caixa.width - FOLGA);
    host.style.left = `${Math.max(FOLGA, x)}px`;
    host.style.top = `${paraCima ? alvo.top - 6 - altura : alvo.bottom + 6}px`;
  };

  const picker: IconPicker = {
    isOpen: () => !host.hidden,
    isOpenFor: (alvo) => !host.hidden && alvo === slot,

    async open(anchor, alvo) {
      slot = alvo;
      const atual = handlers.current(slot);
      // Calculadas agora, uma vez, e nunca enquanto a pessoa escreve.
      const sugeridos = suggestIcons(await handlers.textFor(slot));
      const recentes = handlers.recents().slice(0, 5);

      host.innerHTML = `
        ${grupo(t("icons.suggested"), sugeridos, atual)}
        ${grupo(t("icons.recent"), recentes, atual)}
        <div class="gp-picker__group">
          <span class="gp-picker__title">${t("icons.all")}</span>
          <div class="gp-picker__grid">${ICON_IDS.map((id) => botao(id, atual)).join("")}</div>
        </div>
        <div class="gp-picker__foot">
          <span class="gp-picker__caption" data-caption>${atual ? iconLabel(atual) : t("icons.choose")}</span>
          ${atual ? `<button class="gp-picker__none" data-pick="">${t("icons.none")}</button>` : ""}
        </div>`;
      legendaPadrao = atual ? iconLabel(atual) : t("icons.choose");

      host.hidden = false;
      ancora = anchor;
      posicionar(anchor);
      host.querySelector<HTMLElement>('[data-on="true"], [data-pick]')?.focus();
    },

    close() {
      if (host.hidden) return;
      host.hidden = true;
      handlers.onClose();
    },
  };

  // A janela do Harp muda de tamanho por atalho, com o seletor aberto. Refazer
  // as contas e mais util que fechar: o gesto continua de onde estava.
  window.addEventListener("resize", () => {
    if (picker.isOpen() && ancora) posicionar(ancora);
  });

  host.addEventListener("click", (event) => {
    const alvo = (event.target as HTMLElement).closest<HTMLElement>("[data-pick]");
    if (!alvo) return;
    const id = alvo.dataset.pick;
    handlers.onPick(slot, id ? (id as IconId) : null);
    picker.close();
  });

  // Fora do popover fecha; Esc tambem. Em captura, para vir antes do editor.
  document.addEventListener(
    "mousedown",
    (event) => {
      const alvo = event.target as HTMLElement;
      // O icone da aba decide sozinho: abre, ou fecha se ja estava aberto.
      if (alvo.closest?.("[data-icon-pick]")) return;
      if (picker.isOpen() && !host.contains(alvo)) picker.close();
    },
    true,
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (picker.isOpen() && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        picker.close();
      }
    },
    true,
  );

  return picker;
}
