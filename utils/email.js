const nodemailer = require('nodemailer');

const sendMail = async (options) => {
  let user, pass, host;
  if (process.env.NODE_ENV === 'production') {
    host = 'smtp.gmail.com';
    user = process.env.GMAIL_USER;
    pass = process.env.GMAIL_PASSWORD;
  } else if (process.env.NODE_ENV === 'development') {
    host = 'sandbox.smtp.mailtrap.io';
    user = process.env.MAILTRAP_USER;
    pass = process.env.MAILTRAP_PASSWORD;
  }

  const transporter = await nodemailer.createTransport({
    host: host,
    port: process.env.NODE_ENV === 'development' ? 2525 : 587,
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mail = {
    from: 'ProzCollab <prozcollab.team@gmail.com',
    to: options.email,
    subject: options.subject,
  };

  if (process.env.NODE_ENV === 'production') {
    mail.html = options.html;
  } else if (process.env.NODE_ENV === 'development') {
    mail.text = options.message;
  }

  //send mail
  await transporter.sendMail(mail);
};

module.exports = sendMail;
