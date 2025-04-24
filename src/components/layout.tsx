
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import { AgriSenseLogo } from "./agrisense-logo";
import { HelpDialog } from "./HelpDialog"; // Import HelpDialog
// Removed UserCircle import as it's replaced by UserButton

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
            <div className="flex w-full items-center justify-end gap-4">
              <HelpDialog /> {/* Use the HelpDialog component */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
