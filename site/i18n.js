/**
 * Os textos que o JavaScript escreve, em português e em inglês.
 *
 * O que está no HTML fica no HTML: cada idioma tem a sua página, e é lá que
 * moram as frases da narrativa. Aqui só entra o que é montado em tempo de
 * execução — as telas de contexto, os nomes dos atalhos e os rótulos dos
 * controles —, para as duas páginas dividirem o mesmo código em vez de duas
 * cópias que envelhecem em ritmos diferentes.
 *
 * O idioma vem do `lang` da página, e o `data-root` diz onde estão as imagens
 * quando a página não está na raiz (`/en/`).
 */

const pt = {
  ui: {
    typed: "Repensar a escrita na tela",
    themeToLight: "Mudar para o tema claro",
    themeToDark: "Voltar para o tema escuro",
    shortcuts: [
      "Chama e esconde o Harp, de qualquer aplicativo",
      "Rascunho rápido por cima de tudo",
      "Escreve e aponta sobre a própria tela",
      "Modo fantasma: o clique atravessa a janela",
      "Some das gravações e do compartilhamento",
      "Menos ou mais opacidade",
      "Encaixa nos cantos",
      "Ocupa a tela toda",
      "Troca de anotação",
      "Cria a tarefa, ou marca e desmarca",
      "Teleprompter, com rolagem contínua",
      "Faixa de três linhas no topo da tela",
      "Copia tudo e limpa",
      "Todos os atalhos, dentro do app",
      "Resgate: desfaz todos os modos",
    ],
  },

  code: {
    menu: "Arquivo&nbsp;&nbsp;Editar&nbsp;&nbsp;Seleção&nbsp;&nbsp;Ver&nbsp;&nbsp;Executar&nbsp;&nbsp;Terminal",
    search: "fechamento",
    explorer: "Explorador",
    project: "FECHAMENTO",
    files: ["conciliacao.py", "extratos.py", "regras.py", "__init__.py"],
    tests: "tests",
    tabs: ["conciliacao.py", "regras.py", "test_conciliacao.py"],
    crumbs: "src › conciliacao.py › conciliar_lote",
    branch: "main",
    position: "Ln 27, Col 32",
    source: `from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Iterable

from .extratos import Lancamento, carregar_extrato
from .regras import Regra, aplicar_regras


@dataclass(slots=True)
class Resultado:
    conciliados: list[tuple[Lancamento, Lancamento]] = field(default_factory=list)
    pendentes: list[Lancamento] = field(default_factory=list)

    @property
    def taxa(self) -> float:
        total = len(self.conciliados) + len(self.pendentes)
        return len(self.conciliados) / total if total else 0.0


async def conciliar_lote(contas: Iterable[str], regras: list[Regra],
                         tolerancia: Decimal = Decimal("0.01")) -> Resultado:
    # Os extratos chegam em paralelo; a ordem das contas é preservada.
    extratos = await asyncio.gather(*(carregar_extrato(c) for c in contas))
    resultado = Resultado()
    for banco, razao in zip(*extratos, strict=True):
        par = aplicar_regras(banco, razao, regras)
        if par and abs(par[0].valor - par[1].valor) <= tolerancia:
            resultado.conciliados.append(par)
        else:
            resultado.pendentes.append(banco)
    return resultado`,
  },

  editor: {
    modules: ["Revelar", "Biblioteca", "Mapa", "Imprimir"],
    file: "DSC_0412.ARW · 6000 × 4000",
    navigator: "Navegador",
    presets: "Predefinições",
    presetList: ["Paisagem · suave", "Costa · fim de tarde", "Preto e branco · alto", "Filme · 400"],
    histogram: "Histograma",
    meta: "ISO 100 · 70 mm · f/8 · 1/500 s",
    basic: "Básico",
    sliders: [
      ["Temperatura", 0.56, "5.450"],
      ["Tonalidade", 0.52, "+4"],
      ["Exposição", 0.61, "+0,35"],
      ["Contraste", 0.55, "+12"],
      ["Realces", 0.29, "−42"],
      ["Sombras", 0.62, "+18"],
      ["Brancos", 0.5, "0"],
      ["Pretos", 0.44, "−9"],
      ["Textura", 0.57, "+10"],
      ["Vibração", 0.63, "+22"],
    ],
  },

  sheet: {
    decimal: ",",
    file: "fechamento_marco.xlsx",
    saved: "Salvo",
    ribbonTabs: ["Arquivo", "Página inicial", "Inserir", "Fórmulas", "Dados", "Revisão", "Exibir"],
    bold: "N",
    italic: "I",
    underline: "S",
    formats: ["Contábil", "% 0,0"],
    title: "Fechamento · março · valores em R$",
    columns: ["Conta", "Centro de custo", "Jan", "Fev", "Mar previsto", "Mar realizado", "Diferença", "Var.", "Status"],
    rows: [
      ["Receita recorrente", "Comercial", "412.300", "418.950", "431.000", "428.410", "−2.590", -0.6, "ok"],
      ["Serviços", "Comercial", "86.120", "91.400", "95.000", "97.860", "2.860", 3.0, "ok"],
      ["Licenças", "Produto", "38.900", "38.900", "39.500", "39.500", "0", 0.0, "ok"],
      ["Infraestrutura", "Tecnologia", "−61.200", "−63.880", "−64.500", "−82.340", "−17.840", -27.7, "revisar"],
      ["Folha", "Pessoas", "−198.400", "−198.400", "−203.000", "−202.110", "890", 0.4, "ok"],
      ["Marketing", "Comercial", "−44.100", "−39.700", "−42.000", "−40.960", "1.040", 2.5, "ok"],
      ["Viagens", "Operações", "−8.300", "−11.250", "−9.000", "−9.870", "−870", -9.7, "ok"],
      ["Ferramentas", "Tecnologia", "−12.640", "−12.910", "−13.000", "−13.020", "−20", -0.2, "ok"],
      ["Consultoria", "Financeiro", "−15.000", "−0", "−7.500", "−7.500", "0", 0.0, "ok"],
      ["Impostos", "Financeiro", "−71.230", "−73.500", "−76.300", "−75.980", "320", 0.4, "ok"],
    ],
    total: ["Resultado", "126.450", "149.610", "149.200", "133.950", "−15.250", "−10,2%"],
    status: { ok: "ok", revisar: "revisar" },
    sheets: ["Resumo", "Março", "Q1", "Premissas"],
    sum: "Soma: −17.840",
  },

  slides: {
    kicker: "Resultados · trimestre 3",
    title: "Retenção por coorte subiu, mas não em todas as regiões",
    legend: ["Sudeste", "Nordeste"],
    callout: "+18 p.p. em agosto",
    kpis: [
      ["61%", "retenção em 90 dias"],
      ["+7 p.p.", "contra o trimestre 2"],
      ["3,4×", "retorno sobre aquisição"],
    ],
    source: "Fonte: base interna · coortes de março a agosto de 2026",
  },

  video: { chapter: "Subindo até o lago" },

  timeline: {
    bin: "Mídia do projeto",
    items: "14 itens",
    sequence: "Sequência 03 · 24 qps",
    titles: ["Título · praia", "Legenda"],
  },

  doc: {
    style: "Normal",
    comments: "Comentários (2)",
    title: "Contrato de prestação de serviços",
    sub: "Versão 3 · revisão jurídica",
    clauses: [
      ["4.", "O prazo de entrega será contado a partir da aprovação do escopo, e qualquer alteração posterior será registrada por escrito pelas duas partes."],
      ["5.", 'Os arquivos produzidos durante o projeto pertencem à contratante a partir do pagamento integral, <mark>incluindo versões intermediárias</mark>.'],
      ["6.", "A rescisão pode ser solicitada por qualquer das partes, com aviso prévio de trinta dias, sem multa."],
      ["7.", "Casos omissos serão resolvidos no foro da comarca da contratante."],
    ],
    note: ["Júlia", "Isso inclui os brutos?"],
  },

  browser: {
    brand: "Órbita",
    tabs: ["Plano e cobrança · Órbita", "Documentação", "Status"],
    url: "app.orbita.com.br/configuracoes/plano",
    nav: ["Início", "Relatórios", "Equipe", "Plano e cobrança", "Configurações"],
    heading: "Plano e cobrança",
    sub: "Você está no plano Equipe, renovado todo dia 12.",
    plans: [
      ["Inicial", "R$ 0", ["3 projetos", "1 GB"]],
      ["Equipe", "R$ 89", ["Projetos ilimitados", "50 GB"]],
      ["Empresa", "R$ 249", ["SSO e auditoria", "1 TB"]],
    ],
    current: "atual",
    upgrade: "Atualizar plano",
    usage: "Uso neste ciclo",
    usageRows: [
      ["Armazenamento", 0.72, "36 de 50 GB"],
      ["Membros", 0.9, "9 de 10"],
    ],
    tableHead: ["Data", "Descrição", "Valor", "Status"],
    invoices: [
      ["12 set", "Plano Equipe · setembro", "R$ 89,00"],
      ["12 ago", "Plano Equipe · agosto", "R$ 89,00"],
      ["12 jul", "Plano Equipe · julho", "R$ 89,00"],
    ],
    paid: "Pago",
  },

  meeting: {
    recording: "Gravando",
    title: "Revisão semanal · produto",
    people: ["Ana Ribeiro", "Rafael Souza", "Tiago Martins", "Caio Nunes", "Marcos Lima", "Diego Alves"],
  },

  camera: { meta: "Câmera · 1080p" },

  answer: {
    newChat: "Nova conversa",
    today: "Hoje",
    yesterday: "Ontem",
    history: [
      ["Resumo de março para a diretoria", "Tabela de reajustes"],
      ["E-mail para fornecedores", "Revisar contrato", "Roteiro do vídeo"],
    ],
    ask: "Resuma o relatório de março para a diretoria. Cinco tópicos, com os números.",
    title: "Resumo · março",
    lead: "O resultado do mês ficou em <b>R$ 133,9 mil</b>, 10,2% abaixo do previsto. A diferença se concentra em infraestrutura.",
    bullets: [
      ["Receita recorrente:", "R$ 428,4 mil, praticamente em linha com a meta."],
      ["Serviços:", "3% acima do previsto, puxados por dois contratos novos."],
      ["Infraestrutura:", "R$ 17,8 mil acima do orçamento, por causa da migração de servidores."],
      ["Folha e impostos:", "dentro do esperado."],
      ["Próximo passo:", "renegociar o contrato de nuvem antes de maio."],
    ],
    placeholder: "Escreva uma mensagem…",
  },
};

const en = {
  ui: {
    typed: "Rethinking writing on screen",
    themeToLight: "Switch to the light theme",
    themeToDark: "Back to the dark theme",
    shortcuts: [
      "Summons and hides Harp, from any app",
      "A quick draft on top of everything",
      "Write and point at the screen itself",
      "Ghost mode: clicks go through the window",
      "Disappears from recordings and screen sharing",
      "Less or more opacity",
      "Snaps to the corners",
      "Fills the whole screen",
      "Switch between notes",
      "Creates a task, or checks and unchecks it",
      "Teleprompter, with continuous scrolling",
      "A three-line band at the top of the screen",
      "Copies everything and clears",
      "Every shortcut, inside the app",
      "Rescue: undoes every mode",
    ],
  },

  code: {
    menu: "File&nbsp;&nbsp;Edit&nbsp;&nbsp;Selection&nbsp;&nbsp;View&nbsp;&nbsp;Run&nbsp;&nbsp;Terminal",
    search: "closing",
    explorer: "Explorer",
    project: "CLOSING",
    files: ["reconcile.py", "statements.py", "rules.py", "__init__.py"],
    tests: "tests",
    tabs: ["reconcile.py", "rules.py", "test_reconcile.py"],
    crumbs: "src › reconcile.py › reconcile_batch",
    branch: "main",
    position: "Ln 27, Col 32",
    source: `from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Iterable

from .statements import Entry, load_statement
from .rules import Rule, apply_rules


@dataclass(slots=True)
class Result:
    matched: list[tuple[Entry, Entry]] = field(default_factory=list)
    pending: list[Entry] = field(default_factory=list)

    @property
    def rate(self) -> float:
        total = len(self.matched) + len(self.pending)
        return len(self.matched) / total if total else 0.0


async def reconcile_batch(accounts: Iterable[str], rules: list[Rule],
                          tolerance: Decimal = Decimal("0.01")) -> Result:
    # Statements arrive in parallel; the order of the accounts is preserved.
    statements = await asyncio.gather(*(load_statement(a) for a in accounts))
    result = Result()
    for bank, ledger in zip(*statements, strict=True):
        pair = apply_rules(bank, ledger, rules)
        if pair and abs(pair[0].amount - pair[1].amount) <= tolerance:
            result.matched.append(pair)
        else:
            result.pending.append(bank)
    return result`,
  },

  editor: {
    modules: ["Develop", "Library", "Map", "Print"],
    file: "DSC_0412.ARW · 6000 × 4000",
    navigator: "Navigator",
    presets: "Presets",
    presetList: ["Landscape · soft", "Coast · late afternoon", "Black and white · high", "Film · 400"],
    histogram: "Histogram",
    meta: "ISO 100 · 70 mm · f/8 · 1/500 s",
    basic: "Basic",
    sliders: [
      ["Temperature", 0.56, "5,450"],
      ["Tint", 0.52, "+4"],
      ["Exposure", 0.61, "+0.35"],
      ["Contrast", 0.55, "+12"],
      ["Highlights", 0.29, "−42"],
      ["Shadows", 0.62, "+18"],
      ["Whites", 0.5, "0"],
      ["Blacks", 0.44, "−9"],
      ["Texture", 0.57, "+10"],
      ["Vibrance", 0.63, "+22"],
    ],
  },

  sheet: {
    decimal: ".",
    file: "closing_march.xlsx",
    saved: "Saved",
    ribbonTabs: ["File", "Home", "Insert", "Formulas", "Data", "Review", "View"],
    bold: "B",
    italic: "I",
    underline: "U",
    formats: ["Accounting", "% 0.0"],
    title: "Closing · March · in thousands",
    columns: ["Account", "Cost center", "Jan", "Feb", "Mar planned", "Mar actual", "Difference", "Var.", "Status"],
    rows: [
      ["Recurring revenue", "Sales", "412,300", "418,950", "431,000", "428,410", "−2,590", -0.6, "ok"],
      ["Services", "Sales", "86,120", "91,400", "95,000", "97,860", "2,860", 3.0, "ok"],
      ["Licenses", "Product", "38,900", "38,900", "39,500", "39,500", "0", 0.0, "ok"],
      ["Infrastructure", "Engineering", "−61,200", "−63,880", "−64,500", "−82,340", "−17,840", -27.7, "revisar"],
      ["Payroll", "People", "−198,400", "−198,400", "−203,000", "−202,110", "890", 0.4, "ok"],
      ["Marketing", "Sales", "−44,100", "−39,700", "−42,000", "−40,960", "1,040", 2.5, "ok"],
      ["Travel", "Operations", "−8,300", "−11,250", "−9,000", "−9,870", "−870", -9.7, "ok"],
      ["Tools", "Engineering", "−12,640", "−12,910", "−13,000", "−13,020", "−20", -0.2, "ok"],
      ["Consulting", "Finance", "−15,000", "−0", "−7,500", "−7,500", "0", 0.0, "ok"],
      ["Taxes", "Finance", "−71,230", "−73,500", "−76,300", "−75,980", "320", 0.4, "ok"],
    ],
    total: ["Result", "126,450", "149,610", "149,200", "133,950", "−15,250", "−10.2%"],
    status: { ok: "ok", revisar: "review" },
    sheets: ["Summary", "March", "Q1", "Assumptions"],
    sum: "Sum: −17,840",
  },

  slides: {
    kicker: "Results · third quarter",
    title: "Retention by cohort went up, but not in every region",
    legend: ["Southeast", "Northeast"],
    callout: "+18 pts in August",
    kpis: [
      ["61%", "retention at 90 days"],
      ["+7 pts", "against the second quarter"],
      ["3.4×", "return on acquisition"],
    ],
    source: "Source: internal data · cohorts from March to August 2026",
  },

  video: { chapter: "Climbing up to the lake" },

  timeline: {
    bin: "Project media",
    items: "14 items",
    sequence: "Sequence 03 · 24 fps",
    titles: ["Title · beach", "Caption"],
  },

  doc: {
    style: "Normal",
    comments: "Comments (2)",
    title: "Services agreement",
    sub: "Version 3 · legal review",
    clauses: [
      ["4.", "The delivery term starts from the approval of the scope, and any later change is recorded in writing by both parties."],
      ["5.", 'Files produced during the project belong to the client from full payment onwards, <mark>including intermediate versions</mark>.'],
      ["6.", "Either party may terminate the agreement with thirty days of notice, at no cost."],
      ["7.", "Anything not covered here is settled in the client's jurisdiction."],
    ],
    note: ["Julia", "Does that include the raw files?"],
  },

  browser: {
    brand: "Orbita",
    tabs: ["Plan and billing · Orbita", "Documentation", "Status"],
    url: "app.orbita.com/settings/plan",
    nav: ["Home", "Reports", "Team", "Plan and billing", "Settings"],
    heading: "Plan and billing",
    sub: "You are on the Team plan, renewed on the 12th.",
    plans: [
      ["Starter", "$0", ["3 projects", "1 GB"]],
      ["Team", "$19", ["Unlimited projects", "50 GB"]],
      ["Business", "$49", ["SSO and audit log", "1 TB"]],
    ],
    current: "current",
    upgrade: "Upgrade plan",
    usage: "Usage this cycle",
    usageRows: [
      ["Storage", 0.72, "36 of 50 GB"],
      ["Members", 0.9, "9 of 10"],
    ],
    tableHead: ["Date", "Description", "Amount", "Status"],
    invoices: [
      ["Sep 12", "Team plan · September", "$19.00"],
      ["Aug 12", "Team plan · August", "$19.00"],
      ["Jul 12", "Team plan · July", "$19.00"],
    ],
    paid: "Paid",
  },

  meeting: {
    recording: "Recording",
    title: "Weekly review · product",
    people: ["Ana Ribeiro", "Rafael Souza", "Tiago Martins", "Caio Nunes", "Marcos Lima", "Diego Alves"],
  },

  camera: { meta: "Camera · 1080p" },

  answer: {
    newChat: "New chat",
    today: "Today",
    yesterday: "Yesterday",
    history: [
      ["March summary for the board", "Salary adjustment table"],
      ["Email to suppliers", "Review the agreement", "Video script"],
    ],
    ask: "Summarize the March report for the board. Five bullets, with the numbers.",
    title: "Summary · March",
    lead: "The month came in at <b>133.9k</b>, 10.2% below plan. The gap is concentrated in infrastructure.",
    bullets: [
      ["Recurring revenue:", "428.4k, essentially in line with the target."],
      ["Services:", "3% above plan, pulled up by two new contracts."],
      ["Infrastructure:", "17.8k over budget, because of the server migration."],
      ["Payroll and taxes:", "as expected."],
      ["Next step:", "renegotiate the cloud contract before May."],
    ],
    placeholder: "Write a message…",
  },
};

export const L = document.documentElement.lang.startsWith("en") ? en : pt;

/** Prefixo das imagens e dos vídeos, para a página que não está na raiz. */
export const ROOT = document.documentElement.dataset.root || "";
