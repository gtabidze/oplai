import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Loader2, Sparkles, Plus, Trash2, RotateCw, Settings, FileText, X, Edit2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SavedQuestion, Plaibook } from "@/lib/types";
import { PromptSettingsModal } from "./PromptSettingsModal";
import { DocumentSelector } from "./DocumentSelector";
import { useAuth } from "@/hooks/useAuth";

interface ExperimentSidebarProps {
  plaibook: Plaibook | null;
  onUpdateQuestions: (questions: SavedQuestion[]) => void;
  onUpdateDocuments: (docIds: string[]) => void;
}

export const ExperimentSidebar = ({ plaibook, onUpdateQuestions, onUpdateDocuments }: ExperimentSidebarProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingAnswerId, setGeneratingAnswerId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<string | null>(null);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editedQuestionText, setEditedQuestionText] = useState("");
  const [editedAnswerText, setEditedAnswerText] = useState("");

  useEffect(() => {
    if (plaibook?.questions) {
      setQuestions(plaibook.questions);
    }
    if (plaibook?.selectedDocuments) {
      loadSelectedDocuments(plaibook.selectedDocuments);
    }
  }, [plaibook?.id]);

  const loadSelectedDocuments = async (docIds: string[]) => {
    if (!docIds.length || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('synced_files')
        .select('id, file_name, content')
        .in('id', docIds);
      
      if (error) throw error;
      setSelectedDocs(data || []);
    } catch (error) {
      console.error('Error loading selected documents:', error);
    }
  };

  const getCombinedContent = () => {
    let combined = plaibook?.content || '';
    
    if (selectedDocs.length > 0) {
      const docContents = selectedDocs
        .filter(doc => doc.content && doc.content.trim().length > 0)
        .map(doc => `\n\n--- Document: ${doc.file_name} ---\n${doc.content}`)
        .join('\n');
      
      combined += docContents;
    }
    
    return combined;
  };

  const handleGenerateQuestions = async () => {
    if (!plaibook) return;
    
    setIsGenerating(true);
    try {
      const customPrompt = localStorage.getItem('questionSystemPrompt');
      const llmProvider = localStorage.getItem('llmProvider') || 'lovable';
      const questionCount = localStorage.getItem('questionCount') || '5';
      
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { 
          documentContent: getCombinedContent(),
          customSystemPrompt: customPrompt,
          llmProvider,
          count: parseInt(questionCount)
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
      const llmProvider = localStorage.getItem('llmProvider') || 'lovable';
      const { data, error } = await supabase.functions.invoke("get-answer", {
        body: { 
          documentContent: getCombinedContent(), 
          question: questionText,
          customSystemPrompt: customPrompt,
          llmProvider 
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

  const handleRegenerateQuestion = async (questionId: string) => {
    if (!plaibook) return;

    setRegeneratingQuestionId(questionId);
    try {
      const customPrompt = localStorage.getItem('questionSystemPrompt');
      const llmProvider = localStorage.getItem('llmProvider') || 'lovable';
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { 
          documentContent: getCombinedContent(),
          customSystemPrompt: customPrompt 
            ? customPrompt + "\n\nGenerate exactly 1 question."
            : 'You are a helpful assistant that generates questions. Analyze the provided text and generate 1 question that end users would ask about the facts, content, and subject matter presented in the text. Focus on the actual content, NOT meta-questions about the document itself. Return ONLY a JSON array with a single string, nothing else.',
          llmProvider,
          count: 1
        },
      });

      if (error) throw error;

      const newQuestion = data.questions?.[0];
      if (!newQuestion) {
        throw new Error("No question generated");
      }

      const updatedQuestions = questions.map((q) =>
        q.id === questionId 
          ? { ...q, question: newQuestion, answer: undefined, feedback: undefined }
          : q
      );
      
      setQuestions(updatedQuestions);
      onUpdateQuestions(updatedQuestions);
      toast.success("Question regenerated!");
    } catch (error) {
      console.error("Error regenerating question:", error);
      toast.error("Failed to regenerate question. Please try again.");
    } finally {
      setRegeneratingQuestionId(null);
    }
  };

  const handleEditQuestion = (questionId: string, currentText: string) => {
    setEditingQuestionId(questionId);
    setEditedQuestionText(currentText);
  };

  const handleSaveQuestion = (questionId: string) => {
    if (!editedQuestionText.trim()) return;

    const updatedQuestions = questions.map((q) =>
      q.id === questionId ? { ...q, question: editedQuestionText.trim() } : q
    );
    setQuestions(updatedQuestions);
    onUpdateQuestions(updatedQuestions);
    setEditingQuestionId(null);
    setEditedQuestionText("");
    toast.success("Question updated!");
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditedQuestionText("");
  };

  const handleEditAnswer = (questionId: string, currentText: string) => {
    setEditingAnswerId(questionId);
    setEditedAnswerText(currentText);
  };

  const handleSaveAnswer = (questionId: string) => {
    if (!editedAnswerText.trim()) return;

    const updatedQuestions = questions.map((q) =>
      q.id === questionId ? { ...q, answer: editedAnswerText.trim() } : q
    );
    setQuestions(updatedQuestions);
    onUpdateQuestions(updatedQuestions);
    setEditingAnswerId(null);
    setEditedAnswerText("");
    toast.success("Answer updated!");
  };

  const handleCancelEditAnswer = () => {
    setEditingAnswerId(null);
    setEditedAnswerText("");
  };

  const handleSelectDocuments = (docIds: string[]) => {
    onUpdateDocuments(docIds);
    loadSelectedDocuments(docIds);
  };

  const removeDocument = (docId: string) => {
    const newDocIds = (plaibook?.selectedDocuments || []).filter(id => id !== docId);
    onUpdateDocuments(newDocIds);
    setSelectedDocs(prev => prev.filter(doc => doc.id !== docId));
    toast.success("Document removed");
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

      {/* Document Selection */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowDocSelector(true)}
        >
          <FileText className="h-4 w-4 mr-2" />
          Select Documents ({selectedDocs.length})
        </Button>
        
        {selectedDocs.length > 0 && (
          <div className="space-y-1">
            {selectedDocs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1"
              >
                <FileText className="h-3 w-3" />
                <span className="flex-1 truncate">{doc.file_name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => removeDocument(doc.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
      <div className="flex-1 space-y-3">
        {questions.map((q) => (
          <Card key={q.id} className="border-border/50">
            <CardHeader className="pb-3">
              {editingQuestionId === q.id ? (
                <div className="space-y-2">
                  <Input
                    value={editedQuestionText}
                    onChange={(e) => setEditedQuestionText(e.target.value)}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEditQuestion}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveQuestion(q.id)}
                      disabled={!editedQuestionText.trim()}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium flex-1">{q.question}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mt-1"
                      onClick={() => handleEditQuestion(q.id, q.question)}
                      title="Edit question"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mt-1"
                      onClick={() => handleRegenerateQuestion(q.id)}
                      disabled={regeneratingQuestionId === q.id}
                      title="Regenerate question"
                    >
                      <RotateCw className={`h-3 w-3 ${regeneratingQuestionId === q.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mt-1"
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Delete question"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
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
                  {editingAnswerId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedAnswerText}
                        onChange={(e) => setEditedAnswerText(e.target.value)}
                        className="min-h-[100px]"
                        autoFocus
                      />
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEditAnswer}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveAnswer(q.id)}
                          disabled={!editedAnswerText.trim()}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative p-3 bg-muted/50 rounded-md group">
                        <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditAnswer(q.id, q.answer || "")}
                          title="Edit answer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
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
                    </>
                  )}

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
                        onValueChange={(value) => {
                          const newScore = value[0];
                          const thumbsUp = newScore >= 60;
                          handleFeedback(q.id, thumbsUp, newScore);
                        }}
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
      <DocumentSelector
        open={showDocSelector}
        onOpenChange={setShowDocSelector}
        selectedDocIds={plaibook?.selectedDocuments || []}
        onSelectDocuments={handleSelectDocuments}
      />
    </div>
  );
};
