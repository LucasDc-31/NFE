# Guia de implantação: do zero até emitir a primeira nota

Este guia leva você do arquivo que recebeu até o app emitindo notas de verdade. Ele está na ordem em que as coisas precisam ser feitas.

Legenda: ✅ já está pronto no sistema · 👤 depende de você · 🧾 depende do seu contador

---

## Parte 0. O que já está pronto e o que falta

**✅ Já pronto no sistema**
- App instalável no celular (PWA) com a logo e as cores do Marlene's Grill.
- Login com usuário e senha.
- Cardápio com 57 produtos, preços do seu cardápio, preço editável na hora e pratos de valor livre (Janta e Refeição).
- Fluxo: Emitir nota → produtos → valores → CPF/CNPJ e pagamento → envio por e-mail ou WhatsApp.
- Emissão de NFC-e pela Focus NFe, com validação de CPF e CNPJ.
- Teste automático da instalação (`npm run verificar`).

**👤 O que só você pode fazer** (o sistema não consegue fazer por você)
1. Contratar a Focus NFe e cadastrar a empresa.
2. Comprar o certificado digital (explicado na Parte 1).
3. Gerar o CSC no portal da Receita do Paraná.
4. Confirmar os dados fiscais com o contador.
5. Publicar o app em um endereço com HTTPS.

**⚠ O que eu não pude testar**
Nunca testei contra a Focus NFe e a SEFAZ de verdade, porque isso exige a sua conta, o seu certificado e o seu CNPJ. Por isso a Parte 5 (testes em homologação) é obrigatória antes da primeira nota real.

---

## Parte 1. O que é o certificado digital

**Em uma frase:** é a assinatura eletrônica da sua empresa. Cada nota fiscal precisa ser assinada por ela para a SEFAZ (a Fazenda do estado) aceitar que a nota veio mesmo da sua empresa.

**Como funciona na prática:** a certificadora entrega um arquivo (ou um cartão) com a identidade digital do seu CNPJ, protegido por uma senha. Quando o app emite uma nota, a Focus usa esse arquivo para assinar a nota. Sem ele, nenhuma nota é emitida.

**Os dois tipos que existem**

| | **A1** | **A3** |
|---|---|---|
| Formato | Arquivo no computador (extensão .pfx) | Cartão ou token USB |
| Validade | 1 ano | 1 a 5 anos |
| Serve para este sistema? | **Sim** | **Não**, porque fica preso ao cartão e não dá para enviar à Focus |

A Focus informa que só emite notas por API com certificado **A1 dentro da validade**. Então você precisa de um **e-CNPJ A1** (certificado da pessoa jurídica, em nome do CNPJ da empresa).

**Se você já tem certificado:** confira se é A1. Se for A3, não dá para converter, e é preciso comprar um A1 novo.

**Como conseguir**
1. Procure uma Autoridade Certificadora credenciada pela ICP-Brasil (por exemplo, Certisign, Serasa Experian ou Soluti). Seu contador normalmente já tem parceria e pode emitir para você.
2. Peça um **e-CNPJ A1**. O preço varia entre as certificadoras, então peça orçamento.
3. Faça a validação de identidade (por videoconferência ou presencial), com os documentos do sócio responsável.
4. Receba o arquivo `.pfx` e **guarde a senha** que você definiu.

**Cuidados importantes**
- O arquivo e a senha funcionam como a assinatura da empresa. **Não envie por WhatsApp**, não coloque no GitHub e não deixe dentro da pasta do projeto.
- Ele **vence depois de 1 ano**. Anote a data e renove antes: com o certificado vencido, a Focus não emite nenhuma nota.
- Guarde uma cópia do arquivo em um lugar seguro (pendrive ou nuvem protegida).

**Como enviar para a Focus:** no painel da Focus (app-v2.focusnfe.com.br), vá em **Serviços → Minhas Empresas**, procure a empresa, clique em **Editar** e depois em **Anexar Certificado**. Escolha o arquivo, digite a senha e salve.

---

## Parte 2. Cadastros que dependem de você (faça nesta ordem)

### 2.1 Conta e empresa na Focus NFe 👤
1. Crie a conta em focusnfe.com.br e contrate o plano que inclui NFC-e.
2. Em **Minhas Empresas**, cadastre a empresa: CNPJ, razão social, inscrição estadual, regime tributário e endereço. Habilite a emissão de **NFC-e**.
3. Anexe o certificado A1 (Parte 1).
4. Anote os **dois tokens** da Focus: o de **homologação** (testes) e o de **produção**. Eles são diferentes. Se não achar onde estão no painel, o suporte da Focus (suporte@focusnfe.com.br) indica.

### 2.2 CSC e credenciamento no Paraná 👤
O **CSC** é um código de segurança que a SEFAZ usa para gerar o QR Code do cupom. Cada empresa tem o seu.

- **Homologação (testes):** pelo que consegui apurar, a SEFA-PR credencia automaticamente as empresas ativas.
- **Produção:** você se credencia no **Portal Receita/PR**, com certificado digital e inscrição estadual regular.
- **Gerar o CSC:** no Portal Receita/PR, em **DF-e → NFC-e → CSC**. A geração é feita por um sócio, pelo CNPJ base (8 primeiros dígitos).
- **Cadastrar na Focus:** informe o CSC e o número que o identifica no cadastro da empresa na Focus. Se não encontrar os campos, peça ao suporte da Focus.

> Essas informações vêm de fontes secundárias (a SEFA-PR bloqueou a leitura do portal oficial). Confirme os passos com seu contador ou direto no portal da Receita/PR.

### 2.3 Contador 🧾
Envie o arquivo `PERGUNTAS-PARA-O-CONTADOR.md` e peça as respostas por escrito. Elas definem NCM, CFOP e CSOSN do cardápio. Esse é o ponto que mais causa rejeição de nota.

---

## Parte 3. Instalar o sistema no computador

Você precisa do **Node.js 20 ou mais novo** (nodejs.org, versão LTS).

**3.1 Backend.** Abra o PowerShell na pasta `nfe-app` e rode:

```powershell
cd backend
npm install
copy .env.example .env
notepad .env
```

Preencha o `.env` e salve:

| Campo | O que colocar |
|---|---|
| `ADMIN_USER` e `ADMIN_PASSWORD` | Usuário e senha para entrar no app (senha forte) |
| `JWT_SECRET` | Texto longo e aleatório, com pelo menos 24 caracteres |
| `FOCUS_BASE_URL` | Deixe `https://homologacao.focusnfe.com.br` por enquanto |
| `FOCUS_TOKEN` | Token de **homologação** da Focus |
| `EMITENTE_CNPJ` | CNPJ da empresa, igual ao cadastrado na Focus |
| `ICMS_ORIGEM` e `PIS_COFINS_CST` | Confirme com o contador |
| `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | E-mail que enviará os cupons |

Se usar Gmail: ative a verificação em duas etapas na conta Google e crie uma **senha de app**. Use essa senha em `SMTP_PASS`, e não a senha normal.

**3.2 Conferir tudo.** Ainda na pasta `backend`, rode:

```powershell
npm run verificar
```

Ele confere o `.env`, o cardápio, a conexão com a Focus e o e-mail. Cada linha com ✖ diz o que corrigir. Repita até não sobrar nenhum ✖.

**3.3 Gerar o app.**

```powershell
cd ..\mobile
npm install
npm run build:web
```

**3.4 Ligar.**

```powershell
cd ..\backend
npm start
```

Abra `http://localhost:3000`, entre com seu usuário e senha e veja se aparece a tela com o botão **Emitir nota**.

---

## Parte 4. Cardápio e dados fiscais

O cardápio fica em `backend/data/produtos.json`.

- **Preços:** já estão com os valores do seu cardápio. Faltam a Mini pizza e os refrigerantes. Até preencher, o valor é digitado na hora da venda.
- **NCM, CFOP e CSOSN:** ficam no bloco `fiscal` de cada categoria. Os valores que vêm são **sugestões** para Simples Nacional. Ajuste com o que o contador responder.
- **Item com tributação diferente:** se um produto precisa de dados fiscais diferentes da categoria (por exemplo, água mineral ou vinho), coloque um bloco `"fiscal"` dentro do próprio produto. Ele sobrepõe o da categoria. Exemplo:

```json
{ "id": "refrigerantes-agua", "categoria": "refrigerantes", "nome": "Água mineral",
  "fiscal": { "cfop": "5102", "csosn": "102" },
  "variantes": [ { "id": "500ml", "nome": "500ml", "preco": 3 } ] }
```
- **CEST:** se o contador disser que algum produto precisa, adicione `"cest": "0000000"` (com o código dele) no bloco `fiscal`.

Depois de alterar o arquivo, não precisa reiniciar o servidor.

---

## Parte 5. Testes em homologação (obrigatório)

Em homologação, as notas **não têm valor fiscal**. Faça pelo menos estes testes:

| # | Teste | O que deve acontecer |
|---|---|---|
| 1 | Lanche, pagamento em dinheiro, sem documento | Nota autorizada |
| 2 | Pizza, com CPF e PIX | Nota autorizada |
| 3 | Refrigerante com valor digitado, débito | Nota autorizada |
| 4 | Janta de valor livre (R$ 30 editado) | Nota autorizada |
| 5 | Pedido com vários itens e quantidades diferentes | Total igual ao da tela |
| 6 | Com CNPJ de cliente | Nota autorizada |
| 7 | Enviar por e-mail para você mesmo | E-mail chega com o cupom |
| 8 | Enviar por WhatsApp para você mesmo | Abre a conversa com a mensagem e o link |

**Se uma nota for rejeitada:** a mensagem da SEFAZ aparece na tela. Copie o texto e me envie, junto com o que você pediu no teste. Em geral é um dado fiscal que o contador precisa confirmar.

**Se a nota for autorizada mas o botão de arquivo ou o link não aparecer:** é só o nome de um campo da resposta da Focus. O ajuste é pequeno (função `normalizar()` em `backend/src/focus.js`) e eu faço se você me mandar a resposta.

---

## Parte 6. Publicar na internet e instalar no celular

O PWA só instala no celular se o endereço tiver **HTTPS**. Para isso o sistema precisa ficar em um servidor.

**6.1 GitHub**
1. Crie um repositório **privado** no GitHub, vazio.
2. Na pasta `nfe-app`, rode:

```powershell
git init
git add .
git commit -m "App de notas fiscais"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
git push -u origin main
```
3. Confira no GitHub que **não** aparece nenhum arquivo `.env` nem certificado. Se aparecer, apague e troque todas as senhas.

**6.2 Render (ou similar)**
1. Em render.com, crie um **Web Service** ligado ao repositório.
2. **Build Command:** `cd mobile && npm install && npm run build:web && cd ../backend && npm install`
3. **Start Command:** `cd backend && npm start`
4. Na aba **Environment**, cadastre uma variável para cada linha do seu `.env`.
5. Clique em **Deploy**. O Render dá um endereço `https://...onrender.com`.

**6.3 Instalar no celular**
- **Android (Chrome):** menu ⋮ → **Instalar app**.
- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.

> O plano gratuito do Render "dorme" quando fica parado, e o primeiro acesso pode levar cerca de um minuto. Para uso diário no balcão, vale um plano pago que não durma.

---

## Parte 7. Passar para produção (notas valendo)

Só faça isto depois de os testes da Parte 5 passarem **e** do contador ter conferido os dados fiscais.

Checklist:
- [ ] Certificado A1 anexado na Focus e dentro da validade.
- [ ] Credenciamento da produção feito no Portal Receita/PR.
- [ ] CSC de **produção** gerado e cadastrado na Focus.
- [ ] Contador respondeu as perguntas e o `produtos.json` foi ajustado.
- [ ] No Render, trocar `FOCUS_BASE_URL` para `https://api.focusnfe.com.br`.
- [ ] No Render, trocar `FOCUS_TOKEN` para o token de **produção**.
- [ ] Rodar `npm run verificar` e ver a linha "Ambiente: PRODUÇÃO".
- [ ] Emitir **uma** nota real de pouco valor, com o contador acompanhando.

---

## Parte 8. No dia a dia

- **Anote a validade do certificado** e renove com antecedência.
- **Sem internet, o app não emite.** O Paraná só permite contingência offline, com transmissão em até 24 horas, e este sistema não faz isso. Combine com o contador o que fazer se a internet cair.
- **Troque preços** editando o `produtos.json` no repositório (com commit). Alterações feitas direto no servidor gratuito se perdem no próximo deploy.
- **Nota emitida errada:** cancelamento e correção são feitos no painel da Focus ou com o contador. O app não cancela notas.
- **Mais de uma pessoa usando:** hoje existe um único login. Para vários usuários com registro de quem alterou valores, o próximo passo é um cadastro de usuários.

---

## Onde conseguir ajuda

- **Suporte da Focus NFe:** suporte@focusnfe.com.br (cadastro da empresa, certificado, CSC, token).
- **Seu contador:** dados fiscais e regras do Paraná.
- **Comigo:** mande a mensagem de erro e o que você estava fazendo, que eu ajusto o sistema.
