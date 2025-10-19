import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { History, Save, Plus } from "lucide-react";
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [createPromptType, setCreatePromptType] = useState<"question" | "answer">("question");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadPrompts();
      setHasChanges(false);
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
      setHasChanges(true);
      toast.success(`Loaded version ${version.version_number}`);
    }
  };

  const handleSave = async () => {
    if (selectedQuestionPrompt && selectedAnswerPrompt) {
      try {
        // Save to localStorage for backward compatibility
        localStorage.setItem('questionSystemPrompt', questionContent);
        localStorage.setItem('answerSystemPrompt', answerContent);
        
        // Create new versions if content has changed
        if (selectedQuestionVersion && questionContent !== selectedQuestionVersion.content) {
          const newVersionNumber = Math.max(...questionVersions.map(v => v.version_number)) + 1;
          const { error: versionError } = await supabase
            .from("prompt_versions")
            .insert({
              prompt_id: selectedQuestionPrompt.id,
              content: questionContent,
              version_number: newVersionNumber,
            });
          if (versionError) throw versionError;
        }

        if (selectedAnswerVersion && answerContent !== selectedAnswerVersion.content) {
          const newVersionNumber = Math.max(...answerVersions.map(v => v.version_number)) + 1;
          const { error: versionError } = await supabase
            .from("prompt_versions")
            .insert({
              prompt_id: selectedAnswerPrompt.id,
              content: answerContent,
              version_number: newVersionNumber,
            });
          if (versionError) throw versionError;
        }
        
        // Set as active prompts in database
        const { error: questionError } = await supabase
          .from("prompts")
          .update({ is_active: true })
          .eq("id", selectedQuestionPrompt.id);

        if (questionError) throw questionError;

        const { error: answerError } = await supabase
          .from("prompts")
          .update({ is_active: true })
          .eq("id", selectedAnswerPrompt.id);

        if (answerError) throw answerError;
        
        toast.success("System prompts activated successfully!");
        
        // Reload prompts and versions to update the UI
        await loadPrompts();
        if (selectedQuestionPrompt) {
          await loadVersions(selectedQuestionPrompt.id, "question");
        }
        if (selectedAnswerPrompt) {
          await loadVersions(selectedAnswerPrompt.id, "answer");
        }
        
        setHasChanges(false);
        onOpenChange(false);
      } catch (error: any) {
        toast.error(error.message || "Failed to save prompts");
      }
    }
  };

  const createPrompt = async () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) {
      toast.error("Please provide both name and content");
      return;
    }

    try {
      const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .insert({
          user_id: user?.id,
          name: newPromptName.trim(),
          type: createPromptType,
          is_active: true,
        })
        .select()
        .single();

      if (promptError) throw promptError;

      const { error: versionError } = await supabase
        .from("prompt_versions")
        .insert({
          prompt_id: prompt.id,
          content: newPromptContent,
          version_number: 1,
        });

      if (versionError) throw versionError;

      toast.success("Prompt created successfully!");
      setNewPromptName("");
      setNewPromptContent("");
      setIsCreateDialogOpen(false);
      loadPrompts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[600px] lg:w-[800px] p-0 gap-0 overflow-hidden flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="text-2xl">System Prompts Configuration</SheetTitle>
          </SheetHeader>

        <Tabs defaultValue="question" className="flex-1 flex flex-col overflow-hidden px-6">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="question">Question Generation</TabsTrigger>
            <TabsTrigger value="answer">Answer Generation</TabsTrigger>
          </TabsList>

          <TabsContent value="question" className="flex-1 flex flex-col gap-4 overflow-hidden mt-0 data-[state=active]:flex">
            {questionPrompts.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prompt Template</Label>
                  <Select
                    value={selectedQuestionPrompt?.id}
                    onValueChange={(value) => {
                      const prompt = questionPrompts.find(p => p.id === value);
                      setSelectedQuestionPrompt(prompt || null);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a prompt template" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {questionPrompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          {prompt.name}
                          {prompt.is_active && (
                            <Badge variant="default" className="ml-2 text-xs">Active</Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedQuestionPrompt && questionVersions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Version
                    </Label>
                    <Select
                      value={selectedQuestionVersion?.id}
                      onValueChange={(value) => handleVersionChange(value, "question")}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
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
                  <Label className="text-sm font-medium">Prompt Content</Label>
                  <Textarea
                    value={questionContent}
                    onChange={(e) => {
                      setQuestionContent(e.target.value);
                      setHasChanges(true);
                    }}
                    className="flex-1 resize-none font-mono text-base leading-relaxed"
                    placeholder="Select a prompt to view its content..."
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-muted-foreground">No question generation prompts available</p>
                <Button 
                  onClick={() => {
                    setCreatePromptType("question");
                    setIsCreateDialogOpen(true);
                  }}
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question Prompt
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="answer" className="flex-1 flex flex-col gap-4 overflow-hidden mt-0 data-[state=active]:flex">
            {answerPrompts.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prompt Template</Label>
                  <Select
                    value={selectedAnswerPrompt?.id}
                    onValueChange={(value) => {
                      const prompt = answerPrompts.find(p => p.id === value);
                      setSelectedAnswerPrompt(prompt || null);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a prompt template" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {answerPrompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          {prompt.name}
                          {prompt.is_active && (
                            <Badge variant="default" className="ml-2 text-xs">Active</Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAnswerPrompt && answerVersions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Version
                    </Label>
                    <Select
                      value={selectedAnswerVersion?.id}
                      onValueChange={(value) => handleVersionChange(value, "answer")}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
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
                  <Label className="text-sm font-medium">Prompt Content</Label>
                  <Textarea
                    value={answerContent}
                    onChange={(e) => {
                      setAnswerContent(e.target.value);
                      setHasChanges(true);
                    }}
                    className="flex-1 resize-none font-mono text-base leading-relaxed"
                    placeholder="Select a prompt to view its content..."
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-muted-foreground">No answer generation prompts available</p>
                <Button 
                  onClick={() => {
                    setCreatePromptType("answer");
                    setIsCreateDialogOpen(true);
                  }}
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Answer Prompt
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedQuestionPrompt || !selectedAnswerPrompt || !hasChanges} className="gap-2">
            <Save className="h-4 w-4" />
            Save Active Prompts
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {createPromptType === "question" ? "Question" : "Answer"} Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">Prompt Name</Label>
              <Input
                id="prompt-name"
                placeholder="e.g., Default, Creative, Technical"
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-content">Content</Label>
              <Textarea
                id="prompt-content"
                rows={10}
                placeholder="Enter your prompt content..."
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button onClick={createPrompt} className="w-full">
              Create Prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};