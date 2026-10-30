import nodemailer from 'nodemailer';
import { baixarArquivo } from './focus.js';

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

const extensao = (tipo = '') => (tipo.includes('pdf') ? 'pdf' : tipo.includes('html') ? 'html' : 'bin');

export async function enviarEmailNota({ para, nota }) {
  const anexos = [];
  const id = nota.numero || nota.ref;

  if (nota.urlDanfe) {
    const { buffer, contentType } = await baixarArquivo(nota.urlDanfe);
    anexos.push({ filename: `cupom-fiscal-${id}.${extensao(contentType)}`, content: buffer });
  }
  if (nota.urlXml) {
    const { buffer } = await baixarArquivo(nota.urlXml);
    anexos.push({ filename: `nfce-${id}.xml`, content: buffer });
  }

  const link = nota.urlConsulta
    ? `<p>Consulte sua nota online: <a href="${nota.urlConsulta}">${nota.urlConsulta}</a></p>`
    : '';

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: para,
    subject: `Seu cupom fiscal${nota.numero ? ` nº ${nota.numero}` : ''}`,
    html: `<p>Olá!</p>
           <p>Obrigado pela preferência. Segue o seu cupom fiscal (NFC-e)${anexos.length ? ' em anexo' : ''}.</p>
           ${link}`,
    attachments: anexos,
  });

  return { anexos: anexos.length };
}
