import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";

export function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // Mock Authentication Logic
    const mockToken = "mock-jwt-token-123456";
    const mockUser = { id: "usr-1", email: identifier };

    setAuth(mockToken, mockUser);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="card-body w-full lg:w-1/2 p-6 sm:p-8 justify-center">
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Welcome Back 👋</h2>
        <p className="text-sm text-base-content/70 mt-1">
          กรุณาเข้าสู่ระบบด้วยบัญชีของคุณ
        </p>
      </div>

      {error && (
        <div className="alert alert-error text-sm py-2 mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Email หรือ Username</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="กรอก Email หรือ Username"
              className="input input-bordered w-full pl-10 focus:input-primary"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Password</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="กรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร"
              className="input input-bordered w-full pl-10 pr-10 focus:input-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-base-content"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full mt-6 text-white gap-2"
        >
          <LogIn className="w-5 h-5" />
          เข้าสู่ระบบ
        </button>
      </form>

      <div className="divider text-xs text-base-content/50 my-6">
        ยังไม่มีบัญชี?
      </div>

      <div className="text-center">
        <Link
          to="/register"
          className="btn btn-outline btn-block btn-sm sm:btn-md gap-2"
        >
          สมัครสมาชิก
        </Link>
      </div>
    </div>
  );
}
