import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../../stores/useAuthStore";
import { loginSchema } from "../../../schema/auth.schema";
import { SvgSprites } from "./SvgSprites";
import { LoginScene } from "./LoginScene";

export function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      setErrorMsg(result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
      return;
    }

    const mockToken = "mock-jwt-token-123456";
    const mockUser = { id: "usr-1", email: identifier };
    setAuth(mockToken, mockUser);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="login-shell">
      {/* 1. เรียกก้อน Sprites SVG */}
      <SvgSprites />

      <main className="login-stage">
        <section className="login-view">
          {/* 2. เรียกก้อน ฉากหลัง SVG */}
          <LoginScene />

          {/* Logo & Brand */}
          <div className="anime-brand">
            <svg className="ic" style={{ width: 42, height: 49 }}>
              <use href="#a-logo" />
            </svg>
            <div>
              <p className="brand-name">MONEY APP</p>
              <p className="brand-tag">Your money, your journey</p>
            </div>
          </div>

          <p className="anime-jp">
            好きなことも
            <br />
            お金のことも
            <br />
            自分らしく。
            <svg
              className="ic"
              style={{
                width: 22,
                height: 22,
                display: "inline-block",
                marginLeft: 4,
              }}
            >
              <use href="#i-cat" />
            </svg>
          </p>

          <div className="anime-gap" />

          <p className="anime-slogan">
            Small steps
            <br />
            Big dreams
          </p>

          <div className="anime-cardwrap">
            {/* Mascot แมวหลับ */}
            <svg
              className="anime-mascot"
              viewBox="0 0 200 116"
              aria-hidden="true"
            >
              <path
                d="M176 92c24-4 26-30 8-38-8-3-14 4-10 10"
                fill="none"
                stroke="#C98F5B"
                strokeWidth="13"
                strokeLinecap="round"
              />
              <ellipse cx="108" cy="90" rx="80" ry="27" fill="#FFF5EA" />
              <path
                d="M92 66c22-9 60-8 84 6 6 6 8 12 5 20-20 8-60 8-89-4z"
                fill="#C98F5B"
              />
              <ellipse cx="60" cy="66" rx="36" ry="30" fill="#FFF5EA" />
              <path d="M30 52L32 24l24 16zM70 38l22-14 2 30z" fill="#FFF5EA" />
              <path
                d="M40 68q6 6 12 0M66 68q6 6 12 0"
                fill="none"
                stroke="#3A2B45"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <ellipse
                cx="38"
                cy="77"
                rx="6"
                ry="4"
                fill="#FFB3CD"
                opacity=".85"
              />
              <ellipse
                cx="82"
                cy="77"
                rx="6"
                ry="4"
                fill="#FFB3CD"
                opacity=".85"
              />
              <text
                x="108"
                y="34"
                fontFamily="Caveat,cursive"
                fontSize="22"
                fontWeight="700"
                fill="#fff"
                opacity=".9"
              >
                z
              </text>
              <text
                x="124"
                y="20"
                fontFamily="Caveat,cursive"
                fontSize="17"
                fontWeight="700"
                fill="#fff"
                opacity=".7"
              >
                z
              </text>
            </svg>

            <div className="anime-card">
              <h1 className="title">
                <span className="mark">Welcome Back</span>
                <svg
                  className="ic"
                  style={{ width: 26, height: 26, color: "#5568E0" }}
                >
                  <use href="#i-cat" />
                </svg>
              </h1>
              <p className="sub">
                เข้าสู่ระบบเพื่อจัดการการเงินของคุณ และเดินทางสู่เป้าหมายในอนาคต
              </p>

              {errorMsg && (
                <div
                  style={{
                    color: "#CF3D6B",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="anime-field">
                  <div className="anime-control">
                    <svg className="lead-ic">
                      <use href="#i-mail" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Email หรือ Username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>

                <div className="anime-field">
                  <div className="anime-control">
                    <svg className="lead-ic">
                      <use href="#i-lock" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="anime-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg className="ic">
                        <use href={showPassword ? "#i-eye-off" : "#i-eye"} />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="anime-row">
                  <label className="anime-check">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span>จดจำฉันไว้</span>
                  </label>
                  {/* <button type="button" className="anime-link">
                    ลืมรหัสผ่าน?
                  </button> */}
                </div>

                <button type="submit" className="anime-btn anime-btn-login">
                  <span>เข้าสู่ระบบ</span>
                  <svg className="ic" style={{ width: 20, height: 20 }}>
                    <use href="#i-arrow" />
                  </svg>
                </button>
              </form>

              <div className="anime-or">
                <span>ยังไม่มีบัญชี?</span>
              </div>

              <Link to="/register" className="anime-btn anime-btn-ghost">
                <svg className="ic" style={{ width: 20, height: 20 }}>
                  <use href="#i-user-plus" />
                </svg>
                <span>สมัครสมาชิก</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
