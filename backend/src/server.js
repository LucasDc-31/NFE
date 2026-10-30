import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { emitirNfce, consultarNfce, baixarArquivo, pagamentoValido } from './focus.js';
import { cardapioPublico, resolverItens } from './catalogo.js';
import { enviarEmailNota } from './mailer.js';
import { login, exigirLogin } from './auth.js';
import { interpretarDocumento } from './documentos.js';

for (const v of ['ADMIN_USER', 'ADMIN_PASSWORD', 'JWT_SECRET']) {
  if (!process.env[v]) {
    console.error(`Variável ${v} não definida no .env`);
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1); // atrás de proxy HTTPS (Render, Railway, nginx...)
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/login', login);

// --- PWA: serve o build web (mobile/dist) no mesmo endereço da API ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(process.env.WEB_DIST || path.join(__dirname, '../../mobile/dist'));
const temWeb = fs.existsSync(path.join(dist, 'index.html'));
if (temWeb) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  // O service worker e o index nunca devem ficar em cache longo
  app.get('/sw.js', (_req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'sw.js')));
}

// --- API protegida ---
app.use(['/notas', '/produtos'], exigirLogin);

const asyncRoute = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    console.error(e);
    res.status(400).json({ erro: e.message || 'Erro inesperado' });
  });

app.get('/produtos', (_req, res) => res.json(cardapioPublico()));

// Emite uma NFC-e. A autorização é assíncrona: o app consulta GET /notas/:ref depois.
app.post(
  '/notas',
  asyncRoute(async (req, res) => {
    const { itens, pagamento, cliente = {} } = req.body || {};
    if (!pagamentoValido(pagamento)) {
      return res.status(422).json({ erro: 'Escolha a forma de pagamento' });
    }
    let documento;
    try {
      documento = interpretarDocumento(cliente.documento);
    } catch (e) {
      return res.status(422).json({ erro: e.message });
    }
    const itensResolvidos = resolverItens(itens);
    const ref = randomUUID();
    const nota = await emitirNfce(ref, { itens: itensResolvidos, pagamento, documento });
    res.status(202).json(nota);
  }),
);

app.get(
  '/notas/:ref',
  asyncRoute(async (req, res) => {
    res.json(await consultarNfce(req.params.ref));
  }),
);

// Proxy do DANFCE (mantém o token da Focus no servidor)
app.get(
  '/notas/:ref/danfe',
  asyncRoute(async (req, res) => {
    const nota = await consultarNfce(req.params.ref);
    if (nota.status !== 'autorizado' || !nota.urlDanfe) {
      return res.status(404).json({ erro: 'Cupom indisponível para esta nota' });
    }
    const { buffer, contentType } = await baixarArquivo(nota.urlDanfe);
    res.set('Content-Type', contentType).send(buffer);
  }),
);

app.post(
  '/notas/:ref/email',
  asyncRoute(async (req, res) => {
    const { email } = req.body || {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(422).json({ erro: 'E-mail inválido' });
    }
    const nota = await consultarNfce(req.params.ref);
    if (nota.status !== 'autorizado') {
      return res.status(409).json({ erro: `Nota ainda não autorizada (${nota.status})` });
    }
    const r = await enviarEmailNota({ para: email, nota });
    res.json({ enviado: true, ...r });
  }),
);

// Qualquer outra rota GET devolve o app (SPA)
if (temWeb) {
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`API de notas fiscais rodando na porta ${port}`);
  const producao = (process.env.FOCUS_BASE_URL || '').includes('api.focusnfe.com.br');
  console.log(producao ? 'AMBIENTE: PRODUÇÃO (notas com valor fiscal)' : 'Ambiente: homologação (teste, sem valor fiscal)');
  if (/troque/i.test(process.env.ADMIN_PASSWORD) || /troque/i.test(process.env.JWT_SECRET)) {
    console.warn('ATENÇÃO: ADMIN_PASSWORD ou JWT_SECRET ainda estão com o valor de exemplo. Rode "npm run verificar".');
  }
  console.log(temWeb ? `PWA servido de ${dist}` : 'Build web não encontrado (rode "npm run build:web" em mobile/)');
});
