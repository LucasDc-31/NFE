import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { baixarDanfe, consultarNota, enviarEmail } from '../api';
import { avisar } from '../toast';
import { brl } from '../pedido';
import { Botao, Campo, Cartao } from '../ui';
import { colors } from '../theme';

const STATUS = {
  processando_autorizacao: { texto: 'Processando na SEFAZ…', cor: colors.suave },
  autorizado: { texto: 'Nota autorizada', cor: colors.ok },
  erro_autorizacao: { texto: 'Erro na autorização', cor: colors.danger },
  cancelado: { texto: 'Nota cancelada', cor: colors.danger },
};

export default function Resultado({ nota: notaInicial, envio, onNova }) {
  const [nota, setNota] = useState(notaInicial);
  const [email, setEmail] = useState(envio.email || '');
  const [emailEstado, setEmailEstado] = useState('idle'); // idle | enviando | ok | erro
  const [emailErro, setEmailErro] = useState('');
  const timer = useRef(null);
  const emailAutomatico = useRef(false);

  // Consulta o status a cada 3s até sair de "processando"
  useEffect(() => {
    async function checar() {
      try {
        const atual = await consultarNota(nota.ref);
        setNota((anterior) => ({ ...anterior, ...atual }));
        if (atual.status === 'processando_autorizacao') timer.current = setTimeout(checar, 3000);
      } catch {
        timer.current = setTimeout(checar, 5000);
      }
    }
    if (nota.status === 'processando_autorizacao') timer.current = setTimeout(checar, 2000);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autorizada = nota.status === 'autorizado';
  const st = STATUS[nota.status] || { texto: nota.status, cor: colors.suave };

  async function porEmail(destino) {
    setEmailEstado('enviando');
    setEmailErro('');
    try {
      await enviarEmail(nota.ref, destino);
      setEmailEstado('ok');
    } catch (e) {
      setEmailEstado('erro');
      setEmailErro(e.message);
    }
  }

  // E-mail escolhido no passo 4: envia sozinho assim que a nota é autorizada
  useEffect(() => {
    if (autorizada && envio.tipo === 'email' && !emailAutomatico.current) {
      emailAutomatico.current = true;
      porEmail(envio.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizada]);

  function whatsapp() {
    const numero = envio.telefone ? (envio.telefone.startsWith('55') ? envio.telefone : `55${envio.telefone}`) : '';
    const msg = `Olá! Obrigado pela preferência no Marlene's Grill. Segue o seu cupom fiscal${nota.numero ? ` nº ${nota.numero}` : ''}.${
      nota.urlConsulta ? `\n${nota.urlConsulta}` : ''
    }`;
    // Sem número, o WhatsApp deixa escolher o contato. Sem "await" antes: o navegador só abre a aba se for direto do toque.
    Linking.openURL(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`);
  }

  async function compartilharCupom() {
    try {
      const blob = await baixarDanfe(nota.ref);
      const ext = blob.type.includes('pdf') ? 'pdf' : blob.type.includes('html') ? 'html' : 'bin';
      const nome = `cupom-fiscal-${nota.numero || nota.ref}.${ext}`;
      const arquivo = new File([blob], nome, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: 'Cupom fiscal' });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nome;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      avisar('Cupom baixado', 'Anexe o arquivo na conversa do WhatsApp.', 'ok');
    } catch (e) {
      if (e?.name === 'AbortError') return; // usuário fechou a folha de compartilhamento
      avisar('Compartilhar cupom', e.message, 'erro');
    }
  }

  const mostrarWhats = envio.tipo === 'whatsapp' || envio.tipo === 'nenhum';
  const mostrarEmail = envio.tipo === 'email' || envio.tipo === 'nenhum';

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Cartao style={styles.status}>
        <Text style={[styles.statusTexto, { color: st.cor }]}>{st.texto}</Text>
        {nota.status === 'processando_autorizacao' && <ActivityIndicator color={colors.laranjaEscuro} style={{ marginTop: 10 }} />}
        {nota.numero ? <Text style={styles.linha}>Nota nº {nota.numero}</Text> : null}
        {nota.total ? <Text style={styles.total}>{brl(nota.total)}</Text> : null}
        {nota.mensagem && !autorizada ? <Text style={[styles.linha, { color: colors.danger }]}>{nota.mensagem}</Text> : null}
      </Cartao>

      {autorizada && (
        <Cartao style={{ marginBottom: 16 }}>
          <Text style={styles.secao}>Enviar ao cliente</Text>

          {mostrarWhats && (
            <>
              <Botao titulo="Enviar pelo WhatsApp" tipo="whatsapp" onPress={whatsapp} />
              {nota.urlDanfe ? (
                <Botao
                  titulo="Enviar cupom em arquivo"
                  tipo="claro"
                  onPress={compartilharCupom}
                  style={{ marginTop: 10, borderWidth: 1.5, borderColor: colors.whatsapp }}
                />
              ) : null}
            </>
          )}

          {envio.tipo === 'email' && (
            <View>
              {emailEstado === 'enviando' && <Text style={styles.msgEmail}>Enviando e-mail para {envio.email}…</Text>}
              {emailEstado === 'ok' && <Text style={[styles.msgEmail, { color: colors.ok }]}>✓ E-mail enviado para {envio.email}</Text>}
              {emailEstado === 'erro' && (
                <>
                  <Text style={[styles.msgEmail, { color: colors.danger }]}>Não foi possível enviar: {emailErro}</Text>
                  <Botao titulo="Tentar de novo" tipo="claro" onPress={() => porEmail(envio.email)} style={{ marginTop: 10 }} />
                </>
              )}
            </View>
          )}

          {envio.tipo === 'nenhum' && mostrarEmail && (
            <View style={{ marginTop: 18 }}>
              <Campo label="Ou enviar por e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="cliente@email.com" />
              <Botao
                titulo={emailEstado === 'ok' ? '✓ Enviado' : 'Enviar por e-mail'}
                tipo="claro"
                onPress={() => porEmail(email.trim())}
                loading={emailEstado === 'enviando'}
                style={{ borderWidth: 1.5, borderColor: colors.laranjaEscuro }}
              />
              {emailEstado === 'erro' ? <Text style={[styles.msgEmail, { color: colors.danger }]}>{emailErro}</Text> : null}
            </View>
          )}
        </Cartao>
      )}

      <Botao titulo="Emitir outra nota" onPress={onNova} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
  status: { marginBottom: 16, alignItems: 'center', paddingVertical: 22 },
  statusTexto: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  linha: { fontSize: 15, color: colors.texto, marginTop: 8, textAlign: 'center' },
  total: { fontSize: 30, fontWeight: '900', color: colors.texto, marginTop: 6 },
  secao: { fontSize: 16, fontWeight: '800', color: colors.texto, marginBottom: 12 },
  msgEmail: { fontSize: 15, fontWeight: '600', color: colors.texto },
});
