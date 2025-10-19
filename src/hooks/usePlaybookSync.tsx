import { useEffect } from 'react';
import { useLocalStorage } from '@/lib/localStorage';
import { Plaibook } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePlaybookSync = () => {
  const [plaibooks] = useLocalStorage<Plaibook[]>('plaibooks', []);

  useEffect(() => {
    const syncPlaybooks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || plaibooks.length === 0) return;

        // Get existing playbooks from database
        const { data: existingPlaybooks } = await supabase
          .from('playbooks')
          .select('id')
          .eq('user_id', user.id);

        const existingIds = new Set(existingPlaybooks?.map(p => p.id) || []);

        // Sync each playbook from localStorage to database
        for (const playbook of plaibooks) {
          if (!existingIds.has(playbook.id)) {
            // Insert new playbook
            const { error: playbookError } = await supabase
              .from('playbooks')
              .insert({
                id: playbook.id,
                user_id: user.id,
                title: playbook.title,
                content: playbook.content,
              });

            if (playbookError) {
              console.error('Error syncing playbook:', playbookError);
              continue;
            }
          } else {
            // Update existing playbook
            const { error: updateError } = await supabase
              .from('playbooks')
              .update({
                title: playbook.title,
                content: playbook.content,
              })
              .eq('id', playbook.id);

            if (updateError) {
              console.error('Error updating playbook:', updateError);
            }
          }

          // Sync questions
          if (playbook.questions && playbook.questions.length > 0) {
            // Get existing questions
            const { data: existingQuestions } = await supabase
              .from('questions')
              .select('id, question')
              .eq('playbook_id', playbook.id);

            const existingQuestionMap = new Map(
              existingQuestions?.map(q => [q.question, q.id]) || []
            );

            // Insert or update questions
            for (const savedQuestion of playbook.questions) {
              const existingId = existingQuestionMap.get(savedQuestion.question);
              
              if (!existingId) {
                // Insert new question
                const { data: newQuestion, error: questionError } = await supabase
                  .from('questions')
                  .insert({
                    playbook_id: playbook.id,
                    user_id: user.id,
                    question: savedQuestion.question,
                  })
                  .select()
                  .single();

                if (questionError) {
                  console.error('Error syncing question:', questionError);
                  continue;
                }

                // Sync answer if it exists (legacy or new format)
                const answerText = savedQuestion.answer || savedQuestion.answers?.[0]?.text;
                const score = savedQuestion.feedback?.score;
                
                if (answerText && newQuestion) {
                  await supabase
                    .from('answers')
                    .insert({
                      question_id: newQuestion.id,
                      user_id: user.id,
                      answer: answerText,
                      score: score,
                    });
                }
              }
            }
          }
        }

        console.log('Playbooks synced to database');
      } catch (error) {
        console.error('Error in playbook sync:', error);
      }
    };

    syncPlaybooks();
  }, [plaibooks]);
};
