const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  const transporter = await nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  });

  const mail = {
    from: "Ambika prasad <ambika@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //send mail
  await transporter.sendMail(mail);
};

module.exports = sendMail;
