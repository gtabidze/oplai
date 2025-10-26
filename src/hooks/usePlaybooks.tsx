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

      // Fetch owned playbooks
      const { data: ownedData, error: ownedError } = await supabase
        .from("playbooks")
        .select("*")
        .eq("user_id", user.id);

      if (ownedError) throw ownedError;

      // Fetch playbooks where user is a collaborator
      const { data: collabData, error: collabError } = await supabase
        .from("playbook_collaborators")
        .select("playbook_id")
        .eq("user_id", user.id);

      if (collabError) throw collabError;

      const collabPlaybookIds = collabData?.map(c => c.playbook_id) || [];

      // Fetch collaborator playbooks
      let collaboratorPlaybooks: any[] = [];
      if (collabPlaybookIds.length > 0) {
        const { data: collabPlaybooksData, error: collabPlaybooksError } = await supabase
          .from("playbooks")
          .select("*")
          .in("id", collabPlaybookIds);

        if (collabPlaybooksError) throw collabPlaybooksError;
        collaboratorPlaybooks = collabPlaybooksData || [];
      }

      // Combine and deduplicate
      const allPlaybooks = [...(ownedData || []), ...collaboratorPlaybooks];
      const uniquePlaybooks = Array.from(
        new Map(allPlaybooks.map(pb => [pb.id, pb])).values()
      );

      // Transform database format to app format
      return uniquePlaybooks
        .map((pb) => ({
          id: pb.id,
          title: pb.title,
          content: pb.content || "",
          createdAt: new Date(pb.created_at!).getTime(),
          updatedAt: new Date(pb.updated_at!).getTime(),
          user_id: pb.user_id,
          questions: [], // Questions loaded separately
          selectedDocuments: [],
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt) as Plaibook[];
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
