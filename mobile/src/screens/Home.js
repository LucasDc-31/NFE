import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Botao, Logo } from '../ui';
import { colors } from '../theme';

export default function Home({ onEmitir, onSair }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Logo largura={320} />
      <View style={styles.faixa}>
        <Text style={styles.faixaTexto}>NOTAS FISCAIS</Text>
      </View>
      <Botao titulo="Emitir nota" onPress={onEmitir} style={styles.botao} />
      <Text style={styles.sair} onPress={onSair}>
        Sair
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 18, width: '100%', maxWidth: 480, alignSelf: 'center' },
  faixa: { backgroundColor: colors.laranjaEscuro, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.laranja },
  faixaTexto: { color: colors.creme, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  botao: { paddingVertical: 22, borderRadius: 18 },
  sair: { color: colors.suaveClaro, textAlign: 'center', fontSize: 15, fontWeight: '600', padding: 10 },
});
