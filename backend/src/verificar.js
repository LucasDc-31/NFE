// Verificação da instalação: `npm run verificar`
// Confere o .env, o cardápio, a conexão com a Focus NFe e o envio de e-mail, e explica o que falta.
import 'dotenv/config';
import nodemailer from 'nodemailer';
import { cnpjValido } from './documentos.js';
import { carregarCatalogo } from './catalogo.js';

const env = process.env;
let erros = 0;
let avisos = 0;

const ok = (m) => console.log(`  ✔ ${m}`);
const aviso = (m) => {
  avisos += 1;
  console.log(`  ⚠ ${m}`);
};
const erro = (m) => {
  erros += 1;
  console.log(`  ✖ ${m}`);
};
const titulo = (t) => console.log(`\n${t}`);

const PADROES = ['troque', 'seu-token', 'seu-email', 'senha-de-app', '00000000000000'];
const placeholder = (v) => !v || PADROES.some((p) => String(v).toLowerCase().includes(p));

// ---- 1. Acesso ao app ----
titulo('1. Acesso ao app');
if (!env.ADMIN_USER) erro('ADMIN_USER não preenchido no .env');
else ok(`Usuário do app: ${env.ADMIN_USER}`);
if (!env.ADMIN_PASSWORD) erro('ADMIN_PASSWORD não preenchido no .env');
else if (placeholder(env.ADMIN_PASSWORD)) erro('ADMIN_PASSWORD ainda é o valor de exemplo: troque por uma senha forte');
else if (env.ADMIN_PASSWORD.length < 8) aviso('Senha curta (menos de 8 caracteres): prefira uma maior');
else ok('Senha do app definida');
if (!env.JWT_SECRET || placeholder(env.JWT_SECRET)) erro('JWT_SECRET não preenchido (use um texto longo e aleatório)');
else if (env.JWT_SECRET.length < 24) aviso('JWT_SECRET curto: use pelo menos 24 caracteres');
else ok('JWT_SECRET definido');

// ---- 2. Empresa ----
titulo('2. Empresa emitente');
if (!env.EMITENTE_CNPJ || placeholder(env.EMITENTE_CNPJ)) erro('EMITENTE_CNPJ não preenchido');
else if (!cnpjValido(env.EMITENTE_CNPJ)) erro('EMITENTE_CNPJ inválido: confira os números');
else ok('CNPJ do emitente válido (precisa ser o mesmo cadastrado na Focus)');
ok(`Origem da mercadoria: ${env.ICMS_ORIGEM || '0'} | CST PIS/COFINS: ${env.PIS_COFINS_CST || '07'} (confirme com o contador)`);

// ---- 3. Cardápio ----
titulo('3. Cardápio');
try {
  const { categorias, produtos } = carregarCatalogo();
  const variantes = produtos.flatMap((p) => p.variantes);
  ok(`${produtos.length} produtos e ${variantes.length} variações em ${categorias.length} categorias`);
  const semFiscal = categorias.filter((c) => !c.fiscal?.ncm || !c.fiscal?.cfop || !c.fiscal?.csosn);
  if (semFiscal.length) erro(`Categorias sem NCM/CFOP/CSOSN: ${semFiscal.map((c) => c.nome).join(', ')}`);
  else ok('Todas as categorias têm NCM, CFOP e CSOSN (confirme os valores com o contador)');
  const semPreco = variantes.filter((v) => !(Number(v.preco) > 0)).length;
  if (semPreco) aviso(`${semPreco} variações sem preço no cardápio: o preço será digitado na hora da venda`);
} catch (e) {
  erro(`Não foi possível ler backend/data/produtos.json: ${e.message}`);
}

// ---- 4. Focus NFe ----
titulo('4. Focus NFe');
const base = (env.FOCUS_BASE_URL || '').replace(/\/$/, '');
const producao = base.includes('api.focusnfe.com.br');
if (!base) erro('FOCUS_BASE_URL não preenchido');
else if (producao) aviso('Ambiente: PRODUÇÃO. As notas emitidas têm valor fiscal!');
else ok('Ambiente: HOMOLOGAÇÃO (teste, sem valor fiscal)');

if (!env.FOCUS_TOKEN || placeholder(env.FOCUS_TOKEN)) {
  erro('FOCUS_TOKEN não preenchido (pegue no painel da Focus; homologação e produção têm tokens diferentes)');
} else if (base) {
  try {
    const res = await fetch(`${base}/v2/nfce/verificacao-de-conexao`, {
      headers: { Authorization: 'Basic ' + Buffer.from(`${env.FOCUS_TOKEN}:`).toString('base64') },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) ok('Focus respondeu e aceitou o token');
    else if (res.status === 401 || res.status === 403) {
      erro(`Focus recusou o token (HTTP ${res.status}). Confira se o token é do mesmo ambiente do FOCUS_BASE_URL`);
    } else aviso(`Focus respondeu HTTP ${res.status}: confira o painel da Focus`);
  } catch (e) {
    erro(`Não foi possível falar com a Focus (${e.message}). Confira a internet e o FOCUS_BASE_URL`);
  }
}
console.log('  ℹ Certificado A1 e CSC são conferidos no painel da Focus (Minhas Empresas), não aqui.');

// ---- 5. E-mail ----
titulo('5. Envio de e-mail');
if (placeholder(env.SMTP_USER) || placeholder(env.SMTP_PASS)) {
  aviso('SMTP não configurado: o envio por e-mail não vai funcionar (WhatsApp funciona normalmente)');
} else {
  try {
    const t = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 465),
      secure: env.SMTP_SECURE !== 'false',
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 10000,
    });
    await t.verify();
    ok(`Servidor de e-mail aceitou o login de ${env.SMTP_USER}`);
  } catch (e) {
    erro(`E-mail não conectou (${e.message}). No Gmail use uma "senha de app"`);
  }
}

console.log(`\nResultado: ${erros} problema(s) a corrigir, ${avisos} aviso(s).`);
console.log(erros ? 'Corrija os itens com ✖ e rode `npm run verificar` de novo.' : 'Tudo certo para testar em homologação.');
process.exit(erros ? 1 : 0);
