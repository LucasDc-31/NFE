import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { brl } from '../pedido';
import { Botao, Opcao, Rodape } from '../ui';
import { colors } from '../theme';

export default function PassoProdutos({ f }) {
  const { cardapio, linhas, qtdItens, total, adicionar, avancar } = f;
  const [categoria, setCategoria] = useState(null);
  const [completo, setCompleto] = useState(false);

  useEffect(() => {
    if (cardapio && !categoria) setCategoria(cardapio.categorias[0]?.id || null);
  }, [cardapio, categoria]);

  if (!cardapio) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.laranja} />
      </View>
    );
  }

  const rapidos = ['janta-janta', 'refeicoes-refeicao']
    .map((id) => cardapio.produtos.find((p) => p.id === id))
    .filter(Boolean);

  const qtdDe = (p, v) =>
    linhas.filter((l) => l.produto.id === p.id && l.variante.id === v.id).reduce((s, l) => s + l.quantidade, 0);
  const produtos = cardapio.produtos.filter((p) => p.categoria === categoria);

  return (
    <View style={{ flex: 1 }}>
      {!completo && rapidos.length > 0 && (
        <ScrollView contentContainerStyle={styles.lista}>
          <Text style={styles.dica}>Toque para adicionar. Você coloca o valor no próximo passo.</Text>
          {rapidos.map((p) => {
            const v = p.variantes[0];
            const qtd = qtdDe(p, v);
            return (
              <Pressable key={p.id} onPress={() => adicionar(p, v)} style={[styles.grande, qtd > 0 && styles.varianteAtiva]}>
                <Text style={styles.grandeNome}>{p.nome}</Text>
                {qtd > 0 ? <Text style={styles.badge}>{qtd}</Text> : null}
              </Pressable>
            );
          })}
          <Pressable onPress={() => setCompleto(true)} style={styles.link}>
            <Text style={styles.linkTexto}>Detalhar produtos (cardápio completo)</Text>
          </Pressable>
        </ScrollView>
      )}

      {(completo || rapidos.length === 0) && (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categorias}>
          {cardapio.categorias.map((c) => (
            <Opcao key={c.id} escuro texto={c.nome} ativo={categoria === c.id} onPress={() => setCategoria(c.id)} />
          ))}
        </ScrollView>
      </View>
      )}

      {(completo || rapidos.length === 0) && (
      <ScrollView contentContainerStyle={styles.lista}>
        {produtos.map((p) => (
          <View key={p.id} style={styles.produto}>
            <Text style={styles.produtoNome}>{p.nome}</Text>
            <View style={styles.variantes}>
              {p.variantes.map((v) => {
                const qtd = qtdDe(p, v);
                return (
                  <Pressable key={v.id} onPress={() => adicionar(p, v)} style={[styles.variante, qtd > 0 && styles.varianteAtiva]}>
                    <Text style={styles.varianteNome}>{v.nome}</Text>
                    <Text style={styles.variantePreco}>
                      {v.precoLivre ? 'valor livre' : v.preco > 0 ? brl(v.preco) : 'informar valor'}
                    </Text>
                    {qtd > 0 ? <Text style={styles.badge}>{qtd}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {rapidos.length > 0 && (
          <Pressable onPress={() => setCompleto(false)} style={styles.link}>
            <Text style={styles.linkTexto}>Voltar para Janta / Refeição</Text>
          </Pressable>
        )}
      </ScrollView>
      )}

      <Rodape
        resumo={
          <View>
            <Text style={styles.resumoQtd}>{qtdItens === 0 ? 'Nenhum item' : `${qtdItens} ${qtdItens === 1 ? 'item' : 'itens'}`}</Text>
            <Text style={styles.resumoTotal}>{brl(total)}</Text>
          </View>
        }
      >
        <Botao titulo="Continuar" onPress={avancar} disabled={qtdItens === 0} />
      </Rodape>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  categorias: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 2 },
  lista: { padding: 20, paddingTop: 6, paddingBottom: 30, width: '100%', maxWidth: 640, alignSelf: 'center' },
  produto: { backgroundColor: colors.creme, borderRadius: 16, borderWidth: 1, borderColor: colors.cremeBorda, padding: 14, marginBottom: 12 },
  produtoNome: { fontSize: 17, fontWeight: '800', color: colors.texto, marginBottom: 10 },
  variantes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variante: { borderWidth: 1.5, borderColor: colors.cremeBorda, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 13, minWidth: 100, backgroundColor: '#fff' },
  varianteAtiva: { borderColor: colors.laranja, backgroundColor: '#fff3d6' },
  varianteNome: { fontSize: 14, fontWeight: '700', color: colors.texto },
  variantePreco: { fontSize: 13, color: colors.laranjaEscuro, fontWeight: '700', marginTop: 2 },
  badge: { position: 'absolute', top: -9, right: -9, backgroundColor: colors.vinho, color: '#fff', fontWeight: '800', fontSize: 12, minWidth: 24, height: 24, lineHeight: 24, textAlign: 'center', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: colors.laranja },
  dica: { color: colors.suave, fontSize: 14, marginBottom: 14 },
  grande: { backgroundColor: colors.creme, borderRadius: 18, borderWidth: 2, borderColor: colors.cremeBorda, paddingVertical: 34, alignItems: 'center', marginBottom: 14 },
  grandeNome: { fontSize: 26, fontWeight: '900', color: colors.texto },
  link: { alignItems: 'center', paddingVertical: 14 },
  linkTexto: { color: colors.laranjaEscuro, fontWeight: '800', fontSize: 15, textDecorationLine: 'underline' },
  resumoQtd: { color: colors.suaveClaro, fontSize: 13, fontWeight: '600' },
  resumoTotal: { color: colors.laranja, fontSize: 22, fontWeight: '900' },
});
