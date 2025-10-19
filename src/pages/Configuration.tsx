import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MessageSquare, Zap, Save, RotateCcw, Key, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { AccountSettings } from "@/components/AccountSettings";

const DEFAULT_QUESTION_PROMPT = `You are an expert at generating insightful evaluation questions. 
Generate 5 diverse questions based on the provided content that test understanding, analysis, and application of the material.

Guidelines:
- Create questions that are clear and specific
- Vary the difficulty level
- Focus on key concepts and practical applications
- Avoid yes/no questions
- Make questions thought-provoking`;

const DEFAULT_ANSWER_PROMPT = `You are a knowledgeable assistant providing accurate and helpful answers.
Answer the question based on the provided context clearly and concisely.

Guidelines:
- Be accurate and factual
- Provide context when necessary
- Keep responses focused and relevant
- Use examples when helpful
- Maintain a professional tone`;

const Configuration = () => {
  const { toast } = useToast();
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [answerPrompt, setAnswerPrompt] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [llmProvider, setLlmProvider] = useState("lovable");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedQuestionPrompt = localStorage.getItem("questionSystemPrompt");
    const savedAnswerPrompt = localStorage.getItem("answerSystemPrompt");
    const savedQuestionCount = localStorage.getItem("questionCount");
    const savedAutoSave = localStorage.getItem("autoSave");
    const savedDarkMode = localStorage.getItem("darkMode");
    const savedLlmProvider = localStorage.getItem("llmProvider");

    setQuestionPrompt(savedQuestionPrompt || DEFAULT_QUESTION_PROMPT);
    setAnswerPrompt(savedAnswerPrompt || DEFAULT_ANSWER_PROMPT);
    setQuestionCount(savedQuestionCount || "5");
    setAutoSave(savedAutoSave !== "false");
    setDarkMode(savedDarkMode !== "false");
    setLlmProvider(savedLlmProvider || "lovable");
  }, []);

  const handleSavePrompts = () => {
    localStorage.setItem("questionSystemPrompt", questionPrompt);
    localStorage.setItem("answerSystemPrompt", answerPrompt);
    toast({
      title: "Prompts saved",
      description: "Your system prompts have been updated successfully.",
    });
  };

  const handleResetQuestionPrompt = () => {
    setQuestionPrompt(DEFAULT_QUESTION_PROMPT);
    toast({
      title: "Prompt reset",
      description: "Question generation prompt has been reset to default.",
    });
  };

  const handleResetAnswerPrompt = () => {
    setAnswerPrompt(DEFAULT_ANSWER_PROMPT);
    toast({
      title: "Prompt reset",
      description: "Answer generation prompt has been reset to default.",
    });
  };

  const handleSaveGeneral = () => {
    localStorage.setItem("questionCount", questionCount);
    localStorage.setItem("autoSave", autoSave.toString());
    localStorage.setItem("darkMode", darkMode.toString());
    localStorage.setItem("llmProvider", llmProvider);
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleSaveApiKeys = async () => {
    setIsSavingKeys(true);
    try {
      const updates: Record<string, string> = {};
      
      if (openaiKey.trim()) {
        updates.OPENAI_API_KEY = openaiKey.trim();
      }
      
      if (anthropicKey.trim()) {
        updates.ANTHROPIC_API_KEY = anthropicKey.trim();
      }

      if (Object.keys(updates).length > 0) {
        toast({
          title: "Add API Keys to Edge Function Secrets",
          description: "Please add your API keys manually in the Lovable Cloud dashboard under Edge Functions → Secrets.",
        });
        
        // Clear input fields
        setOpenaiKey("");
        setAnthropicKey("");
      } else {
        toast({
          title: "No keys to save",
          description: "Please enter at least one API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSavingKeys(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Manage system prompts, preferences, and application settings
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account" className="gap-2">
              <UserIcon className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="prompts" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="llm" className="gap-2">
              <Key className="h-4 w-4" />
              LLM Provider
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Zap className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Generation Prompt</CardTitle>
                <CardDescription>
                  Customize how questions are generated from your playbook content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question-prompt">System Prompt</Label>
                  <Textarea
                    id="question-prompt"
                    value={questionPrompt}
                    onChange={(e) => setQuestionPrompt(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Enter your custom system prompt for question generation..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePrompts}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Prompt
                  </Button>
                  <Button variant="outline" onClick={handleResetQuestionPrompt}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Answer Generation Prompt</CardTitle>
                <CardDescription>
                  Customize how answers are generated for evaluation questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="answer-prompt">System Prompt</Label>
                  <Textarea
                    id="answer-prompt"
                    value={answerPrompt}
                    onChange={(e) => setAnswerPrompt(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Enter your custom system prompt for answer generation..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePrompts}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Prompt
                  </Button>
                  <Button variant="outline" onClick={handleResetAnswerPrompt}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="llm" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>LLM Provider Selection</CardTitle>
                <CardDescription>
                  Choose your preferred AI provider for question and answer generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="llm-provider">AI Provider</Label>
                  <Select value={llmProvider} onValueChange={setLlmProvider}>
                    <SelectTrigger id="llm-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lovable">Lovable AI (Recommended)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {llmProvider === "lovable" && "Uses Lovable AI Gateway with built-in API key"}
                    {llmProvider === "openai" && "Requires OpenAI API key"}
                    {llmProvider === "anthropic" && "Requires Anthropic API key"}
                  </p>
                </div>

                <Button onClick={handleSaveGeneral}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Provider Selection
                </Button>
              </CardContent>
            </Card>

            {llmProvider !== "lovable" && (
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Securely store your API keys for the selected provider
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {llmProvider === "openai" && (
                    <div className="space-y-2">
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Get your API key from{" "}
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          OpenAI Platform
                        </a>
                      </p>
                    </div>
                  )}

                  {llmProvider === "anthropic" && (
                    <div className="space-y-2">
                      <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                      <Input
                        id="anthropic-key"
                        type="password"
                        placeholder="sk-ant-..."
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Get your API key from{" "}
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Anthropic Console
                        </a>
                      </p>
                    </div>
                  )}

                  <Button onClick={handleSaveApiKeys} disabled={isSavingKeys}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingKeys ? "Saving..." : "Save API Key Securely"}
                  </Button>

                  <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                    <p className="font-medium">🔒 Manual Setup Required</p>
                    <p className="text-muted-foreground">
                      After entering your API key above, you must manually add it to your Lovable Cloud Edge Function Secrets:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                      <li>Click on "Backend" in the top menu</li>
                      <li>Go to "Edge Functions" → "Secrets"</li>
                      <li>Add a new secret with the key name (OPENAI_API_KEY or ANTHROPIC_API_KEY)</li>
                      <li>Paste your API key as the value</li>
                    </ol>
                    <p className="text-muted-foreground mt-2">
                      Your keys are stored securely and only accessible by your backend functions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure your application preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question-count">Default Question Count</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger id="question-count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questions</SelectItem>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Number of questions to generate by default
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto-save</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save changes as you type
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme throughout the application
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>

                <Button onClick={handleSaveGeneral}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced features and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">Custom API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    placeholder="https://api.example.com"
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Configure a custom endpoint for API calls (Coming soon)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-selection">AI Model</Label>
                  <Select defaultValue="gemini-flash" disabled>
                    <SelectTrigger id="model-selection">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select the AI model for generation (Coming soon)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Data Export</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled>
                      Export All Data
                    </Button>
                    <Button variant="outline" disabled>
                      Import Data
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export or import your playbooks and configurations (Coming soon)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions - proceed with caution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Clear All Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Delete all playbooks, questions, and settings
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Configuration;
