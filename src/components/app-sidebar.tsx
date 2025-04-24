
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Map, 
  Droplets, 
  Sun, 
  Sprout, 
  Store, 
  Settings,
  FileBarChart,
  CloudSun,
  ClipboardList, // Added for MGNREGA
  User // Added for Profile
} from "lucide-react";

import { AgriSenseLogo } from "@/components/agrisense-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border pb-2">
        <div className="ml-2 flex items-center">
          <AgriSenseLogo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={currentPath === "/dashboard" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="flex gap-2">
                    <Home />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={currentPath === "/soil" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/soil" className="flex gap-2">
                    <FileBarChart />
                    <span>Soil Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={currentPath === "/weather" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/weather" className="flex gap-2">
                    <CloudSun />
                    <span>Weather</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={currentPath === "/water-management" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/water-management" className="flex gap-2"> {/* Updated path */}
                    <Droplets />
                    <span>Water Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={currentPath === "/crop-recommendations" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/crop-recommendations" className="flex gap-2">
                    <Sprout />
                    <span>Crop Recommendations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={currentPath === "/supply-chain" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/supply-chain" className="flex gap-2">
                    <Store />
                    <span>Supply Chain</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={currentPath === "/mgnrega" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/mgnrega" className="flex gap-2">
                    <ClipboardList />
                    <span>MGNREGA Portal</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={currentPath === "/settings" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/settings" className="flex gap-2">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className={currentPath === "/profile" ? "rounded-md bg-green-900" : ""}>
                <SidebarMenuButton asChild>
                  <Link to="/profile" className="flex gap-2">
                    <User />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-foreground/60">
          AgriSense v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
