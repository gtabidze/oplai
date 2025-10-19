import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, History, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface PromptManagerProps {
  type: "question" | "answer";
  title: string;
  description: string;
}

export const PromptManager = ({ type, title, description }: PromptManagerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrompts();
    }
  }, [user, type]);

  useEffect(() => {
    if (selectedPrompt) {
      loadVersions(selectedPrompt.id);
      loadLatestVersion(selectedPrompt.id);
    }
  }, [selectedPrompt]);

  const loadPrompts = async () => {
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading prompts",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const typedData = (data || []) as Prompt[];
    setPrompts(typedData);
    
    // Auto-select active prompt or first prompt
    const activePrompt = typedData?.find(p => p.is_active);
    if (activePrompt) {
      setSelectedPrompt(activePrompt);
    } else if (typedData && typedData.length > 0) {
      setSelectedPrompt(typedData[0]);
    }
  };

  const loadVersions = async (promptId: string) => {
    const { data, error } = await supabase
      .from("prompt_versions")
      .select("*")
      .eq("prompt_id", promptId)
      .order("version_number", { ascending: false });

    if (error) {
      toast({
        title: "Error loading versions",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setVersions(data || []);
  };

  const loadLatestVersion = async (promptId: string) => {
    const { data, error } = await supabase
      .from("prompt_versions")
      .select("content")
      .eq("prompt_id", promptId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setPromptContent(data.content);
    }
  };

  const createPrompt = async () => {
    if (!newPromptName.trim() || !promptContent.trim()) {
      toast({
        title: "Validation error",
        description: "Please provide both name and content",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create prompt
      const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .insert({
          user_id: user?.id,
          name: newPromptName.trim(),
          type,
          is_active: prompts.length === 0, // First prompt is active by default
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // Create first version
      const { error: versionError } = await supabase
        .from("prompt_versions")
        .insert({
          prompt_id: prompt.id,
          content: promptContent,
          version_number: 1,
        });

      if (versionError) throw versionError;

      toast({
        title: "Prompt created",
        description: `${newPromptName} has been created successfully`,
      });

      setNewPromptName("");
      setPromptContent("");
      setIsCreateDialogOpen(false);
      loadPrompts();
    } catch (error: any) {
      toast({
        title: "Error creating prompt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrompt = async () => {
    if (!selectedPrompt || !promptContent.trim()) return;

    setIsLoading(true);

    try {
      // Get latest version number
      const { data: latestVersion } = await supabase
        .from("prompt_versions")
        .select("version_number")
        .eq("prompt_id", selectedPrompt.id)
        .order("version_number", { ascending: false })
        .limit(1)
        .single();

      const newVersionNumber = (latestVersion?.version_number || 0) + 1;

      // Create new version
      const { error } = await supabase
        .from("prompt_versions")
        .insert({
          prompt_id: selectedPrompt.id,
          content: promptContent,
          version_number: newVersionNumber,
        });

      if (error) throw error;

      toast({
        title: "Prompt updated",
        description: `Version ${newVersionNumber} created`,
      });

      loadVersions(selectedPrompt.id);
    } catch (error: any) {
      toast({
        title: "Error updating prompt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setActivePrompt = async (promptId: string) => {
    const { error } = await supabase
      .from("prompts")
      .update({ is_active: true })
      .eq("id", promptId);

    if (error) {
      toast({
        title: "Error setting active prompt",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Active prompt updated",
      description: "The selected prompt is now active",
    });

    loadPrompts();
  };

  const deletePrompt = async (promptId: string) => {
    const { error } = await supabase
      .from("prompts")
      .delete()
      .eq("id", promptId);

    if (error) {
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Prompt deleted",
      description: "The prompt has been removed",
    });

    if (selectedPrompt?.id === promptId) {
      setSelectedPrompt(null);
      setPromptContent("");
    }

    loadPrompts();
  };

  const loadVersion = (version: PromptVersion) => {
    setPromptContent(version.content);
    setIsVersionDialogOpen(false);
    toast({
      title: "Version loaded",
      description: `Version ${version.version_number} loaded into editor`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Prompt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Prompt</DialogTitle>
                <DialogDescription>
                  Create a new prompt template with a unique name
                </DialogDescription>
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
                    value={promptContent}
                    onChange={(e) => setPromptContent(e.target.value)}
                  />
                </div>
                <Button onClick={createPrompt} disabled={isLoading} className="w-full">
                  Create Prompt
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {prompts.length > 0 ? (
          <>
            <div className="space-y-2">
              <Label>Select Prompt</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedPrompt?.id}
                  onValueChange={(value) => {
                    const prompt = prompts.find(p => p.id === value);
                    setSelectedPrompt(prompt || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name}
                        {prompt.is_active && (
                          <Badge variant="secondary" className="ml-2">Active</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPrompt && (
                  <>
                    <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <History className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Version History</DialogTitle>
                          <DialogDescription>
                            View and restore previous versions
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {versions.map((version) => (
                            <div
                              key={version.id}
                              className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                              onClick={() => loadVersion(version)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">Version {version.version_number}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(version.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm mt-2 line-clamp-2">{version.content}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deletePrompt(selectedPrompt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {selectedPrompt && (
              <>
                <div className="space-y-2">
                  <Label>Prompt Content</Label>
                  <Textarea
                    rows={12}
                    value={promptContent}
                    onChange={(e) => setPromptContent(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={updatePrompt} disabled={isLoading}>
                    <Edit className="h-4 w-4 mr-2" />
                    Save as New Version
                  </Button>
                  {!selectedPrompt.is_active && (
                    <Button
                      variant="outline"
                      onClick={() => setActivePrompt(selectedPrompt.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Set as Active
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No prompts created yet. Click "New Prompt" to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
