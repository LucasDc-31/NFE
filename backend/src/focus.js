// Cliente mínimo da API Focus NFe para NFC-e (nota fiscal de consumidor).
// Documentação: https://doc.focusnfe.com.br/reference/emitir_nfce

const env = process.env;

const FORMAS_PAGAMENTO = {
  '01': 'Dinheiro',
  '03': 'Cartão de crédito',
  '04': 'Cartão de débito',
  '17': 'PIX',
};
export const pagamentoValido = (codigo) => Object.hasOwn(FORMAS_PAGAMENTO, codigo);

function baseUrl() {
  return (env.FOCUS_BASE_URL || 'https://homologacao.focusnfe.com.br').replace(/\/$/, '');
}

function authHeader() {
  // Focus usa HTTP Basic com o token como usuário e senha vazia
  return 'Basic ' + Buffer.from(`${env.FOCUS_TOKEN}:`).toString('base64');
}

const somenteDigitos = (v = '') => String(v).replace(/\D/g, '');
const reais = (centavos) => Number((centavos / 100).toFixed(2));

export function montarPayload({ itens, pagamento, documento }) {
  const totalCentavos = itens.reduce((s, i) => s + i.precoCentavos * i.quantidade, 0);

  const payload = {
    cnpj_emitente: somenteDigitos(env.EMITENTE_CNPJ),
    data_emissao: new Date().toISOString(),
    natureza_operacao: 'VENDA AO CONSUMIDOR',
    modalidade_frete: '9',
    local_destino: '1',
    presenca_comprador: '1',
    items: itens.map((i, idx) => ({
      numero_item: idx + 1,
      codigo_produto: i.codigo,
      descricao: i.descricao,
      codigo_ncm: i.fiscal.ncm,
      cfop: i.fiscal.cfop,
      ...(i.fiscal.cest ? { cest: i.fiscal.cest } : {}),
      unidade_comercial: 'UN',
      quantidade_comercial: i.quantidade,
      valor_unitario_comercial: reais(i.precoCentavos),
      valor_bruto: reais(i.precoCentavos * i.quantidade),
      unidade_tributavel: 'UN',
      quantidade_tributavel: i.quantidade,
      valor_unitario_tributavel: reais(i.precoCentavos),
      icms_origem: env.ICMS_ORIGEM || '0',
      icms_situacao_tributaria: i.fiscal.csosn,
      pis_situacao_tributaria: env.PIS_COFINS_CST || '07',
      cofins_situacao_tributaria: env.PIS_COFINS_CST || '07',
    })),
    formas_pagamento: [{ forma_pagamento: pagamento, valor_pagamento: reais(totalCentavos) }],
  };
  if (documento) {
    if (documento.tipo === 'cpf') payload.cpf_destinatario = documento.numero;
    else payload.cnpj_destinatario = documento.numero;
    // NFC-e é nota de consumidor final: a SEFAZ exige indIEDest = 9 ("Não contribuinte") sempre que o
    // destinatário é identificado, inclusive com CNPJ (senão rejeita: "789 - NFC-e para destinatário
    // contribuinte de ICMS"). Cliente empresa que precisa de crédito de ICMS deve receber NF-e (modelo 55).
    payload.indicador_inscricao_estadual_destinatario = '9';
  }
  return { payload, total: reais(totalCentavos) };
}

async function focusFetch(path, options = {}) {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const texto = await res.text();
  let corpo;
  try {
    corpo = texto ? JSON.parse(texto) : {};
  } catch {
    corpo = { raw: texto };
  }
  return { status: res.status, corpo };
}

export async function emitirNfce(ref, pedido) {
  const { payload, total } = montarPayload(pedido);
  const { status, corpo } = await focusFetch(`/v2/nfce?ref=${encodeURIComponent(ref)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (status >= 400) {
    throw new Error(corpo.mensagem || `Focus NFe respondeu ${status}`);
  }
  return { ...normalizar(ref, corpo), total };
}

export async function consultarNfce(ref) {
  const { status, corpo } = await focusFetch(`/v2/nfce/${encodeURIComponent(ref)}`);
  if (status === 404) return { ref, status: 'nao_encontrada' };
  if (status >= 400) throw new Error(corpo.mensagem || `Focus NFe respondeu ${status}`);
  return normalizar(ref, corpo);
}

// Padroniza a resposta para o app. Confira os nomes de campo numa resposta real da homologação.
function normalizar(ref, c) {
  const absoluta = (p) => (!p ? null : p.startsWith('http') ? p : `${baseUrl()}${p}`);
  return {
    ref,
    status: c.status, // processando_autorizacao | autorizado | erro_autorizacao | cancelado
    numero: c.numero || null,
    serie: c.serie || null,
    chave: c.chave_nfe || null,
    mensagem: c.erros?.map((e) => e.mensagem).join('; ') || c.mensagem_sefaz || c.mensagem || null,
    urlConsulta: c.url_consulta_nf || c.qrcode_url || null, // link público para o cliente
    urlDanfe: absoluta(c.caminho_danfe),
    urlXml: absoluta(c.caminho_xml_nota_fiscal),
  };
}

export async function baixarArquivo(url) {
  const res = await fetch(url, { headers: { Authorization: authHeader() } });
  if (!res.ok) throw new Error(`Falha ao baixar arquivo (${res.status})`);
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') || 'application/octet-stream',
  };
}
