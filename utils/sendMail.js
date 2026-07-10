const nodemailer = require("nodemailer");

// createTestAccount() ile Ethereal hesabını oluştur ve kullan
const createTransporterAndSend = async ({ to, subject, html }) => {
  // Test hesabı oluştur (kayıt yok)
  const testAccount = await nodemailer.createTestAccount();

  // Transporter - Ethereal
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Mail gönder
  const info = await transporter.sendMail({
    from: `"Dostagider Test" <${testAccount.user}>`,
    to,
    subject,
    html,
  });

  // Nodemailer geliştirme/ethereal için preview URL verir
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return { messageId: info.messageId, previewUrl };
};

module.exports = { createTransporterAndSend };