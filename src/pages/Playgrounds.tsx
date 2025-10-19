import { useState, useEffect } from "react";
import { Plaibook, SavedQuestion } from "@/lib/types";
import { getAllPlaibooks } from "@/lib/localStorage";
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
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuestionWithPlaybook extends SavedQuestion {
  plaibookTitle: string;
  plaibookId: string;
}

const Playgrounds = () => {
  const [allQuestions, setAllQuestions] = useState<QuestionWithPlaybook[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithPlaybook | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    setIsSheetOpen(true);
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
                <SheetTitle>Question Details</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Playbook</p>
                  <p className="font-medium">{selectedQuestion.plaibookTitle}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Question</p>
                  <p className="text-base">{selectedQuestion.question}</p>
                </div>

                {selectedQuestion.answer && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Answer</p>
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
    </div>
  );
};

export default Playgrounds;
