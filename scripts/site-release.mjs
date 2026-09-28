/**
 * Escreve a versao e o tamanho do instalador nas paginas do site.
 *
 * Roda na publicacao, e nao no navegador de quem visita **[D]**: o site promete
 * nao pedir nada a ninguem, e buscar a versao na API do GitHub a cada visita
 * seria exatamente uma chamada a terceiros — a mesma que o app evita. Aqui o
 * numero entra no HTML antes de ele sair do runner, e quem le nao pede nada.
 *
 * Uso: node scripts/site-release.mjs <tag> <bytes> [arquivo...]
 *
 * Sem release publicado, ou com argumentos vazios, o trecho fica em branco e a
 * pagina continua valendo: a versao e um detalhe, nao uma promessa.
 */

import { readFileSync, writeFileSync } from "node:fs";

const [tag = "", bytes = "", ...files] = process.argv.slice(2);
const alvos = files.length ? files : ["site/index.html", "site/en/index.html"];

/** Tamanho como o navegador mostra na barra de download: MB decimal. */
function tamanho(bruto, locale) {
  const n = Number(bruto);
  if (!Number.isFinite(n) || n <= 0) return "";
  const mb = n / 1e6;
  return `${mb.toFixed(1).replace(".", locale === "en" ? "." : ",")} MB`;
}

for (const arquivo of alvos) {
  let html;
  try {
    html = readFileSync(arquivo, "utf8");
  } catch {
    console.log(`sem ${arquivo}, pulando`);
    continue;
  }

  const locale = /<html[^>]+lang="en"/.test(html) ? "en" : "pt";
  const partes = [tag, tamanho(bytes, locale)].filter(Boolean);
  const texto = partes.length ? ` · ${partes.join(" · ")}` : "";

  const antes = html;
  html = html.replace(
    /(<span class="download__release" data-release>)[\s\S]*?(<\/span>)/,
    (_, abre, fecha) => abre + texto + fecha,
  );

  if (html === antes) {
    console.log(`marcador nao encontrado em ${arquivo}`);
    continue;
  }

  writeFileSync(arquivo, html);
  console.log(`${arquivo}: "${texto.trim() || "(vazio)"}"`);
}
