/**
 * Conta na linha: terminou em `=`, o resultado aparece.
 *
 * Não é uma calculadora dentro do Harp — é a conta que já estava escrita na
 * anotação, resolvida onde ela está. Numa lista de compras, abrir a calculadora
 * para `5,60 * 4` e voltar custa mais do que a conta.
 *
 * Três regras para não atrapalhar:
 *
 * - só age quando a linha termina em `=` (um `?` depois é aceito), que é como
 *   quem escreve diz "falta o número aqui";
 * - exige pelo menos um operador: `Total = 42 =` não é uma conta por resolver;
 * - o resultado é uma sugestão à vista, nunca texto. `Ctrl+Alt+Enter` escreve.
 *   Um número que entra sozinho no arquivo é um número que ninguém pediu. **[D]**
 *
 * Não existe `eval` aqui. O texto vem de qualquer lugar — inclusive de um
 * arquivo aberto — e virar código é o tipo de coisa que não se conserta depois.
 */

import { EditorSelection, RangeSetBuilder, type Extension } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type KeyBinding,
  type ViewUpdate,
} from "@codemirror/view";

/** A linha pede um resultado: termina em `=`, com um `?` opcional. */
const PEDIDO = /=\s*\??\s*$/;

/** O rabo de caracteres que podem formar uma conta, com nomes entre colchetes. */
const CONTA = /(?:\[[^\]]+\]|[\d\s+\-*/×÷.,()%])+$/;

/**
 * Marcador de lista ou de tarefa no comeco da linha.
 *
 * Sai antes de qualquer leitura: o `[ ]` de uma tarefa nao pode ser confundido
 * com um nome entre colchetes, e o rotulo de `- [ ] Pao = ...` e "Pao".
 */
const MARCADOR = /^\s*(?:[-*+]|\d+\.|[a-z]\.)\s+(?:\[[ xX]\]\s*)?/;

/** Nome entre colchetes: o valor de uma linha de cima. */
const REFERENCIA = /\[([^\]]+)\]/g;

/** O rotulo de uma linha: o que vem antes do primeiro `=`. */
const ROTULO = /^(.+?)\s*=/;

/** Um numero sozinho, para `Manteiga = 11,00` tambem valer como valor. */
const SO_NUMERO = /^[\s\d.,]+$/;

/** Nomes ja definidos pelas linhas de cima, por nome em minusculas. */
export type Nomes = Map<string, number>;

const chave = (nome: string) => nome.trim().toLowerCase();

/** Precisa de pelo menos uma operação de verdade. */
const TEM_OPERADOR = /[+\-*/×÷%]/;

// --- Números -------------------------------------------------------------------

/**
 * Lê um número escrito como gente escreve.
 *
 * Com vírgula no texto, a vírgula é o decimal e o ponto é separador de milhar —
 * `1.250,40`. Sem vírgula nenhuma, o ponto é o decimal — `3.59`. É a leitura que
 * acerta tanto a lista de compras quanto a conta copiada de outro lugar.
 */
function lerNumero(bruto: string, virgulaEDecimal: boolean): number {
  const limpo = virgulaEDecimal
    ? bruto.replace(/\./g, "").replace(",", ".")
    : bruto.replace(/,/g, "");
  return Number(limpo);
}

// --- Avaliação -----------------------------------------------------------------

type Token = { tipo: "num"; valor: number } | { tipo: "op"; valor: string };

function tokenizar(texto: string, virgulaEDecimal: boolean, nomes: Nomes): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < texto.length) {
    const c = texto[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    // Um nome vira numero aqui, e nao por substituicao no texto: trocar
    // `[Total]` por "127.58" dentro de uma conta escrita com virgula faria o
    // ponto virar separador de milhar, e 127,58 viraria 12758.
    if (c === "[") {
      const fim = texto.indexOf("]", i);
      if (fim < 0) return null;
      const valor = nomes.get(chave(texto.slice(i + 1, fim)));
      if (valor === undefined) return null;
      tokens.push({ tipo: "num", valor });
      i = fim + 1;
      continue;
    }
    if (/[\d.,]/.test(c)) {
      const inicio = i;
      while (i < texto.length && /[\d.,]/.test(texto[i])) i += 1;
      const valor = lerNumero(texto.slice(inicio, i), virgulaEDecimal);
      if (!Number.isFinite(valor)) return null;
      tokens.push({ tipo: "num", valor });
      continue;
    }
    if ("+-*/×÷()%".includes(c)) {
      tokens.push({ tipo: "op", valor: c });
      i += 1;
      continue;
    }
    return null;
  }

  return tokens;
}

/**
 * Descida recursiva sobre os tokens. Devolve `null` em qualquer coisa que não
 * seja uma conta inteira e bem formada — meia conta não vira resultado.
 */
function avaliar(tokens: Token[]): number | null {
  let pos = 0;

  const olhar = () => tokens[pos];
  const operador = (...quais: string[]) => {
    const t = olhar();
    return t && t.tipo === "op" && quais.includes(t.valor) ? (pos += 1, t.valor) : null;
  };

  function primario(): number | null {
    const t = olhar();
    if (!t) return null;
    if (t.tipo === "num") {
      pos += 1;
      // `50%` vira 0,5; é como a porcentagem aparece numa anotação.
      if (operador("%")) return t.valor / 100;
      return t.valor;
    }
    if (t.valor === "(") {
      pos += 1;
      const dentro = soma();
      if (dentro === null || !operador(")")) return null;
      return dentro;
    }
    return null;
  }

  function unario(): number | null {
    const sinal = operador("+", "-");
    if (sinal === null) return primario();
    const valor = unario();
    return valor === null ? null : sinal === "-" ? -valor : valor;
  }

  function produto(): number | null {
    let esquerda = unario();
    if (esquerda === null) return null;
    for (;;) {
      const op = operador("*", "/", "×", "÷");
      if (!op) return esquerda;
      const direita = unario();
      if (direita === null) return null;
      if ((op === "/" || op === "÷") && direita === 0) return null;
      esquerda = op === "*" || op === "×" ? esquerda * direita : esquerda / direita;
    }
  }

  function soma(): number | null {
    let esquerda = produto();
    if (esquerda === null) return null;
    for (;;) {
      const op = operador("+", "-");
      if (!op) return esquerda;
      const direita = produto();
      if (direita === null) return null;
      esquerda = op === "+" ? esquerda + direita : esquerda - direita;
    }
  }

  const total = soma();
  return pos === tokens.length && total !== null && Number.isFinite(total) ? total : null;
}

/**
 * Arredonda para duas casas e escreve do jeito que a linha estava escrita.
 *
 * Quebrado, sempre com as duas casas: numa lista de compras, `22,40` e um
 * preco e `22,4` e um numero solto. Redondo, sem casa nenhuma.
 */
function formatar(valor: number, virgulaEDecimal: boolean): string {
  const arredondado = Math.round(valor * 100) / 100;
  const texto = Number.isInteger(arredondado) ? String(arredondado) : arredondado.toFixed(2);
  return virgulaEDecimal ? texto.replace(".", ",") : texto;
}

/**
 * O resultado da conta de uma linha, ou `null` se não houver conta pedida.
 *
 * Pura de propósito: é onde moram todas as decisões, e é o que dá para testar
 * sem abrir o editor.
 */
export function resultado(linha: string, nomes: Nomes = new Map(), virgula = false): string | null {
  const conta = calcular(linha, nomes);
  return conta === null ? null : formatar(conta.valor, conta.virgula || virgula);
}

/**
 * O numero de uma linha, antes de virar texto.
 *
 * Quem define um nome usa este, e nao o resultado formatado: `144,38` lido de
 * volta como se a virgula fosse milhar vira 14438, e a linha seguinte dividia
 * um numero cem vezes maior.
 */
function calcular(linha: string, nomes: Nomes): { valor: number; virgula: boolean } | null {
  const conta = contaDaLinha(linha);
  if (!conta) return null;

  // A virgula so decide a leitura dos numeros escritos; um nome com virgula
  // dentro nao pode mudar como `3.59` e lido.
  const virgula = conta.replace(REFERENCIA, "").includes(",");
  const tokens = tokenizar(conta, virgula, nomes);
  if (!tokens || tokens.length < 3) return null;

  const valor = avaliar(tokens);
  return valor === null ? null : { valor, virgula };
}

/** A conta por resolver de uma linha, ou `null` se ela nao pedir nenhuma. */
function contaDaLinha(linha: string): string | null {
  const limpa = linha.replace(MARCADOR, "");
  if (!PEDIDO.test(limpa)) return null;

  const achou = CONTA.exec(limpa.replace(PEDIDO, ""));
  if (!achou) return null;

  const conta = achou[0].trim();
  return conta && TEM_OPERADOR.test(conta) ? conta : null;
}

/**
 * O valor que uma linha passa a dar ao nome dela, se der algum.
 *
 * `Total = 5,6 + 11 =` define `Total` pelo resultado; `Manteiga = 11,00` define
 * pelo numero escrito. Uma linha sem `=` nao define nada.
 */
function definicao(linha: string, nomes: Nomes): [string, number] | null {
  const limpa = linha.replace(MARCADOR, "");
  const rotulo = ROTULO.exec(limpa)?.[1]?.trim();
  if (!rotulo || rotulo.includes("[")) return null;

  const calculado = calcular(limpa, nomes);
  if (calculado !== null) return [chave(rotulo), calculado.valor];

  // Sem conta: vale o numero solto depois do ultimo `=`.
  const depois = limpa.slice(limpa.lastIndexOf("=") + 1).trim();
  if (!depois || !SO_NUMERO.test(depois)) return null;
  const virgulaEDecimal = depois.includes(",");
  const valor = Number(
    virgulaEDecimal ? depois.replace(/\./g, "").replace(",", ".") : depois.replace(/,/g, ""),
  );
  return Number.isFinite(valor) ? [chave(rotulo), valor] : null;
}

/**
 * Os resultados de um texto inteiro, linha a linha.
 *
 * Uma passada de cima para baixo: cada linha enxerga os nomes que as de cima
 * definiram, e so eles. Olhar so para tras e o que garante que nenhuma conta
 * dependa de si mesma — nao ha ciclo possivel, e nao e preciso procurar um.
 * **[D]**
 */
export function calcularLinhas(linhas: string[]): (string | null)[] {
  const nomes: Nomes = new Map();
  // Numa conta so de nomes nao ha virgula nenhuma para ler, e o resultado sairia
  // com ponto no meio de um texto escrito com virgula. Quem decide, ai, e o
  // texto todo.
  const virgulaNoTexto = linhas.some((linha) => /\d,\d/.test(linha));
  return linhas.map((linha) => {
    const valor = resultado(linha, nomes, virgulaNoTexto);
    const nova = definicao(linha, nomes);
    if (nova) nomes.set(nova[0], nova[1]);
    return valor;
  });
}

// --- Na tela -------------------------------------------------------------------

class Resultado extends WidgetType {
  constructor(readonly texto: string) {
    super();
  }

  eq(other: Resultado): boolean {
    return other.texto === this.texto;
  }

  toDOM(): HTMLElement {
    const node = document.createElement("span");
    node.className = "cm-harp-calc";
    node.textContent = this.texto;
    // Sugestão, e não conteúdo: não entra em cópia nem em leitor de tela.
    node.setAttribute("aria-hidden", "true");
    return node;
  }
}

/**
 * O texto inteiro e percorrido, e nao so o pedaco visivel: um nome pode ter sido
 * definido muito acima do que esta na tela. Sao anotacoes, nao planilhas — a
 * conta por linha e uma expressao regular que falha cedo.
 */
function resultados(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const linhas: string[] = [];
  for (let n = 1; n <= view.state.doc.lines; n += 1) linhas.push(view.state.doc.line(n).text);
  const valores = calcularLinhas(linhas);

  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const linha = view.state.doc.lineAt(pos);
      const valor = valores[linha.number - 1];
      if (valor != null) {
        builder.add(linha.to, linha.to, Decoration.widget({ widget: new Resultado(valor), side: 1 }));
      }
      pos = linha.to + 1;
    }
  }

  return builder.finish();
}

const mostrar: Extension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = resultados(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = resultados(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

/** `Ctrl+Alt+Enter`: o resultado sugerido vira texto, no fim da linha. */
function escrever(view: EditorView): boolean {
  const { state } = view;
  const linha = state.doc.lineAt(state.selection.main.head);
  const anteriores: string[] = [];
  for (let n = 1; n <= linha.number; n += 1) anteriores.push(state.doc.line(n).text);
  const valor = calcularLinhas(anteriores)[linha.number - 1];
  if (valor == null) return false;

  // O `?` era o lugar guardado para o número; o número toma o lugar dele.
  const semInterrogacao = linha.text.replace(/\s*\?\s*$/, "");
  const texto = `${semInterrogacao.replace(/\s+$/, "")} ${valor}`;

  view.dispatch(
    state.update({
      changes: { from: linha.from, to: linha.to, insert: texto },
      selection: EditorSelection.cursor(linha.from + texto.length),
      userEvent: "input",
    }),
  );
  return true;
}

export const calcKeymap: KeyBinding[] = [{ key: "Ctrl-Alt-Enter", run: escrever }];

export const calc: Extension = mostrar;
