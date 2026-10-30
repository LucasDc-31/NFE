import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { brl, precoDe } from '../pedido';
import { Botao, Cartao, Rodape } from '../ui';
import { colors } from '../theme';

export default function PassoValores({ f }) {
  const { linhas, total, mudarQtd, editarPreco, avancar } = f;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.lista}>
        <Text style={styles.dica}>
          Confira os itens. Toque no valor para colocar ou alterar o preço (valor por unidade).
        </Text>

        {linhas.map((l) => {
          const vazio = !(precoDe(l) > 0);
          return (
            <Cartao key={l.chave} style={styles.linha}>
              <Text style={styles.nome}>
                {l.produto.nome} - {l.variante.nome}
              </Text>
              <View style={styles.controles}>
                <View style={styles.qtd}>
                  <Pressable style={styles.qtdBtn} onPress={() => mudarQtd(l.chave, -1)}>
                    <Text style={styles.qtdBtnTexto}>−</Text>
                  </Pressable>
                  <Text style={styles.qtdNumero}>{l.quantidade}</Text>
                  <Pressable style={styles.qtdBtn} onPress={() => mudarQtd(l.chave, 1)}>
                    <Text style={styles.qtdBtnTexto}>+</Text>
                  </Pressable>
                </View>

                <View style={[styles.preco, vazio && { borderColor: colors.danger }]}>
                  <Text style={styles.prefixo}>R$</Text>
                  <TextInput
                    style={styles.precoInput}
                    value={l.precoTexto}
                    onChangeText={(t) => editarPreco(l.chave, t)}
                    keyboardType="decimal-pad"
                    placeholder="0,00"
                    placeholderTextColor={colors.suave}
                    selectTextOnFocus
                  />
                </View>

                <Text style={styles.subtotal}>{brl(precoDe(l) * l.quantidade)}</Text>
              </View>
            </Cartao>
          );
        })}
      </ScrollView>

      <Rodape
        resumo={
          <View>
            <Text style={styles.resumoQtd}>Total</Text>
            <Text style={styles.resumoTotal}>{brl(total)}</Text>
          </View>
        }
      >
        <Botao titulo="Continuar" onPress={avancar} />
      </Rodape>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { padding: 20, paddingTop: 6, paddingBottom: 30, width: '100%', maxWidth: 640, alignSelf: 'center' },
  dica: { color: colors.suaveClaro, fontSize: 14, marginBottom: 14 },
  linha: { marginBottom: 12 },
  nome: { fontSize: 16, fontWeight: '800', color: colors.texto, marginBottom: 10 },
  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  qtd: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtdBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: colors.laranjaEscuro, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  qtdBtnTexto: { fontSize: 20, color: colors.laranjaEscuro, lineHeight: 22, fontWeight: '700' },
  qtdNumero: { minWidth: 22, textAlign: 'center', fontWeight: '800', color: colors.texto, fontSize: 16 },
  preco: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.laranja, borderRadius: 10, backgroundColor: '#fff3d6', paddingLeft: 10 },
  prefixo: { color: colors.suave, fontWeight: '700' },
  precoInput: { outlineStyle: 'none', width: 78, paddingVertical: 8, paddingHorizontal: 8, fontSize: 16, fontWeight: '800', color: colors.texto, textAlign: 'right' },
  subtotal: { minWidth: 84, textAlign: 'right', color: colors.texto, fontWeight: '800', fontSize: 15 },
  resumoQtd: { color: colors.suaveClaro, fontSize: 13, fontWeight: '600' },
  resumoTotal: { color: colors.laranja, fontSize: 22, fontWeight: '900' },
});
