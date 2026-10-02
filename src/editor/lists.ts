/**
 * Listas: o marcador à vista, e o subitem que vira letra.
 *
 * Três coisas pequenas que juntas fazem a lista parecer uma lista:
 *
 * - o traço do item fica maior e mais firme, e o número fica em negrito.
 *   Escondidos os outros marcadores do Markdown, estes dois são o único sinal
 *   de que a lista pegou — e, apagados, davam a impressão de que nada tinha
 *   acontecido;
 * - `Tab` dentro de uma lista numerada cria o subitem como `a.`, `b.`, `c.`,
 *   como se escreve à mão. `Shift+Tab` volta para os números;
 * - um nível de indentação passou a ser quatro espaços, para o subitem ficar
 *   claramente embaixo do item.
 *
 * `a.` não é lista para o CommonMark — outros leitores mostram a linha como
 * texto comum. É uma escolha a favor de quem escreve: o arquivo continua texto
 * puro, e aqui a continuação no Enter funciona igual à das outras listas. **[D]**
 */

import { syntaxTree } from "@codemirror/language";
import { EditorSelection, RangeSetBuilder, type ChangeSpec, type Extension } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type KeyBinding,
  type ViewUpdate,
} from "@codemirror/view";

/** Um nível de indentação. Também é o que `Tab` insere fora de listas. */
export const INDENT = "    ";

/** Marcador de item, com o recuo e o espaço que vêm com ele. */
const ITEM = /^(\s*)([-*+]|\d+\.|[a-z]\.)(\s+)/;

/** Só os alfabéticos, que o Markdown não conhece e o editor precisa reconhecer. */
const ALFA = /^(\s*)([a-z])\.(\s+)/;

// --- Aparência -----------------------------------------------------------------

const TRACO = Decoration.mark({ class: "cm-harp-mark cm-harp-mark--bullet" });
const NUMERO = Decoration.mark({ class: "cm-harp-mark cm-harp-mark--ordered" });

function marcadores(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    // Os marcadores de verdade vêm da árvore, que sabe o que é lista e o que é
    // um traço no meio de uma frase.
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name !== "ListMark") return;
        const texto = view.state.doc.sliceString(node.from, node.to);
        builder.add(node.from, node.to, /^\d/.test(texto) ? NUMERO : TRACO);
      },
    });
  }

  // Os alfabéticos a árvore não enxerga: para ela, `a. item` é um parágrafo.
  const extras: { from: number; to: number }[] = [];
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const linha = view.state.doc.lineAt(pos);
      const achou = ALFA.exec(linha.text);
      if (achou && achou[1].length > 0) {
        const inicio = linha.from + achou[1].length;
        extras.push({ from: inicio, to: inicio + 2 });
      }
      pos = linha.to + 1;
    }
  }

  // Um `RangeSetBuilder` exige ordem crescente; juntar os dois conjuntos no fim
  // é mais simples do que percorrer árvore e linhas ao mesmo tempo.
  const daArvore = builder.finish();
  if (extras.length === 0) return daArvore;
  return daArvore.update({
    add: extras.map((faixa) => NUMERO.range(faixa.from, faixa.to)),
    sort: true,
  });
}

const aparencia: Extension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = marcadores(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = marcadores(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

// --- Indentação ----------------------------------------------------------------

const ordenadoNoTexto = (marcador: string) => /^(\d+|[a-z])\.$/.test(marcador);

/** O marcador seguinte ao de um irmao: `2.` depois de `1.`, `b.` depois de `a.`. */
function depoisDe(marcador: string, nivel: number): string {
  const numero = /^(\d+)\.$/.exec(marcador);
  if (numero) return nivel >= 1 ? "a." : `${Number(numero[1]) + 1}.`;
  const letra = /^([a-z])\.$/.exec(marcador);
  if (letra) return nivel >= 1 ? `${proxima(letra[1])}.` : "1.";
  return nivel >= 1 ? "a." : "1.";
}

/**
 * O marcador do item anterior no mesmo nivel, se a lista continuar ali.
 *
 * Sem isto, sair de uma sublista recomecava a contagem no `1.`: "1. abrir,
 * 2. conferir, 1. fechar". Linha em branco ou um item mais a esquerda encerram
 * a busca — dali para tras e outra lista.
 */
function irmaoAcima(
  doc: { line(n: number): { text: string }; lines: number },
  numeroDaLinha: number,
  nivel: number,
): string | null {
  for (let n = numeroDaLinha - 1; n >= 1; n -= 1) {
    const texto = doc.line(n).text;
    if (texto.trim() === "") return null;
    const achou = ITEM.exec(texto);
    if (!achou) continue;
    const nivelDali = Math.floor(achou[1].length / INDENT.length);
    if (nivelDali < nivel) return null;
    if (nivelDali === nivel) return achou[2];
  }
  return null;
}

/**
 * Move os itens de lista um nível para dentro ou para fora, trocando o
 * marcador: numerado no primeiro nível, alfabético nos de dentro.
 *
 * Fora de uma lista devolve `false`, e o `Tab` normal (indentar) assume.
 */
function mover(direcao: 1 | -1) {
  return (view: EditorView): boolean => {
    const { state } = view;
    const mudancas: ChangeSpec[] = [];
    let mexeu = false;

    // O ultimo marcador que este mesmo comando ja colocou em cada nivel: ao
    // mover varios itens de uma vez, o segundo tem de vir depois do primeiro, e
    // o documento ainda nao mudou para poder ser consultado.
    const ultimo = new Map<number, string>();

    for (const range of state.selection.ranges) {
      const primeira = state.doc.lineAt(range.from).number;
      const ultima = state.doc.lineAt(range.to).number;

      for (let n = primeira; n <= ultima; n += 1) {
        const linha = state.doc.line(n);
        const achou = ITEM.exec(linha.text);
        if (!achou) continue;

        const [tudo, recuo, marcador, espaco] = achou;
        const nivel = Math.floor(recuo.length / INDENT.length) + direcao;
        if (nivel < 0) continue;

        mexeu = true;
        const novoRecuo = INDENT.repeat(nivel);
        let novoMarcador = marcador;
        if (ordenadoNoTexto(marcador)) {
          const anterior = ultimo.get(nivel) ?? irmaoAcima(state.doc, n, nivel);
          novoMarcador = anterior ? depoisDe(anterior, nivel) : nivel >= 1 ? "a." : "1.";
          ultimo.set(nivel, novoMarcador);
        }
        mudancas.push({
          from: linha.from,
          to: linha.from + tudo.length,
          insert: `${novoRecuo}${novoMarcador}${espaco}`,
        });
      }
    }

    if (!mexeu) return false;
    view.dispatch(state.update({ changes: mudancas, userEvent: "input.indent" }));
    return true;
  };
}

// --- Continuação no Enter ------------------------------------------------------

/** A próxima letra, parando no `z` em vez de virar `{`. */
function proxima(letra: string): string {
  return letra >= "z" ? "z" : String.fromCharCode(letra.charCodeAt(0) + 1);
}

/**
 * Enter numa lista alfabética continua a lista; numa linha vazia, sai dela.
 *
 * O CodeMirror já faz isso para `-` e `1.`, mas `a.` não é lista para ele.
 */
function continuarAlfa(view: EditorView): boolean {
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return false;

  const linha = state.doc.lineAt(range.head);
  const achou = ALFA.exec(linha.text);
  if (!achou || achou[1].length === 0) return false;

  const [tudo, recuo, letra, espaco] = achou;
  const conteudo = linha.text.slice(tudo.length);

  // Item vazio: o Enter sai da lista, como nas outras.
  if (conteudo.trim() === "") {
    view.dispatch(
      state.update({
        changes: { from: linha.from, to: linha.to, insert: "" },
        selection: EditorSelection.cursor(linha.from),
        userEvent: "input",
      }),
    );
    return true;
  }

  const novo = `\n${recuo}${proxima(letra)}.${espaco}`;
  view.dispatch(
    state.update({
      changes: { from: range.head, insert: novo },
      selection: EditorSelection.cursor(range.head + novo.length),
      userEvent: "input",
    }),
  );
  return true;
}

export const listKeymap: KeyBinding[] = [
  { key: "Tab", run: mover(1) },
  { key: "Shift-Tab", run: mover(-1) },
  { key: "Enter", run: continuarAlfa },
];

export const lists: Extension = aparencia;
