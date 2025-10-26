import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plaibook } from "@/lib/types";
import { toast } from "sonner";

export const usePlaybooks = () => {
  const queryClient = useQueryClient();

  const { data: playbooks = [], isLoading, error } = useQuery({
    queryKey: ["playbooks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("playbooks")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transform database format to app format
      return (data || []).map((pb) => ({
        id: pb.id,
        title: pb.title,
        content: pb.content || "",
        createdAt: new Date(pb.created_at!).getTime(),
        updatedAt: new Date(pb.updated_at!).getTime(),
        user_id: pb.user_id,
        questions: [], // Questions loaded separately
        selectedDocuments: [],
      })) as Plaibook[];
    },
  });

  const createPlaybook = useMutation({
    mutationFn: async (playbook: Plaibook) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("playbooks")
        .insert({
          id: playbook.id,
          user_id: user.id,
          title: playbook.title,
          content: playbook.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbooks"] });
      toast.success("Playbook created");
    },
    onError: (error) => {
      console.error("Error creating playbook:", error);
      toast.error("Failed to create playbook");
    },
  });

  const deletePlaybook = useMutation({
    mutationFn: async (playbookId: string) => {
      const { error } = await supabase
        .from("playbooks")
        .delete()
        .eq("id", playbookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbooks"] });
      toast.success("Playbook deleted");
    },
    onError: (error) => {
      console.error("Error deleting playbook:", error);
      toast.error("Failed to delete playbook");
    },
  });

  return {
    playbooks,
    isLoading,
    error,
    createPlaybook: createPlaybook.mutate,
    deletePlaybook: deletePlaybook.mutate,
  };
};
