import { Home, BookOpen, Monitor, LayoutGrid, Database, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
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

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Playbooks", url: "/playbooks", icon: BookOpen },
  { title: "Monitor", url: "/monitor", icon: Monitor },
  { title: "Playgrounds", url: "/playgrounds", icon: LayoutGrid },
  { title: "Datasets", url: "/datasets", icon: Database },
  { title: "Configuration", url: "/configuration", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border h-[72px] flex items-center justify-center px-4">
        {open ? (
          <div className="flex flex-col items-center gap-0">
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
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
}
