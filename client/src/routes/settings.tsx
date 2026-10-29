/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { User, Mail, Lock, Trash2, ChevronRight } from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { useProfileQuery } from "../hooks/useUserQuery";
import EditUsernameDialog from "../components/settings/EditUsernameDialog";
import EditEmailDialog from "../components/settings/EditEmailDialog";
import ChangePasswordDialog from "../components/settings/ChangePasswordDialog";
import DeleteAccountDialog from "../components/settings/DeleteAccountDialog";

type ActiveDialog = "username" | "email" | "password" | "delete" | null;

function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const profileQuery = useProfileQuery();

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  if (profileQuery.isLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#E9EAF8]">
        <span className="loading loading-spinner loading-lg text-[#7566C7]" />
      </section>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#E9EAF8] p-6 text-center">
        <p className="text-[#39365F]">โหลดข้อมูลโปรไฟล์ไม่สำเร็จ</p>
        <button
          type="button"
          onClick={() => profileQuery.refetch()}
          className="rounded-full bg-[#7566C7] px-5 py-2 text-sm font-semibold text-white"
        >
          ลองใหม่อีกครั้ง
        </button>
      </section>
    );
  }

  const profile = profileQuery.data;

  return (
    <section className="min-h-screen bg-[#E9EAF8] p-6 text-[#1F2A5C]">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-bold text-[#39365F]">Settings</h1>

        {/* Account section: username/email กดแล้วเปิด dialog แก้ไขตัวเอง */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-white/80 shadow-sm">
          <h2 className="border-b border-[#E9E3FF] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#8986A8]">
            Account
          </h2>

          <button
            type="button"
            onClick={() => setActiveDialog("username")}
            className="flex w-full items-center gap-3 border-b border-[#E9E3FF] px-5 py-4 text-left transition hover:bg-[#F3F1FF]"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
              <User size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-xs text-[#8986A8]">Username</span>
              <span className="block font-semibold text-[#39365F]">
                {profile.username}
              </span>
            </span>
            <ChevronRight size={18} className="text-[#8986A8]" />
          </button>

          <button
            type="button"
            onClick={() => setActiveDialog("email")}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#F3F1FF]"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
              <Mail size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-xs text-[#8986A8]">Email</span>
              <span className="block font-semibold text-[#39365F]">
                {profile.email}
              </span>
            </span>
            <ChevronRight size={18} className="text-[#8986A8]" />
          </button>
        </div>

        {/* Security section: เปลี่ยนรหัสผ่าน */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-white/80 shadow-sm">
          <h2 className="border-b border-[#E9E3FF] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#8986A8]">
            Security
          </h2>

          <button
            type="button"
            onClick={() => setActiveDialog("password")}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#F3F1FF]"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
              <Lock size={18} />
            </span>
            <span className="flex-1 font-semibold text-[#39365F]">
              Change Password
            </span>
            <ChevronRight size={18} className="text-[#8986A8]" />
          </button>
        </div>

        {/* Danger zone แยกสีแดงชัดเจน ตามที่คุยกันไว้ตอนรีวิวมอคอัพ */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-red-200 bg-red-50/70 shadow-sm">
          <h2 className="border-b border-red-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-red-600">
            Danger Zone
          </h2>

          <button
            type="button"
            onClick={() => setActiveDialog("delete")}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-red-700 transition hover:bg-red-100"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Trash2 size={18} />
            </span>
            <span className="flex-1 font-semibold">Delete Account</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-full border border-[#7566C7]/30 bg-white py-3 text-sm font-semibold text-[#7566C7]"
        >
          Logout
        </button>
      </div>

      {activeDialog === "username" && (
        <EditUsernameDialog
          currentUsername={profile.username}
          onClose={() => setActiveDialog(null)}
        />
      )}
      {activeDialog === "email" && (
        <EditEmailDialog
          currentEmail={profile.email}
          onClose={() => setActiveDialog(null)}
        />
      )}
      {activeDialog === "password" && (
        <ChangePasswordDialog onClose={() => setActiveDialog(null)} />
      )}
      {activeDialog === "delete" && (
        <DeleteAccountDialog
          currentUsername={profile.username}
          onClose={() => setActiveDialog(null)}
        />
      )}
    </section>
  );
}

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    const { token } = useAuthStore.getState();
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: SettingsPage,
});
