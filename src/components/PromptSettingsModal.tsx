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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
      <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Evaluation System Prompts</DialogTitle>
        </DialogHeader>

        <ResizablePanelGroup direction="horizontal" className="flex-1 gap-4">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col gap-4 pr-2">
              <div className="space-y-2">
                <Label>Question Generation Prompt</Label>
                {questionPrompts.length > 0 && (
                  <Select
                    value={selectedQuestionPrompt?.id}
                    onValueChange={(value) => {
                      const prompt = questionPrompts.find(p => p.id === value);
                      setSelectedQuestionPrompt(prompt || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionPrompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          {prompt.name}
                          {prompt.is_active && (
                            <Badge variant="secondary" className="ml-2">Active</Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedQuestionPrompt && questionVersions.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Version
                  </Label>
                  <Select
                    value={selectedQuestionVersion?.id}
                    onValueChange={(value) => handleVersionChange(value, "question")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionVersions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          Version {version.version_number} - {new Date(version.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <Label>Prompt Content</Label>
                <Textarea
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  className="flex-1 resize-none font-mono text-sm"
                  placeholder="Select a prompt to view its content..."
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col gap-4 pl-2">
              <div className="space-y-2">
                <Label>Answer Generation Prompt</Label>
                {answerPrompts.length > 0 && (
                  <Select
                    value={selectedAnswerPrompt?.id}
                    onValueChange={(value) => {
                      const prompt = answerPrompts.find(p => p.id === value);
                      setSelectedAnswerPrompt(prompt || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {answerPrompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          {prompt.name}
                          {prompt.is_active && (
                            <Badge variant="secondary" className="ml-2">Active</Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedAnswerPrompt && answerVersions.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Version
                  </Label>
                  <Select
                    value={selectedAnswerVersion?.id}
                    onValueChange={(value) => handleVersionChange(value, "answer")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {answerVersions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          Version {version.version_number} - {new Date(version.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <Label>Prompt Content</Label>
                <Textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  className="flex-1 resize-none font-mono text-sm"
                  placeholder="Select a prompt to view its content..."
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedQuestionPrompt || !selectedAnswerPrompt}>
            <Save className="h-4 w-4 mr-2" />
            Save Active Prompts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};