import { type Role } from "@/lib/supabase/types";
import Sidebar from "./Sidebar";

type Props = {
  children: React.ReactNode;
  role: Role;
  displayName: string;
};

export default function BackofficeShell({ children, role, displayName }: Props) {
  return (
    <div className="flex h-screen bg-page overflow-hidden">
      <Sidebar role={role} displayName={displayName} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
