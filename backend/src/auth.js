import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';

const igual = (a = '', b = '') => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

// Limite simples de tentativas por IP (em memória): 5 erros -> bloqueio de 10 min
const tentativas = new Map();
const MAX = 5;
const JANELA_MS = 10 * 60 * 1000;

function bloqueado(ip) {
  const t = tentativas.get(ip);
  if (!t) return false;
  if (Date.now() - t.desde > JANELA_MS) {
    tentativas.delete(ip);
    return false;
  }
  return t.erros >= MAX;
}

function registrarErro(ip) {
  const t = tentativas.get(ip) || { erros: 0, desde: Date.now() };
  t.erros += 1;
  tentativas.set(ip, t);
}

export function login(req, res) {
  const ip = req.ip;
  if (bloqueado(ip)) {
    return res.status(429).json({ erro: 'Muitas tentativas. Tente novamente em alguns minutos.' });
  }
  const { usuario, senha } = req.body || {};
  const okUser = igual(usuario, process.env.ADMIN_USER);
  const okPass = igual(senha, process.env.ADMIN_PASSWORD);
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || !(okUser && okPass)) {
    registrarErro(ip);
    return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
  }
  tentativas.delete(ip);
  const token = jwt.sign({ sub: process.env.ADMIN_USER }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
}

export function exigirLogin(req, res, next) {
  const [tipo, token] = (req.get('authorization') || '').split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  }
}
