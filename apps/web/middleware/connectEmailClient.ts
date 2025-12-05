import nodemailer from 'nodemailer';
const ConnectEmailClient = async () => {
  try {
    const emailHost = process.env.EMAIL_HOST;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    if (!emailHost || !emailUser || !emailPassword) {
      throw new Error('Missing required email environment variables: EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD');
    }
    
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
      secure: false, 
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
    return transporter;
  } catch (error) {
    console.error("Error connecting to email client:", error);
  }
};

export default ConnectEmailClient;