// CPF / CNPJ: máscara e validação (mesmas regras do servidor)
const dig = (v = '') => String(v).replace(/\D/g, '');

export function formatarDoc(tipo, valor) {
  const d = dig(valor).slice(0, tipo === 'cnpj' ? 14 : 11);
  if (tipo === 'cnpj') {
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function cpfValido(valor) {
  const c = dig(valor);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

export function cnpjValido(valor) {
  const c = dig(valor);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [12, 13]) {
    const pesos = t === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * pesos[i];
    const resto = soma % 11;
    if ((resto < 2 ? 0 : 11 - resto) !== Number(c[t])) return false;
  }
  return true;
}
