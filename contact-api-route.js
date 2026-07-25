/**
 * Synchronia Labs — route de contact souveraine
 * À monter sur le VPS (Node + Express, déjà présents avec PM2).
 *
 * Installation :
 *   cd /var/www/synchrocore   (ou le dossier de ton app)
 *   npm i express nodemailer
 *   # renseigne les variables SMTP ci-dessous (idéalement via variables d'env, pas en dur)
 *
 * Montage dans ton server.js existant :
 *   const contact = require('./contact-api-route');
 *   app.use(express.json());
 *   app.use(contact);
 *
 * Le formulaire du site poste déjà en JSON sur  POST /api/contact
 * (repli automatique vers mailto: si cette route n'est pas joignable).
 */

const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// --- Configuration SMTP (à remplir — de préférence via process.env) ---
const SMTP = {
  host: process.env.SMTP_HOST || 'mail.synchronia-labs.ai',
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,                                   // 465 = TLS
  user: process.env.SMTP_USER || 'contact@synchronia-labs.ai',
  pass: process.env.SMTP_PASS || 'A_RENSEIGNER',  // ne jamais committer ce mot de passe
};
const DEST = process.env.CONTACT_TO || 'contact@synchronia-labs.ai';

const transporter = nodemailer.createTransport({
  host: SMTP.host, port: SMTP.port, secure: SMTP.secure,
  auth: { user: SMTP.user, pass: SMTP.pass },
});

// petite protection anti-abus (2 requêtes / minute / IP)
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 60_000, max = 2;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

router.post('/api/contact', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'x';
    if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'rate_limit' });

    const { nom, organisation, email, message } = req.body || {};
    if (!nom || !email || !message) return res.status(400).json({ ok: false, error: 'champs_requis' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'email_invalide' });

    await transporter.sendMail({
      from: `"Site Synchronia" <${SMTP.user}>`,
      to: DEST,
      replyTo: email,
      subject: `Projet — ${organisation || nom}`,
      text: `Nom : ${nom}\nOrganisation : ${organisation || '-'}\nEmail : ${email}\n\n${message}`,
      html: `<h3>Nouvelle demande — ${esc(organisation || nom)}</h3>
             <p><b>Nom :</b> ${esc(nom)}<br>
             <b>Organisation :</b> ${esc(organisation || '-')}<br>
             <b>Email :</b> ${esc(email)}</p>
             <p>${esc(message).replace(/\n/g, '<br>')}</p>`,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] échec envoi :', err.message);
    res.status(500).json({ ok: false, error: 'smtp' });
  }
});

module.exports = router;
