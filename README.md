# Kurio — Marketplace de NFTs (Frontend Challenge)

Implementação frontend do desafio "NFT Marketplace": descoberta, compra e conta do
colecionador, com APIs, autenticação, carteiras, pagamentos e tempo real **simulados**
inteiramente no navegador (sem backend real). Ver [ARCHITECTURE.md](./ARCHITECTURE.md)
para contratos, decisões de arquitetura e limitações.

## Stack

React · TypeScript · Vite · TanStack Router · TanStack Query · Axios · Tailwind CSS ·
shadcn/ui · MSW (REST + Socket.IO) · socket.io-client · Playwright · Lighthouse.

## Setup

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Os mocks (MSW) sobem automaticamente — não há
backend para configurar.

### Variáveis de ambiente

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` (qualquer valor ≠ `"false"`) | Liga a camada de mocks (MSW + Socket.IO simulado) e o painel de cenários. Fica ligada também no build de produção/demonstração — só desligue explicitamente com `VITE_ENABLE_MOCKS=false` se algum dia existir uma API real para apontar. |

Crie um `.env.local` apenas se quiser desligar os mocks; não é necessário para rodar o projeto.

### Credenciais fictícias

| E-mail | Senha | Observação |
| --- | --- | --- |
| `collector@kurio.app` | `kurio123` | 2 carteiras cadastradas (principal + reserva) |
| `artlover@kurio.app` | `kurio123` | 1 carteira cadastrada |

Também é possível criar uma conta nova pela tela de Cadastro — persiste no `localStorage`
do navegador (ver "Reset de cenários" abaixo).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Type-check (`tsc -b`) + build de produção |
| `npm run preview` | Serve o build de produção localmente (usado pelos testes E2E e pelo Lighthouse) |
| `npm run typecheck` | Só type-check, sem build |
| `npm run lint` | Lint (oxlint) |
| `npm run test:e2e` | Testes Playwright (builda o preview automaticamente) |
| `npm run test:e2e:update` | Atualiza os baselines de regressão visual |
| `npm run test:e2e:report` | Abre o último relatório HTML do Playwright |
| `npm run lighthouse` | Builda, sobe o preview e audita Início + Detalhe do NFT (mobile e desktop, 3 execuções cada) |
| `npm run generate:assets` | Regenera as artes/avatares placeholder (ver "Assets" no ARCHITECTURE.md) |

## Cenários de mock (seleção e reset)

Um botão flutuante (canto inferior direito, ícone de engrenagem) abre o **painel de
cenários de mock** — disponível em dev e no build de produção/demo (não é uma
devtool escondida). Nele dá para:

- Trocar o cenário de rede ativo: **Padrão**, **Latência alta**, **Instável**,
  **Sem conexão**, **Erros 5xx**, **Catálogo vazio**, **Sessão expirada**. A escolha
  persiste em `localStorage` (`kurio.mock.scenario`) e vale para as próximas
  requisições — recarregue a página para reaplicar às telas já carregadas.
- **Resetar dados simulados**: restaura os fixtures originais (catálogo, favoritos,
  carrinho, pedidos, carteiras, senha) e limpa o cache do TanStack Query. Equivale a
  rodar `window.__kurioMockReset()` no console.

Isso também pode ser feito programaticamente (ex. num teste): `localStorage.setItem('kurio.mock.scenario', 'slow')` e `window.__kurioMockReset()`.

### Reproduzindo fluxos de falha manualmente

| Cenário | Como reproduzir |
| --- | --- |
| Catálogo vazio | Painel → "Catálogo vazio" → recarregar Início |
| Latência alta / skeletons | Painel → "Latência alta" → navegar |
| Falha de rede / 5xx | Painel → "Sem conexão" ou "Erros 5xx" → tentar qualquer ação |
| Sessão expirada em qualquer tela | Painel → "Sessão expirada" → navegar; qualquer chamada autenticada devolve 401 e redireciona ao login preservando a rota |
| Cupom inválido/expirado | Aplicar `NAOEXISTE` (inválido) ou `EXPIRED20` (expirado) no carrinho |
| Cupom válido | `KURIO10` (10%) ou `WELCOME005` (0.005 ETH fixo) |
| Preço/disponibilidade mudando durante o checkout | Adicionar `Nebula Dream #001` ao carrinho — é o NFT com "drift" agendado (~16s após o boot) e também sofre variação de mercado a cada ~25s |
| Timeout após criar pedido, recuperado por idempotência | Painel → "Latência alta" → finalizar uma compra (a resposta demora >15s, o cliente expira, mas reenviar recupera o mesmo pedido pela mesma Idempotency-Key) |
| Pagamento recusado | Aleatório (~15% das compras) — repita a compra até ocorrer, ou force via cabeçalho de teste `X-Test-Force-Outcome: refused` (usado nos testes Playwright) |

## Testes

```bash
npm run test:e2e
```

Roda contra o build de produção (`npm run preview`) com os mocks ativos — nenhum
serviço externo é necessário. Cobre catálogo/busca/filtros/paginação com estado na
URL, acesso direto e 404 de NFT, cadastro/login/logout/sessão, favoritos otimistas,
carrinho (cupom, persistência, merge no login), compra completa até o recibo,
tempo real (mudança de preço via Socket.IO durante o checkout, deduplicação de
eventos), edição de perfil/carteiras com validação, acessibilidade (teclado, foco
em diálogo, texto alternativo) e regressão visual (Início, Detalhe, Carrinho,
Pagamento — baselines em `e2e/visual.spec.ts-snapshots/`).

Dois projetos Playwright: `chromium-desktop` (1440px, toda a suíte) e
`chromium-mobile` (perfil Pixel 7, `e2e/mobile/*.spec.ts` — catálogo sem overflow
horizontal e compra completa em viewport mobile). Um teste dedicado
(`catalog.spec.ts`) também cobre 768px (tablet) sem overflow.

## Lighthouse

```bash
npm run lighthouse
```

Audita `/` e `/nfts/:id` em perfis mobile e desktop contra o build de produção,
3 execuções por página/perfil, com o cenário de mock padrão (nenhuma simplificação
específica para a auditoria). Relatórios (HTML + JSON) e `summary.json` (mediana
por categoria, LCP/CLS/TBT, versões de ambiente) em `lighthouse-reports/`.

### Última medição (mediana de 3 execuções)

Ambiente: Node v24.18.1, Vite 7.3.6, Chromium (Playwright), Windows.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | mobile | 86 | 100 | 96 | 100 | 3,56 s | 0,000 | 24 ms |
| Início | desktop | 99 | 96 | 96 | 100 | 0,86 s | 0,000 | 0 ms |
| Detalhe do NFT | mobile | 84 | 98 | 96 | 100 | 3,71 s | 0,000 | 11 ms |
| Detalhe do NFT | desktop | 99 | 95 | 96 | 100 | 0,82 s | 0,000 | 0 ms |

Accessibility, Best Practices e SEO atingem a meta em todos os perfis. Performance
fica abaixo de 90 apenas no **mobile** (84–86): o breakdown do LCP
(`lighthouse-reports/*-mobile-run*.json` → audit `lcp-breakdown-insight`) mostra
que o gargalo é o *element render delay* — o candidato final de LCP é uma imagem
do catálogo que só pinta depois do round-trip para `/api/nfts` (latência de rede
simulada de 150–450ms, de propósito, pelo cenário "Padrão" de mock) somado ao
throttling de CPU 4× do perfil mobile do Lighthouse sobre um bundle que carrega
React + TanStack Router/Query + Axios + MSW + o cliente Socket.IO — todo o
transporte mockado roda no próprio bundle do cliente, ao contrário de uma app
real apontando para um backend de verdade. CLS é 0,000 em todas as combinações
(skeletons dimensionados para bater exatamente com o conteúdo real evita
deslocamento de layout).
