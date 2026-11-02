import nodemailer from "nodemailer";

// เลือก transporter ตาม environment — production ใช้ Gmail จริง dev ใช้ Ethereal (fake SMTP)
async function createTransporter() {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error(
        "GMAIL_USER or GMAIL_APP_PASSWORD is missing in environment variables (.env)",
      );
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // dev: สร้าง Ethereal test account อัตโนมัติตอน server เริ่มทำงาน ไม่ต้องสมัครเองล่วงหน้า
  const testAccount = await nodemailer.createTestAccount();
  console.log(`📧 Ethereal test account ready: ${testAccount.user}`);

  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

// Transporter ตัวเดียวใช้ร่วมกันทั้งแอป เหมือน pattern ของ prisma client ใน config/prisma.ts
const transporter = await createTransporter();

// ฟังก์ชันพื้นฐานสำหรับส่งอีเมล แยกออกมาต่างหาก เพื่อให้สลับ provider จริงภายหลังง่าย แก้แค่ createTransporter ด้านบนพอ
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  // production ต้องใช้ GMAIL_USER เป็น from เท่านั้น ไม่งั้น Gmail จะเปลี่ยนให้เองอยู่ดี
  const fromAddress =
    process.env.NODE_ENV === "production"
      ? `"Money Management App" <${process.env.GMAIL_USER}>`
      : '"Money Management App" <no-reply@moneyapp.test>';

  const info = await transporter.sendMail({
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  // getTestMessageUrl คืนค่า false เองถ้าไม่ใช่ Ethereal เลย log แค่ตอน dev พอ
  if (process.env.NODE_ENV !== "production") {
    console.log(`📧 Preview email: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
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
