import {
  Home,
  BookOpen,
  ChartArea,
  Workflow,
  Database,
  Code2,
  Settings,
  LogOut,
  User as UserIcon,
  Bot,
} from "lucide-react";
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
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Playbooks",
    url: "/playbooks",
    icon: BookOpen,
  },
  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: Bot,
  },
  {
    title: "Analytics",
    url: "/monitor",
    icon: ChartArea,
  },
  {
    title: "Experiments",
    url: "/playgrounds",
    icon: Workflow,
  },
  {
    title: "Knowledge sources",
    url: "/datasets",
    icon: Database,
  },
  {
    title: "APIs",
    url: "/apis",
    icon: Code2,
  },
  {
    title: "Configuration",
    url: "/configuration",
    icon: Settings,
  },
];
export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{
    full_name?: string;
    avatar_url?: string;
  } | null>(null);

  // Helper function to ensure proper case formatting
  const toProperCase = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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
        className="border-b border-border h-[72px] pl-2 pt-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => navigate("/")}
      >
        {open ? (
          <svg
            width="80"
            height="32"
            viewBox="0 0 460 181"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-foreground"
          >
            <path
              d="M62.9521 139.32C50.3388 139.32 39.2735 136.74 29.7561 131.58C20.3535 126.42 13.0148 119.196 7.74012 109.908C2.58012 100.62 0.000117674 89.7841 0.000117674 77.4001C0.000117674 65.1308 2.69478 54.3521 8.08412 45.0641C13.5881 35.7761 21.2135 28.5521 30.9601 23.3921C40.8215 18.1174 52.1735 15.4801 65.0161 15.4801C77.6295 15.4801 88.5801 18.0601 97.8681 23.2201C107.271 28.3801 114.552 35.6041 119.712 44.8921C124.987 54.1801 127.624 65.0734 127.624 77.5721C127.624 89.7268 124.872 100.448 119.368 109.736C113.979 119.024 106.411 126.305 96.6641 131.58C87.0321 136.74 75.7948 139.32 62.9521 139.32ZM67.7681 132.096C76.3681 132.096 83.8215 130.204 90.1281 126.42C96.5495 122.521 101.48 116.96 104.92 109.736C108.475 102.397 110.252 93.6828 110.252 83.5921C110.252 71.4374 108.073 60.8308 103.716 51.7721C99.3588 42.5988 93.3961 35.4894 85.8281 30.4441C78.2601 25.2841 69.6028 22.7041 59.8561 22.7041C51.2561 22.7041 43.7455 24.6534 37.3241 28.5521C31.0175 32.3361 26.0868 37.8401 22.5321 45.0641C19.0921 52.2881 17.3721 61.0028 17.3721 71.2081C17.3721 83.3628 19.5508 94.0268 23.9081 103.2C28.2655 112.259 34.2281 119.368 41.7961 124.528C49.3641 129.573 58.0215 132.096 67.7681 132.096ZM136.614 180.084V174.924L141.774 174.064C145.328 173.491 147.622 172.516 148.654 171.14C149.8 169.879 150.374 167.471 150.374 163.916V70.1761C150.374 66.5068 149.571 63.9268 147.966 62.4361C146.36 60.8308 142.691 59.6841 136.958 58.9961V54.6961L162.93 47.1281H165.338V59.6841H166.37C169.58 56.5881 172.734 54.0654 175.83 52.1161C178.926 50.1668 182.079 48.7334 185.29 47.8161C188.5 46.8988 191.94 46.4401 195.61 46.4401C203.522 46.4401 210.459 48.3321 216.422 52.1161C222.499 55.7854 227.2 60.8881 230.526 67.4241C233.966 73.9601 235.686 81.5854 235.686 90.3001C235.686 99.8174 233.564 108.303 229.322 115.756C225.194 123.095 219.518 128.885 212.294 133.128C205.07 137.256 196.871 139.32 187.698 139.32C183.799 139.32 180.015 138.861 176.346 137.944C172.676 137.141 169.179 135.937 165.854 134.332V162.196C165.854 166.095 166.542 168.904 167.918 170.624C169.294 172.344 171.759 173.433 175.314 173.892L183.054 174.924V180.084H136.614ZM190.278 132.784C199.451 132.784 206.618 129.688 211.778 123.496C216.938 117.189 219.518 108.36 219.518 97.0081C219.518 89.0961 218.256 82.2161 215.734 76.3681C213.326 70.4054 209.828 65.8188 205.242 62.6081C200.655 59.2828 195.151 57.6201 188.73 57.6201C184.487 57.6201 180.416 58.3654 176.518 59.8561C172.619 61.3468 169.064 63.5828 165.854 66.5641V106.124C165.854 111.628 166.771 116.387 168.606 120.4C170.44 124.299 173.135 127.337 176.69 129.516C180.359 131.695 184.888 132.784 190.278 132.784ZM244.29 137.6V132.44L249.45 131.58C252.89 131.007 255.183 130.089 256.33 128.828C257.477 127.452 258.05 124.987 258.05 121.432V23.0481C258.05 19.3788 257.247 16.7988 255.642 15.3081C254.037 13.7028 250.367 12.5561 244.634 11.8681V7.56809L271.122 9.56059e-05H273.53V121.432C273.53 124.987 274.103 127.452 275.25 128.828C276.397 130.089 278.69 131.007 282.13 131.58L287.29 132.44V137.6H244.29ZM308.157 139.32C305.29 139.32 302.768 138.345 300.589 136.396C298.525 134.447 297.493 131.867 297.493 128.656C297.493 125.675 298.525 123.209 300.589 121.26C302.768 119.311 305.29 118.336 308.157 118.336C311.024 118.336 313.489 119.311 315.553 121.26C317.617 123.209 318.649 125.675 318.649 128.656C318.649 131.867 317.617 134.447 315.553 136.396C313.489 138.345 311.024 139.32 308.157 139.32ZM353.202 139.32C348.042 139.32 343.971 138.517 340.99 136.912C338.123 135.192 336.059 133.071 334.798 130.548C333.651 127.911 333.078 125.273 333.078 122.636C333.078 118.737 334.454 114.839 337.206 110.94C340.073 106.927 344.717 102.913 351.138 98.9001C357.674 94.8868 366.446 90.9308 377.454 87.0321L381.754 85.4841L382.27 68.4561C382.385 64.2134 381.066 60.7161 378.314 57.9641C375.562 55.0974 371.721 53.6641 366.79 53.6641C362.891 53.6641 359.451 54.9828 356.47 57.6201C353.489 60.2574 351.367 64.3854 350.106 70.0041C349.877 71.1508 348.673 72.2401 346.494 73.2721C344.43 74.1894 341.678 74.6481 338.238 74.6481C336.289 74.6481 334.798 74.4188 333.766 73.9601C332.734 73.5014 332.447 72.4694 332.906 70.8641C334.741 66.3921 337.779 62.3214 342.022 58.6521C346.265 54.9828 351.081 52.0588 356.47 49.8801C361.859 47.5868 367.191 46.4401 372.466 46.4401C379.919 46.4401 385.997 48.2174 390.698 51.7721C395.514 55.3268 397.807 60.3148 397.578 66.7361L395.858 119.196C395.743 123.668 396.833 126.535 399.126 127.796C401.534 129.057 406.063 129.917 412.714 130.376V134.332L406.694 135.88C403.025 137.027 400.101 137.772 397.922 138.116C395.858 138.575 394.253 138.804 393.106 138.804C390.01 138.804 387.659 138.116 386.054 136.74C384.563 135.364 383.474 133.759 382.786 131.924C382.213 130.089 381.811 128.599 381.582 127.452H380.206C375.275 132.268 370.631 135.479 366.274 137.084C362.031 138.575 357.674 139.32 353.202 139.32ZM363.006 127.968C367.134 127.968 370.517 127.337 373.154 126.076C375.906 124.7 378.371 123.267 380.55 121.776L381.582 91.3321L380.206 91.8481C371.95 94.9441 365.643 97.9828 361.286 100.964C356.929 103.945 353.947 106.812 352.342 109.564C350.851 112.316 350.106 114.839 350.106 117.132C350.106 124.356 354.406 127.968 363.006 127.968ZM416.658 137.6V132.44L421.818 131.58C425.258 131.007 427.551 130.089 428.698 128.828C429.845 127.452 430.418 124.987 430.418 121.432V70.1761C430.418 66.5068 429.615 63.9268 428.01 62.4361C426.405 60.8308 422.735 59.6841 417.002 58.9961V54.6961L443.49 47.1281H445.898V121.432C445.898 124.987 446.471 127.452 447.618 128.828C448.765 130.089 451.058 131.007 454.498 131.58L459.658 132.44V137.6H416.658ZM436.438 33.8841C433.571 33.8841 431.163 32.9668 429.214 31.1321C427.265 29.1828 426.29 26.7174 426.29 23.7361C426.29 20.7548 427.265 18.3468 429.214 16.5121C431.163 14.6774 433.571 13.7601 436.438 13.7601C439.19 13.7601 441.541 14.6774 443.49 16.5121C445.439 18.3468 446.414 20.7548 446.414 23.7361C446.414 26.7174 445.439 29.1828 443.49 31.1321C441.541 32.9668 439.19 33.8841 436.438 33.8841Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg
            width="20"
            height="32"
            viewBox="0 0 128 181"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-foreground"
          >
            <path
              d="M62.9521 139.32C50.3388 139.32 39.2735 136.74 29.7561 131.58C20.3535 126.42 13.0148 119.196 7.74012 109.908C2.58012 100.62 0.000117674 89.7841 0.000117674 77.4001C0.000117674 65.1308 2.69478 54.3521 8.08412 45.0641C13.5881 35.7761 21.2135 28.5521 30.9601 23.3921C40.8215 18.1174 52.1735 15.4801 65.0161 15.4801C77.6295 15.4801 88.5801 18.0601 97.8681 23.2201C107.271 28.3801 114.552 35.6041 119.712 44.8921C124.987 54.1801 127.624 65.0734 127.624 77.5721C127.624 89.7268 124.872 100.448 119.368 109.736C113.979 119.024 106.411 126.305 96.6641 131.58C87.0321 136.74 75.7948 139.32 62.9521 139.32ZM67.7681 132.096C76.3681 132.096 83.8215 130.204 90.1281 126.42C96.5495 122.521 101.48 116.96 104.92 109.736C108.475 102.397 110.252 93.6828 110.252 83.5921C110.252 71.4374 108.073 60.8308 103.716 51.7721C99.3588 42.5988 93.3961 35.4894 85.8281 30.4441C78.2601 25.2841 69.6028 22.7041 59.8561 22.7041C51.2561 22.7041 43.7455 24.6534 37.3241 28.5521C31.0175 32.3361 26.0868 37.8401 22.5321 45.0641C19.0921 52.2881 17.3721 61.0028 17.3721 71.2081C17.3721 83.3628 19.5508 94.0268 23.9081 103.2C28.2655 112.259 34.2281 119.368 41.7961 124.528C49.3641 129.573 58.0215 132.096 67.7681 132.096Z"
              fill="currentColor"
            />
          </svg>
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
                        isActive ? "bg-accent text-accent-foreground justify-start" : "hover:bg-accent/50 justify-start"
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
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {profile?.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) ||
                            user.email?.[0].toUpperCase() ||
                            "U"}
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
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {profile?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) ||
                          user.email?.[0].toUpperCase() ||
                          "U"}
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
