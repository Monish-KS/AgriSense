
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { AgriSenseLogo } from "./agrisense-logo";
import { useAuth, useClerk } from "@clerk/clerk-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  // const { signIn } = useSignIn(); // signIn is not used

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = async () => {
    // Redirect to the sign-in page or open a sign-in modal
    // For now, we'll just log a message. You'll need to implement the actual sign-in flow.
    console.log("Sign In button clicked. Implement sign-in flow.");
    // Example: Redirect to a sign-in page
    // window.location.href = "/sign-in";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <SidebarTrigger />
              <AgriSenseLogo />
            </div>
            <div className="flex w-full items-center justify-end gap-2">
              {isSignedIn ? (
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              ) : (
                <Button variant="outline" onClick={handleSignIn}>
                  Sign In
                </Button>
              )}
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
