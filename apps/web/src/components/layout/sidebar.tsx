import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSession, useMyProfile, useSignOutMutation } from "@repo/api-client";
import { Loader2, LogOut, Wrench, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/equipment", label: "Equipment", icon: Wrench },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/partners", label: "Partners", icon: Users },
] as const;

export default function SidebarLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSession();
  const { data: profileResult } = useMyProfile(isAuthenticated);
  const signOut = useSignOutMutation();

  const profile = profileResult?.data ?? null;

  async function handleSignOut() {
    await signOut.mutateAsync();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-sm font-semibold tracking-tight">geoWorks</span>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <p className="mb-2 truncate text-xs text-muted-foreground">
            {profile?.full_name ?? "User"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleSignOut}
            disabled={signOut.isPending}
          >
            {signOut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
