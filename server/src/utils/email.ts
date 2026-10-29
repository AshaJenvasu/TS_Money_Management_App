import nodemailer from "nodemailer";

// สร้าง Ethereal test account อัตโนมัติตอน server เริ่มทำงาน ไม่ต้องสมัครเองล่วงหน้า
const testAccount = await nodemailer.createTestAccount();

// Transporter ตัวเดียวใช้ร่วมกันทั้งแอป เหมือน pattern ของ prisma client ใน config/prisma.ts
const transporter = nodemailer.createTransport({
  host: testAccount.smtp.host,
  port: testAccount.smtp.port,
  secure: testAccount.smtp.secure,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
});

console.log(`📧 Ethereal test account ready: ${testAccount.user}`);

// ฟังก์ชันพื้นฐานสำหรับส่งอีเมล แยกออกมาต่างหาก เพื่อให้สลับ provider จริงภายหลังง่าย แก้แค่ transporter ด้านบนพอ
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const info = await transporter.sendMail({
    from: '"Money Management App" <no-reply@moneyapp.test>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  // Ethereal ไม่ส่งอีเมลจริง แค่ให้ลิงก์ preview กลับมาดูหน้าตาอีเมลผ่าน browser
  console.log(`📧 Preview email: ${nodemailer.getTestMessageUrl(info)}`);

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
