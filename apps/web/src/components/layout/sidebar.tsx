import { Outlet, useNavigate } from "react-router-dom";
import { useSession, useMyProfile, useSignOutMutation } from "@repo/api-client";
import { Loader2, LogOut, Wrench, Truck, Users, HardHat, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationGroup, type NavGroup } from "./navigation-group";
import * as React from "react";
import { cn } from "@/lib/utils";

// Grouped navigation with collapsible sections
const navGroups: NavGroup[] = [
  {
    label: "Equipment",
    to: "/equipment",
    icon: Wrench,
    items: [
      { to: "/suppliers", label: "Suppliers", icon: Truck },
      { to: "/partners", label: "Partners", icon: Users },
    ],
  },
  {
    label: "Workers",
    to: "/workers",
    icon: HardHat,
  },
  {
    label: "Customers",
    to: "/customers",
    icon: Building2,
  },
] as const;

export default function SidebarLayout() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);
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
      <aside
        className={cn(
          "flex flex-col border-r bg-muted/40 transition-all duration-300",
          isSidebarCollapsed ? "w-16" : "w-56"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!isSidebarCollapsed && (
            <span className="text-sm font-semibold tracking-tight">geoWorks</span>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              "shrink-0 rounded p-1 hover:bg-accent",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isSidebarCollapsed && "mx-auto"
            )}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-2">
          {navGroups.map((group, index) => (
            <NavigationGroup
              key={index}
              group={group}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          ))}
        </nav>

        {!isSidebarCollapsed && (
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
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
