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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { History, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Prompt {
  id: string;
  name: string;
  type: "question" | "answer";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PromptVersion {
  id: string;
  prompt_id: string;
  content: string;
  version_number: number;
  created_at: string;
}

interface PromptSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromptSettingsModal = ({ open, onOpenChange }: PromptSettingsModalProps) => {
  const { user } = useAuth();
  const [questionPrompts, setQuestionPrompts] = useState<Prompt[]>([]);
  const [answerPrompts, setAnswerPrompts] = useState<Prompt[]>([]);
  const [selectedQuestionPrompt, setSelectedQuestionPrompt] = useState<Prompt | null>(null);
  const [selectedAnswerPrompt, setSelectedAnswerPrompt] = useState<Prompt | null>(null);
  const [questionVersions, setQuestionVersions] = useState<PromptVersion[]>([]);
  const [answerVersions, setAnswerVersions] = useState<PromptVersion[]>([]);
  const [selectedQuestionVersion, setSelectedQuestionVersion] = useState<PromptVersion | null>(null);
  const [selectedAnswerVersion, setSelectedAnswerVersion] = useState<PromptVersion | null>(null);
  const [questionContent, setQuestionContent] = useState("");
  const [answerContent, setAnswerContent] = useState("");

  useEffect(() => {
    if (user && open) {
      loadPrompts();
    }
  }, [user, open]);

  useEffect(() => {
    if (selectedQuestionPrompt) {
      loadVersions(selectedQuestionPrompt.id, "question");
    }
  }, [selectedQuestionPrompt]);

  useEffect(() => {
    if (selectedAnswerPrompt) {
      loadVersions(selectedAnswerPrompt.id, "answer");
    }
  }, [selectedAnswerPrompt]);

  const loadPrompts = async () => {
    const { data: questionData } = await supabase
      .from("prompts")
      .select("*")
      .eq("type", "question")
      .order("created_at", { ascending: false });

    const { data: answerData } = await supabase
      .from("prompts")
      .select("*")
      .eq("type", "answer")
      .order("created_at", { ascending: false });

    if (questionData) {
      const typedQuestionData = questionData as Prompt[];
      setQuestionPrompts(typedQuestionData);
      const active = typedQuestionData.find(p => p.is_active) || typedQuestionData[0];
      setSelectedQuestionPrompt(active || null);
    }

    if (answerData) {
      const typedAnswerData = answerData as Prompt[];
      setAnswerPrompts(typedAnswerData);
      const active = typedAnswerData.find(p => p.is_active) || typedAnswerData[0];
      setSelectedAnswerPrompt(active || null);
    }
  };

  const loadVersions = async (promptId: string, type: "question" | "answer") => {
    const { data } = await supabase
      .from("prompt_versions")
      .select("*")
      .eq("prompt_id", promptId)
      .order("version_number", { ascending: false });

    if (data && data.length > 0) {
      if (type === "question") {
        setQuestionVersions(data);
        setSelectedQuestionVersion(data[0]);
        setQuestionContent(data[0].content);
      } else {
        setAnswerVersions(data);
        setSelectedAnswerVersion(data[0]);
        setAnswerContent(data[0].content);
      }
    }
  };

  const handleVersionChange = (versionId: string, type: "question" | "answer") => {
    const versions = type === "question" ? questionVersions : answerVersions;
    const version = versions.find(v => v.id === versionId);
    if (version) {
      if (type === "question") {
        setSelectedQuestionVersion(version);
        setQuestionContent(version.content);
      } else {
        setSelectedAnswerVersion(version);
        setAnswerContent(version.content);
      }
      toast.success(`Loaded version ${version.version_number}`);
    }
  };

  const handleSave = async () => {
    if (selectedQuestionPrompt && selectedAnswerPrompt) {
      // Save to localStorage for backward compatibility
      localStorage.setItem('questionSystemPrompt', questionContent);
      localStorage.setItem('answerSystemPrompt', answerContent);
      
      // Set as active prompts in database
      await supabase.from("prompts").update({ is_active: true }).eq("id", selectedQuestionPrompt.id);
      await supabase.from("prompts").update({ is_active: true }).eq("id", selectedAnswerPrompt.id);
      
      toast.success("System prompts saved successfully!");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">System Prompts Configuration</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="question" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="question" className="text-base">
              Question Generation
            </TabsTrigger>
            <TabsTrigger value="answer" className="text-base">
              Answer Generation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="question" className="flex-1 flex flex-col gap-6 overflow-hidden mt-0">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Prompt Template</Label>
              {questionPrompts.length > 0 && (
                <Select
                  value={selectedQuestionPrompt?.id}
                  onValueChange={(value) => {
                    const prompt = questionPrompts.find(p => p.id === value);
                    setSelectedQuestionPrompt(prompt || null);
                  }}
                >
                  <SelectTrigger className="h-12 text-base border-2 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select a prompt template" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionPrompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id} className="text-base py-3">
                        <div className="flex items-center gap-2">
                          {prompt.name}
                          {prompt.is_active && (
                            <Badge variant="default" className="ml-2">Active</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedQuestionPrompt && questionVersions.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Version History
                </Label>
                <Select
                  value={selectedQuestionVersion?.id}
                  onValueChange={(value) => handleVersionChange(value, "question")}
                >
                  <SelectTrigger className="h-12 text-base border-2 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionVersions.map((version) => (
                      <SelectItem key={version.id} value={version.id} className="text-base py-3">
                        <div className="flex items-center justify-between w-full">
                          <span>Version {version.version_number}</span>
                          <span className="text-sm text-muted-foreground ml-4">
                            {new Date(version.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <Label className="text-base font-semibold">Prompt Content</Label>
              <div className="flex-1 relative rounded-lg border-2 overflow-hidden hover:border-primary/50 transition-colors bg-muted/30">
                <Textarea
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  className="h-full resize-none font-mono text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                  placeholder="Select a prompt to view its content..."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="answer" className="flex-1 flex flex-col gap-6 overflow-hidden mt-0">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Prompt Template</Label>
              {answerPrompts.length > 0 && (
                <Select
                  value={selectedAnswerPrompt?.id}
                  onValueChange={(value) => {
                    const prompt = answerPrompts.find(p => p.id === value);
                    setSelectedAnswerPrompt(prompt || null);
                  }}
                >
                  <SelectTrigger className="h-12 text-base border-2 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select a prompt template" />
                  </SelectTrigger>
                  <SelectContent>
                    {answerPrompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id} className="text-base py-3">
                        <div className="flex items-center gap-2">
                          {prompt.name}
                          {prompt.is_active && (
                            <Badge variant="default" className="ml-2">Active</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedAnswerPrompt && answerVersions.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Version History
                </Label>
                <Select
                  value={selectedAnswerVersion?.id}
                  onValueChange={(value) => handleVersionChange(value, "answer")}
                >
                  <SelectTrigger className="h-12 text-base border-2 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {answerVersions.map((version) => (
                      <SelectItem key={version.id} value={version.id} className="text-base py-3">
                        <div className="flex items-center justify-between w-full">
                          <span>Version {version.version_number}</span>
                          <span className="text-sm text-muted-foreground ml-4">
                            {new Date(version.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <Label className="text-base font-semibold">Prompt Content</Label>
              <div className="flex-1 relative rounded-lg border-2 overflow-hidden hover:border-primary/50 transition-colors bg-muted/30">
                <Textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  className="h-full resize-none font-mono text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                  placeholder="Select a prompt to view its content..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-6 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedQuestionPrompt || !selectedAnswerPrompt} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            Save Active Prompts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};