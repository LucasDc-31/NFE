import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { carregarCardapio, emitirNota } from '../api';
import { avisar, limparAviso } from '../toast';
import { cnpjValido, cpfValido } from '../docs';
import { precoDe, sugestao } from '../pedido';
import { Cabecalho } from '../ui';
import PassoProdutos from './PassoProdutos';
import PassoValores from './PassoValores';
import PassoCliente from './PassoCliente';
import PassoEnvio from './PassoEnvio';

const TITULOS = ['Escolha os produtos', 'Valores', 'Documento e pagamento', 'Enviar a nota'];

export default function Fluxo({ onEmitida, onCancelar }) {
  const [passo, setPasso] = useState(1);
  const [cardapio, setCardapio] = useState(null);
  const [carrinho, setCarrinho] = useState({}); // chave -> { produto, variante, quantidade, precoTexto }
  const [docTipo, setDocTipo] = useState('nenhum'); // nenhum | cpf | cnpj
  const [docNumero, setDocNumero] = useState('');
  const [pagamento, setPagamento] = useState(null);
  const [envioTipo, setEnvioTipo] = useState('whatsapp'); // whatsapp | email | nenhum
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarCardapio()
      .then(setCardapio)
      .catch((e) => avisar('Não foi possível carregar o cardápio', e.message, 'erro'));
  }, []);

  const linhas = useMemo(() => Object.entries(carrinho).map(([chave, l]) => ({ chave, ...l })), [carrinho]);
  const total = linhas.reduce((s, l) => s + precoDe(l) * l.quantidade, 0);
  const qtdItens = linhas.reduce((s, l) => s + l.quantidade, 0);

  // ---- ações do carrinho ----
  function adicionar(produto, variante) {
    setCarrinho((atual) => {
      if (variante.precoLivre) {
        // Prato personalizado: cada toque cria uma linha nova, com valor próprio
        const chave = `${produto.id}|${variante.id}|${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        return { ...atual, [chave]: { produto, variante, quantidade: 1, precoTexto: sugestao(variante) } };
      }
      const chave = `${produto.id}|${variante.id}`;
      const linha = atual[chave];
      if (linha) return { ...atual, [chave]: { ...linha, quantidade: Math.min(linha.quantidade + 1, 99) } };
      return { ...atual, [chave]: { produto, variante, quantidade: 1, precoTexto: sugestao(variante) } };
    });
  }

  function mudarQtd(chave, delta) {
    setCarrinho((atual) => {
      const linha = atual[chave];
      if (!linha) return atual;
      const quantidade = Math.min(linha.quantidade + delta, 99);
      if (quantidade < 1) {
        const { [chave]: _removido, ...resto } = atual;
        return resto;
      }
      return { ...atual, [chave]: { ...linha, quantidade } };
    });
  }

  function editarPreco(chave, texto) {
    setCarrinho((atual) => (atual[chave] ? { ...atual, [chave]: { ...atual[chave], precoTexto: texto } } : atual));
  }

  // ---- navegação com validação de cada passo ----
  function avancar() {
    if (passo === 1) {
      if (!linhas.length) return avisar('Pedido vazio', 'Toque nos itens para adicionar.', 'erro');
    }
    if (passo === 2) {
      const semValor = linhas.find((l) => !(precoDe(l) > 0));
      if (semValor) return avisar('Informe o valor', `Digite o valor de "${semValor.produto.nome} - ${semValor.variante.nome}".`, 'erro');
    }
    if (passo === 3) {
      if (docTipo === 'cpf' && !cpfValido(docNumero)) return avisar('CPF inválido', 'Confira os números digitados.', 'erro');
      if (docTipo === 'cnpj' && !cnpjValido(docNumero)) return avisar('CNPJ inválido', 'Confira os números digitados.', 'erro');
      if (!pagamento) return avisar('Forma de pagamento', 'Escolha como o cliente pagou.', 'erro');
    }
    limparAviso();
    setPasso((p) => p + 1);
  }

  function voltar() {
    limparAviso();
    if (passo === 1) onCancelar();
    else setPasso((p) => p - 1);
  }

  async function emitir() {
    const fone = telefone.replace(/\D/g, '');
    if (envioTipo === 'email' && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return avisar('E-mail inválido', 'Digite o e-mail do cliente.', 'erro');
    }
    if (envioTipo === 'whatsapp' && fone.length < 10) {
      return avisar('WhatsApp inválido', 'Digite o número com DDD.', 'erro');
    }
    setLoading(true);
    try {
      const nota = await emitirNota({
        itens: linhas.map((l) => ({
          produtoId: l.produto.id,
          varianteId: l.variante.id,
          quantidade: l.quantidade,
          preco: precoDe(l),
        })),
        pagamento,
        cliente: { documento: docTipo === 'nenhum' ? '' : docNumero },
      });
      limparAviso();
      onEmitida({ nota, envio: { tipo: envioTipo, email: email.trim(), telefone: fone } });
    } catch (e) {
      avisar('Não foi possível emitir', e.message, 'erro');
    } finally {
      setLoading(false);
    }
  }

  const f = {
    cardapio, linhas, total, qtdItens, loading,
    adicionar, mudarQtd, editarPreco, avancar, emitir,
    docTipo, setDocTipo, docNumero, setDocNumero, pagamento, setPagamento,
    envioTipo, setEnvioTipo, email, setEmail, telefone, setTelefone,
  };

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho passo={passo} total={4} titulo={TITULOS[passo - 1]} onVoltar={voltar} />
      {passo === 1 && <PassoProdutos f={f} />}
      {passo === 2 && <PassoValores f={f} />}
      {passo === 3 && <PassoCliente f={f} />}
      {passo === 4 && <PassoEnvio f={f} />}
    </View>
  );
}
