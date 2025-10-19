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
import { ThumbsUp, ThumbsDown, Trash2, Edit2, RotateCw, Save, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
      const llmProvider = localStorage.getItem("llmProvider") || "lovable";

      const { data, error } = await supabase.functions.invoke("get-answer", {
        body: {
          documentContent: plaibook.content,
          question: selectedQuestion.question,
          customSystemPrompt: customPrompt,
          llmProvider,
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
      toast.success("Answer regenerated successfully");
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
