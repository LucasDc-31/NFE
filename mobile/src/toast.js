import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

// Substituto do Alert.alert, que não funciona no navegador.
let ouvinte = null;

export function avisar(titulo, texto = '', tipo = 'info') {
  if (ouvinte) ouvinte({ titulo, texto, tipo, id: Date.now() });
}

export function limparAviso() {
  if (ouvinte) ouvinte(null);
}

export function ToastHost() {
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    ouvinte = setAviso;
    return () => {
      ouvinte = null;
    };
  }, []);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(t);
  }, [aviso]);

  if (!aviso) return null;
  const cor = aviso.tipo === 'erro' ? colors.danger : aviso.tipo === 'ok' ? colors.ok : colors.vinhoEscuro;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable style={[styles.toast, { backgroundColor: cor }]} onPress={() => setAviso(null)}>
        <Text style={styles.titulo}>{aviso.titulo}</Text>
        {aviso.texto ? <Text style={styles.texto}>{aviso.texto}</Text> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', paddingHorizontal: 16 },
  toast: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, maxWidth: 520, width: '100%', borderWidth: 1, borderColor: colors.laranja },
  titulo: { color: '#fff', fontWeight: '700', fontSize: 15 },
  texto: { color: '#fff', marginTop: 2, fontSize: 14 },
});
