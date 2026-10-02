/**
 * Markdown sem os sinais à vista.
 *
 * Os marcadores (`#`, `**`, `` ` ``) já eram discretos, mas continuavam no
 * meio da frase: para ler um título era preciso pular o `#`. Aqui eles somem
 * das linhas em que ninguém está mexendo e voltam inteiros assim que o cursor
 * chega — o texto continua sendo Markdown de verdade, e nenhuma tecla edita
 * algo que não está na tela. **[D]**
 *
 * O marcador de lista (`-`, `1.`) fica: ele não é sintaxe sobrando, é o que
 * mostra que aquilo é uma lista. O das tarefas quem cuida é `tasks.ts`.
 */

import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";

/** Nós do Markdown que são só marcação, e não conteúdo. */
const MARCAS = new Set([
  "HeaderMark",
  "EmphasisMark",
  "StrongMark",
  "CodeMark",
  "StrikethroughMark",
  "LinkMark",
  "QuoteMark",
]);

/** Depois destes, o espaço também some: "# " inteiro, e não só o "#". */
const COM_ESPACO = new Set(["HeaderMark", "QuoteMark"]);

const oculto = Decoration.replace({});

/** As linhas que o cursor (ou a seleção) ocupa agora. */
function linhasVivas(view: EditorView): Set<number> {
  const vivas = new Set<number>();
  for (const range of view.state.selection.ranges) {
    const primeira = view.state.doc.lineAt(range.from).number;
    const ultima = view.state.doc.lineAt(range.to).number;
    for (let n = primeira; n <= ultima; n += 1) vivas.add(n);
  }
  return vivas;
}

function marcasOcultas(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const vivas = linhasVivas(view);

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (!MARCAS.has(node.name)) return;
        const linha = view.state.doc.lineAt(node.from);
        if (vivas.has(linha.number)) return;

        let fim = node.to;
        if (COM_ESPACO.has(node.name)) {
          while (fim < linha.to && view.state.doc.sliceString(fim, fim + 1) === " ") fim += 1;
        }
        if (fim > node.from) builder.add(node.from, fim, oculto);
      },
    });
  }
  return builder.finish();
}

/**
 * Esconde os marcadores fora da linha em uso.
 *
 * Redesenha também quando a seleção muda, e não só quando o texto muda: trocar
 * de linha é exatamente o que faz os marcadores aparecerem e sumirem.
 */
export const markdownPreview: Extension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = marcasOcultas(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = marcasOcultas(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
