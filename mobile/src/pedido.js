export const brl = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Aceita "30", "30.5", "30,50" e "1.250,00"
export const parsePreco = (t) => {
  const s = String(t ?? '').trim();
  const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Todo item tem preço editável; o valor do cardápio é só a sugestão inicial
export const precoDe = (l) => parsePreco(l.precoTexto);
export const sugestao = (v) => (v.preco > 0 ? v.preco.toFixed(2).replace('.', ',') : '');

export const FORMAS_PAGAMENTO = [
  { codigo: '01', nome: 'Dinheiro' },
  { codigo: '17', nome: 'PIX' },
  { codigo: '04', nome: 'Débito' },
  { codigo: '03', nome: 'Crédito' },
];
