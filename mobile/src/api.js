import { API_URL } from './config';
import { getToken, setToken } from './session';

// Chamado quando a API responde 401 com sessão ativa (token expirado)
let aoExpirar = () => {};
export const definirAoExpirar = (fn) => {
  aoExpirar = fn;
};

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && path !== '/login') {
    setToken(null);
    aoExpirar();
  }
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
  return data;
}

export async function entrar(usuario, senha) {
  const { token } = await request('/login', { method: 'POST', body: JSON.stringify({ usuario, senha }) });
  setToken(token);
}

export const sair = () => setToken(null);

export const carregarCardapio = () => request('/produtos');

// pedido: { itens: [{ produtoId, varianteId, quantidade }], pagamento, cliente: { cpf } }
export const emitirNota = (pedido) => request('/notas', { method: 'POST', body: JSON.stringify(pedido) });

export const consultarNota = (ref) => request(`/notas/${ref}`);

export const enviarEmail = (ref, email) =>
  request(`/notas/${ref}/email`, { method: 'POST', body: JSON.stringify({ email }) });

// Baixa o cupom (DANFCE) autenticado e devolve um Blob
export async function baixarDanfe(ref) {
  const res = await fetch(`${API_URL}/notas/${ref}/danfe`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.erro || 'Cupom indisponível para esta nota');
  }
  return res.blob();
}
