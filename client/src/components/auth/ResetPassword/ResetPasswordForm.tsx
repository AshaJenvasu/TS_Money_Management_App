import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { resetPasswordSchema } from "../../../schema/auth.schema";
import { SvgSprites } from "../Login/SvgSprites";
import { LoginScene } from "../Login/LoginScene";
import { useResetPasswordMutation } from "../../../hooks/useAuthQuery";
import { InputField } from "../../ui/InputField";
import { isAxiosError } from "axios";

interface ResetPasswordFormProps {
  token: string | undefined;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { mutate, isPending } = useResetPasswordMutation();

  // Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI / Status States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setErrors({});

    // เช็ก Zod Validation ก่อนยิง API (รหัสผ่านตรงเกณฑ์ + ยืนยันตรงกัน)
    const result = resetPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });
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

    // ชั้นนี้ token ต้องมีค่าแน่นอนแล้ว เพราะถ้าไม่มีจะโดนกันไว้ที่หน้า "ลิงก์ไม่ถูกต้อง" ไปแล้วตั้งแต่แรก
    if (!token) return;

    mutate(
      { token, newPassword },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (err) => {
          if (isAxiosError(err) && err.response?.status === 400) {
            // ไม่บอกรายละเอียดว่า token ผิด/หมดอายุ/ใช้ไปแล้วแบบไหน กันข้อมูลรั่วไหล (ตามที่ backend ออกแบบไว้)
            setErrorMsg(
              "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้วนะ ลองขอลิงก์ใหม่อีกครั้งน้า 🙏",
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

          <div className="anime-cardwrap" style={{ marginTop: "324px" }}>
            <div className="anime-card">
              <h1 className="title">
                <span className="mark ">ตั้งรหัสผ่านใหม่</span>
                <svg
                  className="ic"
                  style={{ width: 26, height: 26, color: "#5568E0" }}
                >
                  <use href="#i-lock" />
                </svg>
              </h1>

              {!token ? (
                // ไม่มี token เลยใน URL เช่น พิมพ์ /reset-password ตรงๆ หรือลิงก์ขาดหายไปบางส่วน
                <p className="sub">
                  ลิงก์นี้ไม่ถูกต้องนะ อาจจะพิมพ์ URL
                  เองหรือลิงก์ขาดหายไปบางส่วน
                  ลองขอลิงก์ใหม่อีกครั้งจากด้านล่างได้เลย
                </p>
              ) : submitted ? (
                // สำเร็จแล้ว ไม่ auto-login และไม่ auto-redirect ตามที่ตกลงกันไว้ ให้ user กดเข้า login เอง
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
                  ตั้งรหัสผ่านใหม่สำเร็จแล้วนะ
                  กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่อีกครั้ง 🎉
                </div>
              ) : (
                <>
                  <p className="sub">
                    ตั้งรหัสผ่านใหม่ของคุณ ต้องมีอย่างน้อย 8 ตัวอักษร
                    มีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ
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

                  <form onSubmit={handleSubmit} noValidate>
                    <InputField
                      placeholder="รหัสผ่านใหม่"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      iconId="i-lock"
                      error={errors.newPassword}
                      isPassword
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />

                    <InputField
                      placeholder="ยืนยันรหัสผ่านใหม่"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      iconId="i-lock"
                      error={errors.confirmPassword}
                      isPassword
                      showPassword={showConfirmPassword}
                      onTogglePassword={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />

                    <button
                      type="submit"
                      className="anime-btn anime-btn-login mt-5"
                      disabled={isPending}
                    >
                      <span>
                        {isPending ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
                      </span>
                      <svg className="ic" style={{ width: 20, height: 20 }}>
                        <use href="#i-arrow" />
                      </svg>
                    </button>
                  </form>
                </>
              )}

              <div className="anime-or">
                <span>
                  {!token ? "" : submitted ? "" : "นึกรหัสผ่านออกแล้ว?"}
                </span>
              </div>

              <Link
                to={!token ? "/forgot-password" : "/login"}
                className="anime-btn anime-btn-ghost"
              >
                <svg className="ic" style={{ width: 20, height: 20 }}>
                  <use href="#i-arrow" />
                </svg>
                <span>
                  {!token
                    ? "ขอลิงก์รีเซ็ตรหัสผ่านใหม่"
                    : "กลับไปหน้าเข้าสู่ระบบ"}
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
