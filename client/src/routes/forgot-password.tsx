import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordForm } from "../components/auth/ForgotPassword/ForgotPasswordForm";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
