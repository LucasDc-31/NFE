import fs from 'node:fs';

const ARQUIVO = new URL('../data/produtos.json', import.meta.url);

// Lê a cada chamada: editar o JSON vale sem reiniciar o servidor.
export function carregarCatalogo() {
  return JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
}

// Versão enviada ao app (sem dados fiscais)
export function cardapioPublico() {
  const { categorias, produtos } = carregarCatalogo();
  return {
    categorias: categorias.map(({ id, nome }) => ({ id, nome })),
    produtos: produtos.map((p) => ({
      id: p.id,
      categoria: p.categoria,
      nome: p.nome,
      variantes: p.variantes.map((v) => ({
        id: v.id,
        nome: v.nome,
        preco: Number(v.preco) || 0,
        ...(v.precoLivre ? { precoLivre: true } : {}),
      })),
    })),
  };
}

const centavos = (n) => Math.round(Number(n) * 100);

// Converte o carrinho do app em itens com dados fiscais vindos do servidor.
// O preço pode ser editado na hora da venda (it.preco); sem edição, vale o do cardápio.
export function resolverItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) throw new Error('Adicione ao menos um item');
  const { categorias, produtos } = carregarCatalogo();

  return itens.map((it) => {
    const produto = produtos.find((p) => p.id === it.produtoId);
    const variante = produto?.variantes.find((v) => v.id === it.varianteId);
    if (!produto || !variante) throw new Error('Item não encontrado no cardápio');

    const quantidade = Number(it.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
      throw new Error(`Quantidade inválida para ${produto.nome}`);
    }
    const informado = it.preco !== undefined && it.preco !== null && it.preco !== '';
    const preco = informado ? Number(it.preco) : Number(variante.preco);
    if (!(preco > 0) || preco > 9999.99) {
      throw new Error(`Informe um valor válido para "${produto.nome} - ${variante.nome}" (de R$ 0,01 a R$ 9.999,99)`);
    }
    const categoria = categorias.find((c) => c.id === produto.categoria);
    if (!categoria?.fiscal) throw new Error(`Categoria sem dados fiscais: ${produto.categoria}`);

    return {
      codigo: `${produto.id}.${variante.id}`.slice(0, 60),
      descricao: `${produto.nome} - ${variante.nome}`.slice(0, 120),
      quantidade,
      precoCentavos: centavos(preco),
      // O bloco fiscal do produto (ou da variação) sobrepõe o da categoria: útil para itens com tributação diferente
      fiscal: { ...categoria.fiscal, ...(produto.fiscal || {}), ...(variante.fiscal || {}) },
    };
  });
}
