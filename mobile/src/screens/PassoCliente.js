import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { cnpjValido, cpfValido, formatarDoc } from '../docs';
import { FORMAS_PAGAMENTO } from '../pedido';
import { Botao, Campo, Cartao, Opcao, Rodape } from '../ui';
import { colors } from '../theme';

const TIPOS = [
  { id: 'nenhum', nome: 'Sem documento' },
  { id: 'cpf', nome: 'CPF' },
  { id: 'cnpj', nome: 'CNPJ' },
];

export default function PassoCliente({ f }) {
  const { docTipo, setDocTipo, docNumero, setDocNumero, pagamento, setPagamento, avancar } = f;

  const completo = docTipo === 'cpf' ? docNumero.replace(/\D/g, '').length === 11 : docNumero.replace(/\D/g, '').length === 14;
  const erro =
    docTipo !== 'nenhum' && completo && !(docTipo === 'cpf' ? cpfValido(docNumero) : cnpjValido(docNumero))
      ? `${docTipo.toUpperCase()} inválido, confira os números`
      : null;

  function escolherTipo(id) {
    setDocTipo(id);
    setDocNumero('');
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
        <Cartao style={{ marginBottom: 14 }}>
          <Text style={styles.secao}>CPF ou CNPJ na nota?</Text>
          <View style={styles.linhaOpcoes}>
            {TIPOS.map((t) => (
              <Opcao key={t.id} texto={t.nome} ativo={docTipo === t.id} onPress={() => escolherTipo(t.id)} />
            ))}
          </View>
          {docTipo !== 'nenhum' ? (
            <Campo
              style={{ marginTop: 14, marginBottom: 0 }}
              label={docTipo === 'cpf' ? 'CPF do cliente' : 'CNPJ do cliente'}
              value={docNumero}
              onChangeText={(t) => setDocNumero(formatarDoc(docTipo, t))}
              keyboardType="number-pad"
              placeholder={docTipo === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              erro={erro}
            />
          ) : (
            <Text style={styles.ajuda}>
              A nota será emitida sem identificar o cliente. Dica: pergunte se ele quer o CPF na nota, porque no Paraná o CPF dá créditos do programa Nota Paraná.
            </Text>
          )}
          {docTipo === 'cnpj' ? (
            <Text style={styles.ajuda}>
              A NFC-e é nota de consumidor final: não permite ao cliente empresa aproveitar crédito de ICMS. Se ele precisar disso, é caso de NF-e.
            </Text>
          ) : null}
        </Cartao>

        <Cartao>
          <Text style={styles.secao}>Forma de pagamento</Text>
          <View style={styles.linhaOpcoes}>
            {FORMAS_PAGAMENTO.map((p) => (
              <Opcao key={p.codigo} texto={p.nome} ativo={pagamento === p.codigo} onPress={() => setPagamento(p.codigo)} />
            ))}
          </View>
        </Cartao>
      </ScrollView>

      <Rodape>
        <Botao titulo="Continuar" onPress={avancar} />
      </Rodape>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { padding: 20, paddingTop: 6, paddingBottom: 30, width: '100%', maxWidth: 640, alignSelf: 'center' },
  secao: { fontSize: 16, fontWeight: '800', color: colors.texto, marginBottom: 12 },
  linhaOpcoes: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  ajuda: { color: colors.suave, fontSize: 13, marginTop: 12 },
});
