import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { registerSchema } from "../../../schema/auth.schema";
import { SvgSprites } from "./SvgSprites";
import { MascotCat } from "./MascotCat";
import { InputField } from "../../ui/InputField";
import "./RegisterPage.css";

export function RegisterForm() {
  const navigate = useNavigate();

  // Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic Falling Petals Effect
  const petalsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!petalsRef.current) return;
    const colors = ["#FFC6DA", "#FFB3CD", "#FFFFFF", "#FFD9E6"];
    petalsRef.current.innerHTML = "";
    for (let i = 0; i < 14; i++) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 20 20");
      svg.classList.add("petal");
      svg.innerHTML = '<use href="#a-petal"/>';
      const sz = (9 + Math.random() * 10).toFixed(0);
      const dur = (11 + Math.random() * 9).toFixed(1);
      const delay = (-Math.random() * 20).toFixed(1);
      const drift = ((Math.random() - 0.3) * 160).toFixed(0);
      const rot = ((Math.random() - 0.5) * 900).toFixed(0);
      const col = colors[Math.floor(Math.random() * colors.length)];
      svg.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;--sz:${sz}px;--dur:${dur}s;--delay:${delay}s;--drift:${drift}px;--rot:${rot}deg;color:${col}`;
      petalsRef.current.appendChild(svg);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse({
      username,
      email,
      password,
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

    alert("สมัครสมาชิกสำเร็จ!");
    navigate({ to: "/login" });
  };

  return (
    <div className="register-shell">
      <SvgSprites />

      <main className="stage">
        <section className="view-register">
          {/* Background Scene */}
          <svg
            className="scene"
            viewBox="0 0 480 800"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="rg-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6DB6F2" />
                <stop offset=".3" stopColor="#AAD6F8" />
                <stop offset=".5" stopColor="#DCEAFA" />
                <stop offset=".8" stopColor="#E7D9F7" />
                <stop offset="1" stopColor="#CDB6EE" />
              </linearGradient>
              <linearGradient id="rg-lake" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#9EC6EA" />
                <stop offset="1" stopColor="#D5E2F7" />
              </linearGradient>
              <linearGradient id="rg-fuji" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8AA5E8" />
                <stop offset="1" stopColor="#BACAF1" />
              </linearGradient>
            </defs>
            <rect width="480" height="800" fill="url(#rg-sky)" />
            <use
              href="#a-cloud"
              x="10"
              y="132"
              width="230"
              height="184"
              opacity=".95"
            />
            <use
              href="#a-cloud"
              x="300"
              y="176"
              width="150"
              height="120"
              opacity=".8"
            />
            <path
              d="M150 254 L226 186 Q252 160 278 186 L354 254Z"
              fill="url(#rg-fuji)"
            />
            <path
              d="M226 186 Q252 160 278 186 L294 200 L283 197 L274 206 L263 198 L252 208 L241 199 L232 207 L221 198 L210 200Z"
              fill="#fff"
              opacity=".96"
            />
            <rect y="258" width="480" height="60" fill="url(#rg-lake)" />
          </svg>

          {/* Dynamic Petals */}
          <div className="petals" ref={petalsRef}></div>

          {/* Logo & Header */}
          <div className="brand">
            <svg className="logo" style={{ width: 42, height: 49 }}>
              <use href="#a-logo" />
            </svg>
            <div>
              <p className="brand-name">MONEY APP</p>
              <p className="brand-tag">
                Your money, your journey
                <svg viewBox="0 0 120 7" preserveAspectRatio="none">
                  <path
                    d="M1 4.5C20 .5 40 7 60 3.5S100 1.5 119 4.5"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </p>
            </div>
          </div>

          {/* Hero Section */}
          <div className="lead">
            <h2 className="lead-title">
              <span>เริ่มต้นเส้นทางการเงิน</span>
              <span>
                <span className="hl">ของคุณได้แล้ววันนี้</span>
              </span>
            </h2>
            <p className="lead-sub">
              สมัครสมาชิกเพื่อเริ่มบันทึกรายรับ-รายจ่าย
              <br />
              และติดตามพอร์ตการลงทุนของคุณ
            </p>
          </div>

          <div className="gap"></div>

          {/* Form Card */}
          <div className="cardwrap">
            <MascotCat />

            <div className="card">
              <h1 className="title">
                <span className="mark">Create your account</span>
                <svg
                  className="ic"
                  style={{ width: 26, height: 26, color: "var(--pink)" }}
                >
                  <use href="#i-sparkle" />
                </svg>
              </h1>

              <form onSubmit={handleSubmit} noValidate>
                <InputField
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  iconId="i-user"
                  error={errors.username}
                />

                <InputField
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  iconId="i-mail"
                  error={errors.email}
                />

                <InputField
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  iconId="i-lock"
                  error={errors.password}
                  isPassword
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                <InputField
                  placeholder="Confirm Password"
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

                <button type="submit" className="btn-reg">
                  <span>สมัครสมาชิก</span>
                  <svg className="ic go" style={{ width: 20, height: 20 }}>
                    <use href="#i-arrow" />
                  </svg>
                </button>
              </form>

              <div className="foot">
                <span>มีบัญชีอยู่แล้ว?</span>
                <Link to="/login">
                  <span>เข้าสู่ระบบ</span>
                  <svg className="ic" style={{ width: 16, height: 16 }}>
                    <use href="#i-arrow" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
