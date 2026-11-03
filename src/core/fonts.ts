/**
 * Fontes disponíveis para o texto.
 *
 * Todas são OFL e vêm empacotadas com o app — nada é baixado em uso, o que
 * mantém a promessa de funcionar sem rede. Os arquivos de cada família só são
 * carregados quando a família é escolhida, ou quando as configurações abrem:
 * carregar as sete na abertura do app desperdiçaria memória por algo que
 * ninguém pediu, mas a lista de fontes precisa mostrar cada uma de verdade.
 */

export type FontId =
  | "inter"
  | "make-sans"
  | "trap"
  | "dm-serif-text"
  | "eb-garamond"
  | "ibm-plex-mono"
  | "dm-mono"
  | "syne"
  | "comic-neue"
  | "system";

export interface FontChoice {
  id: FontId;
  /** Nome da família, exibido na própria fonte no menu. */
  label: string;
  /** Valor final do `font-family`, com alternativas. */
  stack: string;
  /** Carrega os arquivos da família. */
  load?: () => Promise<unknown>;
  /**
   * Fonte do Windows, e não do app: só aparece na lista se estiver instalada.
   * O valor é o nome da família, para conferir.
   */
  installed?: string;
}

const SYSTEM_STACK = '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif';

export const FONTS: FontChoice[] = [
  {
    id: "inter",
    label: "Inter",
    stack: `"Inter Variable", "Inter", ${SYSTEM_STACK}`,
    load: () => import("@fontsource-variable/inter"),
  },
  // Em teste, candidatas a substituir a Inter. São fontes compradas: o Harp as
  // usa pelo nome, direto do Windows de quem as tem, e os arquivos não entram
  // no app — que é distribuído de graça e tem o código aberto. Para virar a fonte
  // de todo mundo, precisa de uma licença que permita embutir. **[D]**
  {
    id: "make-sans",
    label: "Make Sans",
    stack: `"Make Sans", ${SYSTEM_STACK}`,
    installed: "Make Sans",
  },
  {
    id: "trap",
    label: "Trap",
    stack: `"Trap", ${SYSTEM_STACK}`,
    installed: "Trap",
  },
  {
    id: "dm-serif-text",
    label: "DM Serif Text",
    stack: '"DM Serif Text", Georgia, serif',
    load: () => import("@fontsource/dm-serif-text/400.css"),
  },
  {
    id: "eb-garamond",
    label: "EB Garamond",
    stack: '"EB Garamond Variable", Garamond, Georgia, serif',
    load: () => import("@fontsource-variable/eb-garamond"),
  },
  {
    id: "ibm-plex-mono",
    label: "IBM Plex Mono",
    stack: '"IBM Plex Mono", Consolas, monospace',
    load: () => import("@fontsource/ibm-plex-mono/400.css"),
  },
  {
    id: "dm-mono",
    label: "DM Mono",
    stack: '"DM Mono", Consolas, monospace',
    load: () => import("@fontsource/dm-mono/400.css"),
  },
  {
    id: "syne",
    label: "Syne",
    stack: `"Syne Variable", ${SYSTEM_STACK}`,
    load: () => import("@fontsource-variable/syne"),
  },
  {
    id: "comic-neue",
    label: "Comic Neue",
    stack: '"Comic Neue", "Comic Sans MS", cursive',
    load: () => import("@fontsource/comic-neue/400.css"),
  },
  // Última da lista: quem quiser a fonte que já usa no Windows a encontra aqui.
  { id: "system", label: "", stack: SYSTEM_STACK },
];

export const DEFAULT_FONT: FontId = "inter";

/**
 * Carrega todas as famílias, para a lista de fontes se mostrar como é.
 *
 * Antes, só a escolhida estava carregada: as outras apareciam numa fonte
 * genérica, e escolher uma fonte era escolher pelo nome. São arquivos que já
 * vêm com o app; a lista só abre quando a pessoa pede. **[D]**
 */
const instaladas = new Map<string, boolean>();

/**
 * A família está instalada no Windows?
 *
 * Não há pergunta direta sem pedir permissão, então a resposta vem da régua: a
 * mesma frase, medida com a família e sem ela. Se a largura não muda nas três
 * fontes genéricas, o navegador caiu no substituto — a família não existe.
 */
export function isInstalled(family: string): boolean {
  const guardada = instaladas.get(family);
  if (guardada !== undefined) return guardada;

  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return false;
  const amostra = "mmmmmmmmmmlli1WQ@#";
  const existe = ["monospace", "serif", "sans-serif"].some((base) => {
    ctx.font = `72px ${base}`;
    const sem = ctx.measureText(amostra).width;
    ctx.font = `72px "${family}", ${base}`;
    return ctx.measureText(amostra).width !== sem;
  });
  instaladas.set(family, existe);
  return existe;
}

/** As fontes que esta máquina consegue mostrar. */
export function availableFonts(): FontChoice[] {
  return FONTS.filter((font) => !font.installed || isInstalled(font.installed));
}

export function loadAllFonts(): Promise<unknown> {
  return Promise.all(FONTS.map((font) => font.load?.()));
}

export const FONT_SIZE_MIN = 11;
export const FONT_SIZE_MAX = 30;
export const DEFAULT_FONT_SIZE = 15;

const loaded = new Set<FontId>();

/**
 * Aplica a fonte escolhida, carregando os arquivos dela na primeira vez.
 *
 * A troca da variável CSS acontece depois do carregamento: mudar antes faria o
 * texto piscar na fonte de fallback enquanto os arquivos chegam.
 */
export async function applyFont(id: FontId): Promise<void> {
  const choice = FONTS.find((font) => font.id === id) ?? FONTS[0];

  if (choice.load && !loaded.has(choice.id)) {
    try {
      await choice.load();
      loaded.add(choice.id);
    } catch {
      // Falhou o carregamento: a pilha de alternativas segura o texto.
    }
  }

  document.documentElement.style.setProperty("--gp-font", choice.stack);
}

export function applyFontSize(size: number): number {
  const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(size)));
  document.documentElement.style.setProperty("--gp-font-size", `${clamped}px`);
  return clamped;
}
