# 🎨 Kurio NFT Marketplace - Especificação Pixel Perfect (Master Spec)

## 🎯 Diretriz Principal
Seu objetivo é atuar como um UI/UX Engineer e garantir que a aplicação React/Tailwind corresponda 100% ao Figma. O projeto usa `shadcn/ui`. Você NÃO deve alterar a lógica de roteamento ou requisições, APENAS a árvore do DOM e as classes Tailwind.

## 🎨 1. Design Tokens & Identidade Global
- **Background Principal:** Escuro terroso/sépia profundo. Extraia o HEX exato do Figma (ex: `bg-[#1A1514]` ou via variáveis CSS `--background`).
- **Cor Primária (Destaque):** Laranja/Cobre vibrante. Usado no botão primário, ícones ativos, bordas de input em focus, tag "RARO" e asteriscos `*` de campos obrigatórios.
- **Tipografia:**
  - Fonte sem serifa para a UI geral.
  - **MANDATÓRIO:** Todos os valores numéricos (preços em `ETH`, totais) e identificadores (ex: `#0042`) DEVEM utilizar as classes `font-mono` e `tabular-nums` para alinhamento vertical perfeito.
  - Textos de apoio ("Taxa de rede", "Edição") usam cinza mutado (`text-muted-foreground`).

## 📱 2. Responsividade (Desktop vs Mobile)
Utilize a abordagem Mobile-First do Tailwind. O padrão é Mobile; prefixos `md:` ou `lg:` são para Desktop.

- **Header / Navegação:**
  - *Desktop:* Logo à esquerda, Links centralizados, Busca/Carrinho/Login à direita.
  - *Mobile:* Barra de busca expandida no topo. Navegação principal vai para uma **App Bar inferior flutuante** com bordas arredondadas e ícones.
- **Catálogo / Sidebar:**
  - *Desktop:* Sidebar de filtros visível à esquerda (Coleções, Faixa de Preço com slider, Redes). Grid de NFTs à direita.
  - *Mobile:* Sidebar oculta (vira um ícone de filtros na busca). Grid de NFTs em 2 colunas.

## 🧩 3. Componentes Específicos (Checklist de Correção)
- **Cards de NFT:** Imagens com `aspect-square` e `object-cover`. A tag "RARO" tem fundo laranja sólido, texto escuro, posicionamento `absolute top-0 left-0`.
- **Carrinho (Sidebar):** Controles de quantidade (`-` e `+`) com fundo laranja e ícones escuros.
- **Formulários:** Inputs com fundo preenchido sutilmente mais claro que a página. Asterisco `*` de obrigatoriedade sempre Laranja.
- **Rádios de Carteira:** No checkout, as opções (MetaMask, Coinbase) são "Cards" selecionáveis, com borda sutil e o `radio button` à direita.

## ⏳ 4. Skeletons (Critério Eliminatório)
Substitua qualquer tela em branco de carregamento por **Skeletons com shimmer effect**. Eles devem ter exatamente a mesma proporção geométrica do componente real (ex: caixas quadradas para os NFTs) para evitar deslocamento de layout (CLS zero).