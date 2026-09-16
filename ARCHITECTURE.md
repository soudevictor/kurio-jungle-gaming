# Arquitetura

## 1. Visão geral

Aplicação 100% frontend. Não existe backend real: toda a API REST e o transporte
Socket.IO são simulados no navegador via [MSW](https://mswjs.io) (`src/mocks/`),
ativados também no build de produção/demonstração (não é uma dependência apenas de
desenvolvimento). O objetivo é que o app se comporte, do ponto de vista do
componente React, exatamente como se falasse com um servidor real: mesmo cliente
Axios, mesmo `socket.io-client`, mesmos contratos tipados.

```
UI (rotas/componentes)
  → hooks de feature (src/features/**/use-*.ts, TanStack Query)
    → cliente Axios (src/lib/api)          → MSW REST handlers (src/mocks/handlers)
    → cliente socket.io (src/lib/realtime) → MSW WebSocket handler (src/mocks/realtime)
                                                  ↕
                                          "banco" em memória (src/mocks/db.ts)
                                          persistido em localStorage
```

## 2. Contratos REST

Base: `/api`. Corpos e erros tipados em `src/types/domain.ts` (`ApiErrorBody`),
endpoints tipados em `src/lib/api/endpoints.ts`. Erros seguem o envelope:

```ts
{ error: { code: "validation_error" | "invalid_credentials" | "email_taken" | "unauthorized"
         | "forbidden" | "not_found" | "conflict" | "coupon_invalid" | "coupon_expired"
         | "price_changed" | "unavailable" | "idempotency_conflict" | "network_error"
         | "server_error", message: string, fields?: Record<string, string> } }
```

| Recurso | Rotas |
| --- | --- |
| Sessão/conta | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` |
| NFTs | `GET /nfts?search=&category=&sort=&minPrice=&maxPrice=&page=&pageSize=` (retorna `NftListResult`: itens + paginação + `categoryCounts` para os filtros), `GET /nfts/:id` |
| Favoritos | `GET/POST /favorites`, `DELETE /favorites/:nftId` |
| Carrinho | `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:nftId`, `POST/DELETE /cart/coupon`, `POST /cart/merge` |
| Cotação | `GET /quote` — recalculada a cada leitura a partir do carrinho + preço/estoque **ao vivo** dos NFTs, nunca de um valor congelado |
| Pedidos | `POST /orders` (com cabeçalho `Idempotency-Key`), `GET /orders/:id`, `GET /orders` |
| Perfil | `GET/PATCH /profile`, `POST /profile/password` |
| Carteiras | `GET/POST /wallets`, `PATCH /wallets/:id` |

Identidade do carrinho: visitante usa um id gerado em `localStorage`
(`kurio.cart.guestId`, cabeçalho `X-Cart-Id`); autenticado usa `user:<id>` derivado
do token no servidor (o `X-Cart-Id` do cliente é ignorado nesse caso). Login/cadastro
não fazem merge automático — o cliente chama `POST /cart/merge` explicitamente logo
após autenticar (`src/features/auth/auth-context.tsx`), preservando os itens do
visitante.

Valores em ETH trafegam **sempre como string decimal** (nunca `number`); toda
aritmética passa por `src/lib/money.ts` (baseado em `decimal.js`) para não perder
precisão.

## 3. Sessão

Token opaco (`localStorage: kurio.session.token`) enviado como `Authorization:
Bearer`. `GET /auth/session` é a fonte de verdade; a sessão fica em cache do
TanStack Query com `staleTime: 60s`. Qualquer resposta **401 de um endpoint que não
seja `/auth/*`** dispara um evento global (`kurio:session-expired`,
`src/lib/api/client.ts`) capturado por `SessionExpiryWatcher`
(`src/features/auth/session-expiry-watcher.tsx`), que limpa o token, esvazia os
caches privados (favoritos, pedidos, carteiras) e redireciona para `/login?redirect=<rota
atual>` — preservando o contexto para retomar depois de logar (inclusive em plena
tela de checkout). Rotas protegidas (`/checkout`, `/orders/:id`, `/profile*`) usam
`beforeLoad` no layout `_authenticated` (`src/routes/_authenticated.tsx`), que resolve
a sessão via `ensureQueryData` antes de renderizar — acesso direto a qualquer uma
delas funciona e redireciona coerentemente se não houver sessão.

Logout (`AuthProvider.logout`) chama `queryClient.clear()` — zera literalmente todo
o cache, garantindo que troca de usuário nunca vaza dado da sessão anterior.

## 4. Estado do carrinho e cotação

`Cart` (itens + cupom) e `Quote` (subtotal/desconto/taxa/total + `issues[]`) são
recursos **separados**: o carrinho guarda a intenção do usuário, a cotação é
recalculada a cada leitura a partir do estado **atual** dos NFTs (preço/estoque),
nunca fica desatualizada por design. `issues[]` cobre: item esgotado, quantidade
reduzida (estoque insuficiente), cupom inválido/expirado. Ao criar um pedido
(`POST /orders`), o servidor recusa (409) se houver alguma issue bloqueante, ou se o
`expectedTotalEth` enviado pelo cliente não bater com o total recém-calculado —
forçando a UI a mostrar a mudança e exigir nova confirmação explícita do usuário
antes de reenviar (`_authenticated.checkout.tsx`, estado `reviewedAt` resetado sempre
que `quote.version` muda).

Cache (`src/lib/query/client.ts`): `staleTime` 15s por padrão, retry desabilitado
para 4xx (nada a ganhar tentando de novo um erro de validação) e até 2 tentativas
com backoff para falhas de rede/5xx. Mutations nunca fazem retry automático
(evita duplicar efeitos colaterais como "adicionar ao carrinho" ou "criar pedido").

**Atualização otimista**: favoritar/desfavoritar (`use-favorites.ts`) e alterar
quantidade/remover item do carrinho (`use-cart.ts`) aplicam o novo estado
imediatamente e revertem (`onError` restaura o snapshot anterior) se a mutação
falhar — com `onSettled` sempre revalidando contra o servidor.

## 5. Pedidos: idempotência e ciclo de vida

`POST /orders` exige `Idempotency-Key` (gerado uma vez por tentativa de checkout e
persistido em `localStorage` até o pedido resolver — `src/features/orders/checkout-storage.ts`).
No mock (`src/mocks/handlers/orders.ts`):

- mesma chave + mesmo payload (carteira/rede/itens/cupom, hash comparado) →
  devolve o pedido já existente (replay idempotente), sem criar duplicata;
- mesma chave + payload diferente → `409 idempotency_conflict`.

O pedido nasce `pending` e é resolvido (`confirmed` 85% / `refused` 15%, ou forçado
via cabeçalho de teste `X-Test-Force-Outcome`) 3–5,5s depois, via `setTimeout` no
"servidor" mock — de propósito **independente** da resposta HTTP, para simular
exatamente o cenário de timeout: no cenário "Latência alta", a resposta do POST é
segurada por 16–19s (> o timeout de 15s do Axios), mas o pedido já existe no
servidor; o cliente recebe um erro de rede, e o próximo envio com a **mesma**
Idempotency-Key recupera o pedido real em vez de criar outro. Itens comprados só
saem do carrinho quando o pedido é efetivamente `confirmed`; se `refused`, o
carrinho permanece intacto. O recibo (`/orders/:id`) é o snapshot gravado na criação
do pedido — mudanças posteriores no catálogo não o alteram.

## 6. Tempo real (Socket.IO)

Transporte: WebSocket puro, interceptado por `@mswjs/interceptors`
(`WebSocketInterceptor`, aplicado internamente pelo `setupWorker` do MSW) e
decodificado/codificado como protocolo Socket.IO por `@mswjs/socket.io-binding`
(`toSocketIo`, `src/mocks/realtime/server.ts`). `socket.io-client` roda igual a como
rodaria contra um servidor real — nenhum evento é injetado diretamente na UI ou no
cache; tudo passa pelo cliente Socket.IO de verdade (`src/lib/realtime/client.ts`).

Eventos: `nft.updated` (id, versão, preço/estoque atuais) e `order.updated` (id,
versão, `userId`, status). Cada evento carrega uma versão monotônica; o cliente
(`src/features/realtime/realtime-provider.tsx`) guarda a última versão vista por
recurso e **ignora silenciosamente** entregas duplicadas/atrasadas (nunca reaplica
efeito, nunca regride estado mais novo). Eventos de pedido são filtrados
client-side por `userId` — nunca atualizam o cache de outro usuário. Em vez de
aplicar o payload do evento diretamente no cache, cada evento apenas dispara
`invalidateQueries` do recurso afetado (mais o carrinho/cotação, se for preço/estoque
de NFT) — a UI sempre converge para o estado real via um novo GET, o que também é a
estratégia de reconciliação após reconexão (`socket.on("connect", reconcile)`
reinvalida catálogo, detalhe, carrinho, cotação, favoritos e pedidos). Um pedido
pendente sobrevive a um refresh de página: o polling de `useOrder` (a cada 4s
enquanto `pending`) e o evento de reconexão recuperam o estado sem nunca criar uma
segunda compra.

**Limitação conhecida / decisão registrada**: `@mswjs/socket.io-binding` não
implementa salas/namespaces do Socket.IO. "Broadcast para uma sala" (ex.: só para o
dono do pedido) é feito à mão — o servidor mock transmite para todas as conexões
abertas e o filtro por `userId` acontece no cliente. Documentado aqui em vez de
escondido.

**Pegadinha de bundling que vale registrar**: `engine.io-client` lê
`globalThis.WebSocket` para uma constante em nível de módulo no momento em que é
avaliado. Um `import "socket.io-client"` estático no topo do app roda antes do MSW
aplicar seu `WebSocketInterceptor`, prendendo a lib no `WebSocket` nativo para
sempre e fazendo toda conexão "escapar" para a rede real, silenciosamente. A
correção foi importar `socket.io-client` **dinamicamente** (`await import(...)`),
só depois que `startMockWorker()` resolve — ver `src/lib/realtime/client.ts`.

## 7. Mocking (MSW)

`src/mocks/db.ts` é um "banco" em memória com persistência em `localStorage`
(`kurio.mock.db.v1`) — sobrevive a refresh, e `db.reset()` (exposto como
`window.__kurioMockReset`, e pelo painel de cenários) restaura os fixtures
originais. Fixtures (`src/mocks/data/fixtures.ts`) são gerados
deterministicamente (PRNG com seed fixa) para reprodutibilidade: 48 NFTs em 6
categorias, 2 usuários, 3 carteiras, 3 cupons (válido, valor fixo, expirado).

Condições de rede (`src/mocks/scenarios.ts`) são configuráveis em runtime
(`localStorage: kurio.mock.scenario`, controlado pelo painel flutuante) e
aplicadas por todo handler via `withScenario(...)`: latência variável, falha de
rede pura (`HttpResponse.error()`), erro 5xx, catálogo vazio, sessão expirada. Os
mesmos cenários valem para dev, demo e Playwright.

Regras respeitadas: os handlers contêm **toda** a lógica de negócio simulada
(filtro/ordenação/paginação, cálculo de cotação, idempotência, validação) — hooks,
componentes e o cliente Axios não têm nenhum caminho alternativo hardcoded nem
resposta fictícia embutida.

## 8. Assets

As imagens de NFT/avatares do Figma não puderam ser exportadas (arquivo acessível
apenas em modo visualização, sem Dev Mode/inspeção). Foram substituídas por artes
geradas proceduralmente e deterministicamente (`scripts/generate-placeholder-art.mjs`
→ `public/assets/{nft,avatars}/*.svg` + `hero.svg`), com seed por id — mesma
paginação sempre mostra a mesma arte, sem custo de rede (bom para Lighthouse/CLS) e
sem dependência de serviço externo. Paleta de cores, tipografia (fonte
monoespaçada nos títulos/preços, sans no corpo) e composição de cada tela foram
reconstruídas a partir de inspeção visual detalhada do Figma (zoom/leitura de
pixels, já que os valores exatos de Dev Mode não estavam acessíveis) — ver
`src/index.css` para os tokens de tema.

## 9. Fora do escopo (declarado no README do desafio)

Nav "Mercado / Criadores / Aprenda", links do rodapé e "quick view" são apenas
visuais no Figma; ficam presentes na UI mas **inertes de propósito** (mostram um
toast "fora do escopo" em vez de fingir navegar) — README §3: "ações fora do
escopo não devem aparentar sucesso funcional". Não existe página dedicada de
"Favoritos" (favoritar/desfavoritar acontece inline no catálogo/detalhe,
persistindo por usuário) nem página de "Atividade"/pedidos — não fazem parte das
telas obrigatórias.
