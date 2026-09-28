import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../components/auth/Login/LoginForm";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function LoginPage() {
  return (
    // ถอด div / layout เก่าฝั่งซ้ายออกให้หมด เหลือแค่เรียก LoginForm ตัวใหม่เพียวๆ
    <LoginForm />
  );
}
