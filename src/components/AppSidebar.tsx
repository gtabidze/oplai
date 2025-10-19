import { Home, BookOpen, ChartArea, Workflow, Database, Settings, LogOut, User as UserIcon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Playbooks", url: "/playbooks", icon: BookOpen },
  { title: "Monitor", url: "/monitor", icon: ChartArea },
  { title: "Experiments", url: "/playgrounds", icon: Workflow },
  { title: "Datasets", url: "/datasets", icon: Database },
  { title: "Configuration", url: "/configuration", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

  // Helper function to ensure proper case formatting
  const toProperCase = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader 
        className="border-b border-border h-[72px] flex items-center justify-start pl-2 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => navigate("/")}
      >
        {open ? (
          <div className="flex flex-col items-start gap-0">
            <span className="font-orbitron font-black text-3xl tracking-wider uppercase">OPLAI</span>
            <span className="text-[9px] text-muted-foreground tracking-widest uppercase text-center">Operational PlayBook</span>
          </div>
        ) : (
          <span className="font-orbitron font-black text-xl">O</span>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      }
                    >
                      <item.icon />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-2">
        {open ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {profile?.avatar_url && (
                          <AvatarImage src={profile.avatar_url} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {profile?.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || user.email?.[0].toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-medium truncate">
                          {profile?.full_name ? toProperCase(profile.full_name) : user.email}
                        </p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/account")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <SidebarTrigger />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <SidebarTrigger />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {profile?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || user.email?.[0].toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
