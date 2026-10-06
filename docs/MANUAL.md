# Harp — manual de comportamento

Tudo o que o Harp faz, e **como** ele se comporta em cada caso. Este documento é
a referência de funcionamento: quem for escrever um tutorial, uma página do
site ou um texto de ajuda encontra aqui a verdade sobre cada recurso.

- Para as **decisões** e o porquê de cada uma: [ARCHITECTURE.md](ARCHITECTURE.md)
- Para a **identidade** e o tom de voz: [IDENTIDADE.md](IDENTIDADE.md)
- Para **distribuição** e atualização: [DISTRIBUICAO.md](DISTRIBUICAO.md)

> **Tese do produto:** escrita centrada no contexto. Anotar não pode custar o
> que você está olhando. Tudo aqui serve a isso — e o que não serve, não entra.

---

## 1. A janela

A janela principal não tem barra de título, nem bordas, nem botões de sistema.

| Comportamento | Como funciona |
|---|---|
| **Sempre no topo** | Ligado de fábrica. `Ctrl+P` alterna. O chip "Topo" na barra mostra o estado. |
| **Transparência real** | Não é desfoque: é a tela de baixo aparecendo. `Ctrl+[` e `Ctrl+]` mudam em 10%; com `Shift`, em saltos de 50%. O valor fica na barra. |
| **Arrastar** | Por qualquer área vazia da janela — não há barra para pegar. |
| **Redimensionar** | Pelas bordas com o mouse, ou `Ctrl+Alt+Shift+setas` (40 px por toque). |
| **Esmaecer parada** | Sem foco e sem uso, a janela desbota sozinha. Opcional nas configurações. Qualquer tecla ou o mouse por cima traz de volta. |
| **Fechar** | `Ctrl+Q`, ou fechar a janela. O texto é salvo antes. Fechar encerra o Harp inteiro, inclusive o ícone da bandeja. |

### Posicionamento por teclado

Consciente de vários monitores e de escala de tela (125%, 150%): a janela vai
para o monitor onde ela está, e não para o primário.

| Atalho | Onde |
|---|---|
| `Ctrl+Alt+1` … `4` | Os quatro cantos |
| `Ctrl+Alt+5` | Topo, centralizada |
| `Ctrl+Alt+6` … `9` | Metade esquerda, direita, superior, inferior |
| `Ctrl+Alt+0` | Tela inteira |

**As duas filas de números valem**, a de cima e a do teclado numérico, aqui e em
qualquer outro atalho com dígito.

### Os três modos de presença

| Modo | O que muda | Atalho |
|---|---|---|
| **Topo** | A janela fica acima das outras | `Ctrl+P` |
| **Fantasma** | O mouse **atravessa** a janela: cliques vão para o app de baixo. A janela também perde o foco de teclado assim que você clica fora. | `Ctrl+Shift+G` |
| **Oculto** | A janela some de gravações e chamadas — OBS, Zoom, Teams, Meet. Continua visível para você. | `Ctrl+Shift+H` |

Os três aparecem como chips na barra inferior, cada um com um ponto que acende
quando está ligado. Podem ser escondidos individualmente no menu `⋯`.

**O modo Oculto depende do Windows.** Se a tentativa falhar na sua máquina, o
Harp avisa em voz alta — *"Não foi possível ocultar: você APARECE na gravação"* —
e só então desativa o botão. Ele nunca nasce desligado por suspeita: um aviso
errado faria você acreditar que está escondido quando não está.

### Resgate

`Ctrl+Alt+G`, **global**: desfaz fantasma e oculto, traz a janela de volta para
a área visível e devolve o foco. Funciona com a janela fora da tela, atrás de
tudo ou atravessável.

Se outro programa já usar esse atalho, o Harp registra `Ctrl+Alt+Shift+G` e
mostra em todos os avisos qual ficou valendo.

---

## 2. Escrever

O editor é de texto puro. Não há estilos, tabelas nem exportação — o arquivo
que sai é o mesmo texto que você vê.

| Recurso | Como funciona |
|---|---|
| **Autosave** | Contínuo, com teto: no máximo a cada 2 segundos, e sempre ao fechar. |
| **Tamanho do texto** | `Ctrl+=` e `Ctrl+−`, ou os botões `A−`/`A+` na barra. |
| **Fonte** | Oito opções embutidas nas configurações. Nenhuma vem da internet. |
| **Atalhos de edição** | Os do VS Code: mover linha (`Alt+setas`), duplicar (`Alt+Shift+setas`), multi-cursor (`Alt+clique`), busca (`Ctrl+F`). |
| **Colar** | Sempre como texto puro. Espaços invisíveis e caracteres de largura zero que vêm de páginas web são removidos. |
| **Links** | Endereços viram links sublinhados. `Ctrl+clique` abre no navegador. |
| **Copiar tudo e limpar** | `Ctrl+Shift+Enter` copia e esvazia a anotação, para o ciclo de escrever prompts. `Ctrl+Z` desfaz. |
| **Arquivos** | `Ctrl+O` abre `.txt` e `.md`; `Ctrl+S` salva; `Ctrl+Shift+S` salva como. |

### Markdown sem os sinais à vista

Os marcadores (`#`, `**`, `_`, crases, `>`) **somem das linhas em que ninguém
está mexendo** e voltam inteiros assim que o cursor chega naquela linha. O texto
continua sendo Markdown de verdade: nada é escondido do arquivo, e nenhuma tecla
edita algo que não esteja na tela.

`Ctrl+Shift+M` desliga, para quem escreve Markdown a sério e quer ver o que
digitou.

O marcador de lista **fica sempre**: ele não é sintaxe sobrando, é o que mostra
que aquilo é uma lista.

### Listas

- `-` vira um travessão largo e firme; `1.` fica em negrito. Com o resto do
  Markdown escondido, eles são o único sinal de que a lista pegou.
- `Enter` continua a lista sozinho; `Enter` num item vazio sai dela.
- `Tab` entra um nível, `Shift+Tab` sai. Um nível são quatro espaços.
- **Numa lista numerada, o subitem vira alfabético:** `a.`, `b.`, `c.` Saindo do
  subitem, a contagem de números continua de onde parou — `3.`, e não `1.`

```
1. abrir o projeto
2. conferir as contas
    a. saldo
    b. extrato
3. fechar o mês
```

> `a.` não é lista para o Markdown oficial: outro programa mostra aquela linha
> como texto comum. É uma escolha a favor de quem escreve — dentro do Harp a
> continuação funciona igual à das outras listas.

### Tarefas

`Ctrl+Enter` numa linha qualquer cria `- [ ] `; numa tarefa, marca e desmarca.
Na tela aparece só a caixa, que aceita clique. Tarefa concluída fica esmaecida.

O arquivo continua com `- [ ]` e `- [x]` escritos: qualquer outro editor lê as
mesmas tarefas, e copiar a linha leva o Markdown junto.

### Conta na linha

Uma linha que **termina em `=`** mostra o resultado ao lado, destacado. Um `?`
depois do `=` é aceito.

```
- [ ] Pão = 5,60 * 4 =            22,40
- [ ] Cerveja = 3,59 * 12 =       43,08
Total = 5,6 + 11 + 67,9 + 43,08 = 127,58
```

**Variáveis.** Uma linha com `rótulo = valor` passa a dar nome àquele valor, e
outras linhas podem usá-lo entre colchetes:

```
- [ ] Pão = 5,60 * 4 =                             22,40
- [ ] Manteiga = 11,00
Total = [Pão] + [Manteiga] + [Carne] + [Cerveja] = 144,38
P/ cada = [Total] / 4 =                            36,10
```

Regras do comportamento:

| Regra | Porquê |
|---|---|
| **Nunca escreve sozinho.** O resultado é sugestão à vista; `Ctrl+Alt+Enter` transforma em texto. | Um número que entra no arquivo sem ninguém pedir é pior do que abrir a calculadora. |
| **Exige um operador.** `Total = 42 =` não mostra nada. | Não é uma conta por resolver. |
| **A vírgula manda.** Havendo vírgula, ela é o decimal e o ponto é separador de milhar (`1.250,40`); sem vírgula nenhuma, o ponto é o decimal (`3.59`). | É como as duas escritas aparecem numa anotação de verdade. |
| **Dinheiro com duas casas:** `22,40`, não `22,4`. Resultado redondo sai sem casas. | `22,4` é um número solto; `22,40` é um preço. |
| **Um nome só vale depois de definido**, nas linhas de cima. | Olhar só para trás é o que torna impossível uma conta depender de si mesma. |
| **Nome desconhecido não mostra nada**, em vez de mostrar zero. | Um zero inventado entra numa soma sem avisar. |

Entende `+ − * / ( ) %`, além de `×` e `÷`. Não existe `eval`: há um analisador
próprio, porque o texto pode vir de um arquivo que você abriu.

Os colchetes de um nome somem como os outros sinais do Markdown quando o cursor
está em outra linha — a linha se lê `Total = Pão + Manteiga + …`, e os colchetes
voltam quando você entra nela.

---

## 3. Abas

Até **dez anotações**, em abas discretas no topo da janela.

| Comportamento | Como funciona |
|---|---|
| **Trocar** | `Ctrl+1` … `Ctrl+9`, e `Ctrl+0` para a décima. Ou clique. |
| **Nova / fechar** | `Ctrl+T` / `Ctrl+W`. |
| **Desfazer por aba** | Cada anotação tem o próprio histórico de `Ctrl+Z`. |
| **Recolher** | Depois de três segundos sem trocar de aba — ou assim que você começa a escrever — as abas viram só o ícone. O mouse por perto traz tudo de volta. |
| **Ícone** | Cada aba pode ter um, entre 30 categorias fixas. Clicar no ícone da **aba ativa** abre o seletor; nas outras, o clique só seleciona a aba. |

### O seletor de ícone

Três grupos: **sugeridos** pelo texto da aba, **recentes** (os que você mais
usa) e **todos**. O nome do ícone sob o mouse aparece no rodapé do seletor.

As sugestões são locais e deterministas — **nada vai para a internet**. São
contagem de palavras e de estrutura no texto da aba: uma linha com `- [ ]` puxa
"tarefas", `R$` puxa "dinheiro", muitas palavras em inglês puxam "código". A
mesma anotação sugere sempre os mesmos ícones.

O painel se adapta ao formato da janela: faltando altura, a grade se espalha
para os lados (de 5 a 10 colunas); numa janela alta e estreita, volta a ser
vertical. O que não couber, rola.

---

## 4. Barra inferior

| Elemento | O que é |
|---|---|
| **Contagens** | Palavras, caracteres, linhas, tokens (aproximado) e páginas A4/ABNT (aproximado). |
| **Opacidade** | O valor atual, e um ponto que indica o esmaecer automático. |
| **Tamanho do texto** | `A−`, o número, `A+`. |
| **Chips de estado** | Topo, Fantasma, Oculto. |
| **Teleprompter** | Play/pausa, velocidade, faixa, palco. |
| **Rascunhos** | Atalho para os rascunhos recentes. |
| **`⋯`** | Escolhe o que aparece na barra. Tudo é opcional, inclusive os chips. |
| **Engrenagem** | Configurações. Um ponto na cor de destaque avisa que há versão nova. |
| **`?`** | O painel de atalhos (`Ctrl+/`). |

Numa janela estreita, a barra se adapta sozinha: abaixo de 520 px os chips
perdem o rótulo e ficam só com o ponto colorido; abaixo de 400 px, só a primeira
contagem continua.

---

## 5. Histórico e segurança do texto

| Recurso | Como funciona |
|---|---|
| **Versões anteriores** | `Ctrl+Shift+V` abre o histórico local da anotação. Serve para recuperar texto perdido. |
| **Backup** | O texto é gravado com cópia de segurança; uma falha no meio da gravação não leva o arquivo junto. |
| **Aviso de gravação** | Quando o Harp percebe um programa de gravação ou chamada em andamento, ele lembra que você pode se ocultar. |

---

## 6. Teleprompter

Para ler um texto na frente da câmera.

| Atalho | Ação |
|---|---|
| `Ctrl+Alt+P` | Liga e desliga |
| `Ctrl+Alt+N` | Modo faixa: a janela vira uma tira fina |
| `Ctrl+Alt+F` | Tela cheia |
| Espaço, setas | Controlam a rolagem (no teleprompter, as teclas simples são da leitura) |

Começa parado, nunca rolando sozinho. Chegar ao fim do texto **pausa**, e não
encerra — o modo continua ligado para você retomar. Sair devolve a janela ao
tamanho e à posição de antes.

---

## 7. Rascunhos (`Win+J`)

Um campo pequeno e translúcido que abre **sobre qualquer aplicativo**, sem tirar
você de onde estava.

- `Enter` guarda, copia para a área de transferência e devolve o foco ao
  programa anterior.
- `Esc` fecha sem guardar.
- Os **dez últimos** ficam acessíveis na janela principal com `Ctrl+J`.
- **Somem ao encerrar o Harp.** Nunca vão para o disco — são memória curta de
  propósito.

---

## 8. Vidro (`Win+Alt+V`)

Uma camada transparente sobre o monitor inteiro, para escrever e apontar sobre
o que está na tela.

| Ferramenta | Tecla |
|---|---|
| Texto | `1` |
| Seta | `2` |
| Retângulo | `3` |
| Círculo | `4` |
| Próxima cor | `5` |
| Recorte da área a copiar | `R` |

| Ação | Como |
|---|---|
| **Proporção travada** | `Shift` ao desenhar: seta em 45°, retângulo e círculo proporcionais |
| **Mover o selecionado** | Setas (1 px) ou `Shift+setas` (10 px) |
| **Duplicar** | `Ctrl+C` e `Ctrl+V` — copia o objeto, que continua editável |
| **Apagar** | `Delete` |
| **Desfazer / refazer** | `Ctrl+Z` / `Ctrl+Y` |
| **Copiar e sair** | `Ctrl+Shift+Enter` |
| **Sair sem copiar** | `Esc` |

**Cores.** As sete cores de destaque do próprio Harp, no tom do tema em que ele
está. Cada sessão começa na cor escolhida nas configurações. O texto vira uma
etiqueta com letra preta ou branca — a que contrastar mais — e por isso fica
legível sobre qualquer fundo.

**Sombra.** Cada anotação leva uma sombra difusa, clara ou escura conforme a
cor. Ela separa o desenho do fundo (uma seta branca sobre uma página branca não
pode sumir) e faz a anotação parecer pousada sobre a tela.

**Recorte.** `R` marca o pedaço que vai para a área de transferência; o resto
escurece. `R` de novo volta à tela inteira. Anotar continua valendo na tela toda
— só o que é copiado encolhe. Serve para programas cheios de barras, em que o
assunto ocupa menos da metade do monitor.

**A barra flutuante** pode ser arrastada pela alça de pontinhos, para sair da
frente do que você quer anotar.

**O que o Vidro não é:** não salva arquivo, não guarda histórico, não desfoca,
não tem camadas. Ele copia uma imagem com os cantos arredondados e devolve você
ao programa onde estava. Nenhuma janela do Harp aparece na imagem.

---

## 9. Bandeja e início com o Windows

O Harp tem ícone na bandeja do sistema. Clicar traz a janela; o menu dá acesso a
**Mostrar o Harp**, **Rascunho**, **Vidro** e **Sair**, no idioma do app e com
os atalhos que valem de fato naquela máquina.

Nas configurações, **Iniciar com o Windows**: ligado, o Harp sobe escondido ao
ligar o computador — só na bandeja, nada na barra de tarefas — com os atalhos
globais já funcionando. Quem liga o computador não pediu uma janela, pediu os
atalhos prontos.

O estado desse botão vem do próprio Windows, e não das preferências do Harp: se
você desligar a inicialização pelo Gerenciador de Tarefas, o painel mostra
desligado.

---

## 10. Configurações (`Ctrl+,`)

Idioma (português, inglês, espanhol), fonte, tamanho do texto, esmaecer quando
parado, tema (claro, escuro ou do sistema), cor de destaque, atalhos globais,
iniciar com o Windows e atualização — nesta ordem. A atualização fica por
último: é a única seção que não muda a experiência de escrever.

`Ctrl+Shift+B` alterna claro e escuro direto, sem abrir nada.

**Atalhos globais** podem ser trocados ali. O Harp registra o que estiver livre
na sua máquina e mostra o que ficou valendo — atalhos globais são disputados, e
ensinar um atalho que não funciona é pior do que não ensinar nenhum.

---

## 11. Atualização

O Harp é distribuído fora de loja, então ele mesmo procura versão nova: trinta
segundos depois de abrir, a cada seis horas, e ao voltar para a janela depois de
uma hora ou mais sem olhar. Nas configurações há um botão para procurar na hora.

É a **única vez que o Harp fala com a internet**: baixa um arquivo de 650 bytes
no GitHub e compara o número da versão. Não envia nada.

Como ele avisa:

- **Nenhuma janela.** Um ponto na cor de destaque aparece sobre a engrenagem, e
  nada mais. Sem som, sem pergunta, sem interrupção.
- **O aviso do reinício vem antes do clique**, e não depois: o app fecha e abre
  de novo para atualizar, e você escolhe a hora.
- **Nunca instala sozinho.**
- **Falha calada** — exceto quando você aperta o botão: aí "você já está na
  versão mais recente" e "não foi possível verificar agora" são respostas
  diferentes, e as duas aparecem.

---

## 12. Privacidade e dados

- **Tudo é local.** Não há conta, nuvem, sincronização nem telemetria.
- **Não há IA dentro.** As sugestões de ícone são contagem de palavras.
- **A única conexão** é a checagem de versão nova, descrita acima.
- Os textos ficam em arquivos na pasta de dados do app; os rascunhos do `Win+J`
  nunca tocam o disco.
