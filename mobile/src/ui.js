import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from './theme';

// Logo extraída do cardápio (mobile/public/logo.png)
export function Logo({ largura = 280 }) {
  return (
    <Image
      source={{ uri: '/logo.png' }}
      style={{ width: largura, height: (largura * 573) / 739, alignSelf: 'center' }}
      resizeMode="contain"
      accessibilityLabel="Marlene's Grill"
    />
  );
}

export function Botao({ titulo, onPress, tipo = 'primario', disabled, loading, style }) {
  const t = TIPOS[tipo];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.botao, t.caixa, (disabled || loading) && { opacity: 0.5 }, style]}
    >
      {loading ? <ActivityIndicator color={t.cor} /> : <Text style={[styles.botaoTexto, { color: t.cor }]}>{titulo}</Text>}
    </Pressable>
  );
}

const TIPOS = {
  primario: { caixa: { backgroundColor: colors.laranja }, cor: colors.vinhoEscuro },
  whatsapp: { caixa: { backgroundColor: colors.whatsapp }, cor: '#fff' },
  contorno: { caixa: { borderWidth: 1.5, borderColor: colors.laranja }, cor: colors.laranja },
  claro: { caixa: { backgroundColor: colors.creme }, cor: colors.vinho },
};

export function Cartao({ children, style }) {
  return <View style={[styles.cartao, style]}>{children}</View>;
}

export function Campo({ label, erro, style, ...props }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {label ? <Text style={styles.campoLabel}>{label}</Text> : null}
      <TextInput style={[styles.campo, erro && { borderColor: colors.danger }]} placeholderTextColor={colors.suave} {...props} />
      {erro ? <Text style={styles.campoErro}>{erro}</Text> : null}
    </View>
  );
}

// Botão de opção (categorias, pagamento, tipo de documento...). `escuro` = sobre fundo vinho.
export function Opcao({ texto, ativo, onPress, escuro, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.opcao, escuro ? styles.opcaoEscuro : styles.opcaoClaro, ativo && styles.opcaoAtiva, style]}
    >
      <Text style={[styles.opcaoTexto, { color: escuro ? colors.textoClaro : colors.texto }, ativo && { color: colors.vinhoEscuro }]}>
        {texto}
      </Text>
    </Pressable>
  );
}

// Cabeçalho dos passos: voltar, "Passo X de N", barra de progresso e título
export function Cabecalho({ passo, total, titulo, onVoltar }) {
  return (
    <View style={styles.cabecalho}>
      <View style={styles.cabecalhoTopo}>
        <Pressable onPress={onVoltar} hitSlop={10}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.passoTexto}>
          Passo {passo} de {total}
        </Text>
      </View>
      <View style={styles.progresso}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.segmento, i < passo && { backgroundColor: colors.laranja }]} />
        ))}
      </View>
      <Text style={styles.cabecalhoTitulo}>{titulo}</Text>
    </View>
  );
}

// Barra inferior fixa com resumo e botão principal
export function Rodape({ resumo, children }) {
  return (
    <View style={styles.rodape}>
      <View style={styles.rodapeInterno}>
        {resumo ? <View style={{ flex: 1 }}>{resumo}</View> : null}
        <View style={resumo ? { minWidth: 150 } : { flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  botao: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { fontSize: 17, fontWeight: '800' },
  cartao: { backgroundColor: colors.creme, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cremeBorda },
  campoLabel: { fontSize: 13, color: colors.suave, marginBottom: 4, fontWeight: '600' },
  campo: { outlineStyle: 'solid', outlineWidth: 2, outlineColor: colors.laranja, borderWidth: 1, borderColor: colors.cremeBorda, borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, color: colors.texto },
  campoErro: { color: colors.danger, fontSize: 12, marginTop: 4 },
  opcao: { borderWidth: 1, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16, marginRight: 8 },
  opcaoClaro: { backgroundColor: '#fff', borderColor: colors.cremeBorda },
  opcaoEscuro: { backgroundColor: colors.vinhoClaro, borderColor: colors.vinhoClaro },
  opcaoAtiva: { backgroundColor: colors.laranja, borderColor: colors.laranja },
  opcaoTexto: { fontWeight: '700', fontSize: 15 },
  cabecalho: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, width: '100%', maxWidth: 640, alignSelf: 'center' },
  cabecalhoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  voltar: { color: colors.laranja, fontSize: 16, fontWeight: '700' },
  passoTexto: { color: colors.suaveClaro, fontSize: 13, fontWeight: '600' },
  progresso: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  segmento: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.vinhoClaro },
  cabecalhoTitulo: { color: colors.textoClaro, fontSize: 26, fontWeight: '800' },
  rodape: { backgroundColor: colors.vinhoEscuro, borderTopWidth: 1, borderTopColor: colors.vinhoClaro, paddingHorizontal: 16, paddingVertical: 12 },
  rodapeInterno: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },
});
