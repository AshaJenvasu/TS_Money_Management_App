/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from "@tanstack/react-router";
import { AuthBanner } from "../components/auth/AuthBanner";
import { LoginForm } from "../components/auth/LoginForm";

// eslint-disable-next-line react-refresh/only-export-components
export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <div className="card lg:card-side bg-base-100 shadow-2xl max-w-4xl w-full overflow-hidden border border-base-300">
        <AuthBanner />
        <LoginForm />
      </div>
    </div>
  );
}
