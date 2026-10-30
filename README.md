# Notas Fiscais — PWA para restaurante (Expo Web + Focus NFe)

App web instalável (PWA) para pizzaria/lanchonete: monta o pedido pelo cardápio, emite a **NFC-e** (nota de consumidor) pela API da **Focus NFe** e envia o cupom ao cliente por **WhatsApp** ou **e-mail**.

```
nfe-app/
├── backend/   Node.js + Express: login, emissão, consulta, e-mail, e serve o PWA
└── mobile/    Expo (React Native Web): código do app; o build vai para mobile/dist
```

O backend serve o app e a API no **mesmo endereço**, então só há um serviço para publicar.

## Fluxo

Tela inicial com o botão **Emitir nota**, e depois 4 passos:

1. **Produtos:** escolha a categoria e toque no tamanho/variação para adicionar ao pedido.
2. **Valores:** confira os itens, ajuste a quantidade e coloque ou altere o valor de qualquer item (preço por unidade).
3. **Documento e pagamento:** escolha **Sem documento**, **CPF** ou **CNPJ** (com máscara e validação dos dígitos) e a forma de pagamento (dinheiro, PIX, débito ou crédito).
4. **Enviar a nota:** escolha **WhatsApp**, **E-mail** ou **Não enviar**, informe o contato e toque em **Emitir nota**.

Depois de emitir, o app acompanha a autorização na SEFAZ (consulta a cada 3 s). Com a nota autorizada:
- **WhatsApp:** botão para abrir a conversa com a mensagem pronta e o link da nota, e botão para enviar o cupom como arquivo (quando disponível).
- **E-mail:** enviado automaticamente, com cupom e XML anexados. Se falhar, aparece o motivo e um botão para tentar de novo.
- **Não enviar:** mostra as duas opções para você escolher na hora.

O login (usuário e senha do `.env`) vale por 12 h.

**Identidade visual:** cores e logo do cardápio do Marlene's Grill. As cores ficam em `mobile/src/theme.js`, e a logo e os ícones do app em `mobile/public/` (`logo.png`, `icon-*.png`). Para trocar, substitua esses arquivos mantendo os nomes e rode `npm run build:web` de novo.

## Cardápio e preços

Fica em `backend/data/produtos.json` e foi montado a partir do cardápio do Marlene's Grill: 57 produtos e 113 variações em 13 categorias (lanches prensados, hot dog, ligeirinho, combos de lanche, pizzas, borda recheada, porções, torre de batata, combos, janta, refeições, marmitas e refrigerantes). A pizza é um item só, com preço por tamanho (P R$ 42, M R$ 49, G R$ 62), igual para todos os sabores. Porções, torres e combos têm Meia e Inteira.

**Preço editável na hora da venda:** em qualquer item do pedido dá para alterar o valor por unidade (o campo "R$" ao lado da quantidade). O preço do cardápio é só a sugestão inicial, e o total e a nota usam o valor digitado. O servidor aceita valores de R$ 0,01 a R$ 9.999,99.

**Pratos personalizados:** "Janta" e "Refeição" ("Prato personalizado") sugerem R$ 30,00, e cada toque adiciona um prato novo, com valor próprio. Para criar outros itens assim, adicione `"precoLivre": true` na variação.

**Itens sem preço no cardápio (25 variações):** Mini pizza e refrigerantes aparecem como "informar valor" e podem ser vendidos digitando o valor no pedido. Para que apareçam com preço, preencha o campo `"preco"` deles.

- Para mudar um preço sugerido, edite o campo `"preco"` (com ponto: `49.9`). Não precisa reiniciar o servidor.
- Para incluir/remover produtos, copie um bloco existente em `produtos` e ajuste `id`, `nome` e `variantes`.
- Em cada categoria, o bloco `fiscal` define **NCM, CFOP e CSOSN**. Os valores que vêm são sugestões comuns para Simples Nacional (comida de produção própria: CFOP 5101, CSOSN 102; refrigerante revendido com ICMS-ST: CFOP 5405, CSOSN 500). **Confirme com seu contador**, pois mudam conforme estado e regime. Se precisar de CEST, adicione `"cest": "..."` ao bloco `fiscal`. Um produto ou variação pode ter o próprio bloco `"fiscal"`, que sobrepõe o da categoria (a variação sobrepõe o produto).
- Em hospedagem com disco temporário (plano gratuito do Render), mudanças feitas direto no servidor se perdem no próximo deploy. Edite o arquivo no repositório e faça commit.

## Guias (leia nesta ordem)

1. `GUIA-IMPLANTACAO.md`: passo a passo completo até a primeira nota (certificado digital, Focus, CSC, instalação, testes, publicação, produção).
2. `PERGUNTAS-PARA-O-CONTADOR.md`: dados fiscais que o contador precisa confirmar.

## Rodar localmente

### 1. Backend

```bash
cd backend
cp .env.example .env     # Windows: copy .env.example .env
npm install
```

Preencha o `.env` (login, `JWT_SECRET`, token da Focus, CNPJ do emitente, SMTP). Para gerar um segredo: `openssl rand -hex 32`.

Depois confira tudo de uma vez:

```bash
npm run verificar
```

Ele valida o `.env`, o CNPJ, o cardápio, a conexão com a Focus (e se o token é aceito) e o login do e-mail, e diz o que corrigir.

### 2. Build do app web

```bash
cd mobile
npm install
npm run build:web        # gera mobile/dist
```

### 3. Subir tudo

```bash
cd backend
npm start
```

Abra http://localhost:3000, entre com o usuário/senha do `.env` e emita uma nota de teste.

Para desenvolver a interface com recarga automática: deixe o backend rodando e, em `mobile/`, rode
`EXPO_PUBLIC_API_URL=http://localhost:3000 npm run web` (Windows PowerShell: `$env:EXPO_PUBLIC_API_URL="http://localhost:3000"; npm run web`).

> Use sempre `FOCUS_BASE_URL=https://homologacao.focusnfe.com.br` nos testes. Só troque para `https://api.focusnfe.com.br` (e o token de produção) quando tudo estiver validado.

## Publicar (HTTPS é obrigatório para instalar o PWA)

Qualquer hospedagem Node serve (Render, Railway, Fly.io, VPS com nginx...). Exemplo no **Render** (Web Service):

- **Build command:** `cd mobile && npm install && npm run build:web && cd ../backend && npm install`
- **Start command:** `cd backend && npm start`
- **Variáveis de ambiente:** as mesmas do `.env.example` (não suba o `.env` para o repositório).

A hospedagem fornece o HTTPS. Depois é só abrir o endereço no celular.

## Instalar no celular

- **Android (Chrome):** menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
- **iPhone (Safari):** botão Compartilhar → *Adicionar à Tela de Início*.

## Pontos de atenção

- **Cadastro na Focus:** para emitir NFC-e, a empresa precisa estar cadastrada na Focus NFe com **certificado digital A1** e o **CSC** (código e token de segurança da NFC-e do seu estado, gerado no portal da SEFAZ). Isso é feito no painel da Focus, não neste app.
- **NFC-e com CNPJ:** é permitida. O Ajuste SINIEF 11/2025 ia proibir a NFC-e para CNPJ a partir de 4/5/2026, mas foi revogado pelo Ajuste SINIEF 12/2026 (DOU de 09/04/2026). Quando a nota identifica o cliente (CPF ou CNPJ), o app envia o indicador de IE do destinatário como **9 - Não contribuinte**, que é o único valor aceito pela SEFAZ na NFC-e (outro valor gera a rejeição 789). Por isso a NFC-e não serve para cliente empresa que precisa de crédito de ICMS: nesse caso o correto é NF-e (modelo 55), que este app não emite. Confirme regras do seu estado com o contador.
- **Certificado digital:** só funciona com e-CNPJ **A1** (arquivo .pfx) dentro da validade, anexado no painel da Focus. O A3 (cartão/token) não serve. Veja a Parte 1 do `GUIA-IMPLANTACAO.md`.
- **Paraná (fontes secundárias, confirme com o contador):** o CSC é gerado no Portal Receita/PR por um sócio, por CNPJ base; a homologação é credenciada automaticamente e a produção é pelo Portal Receita/PR; no Paraná só existe contingência offline (transmissão em até 24 h), que este app não faz, então sem internet o app não emite; o CPF na nota gera créditos do programa Nota Paraná (o app lembra de perguntar ao cliente); restaurantes podem estar no regime diferenciado do art. 37 do RICMS/PR. CFOP 5101 (comida preparada) e 5405 (refrigerante com ST) são sugestões não confirmadas.
- **Dados fiscais:** NCM, CFOP, CSOSN e CST de PIS/COFINS (`PIS_COFINS_CST` no `.env`) dependem do seu regime e do seu estado. Os valores padrão são só sugestões, valide com o contador antes de usar em produção.
- **Resposta da Focus:** o nome dos campos de cupom/XML/consulta pode variar. Confira uma resposta real na homologação e ajuste `normalizar()` em `backend/src/focus.js` se algo não aparecer.
- **Homologação primeiro:** use `FOCUS_BASE_URL=https://homologacao.focusnfe.com.br` nos testes. Só troque para `https://api.focusnfe.com.br` (e o token de produção) quando tudo estiver validado.
- **Segurança:** há um único usuário (do `.env`), com bloqueio após 5 senhas erradas por 10 min. Use senha forte e HTTPS.
- **Cache offline:** o service worker guarda só os arquivos do app. Cardápio, notas e login nunca ficam em cache.
- **WhatsApp:** o envio é pelo WhatsApp do próprio celular (a pessoa toca em enviar). Sem número informado, o WhatsApp deixa escolher o contato. Envio 100% automático exigiria a WhatsApp Business API.
- **iPhone:** o compartilhamento de arquivo exige iOS/Safari recente; sem ele o app baixa o arquivo.
