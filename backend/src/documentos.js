// Validação de CPF e CNPJ (dígitos verificadores)

const soDigitos = (v = '') => String(v).replace(/\D/g, '');

export function cpfValido(valor) {
  const c = soDigitos(valor);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(c[t])) return false;
  }
  return true;
}

export function cnpjValido(valor) {
  const c = soDigitos(valor);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [12, 13]) {
    const pesos = t === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * pesos[i];
    const resto = soma % 11;
    const dv = resto < 2 ? 0 : 11 - resto;
    if (dv !== Number(c[t])) return false;
  }
  return true;
}

// Retorna { tipo: 'cpf'|'cnpj', numero } ou null quando em branco. Lança erro se inválido.
export function interpretarDocumento(valor) {
  const d = soDigitos(valor);
  if (!d) return null;
  if (d.length === 11) {
    if (!cpfValido(d)) throw new Error('CPF inválido');
    return { tipo: 'cpf', numero: d };
  }
  if (d.length === 14) {
    if (!cnpjValido(d)) throw new Error('CNPJ inválido');
    return { tipo: 'cnpj', numero: d };
  }
  throw new Error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) ou deixe em branco');
}
