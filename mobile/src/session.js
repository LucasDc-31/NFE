// Guarda o token de login no navegador (localStorage) com fallback em memória.
const CHAVE = 'nfe_token';
let memoria = null;

export function getToken() {
  try {
    return window.localStorage.getItem(CHAVE) || memoria;
  } catch {
    return memoria;
  }
}

export function setToken(token) {
  memoria = token;
  try {
    if (token) window.localStorage.setItem(CHAVE, token);
    else window.localStorage.removeItem(CHAVE);
  } catch {
    /* navegação privada: segue só em memória */
  }
}
