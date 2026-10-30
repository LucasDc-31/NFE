import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { entrar } from '../api';
import { avisar } from '../toast';
import { Botao, Campo, Cartao, Logo } from '../ui';
import { colors } from '../theme';

export default function Login({ onEntrou }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function enviar() {
    if (!usuario || !senha) return avisar('Informe usuário e senha', '', 'erro');
    setLoading(true);
    try {
      await entrar(usuario.trim(), senha);
      onEntrou();
    } catch (e) {
      avisar('Não foi possível entrar', e.message, 'erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Logo largura={300} />
      <Cartao style={styles.cartao}>
        <Text style={styles.titulo}>Entrar</Text>
        <Text style={styles.sub}>Acesse para emitir notas fiscais</Text>
        <Campo label="Usuário" value={usuario} onChangeText={setUsuario} autoCapitalize="none" autoCorrect={false} autoComplete="username" />
        <Campo label="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="current-password" onSubmitEditing={enviar} />
        <Botao titulo="Entrar" onPress={enviar} loading={loading} />
      </Cartao>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 8 },
  cartao: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  titulo: { fontSize: 24, fontWeight: '800', color: colors.texto },
  sub: { color: colors.suave, marginTop: 2, marginBottom: 16 },
});
