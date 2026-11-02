import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordForm } from "../components/auth/ResetPassword/ResetPasswordForm";

// token อาจไม่มีมาเลยก็ได้ (เช่น user พิมพ์ URL เองโดยไม่มี query string) จึงทำเป็น optional และ catch ไว้กัน error ตอน parse search params
const resetPasswordSearchSchema = z.object({
  token: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  component: ResetPasswordPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function ResetPasswordPage() {
  // ดึงค่า token ที่ validate แล้วจาก URL เช่น /reset-password?token=abc123
  const { token } = Route.useSearch();

  return <ResetPasswordForm token={token} />;
}
