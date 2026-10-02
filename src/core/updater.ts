/**
 * Atualizacao dentro do app.
 *
 * O Harp e distribuido fora de loja, entao ninguem atualiza por voce: sem isto,
 * cada correcao dependeria da pessoa lembrar de visitar o repositorio. A versao
 * mais recente e descrita num `latest.json` publicado junto do release, e o
 * instalador vem assinado com uma chave que so existe no GitHub Actions — quem
 * trocasse o arquivo no caminho nao conseguiria assina-lo.
 *
 * A checagem e silenciosa de proposito. Um app que promete nao interromper nao
 * pode abrir uma janela avisando que existe versao nova: aparece um ponto na
 * barra, e a pessoa clica quando quiser.
 */

import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/**
 * Espera antes da primeira checagem.
 *
 * Abrir o app e o momento em que a pessoa quer escrever. A rede pode esperar
 * meio minuto.
 */
const FIRST_CHECK_MS = 30_000;

/** Entre checagens, para quem deixa o app aberto por dias. */
const INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Intervalo minimo entre checagens oportunistas.
 *
 * O Harp fica aberto por dias, e so olhava a cada seis horas: uma versao
 * publicada de manha podia so aparecer a noite. Voltar para a janela depois de
 * um tempo e um bom momento para olhar de novo — mas nao a cada clique. **[D]**
 */
const OPPORTUNISTIC_MS = 60 * 60 * 1000;

export interface UpdateInfo {
  version: string;
  notes?: string;
}

/** Como terminou uma busca pedida pela pessoa. */
export type CheckResult = "found" | "none" | "failed";

/**
 * Procura uma versao nova sem incomodar.
 *
 * Erro aqui nunca vira aviso: falta de rede, GitHub fora do ar ou release
 * malformado nao sao problema de quem so queria anotar alguma coisa.
 */
async function look(): Promise<{ ok: true; update: Update | null } | { ok: false }> {
  try {
    return { ok: true, update: await check() };
  } catch (error) {
    console.error("[harp] falha ao procurar atualizacao", error);
    return { ok: false };
  }
}

export interface UpdateWatcher {
  /** Versao encontrada, ou null enquanto nao houver nenhuma. */
  pending(): UpdateInfo | null;
  /**
   * Procura agora, a pedido da pessoa, e diz o que aconteceu.
   *
   * A busca silenciosa engole erro de proposito; esta nao pode: quem clicou
   * num botao precisa saber se a resposta e "nao tem" ou "nao deu para olhar".
   */
  checkNow(): Promise<CheckResult>;
  /**
   * Baixa, instala e reinicia. So retorna em caso de falha — no caminho feliz o
   * app e substituido antes disso.
   */
  install(onProgress: (fraction: number) => void): Promise<void>;
}

/**
 * Passa a vigiar novas versoes e avisa o chamador quando achar uma.
 *
 * Em desenvolvimento nao ha nada para achar (o `latest.json` fala de versoes
 * publicadas), entao a checagem simplesmente nao encontra nada e o ponto nunca
 * aparece.
 */
export function watchForUpdates(onFound: () => void): UpdateWatcher {
  let found: Update | null = null;

  let ultima = 0;

  const procurar = async (): Promise<CheckResult> => {
    if (found) return "found";
    ultima = Date.now();
    const resposta = await look();
    if (!resposta.ok) return "failed";
    found = resposta.update;
    if (!found) return "none";
    onFound();
    return "found";
  };

  window.setTimeout(() => {
    void procurar();
    window.setInterval(() => void procurar(), INTERVAL_MS);
  }, FIRST_CHECK_MS);

  // Voltar para a janela depois de um tempo longe conta como "agora e uma boa
  // hora de olhar" — contanto que nao tenha olhado na ultima hora.
  const aoVoltar = () => {
    if (document.hidden || found) return;
    if (Date.now() - ultima < OPPORTUNISTIC_MS) return;
    void procurar();
  };
  window.addEventListener("focus", aoVoltar);
  document.addEventListener("visibilitychange", aoVoltar);

  return {
    pending: () => (found ? { version: found.version, notes: found.body } : null),
    checkNow: procurar,
    install: async (onProgress) => {
      if (!found) return;

      let baixado = 0;
      let total = 0;

      await found.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          baixado += event.data.chunkLength;
          onProgress(total > 0 ? baixado / total : 0);
        } else if (event.event === "Finished") {
          onProgress(1);
        }
      });

      // O instalador ja rodou; reiniciar e o que faz a versao nova aparecer.
      await relaunch();
    },
  };
}
