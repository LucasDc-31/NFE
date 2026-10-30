import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Login from './src/screens/Login';
import Home from './src/screens/Home';
import Fluxo from './src/screens/Fluxo';
import Resultado from './src/screens/Resultado';
import { ToastHost, avisar } from './src/toast';
import { definirAoExpirar, sair } from './src/api';
import { getToken } from './src/session';
import { colors } from './src/theme';

export default function App() {
  const [logado, setLogado] = useState(Boolean(getToken()));
  const [tela, setTela] = useState('home'); // home | fluxo | resultado
  const [emitida, setEmitida] = useState(null); // { nota, envio }

  useEffect(() => {
    definirAoExpirar(() => {
      setEmitida(null);
      setTela('home');
      setLogado(false);
      avisar('Sessão expirada', 'Entre novamente.', 'erro');
    });
  }, []);

  function deslogar() {
    sair();
    setEmitida(null);
    setTela('home');
    setLogado(false);
  }

  let conteudo;
  if (!logado) conteudo = <Login onEntrou={() => { setTela('home'); setLogado(true); }} />;
  else if (tela === 'fluxo') {
    conteudo = (
      <Fluxo
        onCancelar={() => setTela('home')}
        onEmitida={(dados) => {
          setEmitida(dados);
          setTela('resultado');
        }}
      />
    );
  } else if (tela === 'resultado' && emitida) {
    conteudo = <Resultado key={emitida.nota.ref} nota={emitida.nota} envio={emitida.envio} onNova={() => { setEmitida(null); setTela('home'); }} />;
  } else conteudo = <Home onEmitir={() => setTela('fluxo')} onSair={deslogar} />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      {conteudo}
      <ToastHost />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.vinho },
});
