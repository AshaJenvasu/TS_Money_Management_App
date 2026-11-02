import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

const isProduction = process.env.NODE_ENV === "production";

// เตรียมตัวส่งอีเมลตาม environment ตอน server เริ่มทำงาน
let etherealTransporter: nodemailer.Transporter | undefined;

if (isProduction) {
  if (
    !process.env.SENDGRID_API_KEY ||
    !process.env.SENDGRID_VERIFIED_SENDER_EMAIL
  ) {
    throw new Error(
      "SENDGRID_API_KEY or SENDGRID_VERIFIED_SENDER_EMAIL is missing in environment variables (.env)",
    );
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  // dev: สร้าง Ethereal test account อัตโนมัติตอน server เริ่มทำงาน ไม่ต้องสมัครเองล่วงหน้า
  const testAccount = await nodemailer.createTestAccount();
  console.log(`📧 Ethereal test account ready: ${testAccount.user}`);

  etherealTransporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

// ฟังก์ชันพื้นฐานสำหรับส่งอีเมล แยก production (SendGrid HTTP API) กับ dev (Ethereal SMTP) ออกจากกัน
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (isProduction) {
    // ส่งผ่าน HTTPS ตรงๆ ไม่ผ่าน SMTP เลย เพราะ Render บล็อก SMTP port บน free tier
    await sgMail.send({
      to: options.to,
      from: process.env.SENDGRID_VERIFIED_SENDER_EMAIL!,
      subject: options.subject,
      html: options.html,
    });
    return;
  }

  // dev: ยังใช้ Ethereal เหมือนเดิม เพราะรันบนเครื่องตัวเอง ไม่ติด firewall ของ Render
  const info = await etherealTransporter!.sendMail({
    from: '"Money Management App" <no-reply@moneyapp.test>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  console.log(`📧 Preview email: ${nodemailer.getTestMessageUrl(info)}`);
}

// ฟังก์ชันสำหรับส่ง reset password link โดยเฉพาะ ประกอบเนื้อหาอีเมลไว้ที่เดียว
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  await sendEmail({
    to,
    subject: "รีเซ็ตรหัสผ่านของคุณ",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>รีเซ็ตรหัสผ่าน</h2>
        <p>คลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์นี้จะหมดอายุภายใน 30 นาที</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#7566C7;color:#fff;text-decoration:none;border-radius:8px;">
          ตั้งรหัสผ่านใหม่
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px;">
          ถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน สามารถเพิกเฉยต่ออีเมลนี้ได้เลย
        </p>
      </div>
    `,
  });
}
