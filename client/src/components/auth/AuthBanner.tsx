interface AuthBannerProps {
  title?: string;
  subtitle?: string;
}

export function AuthBanner({
  title = "Welcome Back!",
  subtitle = "เข้าสู่ระบบเพื่อจัดการการเงินของคุณ และเดินทางสู่เป้าหมายในอนาคต 🚀",
}: AuthBannerProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 flex-col justify-between text-white relative">
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="relative z-10">
        <h2 className="text-3xl font-extrabold tracking-tight">MONEY APP</h2>
        <p className="text-sm opacity-90 mt-1">Your money, your journey ✨</p>
      </div>

      <div className="relative z-10 my-8 text-center">
        <div className="text-6xl mb-4">🐱💖</div>
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-sm mt-2 opacity-90">{subtitle}</p>
      </div>

      <div className="relative z-10 text-xs text-center opacity-75">
        Small steps lead to big dreams ✨
      </div>
    </div>
  );
}
