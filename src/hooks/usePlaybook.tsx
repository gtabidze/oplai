import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plaibook, SavedQuestion } from "@/lib/types";
import { toast } from "sonner";

export const usePlaybook = (playbookId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: playbook, isLoading } = useQuery({
    queryKey: ["playbook", playbookId],
    queryFn: async () => {
      if (!playbookId) throw new Error("No playbook ID provided");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch playbook
      const { data: pb, error: pbError } = await supabase
        .from("playbooks")
        .select("*")
        .eq("id", playbookId)
        .single();

      if (pbError) throw pbError;

      // Fetch questions for this playbook
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
          id,
          question,
          answers (
            id,
            answer,
            score
          )
        `)
        .eq("playbook_id", playbookId)
        .order("created_at", { ascending: true });

      if (questionsError) throw questionsError;

      // Transform to SavedQuestion format
      const questions: SavedQuestion[] = (questionsData || []).map((q: any) => ({
        id: q.id,
        question: q.question,
        answer: q.answers?.[0]?.answer || undefined,
        feedback: q.answers?.[0]?.score
          ? { thumbsUp: q.answers[0].score >= 50, score: q.answers[0].score }
          : undefined,
      }));

      return {
        id: pb.id,
        title: pb.title,
        content: pb.content || "",
        createdAt: new Date(pb.created_at!).getTime(),
        updatedAt: new Date(pb.updated_at!).getTime(),
        user_id: pb.user_id,
        questions,
        selectedDocuments: [],
      } as Plaibook;
    },
    enabled: !!playbookId,
  });

  const updatePlaybook = useMutation({
    mutationFn: async ({ title, content }: { title?: string; content?: string }) => {
      if (!playbookId) throw new Error("No playbook ID");

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;

      const { error } = await supabase
        .from("playbooks")
        .update(updates)
        .eq("id", playbookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbook", playbookId] });
      queryClient.invalidateQueries({ queryKey: ["playbooks"] });
    },
    onError: (error) => {
      console.error("Error updating playbook:", error);
      toast.error("Failed to update playbook");
    },
  });

  const updateQuestions = useMutation({
    mutationFn: async (questions: SavedQuestion[]) => {
      if (!playbookId) throw new Error("No playbook ID");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get existing questions from DB
      const { data: existingQuestions } = await supabase
        .from("questions")
        .select("id, question")
        .eq("playbook_id", playbookId);

      const existingIds = new Set(existingQuestions?.map((q) => q.id) || []);
      const currentIds = new Set(questions.map((q) => q.id));

      // Delete removed questions
      const toDelete = existingQuestions?.filter((q) => !currentIds.has(q.id)) || [];
      if (toDelete.length > 0) {
        await supabase
          .from("questions")
          .delete()
          .in("id", toDelete.map((q) => q.id));
      }

      // Insert or update questions
      for (const q of questions) {
        if (!existingIds.has(q.id)) {
          // Insert new question
          const { data: newQuestion, error: questionError } = await supabase
            .from("questions")
            .insert({
              id: q.id,
              playbook_id: playbookId,
              user_id: user.id,
              question: q.question,
            })
            .select()
            .single();

          if (questionError) throw questionError;

          // Insert answer if exists
          if (q.answer && newQuestion) {
            await supabase.from("answers").insert({
              question_id: newQuestion.id,
              user_id: user.id,
              answer: q.answer,
              score: q.feedback?.score || null,
            });
          }
        } else {
          // Update existing question
          await supabase
            .from("questions")
            .update({ question: q.question })
            .eq("id", q.id);

          // Update or insert answer
          if (q.answer) {
            const { data: existingAnswer } = await supabase
              .from("answers")
              .select("id")
              .eq("question_id", q.id)
              .maybeSingle();

            if (existingAnswer) {
              await supabase
                .from("answers")
                .update({
                  answer: q.answer,
                  score: q.feedback?.score || null,
                })
                .eq("question_id", q.id);
            } else {
              await supabase.from("answers").insert({
                question_id: q.id,
                user_id: user.id,
                answer: q.answer,
                score: q.feedback?.score || null,
              });
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbook", playbookId] });
    },
    onError: (error) => {
      console.error("Error updating questions:", error);
      toast.error("Failed to update questions");
    },
  });

  return {
    playbook,
    isLoading,
    updatePlaybook: updatePlaybook.mutate,
    updateQuestions: updateQuestions.mutate,
  };
};
