import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "../components/auth/Registor/RegisterForm";

export const Route = createFileRoute("/register")({
  component: RegisterForm,
});
