import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThumbsUp, ThumbsDown, Loader2, Sparkles } from "lucide-react";
import { Question, Answer } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface ExperimentSidebarProps {
  documentContent: string;
}

export const ExperimentSidebar = ({ documentContent }: ExperimentSidebarProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [helpfulnessScore, setHelpfulnessScore] = useState([50]);

  const handleStartExperiment = async () => {
    if (!documentContent.trim()) {
      toast.error("Please write some content in the document first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: { documentContent }
      });

      if (error) throw error;

      const questionsList: Question[] = data.questions.map((q: string, idx: number) => ({
        id: `q-${idx}`,
        text: q
      }));
      
      setQuestions(questionsList);
      toast.success("Questions generated successfully!");
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionClick = async (question: Question) => {
    setSelectedQuestion(question);
    setIsAnswering(true);
    setAnswer(null);
    setHelpfulnessScore([50]);

    try {
      const { data, error } = await supabase.functions.invoke('get-answer', {
        body: { 
          documentContent,
          question: question.text 
        }
      });

      if (error) throw error;

      setAnswer({
        questionId: question.id,
        text: data.answer
      });
    } catch (error) {
      console.error('Error getting answer:', error);
      toast.error("Failed to get answer. Please try again.");
    } finally {
      setIsAnswering(false);
    }
  };

  const handleFeedback = (helpful: boolean) => {
    toast.success(`Feedback recorded: ${helpful ? 'Helpful' : 'Not helpful'}`);
  };

  if (questions.length === 0) {
    return (
      <Card className="h-full bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Experiment
          </CardTitle>
          <CardDescription>
            Test your AI agent's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleStartExperiment} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Start Experiment'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (selectedQuestion && answer) {
    return (
      <Card className="h-full bg-card border-border flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Q&A Testing
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSelectedQuestion(null);
              setAnswer(null);
            }}
          >
            ← Back to questions
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-accent">Question:</h4>
            <p className="text-sm text-muted-foreground">{selectedQuestion.text}</p>
          </div>
          
          <Alert className="bg-muted/50 border-primary/20">
            <AlertDescription>
              <h4 className="font-semibold mb-2">Answer:</h4>
              {isAnswering ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating answer...
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{answer.text}</p>
              )}
            </AlertDescription>
          </Alert>

          {!isAnswering && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h4 className="font-semibold mb-3">Feedback</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFeedback(true)}
                    className="flex-1 hover:bg-green-500/10 hover:border-green-500"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Helpful
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFeedback(false)}
                    className="flex-1 hover:bg-destructive/10 hover:border-destructive"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Not Helpful
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Helpfulness Score: {helpfulnessScore[0]}
                </label>
                <Slider
                  value={helpfulnessScore}
                  onValueChange={setHelpfulnessScore}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card border-border flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Sample Questions
        </CardTitle>
        <CardDescription>
          Click a question to test the AI's answer
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {questions.map((question) => (
            <Button
              key={question.id}
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/10 hover:text-primary"
              onClick={() => handleQuestionClick(question)}
            >
              <span className="text-sm">{question.text}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
