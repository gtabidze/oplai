import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ThumbsUp, ThumbsDown, Loader2, Sparkles, Plus, Trash2, RotateCw, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SavedQuestion, Plaibook } from "@/lib/types";
import { PromptSettingsModal } from "./PromptSettingsModal";

interface ExperimentSidebarProps {
  plaibook: Plaibook | null;
  onUpdateQuestions: (questions: SavedQuestion[]) => void;
}

export const ExperimentSidebar = ({ plaibook, onUpdateQuestions }: ExperimentSidebarProps) => {
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingAnswerId, setGeneratingAnswerId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (plaibook?.questions) {
      setQuestions(plaibook.questions);
    }
  }, [plaibook?.id]);

  const handleGenerateQuestions = async () => {
    if (!plaibook) return;
    
    setIsGenerating(true);
    try {
      const customPrompt = localStorage.getItem('questionSystemPrompt');
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { 
          documentContent: plaibook.content,
          customSystemPrompt: customPrompt 
        },
      });

      if (error) throw error;

      const newQuestions: SavedQuestion[] = (data.questions || []).map((q: string) => ({
        id: crypto.randomUUID(),
        question: q,
      }));

      const updatedQuestions = [...questions, ...newQuestions];
      setQuestions(updatedQuestions);
      onUpdateQuestions(updatedQuestions);
      toast.success("Questions generated successfully!");
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManualQuestion = () => {
    if (!newQuestion.trim()) return;

    const newQ: SavedQuestion = {
      id: crypto.randomUUID(),
      question: newQuestion.trim(),
    };

    const updatedQuestions = [...questions, newQ];
    setQuestions(updatedQuestions);
    onUpdateQuestions(updatedQuestions);
    setNewQuestion("");
    toast.success("Question added!");
  };

  const handleGenerateAnswer = async (questionId: string, questionText: string) => {
    if (!plaibook) return;

    setGeneratingAnswerId(questionId);
    try {
      const customPrompt = localStorage.getItem('answerSystemPrompt');
      const { data, error } = await supabase.functions.invoke("get-answer", {
        body: { 
          documentContent: plaibook.content, 
          question: questionText,
          customSystemPrompt: customPrompt 
        },
      });

      if (error) throw error;

      const updatedQuestions = questions.map((q) =>
        q.id === questionId ? { ...q, answer: data.answer || "" } : q
      );
      setQuestions(updatedQuestions);
      onUpdateQuestions(updatedQuestions);
      toast.success("Answer generated!");
    } catch (error) {
      console.error("Error getting answer:", error);
      toast.error("Failed to generate answer. Please try again.");
    } finally {
      setGeneratingAnswerId(null);
    }
  };

  const handleFeedback = (questionId: string, thumbsUp: boolean, score?: number) => {
    const updatedQuestions = questions.map((q) =>
      q.id === questionId
        ? { ...q, feedback: { thumbsUp, score: score ?? q.feedback?.score ?? 50 } }
        : q
    );
    setQuestions(updatedQuestions);
    onUpdateQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter((q) => q.id !== questionId);
    setQuestions(updatedQuestions);
    onUpdateQuestions(updatedQuestions);
    toast.success("Question deleted");
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Evaluation Area
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          className="h-8 w-8"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Question Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a question..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddManualQuestion()}
        />
        <Button
          size="icon"
          onClick={handleAddManualQuestion}
          disabled={!newQuestion.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Generate Questions Button */}
      <Button
        onClick={handleGenerateQuestions}
        disabled={isGenerating || !plaibook}
        variant="outline"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Questions
          </>
        )}
      </Button>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {questions.map((q) => (
          <Card key={q.id} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium flex-1">{q.question}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1"
                  onClick={() => handleDeleteQuestion(q.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!q.answer ? (
                <Button
                  onClick={() => handleGenerateAnswer(q.id, q.question)}
                  disabled={generatingAnswerId === q.id}
                  size="sm"
                  className="w-full"
                >
                  {generatingAnswerId === q.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Answer
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                  </div>

                  <Button
                    onClick={() => handleGenerateAnswer(q.id, q.question)}
                    disabled={generatingAnswerId === q.id}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    {generatingAnswerId === q.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Regenerate Answer
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant={q.feedback?.thumbsUp === true ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleFeedback(q.id, true)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={q.feedback?.thumbsUp === false ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleFeedback(q.id, false)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Slider
                        value={[q.feedback?.score ?? 50]}
                        onValueChange={(value) =>
                          handleFeedback(q.id, q.feedback?.thumbsUp ?? true, value[0])
                        }
                        max={100}
                        step={1}
                        className="w-24"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {q.feedback?.score ?? 50}/100
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <PromptSettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
};
