import { useNavigate } from "react-router-dom";
import { useSession, useMyProfile, useSignOutMutation } from "@repo/api-client";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: sessionLoading } = useSession();
  const { data: profileResult, isLoading: profileLoading } = useMyProfile(isAuthenticated);
  const signOut = useSignOutMutation();

  const isLoading = sessionLoading || profileLoading;
  const profile = profileResult?.data ?? null;
  const profileError = profileResult?.error ?? null;

  async function handleSignOut() {
    await signOut.mutateAsync();
    navigate("/login", { replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>{profileError.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <span className="text-sm font-semibold tracking-tight">
            geoWorks
          </span>
          <Button
            variant="ghost"
            size="sm"
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
      </header>
      <main className="flex flex-1 items-center justify-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Hello, {profile?.full_name ?? "User"}
        </h1>
      </main>
    </div>
  );
}
