# Um universo para a minha princesa 💙

Esta é a edição ampliada do site para Maria Eduarda. São **8 páginas**, **11 fotos originais**, **8 cartas**, **60 motivos**, **8 envelopes “abra quando”** e **4 brincadeiras**, além dos contadores e das surpresas.

Tudo em azul e preto, com adaptação para computador, tablet e celular. Usa somente HTML, CSS e JavaScript, com as fotos dentro da pasta. Não precisa instalar nada nem fazer build.

## Abrir agora no computador

1. Extraia o ZIP em uma pasta.
2. Abra o `index.html` no Chrome, Edge, Firefox ou Safari atualizado.
3. Use o menu para passear pelos oito capítulos.

Mantenha os arquivos juntos. Abra o HTML extraído, em vez de tentar navegar dentro do ZIP.

## Publicar ou atualizar no GitHub Pages

1. No GitHub, crie um repositório como `para-minha-princesa` ou abra aquele em que publicou a versão anterior. Em uma conta GitHub Free, use um repositório **Public**.
2. Vá em **Add file → Upload files** e envie os **arquivos extraídos** e a pasta `assets`.
3. O `index.html` deve aparecer na raiz do repositório, ao lado de `style.css`, `script.js`, `conteudo.js` e dos outros arquivos HTML.
4. Confirme em **Commit changes**.
5. Entre em **Settings → Pages**.
6. Em **Source**, escolha **Deploy from a branch**.
7. Escolha a branch **main**, a pasta **/(root)** e clique em **Save**.
8. Aguarde o endereço aparecer na tela de Pages. Se Pages já estava configurado, basta aguardar a atualização.

O endereço terá o formato `https://SEU-USUARIO.github.io/para-minha-princesa/`.

**Envie o conteúdo do ZIP, não o ZIP fechado.** Os arquivos novos devem substituir os arquivos de mesmo nome da versão anterior. Preserve a pasta `assets/fotos/`.

O GitHub Pages gera um link público com as fotos e os textos. O pedido `noindex` não cria senha nem acesso privado.

Referência: [publicar por uma branch no GitHub Pages](https://docs.github.com/pt/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Os oito capítulos

| Página | O que tem nela |
| --- | --- |
| `index.html` | A entrada do universo, fotos, contador ao vivo, bilhetes, primeiros “te amo”, carta e próximas datas |
| `historia.html` | Os seis acontecimentos, calendário de setembro/outubro e tempo desde o começo |
| `album.html` | Onze fotos, filtros, favoritos, visualizador com teclado/toque e apresentação opcional |
| `cartas.html` | Oito cartas completas, escolha de carta e tamanho de leitura ajustável |
| `motivos.html` | Sessenta mensagens, busca, filtros, mais motivos e sorteio de bilhetinhos |
| `jogos.html` | Memória com seis pares, quiz de oito perguntas, história em ordem e recado em bits |
| `futuro.html` | Próximos marcos, lista de planos, carta para o futuro e rascunho que pode ser baixado |
| `surpresas.html` | Céu com sete estrelas, flor azul interativa, oito envelopes e cartão para baixar em PNG |

No canto inferior, **“O seu jeitinho”** permite escolher pétalas, estrelinhas ou nenhum movimento. Também tem uma sequência suave de notas instrumentais criada pelo próprio código do site. O som começa só quando a pessoa liga e pausa ao sair da página.

## Onde editar

### Conteúdos interativos: `conteudo.js`

O arquivo tem comentários para ajudar. É onde ficam:

- `inicio`: data e hora da primeira conversa.
- `primeiroEncontro`: data do encontro, sem inventar um horário.
- `aniversario`: dia e mês do aniversário.
- `marcos`: os seis acontecimentos, seus títulos e textos.
- `fotos`: caminhos, legendas, descrições e categorias do álbum.
- `frases`: bilhetes da página inicial.
- `motivos`: os sessenta textos e suas categorias.
- `quiz`: perguntas, opções, índice da resposta correta e mensagem de carinho.
- `planos`: sugestões iniciais da lista de desejos.
- `estrelas`: mensagens da constelação.
- `cartas`: títulos e parágrafos das oito cartas.
- `envelopes`: os textos dos oito “abra quando”.

Preserve as aspas, vírgulas e colchetes ao editar. As respostas do quiz começam em **0**: `resposta: 0` significa a primeira opção.

### Títulos e textos de apresentação: os arquivos HTML

Abra o HTML do capítulo correspondente e procure a frase que quer mudar. A página inicial está em `index.html`.

As cartas, a história e os envelopes também têm uma cópia legível no HTML para quem desativar JavaScript. Se mudar esses textos em `conteudo.js` e quiser manter esse suporte, atualize a cópia no respectivo HTML. Com JavaScript ligado, os componentes interativos usam `conteudo.js`.

Se trocar alguma das datas principais, atualize também as menções escritas nas páginas e as perguntas do quiz para manter tudo coerente.

### Aparência: `style.css`

As cores ficam no começo, dentro de `:root`:

```css
--bg: #080f1e;       /* fundo */
--blue: #a7c8fc;     /* azul dos detalhes */
--text: #f4f0e8;     /* texto principal */
--muted: #a9b7cc;    /* texto secundário */
```

Os ajustes para telas menores estão no final do arquivo, em `@media`.

### Fotos: `assets/fotos/`

Para trocar uma foto, substitua o arquivo mantendo o mesmo nome. Os originais enviados foram copiados sem recompressão, filtros novos ou alterações no rosto. As fotos abrem inteiras no visualizador.

Se usar outro tamanho ou outro arquivo, ajuste `src`, `w`, `h` e `alt` na lista `fotos`, dentro de `conteudo.js`. Atualize também a imagem correspondente no HTML para manter a versão sem JavaScript e as prévias da página inicial consistentes.

## Como os contadores funcionam

O instante inicial é **14/09/2026 às 20:49 no horário de Brasília**:

```js
inicio: '2026-09-14T20:49:00-03:00'
```

O relógio mostra dias completos, horas, minutos e segundos. Os meses são calculados pelo calendário. O fuso está explícito para manter o mesmo instante em aparelhos de outros países.

As datas de 100 dias, 2 meses, 3 meses, 6 meses e 1 ano usam esse início. O aniversário usa **28 de julho**. Os dias desde o primeiro encontro são calculados pela data de calendário de **03/10/2026**, sem assumir a hora do encontro.

O relógio continua certo ao reabrir o site porque é recalculado pela data de início. O relógio do aparelho precisa estar correto.

## O que fica salvo no aparelho

- Fotos favoritas.
- Preferência de efeitos e tamanho das cartas.
- Envelopes já abertos.
- Planos marcados e planos adicionados.
- Rascunho do recado para o futuro.

Essas informações ficam **somente no navegador e aparelho em uso**. Elas não são enviadas para você, não têm login e não se sincronizam entre celulares ou computadores. Limpar os dados do navegador pode apagá-las.

O recadinho do futuro pode ser baixado como `.txt`, e o cartão da página de surpresas pode ser baixado como `.png`.

## Navegação e acessibilidade

- Menu adaptado para telas menores.
- Botões utilizáveis por teclado e foco visível.
- Fotos com descrições acessíveis.
- Visualizador com Escape, setas, toque e opção de pausar a apresentação.
- Cartas e envelopes com abertura nativa por toque ou teclado.
- Respeito à configuração de reduzir movimentos do aparelho.
- Som sempre opcional e iniciado por um toque.

## Organização dos arquivos

Os **8 arquivos HTML**, `style.css`, `script.js`, `conteudo.js`, `logica.js`, `README.md`, `.nojekyll` e a pasta `assets` devem permanecer juntos. Os caminhos relativos permitem publicar dentro do endereço de um repositório no GitHub Pages.

Não é necessário servidor próprio, banco de dados, chave de API ou biblioteca externa.
