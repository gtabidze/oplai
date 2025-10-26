import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Clean up localStorage on user switch
      if (session?.user) {
        const lastUserId = localStorage.getItem('last_user_id');
        if (lastUserId && lastUserId !== session.user.id) {
          // Clear user-specific localStorage keys
          localStorage.removeItem('plaibooks');
          localStorage.removeItem('questionSystemPrompt');
          localStorage.removeItem('answerSystemPrompt');
          localStorage.removeItem('questionCount');
          localStorage.removeItem('llmProvider');
        }
        localStorage.setItem('last_user_id', session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      // Clean up localStorage on user switch
      if (session?.user) {
        const lastUserId = localStorage.getItem('last_user_id');
        if (lastUserId && lastUserId !== session.user.id) {
          // Clear user-specific localStorage keys
          localStorage.removeItem('plaibooks');
          localStorage.removeItem('questionSystemPrompt');
          localStorage.removeItem('answerSystemPrompt');
          localStorage.removeItem('questionCount');
          localStorage.removeItem('llmProvider');
        }
        localStorage.setItem('last_user_id', session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
};
