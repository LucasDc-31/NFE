import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { brl } from '../pedido';
import { Botao, Campo, Cartao, Opcao, Rodape } from '../ui';
import { colors } from '../theme';

const FORMAS = [
  { id: 'whatsapp', nome: 'WhatsApp' },
  { id: 'email', nome: 'E-mail' },
  { id: 'nenhum', nome: 'Não enviar' },
];

export default function PassoEnvio({ f }) {
  const { envioTipo, setEnvioTipo, email, setEmail, telefone, setTelefone, total, qtdItens, emitir, loading } = f;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
        <Cartao>
          <Text style={styles.secao}>Como o cliente quer receber?</Text>
          <View style={styles.linhaOpcoes}>
            {FORMAS.map((o) => (
              <Opcao key={o.id} texto={o.nome} ativo={envioTipo === o.id} onPress={() => setEnvioTipo(o.id)} />
            ))}
          </View>

          {envioTipo === 'whatsapp' && (
            <Campo
              style={{ marginTop: 14, marginBottom: 0 }}
              label="WhatsApp do cliente (com DDD)"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
              placeholder="(44) 99999-9999"
            />
          )}
          {envioTipo === 'email' && (
            <Campo
              style={{ marginTop: 14, marginBottom: 0 }}
              label="E-mail do cliente"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="cliente@email.com"
            />
          )}
          <Text style={styles.ajuda}>
            {envioTipo === 'whatsapp' && 'Depois de emitir, você toca em um botão para abrir a conversa já com a mensagem pronta.'}
            {envioTipo === 'email' && 'O cupom é enviado automaticamente por e-mail assim que a nota for autorizada.'}
            {envioTipo === 'nenhum' && 'A nota será emitida e você poderá enviar depois, na próxima tela.'}
          </Text>
        </Cartao>

        <Cartao style={{ marginTop: 14 }}>
          <Text style={styles.secao}>Resumo</Text>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoRotulo}>{qtdItens} {qtdItens === 1 ? 'item' : 'itens'}</Text>
            <Text style={styles.resumoValor}>{brl(total)}</Text>
          </View>
        </Cartao>
      </ScrollView>

      <Rodape>
        <Botao titulo={`Emitir nota · ${brl(total)}`} onPress={emitir} loading={loading} />
      </Rodape>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { padding: 20, paddingTop: 6, paddingBottom: 30, width: '100%', maxWidth: 640, alignSelf: 'center' },
  secao: { fontSize: 16, fontWeight: '800', color: colors.texto, marginBottom: 12 },
  linhaOpcoes: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  ajuda: { color: colors.suave, fontSize: 13, marginTop: 12 },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumoRotulo: { color: colors.suave, fontSize: 15, fontWeight: '600' },
  resumoValor: { color: colors.texto, fontSize: 22, fontWeight: '900' },
});
