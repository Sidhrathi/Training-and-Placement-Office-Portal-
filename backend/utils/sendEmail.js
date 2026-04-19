const nodemailer = require("nodemailer");

// Create HTML template for OTP email
const generateOTPEmailTemplate = (name, otp) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      .header {
        background-color: #4f7df7;
        color: white;
        padding: 10px 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
      }
      .otp-container {
        margin: 20px 0;
        padding: 10px;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 5px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 5px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #777;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Email Verification</h2>
      </div>
      <div class="content">
        <p>Hello ${name},</p>
        <p>Thank you for registering with the Training and Placement Cell. Please use the following One-Time Password (OTP) to verify your email address:</p>
        <div class="otp-container">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes. If you didn't request this verification, please ignore this email.</p>
        <p>Best Regards,<br>KLE Technological University Training and Placement Cell</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} KLE Technological University. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

const sendEmail = async (options) => {
  // Create reusable transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail, generateOTPEmailTemplate };
