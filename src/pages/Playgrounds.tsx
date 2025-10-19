import { useState, useEffect } from "react";
import { Plaibook, SavedQuestion } from "@/lib/types";
import { getAllPlaibooks, savePlaibook } from "@/lib/localStorage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThumbsUp, ThumbsDown, Trash2, Edit2, RotateCw, Save, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuestionWithPlaybook extends SavedQuestion {
  plaibookTitle: string;
  plaibookId: string;
}

const Playgrounds = () => {
  const [allQuestions, setAllQuestions] = useState<QuestionWithPlaybook[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithPlaybook | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("lovable");
  const [selectedModel, setSelectedModel] = useState<string>("google/gemini-2.5-flash");

  const providerModels: Record<string, { value: string; label: string }[]> = {
    lovable: [
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Default)" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
      { value: "openai/gpt-5", label: "GPT-5" },
      { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
      { value: "openai/gpt-5-nano", label: "GPT-5 Nano" },
    ],
    openai: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    anthropic: [
      { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { value: "claude-opus-4-1-20250805", label: "Claude Opus 4.1" },
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    ],
  };

  useEffect(() => {
    loadAllQuestions();
  }, []);

  const loadAllQuestions = () => {
    const plaibooks = getAllPlaibooks();
    const questions: QuestionWithPlaybook[] = [];

    plaibooks.forEach((plaibook: Plaibook) => {
      if (plaibook.questions && plaibook.questions.length > 0) {
        plaibook.questions.forEach((question) => {
          questions.push({
            ...question,
            plaibookTitle: plaibook.title,
            plaibookId: plaibook.id,
          });
        });
      }
    });

    setAllQuestions(questions);
  };

  const handleRowClick = (question: QuestionWithPlaybook) => {
    setSelectedQuestion(question);
    setEditedQuestion(question.question);
    setIsEditing(false);
    setIsSheetOpen(true);
  };

  const handleDeleteQuestion = () => {
    if (!deleteQuestionId) return;

    const plaibooks = getAllPlaibooks();
    const updatedPlaibooks = plaibooks.map((plaibook: Plaibook) => {
      if (plaibook.questions) {
        return {
          ...plaibook,
          questions: plaibook.questions.filter((q) => q.id !== deleteQuestionId),
        };
      }
      return plaibook;
    });

    updatedPlaibooks.forEach((plaibook: Plaibook) => {
      savePlaibook(plaibook);
    });

    loadAllQuestions();
    setDeleteQuestionId(null);
    setIsSheetOpen(false);
    toast.success("Question deleted successfully");
  };

  const handleEditQuestion = () => {
    if (!selectedQuestion || !editedQuestion.trim()) return;

    const plaibooks = getAllPlaibooks();
    const updatedPlaibooks = plaibooks.map((plaibook: Plaibook) => {
      if (plaibook.id === selectedQuestion.plaibookId && plaibook.questions) {
        return {
          ...plaibook,
          questions: plaibook.questions.map((q) =>
            q.id === selectedQuestion.id ? { ...q, question: editedQuestion.trim() } : q
          ),
        };
      }
      return plaibook;
    });

    updatedPlaibooks.forEach((plaibook: Plaibook) => {
      savePlaibook(plaibook);
    });

    loadAllQuestions();
    setIsEditing(false);
    setSelectedQuestion({
      ...selectedQuestion,
      question: editedQuestion.trim(),
    });
    toast.success("Question updated successfully");
  };

  const handleRegenerateAnswer = async () => {
    if (!selectedQuestion) return;

    setIsRegenerating(true);
    try {
      const plaibooks = getAllPlaibooks();
      const plaibook = plaibooks.find((p: Plaibook) => p.id === selectedQuestion.plaibookId);

      if (!plaibook) {
        throw new Error("Playbook not found");
      }

      const customPrompt = localStorage.getItem("answerSystemPrompt");

      const { data, error } = await supabase.functions.invoke("get-answer", {
        body: {
          documentContent: plaibook.content,
          question: selectedQuestion.question,
          customSystemPrompt: customPrompt,
          llmProvider: selectedProvider,
          model: selectedModel,
        },
      });

      if (error) throw error;

      const updatedPlaibooks = plaibooks.map((p: Plaibook) => {
        if (p.id === selectedQuestion.plaibookId && p.questions) {
          return {
            ...p,
            questions: p.questions.map((q) =>
              q.id === selectedQuestion.id ? { ...q, answer: data.answer } : q
            ),
          };
        }
        return p;
      });

      updatedPlaibooks.forEach((p: Plaibook) => {
        savePlaibook(p);
      });

      loadAllQuestions();
      setSelectedQuestion({
        ...selectedQuestion,
        answer: data.answer,
      });
      toast.success(`Answer regenerated with ${selectedProvider} - ${selectedModel}`);
    } catch (error) {
      console.error("Error regenerating answer:", error);
      toast.error("Failed to regenerate answer");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Playgrounds</h1>
        <p className="text-muted-foreground mb-8">
          All questions generated across your playbooks
        </p>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Question</TableHead>
                <TableHead>Playbook</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No questions generated yet. Create a playbook and generate questions to get started.
                  </TableCell>
                </TableRow>
              ) : (
                allQuestions.map((question) => (
                  <TableRow
                    key={question.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(question)}
                  >
                    <TableCell className="font-medium">{question.question}</TableCell>
                    <TableCell>{question.plaibookTitle}</TableCell>
                    <TableCell>
                      {question.answer ? (
                        <span className="text-green-600 dark:text-green-400">Answered</span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {question.feedback?.score !== undefined
                        ? `${question.feedback.score}%`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedQuestion && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>Question Details</SheetTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteQuestionId(selectedQuestion.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Playbook</p>
                  <p className="font-medium">{selectedQuestion.plaibookTitle}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Question</p>
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedQuestion(selectedQuestion.question);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleEditQuestion}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <Input
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-base">{selectedQuestion.question}</p>
                  )}
                </div>

                {/* LLM Provider Selection */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="provider">AI Provider</Label>
                    <Select value={selectedProvider} onValueChange={(value) => {
                      setSelectedProvider(value);
                      // Reset to first model of new provider
                      setSelectedModel(providerModels[value][0].value);
                    }}>
                      <SelectTrigger id="provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lovable">Lovable AI</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger id="model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {providerModels[selectedProvider]?.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Select a provider and model to regenerate the answer
                  </p>
                </div>

                {selectedQuestion.answer && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Answer</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRegenerateAnswer}
                        disabled={isRegenerating}
                      >
                        <RotateCw className={`h-4 w-4 mr-1 ${isRegenerating ? "animate-spin" : ""}`} />
                        {isRegenerating ? "Regenerating..." : "Regenerate"}
                      </Button>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">{selectedQuestion.answer}</p>
                    </div>
                  </div>
                )}

                {selectedQuestion.feedback && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Feedback</p>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedQuestion.feedback.thumbsUp ? "default" : "outline"}
                          size="sm"
                          disabled
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={!selectedQuestion.feedback.thumbsUp ? "default" : "outline"}
                          size="sm"
                          disabled
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-sm font-medium">{selectedQuestion.feedback.score}%</p>
                      </div>
                      <Progress value={selectedQuestion.feedback.score} />
                    </div>
                  </div>
                )}

                {!selectedQuestion.answer && (
                  <p className="text-sm text-muted-foreground italic">
                    No answer generated yet
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteQuestionId !== null} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Playgrounds;
