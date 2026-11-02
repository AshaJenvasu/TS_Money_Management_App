import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { forgotPasswordSchema } from "../../../schema/auth.schema";
import { SvgSprites } from "../Login/SvgSprites";
import { LoginScene } from "../Login/LoginScene";
import { useForgotPasswordMutation } from "../../../hooks/useAuthQuery";
import { InputField } from "../../ui/InputField";
import { isAxiosError } from "axios";

export function ForgotPasswordForm() {
  const { mutate, isPending } = useForgotPasswordMutation();

  // Form State
  const [email, setEmail] = useState("");

  // UI / Status States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setErrors({});

    // เช็ก Zod Validation ก่อนยิง API
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    mutate(
      { email },
      {
        // สำเร็จหรือไม่เจอ email ในระบบก็ขึ้นข้อความเดียวกันเสมอ (backend ออกแบบไว้ กัน user enumeration)
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (err) => {
          if (isAxiosError(err) && err.response?.status === 429) {
            setErrorMsg(
              "ขอลิงก์รีเซ็ตรหัสผ่านบ่อยเกินไปนะ รอสักครู่แล้วลองใหม่อีกครั้งน้า 🙏",
            );
          } else if (isAxiosError(err) && !err.response) {
            setErrorMsg(
              "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้นะ ลองเช็กอินเทอร์เน็ตแล้วลองใหม่อีกครั้งน้า 🙏",
            );
          } else {
            setErrorMsg("ระบบมีปัญหานิดหน่อย ลองใหม่อีกครั้งน้า 🙏");
          }
        },
      },
    );
  };

  return (
    <div className="login-shell">
      <SvgSprites />

      <main className="login-stage">
        <section className="login-view">
          <LoginScene />

          <div className="anime-brand">
            <svg className="ic" style={{ width: 42, height: 49 }}>
              <use href="#a-logo" />
            </svg>
            <div>
              <p className="brand-name">MONEY APP</p>
              <p className="brand-tag">Your money, your journey</p>
            </div>
          </div>

          <div className="anime-cardwrap" style={{ marginTop: "250px" }}>
            <div className="anime-card">
              <h1 className="title">
                <span className="mark">ลืมรหัสผ่าน?</span>
                <svg
                  className="ic"
                  style={{ width: 26, height: 26, color: "#5568E0" }}
                >
                  <use href="#i-mail" />
                </svg>
              </h1>
              <p className="sub">
                กรอก Email ที่ใช้สมัครไว้
                เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้นะ
              </p>

              {errorMsg && (
                <div
                  style={{
                    color: "#CF3D6B",
                    fontSize: "13px",
                    marginBottom: "12px",
                    padding: "8px 12px",
                    background: "rgba(207, 61, 107, 0.1)",
                    borderRadius: "10px",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {submitted ? (
                // แสดงข้อความเดียวกันเสมอไม่ว่า email จะมีอยู่จริงในระบบหรือไม่ กัน user enumeration
                <div
                  style={{
                    color: "#1E2A66",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    padding: "14px",
                    background: "rgba(85, 104, 224, 0.15)",
                    borderRadius: "12px",
                    marginBottom: "16px",
                  }}
                >
                  ถ้า Email นี้มีอยู่ในระบบ
                  เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้วนะ
                  ลองเช็กกล่องข้อความดูได้เลย 📧
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <InputField
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    iconId="i-mail"
                    error={errors.email}
                  />

                  <button
                    type="submit"
                    className="anime-btn anime-btn-login mt-5"
                    disabled={isPending}
                  >
                    <span>
                      {isPending
                        ? "กำลังส่งลิงก์..."
                        : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                    </span>
                    <svg className="ic" style={{ width: 20, height: 20 }}>
                      <use href="#i-arrow" />
                    </svg>
                  </button>
                </form>
              )}

              <div className="anime-or">
                <span>นึกรหัสผ่านออกแล้ว?</span>
              </div>

              <Link to="/login" className="anime-btn anime-btn-ghost">
                <svg className="ic" style={{ width: 20, height: 20 }}>
                  <use href="#i-arrow" />
                </svg>
                <span>กลับไปหน้าเข้าสู่ระบบ</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
