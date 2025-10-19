import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UserPresence {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  online_at: string;
}

interface ActiveUsersProps {
  plaibookId: string;
}

export const ActiveUsers = ({ plaibookId }: ActiveUsersProps) => {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const setupPresence = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      const roomChannel = supabase.channel(`plaibook:${plaibookId}`);

      roomChannel
        .on("presence", { event: "sync" }, () => {
          const state = roomChannel.presenceState();
          const users: UserPresence[] = [];
          
          Object.values(state).forEach((presences: any) => {
            presences.forEach((presence: UserPresence) => {
              users.push(presence);
            });
          });
          
          setActiveUsers(users);
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          console.log("New users joined:", newPresences);
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          console.log("Users left:", leftPresences);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await roomChannel.track({
              user_id: user.id,
              full_name: profile?.full_name || user.email || "Anonymous",
              avatar_url: profile?.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        });

      setChannel(roomChannel);
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [plaibookId]);

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      {activeUsers.slice(0, 5).map((user) => (
        <Tooltip key={user.user_id}>
          <TooltipTrigger>
            <Avatar className="h-8 w-8 border-2 border-background">
              {user.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
              ) : null}
              <AvatarFallback className="text-xs">
                {user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{user.full_name}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      {activeUsers.length > 5 && (
        <Avatar className="h-8 w-8 border-2 border-background">
          <AvatarFallback className="text-xs">
            +{activeUsers.length - 5}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
