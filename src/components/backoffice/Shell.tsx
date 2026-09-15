import { type Role } from "@/lib/supabase/types";
import Sidebar from "./Sidebar";

type Props = {
  children: React.ReactNode;
  role: Role;
  displayName: string;
  hiddenKeys?: string[];
  /** Pastilles de la barre latérale, par clé de page : le nombre de choses qui attendent. */
  badges?: Record<string, number>;
};

export default function BackofficeShell({ children, role, displayName, hiddenKeys, badges }: Props) {
  return (
    <div className="flex h-screen bg-page overflow-hidden">
      <Sidebar role={role} displayName={displayName} hiddenKeys={hiddenKeys} badges={badges} />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {children}
      </main>
    </div>
  );
}
