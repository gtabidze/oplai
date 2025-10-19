import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PromptSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_QUESTION_PROMPT = 'You are a helpful assistant that generates questions. Analyze the provided text and generate 8 questions that end users would ask about the facts, content, and subject matter presented in the text. Focus on the actual content, NOT meta-questions about the document itself. Return ONLY a JSON array of strings, nothing else.';

const DEFAULT_ANSWER_PROMPT = 'You are a professional document expert. Answer questions based strictly on the document content. Keep answers concise (maximum 400 characters), direct, and without fluff. Provide only essential information.';

export const PromptSettingsModal = ({ open, onOpenChange }: PromptSettingsModalProps) => {
  const [questionPrompt, setQuestionPrompt] = useState(DEFAULT_QUESTION_PROMPT);
  const [answerPrompt, setAnswerPrompt] = useState(DEFAULT_ANSWER_PROMPT);

  useEffect(() => {
    // Load saved prompts from localStorage
    const savedQuestionPrompt = localStorage.getItem('questionSystemPrompt');
    const savedAnswerPrompt = localStorage.getItem('answerSystemPrompt');
    
    if (savedQuestionPrompt) setQuestionPrompt(savedQuestionPrompt);
    if (savedAnswerPrompt) setAnswerPrompt(savedAnswerPrompt);
  }, []);

  const handleSave = () => {
    localStorage.setItem('questionSystemPrompt', questionPrompt);
    localStorage.setItem('answerSystemPrompt', answerPrompt);
    toast.success("System prompts saved successfully!");
    onOpenChange(false);
  };

  const handleReset = (type: 'question' | 'answer') => {
    if (type === 'question') {
      setQuestionPrompt(DEFAULT_QUESTION_PROMPT);
      localStorage.removeItem('questionSystemPrompt');
    } else {
      setAnswerPrompt(DEFAULT_ANSWER_PROMPT);
      localStorage.removeItem('answerSystemPrompt');
    }
    toast.success(`${type === 'question' ? 'Question' : 'Answer'} prompt reset to default`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Evaluation System Prompts</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="questions" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">Question Generation</TabsTrigger>
            <TabsTrigger value="answers">Answer Generation</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="flex-1 flex flex-col gap-4 overflow-hidden mt-4">
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
              <label className="text-sm font-medium">System Prompt for Question Generation</label>
              <Textarea
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
                placeholder="Enter system prompt for generating questions..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleReset('question')} variant="outline" size="sm">
                Reset to Default
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="answers" className="flex-1 flex flex-col gap-4 overflow-hidden mt-4">
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
              <label className="text-sm font-medium">System Prompt for Answer Generation</label>
              <Textarea
                value={answerPrompt}
                onChange={(e) => setAnswerPrompt(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
                placeholder="Enter system prompt for generating answers..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleReset('answer')} variant="outline" size="sm">
                Reset to Default
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};